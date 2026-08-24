/* ============================================================
   THE SERIES TAB - everything it says, in one place.

   Same one-file-per-route convention as lib/about-content.ts and
   lib/blog-content.ts. Nothing in components/Series*.tsx writes copy.

   ---- where this copy comes from ----

   Not written here. The narrative is the client's own deck, "The
   Continuity Kink" (Downloads/The Continuity Kink.pdf, 20 slides), read
   in order and cut down to a 1-2 minute scroll. The earlier deck, "The
   Re-Wiring", is the same idea at an earlier draft - its opening beat
   ("welcome to the peak content era") is the only thing it has that the
   newer deck does not, and it is folded into BEATS[1] below.

   The stills in public/assets/series/ are lifted from that same PDF.

   ---- the art direction revision ----

   The direction that came back on this page: the beats were reading as
   separate blocks - a picture, a sentence next to it, the next picture -
   and the references sent with it are the opposite of that. They are
   posters. Several frames working as one composition, the type set
   inside the picture rather than beside it, and a subject cut out of its
   background and lifted across the frame edges so the whole thing has
   depth.

   That is the `poster` shot below, and the four beats that used to be
   flat title cards now carry it. See components/SeriesStory.tsx for the
   layer order and lib/series-motion.ts for what the scroll does to it.

   ---- what is still open with the client ----

   1. THE NAME. The decks disagree: the older one is "The Re-Wiring", the
      newer and more complete one is "The Continuity Kink". CONCEPT below
      is the single place it is written down - change that one object and
      the whole page follows, including the <title>. Defaulted to the
      newer deck.
   2. THE EPISODE LINKS. REELS at the foot of this file has no live post
      URLs yet. Until it does, the tiles are not links and the page does
      not claim they are - see SeriesFeed.tsx. There is no placeholder
      badge on them any more: this page goes in front of clients.
   3. THE CUT-OUT SUBJECTS. CROSSERS below is five slots for figures
      that stand across the seam between two beats, and every one of them
      is drawing a silhouette today. They are the placeholders the client
      asked for while the real subjects are shot. `cutout` on a poster
      beat is the same story: supported, unused, waiting on a PNG with
      real alpha in it.
   4. THE FOOTAGE. Every beat can carry `film`. The one that used to sit
      on the cold open was the live site's *home page* banner - nothing
      to do with the series - and it is gone rather than swapped for
      another stand-in. Drop cuts into public/assets/series/film/ and add
      one `film:` line per beat.
   ============================================================ */

/* The concept's name, and the only place it is spelled. */
export const CONCEPT = {
  /* Open with the client - "The Continuity Kink" vs "The Rewiring". Both
     decks are in play; this is the newer of the two. Note this is a
     source comment: nothing renders the word "pending" on the page. */
  title: "The Continuity Kink",
  short: "Continuity Kink",
  alt: "The Rewiring",
} as const;

/* ------------------------------------------------------------------
   THE TEXTURE PLATES.

   Two files in public/assets/series/ are not photographs and were never
   meant to be used as frames: kink.jpg is a sheet of film grain and
   streaming.jpg is a warm light leak. Both were wired up as full-bleed
   stills, which is why two beats on this page rendered as an empty grey
   screen and an empty orange screen.

   They are useful - just as grade, over a composition, not as one. Every
   poster lays the grain over itself, and the leak is spent on the beats
   that want warmth in an otherwise blue-cold page.
   ------------------------------------------------------------------ */
export const TEXTURE = {
  grain: "kink.jpg",
  leak: "streaming.jpg",
} as const;

