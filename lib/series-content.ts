/* ============================================================
   THE SERIES TAB - everything it says, in one place.

   Same one-file-per-route convention as lib/about-content.ts and
   lib/blog-content.ts. Nothing in components/Series*.tsx writes copy.

   ---- where this copy comes from ----

   The client's own rewrite, sent as "Final Version - Micro Series": ten
   numbered sections, replacing the fourteen-beat cut that was read
   straight off the deck ("The Continuity Kink", 20 slides). It is
   shorter, it is in their voice, and it is transcribed here WORD FOR
   WORD - including the three lines they sent in capitals, which are the
   chapter markers of the new cut and are set as they were written.

   Nothing on this page is a line somebody wrote to fill a slot. Where a
   section needed a label that is not in their copy - the mono slate
   burned into the corner of the frame - it is a production slate
   ("TITLE CARD", "END CARD"), the same device the rest of the site
   uses, and never a sentence.

   The old fourteen-beat story is not deleted: it is in lib/series-v1.ts
   and still renders at /series-1, which is off the nav. This file
   re-exports it at the foot so those three components did not have to
   change their imports.

   ---- what the pictures are ----

   Two folders, and the difference matters.

   public/assets/series/ is lifted from the client's own deck. It is
   their reference rather than their licence, and it stands in for
   series footage that does not exist yet - the mood of the argument,
   not the work.

   public/assets/work/ is the real thing: campaigns SoCheers actually
   made, the same stills the Work tab runs on. Two sections earn them
   and only those two use them - the credentials section, where the
   claim is "we build campaigns for the shows that taught the world how
   to binge" and the proof is the Netflix and JioHotstar titles, and the
   showcase, which the brief asks for by name ("rapid visual sequence of
   actual SoCheers work"). Everywhere else the deck stills stay, because
   a page arguing for a format should not illustrate every sentence with
   a campaign that is not in that format.

   ---- what is still open with the client ----

   1. RAYMOND. The brief names "prava ip, raymond ip, etc" for the
      showcase. Prava is in the tree (public/assets/work/pinned) and is
      the first card. Raymond is not - it is still a pending tile on the
      Work tab (see WORK_ASSETS in lib/work-content.ts) and there is no
      frame of it anywhere in the repo. So the showcase runs the work
      that exists rather than drawing a grey box with a brand name on
      it; add Raymond to SHOWCASE below the day the still lands and the
      row re-times itself.
   2. THE EPISODE LINKS. REELS at the foot of this file still has no
      live post URLs. Until it does the tiles are not links and the line
      promising that they open Instagram does not render.
   3. SERIES FOOTAGE. There is none in the tree. The two clips on the
      abundance wall are from the About shoot and read as texture at
      tile size; they are the only moving frames on the page.
   ============================================================ */

/* The name of the thing. The decks disagreed - the older one is "The
   Re-Wiring", the newer one "The Continuity Kink" - and the rewrite
   settles it: section 4 names the behaviour "the continuity kink", so
   that is the name, and this is the single place it is spelled. */
export const CONCEPT = {
  title: "The Continuity Kink",
  short: "Continuity Kink",
  alt: "The Rewiring",
} as const;

/* ------------------------------------------------------------------
   SECTION 1 - THE TITLE CARD.

   The client's first section is one sentence and nothing else, which is
   exactly what a cold open is, so it is staged as the title card rather
   than folded into the story below it: the composition, the sentence
   set at poster scale across it, and the cue.

   What came off it: the standfirst. The old card carried a paragraph
   under the name because the name alone ("The Continuity Kink") does
   not tell a reader what the page is about. This line does - and the
   rewrite gives the concept its own section further down, where the
   reader has already recognised the behaviour in themselves. A second
   sentence here would be copy nobody wrote.

   The frames are the wall's, so the card and the section under it read
   as one reel rather than as a cover glued onto a page.

   There used to be a fourth - open-tall.jpg, the empty screening room,
   lifted out over the type as a plane in front of the words. It is off
   the card: a vertical standing in the middle of a one-line title is
   depth, and a vertical standing in the middle of a three-line sentence
   is something covering the sentence. The still is not gone, it is on
   the end card, where it is the last frame of the page.
   ------------------------------------------------------------------ */
