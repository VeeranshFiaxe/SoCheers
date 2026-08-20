/* ============================================================
   THE WORK TAB - everything it says, in one place.

   Two sections and a case template, and they need three different
   shapes of data:

     PINNED    - the five the agency wants seen first, each one a
                 hand-written entry with a hero frame and a line.
     ASSETS    - the browse wall. A flat list, tag-driven, and shaped
                 like the Cloudinary response that will replace it.
     CASES     - the per-case pages, as a list of blocks rather than a
                 set of named slots. See the note over CaseBlock.

   ---- what is real here and what is not ----

   The five pinned campaign names are real and come from the client. The
   brand list on the browse wall is real. Everything else - every line of
   copy, every year, every image - is a stand-in. The client's own asset
   folders (public/assets/SC Website Revamp/03. Work/) are in the repo and
   are empty: BFSI, FMCG, Entertainment, B2B_ and Pinned Work_ all exist
   with nothing in them, which is a useful confirmation of the categories
   and no help at all with the pictures.

   Everything marked PENDING swaps out without touching a component.
   ============================================================ */

/* ------------------------------------------------------------------
   The filter set. Confirmed with the client, in this order, and "All"
   is a real member rather than a special case in the UI.

   `tag` is what the asset carries and what Cloudinary will be tagged
   with at upload - deliberately not the label, because a label with an
   ampersand and spaces in it is a bad tag and a worse URL.
   ------------------------------------------------------------------ */