/* ------------------------------------------------------------------
   THE SHOTS.

   A beat's `shot` is how it is staged, and the staging is picked off the
   sentence it carries - "many open thoughts" wants many windows, not a
   photograph of somebody thinking. Each one is a mechanic rather than a
   layout:

     poster   - the composition. Several frames working as one picture,
                the type set inside them, and a cut-out subject or a
                lifted frame breaking across the edges so the layers read
                as depth rather than as a stack. Two variants, `stack`
                and `grid`, described under `variant` below. This is what
                the four title cards became.
     mosaic   - many windows at once, tiling in on scroll. The abundance
                beat. `jitter` makes the same wall arrive badly, for the
                one about noise.
     aperture - a full-bleed frame squeezed by the letterbox into a phone
                as you read. Used once, on "everything moved behind the
                screen", where the squeeze *is* the sentence.
     strip    - stacked letterbox bands, each travelling at its own rate.
                `reverse` runs it backwards, for the beat about returning
                to the familiar.
     reel     - a row of verticals that compress into one as you scroll.
                Eight episodes, into the cycle of the scroll.
     phone    - one vertical frame held beside the type. Phone footage
                composed as a phone rather than cropped into a widescreen
                hole, which on the beat that is about the phone would be
                the wrong three quarters to throw away.
     held     - one frame, one slow push, type over it. The default, and
                the quiet one: a page of nothing but compositions is a
                showreel, and the argument needs somewhere to land.

   Adding a shot means a renderer in components/SeriesStory.tsx and a
   case in lib/series-motion.ts, in that order.
   ------------------------------------------------------------------ */
export type Shot =
  | "poster"
  | "mosaic"
  | "aperture"
  | "strip"
  | "reel"
  | "phone"
  | "held";

export type Beat = {
  id: string;
  shot: Shot;
  eyebrow?: string;
  lines: string[];
  copy?: string;
  /* the mono chip burned into the corner of the frame - a slate, the way
     the client's references label theirs. Kept short: it is a label, not
     a caption, and it must not become a second place copy lives. */
  slate?: string;
  /* one still, for the shots that hold one */
  art?: string;
  /* many, for mosaic / strip / reel / poster. Order is the order they
     arrive in, and on a poster it is the order they are stacked. */
  frames?: string[];
  /* an mp4 that plays in place of `art`. Nothing carries one right now -
     see the note at the head of this file. */
  film?: string;

  /* ---- poster only ---------------------------------------------------

     variant - `stack` is the film-poster reference: full-width letterbox
               bands of uneven height, one word set enormous across the
               middle of them, and the subject rising through the word.
               `grid` is the editorial reference: frames of different
               sizes that overlap each other, the type block sitting on
               the corner of one of them.

     mark    - the word the composition is built around, set at poster
               scale. Defaults to `lines`. Set it explicitly when the
               line that should be big is the one further down the beat -
               on the kink beat the sentence sets it up and the name is
               the thing on the wall, so the name is the mark and the
               sentence runs above it at reading size.

     cutout  - a transparent PNG of a subject with its background already
               removed. It is drawn ON TOP of the type, so the letters
               pass behind it. This is the layer that makes the whole
               thing read as three-dimensional, and it is the one thing
               here that cannot be faked from a rectangular still.

     insets  - rectangular frames lifted out of the stack: stills that
               overhang the band edges. The first is drawn BEHIND the
               type and the rest in FRONT of it, so the sentence is
               sandwiched between two picture planes rather than laid
               over one. Used where there is no cutout for a beat yet,
               and useful alongside one either way.

     accent  - a word inside `mark` that takes the highlight block behind
               it, the way the reference blocks "CAPTURING". Matched
               case-insensitively, first occurrence only.
     -------------------------------------------------------------------- */
  variant?: "stack" | "grid";
  mark?: string;
  cutout?: string;
  insets?: string[];
  accent?: string;

  /* mosaic only - the wall arrives badly rather than cleanly */
  jitter?: boolean;
  /* strip only - the bands travel against the scroll */
  reverse?: boolean;
  /* held only - draws a twelve-month ruler under the line and closes it
     back on itself. One beat uses it, and that beat is about January
     connecting to December. */
  ticks?: boolean;
  /* held / poster - lays the warm leak over the composition */
  warm?: boolean;
};

