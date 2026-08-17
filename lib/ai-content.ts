/* ============================================================
   THE AI WORK TAB - everything it says, in one place.

   ---- a caveat that belongs at the top ----

   Unlike Series, this page has no deck behind it. Everything below is
   built from call notes only; the shared content PDF carried no AI Work
   section at all. So the *structure* here is the client's (the entry
   choice, the Ashok story, the four segments) and the *words* are a
   stand-in written to the right length and tone. Confirm a written spec
   exists somewhere before any of this copy is treated as final.

   ---- the thing the story must not do ----

   The client was clear twice over: Ashok is not a joke at a brand's
   expense. He is the reasonable version of a real decision - the tools
   genuinely did get good, and hiring nobody genuinely was the obvious
   read. The story only works if the reader can imagine making the same
   call. The moment it reads as "look at this idiot", it argues for the
   agency by insulting the person deciding whether to hire one.

   Their own draft intro line ("you read a little funny story before you
   see the work") was flagged by them as too casual and is being replaced
   on their side, so nothing here leans on it.
   ============================================================ */

export const AI_HERO = {
  eyebrow: "AI work",
  /* The visual reference on the call was a Japanese-language treatment -
     used here as look and feel only. The kana is set as a graphic
     element beside the English, never as the thing carrying meaning, and
     it is aria-hidden in the markup: a screen reader announcing Japanese
     characters in an English sentence is noise, and a decorative script
     nobody on the team can proof is not somewhere to put content. */
  kana: "人工知能",
  lines: ["The machine can make it.", "It still can't mean it."],
  lede:
    "Everything below was made with AI. None of it was decided by one. That distinction is the whole page - it takes about a minute.",
  runtime: "1 min read",
} as const;

/* The fork. Two doors, and the brief is specific that the funny one is
   optional rather than the way in - a reader who came to see the work
   should not have to read a parable to get to it. */
export const AI_GATE = {
  question: "Before the work, there's a short story about a man called Ashok.",
  yes: "Yes, I'm up for a little giggle",
  no: "No, I'd rather see the work now",
} as const;

/* ------------------------------------------------------------------
   The Ashok story.

   Six beats, told in the second person about someone else - short enough
   that the reader never has to decide whether to keep going. PENDING:
   final copy from the client's team, who are rewriting their own intro
   line. The beat count and the length per beat are the spec; the
   sentences are a stand-in.
   ------------------------------------------------------------------ */
export const ASHOK = {
  title: "Ashok didn't need an agency.",
  beats: [
    {
      n: "01",
      copy:
        "Ashok runs marketing for a mid-sized brand you have definitely bought something from. In the winter of the year the tools got good, he sat in a demo and watched thirty seconds of finished film come out of a text box.",
    },
    {
      n: "02",
      copy:
        "He was not being reckless. He did the arithmetic that anyone in his chair would do: a retainer against a subscription, six weeks against an afternoon. The numbers were not close.",
    },
    {
      n: "03",
      copy:
        "So he thanked his agency, kept two people who were good with prompts, and started producing in-house. The first week was genuinely exhilarating. They shipped more in five days than the last quarter.",
    },
    {
      n: "04",
      copy:
        "Around day thirty, a competitor posted a film. Same light. Same drone push over the same coastline. Same voice reading a slightly different sentence. Ashok had not seen their work before it went up, and he could not have told you which of the two was his.",
    },
    {
      n: "05",
      copy:
        "The tools had not failed him. They had done exactly what he asked, and so had everyone else's. What was missing was never the making. It was the part before it - the argument about what this brand is for, and why it should sound like nobody else.",
    },
    {
      n: "06",
      copy:
        "He came back. Not for the cameras, and not for the software licence. For the room where somebody says: everyone can make this now, so we are not going to.",
    },
  ],
  /* After the story the reader is put back into the work rather than left
     at the bottom of a parable - the brief calls this out specifically. */
  out: {
    line: "That's the story. Here's the work.",
    label: "See the work",
  },
} as const;

