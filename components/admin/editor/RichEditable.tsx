"use client";

/* One editable run of rich text - a paragraph, a heading, a list item.

   Uncontrolled on purpose: React never rewrites the DOM under the caret
   while someone is typing. The DOM is read back into runs on every
   input, and only rebuilt from runs when the value changes from outside
   (undo, a block being turned into another, a template). */
import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import type { Rich } from "@/lib/cms/types";
import { domToRuns, plainText, richEqual, runsToHtml } from "./rich";

export type RichHandle = {
  focus: (at?: "start" | "end" | number) => void;
  el: () => HTMLElement | null;
};

export type SplitResult = { before: Rich; after: Rich };

type Props = {
  value: Rich;
  onChange: (r: Rich) => void;
  placeholder?: string;
  className?: string;
  /* Enter: the text either side of the caret. Without this, Enter is a line break. */
  onSplit?: (s: SplitResult) => void;
  /* Backspace with the caret at the very start. */
  onBackspaceAtStart?: (current: Rich) => void;
  onArrowOut?: (dir: "up" | "down") => void;
  onKeyDownCapture?: (e: KeyboardEvent<HTMLDivElement>) => boolean | void;
  ariaLabel?: string;
};

function caretEdge(el: HTMLElement, edge: "start" | "end"): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer)) return false;
  const probe = document.createRange();
  probe.selectNodeContents(el);
  if (edge === "start") probe.setEnd(r.startContainer, r.startOffset);
  else probe.setStart(r.endContainer, r.endOffset);
  return probe.toString().replace(/​/g, "") === "" && (edge === "end" || !probe.cloneContents().querySelector("br, img"));
}

/* On the first or last visual line - so arrow keys move between blocks
   only once they have nowhere left to go inside this one. */
function caretOnEdgeLine(el: HTMLElement, dir: "up" | "down"): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const rect = sel.getRangeAt(0).getClientRects()[0] ?? sel.getRangeAt(0).getBoundingClientRect();
  const box = el.getBoundingClientRect();
  if (!rect || (rect.top === 0 && rect.bottom === 0)) return true;
  const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
  return dir === "up" ? rect.top - box.top < line * 0.9 : box.bottom - rect.bottom < line * 0.9;
}

export const RichEditable = forwardRef<RichHandle, Props>(function RichEditable(
  { value, onChange, placeholder, className, onSplit, onBackspaceAtStart, onArrowOut, onKeyDownCapture, ariaLabel },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<Rich | null>(null);

  useLayoutEffect(() => {
    if (!el.current) return;
    if (lastEmitted.current && richEqual(lastEmitted.current, value)) return;
    el.current.innerHTML = runsToHtml(value);
    lastEmitted.current = value;
    el.current.classList.toggle("is-empty", !plainText(value));
  }, [value]);

  const emit = useCallback(() => {
    if (!el.current) return;
    const runs = domToRuns(el.current);
    lastEmitted.current = runs;
    el.current.classList.toggle("is-empty", !plainText(runs));
    onChange(runs);
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    el: () => el.current,
    focus: (at = "end") => {
      const node = el.current;
      if (!node) return;
      node.focus();
      const r = document.createRange();
      r.selectNodeContents(node);
      if (typeof at === "number") {
        /* a character offset - where two blocks were just joined */
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let left = at;
        let placed = false;
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          const len = t.textContent?.length ?? 0;
          if (left <= len) { r.setStart(t, left); r.collapse(true); placed = true; break; }
          left -= len;
        }
        if (!placed) r.collapse(false);
      } else {
        r.collapse(at === "start");
      }
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    },
  }));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDownCapture?.(e)) return;
    const node = el.current!;
    if (e.key === "Enter" && !e.shiftKey && onSplit) {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      r.deleteContents();
      const before = document.createRange();
      before.selectNodeContents(node);
      before.setEnd(r.startContainer, r.startOffset);
      const after = document.createRange();
      after.selectNodeContents(node);
      after.setStart(r.startContainer, r.startOffset);
      const wrap = (range: Range) => { const d = document.createElement("div"); d.append(range.cloneContents()); return domToRuns(d); };
      const s = { before: wrap(before), after: wrap(after) };
      node.innerHTML = runsToHtml(s.before);
      lastEmitted.current = s.before;
      onSplit(s);
      return;
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      return;
    }
    if (e.key === "Backspace" && onBackspaceAtStart && caretEdge(node, "start")) {
      e.preventDefault();
      onBackspaceAtStart(domToRuns(node));
      return;
    }
    if (onArrowOut && (e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey) {
      const dir = e.key === "ArrowUp" ? "up" : "down";
      if (caretOnEdgeLine(node, dir)) { e.preventDefault(); onArrowOut(dir); }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && ["b", "i", "u"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      document.execCommand({ b: "bold", i: "italic", u: "underline" }[e.key.toLowerCase()]!);
      emit();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("sc-rich-link"));
    }
  };

  return (
    <div
      ref={el}
      className={`rt ${className ?? ""}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel ?? placeholder}
      data-placeholder={placeholder}
      data-rich
      spellCheck
      onInput={emit}
      onKeyDown={onKeyDown}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
      onDrop={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onBlur={emit}
    />
  );
});