/* ------------------------------------------------------------------
   THE FILM.

   The brief is video over stills wherever there is video. What this repo
   has is two clips from the About shoot, and there is no series footage
   in the tree at all.

   What used to be here as well was the live site's home page banner,
   playing full-bleed on the cold open. It is not series content, it was
   loaded off socheers.net at runtime, and it was the first thing on the
   page - so it is deleted rather than re-pointed. The cold open is a
   composition now and does not need a moving frame to hold.
   ------------------------------------------------------------------ */
const FILM = {
  /* Stand-ins: two clips from the About shoot, used as two of the twelve
     windows on the abundance wall. They are there because a wall about
     endless streams should not be a wall of photographs, and because at
     1.4MB and 1.8MB they are the only files in the tree small enough to
     autoplay without costing this page its own argument. They read as
     texture at tile size; swap for series footage when it exists. */
  wall1:
    "/assets/SC%20Website%20Revamp/02.%20About/Office%20Images%20-%20Culture/AQOhYVnOI0VVNqJsVbQi6Yb5-LTcKs4rC92euhXX47NeQuRJ8mREhXBZhCM-7zNl3PRpuryKVwP6npXxchaNqHGknY2FZ7C-.mp4",
  wall2:
    "/assets/SC%20Website%20Revamp/02.%20About/Office%20Images%20-%20Culture/AQP2nADns22VqfmHrU1qZv9HeGA2Vl62f1Vc-TRwrugotDcbNx_wZ3pqD133sfmARnY56WkdqZMCEwBHw1vA5iL0iawSLeHa.mp4",
} as const;

/* The wall on the "peak content era" beat. Twelve windows, and the two
   films sit at 4 and 9 - far enough apart that neither is beside the
   other, close enough that one of them is always near the eye.

   The two texture plates used to be in here as tiles. A sheet of grain
   and an orange gradient among ten photographs read as two windows that
   had failed to load, which on a wall arguing for abundance is the worst
   possible tile to have twice. */
const WALL = [
  "peak-content.jpg",
  "night-scroll.jpg",
  "binge.jpg",
  FILM.wall1,
  "chaos.jpg",
  "episodes.jpg",
  "behind-screen.jpg",
  "micro-series.jpg",
  FILM.wall2,
  "wardrobe.jpg",
  "noise.jpg",
  "open-wide.jpg",
];

/* ------------------------------------------------------------------
   The story.

   One array, read top to bottom. Fourteen beats, and the order is the
   deck's order - the name of the thing does not land until the reader
   has already recognised the behaviour in themselves, which is what
   makes a coined term feel earned rather than sold.

   The four posters sit at 1, 4, 9 and 14. That spacing is deliberate:
   they are the beats that name something, they are the most worked
   compositions on the page, and three screens of quieter staging between
   each pair is what keeps them reading as moments rather than as a
   showreel.
   ------------------------------------------------------------------ */
