/* Every kind of block the editor can add, and the ready-made layouts a
   new post can start from. */
import type { Block, BlockType, Rich } from "@/lib/cms/types";
import { uid } from "../api";

const t = (s: string): Rich => (s ? [{ t: s }] : []);

export type CatalogItem = {
  type: BlockType;
  label: string;
  hint: string;
  icon: string;
  keywords: string;
  group: "Text" | "Media" | "Layout";
  make: () => Block;
};

export const CATALOG: CatalogItem[] = [
  { type: "p", label: "Paragraph", hint: "Plain text", icon: "¶", keywords: "text paragraph body", group: "Text",
    make: () => ({ id: uid(), type: "p", text: [], align: "left" }) },
  { type: "h2", label: "Heading", hint: "Section heading", icon: "H2", keywords: "heading title h2 section", group: "Text",
    make: () => ({ id: uid(), type: "h2", text: [] }) },
  { type: "h3", label: "Subheading", hint: "Smaller heading", icon: "H3", keywords: "subheading h3 small heading", group: "Text",
    make: () => ({ id: uid(), type: "h3", text: [] }) },
  { type: "ul", label: "Bulleted list", hint: "A simple list", icon: "•", keywords: "bullet list unordered ul", group: "Text",
    make: () => ({ id: uid(), type: "ul", items: [[]] }) },
  { type: "ol", label: "Numbered list", hint: "A list with numbers", icon: "1.", keywords: "numbered ordered list ol steps", group: "Text",
    make: () => ({ id: uid(), type: "ol", items: [[]] }) },
  { type: "quote", label: "Quote", hint: "A pull quote", icon: "❝", keywords: "quote blockquote citation", group: "Text",
    make: () => ({ id: uid(), type: "quote", text: [], cite: "" }) },
  { type: "callout", label: "Callout", hint: "A highlighted note", icon: "!", keywords: "callout note highlight box tip", group: "Text",
    make: () => ({ id: uid(), type: "callout", text: [], tone: "note" }) },
  { type: "img", label: "Picture", hint: "One picture with a caption", icon: "▣", keywords: "image picture photo img", group: "Media",
    make: () => ({ id: uid(), type: "img", src: "", alt: "", caption: "", size: "normal" }) },
  { type: "gallery", label: "Gallery", hint: "A grid of pictures", icon: "▦", keywords: "gallery grid images pictures", group: "Media",
    make: () => ({ id: uid(), type: "gallery", images: [] }) },
  { type: "video", label: "Video", hint: "YouTube or Vimeo", icon: "▶", keywords: "video youtube vimeo embed film", group: "Media",
    make: () => ({ id: uid(), type: "video", url: "", caption: "" }) },
  { type: "imgText", label: "Picture + text", hint: "Side by side", icon: "◧", keywords: "image text side media split", group: "Layout",
    make: () => ({ id: uid(), type: "imgText", src: "", alt: "", text: [], side: "left" }) },
  { type: "cols", label: "Two columns", hint: "Text side by side", icon: "‖", keywords: "columns two cols split", group: "Layout",
    make: () => ({ id: uid(), type: "cols", left: [], right: [] }) },
  { type: "button", label: "Button", hint: "A call to action", icon: "⬭", keywords: "button cta link action", group: "Layout",
    make: () => ({ id: uid(), type: "button", label: "", href: "" }) },
  { type: "divider", label: "Divider", hint: "A line between sections", icon: "—", keywords: "divider line separator hr rule", group: "Layout",
    make: () => ({ id: uid(), type: "divider" }) },
];

export const catalogFor = (type: BlockType) => CATALOG.find((c) => c.type === type)!;

/* Blocks whose text can be carried over when one is turned into another. */
export const TEXT_TYPES: BlockType[] = ["p", "h2", "h3", "quote", "callout"];

export function textOf(b: Block): Rich {
  if ("text" in b) return b.text;
  if (b.type === "ul" || b.type === "ol") return b.items.flatMap((it, i) => (i ? [{ t: "\n" }, ...it] : it));
  return [];
}

