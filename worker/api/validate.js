/* ============================================================
   EVERYTHING THE PANEL SAVES IS REBUILT HERE FIELD BY FIELD.

   Nothing from the request is stored as-is: each block, run and
   logo is copied across only through a known field, cut to a length,
   and every URL is checked. Text is stored as text and rendered by
   React as text, never as HTML - so a post cannot carry a script
   into the public site even if an admin account were taken over.
   Mirrors the types in lib/cms/types.ts.
   ============================================================ */
import { HttpError } from "./http.js";

const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max);
const pick = (v, options, fallback) => (options.includes(v) ? v : fallback);
const bool = (v) => v === true;

/* A path on this site, or an https address. Not //host (which a
   browser reads as another site) and not javascript:, data: etc. */
export function safeSrc(v) {
  const s = str(v, 2000).trim();
  if (!s) return "";
  if (/^\/(?!\/)[^\s<>"']*$/.test(s)) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "";
  } catch { return ""; }
}

export function safeHref(v) {
  const s = str(v, 2000).trim();
  if (!s) return "";
  if (/^#[\w-]*$/.test(s)) return s;
  if (/^\/(?!\/)[^\s<>"']*$/.test(s)) return s;
  try {
    const u = new URL(s);
    return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol) ? u.href : "";
  } catch { return ""; }
}

export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
export const RESERVED_SLUGS = new Set(["post", "admin", "api", "blogs", "whitepapers", "reports"]);

/* ---- rich text: a list of runs, each a piece of text and its marks ---- */

export function rich(v, max = 20000) {
  if (!Array.isArray(v)) return [];
  let budget = max;
  const out = [];
  for (const r of v.slice(0, 500)) {
    if (!r || typeof r.t !== "string" || budget <= 0) continue;
    const t = r.t.slice(0, budget);
    budget -= t.length;
    const run = { t };
    for (const m of ["b", "i", "u", "s", "c"]) if (r[m]) run[m] = 1;
    const h = safeHref(r.h);
    if (h) run.h = h;
    out.push(run);
  }
  return out;
}

const id = (v) => (typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : crypto.randomUUID().slice(0, 12));

const image = (v) => ({ src: safeSrc(v?.src), alt: str(v?.alt, 300) });

export function videoId(url) {
  try {
    const u = new URL(String(url));
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { kind: "youtube", id: u.pathname.slice(1, 12) };
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v") || (u.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})/) || [])[1];
      if (v && /^[\w-]{11}$/.test(v)) return { kind: "youtube", id: v };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d{6,12})/);
      if (m) return { kind: "vimeo", id: m[1] };
    }
  } catch { /* not a URL */ }
  return null;
}

export function block(b) {
  if (!b || typeof b !== "object") return null;
  const base = { id: id(b.id) };
  switch (b.type) {
    case "p":
      return { ...base, type: "p", text: rich(b.text), align: pick(b.align, ["left", "center"], "left") };
    case "h2":
    case "h3":
      return { ...base, type: b.type, text: rich(b.text, 300) };
    case "quote":
      return { ...base, type: "quote", text: rich(b.text, 2000), cite: str(b.cite, 200) };
    case "callout":
      return { ...base, type: "callout", text: rich(b.text, 4000), tone: pick(b.tone, ["note", "accent"], "note") };
    case "ul":
    case "ol":
      return { ...base, type: b.type, items: (Array.isArray(b.items) ? b.items : []).slice(0, 100).map((i) => rich(i, 2000)) };
    case "img":
      return { ...base, type: "img", ...image(b), caption: str(b.caption, 400), size: pick(b.size, ["normal", "wide", "full"], "normal") };
    case "gallery":
      return { ...base, type: "gallery", images: (Array.isArray(b.images) ? b.images : []).slice(0, 24).map(image) };
    case "imgText":
      return { ...base, type: "imgText", ...image(b), text: rich(b.text, 6000), side: pick(b.side, ["left", "right"], "left") };
    case "cols":
      return { ...base, type: "cols", left: rich(b.left, 6000), right: rich(b.right, 6000) };
    case "video": {
      const v = videoId(b.url);
      return { ...base, type: "video", url: v ? str(b.url, 300) : "", caption: str(b.caption, 400) };
    }
    case "button":
      return { ...base, type: "button", label: str(b.label, 80), href: safeHref(b.href) };
    case "divider":
      return { ...base, type: "divider" };
    default:
      return null;
  }
}

export function blocks(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 400).map(block).filter(Boolean);
}

/* ---- one Insights entry ---- */