export const BEATS: Beat[] = [
  {
    /* THE COLD OPEN. Three frames overlapping rather than one held wide,
       because the line is about being on both sides of a screen at once
       and a single frame can only be on one of them. The empty-cinema
       vertical is lifted out over the join. */
    id: "open",
    shot: "poster",
    variant: "grid",
    eyebrow: "A SoCheers original",
    lines: ["Look at the world,", "in and out of the screen."],
    accent: "screen.",
    slate: "COLD OPEN",
    frames: ["open-wide.jpg", "micro-series.jpg", "night-scroll.jpg"],
    insets: ["open-tall.jpg"],
  },
  {
    /* the older deck's opening, kept because it is the one thing it says
       that the newer one assumes. Staged as the wall because the line is
       literally about abundance - one photograph of abundance is not
       abundance; twelve windows arriving at once is. */
    id: "peak",
    shot: "mosaic",
    lines: ["Welcome to the peak content era."],
    copy:
      "A world of visual abundance and endless hours of context, all readily available at our hands. And with a whole industry feeding the streams that pass by our eyes and thumbs, it makes you wonder what anyone can still add to it.",
    slate: "ALL OF IT, AT ONCE",
    frames: WALL,
  },
  {
    /* the squeeze: full-bleed at the top of the beat, a phone by the
       bottom of it. The frame does what the sentence says. */
    id: "post",
    shot: "aperture",
    lines: ["Post-lockdown,", "nothing actually changed."],
    copy:
      "Except for everything moving entirely behind the screen. Trapped between a relentless news cycle of global volatility and brain-rot designed to over-stimulate and then abandon.",
    slate: "BEHIND THE SCREEN",
    art: "behind-screen.jpg",
  },
  {
    /* ------------------------------------------------------------------
       THE TITLE CARD, and the one the revision was asked for by name.

       Five bands of uneven height, the sentence set at reading size high
       in the frame, and the name of the thing set enormous across the
       middle of the stack.

       ---- what came off this beat ----

       crowd-3d.png. It was wired as the `cutout` - the subject drawn
       over the type - and it is not a cut-out: it is a rectangular crop
       of a cinema audience with its own hard edges still on it. Drawn
       500px wide dead centre of the frame it did the two things a cutout
       exists to avoid. It sat over the middle of the mark, so the page's
       own title read "A co ... ink.", and because it is a rectangle with
       visible sides it read as a picture dropped on top of the poster
       rather than as a subject standing in it.

       The depth it was there for is carried by CROSSERS now - see the
       block under this array. `cutout` stays supported for the day a
       real alpha PNG arrives; nothing carries one today.
       ------------------------------------------------------------------ */
    id: "kink",
    shot: "poster",
    variant: "stack",
    eyebrow: "So we gave it a name",
    lines: ["In this chaos, the brain", "has developed a fetish."],
    mark: "A continuity kink.",
    accent: "kink.",
    slate: "TITLE CARD",
    /* Three, not five. See the note on the stack in app/series/series.css
       for the arithmetic; the short version is that a band is as wide as
       the column and as tall as its share of one screen, so every frame
       you add crops every frame that was already there. These three are
       picked to survive a wide crop: an eye, a lit screen in the dark,
       and an interior that reads across its whole width. */
    frames: ["peak-content.jpg", "binge.jpg", "micro-series.jpg"],
    /* one frame behind the sentence and nothing in front of it. The
       front plane on this beat is the figure crossing the seam above it
       - a lifted still there as well would be two things fighting for
       the same corner. */
    insets: ["night-scroll.jpg"],
  },
  {
    /* the bands run against the scroll. The beat is about the mind going
       back to what it already knows, and a strip that travels backwards
       while you go forwards is that, without a word of explanation. */
    id: "lore",
    shot: "strip",
    reverse: true,
    lines: ["The mind stops hunting for", "Discovery. It hunts for Lore."],
    copy:
      "We crave the familiar, and return to the creators we know and the shows that run for seasons. Not because we are lazy, but because they offer a guaranteed return on attention invested - the only safety left; the luxury of context.",
    slate: "REWIND",
    frames: ["wardrobe.jpg", "binge.jpg", "episodes.jpg", "night-scroll.jpg"],
  },
  {
    id: "trends",
    shot: "held",
    lines: ["While the viewer is hunting for context,", "brands are mistaking it for trends."],
    slate: "THE MISREAD",
    art: "chaos.jpg",
  },
  {
    id: "binge",
    shot: "strip",
    lines: ["Anyone you think is your audience", "has been rewired by the binge."],
    copy:
      "From Netflix to the deepest corners of their Instagram feed, they are chasing one neurological pattern: continuity.",
    slate: "FOUR FRAMES, ONE PATTERN",
    frames: ["binge.jpg", "night-scroll.jpg", "behind-screen.jpg", "noise.jpg"],
  },
  {
    /* the same wall as the abundance beat, arriving badly. Nothing about
       the staging is new - which is the point of it: the noise is not a
       different world, it is the same one, mistimed. */
    id: "noise",
    shot: "mosaic",
    jitter: true,
    lines: ["None of them are waiting", "for your festive greeting."],
    copy:
      "Not the Happy Diwali from an insurance brand, not the sneaker brand introducing its employees dancing on reels. A spam of statics and abruptly cut reels is not feeding the kink - it is adding to a pile of unwanted noise, emanating from the brands they wear, eat, drive and trust with their money.",
    slate: "UNWANTED NOISE",
    frames: [
      "noise.jpg",
      "chaos.jpg",
      "peak-content.jpg",
      "binge.jpg",
      "episodes.jpg",
      "night-scroll.jpg",
      "behind-screen.jpg",
      "wardrobe.jpg",
      "micro-series.jpg",
    ],
  },
  {
    /* the turn, and the warm one. Everything before this beat is graded
       cold; the leak sits over this composition and the two after it, so
       the cure looks like a different room to the problem. */
    id: "cure",
    shot: "poster",
    variant: "grid",
    warm: true,
    eyebrow: "And the cure to that noise",
    lines: ["The micro series."],
    accent: "series.",
    copy: "20 to 60 seconds of bite-sized episodes, designed for continuity.",
    slate: "TITLE CARD",
    frames: ["episodes.jpg", "micro-series.jpg", "binge.jpg"],
    insets: ["mokai-3.jpg"],
  },
  {
    /* eight verticals, and they close up into one as you read. The line
       says compressed into the cycle of the scroll; the row compresses. */
    id: "episodes",
    shot: "reel",
    lines: ["The same pattern that keeps", "someone watching eight episodes."],
    copy:
      "Compressed into the cycle of the scroll. Every video is a cliffhanger that feeds the kink. It gives the viewer a reason to come back tomorrow.",
    slate: "EP 01 - EP 08",
    frames: [
      "mokai-1.jpg",
      "reel-1.jpg",
      "mokai-2.jpg",
      "reel-2.jpg",
      "mokai-3.jpg",
      "reel-3.jpg",
      "mokai-1.jpg",
      "reel-2.jpg",
    ],
  },
  {
    id: "mokai",
    shot: "phone",
    eyebrow: "The Brooklyn coffee shop",
    lines: ["You wouldn't watch a cafe", "post its new menu."],
    copy:
      "But you would watch the world of Mokai. Because they don't sell food, they sell lore - an itch that can only be scratched by coming back tomorrow. They built a subscription of attention.",
    slate: "@MOKAI",
    art: "mokai-3.jpg",
  },
  {
    /* the ruler. Twelve months drawn under the line as you scroll, and
       December joins back to January - which is the sentence.

       The frame under it was close-band.jpg, which is a torn strip of
       white paper on black - a graphic element, blown up to fill a
       screen. Swapped for a photograph. */
    id: "discipline",
    shot: "held",
    ticks: true,
    warm: true,
    lines: ["Retention is not a hack.", "It is a structural discipline."],
    copy:
      "You cannot buy it with a trend or fix it with a louder cut. It is the discipline of a showrunner: the ability to plant and seed twelve months of content so that January connects to December. Leave the door ajar and the audience walks through it every single day.",
    slate: "JAN - DEC",
    art: "wardrobe.jpg",
  },
  {
    /* was streaming.jpg, which is an orange gradient with nothing in it.
       An empty cinema is the honest frame for a line about building
       titles for the people who run them. */
    id: "credentials",
    shot: "held",
    lines: ["We didn't find this kink", "by accident."],
    copy:
      "We found it building titles with the streaming platforms that taught the world how to binge - Netflix, Prime, JioHotstar.",
    slate: "THE RECEIPTS",
    art: "open-tall.jpg",
  },
  {
    /* THE END CARD. The same construction as the kink poster and
       deliberately so - the page opened on a composition and closes on
       one, and the reader is meant to feel the rhyme. No cutout for this
       beat yet, so the depth is carried by two lifted frames instead:
       one behind the sentence, one in front of it. */
    id: "proof",
    shot: "poster",
    variant: "stack",
    lines: ["You made it to the end", "because the narrative held you."],
    mark: "You just proved the continuity loop.",
    accent: "loop.",
    slate: "END CARD",
    /* the same three-band column as the title card, and the last frame is
       the empty cinema the page opened in */
    frames: ["open-wide.jpg", "mokai-3.jpg", "open-tall.jpg"],
    insets: ["reel-3.jpg", "mokai-1.jpg"],
  },
];

