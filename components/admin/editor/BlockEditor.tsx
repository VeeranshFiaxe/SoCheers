"use client";

/* ============================================================
   THE POST EDITOR'S CANVAS - in the spirit of Plate.

   - Every block has a handle in the gutter: drag it to move the block,
     click it for Turn into / Duplicate / Move / Delete.
   - "+" in the gutter, or "/" at the start of an empty line, opens the
     block menu. Blocks can also be dragged in from the side panel.
   - Enter starts a new paragraph, Backspace at the start of an empty
     one removes it, arrow keys walk between blocks.
   - Markdown as you type: "## " heading, "### " subheading, "> " quote,
     "- " list, "1. " numbered list, "!! " callout, "---" divider.
   - Select text for the formatting toolbar (bold, italic, link...).
   ============================================================ */
import {
  Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type DragEvent, type KeyboardEvent, type ReactNode,
} from "react";
import type { Block, BlockType, Rich } from "@/lib/cms/types";
import { videoEmbed } from "@/components/cms/Blocks";
import { Button, ImageLibrary } from "../ui";
import { uid } from "../api";
import { CATALOG, TEXT_TYPES, catalogFor, cloneBlocks, turnInto, type CatalogItem } from "./catalog";
import FloatingToolbar from "./FloatingToolbar";
import { RichEditable, type RichHandle } from "./RichEditable";
import { concatRuns, dropPrefix, plainText } from "./rich";

const NEW_BLOCK = "application/x-sc-new-block";
const MOVE_BLOCK = "application/x-sc-move-block";

type Focus = { key: string; at: "start" | "end" | number };