export const HERO = {
  /* the client's own words for the chip over the title. It is the line
     the first pass carried as an eyebrow further down the page, moved
     onto the card where it belongs - a slate on the opening frame,
     which is what "an original" is. */
  tag: "A SoCheers Original",
  line: "Welcome to the peak content era.",
  /* the highlighter block, on the last word - the same device, and the
     same size of it, as the sections spend on one word of a line.
     "content era." took two of the three lines and read as a red bar
     with a title behind it rather than as a mark made on one. */
  accent: "era.",
  cue: "Scroll",
  frames: ["open-wide.jpg", "micro-series.jpg", "night-scroll.jpg"],
} as const;

/* The <meta> description. Not on the screen anywhere, so it is written
   for a search result rather than lifted off a section - and it is the
   page's own claim, in the client's words, out of sections 7 and 6. */
export const META_DESCRIPTION =
  "We don't make more content. We design reasons to come back. The micro-series: 20-60 second episodes built around one recurring world, from the agency that builds campaigns for the platforms that taught the world how to binge.";

/* ------------------------------------------------------------------
   THE TEXTURE PLATES.

   Two files in public/assets/series/ are not photographs and were never
   meant to be used as frames: kink.jpg is a sheet of film grain and
   streaming.jpg is a warm light leak. Both were once wired up as
   full-bleed stills, which is why two sections rendered as an empty
   grey screen and an empty orange screen.

   They are useful - just as grade, over a composition, not as one.
   Every section lays the grain over itself, and the leak is spent on
   the three after the turn, so the answer looks like a warmer room than
   the problem.
   ------------------------------------------------------------------ */
export const TEXTURE = {
  grain: "kink.jpg",
  leak: "streaming.jpg",
} as const;

/* ------------------------------------------------------------------
   THE STAGES.

   A section's `stage` is how it is built. Seven of them for ten
   sections, which is the change the rewrite forced: the old cut ran one
   staging fourteen times on the theory that repetition was the test,
   and at fourteen screens it was. At ten it is not - three of the new
   sections are not arguments at all (a process, a showreel, a call to
   action) and cannot be a sentence beside four letterbox frames.

   So the FRAME is what repeats now - the graded plate, the scrim, the
   grain, the letterbox gate, the type at one size in one column, the
   slate in the corner - and what changes inside it is only the picture
   layer:

     wall     - many windows at once. The abundance section: one
                photograph of abundance is not abundance, twelve windows
                arriving together is.
     strip    - the default. Four letterbox frames cascading down the
                half of the screen the sentence is not in.
     title    - the poster. Bands stacked full width, the sentence at
                reading size high in the frame, and the name of the
                thing set enormous across the middle of them.
     reel     - a row of verticals, phone-shaped, for the section that
                describes what a 20-60 second episode is.
     steps    - the client's "sideblocks display": four numbered blocks,
                each with its own frame.
     showcase - two rows of real work travelling in opposite directions.
                The brief asks for a rapid visual sequence; this is the
                only thing on the page that moves on its own.
     end      - the title card's construction again, closing on the CTA.
                The page opens and closes on the same shape, which is
                the rhyme the last section is claiming.

   Adding a stage means a renderer in components/SeriesTestStory.tsx and
   a block in app/series/series.css, in that order.
   ------------------------------------------------------------------ */
export type Stage =
  | "wall"
  | "strip"
  | "title"
  | "reel"
  | "steps"
  | "showcase"
  | "end";

export type Step = {
  no: string;
  title: string;
  body: string;
  art: string;
};