export function turnInto(b: Block, type: BlockType): Block {
  const fresh = catalogFor(type).make();
  const text = textOf(b);
  if ("text" in fresh) (fresh as { text: Rich }).text = text;
  if (fresh.type === "ul" || fresh.type === "ol") {
    if (b.type === "ul" || b.type === "ol") fresh.items = b.items;
    else fresh.items = [text];
  }
  return { ...fresh, id: b.id };
}

/* Brand-new ids, for a duplicate or a template. */
export const cloneBlocks = (blocks: Block[]): Block[] =>
  blocks.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: uid() }));

/* ---- ready-made layouts ---- */

export type Template = { id: string; name: string; description: string; blocks: () => Block[]; custom?: boolean };

const p = (s: string): Block => ({ id: uid(), type: "p", text: t(s), align: "left" });
const h2 = (s: string): Block => ({ id: uid(), type: "h2", text: t(s) });
const h3 = (s: string): Block => ({ id: uid(), type: "h3", text: t(s) });

export const TEMPLATES: Template[] = [
  {
    id: "blank", name: "Blank", description: "Start from an empty page.",
    blocks: () => [p("")],
  },
  {
    id: "article", name: "Article", description: "An intro, sections with headings, a quote and a closing call to action.",
    blocks: () => [
      p("Open with the one idea this piece is about, in two or three sentences."),
      h2("The first point"),
      p("Make the case. Keep paragraphs short."),
      { id: uid(), type: "img", src: "", alt: "", caption: "", size: "wide" },
      h2("The second point"),
      p("Build on the first one."),
      { id: uid(), type: "quote", text: t("A line worth pulling out."), cite: "" },
      h2("What it means"),
      p("Close with what the reader should take away."),
      { id: uid(), type: "divider" },
      { id: uid(), type: "button", label: "Got a brief? Let's talk", href: "/contact" },
    ],
  },
  {
    id: "listicle", name: "List post", description: "A numbered run of points, each with a heading and a picture.",
    blocks: () => [
      p("Set up the list: what it is and why these made the cut."),
      ...[1, 2, 3, 4, 5].flatMap((n) => [
        h2(`${n}. Point title`),
        { id: uid(), type: "imgText", src: "", alt: "", text: t("Why it matters, in a few lines."), side: n % 2 ? "left" : "right" } as Block,
      ]),
      h2("The takeaway"),
      p("Wrap it up."),
    ],
  },
  {
    id: "case", name: "Case study", description: "Brief, idea, execution and results - with a video and a gallery.",
    blocks: () => [
      { id: uid(), type: "callout", text: t("Client · Category · Year"), tone: "accent" },
      h2("The brief"),
      p("What the brand needed, and what stood in the way."),
      h2("The idea"),
      p("The thought that unlocked it."),
      { id: uid(), type: "video", url: "", caption: "" },
      h2("The execution"),
      p("How it came to life, and where."),
      { id: uid(), type: "gallery", images: [] },
      h2("The results"),
      { id: uid(), type: "ul", items: [t("A number that moved"), t("Another one"), t("What people said")] },
      { id: uid(), type: "button", label: "See more work", href: "/work" },
    ],
  },
  {
    id: "interview", name: "Interview", description: "A short intro, then question and answer pairs.",
    blocks: () => [
      { id: uid(), type: "imgText", src: "", alt: "", text: t("Who we spoke to, and why."), side: "left" },
      ...[1, 2, 3].flatMap(() => [h3("The question?"), p("The answer.")]),
      { id: uid(), type: "quote", text: t("The line that sums them up."), cite: "Their name" },
    ],
  },
  {
    id: "announcement", name: "Announcement", description: "News in brief: headline point, details, one button.",
    blocks: () => [
      { id: uid(), type: "img", src: "", alt: "", caption: "", size: "full" },
      p("The news, in one paragraph."),
      h2("The details"),
      { id: uid(), type: "ul", items: [t("What"), t("When"), t("Where")] },
      { id: uid(), type: "button", label: "Find out more", href: "" },
    ],
  },
];
