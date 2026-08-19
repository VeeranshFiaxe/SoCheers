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
   The three treatments.

   The brief asks for directions to compare rather than one locked page,
   so the same beats below render three ways and the treatment is a query
   parameter (/series?t=still). One page, one narrative, three skins - the
   one the client picks becomes the default and the other two are deleted,
   rather than three routes drifting apart while they wait.

   `note` is what the switcher shows the client about each one.
   ------------------------------------------------------------------ */
export const TREATMENTS = [
  {
    id: "film",
    label: "Film",
    note: "Moving and still footage full-bleed, type held over it. Cinematic, closest to the deck.",
  },
  {
    id: "still",
    label: "Stills",
    note: "No video. Photography composed as an editorial spread, type in bands between the frames.",
  },
  {
    id: "type",
    label: "Type",
    note: "No imagery at all. Solid ground, the line is the whole frame, one statement per screen.",
  },
] as const;

export type TreatmentId = (typeof TREATMENTS)[number]["id"];
export const DEFAULT_TREATMENT: TreatmentId = "film";

export const isTreatment = (v: unknown): v is TreatmentId =>
  TREATMENTS.some((t) => t.id === v);

/* ------------------------------------------------------------------
   The story.

   One array, read top to bottom, and the treatment decides how each beat
   is composed - it never decides *what* the beat is. So every beat
   carries both its type and its picture even in the treatment that will
   not draw the picture, and switching treatment can never change the
   argument the page makes.

   `weight`:
     "open"   - the first frame, full height, nothing above it
     "full"   - a held frame with the line over it
     "turn"   - a short statement, the ground going quiet around it
     "quiet"  - body copy under a line, the beat where the reader catches up

   `art` is a file in public/assets/series/. `tall` marks the verticals -
   phone footage, which is composed as a phone rather than as a frame.

   The one rule the client set about mixing the two: never a moving
   picture and unread type at the same time. So a beat is either a frame
   that moves with no more than a few words on it, or type with the
   picture held still behind it. `still: true` says the picture is held.
   ------------------------------------------------------------------ */
export type Beat = {
  id: string;
  weight: "open" | "full" | "turn" | "quiet";
  eyebrow?: string;
  lines: string[];
  copy?: string;
  art?: string;
  tall?: boolean;
  still?: boolean;
};

export const BEATS: Beat[] = [
  {
    id: "open",
    weight: "open",
    eyebrow: "A SoCheers original",
    lines: ["Look at the world,", "in and out of the screen."],
    art: "open-wide.jpg",
  },
  {
    /* the older deck's opening, kept because it is the one thing it says
       that the newer one assumes */
    id: "peak",
    weight: "quiet",
    lines: ["Welcome to the peak content era."],
    copy:
      "A world of visual abundance and endless hours of context, all readily available at our hands. And with a whole industry feeding the streams that pass by our eyes and thumbs, it makes you wonder what anyone can still add to it.",
    art: "peak-content.jpg",
    still: true,
  },
  {
    id: "post",
    weight: "full",
    lines: ["Post-lockdown,", "nothing actually changed."],
    copy:
      "Except for everything moving entirely behind the screen. Trapped between a relentless news cycle of global volatility and brain-rot designed to over-stimulate and then abandon.",
    art: "behind-screen.jpg",
    still: true,
  },
  {
    id: "stat",
    weight: "turn",
    lines: [],
    art: "night-scroll.jpg",
    still: true,
  },
  {
    /* the name lands here, and not before: everything above it is the
       reader recognising their own behaviour, which is what makes a
       coined term feel earned rather than sold */
    id: "kink",
    weight: "full",
    eyebrow: "So we gave it a name",
    lines: ["In this chaos, the brain", "has developed a fetish."],
    copy: "A continuity kink.",
    art: "kink.jpg",
  },
  {
    id: "lore",
    weight: "quiet",
    lines: ["The mind stops hunting for", "Discovery. It hunts for Lore."],
    copy:
      "We crave the familiar, and return to the creators we know and the shows that run for seasons. Not because we are lazy, but because they offer a guaranteed return on attention invested - the only safety left; the luxury of context.",
    art: "wardrobe.jpg",
    still: true,
  },
  {
    id: "trends",
    weight: "turn",
    lines: ["While the viewer is hunting for context,", "brands are mistaking it for trends."],
    art: "chaos.jpg",
  },
  {
    id: "binge",
    weight: "full",
    lines: ["Anyone you think is your audience", "has been rewired by the binge."],
    copy:
      "From Netflix to the deepest corners of their Instagram feed, they are chasing one neurological pattern: continuity.",
    art: "binge.jpg",
    still: true,
  },
  {
    id: "noise",
    weight: "quiet",
    lines: ["None of them are waiting", "for your festive greeting."],
    copy:
      "Not the Happy Diwali from an insurance brand, not the sneaker brand introducing its employees dancing on reels. A spam of statics and abruptly cut reels is not feeding the kink - it is adding to a pile of unwanted noise, emanating from the brands they wear, eat, drive and trust with their money.",
    art: "noise.jpg",
    still: true,
  },
  {
    id: "cure",
    weight: "full",
    eyebrow: "And the cure to that noise",
    lines: ["The micro series."],
    copy: "20 to 60 seconds of bite-sized episodes, designed for continuity.",
    art: "micro-series.jpg",
  },
  {
    id: "episodes",
    weight: "quiet",
    lines: ["The same pattern that keeps", "someone watching eight episodes."],
    copy:
      "Compressed into the cycle of the scroll. Every video is a cliffhanger that feeds the kink. It gives the viewer a reason to come back tomorrow.",
    art: "episodes.jpg",
    still: true,
  },
  {
    id: "mokai",
    weight: "full",
    eyebrow: "The Brooklyn coffee shop",
    lines: ["You wouldn't watch a cafe", "post its new menu."],
    copy:
      "But you would watch the world of Mokai. Because they don't sell food, they sell lore - an itch that can only be scratched by coming back tomorrow. They built a subscription of attention.",
    art: "mokai-3.jpg",
    tall: true,
  },
  {
    id: "discipline",
    weight: "turn",
    lines: ["Retention is not a hack.", "It is a structural discipline."],
    copy:
      "You cannot buy it with a trend or fix it with a louder cut. It is the discipline of a showrunner: the ability to plant and seed twelve months of content so that January connects to December. Leave the door ajar and the audience walks through it every single day.",
    art: "close-band.jpg",
    still: true,
  },
  {
    id: "credentials",
    weight: "full",
    lines: ["We didn't find this kink", "by accident."],
    copy:
      "We found it building titles with the streaming platforms that taught the world how to binge - Netflix, Prime, JioHotstar.",
    art: "streaming.jpg",
    still: true,
  },
  {
    id: "proof",
    weight: "turn",
    lines: ["You made it to the end", "because the narrative held you."],
    copy: "You just proved the continuity loop.",
    art: "crowd-3d.png",
    still: true,
  },
];