export function entry(body) {
  const type = pick(body.type, ["blog", "whitepaper", "report"], null);
  if (!type) throw new HttpError(400, "Unknown entry type");
  const title = str(body.title, 200).trim();
  if (!title) throw new HttpError(400, "Add a title.");
  const slug = str(body.slug, 80).trim().toLowerCase();
  if (!SLUG.test(slug) || RESERVED_SLUGS.has(slug)) {
    throw new HttpError(400, "The URL name can only use lowercase letters, numbers and dashes.");
  }
  let data;
  if (type === "blog") {
    data = { blocks: blocks(body.data?.blocks), seoTitle: str(body.data?.seoTitle, 200), seoDescription: str(body.data?.seoDescription, 320) };
  } else {
    const d = body.data || {};
    data = {
      tag: str(d.tag, 60),
      points: (Array.isArray(d.points) ? d.points : []).slice(0, 12).map((p) => str(p, 300)).filter(Boolean),
      pdf: safeSrc(d.pdf),
      file: str(d.file, 160).replace(/[^\w.\- ]/g, "") || "document.pdf",
      cta: str(d.cta, 60),
      pages: (Array.isArray(d.pages) ? d.pages : []).slice(0, 400).map(safeSrc).filter(Boolean),
    };
  }
  return {
    type,
    slug,
    title,
    excerpt: str(body.excerpt, 1000),
    cover: safeSrc(body.cover),
    cover_alt: str(body.cover_alt, 300),
    author: str(body.author, 120),
    tags: JSON.stringify((Array.isArray(body.tags) ? body.tags : []).slice(0, 12).map((t) => str(t, 40).trim()).filter(Boolean)),
    data: JSON.stringify(data),
    status: body.status === "published" ? "published" : "draft",
  };
}

/* ---- the Insights page's fixed frame ---- */

export function insightsSettings(v) {
  const tabs = ["blogs", "whitepapers", "reports"].map((tid) => {
    const t = (Array.isArray(v?.tabs) ? v.tabs : []).find((x) => x?.id === tid) || {};
    return { id: tid, label: str(t.label, 40) || tid, live: bool(t.live) };
  });
  return {
    hero: {
      eyebrow: str(v?.hero?.eyebrow, 80),
      line1: str(v?.hero?.line1, 120),
      line2: str(v?.hero?.line2, 120),
      lede: str(v?.hero?.lede, 600),
    },
    tabs,
    defaultTab: pick(v?.defaultTab, ["blogs", "whitepapers", "reports"], "whitepapers"),
    soonLabel: str(v?.soonLabel, 40),
    topicsTag: str(v?.topicsTag, 80),
    topics: (Array.isArray(v?.topics) ? v.topics : []).slice(0, 24).map((t) => ({ name: str(t?.name, 120), copy: str(t?.copy, 400) })),
  };
}

/* ---- the client wall ---- */

export function logoWall(v) {
  const rows = (Array.isArray(v?.rows) ? v.rows : []).slice(0, 8).map((row) => ({
    dir: pick(row?.dir, ["left", "right"], "left"),
    speed: Math.min(120, Math.max(8, Number(row?.speed) || 34)),
    items: (Array.isArray(row?.items) ? row.items : []).slice(0, 80).map((it) => {
      const name = str(it?.name, 80).trim();
      const kind = pick(it?.kind, ["mark", "text"], "text");
      const k = Math.min(3, Math.max(0.2, Number(it?.k) || 1));
      if (kind === "mark") {
        const src = safeSrc(it?.src);
        const ar = Math.min(20, Math.max(0.2, Number(it?.ar) || 1));
        if (src) return { id: id(it?.id), name, kind, src, ar, k, display: pick(it?.display, ["mask", "image"], "mask") };
      }
      return {
        id: id(it?.id), name, kind: "text", k,
        font: str(it?.font, 60).replace(/[^\w-]/g, ""),
        weight: pick(Number(it?.weight), [400, 500, 700, 900], 700),
        italic: bool(it?.italic),
        upper: bool(it?.upper),
      };
    }).filter((it) => it.name),
  }));
  if (!rows.length) throw new HttpError(400, "The wall needs at least one row.");
  return { rows };
}

/* ---- the awards strip ---- */

export const AWARD_COLOURS = ["leaf", "sky", "tangerine", "yellow", "purple", "pink"];

export function awards(v) {
  const items = (Array.isArray(v?.items) ? v.items : []).slice(0, 40).map((a) => {
    const colour = String(a?.color || "");
    return {
      id: id(a?.id),
      name: str(a?.name, 80).trim(),
      category: str(a?.category, 120).trim(),
      color: AWARD_COLOURS.includes(colour) || /^#[0-9a-f]{6}$/i.test(colour) ? colour.toLowerCase() : "purple",
    };
  }).filter((a) => a.name);
  if (!items.length) throw new HttpError(400, "Add at least one award.");
  return { items };
}
