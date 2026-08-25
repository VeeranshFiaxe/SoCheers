/* ============================================================
   THE DECK TAB - "The Continuity Kink", ported slide for slide.

   Same one-file-per-route convention as lib/series-content.ts, and this
   is deliberately NOT that file. /series is the deck rewritten for a
   web page: fourteen beats, tightened sentences, the argument re-cut for
   a scroll. This is the deck itself - the client's own PowerPoint, in
   its own order, in its own words, put on the site so the two read as
   the same piece of work.

   ---- the source ----

   Downloads/The Continuity Kink.pdf. 20 slides, 1440x810, one full-bleed
   still per slide with the type set over it, and a hard orange plate on
   the title card. The stills are already in public/assets/series/ - they
   were lifted from this same PDF for the live tab - so this route adds
   exactly one file to the tree: retention.jpg, the woman lit by her own
   phone that slides 16 and 17 are built on, which the live tab never
   used and so was never pulled.

   ---- twenty slides, fourteen sections ----

   Six of the twenty are BUILDS: the same slide again with one more block
   of type on it. 8 builds on 7, 11 on 10, 13 on 12, 15 on 14, 19 on 18.
   A build is a click in the room and a scroll here, so the pair becomes
   one section whose `build` arrives as the reader travels through it.
   That is the only structural liberty taken with the deck, and it is
   taken because the alternative - two sections carrying the same
   photograph and the first three lines twice - is the deck's mechanic
   transcribed rather than translated.

   Fourteen sections is also, by coincidence, what /series runs. The two
   tabs are the same argument at the same length by two different routes.

   ---- the copy is the client's, to the character ----

   Nothing here is rewritten, retitled or tidied. That includes what
   looks like slips in the deck: "Ordinally" on slide 15, "it's" for
   "its" on slide 7, the space before the semicolon on slide 4, the
   double full stop on "unwanted noise..". They are quoted, not fixed -
   this is a port, and a port that silently corrects its source is a
   rewrite nobody asked for. If the client wants them changed they are
   changed here, in one place, and the page follows.

   The one thing that is dated rather than wrong: slide 4 says "in 2026"
   and slide 19 says "the first week of February" and "the rest of 2026".
   That is the deck's own pitch window, and it is left standing.
   ============================================================ */

export const DECK = {
  title: "The Continuity Kink",
  /* what the tab calls itself in the nav and in the rail */
  short: "Continuity Kink",
  /* the deck's page count, for the rail's denominator - the number of
     SLIDES, not of sections, because the rail is counting the deck */
  slides: 20,
} as const;

/* ------------------------------------------------------------------
   THE PLATES.

   Same two texture files the live tab grades with, read by the same
   names so the two pages cannot drift apart on grade. kink.jpg is a
   sheet of grain, streaming.jpg is a warm light leak, and neither is a
   photograph - see the note in lib/series-content.ts about what happened
   the first time they were wired up as frames.
   ------------------------------------------------------------------ */
export const PLATES = {
  grain: "kink.jpg",
  leak: "streaming.jpg",
} as const;

