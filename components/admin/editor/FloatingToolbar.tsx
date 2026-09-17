"use client";

/* The toolbar that floats over selected text in any rich block: bold,
   italic, underline, strikethrough, code, link. One for the whole
   editor, following the selection wherever it is. */
import { useEffect, useRef, useState } from "react";

type Pos = { top: number; left: number };

const editableOf = (node: Node | null): HTMLElement | null => {
  let n: Node | null = node;
  while (n && !(n instanceof HTMLElement && n.dataset.rich !== undefined)) n = n.parentNode;
  return n as HTMLElement | null;
};

const closest = (node: Node | null, tag: string, stop: HTMLElement | null) => {
  let n: Node | null = node;
  while (n && n !== stop) {
    if (n instanceof HTMLElement && n.tagName === tag) return n;
    n = n.parentNode;
  }
  return null;
};

export function normaliseUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\/(?!\/)/.test(s) || /^#[\w-]*$/.test(s)) return s;
  if (/^mailto:|^tel:/i.test(s)) return s;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.href : null;
  } catch {
    return null;
  }
}

export default function FloatingToolbar() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState({ b: false, i: false, u: false, s: false, c: false, a: false });
  const saved = useRef<Range | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const linkingRef = useRef(false);
  linkingRef.current = linking;

  useEffect(() => {
    const update = () => {
      if (linkingRef.current) return;
      const sel = window.getSelection();
      const el = sel && sel.rangeCount ? editableOf(sel.anchorNode) : null;
      if (!sel || sel.isCollapsed || !el || !el.contains(sel.focusNode)) { setPos(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) { setPos(null); return; }
      target.current = el;
      setPos({ top: Math.max(8, rect.top - 46), left: rect.left + rect.width / 2 });
      setState({
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
        s: document.queryCommandState("strikeThrough"),
        c: !!closest(sel.anchorNode, "CODE", el),
        a: !!closest(sel.anchorNode, "A", el),
      });
    };
    const openLink = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !editableOf(sel.anchorNode)) return;
      startLink();
    };
    document.addEventListener("selectionchange", update);
    window.addEventListener("sc-rich-link", openLink);
    window.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("sc-rich-link", openLink);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  const changed = () => target.current?.dispatchEvent(new Event("input", { bubbles: true }));

  const cmd = (name: string) => {
    document.execCommand(name);
    changed();
  };

  const toggleCode = () => {
    const sel = window.getSelection();
    const el = target.current;
    if (!sel || !sel.rangeCount || !el) return;
    const existing = closest(sel.anchorNode, "CODE", el);
    if (existing) {
      existing.replaceWith(...Array.from(existing.childNodes));
    } else {
      const r = sel.getRangeAt(0);
      const code = document.createElement("code");
      code.textContent = r.toString();
      r.deleteContents();
      r.insertNode(code);
      sel.removeAllRanges();
      const nr = document.createRange();
      nr.selectNodeContents(code);
      sel.addRange(nr);
    }
    changed();
  };

  const startLink = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    saved.current = sel.getRangeAt(0).cloneRange();
    target.current = editableOf(sel.anchorNode);
    const a = closest(sel.anchorNode, "A", target.current);
    setUrl(a?.getAttribute("href") ?? "");
    setLinking(true);
  };

  const restore = () => {
    const sel = window.getSelection();
    if (!sel || !saved.current) return;
    target.current?.focus();
    sel.removeAllRanges();
    sel.addRange(saved.current);
  };

  const applyLink = () => {
    const href = normaliseUrl(url);
    restore();
    if (href) document.execCommand("createLink", false, href);
    setLinking(false);
    changed();
  };

  const unlink = () => {
    restore();
    document.execCommand("unlink");
    setLinking(false);
    changed();
  };

  if (!pos && !linking) return null;
  const btn = (key: keyof typeof state, label: string, title: string, onClick: () => void) => (
    <button
      type="button"
      className={state[key] ? "is-on" : ""}
      title={title}
      aria-pressed={state[key]}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={bar}
      className="rt-toolbar"
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
      role="toolbar"
      aria-label="Text formatting"
    >
      {linking ? (
        <form className="rt-toolbar__link" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a link, or /contact"
            onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setLinking(false); restore(); } }}
          />
          <button type="submit">Apply</button>
          {state.a && <button type="button" onClick={unlink}>Remove</button>}
        </form>
      ) : (
        <>
          {btn("b", "B", "Bold (Ctrl+B)", () => cmd("bold"))}
          {btn("i", "I", "Italic (Ctrl+I)", () => cmd("italic"))}
          {btn("u", "U", "Underline (Ctrl+U)", () => cmd("underline"))}
          {btn("s", "S", "Strikethrough", () => cmd("strikeThrough"))}
          {btn("c", "</>", "Code", toggleCode)}
          {btn("a", "Link", "Link (Ctrl+K)", startLink)}
          <button type="button" title="Clear formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => { document.execCommand("removeFormat"); document.execCommand("unlink"); changed(); }}>
            Clear
          </button>
        </>
      )}
    </div>
  );
}
