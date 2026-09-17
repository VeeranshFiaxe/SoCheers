"use client";

/* The Insights page in the panel: its three lists and its fixed frame. */
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_ENTRIES, DEFAULT_INSIGHTS } from "@/lib/cms/defaults";
import type { Entry, EntryType, InsightsSettings } from "@/lib/cms/types";
import { api } from "./api";
import { TemplatePicker } from "./PostEditor";
import { Button, Empty, Field, Input, Spinner, TextArea, Toggle, useConfirm, useToast, useUnsavedWarning } from "./ui";

type Payload = { settings: InsightsSettings | null; settingsUpdatedAt: number | null; seeded: boolean; entries: Entry[] };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export type InsightsTab = "blog" | "whitepaper" | "report" | "page";

export default function InsightsAdmin({ tab, go }: { tab: InsightsTab; go: (hash: string) => void }) {
  const toast = useToast();
  const [data, setData] = useState<Payload | null>(null);

  const load = useCallback(async () => {
    try {
      let d = await api<Payload>("GET", "/insights");
      if (!d.seeded) {
        /* first visit: start from the page as it ships */
        await api("POST", "/insights/seed", { settings: DEFAULT_INSIGHTS, entries: DEFAULT_ENTRIES });
        d = await api<Payload>("GET", "/insights");
      }
      setData(d);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const tabs: [InsightsTab, string][] = [["blog", "Blog posts"], ["whitepaper", "White papers"], ["report", "Reports"], ["page", "Page text & tabs"]];

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Insights</h1>
          <p className="adm-muted">Everything on <a className="adm-link" href="/insights" target="_blank" rel="noopener">/insights ↗</a>. Changes go live as soon as they are saved.</p>
        </div>
      </header>
      <nav className="adm-tabs">
        {tabs.map(([id, label]) => (
          <a key={id} href={`#/insights/${id}`} className={tab === id ? "is-on" : ""}>
            {label}
            {data && id !== "page" && <span className="adm-count">{data.entries.filter((e) => e.type === id).length}</span>}
          </a>
        ))}
      </nav>
      {!data ? <Spinner /> : tab === "page" ? (
        <PageSettings initial={data.settings ?? DEFAULT_INSIGHTS} updatedAt={data.settingsUpdatedAt} onSaved={load} />
      ) : (
        <EntryList type={tab} entries={data.entries.filter((e) => e.type === tab)} reload={load} go={go} />
      )}
    </div>
  );
}

function EntryList({ type, entries, reload, go }: { type: EntryType; entries: Entry[]; reload: () => void; go: (h: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [order, setOrder] = useState(entries);
  const [dragId, setDragId] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  useEffect(() => setOrder(entries), [entries]);

  const blog = type === "blog";
  const shown = blog ? [...order].sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0)) : order;
  const editHash = (e: Entry) => (blog ? `#/post/${e.id}` : `#/paper/${type}/${e.id}`);

  const setStatus = async (e: Entry, status: Entry["status"]) => {
    try {
      const full = await api<{ entry: Entry }>("GET", `/entries/${e.id}`);
      await api("PUT", `/entries/${e.id}`, { ...full.entry, status, updatedAt: full.entry.updated_at });
      toast(status === "published" ? "Now live." : "Taken off the site.");
      reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const del = async (e: Entry) => {
    if (!(await confirm({ title: `Delete “${e.title}”?`, body: "It comes off the site straight away. This can't be undone.", action: "Delete", danger: true }))) return;
    await api("DELETE", `/entries/${e.id}`).then(() => { toast("Deleted."); reload(); }).catch((err) => toast((err as Error).message, "error"));
  };

  const saveOrder = async (next: Entry[]) => {
    setOrder(next);
    await api("POST", "/insights/reorder", { ids: next.map((e) => e.id) }).catch((err) => toast((err as Error).message, "error"));
  };

  return (
    <>
      <div className="adm-toolbar">
        <p className="adm-muted adm-small">
          {blog ? "Newest first on the site. Only live posts show." : "Drag to set the order they appear in. Only entries switched on show."}
        </p>
        <Button variant="primary" onClick={() => (blog ? setPicking(true) : go(`#/paper/${type}/new`))}>
          + New {blog ? "post" : type === "report" ? "report" : "white paper"}
        </Button>
      </div>
      {shown.length === 0 ? <Empty>Nothing here yet.</Empty> : (
        <ul className="adm-list">
          {shown.map((e) => (
            <li
              key={e.id}
              className={`adm-list__row${dragId === e.id ? " is-dragging" : ""}`}
              draggable={!blog}
              onDragStart={() => setDragId(e.id!)}
              onDragEnd={() => { if (dragId !== null) saveOrder(order); setDragId(null); }}
              onDragOver={(ev) => {
                if (blog || dragId === null || dragId === e.id) return;
                ev.preventDefault();
                const from = order.findIndex((x) => x.id === dragId);
                const to = order.findIndex((x) => x.id === e.id);
                const next = [...order];
                next.splice(to, 0, next.splice(from, 1)[0]);
                setOrder(next);
              }}
            >
              {!blog && <span className="adm-grip" aria-hidden="true">⋮⋮</span>}
              {blog && (e.cover ? <img className="adm-thumb" src={e.cover} alt="" /> : <span className="adm-thumb" />)}
              <a className="adm-list__main" href={editHash(e)}>
                <strong>{e.title}</strong>
                <span className="adm-muted adm-small">
                  {blog && `/insights/${e.slug} · `}
                  {e.status === "published" && e.published_at ? `Published ${dateFmt.format(e.published_at)}` : "Draft"}
                  {e.updated_at ? ` · Edited ${dateFmt.format(e.updated_at)}` : ""}
                </span>
              </a>
              <span className={`adm-pill ${e.status === "published" ? "is-live" : ""}`}>{e.status === "published" ? "Live" : "Draft"}</span>
              <div className="adm-row">
                {blog && e.status === "published" && <a className="adm-btn is-ghost" href={`/insights/${e.slug}`} target="_blank" rel="noopener">View ↗</a>}
                <a className="adm-btn" href={editHash(e)}>Edit</a>
                <Button variant="ghost" onClick={() => setStatus(e, e.status === "published" ? "draft" : "published")}>
                  {e.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" onClick={() => del(e)} aria-label={`Delete ${e.title}`}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {picking && <TemplatePicker onClose={() => setPicking(false)} onPick={(t) => go(`#/post/new/${t}`)} />}
    </>
  );
}

function PageSettings({ initial, updatedAt, onSaved }: { initial: InsightsSettings; updatedAt: number | null; onSaved: () => void }) {
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedWarning(dirty);
  const put = (p: Partial<InsightsSettings>) => { setS({ ...s, ...p }); setDirty(true); };

  const save = async () => {
    setBusy(true);
    try {
      await api("PUT", "/insights/settings", { settings: s, updatedAt });
      setDirty(false);
      toast("Saved - the page is updated.");
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-stack">
      <div className="adm-toolbar">
        <p className="adm-muted adm-small">The page layout stays the same - this is the words and which tabs are open.</p>
        <Button variant="primary" onClick={save} busy={busy} disabled={!dirty}>Save</Button>
      </div>
      <div className="adm-two">
        <section className="adm-card adm-stack">
          <h2 className="adm-h3">Top of the page</h2>
          <Field label="Small label"><Input value={s.hero.eyebrow} maxLength={80} onChange={(e) => put({ hero: { ...s.hero, eyebrow: e.target.value } })} /></Field>
          <Field label="Headline, first part"><Input value={s.hero.line1} maxLength={120} onChange={(e) => put({ hero: { ...s.hero, line1: e.target.value } })} /></Field>
          <Field label="Headline, second part" hint="Set in italics after the first part. Include a space at the end of the first part if they need one.">
            <Input value={s.hero.line2} maxLength={120} onChange={(e) => put({ hero: { ...s.hero, line2: e.target.value } })} />
          </Field>
          <Field label="Intro"><TextArea value={s.hero.lede} maxLength={600} onChange={(e) => put({ hero: { ...s.hero, lede: e.target.value } })} /></Field>

          <h2 className="adm-h3">Tabs</h2>
          {s.tabs.map((t, i) => (
            <div className="adm-row adm-row--wrap" key={t.id}>
              <Input value={t.label} maxLength={40} onChange={(e) => put({ tabs: s.tabs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} aria-label={`${t.id} tab label`} />
              <Toggle checked={t.live} onChange={(live) => put({ tabs: s.tabs.map((x, j) => (j === i ? { ...x, live } : x)) })} label="Open" />
              <label className="adm-radio">
                <input type="radio" name="defaultTab" checked={s.defaultTab === t.id} onChange={() => put({ defaultTab: t.id })} disabled={!t.live} />
                Opens first
              </label>
            </div>
          ))}
          <Field label="Hover text on closed tabs"><Input value={s.soonLabel} maxLength={40} onChange={(e) => put({ soonLabel: e.target.value })} /></Field>
        </section>

        <section className="adm-card adm-stack">
          <h2 className="adm-h3">Topics</h2>
          <Field label="Label above the topics"><Input value={s.topicsTag} maxLength={80} onChange={(e) => put({ topicsTag: e.target.value })} /></Field>
          {s.topics.map((t, i) => (
            <div className="adm-topic" key={i}>
              <span className="adm-muted adm-small">{String(i + 1).padStart(2, "0")}</span>
              <div className="adm-stack">
                <Input value={t.name} placeholder="Topic" maxLength={120} onChange={(e) => put({ topics: s.topics.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <TextArea rows={2} value={t.copy} placeholder="One line about it" maxLength={400} onChange={(e) => put({ topics: s.topics.map((x, j) => (j === i ? { ...x, copy: e.target.value } : x)) })} />
              </div>
              <div className="adm-col">
                <Button variant="ghost" disabled={i === 0} onClick={() => { const a = [...s.topics]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; put({ topics: a }); }} aria-label="Move up">↑</Button>
                <Button variant="ghost" disabled={i === s.topics.length - 1} onClick={() => { const a = [...s.topics]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; put({ topics: a }); }} aria-label="Move down">↓</Button>
                <Button variant="ghost" onClick={() => put({ topics: s.topics.filter((_, j) => j !== i) })} aria-label="Remove">×</Button>
              </div>
            </div>
          ))}
          {s.topics.length < 24 && <Button onClick={() => put({ topics: [...s.topics, { name: "", copy: "" }] })}>+ Add topic</Button>}
        </section>
      </div>
    </div>
  );
}