/* ------------------------------------------------------------------
   The work itself.

   ---- why this file and not Cloudinary, yet ----

   The Work tab's grid is meant to read Cloudinary tags at request time
   rather than hardcode a category map, and the same will be true here.
   The account is not stood up yet, so this array is deliberately shaped
   like the response that will replace it: a flat list of assets, each
   carrying its own `tags`, with the segments below derived from the tags
   rather than the other way round. When the CDN is live, this export
   becomes a fetch and nothing in components/AiGrid.tsx changes.

   `kind` is the segment. `w`/`h` are the asset's own pixels - the grid
   needs the real aspect ratio at render time because the assets are a
   mix of vertical and horizontal and the tiles are not uniform. A video
   without a `thumb` is a bug rather than a fallback: the client asked
   for a custom frame per film, not an auto-generated one.
   ------------------------------------------------------------------ */
export const AI_SEGMENTS = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "static", label: "Static" },
  { id: "cgi", label: "CGI" },
] as const;

export type SegmentId = (typeof AI_SEGMENTS)[number]["id"];

export type AiAsset = {
  id: string;
  kind: Exclude<SegmentId, "all">;
  title: string;
  brand: string;
  /* the still the tile shows. For a video this is the custom thumbnail,
     which is a deliverable per film and not a frame grab. */
  thumb: string;
  w: number;
  h: number;
  /* what the Cloudinary upload will carry; the grid filters on these */
  tags: string[];
  pending?: boolean;
};

/* PENDING CLIENT ASSETS - every entry below is a placeholder pointing at
   stills already in the repo, sized to exercise both orientations and
   both extremes of aspect ratio so the tiling is proven before the real
   mix arrives. Replace wholesale; do not edit in place. */
export const AI_WORK: AiAsset[] = [
  { id: "a1", kind: "video",  title: "PENDING - film title",   brand: "PENDING", thumb: "/assets/series/reel-1.jpg",     w: 1012, h: 1800, tags: ["video"], pending: true },
  { id: "a2", kind: "cgi",    title: "PENDING - CGI piece",    brand: "PENDING", thumb: "/assets/series/kink.jpg",       w: 1800, h: 1013, tags: ["cgi"], pending: true },
  { id: "a3", kind: "static", title: "PENDING - key visual",   brand: "PENDING", thumb: "/assets/work-bfsi.png",         w: 1200, h: 1200, tags: ["static"], pending: true },
  { id: "a4", kind: "video",  title: "PENDING - film title",   brand: "PENDING", thumb: "/assets/series/reel-2.jpg",     w: 1012, h: 1800, tags: ["video"], pending: true },
  { id: "a5", kind: "static", title: "PENDING - key visual",   brand: "PENDING", thumb: "/assets/series/streaming.jpg",  w: 1344, h: 756,  tags: ["static"], pending: true },
  { id: "a6", kind: "cgi",    title: "PENDING - CGI piece",    brand: "PENDING", thumb: "/assets/series/mokai-2.jpg",    w: 648,  h: 1152, tags: ["cgi"], pending: true },
  { id: "a7", kind: "video",  title: "PENDING - film title",   brand: "PENDING", thumb: "/assets/series/open-wide.jpg",  w: 1800, h: 1200, tags: ["video"], pending: true },
  { id: "a8", kind: "static", title: "PENDING - key visual",   brand: "PENDING", thumb: "/assets/work-entertainment.png",w: 1200, h: 900,  tags: ["static"], pending: true },
  { id: "a9", kind: "video",  title: "PENDING - film title",   brand: "PENDING", thumb: "/assets/series/reel-3.jpg",     w: 1012, h: 1800, tags: ["video"], pending: true },
  { id: "a10", kind: "cgi",   title: "PENDING - CGI piece",    brand: "PENDING", thumb: "/assets/series/close-band.jpg", w: 1252, h: 495,  tags: ["cgi"], pending: true },
  { id: "a11", kind: "static",title: "PENDING - key visual",   brand: "PENDING", thumb: "/assets/work-b2b.png",          w: 1200, h: 1500, tags: ["static"], pending: true },
  { id: "a12", kind: "video", title: "PENDING - film title",   brand: "PENDING", thumb: "/assets/series/wardrobe.jpg",   w: 1280, h: 780,  tags: ["video"], pending: true },
];
