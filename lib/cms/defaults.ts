/* What the site draws until the panel has saved something - built from
   the same files the pages always read, so the first save starts from
   the live page rather than from nothing. */
import { AWARDS, BRAND_MARK, CLIENT_ROWS } from "@/lib/content";
import { BLOG_HERO, REPORTS, SOON_LABEL, TABS, TOPICS, WHITEPAPERS, type Paper } from "@/lib/blog-content";
import type { AwardColour, AwardsData, Entry, FontFile, InsightsSettings, LogoWall } from "./types";

export const DEFAULT_WALL: LogoWall = {
  rows: CLIENT_ROWS.map((row, r) => ({
    dir: row.dir,
    speed: 34,
    items: row.names.map((name, i) => {
      const mark = BRAND_MARK[name];
      const id = `r${r}-${i}`;
      return mark
        ? { id, name, kind: "mark" as const, src: `/assets/clients/${mark.slug}.webp`, ar: mark.ar, k: mark.k ?? 1, display: "mask" as const }
        : { id, name, kind: "text" as const, k: 1, font: "", weight: 700 as const, italic: false, upper: false };
    }),
  })),
};

/* The faces a typed name can be set in without uploading anything. */
export const BUILT_IN_FONTS: FontFile[] = [
  { id: "", name: "Site sans (Satoshi)", url: "" },
  { id: "playful", name: "Caveat (handwritten)", url: "" },
];

export const fontFamily = (id: string) =>
  !id ? "var(--f-display)" : id === "playful" ? "var(--font-playful)" : `"scf-${id}", var(--f-display)`;

/* Uploaded faces are loaded once per page, whichever component asks. */
const loaded = new Set<string>();
export function loadFonts(fonts: FontFile[]) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  fonts.forEach((f) => {
    if (!f.url || loaded.has(f.id)) return;
    loaded.add(f.id);
    const face = new FontFace(`scf-${f.id}`, `url(${f.url})`, { display: "swap" });
    face.load().then((ff) => document.fonts.add(ff)).catch(() => loaded.delete(f.id));
  });
}

export const DEFAULT_INSIGHTS: InsightsSettings = {
  hero: {
    eyebrow: BLOG_HERO.eyebrow,
    line1: BLOG_HERO.lines[0],
    line2: BLOG_HERO.lines[1],
    lede: BLOG_HERO.lede,
  },
  tabs: TABS.map((t) => ({ id: t.id, label: t.label, live: t.live })),
  defaultTab: "whitepapers",
  soonLabel: SOON_LABEL,
  topicsTag: "What we write about",
  topics: TOPICS.map((t) => ({ name: t.name, copy: t.copy })),
};

const paperEntry = (p: Paper, type: "whitepaper" | "report"): Entry => ({
  type,
  slug: p.id,
  title: p.title,
  excerpt: p.blurb,
  cover: "",
  cover_alt: "",
  author: "",
  tags: [],
  status: "published",
  data: {
    tag: p.tag,
    points: [...p.points],
    pdf: p.pdf,
    file: p.file,
    cta: p.cta,
    pages: Array.from({ length: p.pages }, (_, i) => `/assets/whitepapers/${p.id}/p${String(i + 1).padStart(2, "0")}.jpg`),
  },
});

export const DEFAULT_ENTRIES: Entry[] = [
  ...WHITEPAPERS.map((p) => paperEntry(p, "whitepaper")),
  ...REPORTS.map((p) => paperEntry(p, "report")),
];

/* ---- the awards strip ---- */

/* The brand's six solids, in the order the strip has always dealt them
   (SOLIDS in lib/solids.ts). */
export const AWARD_COLOURS: { id: Exclude<AwardColour, `#${string}`>; name: string; hex: string; css: string }[] = [
  { id: "leaf", name: "Leaf green", hex: "#8cc752", css: "var(--leaf)" },
  { id: "sky", name: "Sky blue", hex: "#38c6f0", css: "var(--sky)" },
  { id: "tangerine", name: "Tangerine", hex: "#f06827", css: "var(--tangerine)" },
  { id: "yellow", name: "Yellow", hex: "#ffcb0c", css: "var(--logo)" },
  { id: "purple", name: "Purple", hex: "#97509f", css: "var(--purple)" },
  { id: "pink", name: "Pink", hex: "#ee346e", css: "var(--pink)" },
];

export const awardColour = (c: AwardColour) =>
  AWARD_COLOURS.find((x) => x.id === c)?.css ?? (/^#[0-9a-f]{6}$/i.test(c) ? c : "var(--purple)");

export const DEFAULT_AWARDS: AwardsData = {
  items: AWARDS.map((a, i) => ({ id: `award-${i}`, name: a.name, category: a.category, color: AWARD_COLOURS[i % 6].id })),
};
