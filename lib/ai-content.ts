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
  lines: ["The machine can make it.", "It still can't mean it."],
  lede:
    "Everything below was made with AI. None of it was decided by one. That distinction is the whole page - it takes about a minute.",
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

   ---- this is the client's own copy, and it is final ----

   Delivered as one block of prose. The only thing done to it here is
   punctuation: every em dash in the original has been replaced with the
   mark the sentence was already using anyway (a colon where the clause
   explains, commas where it interrupts), because the em dash reads as a
   machine's favourite piece of punctuation and this is a page arguing
   the opposite. No word has been changed, added or dropped.

   The opening sentence is set as the heading rather than as the first
   paragraph - it is the hook, it is one line long, and the display face
   is what it was written for. It is not repeated in the body.

   The breaks are the paragraph breaks of the original. `lift` marks the
   two lines that stop narrating and start arguing; the styling for it is
   in app/ai-work/ai.css.
   ------------------------------------------------------------------ */
export const ASHOK = {
  title: "Ashok didn't sleep the night ChatGPT Go dropped.",
  /* The portrait. It is not an illustration sitting beside the story, it
     is the man the story is about, set into the column and faded out at
     the edges so the page keeps reading as one thing - see the note in
     components/AiStory.tsx. */
  figure: {
    src: "/assets/SC%20Website%20Revamp/05.%20AI%20work/Ashok.png",
    alt: "Ashok, in a suit and sunglasses, phone in hand, surrounded by floating dashboards, charts and sticky notes.",
  },
  beats: [
    {
      copy:
        "By Monday, he'd put his agency on PIP. “AI's here. Why are we paying them ₹6 lakhs a month when my team with Go can get it done on their own?”",
    },
    {
      copy:
        "Fast-forward 60 days. The internal team proudly delivers a ‘content calendar’: twelve posts, one strategy deck, and a three-page Google Doc of ‘AI-generated campaign ideas.’ The CFO is thrilled. “Look at this cost-saving.”",
    },
    {
      copy:
        "Until the strategy lead walks in with a new ‘urgent’ brief: a high-gloss ₹10 lakh shoot needed in ten days to save the next launch.",
    },
    {
      copy:
        "Ashok stares at the plan in silence. The captions sound like a first-year intern wrote them. The mood boards are Pinterest rejects. That competitor that used to lag behind? Already eating into Gozo's market share.",
    },
    {
      lift: true,
      copy:
        "Here's the thing about AI nobody says out loud: yes, it's cheap. Yes, it's fast. But cheap and fast without taste, insight, and strategy is just noise. That's where we come in.",
    },
    {
      copy:
        "We've used these same tools, but with sharper strategy, better taste, and faster workflows, to create CGI, videos, and campaigns that look like Paris studios but move at Indian startup speed.",
    },
    {
      copy:
        "Havmor scaled campaigns 3x faster, at a fraction of the cost. Belgian got visuals that outperformed paid spends without a single physical shoot. Lindor turned around ideas in a week that usually take months.",
    },
    {
      copy:
        "Ashok's team? Still stuck asking the AI for ‘quirky caption ideas.’ Gozo? Still losing share. And Ashok? Quietly posting: looking for agencies. Yet again.",
    },
    {
      lift: true,
      copy:
        "Because by now we all know, and so does Ashok, that AI is not a replacement. But with the right hands, it's a multiplier.",
    },
  ] as readonly { copy: string; lift?: boolean }[],
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