/* PENDING CLIENT - the credibility number the brief asks for, early and
   sourced. The decks do not carry one. Shape is right, figures are not:
   swap `figure`, `claim` and `source` and delete this comment. Rendered
   by the "stat" beat above. */
export const STAT = {
  figure: "00%",
  claim: "PENDING - the drop in new-title adoption against rewatching, or whichever number the team lands on.",
  source: "Source pending",
  pending: true,
} as const;

/* ------------------------------------------------------------------
   How the thing actually gets made.

   Deliberately down here. The brief is explicit that the process only
   appears once the reader has bought the concept - a reader who is still
   deciding whether continuity is real does not care who holds the camera,
   and leading with the crew turns the page into a capability deck, which
   is the one thing it must not be.
   ------------------------------------------------------------------ */
export const PROCESS = [
  {
    step: "01",
    title: "The room",
    copy:
      "Strategists and writers in one room with the brand, working out what the lore actually is - the recurring cast, the running joke, the thing an audience can follow for a year.",
  },
  {
    step: "02",
    title: "The production",
    copy:
      "Shot as a season, not as a set of posts. One block, one crew, one look, twelve months of episodes banked before the first one goes out.",
  },
  {
    step: "03",
    title: "The conversation",
    copy:
      "The brand stops posting and starts running a show: a release rhythm, a comments section that expects the next one, and a reason to come back tomorrow.",
  },
];

/* PENDING CLIENT - the shows to lead with. The brief names Amul and
   Prabhu and says the final list is coming. These are the right shape
   (brand, a one-line premise, episode count, an outbound link) and the
   wrong content. `href` is the live Instagram profile or highlight;
   `thumb` a file in public/assets/series/. */
export const EXAMPLES = [
  {
    brand: "PENDING - Amul",
    premise: "A one-line premise for the series, in the voice the series is written in.",
    episodes: "00 episodes",
    thumb: "reel-1.jpg",
    href: "#",
    pending: true,
  },
  {
    brand: "PENDING - Prabhu",
    premise: "A one-line premise for the series, in the voice the series is written in.",
    episodes: "00 episodes",
    thumb: "reel-2.jpg",
    href: "#",
    pending: true,
  },
  {
    brand: "PENDING - third brand",
    premise: "A one-line premise for the series, in the voice the series is written in.",
    episodes: "00 episodes",
    thumb: "reel-3.jpg",
    href: "#",
    pending: true,
  },
  {
    brand: "PENDING - fourth brand",
    premise: "A one-line premise for the series, in the voice the series is written in.",
    episodes: "00 episodes",
    thumb: "mokai-2.jpg",
    href: "#",
    pending: true,
  },
];

/* ------------------------------------------------------------------
   The Instagram rail.

   Thumbnails that link out, and deliberately not Instagram's own embed.
   The official embed is a third-party iframe plus embed.js per post: on a
   rail of eight that is eight iframes, eight scripts and a tracker on a
   page whose entire argument is that it holds attention for ninety
   seconds. A thumbnail and an <a> is the same content, one image, and it
   keeps the page's own scroll.

   `href` is the real post URL - PENDING, these are the placeholders the
   client's list will replace. `thumb` is a still from that post; the
   client's content sheet supplies both.
   ------------------------------------------------------------------ */
export const REELS = [
  { id: "r1", thumb: "reel-1.jpg", caption: "PENDING - episode still", href: "#", pending: true },
  { id: "r2", thumb: "reel-2.jpg", caption: "PENDING - episode still", href: "#", pending: true },
  { id: "r3", thumb: "reel-3.jpg", caption: "PENDING - episode still", href: "#", pending: true },
  { id: "r4", thumb: "mokai-1.jpg", caption: "PENDING - episode still", href: "#", pending: true },
  { id: "r5", thumb: "mokai-2.jpg", caption: "PENDING - episode still", href: "#", pending: true },
  { id: "r6", thumb: "mokai-3.jpg", caption: "PENDING - episode still", href: "#", pending: true },
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

export const ART = (file: string) => `/assets/series/${file}`;