export type Card = {
  src: string;
  /* the brand, spelled the way lib/work-content.ts spells it. A label on
     a piece of work, not a line of copy. */
  label: string;
};

export type Section = {
  id: string;
  stage: Stage;
  /* the mono chip burned into the corner of the frame - a slate, the way
     the client's references label theirs. Kept short: it is a label, not
     a caption, and it must not become a second place copy lives. */
  slate?: string;
  /* a paragraph that runs BEFORE the display line. One section needs it:
     the client's section 3 sets its punch up with a long sentence and
     lands it afterwards, and reordering them so the big type comes first
     would be rewriting their copy with CSS. */
  lead?: string;
  /* the display line, one <h2>, split into the lines it should break on */
  lines: string[];
  /* the second line, set at poster scale under the first. The name on the
     title card, the ask on the end card. */
  mark?: string;
  /* the word inside `lines` or `mark` that takes the highlighter block.
     Matched case-insensitively, first occurrence only. */
  accent?: string;
  /* body paragraphs, in the order the client wrote them */
  copy?: string[];
  /* Phrases out of `copy` to lift. Matched rather than written, so a
     paragraph stays one continuous piece of the client's text and the
     emphasis is a way of setting it - nothing here is moved, cut, or
     repeated, and a string that does not match renders as ordinary body
     copy rather than throwing.

     There are two ways one gets set and the copy decides which, not a
     flag: a phrase that runs to the END of its paragraph takes its own
     line, because there is nothing after it to strand. A phrase inside
     a sentence is marked where it stands, because breaking there would
     leave the rest of the sentence hanging on the next line. See
     Copy() in components/SeriesSections.tsx. */
  emphasis?: string[];
  /* short phrases set as chips rather than run into a paragraph - the
     platform names, the list of things an episode leaves behind. Each
     item is already a complete phrase in the client's copy, so setting
     them apart changes the layout and not a character of the text.

     `cuesLead` is where they sit, and it is not a design choice: the
     client wrote the platform names immediately after the line they
     belong to and the episode's leftovers after the paragraph that sets
     them up, so the two runs of chips sit in different places for the
     same reason - that is the order the words were written in. */
  cues?: string[];
  cuesLead?: boolean;
  frames?: string[];
  warm?: boolean;
  steps?: Step[];
  showcase?: Card[];
  cta?: { label: string; href: string };
};

/* ------------------------------------------------------------------
   THE FILM.

   Two clips from the About shoot, used as two of the twelve windows on
   the abundance wall. They are there because a wall about endless
   streams should not be a wall of photographs, and because at 1.4MB and
   1.8MB they are the only files in the tree small enough to autoplay
   without costing this page its own argument. They read as texture at
   tile size; swap for series footage when it exists.
   ------------------------------------------------------------------ */
const FILM = {
  wall1: "/assets/series/culture-christmas.mp4",
  wall2: "/assets/series/culture-traditions.mp4",
} as const;

/* The wall. Twelve windows, and the two films sit at 4 and 9 - far
   enough apart that neither is beside the other, close enough that one
   of them is always near the eye.

   The two texture plates are deliberately not in here. A sheet of grain
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
   THE WORK, for the two sections that earn it.

   Rooted paths, so they sit in the same arrays as the deck stills
   without the caller having to know which folder a frame came from -
   see ART at the foot of this file.
   ------------------------------------------------------------------ */
const W = (file: string) => `/assets/work/${file}`;

/* The four titles behind the binge claim. All wide, all from the
   platforms named in the sentence above them, so the claim and the
   evidence are on one screen. */
const RECEIPTS = [
  W("pinned/netflix-mi.jpg"),
  W("wall/special-ops-2.jpg"),
  W("pinned/netflix-srh.jpg"),
  W("wall/dhurandhar-2.jpg"),
];

