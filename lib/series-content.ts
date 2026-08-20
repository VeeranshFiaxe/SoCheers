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

   ---- what this file stopped being ----

   It used to carry three treatments, a process section and four example
   seasons. The direction is settled now - cinematic, scroll-driven,
   footage over stills - so the treatments are gone and with them the
   switcher, and the page is the two things the brief asks for and
   nothing else: the story, and the feed.

   ---- two things still open with the client ----

   1. THE NAME. The decks disagree: the older one is "The Re-Wiring", the
      newer and more complete one is "The Continuity Kink". CONCEPT below
      is the single place it is written down - change that one object and
      the whole page follows, including the <title>. Defaulted to the
      newer deck.
   2. THE STAT. The brief calls for a data-backed number early, for
      credibility, and the decks do not carry one. STAT is a marked
      placeholder with the right shape; swap the three fields.

   Everything marked PENDING is structurally correct and factually a
   stand-in. None of it should ship to a live domain as-is.
   ============================================================ */

/* The concept's name, and the only place it is spelled. */
export const CONCEPT = {
  /* PENDING CLIENT CONFIRMATION - "The Continuity Kink" vs "The Rewiring".
     Both decks are in play; this is the newer of the two. */
  title: "The Continuity Kink",
  short: "Continuity Kink",
  alt: "The Rewiring",
} as const;

/* ------------------------------------------------------------------
   THE SHOTS.

   A beat's `shot` is how it is staged, and it is the whole of this
   revamp: the brief asks for scroll-driven cinema rather than a column
   of pictures with words next to them, and it asks specifically that the
   staging pair with what the line says - "many open thoughts" wants many
   windows, not a photograph of somebody thinking.

   So the shot is picked per beat off the sentence it carries, and each
   one is a mechanic rather than a layout:

     title    - a card. The gate opens on the way in and shuts on the way
                out; the line sits in the frame rather than beside it.
     mosaic   - many windows at once, tiling in on scroll. The abundance
                beat. `jitter` makes the same wall arrive badly, for the
                one about noise.
     aperture - a full-bleed frame squeezed by the letterbox into a phone
                as you read. Used once, on "everything moved behind the
                screen", where the squeeze *is* the sentence.
     strip    - stacked letterbox bands, each travelling at its own rate.
                The reference the client sent - a film poster cut into
                horizontal frames - is this. `reverse` runs it backwards,
                for the beat about returning to the familiar.
     reel     - a row of verticals that compress into one as you scroll.
                Eight episodes, into the cycle of the scroll.
     phone    - one vertical frame held beside the type. Phone footage
                composed as a phone rather than cropped into a widescreen
                hole, which on the beat that is about the phone would be
                the wrong three quarters to throw away.
     held     - one frame, one slow push, type over it. The default, and
                the quiet one: a page of nothing but mechanics is a
                showreel, and the argument needs somewhere to land.
     figure   - the stat. A number and a source, no picture doing work.

   Adding a shot means a renderer in components/SeriesStory.tsx and a
   case in lib/series-motion.ts, in that order.
   ------------------------------------------------------------------ */
export type Shot =
  | "title"
  | "mosaic"
  | "aperture"
  | "strip"
  | "reel"
  | "phone"
  | "held"
  | "figure";

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
  /* many, for mosaic / strip / reel. Order is the order they arrive in. */
  frames?: string[];
  /* an mp4 that plays in place of `art`. See FILM below for what is real
     and what is waiting. */
  film?: string;
  /* mosaic only - the wall arrives badly rather than cleanly */
  jitter?: boolean;
  /* strip only - the bands travel against the scroll */
  reverse?: boolean;
  /* held only - draws a twelve-month ruler under the line and closes it
     back on itself. One beat uses it, and that beat is about January
     connecting to December. */
  ticks?: boolean;
};

/* ------------------------------------------------------------------
   THE FILM.

   The brief is explicit: video over stills wherever there is video. What
   this repo actually has is the site's own banner film and two clips
   from the About shoot - there is no series footage in the tree yet, and
   no encoder in the repo to cut posters with, so nothing here is
   invented to fill the gap.

   Every beat can carry `film`. When the client's cuts land, dropping the
   files into public/assets/series/film/ and adding one `film:` line per
   beat is the whole change - the story component already prefers a film
   over a still, plays it only while it is on screen, and keeps the still
   as its poster so a beat is never blank while an mp4 opens.
   ------------------------------------------------------------------ */
const FILM = {
  /* PENDING CLIENT FOOTAGE - the live site's banner film, standing in for
     the opener's moving frame. The real one is a cut from the micro
     series work. */
  open: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4",

  /* PENDING - two clips from the About shoot, used as two of the twelve
     windows on the abundance wall. They are there because a wall about
     endless streams should not be a wall of photographs, and because at
     1.4MB and 1.8MB they are the only files in the tree small enough to
     autoplay without costing this page its own argument. Swap for series
     footage when it exists. */
  wall1:
    "/assets/SC%20Website%20Revamp/02.%20About/Office%20Images%20-%20Culture/AQOhYVnOI0VVNqJsVbQi6Yb5-LTcKs4rC92euhXX47NeQuRJ8mREhXBZhCM-7zNl3PRpuryKVwP6npXxchaNqHGknY2FZ7C-.mp4",
  wall2:
    "/assets/SC%20Website%20Revamp/02.%20About/Office%20Images%20-%20Culture/AQP2nADns22VqfmHrU1qZv9HeGA2Vl62f1Vc-TRwrugotDcbNx_wZ3pqD133sfmARnY56WkdqZMCEwBHw1vA5iL0iawSLeHa.mp4",
} as const;