/* ------------------------------------------------------------------
   THE CROSSERS - the figures that stand between two beats.

   Every other picture on this page is trapped inside one section:
   `.sbeat` clips its own overflow, which is what keeps fourteen
   full-screen compositions from bleeding into each other. That clip is
   also why the page reads as fourteen separate screens no matter how
   carefully the beats are graded to match - nothing is ever in two of
   them at once.

   A crosser is. It is drawn in a layer that sits over the whole story
   rather than inside any beat, and it is placed on the seam between two
   of them - half of it standing in the section above, half in the
   section below. That is the only element on the page with a foot in two
   beats, and it is what ties them together into one space instead of a
   stack of frames.

   ---- these are placeholders, and deliberately obvious ones ----

   The client is sending cut-out subjects for these slots. Until they
   land, each one draws a silhouette: a flat figure in the page's own
   black with a hairline of the accent down its lit edge. It is a shape
   that says "somebody stands here" without pretending to be a
   photograph, and it is the shape the real PNG will be dropped into -
   swap `pose` for a `src` and nothing else in the layer changes.

   Nothing on the page names them as unfinished. Same rule as the feed
   tiles: this page goes in front of a client, so the placeholder is
   composed rather than badged.

   ---- the fields ----

     seam / edge - which boundary to stand on. `edge: "bottom"` puts the
                   figure across the foot of that beat, `"top"` across
                   its head. Measured at runtime by crossers() in
                   lib/series-motion.ts, because the beats are sized in
                   svh and a hard-coded offset is wrong on every second
                   viewport.

     side        - which edge of the screen it stands at. Never the
                   middle: the middle is where the type is, and a figure
                   over the sentence is the bug this whole block replaced.

     depth       - `near` is solid, drawn large and travels furthest on
                   the scroll; `far` is a wash, drawn small and barely
                   moves. Two figures at the same distance are a pattern;
                   two at different distances are a room.
   ------------------------------------------------------------------ */