/* ------------------------------------------------------------------
   THE SLIDE.

   Every field maps to something that is actually on the PowerPoint. The
   deck has no layout system - each slide is type dropped on a picture -
   so this type is a description of where the type sits rather than a
   grid: `align` and `at` are the two axes a designer nudges on a slide,
   and everything else is a piece of furniture that appears on one or two
   slides and nowhere else.

     art      - the full-bleed still. Every slide has one except the end
                card, which is black in the deck too.
     align    - which edge the type block hangs off. The deck is mostly
                left, centres its three loudest cards, and hangs one off
                the right (slide 4).
     at       - where down the frame it sits. `mid` is the default.
     kicker   - the small line set immediately above the mark. Slides 10
                and 14 both do it; it is how the deck sets up a word it
                is about to shout.
     lines    - the sentence at slide scale. One entry per line BREAK in
                the deck, because where the deck breaks a line is a
                design decision and re-wrapping it loses the shape.
     mark     - the enormous one. `markScale` says how enormous.

     lead / body / foot - the reading-size paragraphs, in three slots
                rather than one, because the deck does not agree with
                itself about where they go. `lead` runs above the
                sentence (slide 16 opens on two quiet lines and then
                gets loud), `body` between the sentence and the mark
                (slide 6 walks you into CONTINUITY), `foot` under the
                mark (slide 9's "a noise emanating from...", slide 14's
                "Brooklyn Coffee Shop"). One `body` and a boolean would
                have been fewer fields and a worse description of what
                is on the slides.

                The whole column renders in that order and only in that
                order: kicker, lead, lines, body, mark, foot, build. No
                slide reorders it, because a slide that needed to would
                be a slide this file is describing wrongly.
     aside    - a second column. Two slides have one: slide 4's right-
                hand block, and Mokai's right half.
     build    - the next slide, when the next slide is this slide plus
                more type. Arrives on scroll - see build() in
                lib/deck-motion.ts.
     verticals- 9:16 frames laid across the picture. One slide has them:
                the three episode stills on the micro-series build.
     insets   - a rectangular still lifted over the ground, arriving with
                the build. The Mokai card's cafe interior.
     cutout   - the audience with the 3D glasses. It is on the title card
                and on the end card in the deck and nowhere in between,
                which is the deck's own bracket and worth keeping.
     plate    - the orange panel. Slide 1 only, and it is the single
                loudest thing in the whole file.
     band     - the torn paper strip. Slide 20 only.
     logo     - the SoCheers lockup. Slide 20 only.
     warm     - lays the leak over the composition. The deck warms up
                after the cure, same as the live tab does.
     pages    - which slide(s) of the PDF this section is. Drawn in the
                rail, so anyone holding the deck open next to the browser
                can see the two are in step.
   ------------------------------------------------------------------ */
export type Aside = {
  body?: string[];
  mark?: string;
  markScale?: MarkScale;
};

export type Build = {
  lines?: string[];
  mark?: string;
  markScale?: MarkScale;
  body?: string[];
};

/* xl is the title card and nothing else. lg is the three cards the deck
   shouts on - THE MICRO SERIES, THE KINK, MOKAI. md is the word set
   large inside a sentence rather than instead of one. */
export type MarkScale = "xl" | "lg" | "md";

export type Slide = {
  id: string;
  pages: string;
  art?: string;
  align?: "left" | "center" | "right";
  at?: "top" | "mid" | "low";
  kicker?: string;
  lead?: string[];
  lines?: string[];
  body?: string[];
  mark?: string;
  markScale?: MarkScale;
  foot?: string[];
  /* the word inside `mark` or `lines` that takes the orange block */
  accent?: string;
  aside?: Aside;
  build?: Build;
  verticals?: string[];
  insets?: string[];
  cutout?: string;
  plate?: boolean;
  band?: string;
  logo?: boolean;
  warm?: boolean;
  /* the mono chip in the corner, same device as the live tab's slate */
  slate?: string;
};