export const WORK_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bfsi", label: "BFSI" },
  { id: "fmcg", label: "FMCG" },
  { id: "fashion", label: "Fashion & Beauty" },
  { id: "entertainment", label: "Entertainment" },
  { id: "b2b", label: "B2B" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

export type CategoryId = (typeof WORK_CATEGORIES)[number]["id"];

/* Tag -> label, for the tile captions. The wall reads tags because the
   CDN sends tags, but "fashion" is not what a card should say under a
   brand name, and an asset carrying a tag nobody planned a filter for
   gets its own tag back rather than nothing - a card with a blank
   category row is worse than one naming a category we forgot. */
const CAT_LABEL = new Map<string, string>(
  WORK_CATEGORIES.map((c) => [c.id, c.label]),
);
export const catLabel = (tag: string) => CAT_LABEL.get(tag) ?? tag;

/* How long each pinned frame holds before the stage moves itself on.
   Six seconds: long enough to read the brand, the credits row and the
   line under them at a glance, which is the most this composition asks
   anyone to do, and short enough that all five have had their turn
   before a reader who is going to scroll has scrolled.

   It lives here rather than in the component because it is a pacing
   decision the client will have an opinion about, and this file is
   where every other such decision on the Work tab already is. */
export const PINNED_DWELL = 6000;

/* ------------------------------------------------------------------
   SECTION A - the pinned stage.

   The reference is the Filmhunt detail screen, and it is the first thing
   on the page: the frame fills the opening screen, and the title, the
   credits and the rail of other work all sit *on* it. There is no copy
   section above it - the work is what opens the page.

   The fields below are that screen's information, one for one:

     tags     the genre row      DRAMA | ROMANCE | SCI-FI
     brand    the title          "Her"
     year     + credits          2013 | DIRECTOR: ... | STARS: ...
     line     the synopsis
     thumb    the poster wall    "PEOPLE ALSO LIKED"

   The one thing that does not carry over is the rating. The client was
   explicit that it becomes campaign metadata instead, and they are right
   - a score on agency work is a number nobody awarded, and inventing the
   furniture of a review site makes the real facts beside it look
   invented too. Nothing here replaces it; the row simply is not there.

   `line` is the two-to-three lines the brief allows. It is short on
   purpose and it gets shorter the more recognisable the brand is - the
   client's own framing, and correct: a Netflix frame does not need to
   be introduced.
   ------------------------------------------------------------------ */
export type PinnedCase = {
  slug: string;
  /* The big line on the frame - where the reference has the film's title,
     this has the brand. "Netflix × MI" is the thing a reader recognises;
     the campaign's own name is a credit, not a headline. */
  brand: string;
  title: string;
  /* the genre row - "DRAMA | ROMANCE | SCI-FI" in the reference. Category
     and formats, which is the same job: what kind of thing am I looking
     at, answered before the title is read. */
  tags: string[];
  year: string;
  /* "DIRECTOR: ... STARS: ..." - the labelled credits under the title.
     A list rather than fixed fields because not every case has the same
     ones, and a case with two credits should not render three with a
     blank in it. */
  credits: { label: string; value: string }[];
  line: string;
  hero: string;
  /* The rail frame - portrait, like the poster wall in the reference. A
     different crop of the same campaign where one exists: a rail of the
     hero images scaled down is a rail of unreadable wide shots. */
  thumb: string;
  pending?: boolean;
};

/* The five are the client's. The copy, the metadata and every image are
   PENDING - the client is sending final lines separately, in this shape:
   "This was the campaign we did with ___." */
export const PINNED: PinnedCase[] = [
  {
    slug: "netflix-mi",
    brand: "Netflix × MI",
    title: "PENDING - campaign title",
    tags: ["Entertainment", "Film", "Social"],
    year: "PENDING",
    credits: [
      { label: "Client", value: "Netflix × Mumbai Indians" },
      { label: "Scope", value: "PENDING - scope" },
    ],
    line: "PENDING - two or three lines on what this was. Placeholder set to the length the real line should run to, so the layout is proven at the right measure.",
    hero: "/assets/work-entertainment.png",
    thumb: "/assets/series/reel-1.jpg",
    pending: true,
  },
  {
    slug: "titan-made-in-india",
    brand: "Titan",
    title: "Made in India",
    tags: ["Lifestyle", "Film", "Social"],
    year: "PENDING",
    credits: [
      { label: "Client", value: "Titan" },
      { label: "Scope", value: "PENDING - scope" },
    ],
    line: "PENDING - two or three lines on what this was. Placeholder set to the length the real line should run to, so the layout is proven at the right measure.",
    hero: "/assets/work-lifestyle.jpg",
    thumb: "/assets/series/reel-2.jpg",
    pending: true,
  },
  {
    slug: "broadway-bombay",
    brand: "Broadway",
    title: "Broadway Bombay",
    tags: ["Lifestyle", "Content", "Social"],
    year: "PENDING",
    credits: [
      { label: "Client", value: "Broadway" },
      { label: "Scope", value: "PENDING - scope" },
    ],
    line: "PENDING - two or three lines on what this was. Placeholder set to the length the real line should run to, so the layout is proven at the right measure.",
    hero: "/assets/series/open-wide.jpg",
    thumb: "/assets/series/reel-3.jpg",
    pending: true,
  },
  {
    slug: "odyssey",
    brand: "Odyssey",
    title: "PENDING - campaign title",
    tags: ["Lifestyle", "Campaign"],
    year: "PENDING",
    credits: [
      { label: "Client", value: "Odyssey" },
      { label: "Scope", value: "PENDING - scope" },
    ],
    line: "PENDING - two or three lines on what this was. Placeholder set to the length the real line should run to, so the layout is proven at the right measure.",
    hero: "/assets/brain-DH7sqVir.jpg",
    thumb: "/assets/series/mokai-2.jpg",
    pending: true,
  },
  {
    slug: "pantaloons-eoss",
    brand: "Pantaloons",
    title: "EOSS",
    tags: ["Fashion & Beauty", "Campaign", "Social"],
    year: "PENDING",
    credits: [
      { label: "Client", value: "Pantaloons" },
      { label: "Scope", value: "PENDING - scope" },
    ],
    line: "PENDING - two or three lines on what this was. Placeholder set to the length the real line should run to, so the layout is proven at the right measure.",
    hero: "/assets/photoshop-face-BOtm4GGN.jpg",
    thumb: "/assets/series/mokai-3.jpg",
    pending: true,
  },
];

/* ------------------------------------------------------------------
   SECTION B - the browse wall.

   ---- why this is a flat tagged list and not a category map ----

   The obvious model is { bfsi: [...], fmcg: [...] } and it is the wrong
   one here, because it is not the model the CDN has. Assets get their
   categories from tags set at upload time, one asset can carry more than
   one, and the frontend is meant to read those tags rather than hold its
   own copy of the mapping. A nested object would have to be flattened
   back out the day the fetch goes live, and until then it quietly
   invites the bug where an asset is filed under a category that its tag
   does not agree with.

   So: flat, and `tags` is the truth. Categories are derived from it.

   `publicId` is what Cloudinary will call the asset. It is carried now,
   unused, so that the switch to live data is a change of source and not
   a change of shape - see lib/work-data.ts.
   ------------------------------------------------------------------ */
export type WorkAsset = {
  publicId: string;
  brand: string;
  title: string;
  kind: "image" | "video";
  thumb: string;
  w: number;
  h: number;
  tags: string[];
  /* set when the campaign has a case page; the tile becomes a link */
  slug?: string;
  pending?: boolean;
};

/* PENDING ASSETS - the brands are the client's real list, mapped to the
   confirmed categories. The images are repo placeholders cycled so that
   both orientations and a range of aspect ratios are exercised.

   Four of these are flagged in the brief as not having a clean category:
   Croma, Carlton and Cordelia Cruises are filed under Lifestyle, and TCS
   and Cipla Innoventia under B2B. That is a judgement call, not the
   client's instruction - worth putting in front of them, because it is
   one tag per asset to change and it decides which filter they appear
   under. */
const P = [
  "/assets/work-bfsi.png",
  "/assets/work-entertainment.png",
  "/assets/work-lifestyle.jpg",
  "/assets/work-b2b.png",
  "/assets/boot-phone-BJcXYlVw.jpg",
  "/assets/photoshop-face-BOtm4GGN.jpg",
  "/assets/brain-DH7sqVir.jpg",
  "/assets/arri-camera-DX29MVBW.jpg",
];
const SHAPES: [number, number][] = [
  [1200, 1500], [1600, 900], [1200, 1200], [1012, 1800], [1600, 1000],
];

const brand = (
  i: number,
  name: string,
  tag: string,
  kind: "image" | "video" = "image",
): WorkAsset => {
  const [w, h] = SHAPES[i % SHAPES.length];
  return {
    publicId: `work/${tag}/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    brand: name,
    title: "PENDING - campaign",
    kind,
    thumb: P[i % P.length],
    w, h,
    tags: [tag],
    pending: true,
  };
};

export const WORK_ASSETS: WorkAsset[] = [
  /* BFSI */
  brand(0, "Yes Bank", "bfsi"),
  brand(1, "IndusInd", "bfsi", "video"),
  brand(2, "BHIM UPI", "bfsi"),
  brand(3, "Zurich Kotak", "bfsi"),
  /* FMCG */
  brand(4, "Belgian Waffle", "fmcg"),
  brand(5, "Prava", "fmcg"),
  brand(6, "ITC", "fmcg", "video"),
  brand(7, "Havmor", "fmcg"),
  brand(8, "Tata Soulfull", "fmcg"),
  brand(9, "Yippee", "fmcg"),
  /* Fashion & Beauty */
  brand(10, "Superdry", "fashion"),
  brand(11, "Raymond", "fashion", "video"),
  brand(12, "Wacoal", "fashion"),
  brand(13, "Nykaa", "fashion"),
  /* Entertainment */
  brand(14, "Netflix · Maa Behen", "entertainment", "video"),
  brand(15, "Ab Hoga Hissab", "entertainment"),
  brand(16, "JioHotstar", "entertainment", "video"),
  brand(17, "Family Man × Alexa", "entertainment"),
  /* B2B - category assigned by us, see the note above */
  brand(18, "TCS", "b2b"),
  brand(19, "Cipla Innoventia", "b2b"),
  /* Lifestyle - same caveat */
  brand(20, "Croma", "lifestyle", "video"),
  brand(21, "Carlton", "lifestyle"),
  brand(22, "Cordelia Cruises", "lifestyle"),
];

/* ------------------------------------------------------------------
   THE CASE TEMPLATE, and the one rule that shaped it.

   The client's hard requirement: every case runs the same template, the
   assets that exist per case differ wildly, and a case missing a video
   or a case board must never leave a hole where one would have been.

   A template built from named slots cannot honour that. Give it
   `hero`, `board`, `video` and `gallery` fields and every page is a form
   with blanks in it - you end up writing `{video && ...}` at each slot,
   the surrounding margins collapse unevenly, and the page that has three
   of the five assets reads as the page that is missing two.

   So a case is not a set of slots. It is an ordered list of blocks, and
   absence is not represented at all: a case with no video simply has no
   video block, the list is shorter, and nothing above or below it knows
   the difference. Reflow is not a behaviour anybody had to implement -
   it is what a list does.

   Layout rhythm follows the reference the client gave
   (cardboard-spaceship.com/portfolio/vyepti) - one narrative column with
   full-bleed visuals breaking out of it - not its content.
   ------------------------------------------------------------------ */
export type CaseBlock =
  | { type: "copy"; heading?: string; body: string }
  | { type: "image"; src: string; w: number; h: number; caption?: string; bleed?: boolean }
  | { type: "duo"; a: string; b: string; caption?: string }
  | { type: "video"; src: string; poster: string; caption?: string }
  | { type: "board"; src: string; w: number; h: number; caption?: string }
  | { type: "stats"; items: { figure: string; label: string }[] }
  | { type: "quote"; text: string; who: string };

export type CaseStudy = {
  slug: string;
  brand: string;
  title: string;
  /* the row under the title - same idea as PinnedCase.meta */
  meta: string[];
  intro: string;
  /* The opening frame. The reference opens every case on the work
     itself at full width with the title sitting on it, and that is the
     one thing a case page cannot be missing - unlike a board or a set
     of numbers, there is no version of this page that reads as finished
     without a picture at the top. So it is required, not optional. */
  hero: string;
  /* Set when the case has a film. It turns the hero into the poster for
     it and puts the one action on the frame; without it the hero is a
     still and there is no button, which is the same absence rule the
     block list follows. */
  film?: string;
  blocks: CaseBlock[];
  pending?: boolean;
};

/* PENDING - one worked example so the template can be reviewed, plus
   thin entries for the other four. The point of the thin ones is not
   laziness: they are deliberately different lengths and carry different
   block types, because the only way to prove an asset-count-agnostic
   template is to look at a case that has almost nothing in it next to
   one that has everything.

   `netflix-mi` has the full set. `odyssey` has copy and two images and
   nothing else - no board, no video, no stats - and it should read as a
   complete page rather than as a damaged one. */
const LOREM =
  "PENDING - the write-up for this section. Set to roughly the length the real copy should run so the column measure and the rhythm between visuals can be judged now rather than after the content sheet lands.";

export const CASES: CaseStudy[] = [
  {
    slug: "netflix-mi",
    brand: "Netflix × MI",
    title: "PENDING - campaign title",
    meta: ["PENDING", "Entertainment", "Film · Social"],
    intro: LOREM,
    hero: "/assets/work-entertainment.png",
    film: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4",
    pending: true,
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "copy", heading: "The challenge", body: LOREM },
      { type: "duo", a: "/assets/series/kink.jpg", b: "/assets/series/binge.jpg", caption: "PENDING - caption" },
      { type: "copy", heading: "Our approach", body: LOREM },
      { type: "image", src: "/assets/work-entertainment.png", w: 1600, h: 900, bleed: true, caption: "PENDING - caption" },
      { type: "copy", heading: "The execution", body: LOREM },
      { type: "video", src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/streaming.jpg", caption: "PENDING - the case film" },
      { type: "board", src: "/assets/series/close-band.jpg", w: 1252, h: 495, caption: "PENDING - the case board" },
      { type: "copy", heading: "The outcome", body: LOREM },
      { type: "stats", items: [
        { figure: "00M", label: "PENDING - reach" },
        { figure: "00%", label: "PENDING - engagement" },
        { figure: "00K", label: "PENDING - shares" },
      ] },
      { type: "quote", text: "PENDING - a line from the client or the press.", who: "PENDING - attribution" },
    ],
  },
  {
    slug: "titan-made-in-india",
    brand: "Titan",
    title: "Made in India",
    meta: ["PENDING", "Lifestyle", "Film · Social"],
    intro: LOREM,
    hero: "/assets/work-lifestyle.jpg",
    film: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4",
    pending: true,
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "copy", heading: "The challenge", body: LOREM },
      { type: "image", src: "/assets/work-lifestyle.jpg", w: 1600, h: 1000, bleed: true },
      { type: "copy", heading: "Our approach", body: LOREM },
      { type: "video", src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/wardrobe.jpg" },
      { type: "copy", heading: "The outcome", body: LOREM },
      { type: "stats", items: [
        { figure: "00M", label: "PENDING - reach" },
        { figure: "00%", label: "PENDING - engagement" },
      ] },
    ],
  },
  {
    slug: "broadway-bombay",
    brand: "Broadway",
    title: "Broadway Bombay",
    meta: ["PENDING", "Lifestyle", "Content · Social"],
    intro: LOREM,
    hero: "/assets/series/open-wide.jpg",
    pending: true,
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "copy", heading: "The challenge", body: LOREM },
      { type: "duo", a: "/assets/series/open-wide.jpg", b: "/assets/series/night-scroll.jpg" },
      { type: "copy", heading: "Our approach", body: LOREM },
      { type: "board", src: "/assets/series/close-band.jpg", w: 1252, h: 495 },
    ],
  },
  {
    /* the deliberately thin one - no board, no video, no stats, no
       quote, and only two headings, so the sidebar's contents list is
       proved at the length where it stops being worth having. If this
       page reads as finished, the template works. */
    slug: "odyssey",
    brand: "Odyssey",
    title: "PENDING - campaign title",
    meta: ["PENDING", "Lifestyle", "Campaign"],
    intro: LOREM,
    hero: "/assets/brain-DH7sqVir.jpg",
    pending: true,
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "image", src: "/assets/brain-DH7sqVir.jpg", w: 1600, h: 900, bleed: true },
      { type: "copy", heading: "The challenge", body: LOREM },
    ],
  },
  {
    slug: "pantaloons-eoss",
    brand: "Pantaloons",
    title: "EOSS",
    meta: ["PENDING", "Fashion & Beauty", "Campaign · Social"],
    intro: LOREM,
    hero: "/assets/photoshop-face-BOtm4GGN.jpg",
    pending: true,
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "copy", heading: "The challenge", body: LOREM },
      { type: "image", src: "/assets/photoshop-face-BOtm4GGN.jpg", w: 1200, h: 1500 },
      { type: "copy", heading: "Our approach", body: LOREM },
      { type: "duo", a: "/assets/series/mokai-2.jpg", b: "/assets/series/mokai-3.jpg" },
      { type: "copy", heading: "The outcome", body: LOREM },
      { type: "quote", text: "PENDING - a line from the client or the press.", who: "PENDING - attribution" },
    ],
  },
];

/* The sidebar that rides alongside a case, and the only two lines on it
   that are not the case's own headings. The contents list is built from
   the copy blocks at render time rather than written per case - a
   hand-kept list of anchors is a list that goes stale the first time
   somebody reorders the blocks. */
export const CASE_NAV = {
  back: "All work",
  contents: "Navigation",
  cta: "Start a project",
} as const;

export const findCase = (slug: string) => CASES.find((c) => c.slug === slug);

/* The contents list for the rail, derived from the blocks rather than
   written out. The id is the block's own index and not a counter over
   the headings, so it stays the same rule in both places that need it -
   here and in the renderer - and neither has to know how many headings
   came before it. */
export const caseHeadings = (blocks: CaseBlock[]) =>
  blocks.flatMap((b, i) =>
    b.type === "copy" && b.heading
      ? [{ id: `heading-${i}`, label: b.heading }]
      : [],
  );

/* The copy hero this page used to open with is gone - the stage is the
   first thing on the page now and the work introduces itself. What was
   the hero's eyebrow and lede survives as the browse wall's heading,
   which is the one place on the page that still needs a sentence. */
export const WORK_BROWSE = {
  eyebrow: "Everything else",
  title: "By the room it was made for.",
  /* The count under the filter. It is a live number rather than a
     sentence about how much work there is, which is the one thing a
     filtered wall owes the reader: a tab that returns four things
     should say four before they have to count the tiles. */
  count: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"} of work`,
} as const;