const SHORTCUTS: { re: RegExp; type: BlockType }[] = [
  { re: /^#{1,2} /, type: "h2" },
  { re: /^### /, type: "h3" },
  { re: /^> /, type: "quote" },
  { re: /^[-*] /, type: "ul" },
  { re: /^1[.)] /, type: "ol" },
  { re: /^!! /, type: "callout" },
];

export default function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  const refs = useRef(new Map<string, RichHandle>());
  const pending = useRef<Focus | null>(null);
  const [menu, setMenu] = useState<{ id: string; query: string; replace: boolean } | null>(null);
  const [blockMenu, setBlockMenu] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ index: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  /* the latest blocks, for handlers that fire between renders */
  const live = useRef(blocks);
  live.current = blocks;

  useLayoutEffect(() => {
    const f = pending.current;
    if (!f) return;
    const h = refs.current.get(f.key);
    if (h) { h.focus(f.at); pending.current = null; }
  });

  const focusKey = (b: Block) => (b.type === "ul" || b.type === "ol" ? `${b.id}:0` : b.id);
  const lastKey = (b: Block) => (b.type === "ul" || b.type === "ol" ? `${b.id}:${b.items.length - 1}` : b.id);

  /* live.current moves with every change, not just every render, so two
     edits in one handler build on each other instead of the second
     undoing the first */
  const set = useCallback((next: Block[]) => { live.current = next; onChange(next); }, [onChange]);
  const update = useCallback((id: string, patch: Partial<Block>) => {
    set(live.current.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  }, [set]);

  const insertAt = (index: number, b: Block, focus = true) => {
    const next = [...live.current];
    next.splice(index, 0, b);
    set(next);
    if (focus) pending.current = { key: focusKey(b), at: "start" };
  };

  const remove = (id: string, focusPrev = true) => {
    const i = live.current.findIndex((b) => b.id === id);
    const next = live.current.filter((b) => b.id !== id);
    if (!next.length) next.push(catalogFor("p").make());
    set(next);
    const prev = next[Math.max(0, i - 1)];
    if (focusPrev && prev) pending.current = { key: lastKey(prev), at: "end" };
  };

  const move = (from: number, to: number) => {
    const next = [...live.current];
    const [b] = next.splice(from, 1);
    next.splice(to > from ? to - 1 : to, 0, b);
    set(next);
  };

  const moveBy = (id: string, delta: number) => {
    const i = live.current.findIndex((b) => b.id === id);
    const j = i + delta;
    if (j < 0 || j >= live.current.length) return;
    const next = [...live.current];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  const duplicate = (id: string) => {
    const i = live.current.findIndex((b) => b.id === id);
    insertAt(i + 1, cloneBlocks([live.current[i]])[0], false);
  };

  const neighbour = (id: string, dir: "up" | "down") => {
    const i = live.current.findIndex((b) => b.id === id);
    const n = live.current[dir === "up" ? i - 1 : i + 1];
    if (!n) return;
    const key = dir === "up" ? lastKey(n) : focusKey(n);
    const h = refs.current.get(key);
    if (h) h.focus(dir === "up" ? "end" : "start");
  };

  /* choosing from the "/" or "+" menu */
  const choose = (item: CatalogItem) => {
    if (!menu) return;
    const i = live.current.findIndex((b) => b.id === menu.id);
    const made = item.make();
    if (menu.replace) {
      const next = [...live.current];
      next[i] = { ...made, id: live.current[i].id };
      if (item.type === "divider") next.splice(i + 1, 0, catalogFor("p").make());
      set(next);
      pending.current = { key: focusKey(next[item.type === "divider" ? i + 1 : i]), at: "start" };
    } else {
      insertAt(i + 1, made);
    }
    setMenu(null);
  };

  /* ---- keyboard, text blocks ---- */

  const textHandlers = (b: Block & { text: Rich }, index: number) => ({
    onSplit: ({ before, after }: { before: Rich; after: Rich }) => {
      const next = [...live.current];
      next[index] = { ...b, text: before } as Block;
      const para: Block = { id: uid(), type: "p", text: after, align: "left" };
      next.splice(index + 1, 0, para);
      set(next);
      pending.current = { key: para.id, at: "start" };
      setMenu(null);
    },
    onBackspaceAtStart: (current: Rich) => {
      if (b.type !== "p") {
        set(live.current.map((x) => (x.id === b.id ? turnInto({ ...b, text: current } as Block, "p") : x)));
        pending.current = { key: b.id, at: "start" };
        return;
      }
      const prev = live.current[index - 1];
      if (!prev) return;
      if (!plainText(current)) { remove(b.id); return; }
      if (TEXT_TYPES.includes(prev.type)) {
        const p = prev as Block & { text: Rich };
        const at = plainText(p.text).length;
        const next = live.current.filter((x) => x.id !== b.id).map((x) => (x.id === p.id ? ({ ...p, text: concatRuns(p.text, current) } as Block) : x));
        set(next);
        pending.current = { key: p.id, at };
      }
    },
    onArrowOut: (dir: "up" | "down") => neighbour(b.id, dir),
  });

  const onParagraphChange = (b: Block & { type: "p" }, text: Rich) => {
    const s = plainText(text);
    if (s === "---") {
      const i = live.current.findIndex((x) => x.id === b.id);
      const next = [...live.current];
      const para = catalogFor("p").make();
      next.splice(i, 1, { id: b.id, type: "divider" }, para);
      set(next);
      pending.current = { key: para.id, at: "start" };
      return;
    }
    for (const { re, type } of SHORTCUTS) {
      const m = s.match(re);
      if (m) {
        const rest = dropPrefix(text, m[0].length);
        set(live.current.map((x) => (x.id === b.id ? turnInto({ ...b, text: rest }, type) : x)));
        pending.current = { key: type === "ul" || type === "ol" ? `${b.id}:0` : b.id, at: "start" };
        return;
      }
    }
    if (/^\/[a-z0-9 ]{0,20}$/i.test(s)) setMenu({ id: b.id, query: s.slice(1), replace: true });
    else if (menu?.id === b.id) setMenu(null);
    update(b.id, { text });
  };

  /* ---- drag and drop ---- */

  const onRowDragOver = (e: DragEvent, index: number) => {
    const types = e.dataTransfer.types;
    if (!types.includes(NEW_BLOCK) && !types.includes(MOVE_BLOCK)) return;
    e.preventDefault();
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const after = e.clientY > box.top + box.height / 2;
    const at = index + (after ? 1 : 0);
    if (drop?.index !== at) setDrop({ index: at });
  };

  const onDrop = (e: DragEvent) => {
    if (!drop) return;
    e.preventDefault();
    const moving = e.dataTransfer.getData(MOVE_BLOCK);
    const adding = e.dataTransfer.getData(NEW_BLOCK);
    if (moving) {
      const from = live.current.findIndex((b) => b.id === moving);
      if (from >= 0 && drop.index !== from && drop.index !== from + 1) move(from, drop.index);
    } else if (adding) {
      const item = CATALOG.find((c) => c.type === adding);
      if (item) insertAt(drop.index, item.make());
    }
    setDrop(null);
    setDragging(null);
  };

  return (
    <div className="be">
      <FloatingToolbar />
      <div
        className="be-canvas"
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrop(null); }}
        onDrop={onDrop}
        onDragOver={(e) => { if (e.dataTransfer.types.includes(NEW_BLOCK) || e.dataTransfer.types.includes(MOVE_BLOCK)) e.preventDefault(); }}
      >
        {blocks.map((b, index) => (
          <Fragment key={b.id}>
            {drop?.index === index && <div className="be-drop" />}
            <div
              className={`be-row be-row--${b.type}${dragging === b.id ? " is-dragging" : ""}`}
              onDragOver={(e) => onRowDragOver(e, index)}
            >
              <div className="be-gutter">
                <button
                  type="button"
                  className="be-handle"
                  title="Add a block below"
                  aria-label="Add a block below"
                  onClick={() => setMenu({ id: b.id, query: "", replace: false })}
                >
                  +
                </button>
                <button
                  type="button"
                  className="be-handle"
                  draggable
                  title="Drag to move · click for options"
                  aria-label="Block options"
                  aria-haspopup="menu"
                  onDragStart={(e) => {
                    e.dataTransfer.setData(MOVE_BLOCK, b.id);
                    e.dataTransfer.effectAllowed = "move";
                    const row = (e.currentTarget as HTMLElement).closest(".be-row");
                    if (row) e.dataTransfer.setDragImage(row, 20, 20);
                    setDragging(b.id);
                  }}
                  onDragEnd={() => { setDragging(null); setDrop(null); }}
                  onClick={() => setBlockMenu(blockMenu === b.id ? null : b.id)}
                >
                  ⋮⋮
                </button>
                {blockMenu === b.id && (
                  <BlockMenu
                    block={b}
                    first={index === 0}
                    last={index === blocks.length - 1}
                    onClose={() => setBlockMenu(null)}
                    onTurn={(type) => { set(live.current.map((x) => (x.id === b.id ? turnInto(x, type) : x))); setBlockMenu(null); }}
                    onDuplicate={() => { duplicate(b.id); setBlockMenu(null); }}
                    onMove={(d) => { moveBy(b.id, d); setBlockMenu(null); }}
                    onDelete={() => { remove(b.id, false); setBlockMenu(null); }}
                    onAlign={b.type === "p" ? (align) => { update(b.id, { align } as Partial<Block>); setBlockMenu(null); } : undefined}
                  />
                )}
              </div>
              <div className="be-body">
                <BlockBody
                  block={b}
                  index={index}
                  refs={refs.current}
                  update={update}
                  textHandlers={textHandlers}
                  onParagraphChange={onParagraphChange}
                  menuOpen={menu?.id === b.id}
                  onMenuKey={(e) => menuKeys.current?.(e) ?? false}
                  insertAfter={(nb) => insertAt(live.current.findIndex((x) => x.id === b.id) + 1, nb)}
                  removeSelf={() => remove(b.id)}
                  replaceSelf={(nb) => {
                    set(live.current.map((x) => (x.id === b.id ? nb : x)));
                    pending.current = { key: focusKey(nb), at: "start" };
                  }}
                  neighbour={(d) => neighbour(b.id, d)}
                  setPending={(f) => { pending.current = f; }}
                />
                {menu?.id === b.id && (
                  <SlashMenu query={menu.query} onChoose={choose} onClose={() => setMenu(null)} keysRef={menuKeys} />
                )}
              </div>
            </div>
          </Fragment>
        ))}
        {drop?.index === blocks.length && <div className="be-drop" />}
        <button
          type="button"
          className="be-append"
          onClick={() => {
            const last = blocks[blocks.length - 1];
            if (last?.type === "p" && !plainText(last.text)) { refs.current.get(last.id)?.focus("start"); return; }
            insertAt(blocks.length, catalogFor("p").make());
          }}
          onDragOver={(e) => { if (e.dataTransfer.types.includes(NEW_BLOCK) || e.dataTransfer.types.includes(MOVE_BLOCK)) { e.preventDefault(); setDrop({ index: blocks.length }); } }}
        >
          Click to keep writing · type / for blocks
        </button>
      </div>
    </div>
  );
}