/* The wall on the "peak content era" beat. Twelve windows, and the two
   films sit at 4 and 9 - far enough apart that neither is beside the
   other, close enough that one of them is always near the eye. Held to
   two on purpose: the client's note is that the balance has to stay this
   side of animated. */
const WALL = [
  "peak-content.jpg",
  "night-scroll.jpg",
  "binge.jpg",
  FILM.wall1,
  "chaos.jpg",
  "episodes.jpg",
  "behind-screen.jpg",
  "streaming.jpg",
  FILM.wall2,
  "wardrobe.jpg",
  "micro-series.jpg",
  "close-band.jpg",
];

/* ------------------------------------------------------------------
   The story.

   One array, read top to bottom. Fifteen beats, roughly ninety seconds
   of scroll, and the order is the deck's order - the name of the thing
   does not land until the reader has already recognised the behaviour in
   themselves, which is what makes a coined term feel earned rather than
   sold.
   ------------------------------------------------------------------ */
export const BEATS: Beat[] = [
  {
    id: "open",
    shot: "title",
    eyebrow: "A SoCheers original",
    lines: ["Look at the world,", "in and out of the screen."],
    slate: "COLD OPEN",
    art: "open-wide.jpg",
    film: FILM.open,
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
    id: "stat",
    shot: "figure",
    lines: [],
    art: "night-scroll.jpg",
  },
  {
    id: "kink",
    shot: "title",
    eyebrow: "So we gave it a name",
    lines: ["In this chaos, the brain", "has developed a fetish."],
    copy: "A continuity kink.",
    slate: "TITLE CARD",
    art: "kink.jpg",
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
    frames: ["binge.jpg", "night-scroll.jpg", "behind-screen.jpg", "streaming.jpg"],
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
      "close-band.jpg",
      "streaming.jpg",
    ],
  },
  {
    id: "cure",
    shot: "title",
    eyebrow: "And the cure to that noise",
    lines: ["The micro series."],
    copy: "20 to 60 seconds of bite-sized episodes, designed for continuity.",
    slate: "TITLE CARD",
    art: "micro-series.jpg",
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
       December joins back to January - which is the sentence. */
    id: "discipline",
    shot: "held",
    ticks: true,
    lines: ["Retention is not a hack.", "It is a structural discipline."],
    copy:
      "You cannot buy it with a trend or fix it with a louder cut. It is the discipline of a showrunner: the ability to plant and seed twelve months of content so that January connects to December. Leave the door ajar and the audience walks through it every single day.",
    slate: "JAN - DEC",
    art: "close-band.jpg",
  },
  {
    id: "credentials",
    shot: "held",
    lines: ["We didn't find this kink", "by accident."],
    copy:
      "We found it building titles with the streaming platforms that taught the world how to binge - Netflix, Prime, JioHotstar.",
    slate: "THE RECEIPTS",
    art: "streaming.jpg",
  },
  {
    id: "proof",
    shot: "title",
    lines: ["You made it to the end", "because the narrative held you."],
    copy: "You just proved the continuity loop.",
    slate: "END CARD",
    art: "crowd-3d.png",
  },
];

/* PENDING CLIENT - the credibility number the brief asks for, early and
   sourced. The decks do not carry one. Shape is right, figures are not:
   swap `figure`, `claim` and `source` and delete this comment. Rendered
   by the "stat" beat above.

   `figure` is counted up on scroll, so it wants to stay digits with an
   optional trailing symbol - see the figure case in lib/series-motion.ts. */
export const STAT = {
  figure: "00%",
  claim: "PENDING - the drop in new-title adoption against rewatching, or whichever number the team lands on.",
  source: "Source pending",
  pending: true,
} as const;

/* ------------------------------------------------------------------
   THE FEED - component two.

   Thumbnails that link out, and deliberately not Instagram's own embed.
   The official embed is a third-party iframe plus embed.js per post: on a
   rail of eight that is eight iframes, eight scripts and a tracker on a
   page whose entire argument is that it holds attention for ninety
   seconds. A thumbnail and an <a> is the same content, one image, and it
   keeps the page's own scroll.

   `href` is the real post URL - PENDING, these are the placeholders the
   client's list will replace. `thumb` is a still from that post; the
   client's content sheet supplies both. `brand` and `ep` are the slate
   on the tile, so the rail reads as episodes rather than as a moodboard.
   ------------------------------------------------------------------ */
export const REELS = [
  { id: "r1", brand: "PENDING - Amul", ep: "EP 01", thumb: "reel-1.jpg", href: "#", pending: true },
  { id: "r2", brand: "PENDING - Amul", ep: "EP 02", thumb: "reel-2.jpg", href: "#", pending: true },
  { id: "r3", brand: "PENDING - Prabhu", ep: "EP 01", thumb: "reel-3.jpg", href: "#", pending: true },
  { id: "r4", brand: "PENDING - Prabhu", ep: "EP 02", thumb: "mokai-1.jpg", href: "#", pending: true },
  { id: "r5", brand: "PENDING - third brand", ep: "EP 01", thumb: "mokai-2.jpg", href: "#", pending: true },
  { id: "r6", brand: "PENDING - third brand", ep: "EP 02", thumb: "mokai-3.jpg", href: "#", pending: true },
  { id: "r7", brand: "PENDING - fourth brand", ep: "EP 01", thumb: "reel-2.jpg", href: "#", pending: true },
  { id: "r8", brand: "PENDING - fourth brand", ep: "EP 02", thumb: "reel-3.jpg", href: "#", pending: true },
];

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
