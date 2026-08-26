/* ============================================================
   THE AI WORK TAB - everything it says, in one place.

   ---- a caveat that belongs at the top ----

   Unlike Series, this page has no deck behind it. Everything below is
   built from call notes only; the shared content PDF carried no AI Work
   section at all. So the *structure* here is the client's (the hero,
   the postscript, the four segments) and the *words* are a stand-in
   written to the right length and tone, with the exception of the
   postscript itself, which is the client's own line. Confirm a written
   spec exists somewhere before any of this copy is treated as final.

   ============================================================ */

/* ------------------------------------------------------------------
   The hero's noise.

   The reference the client sent is an illustration of a man standing
   under a swarm of speech bubbles in five languages, all of them
   shouting at him at once. What it is actually drawing is the state of
   having too many ideas arriving and no way to choose between them -
   which is this page's argument, so the treatment is kept and the
   foreign type is not: every bubble here is a thing somebody says to a
   generator, or about one, in English.

   The whole field is aria-hidden and set as a graphic. A screen reader
   reading twenty disconnected words over the headline is the audio
   version of the picture, and not in a good way.

   Each bubble carries its own place in the field (x/y as percentages of
   it), a scale, a rotation and a tone. They are written here rather than
   generated because the composition is a composition: the field covers
   the whole hero, so the fan has to open out of the figure's head, climb
   the full width, and leave the bottom-left corner - where the headline
   is - clear. None of that survives a shuffle.

     tone   'hot'  - the accent, and the loudest few
            'cream'- solid, mid-weight
            'ghost'- outline only, the ones furthest back
     depth  how far it moves with the cursor, 0 (pinned) to 1
     small  dropped below 900px, where there is no room for twenty
   ------------------------------------------------------------------ */
export type Thought = {
  word: string;
  x: number;
  y: number;
  s: number;
  r: number;
  tone: "hot" | "cream" | "ghost";
  depth: number;
  small?: boolean;
};

export const AI_THOUGHTS: Thought[] = [
  { word: "prompt", x: 8, y: 18, s: 0.9, r: 7, tone: "ghost", depth: 0.35, small: true },
  { word: "style frame", x: 26, y: 11, s: 0.8, r: 6, tone: "ghost", depth: 0.25, small: true },
  { word: "make it move", x: 17, y: 33, s: 1.0, r: -6, tone: "cream", depth: 0.9 },
  { word: "storyboard", x: 41, y: 21, s: 0.9, r: -3, tone: "ghost", depth: 0.35, small: true },
  { word: "render it", x: 51, y: 7, s: 1.05, r: 6, tone: "cream", depth: 0.8 },
  { word: "again", x: 6, y: 51, s: 0.85, r: 5, tone: "ghost", depth: 0.5, small: true },
  { word: "what if?", x: 34, y: 45, s: 1.15, r: 4, tone: "hot", depth: 1 },
  { word: "upscale", x: 70, y: 13, s: 0.85, r: 4, tone: "ghost", depth: 0.4, small: true },
  { word: "more human", x: 62, y: 31, s: 1.1, r: 3, tone: "hot", depth: 0.95 },
  { word: "why this?", x: 87, y: 27, s: 1.05, r: 5, tone: "hot", depth: 0.85 },
  { word: "seed 4471", x: 13, y: 67, s: 0.8, r: -4, tone: "ghost", depth: 0.3, small: true },
  { word: "iterate", x: 46, y: 61, s: 0.85, r: -3, tone: "ghost", depth: 0.45, small: true },
  { word: "sharper", x: 57, y: 51, s: 0.95, r: -5, tone: "ghost", depth: 0.6, small: true },
  { word: "not that", x: 79, y: 44, s: 0.9, r: -7, tone: "cream", depth: 0.55 },
  { word: "cut it", x: 93, y: 57, s: 0.9, r: 4, tone: "ghost", depth: 0.65, small: true },
  { word: "one more", x: 72, y: 66, s: 0.95, r: -4, tone: "cream", depth: 0.7 },
  { word: "again", x: 85, y: 78, s: 0.8, r: -6, tone: "ghost", depth: 0.3, small: true },
  { word: "who's it for?", x: 61, y: 81, s: 1.0, r: -2, tone: "hot", depth: 0.75 },
];

export const AI_HERO = {
  eyebrow: "AI work",
  /* The client's own line, and it is the headline now rather than a
     postscript under it. It used to read "The machine can make it. / It
     still can't mean it." with this sentence set as an aside between the
     hero and the grid; the aside is gone (there is no AI_PS any more)
     and the words that were in it say the same thing in the client's
     voice, so they are the claim the page opens on. Verbatim, less the
     "PS :" the old placement needed.

     Split in two because the second sentence takes the accent italic,
     and the break between them is a decision rather than a wrap. */
  lines: ["The ideas still come from us.", "The speed just comes from somewhere else."],
  lede:
    "Everything below was made with AI. None of it was decided by one. That distinction is the whole page - it takes about a minute.",
  /* The figure the bubbles come out of. It was a drawn SVG silhouette
     for one revision - a head-and-shoulders shape standing in for the
     client's reference - and this is the client's own artwork replacing
     it: a person under a stack of CRTs, every screen showing a piece of
     what the machine is being asked for. It says the page's argument
     better than a silhouette did, and it arrives already carrying the
     green.

     Delivered as a clean cut-out on transparency, so it is placed rather
     than composited - no blend mode, no edge to hide. See the note over
     .ai-stage__man in app/ai-work/ai.css for how it is stood in the
     hero. */
  figure: {
    src: "/assets/SC%20Website%20Revamp/05.%20AI%20work/AI%20work%20visual.png",
    w: 1137,
    h: 1383,
  },
} as const;

/* The postscript is gone.

   There used to be one line between the hero and the work - the client's
   "PS : The ideas still come from us. The speed just comes from somewhere
   else." - set as an aside under a headline that said the same thing in
   the site's voice. Two goes at one argument, and the page's measure is
   under a minute end to end. The client's sentence won: it is AI_HERO's
   headline above, and the section it used to fill (components/AiPs.tsx)
   no longer exists. The page runs hero -> work.
   ------------------------------------------------------------------ */


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
   mix of vertical and horizontal and the tiles are not uniform.

   ---- and the list itself is generated ----

   The delivery is 100 files across three folders, a third of them
   duplicates and all of them named off somebody's timeline. It is read,
   deduplicated and re-encoded by scripts/build-ai-work.mjs into
   lib/ai-work-data.ts, which is what the grid imports. Re-run that
   script rather than editing the list; the one thing kept by hand there
   is the handful of titles a filename could not answer.
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
  /* empty when the delivery never said whose it was - the tile leaves
     the line out rather than guessing at an attribution */
  brand: string;
  /* the still for a static, the film itself for a video or a CGI piece */
  src: string;
  /* the frame a film shows before it is asked to play. There is no
     encoder in this repo and the client asked for a chosen frame per
     film rather than an auto-generated one, so films currently have
     none and the tile is typographic until it is played - see the note
     in components/AiGrid.tsx. */
  poster?: string;
  w: number;
  h: number;
  /* what the Cloudinary upload will carry; the grid filters on these */
  tags: string[];
};

/* The list itself lives next door, generated - see the note above. It is
   re-exported here so that lib/ai-content.ts stays the one import the
   page needs, and so that swapping the generated file for a Cloudinary
   fetch later changes nothing in components/AiGrid.tsx. */
export { AI_WORK } from "./ai-work-data";
