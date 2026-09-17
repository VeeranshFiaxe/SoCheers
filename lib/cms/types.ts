/* ============================================================
   THE SHAPES THE ADMIN PANEL SAVES AND THE SITE READS.

   The server rebuilds every one of these field by field before it
   stores anything (worker/api/validate.js) - change a shape here,
   change it there.
   ============================================================ */

/* ---- rich text ----
   A paragraph is a list of runs: a piece of text and its marks.
   Never HTML, so nothing typed into the panel can become markup. */
export type Run = {
  t: string;
  b?: 1; // bold
  i?: 1; // italic
  u?: 1; // underline
  s?: 1; // strikethrough
  c?: 1; // inline code
  h?: string; // link
};
export type Rich = Run[];

export type Img = { src: string; alt: string };

export type Block =
  | { id: string; type: "p"; text: Rich; align: "left" | "center" }
  | { id: string; type: "h2" | "h3"; text: Rich }
  | { id: string; type: "quote"; text: Rich; cite: string }
  | { id: string; type: "callout"; text: Rich; tone: "note" | "accent" }
  | { id: string; type: "ul" | "ol"; items: Rich[] }
  | ({ id: string; type: "img"; caption: string; size: "normal" | "wide" | "full" } & Img)
  | { id: string; type: "gallery"; images: Img[] }
  | ({ id: string; type: "imgText"; text: Rich; side: "left" | "right" } & Img)
  | { id: string; type: "cols"; left: Rich; right: Rich }
  | { id: string; type: "video"; url: string; caption: string }
  | { id: string; type: "button"; label: string; href: string }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

/* ---- insights ---- */

export type EntryType = "blog" | "whitepaper" | "report";

export type PaperData = {
  tag: string;
  points: string[];
  pdf: string;
  file: string;
  cta: string;
  pages: string[];
};

export type BlogData = {
  blocks: Block[];
  seoTitle: string;
  seoDescription: string;
};

export type Entry = {
  id?: number;
  type: EntryType;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  cover_alt: string;
  author: string;
  tags: string[];
  status: "draft" | "published";
  position?: number;
  published_at?: number | null;
  updated_at?: number;
  data?: PaperData | BlogData;
};

export type TabKey = "blogs" | "whitepapers" | "reports";

export type InsightsSettings = {
  hero: { eyebrow: string; line1: string; line2: string; lede: string };
  tabs: { id: TabKey; label: string; live: boolean }[];
  defaultTab: TabKey;
  soonLabel: string;
  topicsTag: string;
  topics: { name: string; copy: string }[];
};

export type InsightsPayload = {
  settings: InsightsSettings | null;
  entries: Entry[];
};

/* ---- client wall ---- */

export type WallItem =
  | { id: string; name: string; kind: "mark"; src: string; ar: number; k: number; display: "mask" | "image" }
  | { id: string; name: string; kind: "text"; k: number; font: string; weight: 400 | 500 | 700 | 900; italic: boolean; upper: boolean };

export type WallRow = { dir: "left" | "right"; speed: number; items: WallItem[] };
export type LogoWall = { rows: WallRow[] };

export type FontFile = { id: string; name: string; url: string; content_type?: string };

/* ---- awards strip ---- */

/* one of the design book's six solids by name, or a custom "#rrggbb" */
export type AwardColour = "leaf" | "sky" | "tangerine" | "yellow" | "purple" | "pink" | `#${string}`;
export type AwardItem = { id: string; name: string; category: string; color: AwardColour };
export type AwardsData = { items: AwardItem[] };