export const SLIDES: Slide[] = [
  {
    /* SLIDE 1 - the title card. An empty cinema, the orange plate over
       three quarters of it, the name across the plate, and the audience
       in their 3D glasses standing in front of the whole thing. It is
       the only slide in the deck with a flat colour on it and the only
       one where the type is bigger than the picture. */
    id: "title",
    pages: "01",
    art: "open-tall.jpg",
    align: "left",
    at: "mid",
    mark: "THE CONTINUITY KINK",
    markScale: "xl",
    plate: true,
    insets: ["open-wide.jpg"],
    cutout: "crowd-3d.png",
    slate: "TITLE",
  },
  {
    /* SLIDE 2 - one line, held over an eye. The deck's cold open. */
    id: "look",
    pages: "02",
    art: "peak-content.jpg",
    align: "left",
    at: "top",
    lines: ["Look at the world,", "In and Out of the screen."],
    accent: "screen.",
    slate: "COLD OPEN",
  },
  {
    /* SLIDE 3 */
    id: "post",
    pages: "03",
    art: "behind-screen.jpg",
    align: "left",
    at: "mid",
    lines: ["Post-lockdown nothing actually changed."],
    body: [
      "except for everything moving entirely behind the screen. Trapped between a relentless news cycle of global volatility and brain-rot designed to over-stimulate and then abandon.",
    ],
    slate: "BEHIND THE SCREEN",
  },
  {
    /* SLIDE 4 - the naming slide, and the one the deck lays out
       differently to every other: the sentence and the name on the left,
       a two-paragraph column hung off the right. */
    id: "kink",
    pages: "04",
    art: "chaos.jpg",
    align: "left",
    at: "mid",
    lines: ["In this chaos, the brain", "has developed a fetish."],
    mark: "a continuity kink.",
    markScale: "md",
    accent: "kink.",
    aside: {
      body: [
        "When the world outside is a series of recurring events, the mind stops hunting for “Discovery” and starts hunting for “Lore.” We crave the familiar, and return to the creators we know and the shows that run for seasons.",
        "Not because we are lazy but because they offer a guaranteed return on attention investment and the only safety left in 2026 ; the luxury of context.",
      ],
    },
    slate: "THE NAME",
  },
  {
    /* SLIDE 5 - centred, and the deck indents the second line under the
       first rather than aligning them. Kept. */
    id: "trends",
    pages: "05",
    art: "wardrobe.jpg",
    align: "center",
    at: "mid",
    lines: ["While the viewer is hunting for context,", "brands are mistaking it for Trends."],
    accent: "Trends.",
    slate: "THE MISREAD",
  },
  {
    /* SLIDE 6 */
    id: "binge",
    pages: "06",
    art: "binge.jpg",
    align: "center",
    at: "mid",
    lines: ["Anyone you think is your audience,", "has been rewired by the Binge."],
    /* the deck walks the reader down into the word: the sentence, then
       two smaller lines, then CONTINUITY set across the picture. The
       second of those two is the deck's own line break, not a wrap. */
    body: [
      "From Netflix to the deepest corners of their instagram feed, they are chasing a",
      "specific neurological pattern :",
    ],
    mark: "CONTINUITY .",
    markScale: "lg",
    slate: "ONE PATTERN",
  },
  {
    /* SLIDES 7 + 8 - the build. Seven is the three lines about the
       greeting; eight is those three lines again with the AI-trends
       paragraph added under them. */
    id: "greeting",
    pages: "07-08",
    art: "noise.jpg",
    align: "left",
    at: "mid",
    lines: [
      "Neither of them are waiting for their insurance brand to wish",
      "Happy Diwali or their favourite sneaker brand to introduce all of",
      "it’s employees dancing on reels.",
    ],
    build: {
      body: [
        "We all have seen enough AI trends by now, spam of statics and abruptly put together reels is not feeding the continuity kink we didn’t know we had developed.",
      ],
    },
    slate: "THE GREETING",
  },
  {
    /* SLIDE 9 */
    id: "noise",
    pages: "09",
    art: "night-scroll.jpg",
    align: "left",
    at: "mid",
    lines: ["instead most of it is adding up to a pile of"],
    mark: "unwanted noise..",
    markScale: "md",
    accent: "noise..",
    foot: [
      "a noise emanating from the brands they wear, eat, drive, and trust with their money.",
    ],
    slate: "UNWANTED NOISE",
  },
  {
    /* SLIDES 10 + 11 - the turn, and the loudest card after the title.
       Ten is the kicker and the name; eleven adds the definition under
       it and three episode verticals across the picture. The deck warms
       up from here and does not go cold again. */
    id: "cure",
    pages: "10-11",
    art: "micro-series.jpg",
    align: "left",
    at: "mid",
    warm: true,
    kicker: "and the cure to that noise is",
    mark: "THE MICRO SERIES.",
    markScale: "lg",
    accent: "SERIES.",
    build: {
      lines: ["20-60 seconds of bite sized episodes,", "designed for continuity."],
    },
    verticals: ["reel-1.jpg", "reel-2.jpg", "reel-3.jpg"],
    slate: "THE CURE",
  },
  {
    /* SLIDES 12 + 13 */
    id: "pattern",
    pages: "12-13",
    art: "episodes.jpg",
    align: "left",
    at: "mid",
    warm: true,
    lines: [
      "with the same behavioral pattern that keeps",
      "someone watching eight episodes.",
      "Compressed into the cycle of scroll.",
    ],
    build: {
      body: [
        "every video is a cliffhanger that feeds the “Kink.”",
        "It gives the viewer a reason to come back tomorrow.",
      ],
    },
    slate: "THE CLIFFHANGER",
  },
  {
    /* SLIDES 14 + 15 - Mokai, and the deck's most crowded pair. Fourteen
       is the kicker, THE KINK, and the shop's name as a caption.
       Fifteen fills both halves: the cafe on the left with MOKAI set
       large under it, the reason on the right with SUBSCRIPTION OF
       ATTENTION under that. Both marks are kept at the sizes the deck
       sets them - the left one larger than the right one. */
    id: "mokai",
    pages: "14-15",
    art: "mokai-1.jpg",
    align: "left",
    at: "mid",
    warm: true,
    kicker: "The most resilient brands have leaned into the",
    mark: "THE KINK.",
    markScale: "lg",
    accent: "KINK.",
    /* a caption under the mark, not a paragraph - it is the deck naming
       the case study it is about to spend the next half-slide on */
    foot: ["Brooklyn Coffee Shop"],
    build: {
      lines: [
        "Ordinally, you wouldn’t watch a spam of new menus of a cafe on your instagram.",
        "But, you would watch the world of",
      ],
      mark: "MOKAI.",
      markScale: "lg",
    },
    aside: {
      body: [
        "Because they don’t just sell food, they sell lore.",
        "They create an itch that can only be scratched by coming back tomorrow.",
        "And they have created the",
      ],
      mark: "SUBSCRIPTION OF ATTENTION.",
      markScale: "md",
    },
    insets: ["mokai-3.jpg"],
    slate: "@MOKAI",
  },
  {
    /* SLIDE 16 - five lines, no picture doing any work behind them
       beyond a woman lit by her own phone. The deck sets the two quiet
       lines smaller than the three loud ones; that is kept, and it is
       what `body` and `lines` are doing here rather than a hierarchy
       this file invented. */
    id: "discipline",
    pages: "16",
    art: "retention.jpg",
    align: "left",
    at: "mid",
    warm: true,
    lead: [
      "If the door is left ajar, the audience will walk through it every single day.",
      "You cannot “hack” this with a trend. You cannot fix it with a louder cut.",
    ],
    lines: [
      "Because Retention is a structural discipline.",
      "The discipline of a showrunner.",
      "The ability to plant and seed twelve months of content so that",
      "January connects to December.",
    ],
    slate: "JAN - DEC",
  },
  {
    /* SLIDE 17 - the same photograph as 16, dimmed under the leak. Two
       consecutive sections on one still is not a mistake here: it is
       what the deck does, and held over two screens it reads as the shot
       being held rather than as a picture repeated. */
    id: "receipts",
    pages: "17",
    art: "retention.jpg",
    align: "left",
    at: "mid",
    warm: true,
    lines: ["We didn’t realise this kink by accident."],
    body: [
      "Instead by spending years building the titles with the biggest streaming platforms- Netflix, Prime, Hotstar - that taught the world how to binge.",
    ],
    slate: "THE RECEIPTS",
  },
  {
    /* SLIDES 18 + 19 - the proof, and the ask. */
    id: "proof",
    pages: "18-19",
    art: "wardrobe.jpg",
    align: "center",
    at: "mid",
    warm: true,
    lines: [
      "You made it till the end because the narrative held",
      "you, and you proved the continuity loop.",
    ],
    accent: "loop.",
    build: {
      body: [
        "If we can hold your attention over a concept in the first week of February, imagine what we can do for your brand for the rest of 2026.",
      ],
    },
    slate: "THE PROOF",
  },
  {
    /* SLIDE 20 - the end card. Black, the torn paper band, the lockup,
       and the audience back one last time. */
    id: "end",
    pages: "20",
    align: "center",
    at: "mid",
    lines: ["We’ll build the episodes when", "you’re ready."],
    band: "close-band.jpg",
    cutout: "crowd-3d.png",
    logo: true,
    slate: "END CARD",
  },
];

/* ------------------------------------------------------------------
   THE WAY OUT.

   The deck ends on "we'll build the episodes when you're ready" and then
   stops - it is a pitch, and the next thing that happened was a meeting.
   A web page cannot end on a sentence with nothing under it, so the two
   links the live tab ends on are the two links this one ends on, and
   they are read from lib/series-content.ts rather than restated here.

   That import is the ONLY thing this route takes from the Series tab.
   The copy above is the deck; the copy there is the rewrite; keeping the
   two files apart is what lets either be changed without touching the
   other. See SERIES_CTA in lib/series-content.ts.
   ------------------------------------------------------------------ */
export { SERIES_CTA as DECK_CTA } from "@/lib/series-content";

/* Same resolver as the live tab's, and pointed at the same folder: every
   still on this page is a file the Series tab already ships. */
export const DART = (file: string) =>
  file.startsWith("/") || file.startsWith("http") ? file : `/assets/series/${file}`;