/* The key handler of whichever slash menu is open, so the editable that
   owns the caret can hand it arrow keys and Enter. Module-level ref: only
   one menu is ever open. */
const menuKeys: { current: ((e: KeyboardEvent<HTMLDivElement>) => boolean) | null } = { current: null };

/* ---- the palette beside the canvas ---- */

export function BlockPalette({ onAdd }: { onAdd: (item: CatalogItem) => void }) {
  const groups = ["Text", "Media", "Layout"] as const;
  return (
    <div className="be-palette">
      <p className="adm-muted adm-small">Drag a block onto the page, or click to add it at the end.</p>
      {groups.map((g) => (
        <div key={g}>
          <h4>{g}</h4>
          <div className="be-palette__grid">
            {CATALOG.filter((c) => c.group === g).map((c) => (
              <button
                key={c.type}
                type="button"
                draggable
                className="be-palette__item"
                onDragStart={(e) => { e.dataTransfer.setData(NEW_BLOCK, c.type); e.dataTransfer.effectAllowed = "copy"; }}
                onClick={() => onAdd(c)}
                title={c.hint}
              >
                <span className="be-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- "/" menu ---- */

function SlashMenu({
  query, onChoose, onClose, keysRef,
}: { query: string; onChoose: (c: CatalogItem) => void; onClose: () => void; keysRef: typeof menuKeys }) {
  const q = query.toLowerCase().trim();
  const items = useMemo(
    () => CATALOG.filter((c) => !q || c.label.toLowerCase().includes(q) || c.keywords.includes(q)),
    [q],
  );
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [q]);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    keysRef.current = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(items.length, 1)); return true; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % Math.max(items.length, 1)); return true; }
      if (e.key === "Enter" || e.key === "Tab") {
        if (!items.length) return false;
        e.preventDefault();
        onChoose(items[active]);
        return true;
      }
      if (e.key === "Escape") { e.preventDefault(); onClose(); return true; }
      return false;
    };
    return () => { keysRef.current = null; };
  }, [items, active, onChoose, onClose, keysRef]);

  useEffect(() => {
    list.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!list.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div className="be-menu" ref={list} role="listbox" aria-label="Blocks">
      {items.length === 0 ? (
        <div className="be-menu__empty">No blocks match “{query}”</div>
      ) : (
        items.map((c, i) => (
          <button
            key={c.type}
            type="button"
            role="option"
            aria-selected={i === active}
            className={i === active ? "is-active" : ""}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChoose(c)}
          >
            <span className="be-icon">{c.icon}</span>
            <span><strong>{c.label}</strong><small>{c.hint}</small></span>
          </button>
        ))
      )}
    </div>
  );
}

/* ---- the handle's menu ---- */

function BlockMenu({
  block, first, last, onClose, onTurn, onDuplicate, onMove, onDelete, onAlign,
}: {
  block: Block; first: boolean; last: boolean; onClose: () => void;
  onTurn: (t: BlockType) => void; onDuplicate: () => void; onMove: (d: number) => void; onDelete: () => void;
  onAlign?: (a: "left" | "center") => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.parentElement?.contains(e.target as Node)) onClose(); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [onClose]);
  const canTurn = TEXT_TYPES.includes(block.type) || block.type === "ul" || block.type === "ol";
  return (
    <div className="be-blockmenu" ref={ref} role="menu">
      <div className="be-blockmenu__label">{catalogFor(block.type).label}</div>
      {canTurn && (
        <>
          <div className="be-blockmenu__sub">Turn into</div>
          <div className="be-blockmenu__turn">
            {CATALOG.filter((c) => [...TEXT_TYPES, "ul", "ol"].includes(c.type) && c.type !== block.type).map((c) => (
              <button key={c.type} type="button" role="menuitem" onClick={() => onTurn(c.type)} title={c.label}>
                <span className="be-icon">{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </>
      )}
      {onAlign && block.type === "p" && (
        <button type="button" role="menuitem" onClick={() => onAlign(block.align === "center" ? "left" : "center")}>
          {block.align === "center" ? "Align left" : "Centre text"}
        </button>
      )}
      <button type="button" role="menuitem" onClick={onDuplicate}>Duplicate</button>
      <button type="button" role="menuitem" onClick={() => onMove(-1)} disabled={first}>Move up</button>
      <button type="button" role="menuitem" onClick={() => onMove(1)} disabled={last}>Move down</button>
      <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>Delete</button>
    </div>
  );
}

/* ---- each block's editing surface ---- */

type BodyProps = {
  block: Block;
  index: number;
  refs: Map<string, RichHandle>;
  update: (id: string, patch: Partial<Block>) => void;
  textHandlers: (b: Block & { text: Rich }, index: number) => {
    onSplit: (s: { before: Rich; after: Rich }) => void;
    onBackspaceAtStart: (r: Rich) => void;
    onArrowOut: (d: "up" | "down") => void;
  };
  onParagraphChange: (b: Block & { type: "p" }, text: Rich) => void;
  menuOpen: boolean;
  onMenuKey: (e: KeyboardEvent<HTMLDivElement>) => boolean;
  insertAfter: (b: Block) => void;
  removeSelf: () => void;
  replaceSelf: (b: Block) => void;
  neighbour: (d: "up" | "down") => void;
  setPending: (f: Focus) => void;
};

function BlockBody(props: BodyProps) {
  const { block: b, index, refs, update, textHandlers } = props;
  const reg = (key: string) => (h: RichHandle | null) => { if (h) refs.set(key, h); else refs.delete(key); };

  switch (b.type) {
    case "p":
      return (
        <RichEditable
          ref={reg(b.id)}
          value={b.text}
          className={`be-p${b.align === "center" ? " is-center" : ""}`}
          placeholder={index === 0 ? "Start writing, or type / for blocks" : "Type / for blocks"}
          onChange={(t) => props.onParagraphChange(b, t)}
          onKeyDownCapture={(e) => (props.menuOpen ? props.onMenuKey(e) : false)}
          {...textHandlers(b, index)}
        />
      );
    case "h2":
    case "h3":
      return (
        <RichEditable
          ref={reg(b.id)}
          value={b.text}
          className={`be-${b.type}`}
          placeholder={b.type === "h2" ? "Heading" : "Subheading"}
          onChange={(text) => update(b.id, { text })}
          {...textHandlers(b, index)}
        />
      );
    case "quote":
      return (
        <div className="be-quote">
          <RichEditable ref={reg(b.id)} value={b.text} className="be-quote__text" placeholder="Quote" onChange={(text) => update(b.id, { text })} {...textHandlers(b, index)} />
          <input className="be-inline" placeholder="Who said it (optional)" value={b.cite} maxLength={200} onChange={(e) => update(b.id, { cite: e.target.value })} />
        </div>
      );
    case "callout":
      return (
        <div className={`be-callout is-${b.tone}`}>
          <RichEditable ref={reg(b.id)} value={b.text} placeholder="Callout text" onChange={(text) => update(b.id, { text })} {...textHandlers(b, index)} />
          <div className="be-options">
            <Seg value={b.tone} options={[["note", "Plain"], ["accent", "Highlighted"]]} onChange={(tone) => update(b.id, { tone } as Partial<Block>)} />
          </div>
        </div>
      );
    case "ul":
    case "ol":
      return <ListBody {...props} block={b} />;
    case "img":
      return (
        <div className="be-media">
          <PictureSlot src={b.src} onPick={(src) => update(b.id, { src })} size={b.size} />
          <div className="be-options">
            <input className="be-inline" placeholder="Describe the picture (alt text)" value={b.alt} maxLength={300} onChange={(e) => update(b.id, { alt: e.target.value })} />
            <input className="be-inline" placeholder="Caption (optional)" value={b.caption} maxLength={400} onChange={(e) => update(b.id, { caption: e.target.value })} />
            <Seg value={b.size} options={[["normal", "Text width"], ["wide", "Wide"], ["full", "Full width"]]} onChange={(size) => update(b.id, { size } as Partial<Block>)} />
          </div>
        </div>
      );
    case "gallery":
      return <GalleryBody block={b} update={update} />;
    case "imgText":
      return (
        <div className={`be-imgtext is-${b.side}`}>
          <div>
            <PictureSlot src={b.src} onPick={(src) => update(b.id, { src })} />
            <input className="be-inline" placeholder="Describe the picture (alt text)" value={b.alt} maxLength={300} onChange={(e) => update(b.id, { alt: e.target.value })} />
          </div>
          <div>
            <RichEditable ref={reg(b.id)} value={b.text} placeholder="Text beside the picture" onChange={(text) => update(b.id, { text })} onArrowOut={props.neighbour} />
            <div className="be-options">
              <Seg value={b.side} options={[["left", "Picture left"], ["right", "Picture right"]]} onChange={(side) => update(b.id, { side } as Partial<Block>)} />
            </div>
          </div>
        </div>
      );
    case "cols":
      return (
        <div className="be-cols">
          <RichEditable ref={reg(b.id)} value={b.left} placeholder="Left column" onChange={(left) => update(b.id, { left })} onArrowOut={props.neighbour} />
          <RichEditable value={b.right} placeholder="Right column" onChange={(right) => update(b.id, { right })} />
        </div>
      );
    case "video": {
      const ok = b.url ? !!videoEmbed(b.url) : null;
      return (
        <div className="be-video">
          <div className="be-video__icon">▶</div>
          <div className="be-options">
            <input className="be-inline" placeholder="Paste a YouTube or Vimeo link" value={b.url} maxLength={300} onChange={(e) => update(b.id, { url: e.target.value })} />
            {ok === false && <span className="adm-error adm-small">That isn&rsquo;t a YouTube or Vimeo link.</span>}
            {ok && <span className="adm-ok adm-small">Video found - it plays on the live page.</span>}
            <input className="be-inline" placeholder="Caption (optional)" value={b.caption} maxLength={400} onChange={(e) => update(b.id, { caption: e.target.value })} />
          </div>
        </div>
      );
    }
    case "button":
      return (
        <div className="be-button">
          <input className="be-inline be-button__label" placeholder="Button text" value={b.label} maxLength={80} onChange={(e) => update(b.id, { label: e.target.value })} />
          <input className="be-inline" placeholder="Link - https://… or /contact" value={b.href} maxLength={2000} onChange={(e) => update(b.id, { href: e.target.value })} />
        </div>
      );
    case "divider":
      return <hr className="be-divider" />;
    default:
      return null;
  }
}

function ListBody({ block, refs, update, insertAfter, removeSelf, replaceSelf, neighbour, setPending }: BodyProps & { block: Block & { type: "ul" | "ol" } }) {
  const b = block;
  const setItems = (items: Rich[]) => update(b.id, { items } as Partial<Block>);
  const List = b.type;
  return (
    <List className="be-list">
      {b.items.map((item, i) => (
        <li key={i}>
          <RichEditable
            ref={(h) => { const k = `${b.id}:${i}`; if (h) refs.set(k, h); else refs.delete(k); }}
            value={item}
            placeholder="List item"
            onChange={(t) => setItems(b.items.map((x, j) => (j === i ? t : x)))}
            onSplit={({ before, after }) => {
              if (!plainText(before) && !plainText(after)) {
                /* Enter on an empty item leaves the list */
                const items = b.items.filter((_, j) => j !== i);
                const para: Block = { id: uid(), type: "p", text: [], align: "left" };
                if (items.length) { setItems(items); insertAfter(para); } else replaceSelf(para);
                return;
              }
              const items = [...b.items];
              items.splice(i, 1, before, after);
              setItems(items);
              setPending({ key: `${b.id}:${i + 1}`, at: "start" });
            }}
            onBackspaceAtStart={(current) => {
              if (i === 0) {
                if (!plainText(current) && b.items.length === 1) removeSelf();
                return;
              }
              const items = [...b.items];
              const at = plainText(items[i - 1]).length;
              items.splice(i - 1, 2, concatRuns(items[i - 1], current));
              setItems(items);
              setPending({ key: `${b.id}:${i - 1}`, at });
            }}
            onArrowOut={(dir) => {
              const j = dir === "up" ? i - 1 : i + 1;
              if (j < 0 || j >= b.items.length) neighbour(dir);
              else refs.get(`${b.id}:${j}`)?.focus(dir === "up" ? "end" : "start");
            }}
          />
        </li>
      ))}
    </List>
  );
}

function GalleryBody({ block: b, update }: { block: Block & { type: "gallery" }; update: BodyProps["update"] }) {
  const [open, setOpen] = useState(false);
  const setImages = (images: { src: string; alt: string }[]) => update(b.id, { images } as Partial<Block>);
  return (
    <div className="be-gallery">
      {b.images.map((img, i) => (
        <div key={i} className="be-gallery__item">
          <img src={img.src} alt="" />
          <input className="be-inline" placeholder="Alt text" value={img.alt} maxLength={300}
            onChange={(e) => setImages(b.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
          <div className="be-gallery__tools">
            <button type="button" disabled={i === 0} onClick={() => { const a = [...b.images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setImages(a); }} aria-label="Move left">←</button>
            <button type="button" disabled={i === b.images.length - 1} onClick={() => { const a = [...b.images]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setImages(a); }} aria-label="Move right">→</button>
            <button type="button" onClick={() => setImages(b.images.filter((_, j) => j !== i))} aria-label="Remove">×</button>
          </div>
        </div>
      ))}
      {b.images.length < 24 && (
        <button type="button" className="be-gallery__add" onClick={() => setOpen(true)}>+ Add picture</button>
      )}
      {open && <ImageLibrary onClose={() => setOpen(false)} onPick={(u) => { setImages([...b.images, { src: u.url, alt: "" }]); setOpen(false); }} />}
    </div>
  );
}

function PictureSlot({ src, onPick, size }: { src: string; onPick: (src: string) => void; size?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`be-picture${src ? "" : " is-empty"}${size ? ` is-${size}` : ""}`} onClick={() => setOpen(true)}>
        {src ? <img src={src} alt="" /> : <span>+ Choose or upload a picture</span>}
      </button>
      {src && (
        <div className="adm-row">
          <Button variant="ghost" onClick={() => setOpen(true)}>Replace</Button>
          <Button variant="ghost" onClick={() => onPick("")}>Remove</Button>
        </div>
      )}
      {open && <ImageLibrary onClose={() => setOpen(false)} onPick={(u) => { onPick(u.url); setOpen(false); }} />}
    </>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, ReactNode][]; onChange: (v: T) => void }) {
  return (
    <div className="adm-seg" role="radiogroup">
      {options.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? "is-on" : ""} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