export type Pose = "stand" | "phone" | "sit" | "pair";

export type Crosser = {
  id: string;
  seam: string;
  edge: "top" | "bottom";
  side: "left" | "right";
  pose: Pose;
  depth: "near" | "far";
};

/* Five, and the spacing matters as much as it does for the posters: a
   figure on every seam is a border, a figure on every third or fourth
   seam is a character walking through the story. Two of them bracket the
   title card and one stands at the foot of the strip that follows the
   binge line - the three seams the composition needed most. */
export const CROSSERS: Crosser[] = [
  /* rises out of the phone beat and into the title card, at the right,
     clear of the mark set across the middle of it */
  { id: "c1", seam: "post", edge: "bottom", side: "right", pose: "stand", depth: "near" },
  /* leaves the title card at the left, looking down - the beat under it
     is the one about going back to what you already know */
  { id: "c2", seam: "kink", edge: "bottom", side: "left", pose: "phone", depth: "far" },
  /* sits across the foot of the four-frame strip, watching it */
  { id: "c3", seam: "binge", edge: "bottom", side: "right", pose: "sit", depth: "near" },
  /* two of them, at the turn - the cure beat is the first warm one */
  { id: "c4", seam: "cure", edge: "bottom", side: "left", pose: "pair", depth: "far" },
  /* stands into the end card, mirroring the one that stood into the
     title card. The page opens and closes on the same figure. */
  { id: "c5", seam: "proof", edge: "top", side: "right", pose: "stand", depth: "near" },
];