/* The showcase, and the order is a running order rather than a
   portfolio: Prava first because it is the one piece on the page that is
   actually a micro-series IP, then the biggest titles, then the range.
   Eighteen cards across two rows travelling opposite ways - enough that
   neither row visibly repeats while it is on screen.

   Raymond is missing on purpose. See the head of this file. */
const SHOWCASE: Card[] = [
  { src: W("pinned/prava.jpg"), label: "Prava" },
  { src: W("pinned/netflix-mi.jpg"), label: "Netflix × MI" },
  { src: W("wall/maa-behen.jpg"), label: "Netflix · Maa Behen" },
  { src: W("pinned/broadway.jpg"), label: "Broadway" },
  { src: W("wall/special-ops-2.jpg"), label: "JioHotstar · Special Ops 2" },
  { src: W("pinned/pantaloons-eoss.jpg"), label: "Pantaloons" },
  { src: W("wall/made-in-titan.jpg"), label: "Titan" },
  { src: W("wall/boat.jpg"), label: "boAt × Marvel" },
  { src: W("wall/croma.jpg"), label: "Croma" },
  { src: W("pinned/netflix-srh.jpg"), label: "Netflix × SRH" },
  { src: W("wall/dhurandhar-2.jpg"), label: "Netflix · Dhurandhar 2" },
  { src: W("wall/superdry.jpg"), label: "Superdry Sport" },
  { src: W("wall/bgmi.jpg"), label: "BGMI" },
  { src: W("wall/yes-bank.jpg"), label: "Yes Bank" },
  { src: W("wall/wacoal.jpg"), label: "Wacoal" },
  { src: W("wall/croma-dreams.jpg"), label: "Croma" },
  { src: W("wall/bhim-upi.jpg"), label: "BHIM UPI" },
  { src: W("wall/netflix-mi-srh.jpg"), label: "Netflix × MI × SRH" },
];

/* ------------------------------------------------------------------
   THE STORY - the client's ten sections, in their order.

   Section 1 is the title card above; these are 2 through 10.

   The two most worked compositions sit at 4 and 10 - the section that
   names the thing and the section that asks for the business. That is
   the same spacing the old cut used for its title cards and for the same
   reason: they are the sections that land something, and they need
   quieter screens between them to read as moments rather than as a
   showreel.
   ------------------------------------------------------------------ */
