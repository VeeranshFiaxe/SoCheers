/* Rich text <-> the editor's contentEditable DOM.

   The editor's DOM is only ever a working surface. What is kept is the
   list of runs read back off it (domToRuns), and what the DOM is rebuilt
   from is that list (runsToHtml) with every character escaped - so
   pasting or typing markup can never put markup into a post. */
import type { Rich, Run } from "@/lib/cms/types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function runsToHtml(runs: Rich): string {
  return runs
    .map((r) => {
      let h = esc(r.t).replace(/\n/g, "<br>");
      if (r.c) h = `<code>${h}</code>`;
      if (r.b) h = `<b>${h}</b>`;
      if (r.i) h = `<i>${h}</i>`;
      if (r.u) h = `<u>${h}</u>`;
      if (r.s) h = `<s>${h}</s>`;
      if (r.h) h = `<a href="${esc(r.h)}">${h}</a>`;
      return h;
    })
    .join("");
}

type Marks = Omit<Run, "t">;
const same = (a: Marks, b: Marks) => a.b === b.b && a.i === b.i && a.u === b.u && a.s === b.s && a.c === b.c && a.h === b.h;

export function domToRuns(root: Node): Rich {
  const out: Run[] = [];
  const push = (t: string, m: Marks) => {
    if (!t) return;
    const last = out[out.length - 1];
    if (last && same(last, m)) last.t += t;
    else out.push({ t, ...m });
  };
  const walk = (node: Node, m: Marks, first: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      push((node.textContent ?? "").replace(/ /g, " ").replace(/​/g, ""), m);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (tag === "BR") { push("\n", m); return; }
    /* a browser wraps new lines in <div>s on its own */
    if ((tag === "DIV" || tag === "P") && !first) push("\n", m);
    const n: Marks = { ...m };
    const style = el.style;
    if (tag === "B" || tag === "STRONG" || Number(style?.fontWeight) >= 600 || style?.fontWeight === "bold") n.b = 1;
    if (tag === "I" || tag === "EM" || style?.fontStyle === "italic") n.i = 1;
    if (tag === "U" || style?.textDecorationLine?.includes("underline")) n.u = 1;
    if (tag === "S" || tag === "STRIKE" || tag === "DEL" || style?.textDecorationLine?.includes("line-through")) n.s = 1;
    if (tag === "CODE") n.c = 1;
    if (tag === "A" && el.getAttribute("href")) n.h = el.getAttribute("href")!;
    Array.from(el.childNodes).forEach((c, i) => walk(c, n, i === 0));
  };
  Array.from(root.childNodes).forEach((c, i) => walk(c, {}, i === 0));
  /* a trailing line break is the browser's placeholder, not content */
  const last = out[out.length - 1];
  if (last && last.t.endsWith("\n")) {
    last.t = last.t.slice(0, -1);
    if (!last.t) out.pop();
  }
  return out;
}

export const plainText = (r: Rich) => r.map((x) => x.t).join("");
export const textRuns = (t: string): Rich => (t ? [{ t }] : []);

/* Drop the first n characters (a typed "## " or "/"). */
export function dropPrefix(runs: Rich, n: number): Rich {
  const out: Rich = [];
  let left = n;
  for (const r of runs) {
    if (left >= r.t.length) { left -= r.t.length; continue; }
    out.push({ ...r, t: r.t.slice(left) });
    left = 0;
  }
  return out;
}

export function concatRuns(a: Rich, b: Rich): Rich {
  const out = a.map((r) => ({ ...r }));
  for (const r of b) {
    const last = out[out.length - 1];
    if (last && same(last, r)) last.t += r.t;
    else out.push({ ...r });
  }
  return out;
}

export const richEqual = (a: Rich, b: Rich) => JSON.stringify(a) === JSON.stringify(b);