/* The eight verticals that run along the foot of the end plate, handing
   the reader off to the feed. Same stills as the feed itself - it is the
   same eight episodes, seen twice at two sizes, which is the join. */
export const PLATE_STRIP = [
  "mokai-1.jpg",
  "reel-1.jpg",
  "mokai-2.jpg",
  "reel-2.jpg",
  "mokai-3.jpg",
  "reel-3.jpg",
  "mokai-1.jpg",
  "reel-2.jpg",
];

/* ------------------------------------------------------------------
   THE FEED - component two.

   Thumbnails that link out, and deliberately not Instagram's own embed.
   The official embed is a third-party iframe plus embed.js per post: on a
   rail of eight that is eight iframes, eight scripts and a tracker on a
   page whose entire argument is that it holds attention for ninety
   seconds. A thumbnail and an <a> is the same content, one image, and it
   keeps the page's own scroll.

   ---- what changed here ----

   Every tile used to carry a brand name reading "PENDING - Amul" and a
   black "PLACEHOLDER" badge in its corner, and the section promised that
   each frame opens the post on Instagram while every href was "#". Three
   different ways of showing a reader the page is not finished.

   So: `href` is optional now. A tile without one is not a link, carries
   no badge, and says nothing it cannot do - it is a frame with an
   episode number on it, which is true. The line under the heading that
   promises the link only renders once at least one tile has a real URL.

   Adding the client's list is one line per tile: put the post URL in
   `href` and the still from that post in `thumb`. Nothing else has to
   change; the tiles become links, the promise appears under the heading,
   and `title` is there for the episode's own name when they send them.
   ------------------------------------------------------------------ */
export type Reel = {
  id: string;
  ep: string;
  thumb: string;
  href?: string;
  title?: string;
};

export const REELS: Reel[] = [
  { id: "r1", ep: "EP 01", thumb: "reel-1.jpg" },
  { id: "r2", ep: "EP 02", thumb: "reel-2.jpg" },
  { id: "r3", ep: "EP 03", thumb: "reel-3.jpg" },
  { id: "r4", ep: "EP 04", thumb: "mokai-1.jpg" },
  { id: "r5", ep: "EP 05", thumb: "mokai-2.jpg" },
  { id: "r6", ep: "EP 06", thumb: "mokai-3.jpg" },
  { id: "r7", ep: "EP 07", thumb: "reel-2.jpg" },
  { id: "r8", ep: "EP 08", thumb: "reel-3.jpg" },
];

export const FEED = {
  tag: "Straight from the feed",
  title: "Every episode, where it actually lives.",
  /* only rendered once REELS carries a real href - see SeriesFeed.tsx */
  note: "Each frame opens the post on Instagram.",
} as const;

/* Two ways out and no third: talk to us, or go and look at the production
   house. Tito Films sits at the foot of the page by the client's own
   instruction. */
export const SERIES_CTA = {
  lines: ["We'll build the episodes", "when you're ready."],
  copy:
    "If we can hold your attention over a concept for ninety seconds, imagine what a season does for your brand.",
  primary: { label: "Talk to us", href: "/contact" },
  /* Confirmed by the client. Points at the house's own site rather than
     the Instagram account it used to link to (@thisistheonefilms, which
     never matched the name anyway). */
  secondary: { label: "Tito Films", href: "https://www.titofilms.com/" },
} as const;

/* A frame is either a file in public/assets/series/ or an already-rooted
   path (the films above), so both can sit in the same array without the
   caller having to know which is which. */
export const ART = (file: string) =>
  file.startsWith("/") || file.startsWith("http") ? file : `/assets/series/${file}`;

export const isFilm = (file: string) => file.endsWith(".mp4") || file.endsWith(".webm");