export const SECTIONS: Section[] = [
  {
    /* SECTION 2. Staged as the wall because the line is literally about
       abundance, and because the last sentence of it - the one about
       going back to the same things - is the hinge the whole page turns
       on. It reads as that standing alone under a screen full of windows
       and does not when it is buried in the paragraph above it. */
    id: "more",
    stage: "wall",
    lines: ["There is more to watch than ever."],
    copy: [
      "More to scroll. More to buy. More to follow. Every screen is full. Every feed keeps going.",
      "And somehow, we still keep going back to the same things.",
    ],
    slate: "ALL OF IT, AT ONCE",
    frames: WALL,
  },
  {
    /* SECTION 3. The one section that runs its paragraph FIRST: the
       client's copy sets the behaviour up at length and then lands two
       short sentences on it, and those two sentences are the display
       line. See `lead` on the Section type.

       The four frames are as close as the deck stills get to the four
       things the sentence lists: a lit phone in the dark, a screen being
       watched, a run of episodes, a room behind a screen. */
    id: "next",
    stage: "strip",
    lead:
      "You'll sit through twelve episodes of a world you barely know, the same blinkit order you'll place in less than 10 seconds, you'll follow someone cleaning their house and giving you an ASMR and watch someone else's baby growing up on the internet, not because you're bored, but because they built something that continues.",
    lines: ["The brain isn't looking for another surprise.", "It's looking for what comes next."],
    accent: "what comes next.",
    slate: "WHAT COMES NEXT",
    frames: ["night-scroll.jpg", "binge.jpg", "episodes.jpg", "behind-screen.jpg"],
  },
  {
    /* SECTION 4 - THE TITLE CARD, and the moment the page is built
       around. Three bands full width, the setup line at reading size
       high in the frame, and the name of the thing set enormous across
       the middle of them with the block on its last word.

       Three bands, not five: a band is as wide as the column and as tall
       as its share of one screen, so every frame added crops every frame
       already there - see the note on `frames` below for which three
       survive that crop and which one did not. */
    id: "kink",
    stage: "title",
    lines: ["There's a name we've given to this behaviour."],
    mark: "the continuity kink.",
    accent: "kink.",
    copy: [
      "It's the itch you get when something knows it will continue. We started liking things that already had a little history.",
      "A face we knew. A joke we remembered. A show we'd already spent six hours with. You didn't need the introduction. You already knew the world and You keep watching because there is more to know.",
    ],
    emphasis: ["You keep watching because there is more to know."],
    slate: "TITLE CARD",
    /* Was peak-content.jpg on top - the eye, in extreme close-up. It is
       the strongest still in the folder and the worst possible one for
       this stage: a band is as wide as the screen and a third as tall,
       and a face shot that tight cropped to that shape is not a face,
       it is a red wash with nothing in it. The tallest band is the one
       the reader looks at first, so it went to a frame that survives a
       wide crop. All three do now - a lit screen, a phone in the dark,
       an interior that reads across its whole width. */
    frames: ["binge.jpg", "night-scroll.jpg", "micro-series.jpg"],
  },
  {
    /* SECTION 5. The client's first capitalised line, and the turn from
       what the audience does to what brands do about it. Staged as the
       plain strip and framed with the noise stills - the pile the
       paragraph is describing. */
    id: "job",
    stage: "strip",
    lines: ["AND THAT CHANGES THE JOB OF CONTENT."],
    copy: [
      "The feed is full of brands trying to win the next three seconds.",
      "Another trend, another static, another Reel that starts and ends before you've had time to care.",
      "Nothing wrong with any of that.",
      "But if every piece starts from zero, the audience has to start from zero too.",
      "And that's a damn slow way to retain people on the internet.",
    ],
    /* the condition and its cost are one sentence and one mark - the
       whole paragraph lifts onto its own line */
    emphasis: ["But if every piece starts from zero, the audience has to start from zero too."],
    slate: "STARTING FROM ZERO",
    frames: ["noise.jpg", "chaos.jpg", "peak-content.jpg", "micro-series.jpg"],
  },
  {
    /* SECTION 6 - THE RECEIPTS, and the first section that gets real
       work in its frames. The sentence names the platforms; the four
       bands are the titles.

       The platform names are set as chips rather than run into the
       sentence. They are three one-word sentences in the client's copy
       and they read as a credit list, which is what they are. */
    id: "receipts",
    stage: "strip",
    lines: ["We build campaigns for the shows", "that taught the world how to binge."],
    cues: ["Netflix.", "Prime.", "Hotstar."],
    cuesLead: true,
    copy: [
      "We know what makes someone press \"Next Episode\" because we've spent years building that exact moment.",
      "Then we started wondering why brands don't design for the same itch.",
      "So we tried it. It worked.",
    ],
    slate: "THE RECEIPTS",
    frames: RECEIPTS,
  },
  {
    /* SECTION 7 - the format, and the first warm screen. Everything
       before this is graded cold; the leak sits over this section and
       the two after it, so the answer looks like a different room to the
       problem.

       Staged as the reel because the copy defines an episode by its
       length and its shape, and a row of phone-shaped verticals is that
       definition without a word of explanation. The five things an
       episode leaves behind are chips under the paragraph - five
       complete phrases in the client's copy, set as five. */
    id: "format",
    stage: "reel",
    warm: true,
    lines: ["We don't make more content.", "We design reasons to come back."],
    accent: "come back.",
    copy: [
      "The format is called micro-series. A series of 20-60 second episodes, built around one recurring world, format or story. Every episode has something worth watching and every episode leaves something behind.",
    ],
    /* both inside the sentence rather than at the end of it, so both are
       marked where they stand: the format's own definition, and the
       promise made about every episode of it */
    emphasis: ["20-60 second episodes", "Every episode has something worth watching"],
    cues: ["A question.", "A clue.", "A character.", "A running joke.", "A reason to return."],
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
    /* SECTION 8 - the client's "sideblocks display", verbatim: four
       numbered blocks, a title and a line each. The only section on the
       page that is a diagram rather than a picture with a sentence on
       it, so it is the only one whose frames are small and equal - four
       stills the same size in a row is a process; four different sizes
       is a collage, and a collage does not read as steps.

       Three of the four stills come out of the home page's service
       buckets - the cow for BRAND, the red hat in the black crowd for
       STRATEGY, the camera-head for FILMS - and the fourth is the about
       page's crowd, which is the only picture on the site that is a
       room full of people rather than one of them. All four are wrong
       shapes for a 4:3 card, so each carries its own focal point in
       series.css rather than being cropped down the middle. */
    id: "process",
    stage: "steps",
    warm: true,
    lines: ["THEN WE MAKE THE THING."],
    slate: "01 - 04",
    steps: [
      {
        no: "01",
        title: "BRAND",
        body: "You bring the brief, ambition and territory you want to own.",
        art: "/assets/home/creativity-6.webp",
      },
      {
        no: "02",
        title: "STRATEGY",
        body: "We find the world and build the narrative.",
        art: "/assets/home/strategy-9.webp",
      },
      {
        no: "03",
        title: "FILMS",
        body: "We turn that spine into episodes, characters, visual language and production.",
        art: "/assets/home/production-6.webp",
      },
      {
        no: "04",
        title: "TOGETHER",
        body: "We make, release, learn, build on what lands and keep the story moving.",
        art: "/assets/art/crowd.webp",
      },
    ],
  },
  {
    /* SECTION 9 - the showreel the brief asks for by name. Two rows of
       real campaigns travelling in opposite directions, and the only
       thing on this route that moves without being scrolled.

       No sentence over the pictures and no scrim across the middle: this
       section IS the work, and type laid over it would be the one place
       on the page where the work is a background. The line sits above
       the rows instead. */
    id: "proof",
    stage: "showcase",
    warm: true,
    lines: ["AND THIS IS WHAT IT CAN LOOK LIKE."],
    slate: "SELECTED WORK",
    showcase: SHOWCASE,
  },
  {
    /* SECTION 10 - THE END CARD. The same construction as the title
       card and deliberately so: the page opened on a composition and
       closes on one, and the reader is meant to feel the rhyme - which
       is what the sentence is claiming.

       The client's last line is a question with a button's job, so it is
       the button. It goes to /contact rather than opening a mail client,
       same as every other ask on the site. */
    id: "yours",
    stage: "end",
    lines: ["You made it to the end and hence the concept seems to be right."],
    mark: "NOW, LET'S MAKE YOURS ?",
    accent: "YOURS ?",
    slate: "END CARD",
    frames: ["open-wide.jpg", "mokai-3.jpg", "open-tall.jpg"],
    cta: { label: "NOW, LET'S MAKE YOURS ?", href: "/contact" },
  },
];

/* ------------------------------------------------------------------
   THE FIRST PASS, re-exported.

   /series-1 is the fourteen-beat cut, off the nav and noindexed, and it
   reads its story from lib/series-v1.ts now. These names are passed
   through here so components/SeriesStory.tsx, SeriesCrossers.tsx and
   lib/series-motion.ts did not have to be touched by a copy rewrite that
   has nothing to do with them.

   Nothing on /series imports any of it.
   ------------------------------------------------------------------ */
export {
  BEATS,
  CROSSERS,
  PLATE_STRIP,
  type Beat,
  type Shot,
  type Crosser,
  type Pose,
} from "@/lib/series-v1";
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
