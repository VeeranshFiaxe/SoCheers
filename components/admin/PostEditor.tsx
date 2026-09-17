"use client";

/* Writing and editing one blog post. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Blocks } from "@/components/cms/Blocks";
import type { Block, BlogData, Entry } from "@/lib/cms/types";
import { api, ApiError, slugify } from "./api";
import BlockEditor, { BlockPalette } from "./editor/BlockEditor";
import { TEMPLATES, cloneBlocks, type Template } from "./editor/catalog";
import { Button, Empty, Field, ImageField, Input, Modal, Spinner, TextArea, useConfirm, useToast, useUnsavedWarning } from "./ui";

const blankPost = (blocks: Block[]): Entry => ({
  type: "blog", slug: "", title: "", excerpt: "", cover: "", cover_alt: "", author: "", tags: [], status: "draft",
  data: { blocks, seoTitle: "", seoDescription: "" },
});

type Saved = { id: number; updatedAt: number };

export default function PostEditor({ id, template, go }: { id: number | null; template?: string; go: (hash: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [post, setPost] = useState<Entry | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [side, setSide] = useState<"blocks" | "settings">("blocks");
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const history = useRef<{ past: Block[][]; future: Block[][]; timer?: ReturnType<typeof setTimeout>; base?: Block[] }>({ past: [], future: [] });
  useUnsavedWarning(dirty);

  useEffect(() => {
    if (id === null) {
      (async () => {
        const premade = TEMPLATES.find((t) => t.id === template);
        let blocks = premade ? premade.blocks() : null;
        if (!blocks && template?.startsWith("custom-")) {
          const d = await api<{ templates: { id: number; blocks: Block[] }[] }>("GET", "/templates").catch(() => null);
          const t = d?.templates.find((x) => `custom-${x.id}` === template);
          if (t) blocks = cloneBlocks(t.blocks);
        }
        setPost(blankPost(blocks ?? TEMPLATES[0].blocks()));
      })();
      return;
    }
    api<{ entry: Entry }>("GET", `/entries/${id}`)
      .then((d) => {
        setPost(d.entry);
        setSaved({ id: d.entry.id!, updatedAt: d.entry.updated_at! });
        setSlugTouched(true);
      })
      .catch((e) => toast((e as Error).message, "error"));
  }, [id, template, toast]);

  const data = (post?.data ?? { blocks: [], seoTitle: "", seoDescription: "" }) as BlogData;

  const patch = useCallback((p: Partial<Entry>) => {
    setPost((cur) => (cur ? { ...cur, ...p } : cur));
    setDirty(true);
  }, []);

  const patchData = useCallback((p: Partial<BlogData>) => {
    setPost((cur) => (cur ? { ...cur, data: { ...(cur.data as BlogData), ...p } } : cur));
    setDirty(true);
  }, []);

  /* undo: a snapshot of the blocks, taken once typing pauses */
  const onBlocks = useCallback((blocks: Block[]) => {
    const h = history.current;
    setPost((cur) => {
      if (!cur) return cur;
      if (!h.base) h.base = (cur.data as BlogData).blocks;
      return { ...cur, data: { ...(cur.data as BlogData), blocks } };
    });
    clearTimeout(h.timer);
    h.timer = setTimeout(() => {
      if (h.base) { h.past.push(h.base); if (h.past.length > 100) h.past.shift(); h.future = []; h.base = undefined; }
    }, 600);
    setDirty(true);
  }, []);

  const undo = () => {
    const h = history.current;
    clearTimeout(h.timer);
    if (h.base) { h.past.push(h.base); h.base = undefined; }
    const prev = h.past.pop();
    if (!prev || !post) return;
    h.future.push((post.data as BlogData).blocks);
    patchData({ blocks: prev });
  };
  const redo = () => {
    const h = history.current;
    const next = h.future.pop();
    if (!next || !post) return;
    h.past.push((post.data as BlogData).blocks);
    patchData({ blocks: next });
  };

  const save = async (status?: "draft" | "published") => {
    if (!post) return;
    const body = { ...post, status: status ?? post.status, updatedAt: saved?.updatedAt };
    if (!body.title.trim()) { toast("Add a title first.", "error"); return; }
    if (!body.slug) body.slug = slugify(body.title);
    setBusy(status === "published" ? "publish" : "save");
    try {
      if (saved) {
        const r = await api<{ updatedAt: number }>("PUT", `/entries/${saved.id}`, body);
        setSaved({ id: saved.id, updatedAt: r.updatedAt });
      } else {
        const r = await api<{ id: number; updatedAt: number }>("POST", "/entries", body);
        setSaved({ id: r.id, updatedAt: r.updatedAt });
        history.current = { past: [], future: [] };
        window.history.replaceState(null, "", `#/post/${r.id}`);
      }
      setPost({ ...body, published_at: body.status === "published" ? (post.published_at ?? Date.now()) : post.published_at });
      setDirty(false);
      toast(body.status === "published" ? (post.status === "published" ? "Saved and live." : "Published.") : post.status === "published" ? "Unpublished - saved as a draft." : "Draft saved.");
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(null);
    }
  };

  /* keyboard: save, undo, redo */
  const saveRef = useRef(save);
  saveRef.current = save;
  const undoRef = useRef(undo);
  undoRef.current = undo;
  const redoRef = useRef(redo);
  redoRef.current = redo;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); return; }
      const inText = (e.target as HTMLElement).closest?.("input, textarea, [contenteditable]");
      if (inText) return;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undoRef.current(); }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redoRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const del = async () => {
    if (!saved) { go("#/insights/blog"); return; }
    if (!(await confirm({ title: "Delete this post?", body: "It comes off the site straight away. This can't be undone.", action: "Delete post", danger: true }))) return;
    try {
      await api("DELETE", `/entries/${saved.id}`);
      setDirty(false);
      toast("Post deleted.");
      go("#/insights/blog");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const leave = async () => {
    if (dirty && !(await confirm({ title: "Leave without saving?", body: "Your changes since the last save will be lost.", action: "Leave", danger: true }))) return;
    setDirty(false);
    go("#/insights/blog");
  };

  if (!post) return <Spinner />;

  const live = post.status === "published";
  return (
    <div className="pe">
      <div className="pe-bar">
        <button type="button" className="adm-back" onClick={leave}>← Blog posts</button>
        <span className={`adm-pill ${live ? "is-live" : ""}`}>{live ? "Live" : "Draft"}</span>
        <span className="adm-muted adm-small">{busy ? "Saving…" : dirty ? "Unsaved changes" : saved ? "All changes saved" : "Not saved yet"}</span>
        <span className="pe-bar__spacer" />
        <Button variant="ghost" onClick={undo} title="Undo (Ctrl+Z)" aria-label="Undo">↶</Button>
        <Button variant="ghost" onClick={redo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</Button>
        <Button variant="ghost" onClick={() => setPreview((p) => !p)}>{preview ? "Edit" : "Preview"}</Button>
        {live && saved && <a className="adm-btn is-ghost" href={`/insights/${post.slug}`} target="_blank" rel="noopener">View live ↗</a>}
        {live ? (
          <>
            <Button onClick={() => save("draft")} busy={busy === "save"}>Unpublish</Button>
            <Button variant="primary" onClick={() => save("published")} busy={busy === "publish"}>Save changes</Button>
          </>
        ) : (
          <>
            <Button onClick={() => save("draft")} busy={busy === "save"}>Save draft</Button>
            <Button variant="primary" onClick={() => save("published")} busy={busy === "publish"}>Publish</Button>
          </>
        )}
      </div>

      <div className="pe-main">
        <div className="pe-doc">
          {preview ? (
            <div className="pe-preview bl-page">
              {post.tags[0] && <span className="tag">{post.tags.join(" · ")}</span>}
              <h1 className="bp-title">{post.title || "Untitled"}</h1>
              {post.excerpt && <p className="bp-excerpt">{post.excerpt}</p>}
              {post.cover && <img className="pe-preview__cover" src={post.cover} alt={post.cover_alt} />}
              <Blocks blocks={data.blocks} />
            </div>
          ) : (
            <>
              <TextArea
                className="pe-title"
                placeholder="Post title"
                value={post.title}
                rows={1}
                maxLength={200}
                onChange={(e) => {
                  const title = e.target.value.replace(/\n/g, " ");
                  patch(slugTouched ? { title } : { title, slug: slugify(title) });
                }}
              />
              <TextArea
                className="pe-excerpt"
                placeholder="A one or two line summary - shown on the Insights page and in link previews"
                value={post.excerpt}
                rows={2}
                maxLength={1000}
                onChange={(e) => patch({ excerpt: e.target.value })}
              />
              <BlockEditor blocks={data.blocks} onChange={onBlocks} />
            </>
          )}
        </div>

        <aside className="pe-side">
          <div className="adm-seg adm-seg--full">
            <button type="button" className={side === "blocks" ? "is-on" : ""} onClick={() => setSide("blocks")}>Blocks</button>
            <button type="button" className={side === "settings" ? "is-on" : ""} onClick={() => setSide("settings")}>Post settings</button>
          </div>
          {side === "blocks" ? (
            <>
              <BlockPalette onAdd={(c) => onBlocks([...data.blocks, c.make()])} />
              <div className="pe-side__foot">
                <Button variant="ghost" onClick={() => setSaveTemplate(true)}>Save layout as template</Button>
              </div>
            </>
          ) : (
            <div className="adm-stack">
              <Field label="Web address" hint={<>socheers.net/insights/<strong>{post.slug || "…"}</strong></>}>
                <Input
                  value={post.slug}
                  maxLength={80}
                  onChange={(e) => { setSlugTouched(true); patch({ slug: slugify(e.target.value) || e.target.value.toLowerCase() }); }}
                />
              </Field>
              <ImageField
                label="Cover picture"
                value={post.cover}
                onChange={(cover) => patch({ cover })}
                alt={post.cover_alt}
                onAlt={(cover_alt) => patch({ cover_alt })}
                hint="Shown on the post card, at the top of the post and in link previews."
              />
              <Field label="Author">
                <Input value={post.author} maxLength={120} onChange={(e) => patch({ author: e.target.value })} placeholder="e.g. The SoCheers team" />
              </Field>
              <Field label="Tags" hint="Separate with commas. The first shows on the card.">
                <Input
                  defaultValue={post.tags.join(", ")}
                  onBlur={(e) => patch({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12) })}
                  placeholder="Influencer marketing, Strategy"
                />
              </Field>
              <details className="adm-details">
                <summary>Search and sharing</summary>
                <Field label="Title for search results" hint={`${(data.seoTitle || post.title).length}/60 - leave empty to use the post title`}>
                  <Input value={data.seoTitle} maxLength={200} onChange={(e) => patchData({ seoTitle: e.target.value })} />
                </Field>
                <Field label="Description for search results" hint={`${(data.seoDescription || post.excerpt).length}/160 - leave empty to use the summary`}>
                  <TextArea value={data.seoDescription} maxLength={320} onChange={(e) => patchData({ seoDescription: e.target.value })} />
                </Field>
              </details>
              <div className="adm-danger-zone">
                <Button variant="danger" onClick={del}>{saved ? "Delete post" : "Discard"}</Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {saveTemplate && <SaveTemplate blocks={data.blocks} onClose={() => setSaveTemplate(false)} />}
    </div>
  );
}

function SaveTemplate({ blocks, onClose }: { blocks: Block[]; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Save layout as template" onClose={onClose} small>
      <p className="adm-muted">Saves the blocks on this page, with their text and pictures, so new posts can start from it.</p>
      <form
        className="adm-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("POST", "/templates", { name, blocks });
            toast("Template saved.");
            onClose();
          } catch (err) {
            toast((err as Error).message, "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Template name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></Field>
        <div className="adm-row adm-row--end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" busy={busy}>Save template</Button>
        </div>
      </form>
    </Modal>
  );
}

/* Choosing how a new post starts. */
export function TemplatePicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [custom, setCustom] = useState<{ id: number; name: string; blocks: Block[] }[] | null>(null);
  const load = useCallback(() => {
    api<{ templates: { id: number; name: string; blocks: Block[] }[] }>("GET", "/templates").then((d) => setCustom(d.templates)).catch(() => setCustom([]));
  }, []);
  useEffect(load, [load]);

  const card = (t: Pick<Template, "id" | "name" | "description">, count: number, onDelete?: () => void) => (
    <div key={t.id} className="tp-card">
      <button type="button" className="tp-card__main" onClick={() => onPick(t.id)}>
        <span className="tp-card__art" aria-hidden="true">{Array.from({ length: Math.min(count, 7) }, (_, i) => <i key={i} />)}</span>
        <strong>{t.name}</strong>
        <span className="adm-muted adm-small">{t.description}</span>
      </button>
      {onDelete && <button type="button" className="tp-card__delete" onClick={onDelete} aria-label={`Delete template ${t.name}`}>×</button>}
    </div>
  );

  return (
    <Modal title="Start a new post" onClose={onClose} wide>
      <h3 className="adm-h3">Ready-made layouts</h3>
      <div className="tp-grid">{TEMPLATES.map((t) => card(t, t.blocks().length))}</div>
      <h3 className="adm-h3">Your saved layouts</h3>
      {custom === null ? <Spinner /> : custom.length === 0 ? (
        <Empty>None yet. In the editor, use “Save layout as template”.</Empty>
      ) : (
        <div className="tp-grid">
          {custom.map((t) => card(
            { id: `custom-${t.id}`, name: t.name, description: `${t.blocks.length} blocks` },
            t.blocks.length,
            async () => {
              if (!(await confirm({ title: `Delete “${t.name}”?`, body: "Posts made from it are not affected.", action: "Delete", danger: true }))) return;
              await api("DELETE", `/templates/${t.id}`).catch((e) => toast((e as Error).message, "error"));
              load();
            },
          ))}
        </div>
      )}
    </Modal>
  );
}
