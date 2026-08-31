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

   The pinned stage is finished. All five pieces have the client's own
   thumbnails, links, headlines and lines, and Netflix x MI has its
   film. Nothing on that section is a placeholder.

   The browse wall under it is most of the way there. Twelve campaigns
   are real now - the client's own case boards and case study films out
   of public/assets/SC Website Revamp/03. Work/, cut for the web by
   scripts/build-wall.mjs. The rest of the brands on their list are
   still holding their places behind placeholder pictures, and FMCG is
   the whole of one tab: every folder under it in the drive is empty.

   The case template is written and empty. Its five entries are the
   old placeholder set, they are not reachable from anywhere on the
   site, and they are waiting on real case write-ups.

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
  /* The client's own name for this one, and it is three words joined by
     slashes rather than a tidier "Fashion" because luxury is a
     different business from beauty and they sell to both. Carlton sits
     here rather than under Others for the same reason. */
  { id: "fashion", label: "Fashion / Beauty / Luxury" },
  { id: "entertainment", label: "Entertainment" },
  /* The client's own last filter, and it settles a question this file
     used to carry an open note about: Croma, Carlton, Cordelia Cruises,
     TCS and Cipla Innoventia were filed under invented Lifestyle and
     B2B tabs because nothing they had fitted them. Both tabs are gone
     and those five are here, which is what the client wanted and is
     also the honest answer - a category named "Others" is not a gap in
     the taxonomy, it is the taxonomy admitting an agency does work that
     does not sort. */
  { id: "others", label: "Others" },
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
   Five seconds: long enough to read the brand, the credits row and the
   line under them at a glance, which is the most this composition asks
   anyone to do, and short enough that all five have had their turn
   before a reader who is going to scroll has scrolled.

   It lives here rather than in the component because it is a pacing
   decision the client will have an opinion about, and this file is
   where every other such decision on the Work tab already is. */
export const PINNED_DWELL = 5000;

/* ------------------------------------------------------------------
   SECTION A - the pinned stage.

   The reference is the Filmhunt detail screen, and it is the first thing
   on the page: the frame fills the opening screen, and the title, the
   credits and the rail of other work all sit *on* it. There is no copy
   section above it - the work is what opens the page.

   The fields below are that screen's information:

     tags      the genre row      DRAMA | ROMANCE | SCI-FI
     headline  the title          "Her"
     line      the synopsis
     thumb     the poster wall    "PEOPLE ALSO LIKED"

   Two things from the reference are deliberately not here. The rating,
   because a score on agency work is a number nobody awarded, and
   inventing the furniture of a review site makes the real facts beside
   it look invented too. And the credits block - year, client, scope -
   which was carried until the client's own copy arrived and turned out
   to be a headline and one line with no room for a third row of small
   print under it. Neither is replaced by anything; the rows simply are
   not there.
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   WHAT HAPPENS WHEN A PINNED PIECE IS OPENED.

   The five featured pieces do not all go to the same kind of place, and
   this is the client's own instruction rather than a design choice:

     film      the film plays in the stage frame it is already sitting
               in. Not a lightbox, not a new page, not fullscreen - the
               picture the reader is looking at becomes the picture that
               is playing. Netflix × MI is this.

     external  the work lives on Instagram and the tile is a door to it.
               Four of the five are this.

     case      a case page on this site, /work/<slug>. None of the five
               are this today; the template is built and waiting, so
               swapping a piece over is a one-line change here rather
               than a component change.

   Making this a tagged union rather than three optional fields is the
   same rule the case blocks follow: a piece cannot accidentally be two
   kinds of thing at once, and the component switches on `kind` instead
   of guessing from which field happens to be set.
   ------------------------------------------------------------------ */
export type PinnedLink =
  | { kind: "film"; src: string }
  /* No label. It used to carry one so the button could say "View on
     Instagram"; the client wants "View" on all of them, so the word is
     the component's and there is nothing per-piece left to say. */
  | { kind: "external"; href: string }
  | { kind: "case"; slug: string };

export type PinnedCase = {
  slug: string;
  /* where this one goes when it is opened - see PinnedLink */
  link: PinnedLink;
  /* What the poster wall calls it, and what the cursor says over its
     tile. Not drawn on the stage itself: the small row above the
     headline already names the piece, and a brand set large above a
     headline that opens with the same brand is the name twice. */
  brand: string;
  /* The small row over the headline - the reference's genre line, and
     the client writes it as one: who it was for and what the work was.
     A list rather than a string so the rule between the parts is drawn
     rather than typed; see .wk-lede__tags. */
  tags: string[];
  /* The client's own headline, verbatim, upper case as they set it.
     This is the display line on the stage - it is what the piece has to
     say, and it says it better than the brand name does. */
  headline: string;
  /* The line under it. One sentence, and it answers the headline. */
  line: string;
  hero: string;
  /* The rail frame. The reference's poster wall is portrait and this
     was too, until the real thumbnails arrived: all five are 16:9, one
     per piece, and there is no second crop. Cropping a wide still to a
     2:3 poster centre-cuts the brand out of most of them, so the wall
     is 16:9 now and this is usually the same file as `hero`. It stays a
     separate field for the day a piece arrives with a proper portrait
     key art. */
  thumb: string;
  /* Set while the piece is still waiting on its writing. It draws the
     PENDING badge on the poster and nothing else - the piece is real,
     the words are not there yet. */
  pending?: boolean;
};

/* The five the client named, in the order they named them. All five
   are complete: their thumbnails, their links, their film, and their
   own headlines and lines - verbatim, in the case they set them.
   Nothing on this stage is a placeholder any more.

   ---- the small row ----

   What the work was, and on the first piece only, who it was for.

   Every one of the five used to open with a "<BRAND> X SOCheers" part,
   because the client wrote the row out that way for Netflix x MI and
   the rest were filled in to match. Read as a set - and the wall shows
   the set - it was the same construction five times over a headline
   that already names the brand, and the agency's own name repeated on
   every frame of its own site.

   So the naming part is kept where the client actually wrote it and
   dropped everywhere else. The "Social + ..." half is per-piece and
   stays on all five: it is the only place the page says what the work
   was.

   ---- the film ----

   Netflix x MI plays in the frame. The file is the web cut made by
   scripts/build-film.mjs from the 476MB 4K master the client uploaded -
   see the note in that script for what was done to it and why the
   master is not what the page loads.

   ---- the Instagram links ----

   Written without the `igsi=` parameter they arrived with. That is a
   share token tied to the account the link was copied from, it is not
   needed to open the post, and it does not belong in a public page's
   markup. The post ids are exactly as sent.
   ------------------------------------------------------------------ */
export const PINNED: PinnedCase[] = [
  {
    slug: "netflix-mi",
    link: { kind: "film", src: "/assets/work/pinned/netflix-mi.mp4" },
    brand: "Netflix × MI",
    tags: ["NETFLIX X MI X SOCheers", "Social + Film"],
    headline:
      "HOW DO YOU GET THE MUMBAI INDIANS TO ANNOUNCE NETFLIX AS THEIR NEW ENTERTAINMENT PARTNER WHEN THEY’RE BUSY WATCHING IT?",
    line: "Get the man who can become pretty much anyone.",
    hero: "/assets/work/pinned/netflix-mi.jpg",
    thumb: "/assets/work/pinned/netflix-mi.jpg",
  },
  {
    slug: "netflix-srh",
    link: {
      kind: "external",
      href: "https://www.instagram.com/p/DYMMLGPjbRn/",
    },
    brand: "Netflix × SRH",
    tags: ["Social + Film"],
    headline: "SOME ANNOUNCEMENTS ARE BETTER WHEN YOU TAKE THEM SLOWLY SLOWLY.",
    line: "Until the banger became SRH’S unofficial anthem.",
    hero: "/assets/work/pinned/netflix-srh.jpg",
    thumb: "/assets/work/pinned/netflix-srh.jpg",
  },
  {
    slug: "pantaloons-eoss",
    link: {
      kind: "external",
      href: "https://www.instagram.com/p/DadHSmiCGdZ/",
    },
    brand: "Pantaloons",
    tags: ["Social + Campaign"],
    headline:
      "FOR A BRAND WITH THIS MUCH LEGACY, HOW DO YOU KEEP IT MOVING THIS FAST?",
    line: "With drops coming every two weeks, we make sure they find their way into closets as much as they do into feeds.",
    hero: "/assets/work/pinned/pantaloons-eoss.jpg",
    thumb: "/assets/work/pinned/pantaloons-eoss.jpg",
  },
  {
    slug: "broadway",
    link: {
      kind: "external",
      href: "https://www.instagram.com/reel/DZNJBxaMb0n/",
    },
    brand: "Broadway",
    tags: ["Social + Film"],
    headline: "GETTING BANDRA TO LOOK AWAY FROM BOOJEE IS NO SMALL ASK.",
    line: "We made Broadway worth the detour, bringing 20,000+ people through the doors.",
    hero: "/assets/work/pinned/broadway.jpg",
    thumb: "/assets/work/pinned/broadway.jpg",
  },
  {
    slug: "prava",
    link: {
      kind: "external",
      href: "https://www.instagram.com/reel/DaiGcRnICTO/",
    },
    brand: "Prava",
    tags: ["Social + MicroSeries IP + Packaging"],
    headline: "GETTING A WATER BRAND MORE PERSONALITY THAN YOU’D EXPECT.",
    line: "Start with a can that has a lot more going on than water.",
    hero: "/assets/work/pinned/prava.jpg",
    thumb: "/assets/work/pinned/prava.jpg",
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

/* ------------------------------------------------------------------
   THE TILES, AND WHICH OF THEM ARE REAL.

   Two helpers, and the difference between them is the difference
   between work that has arrived and work that has not.

   `real()` is a campaign the client has actually sent. Its picture is a
   web copy under /assets/work/wall/ derived from their own master by
   scripts/build-wall.mjs - a resized case board, or for the case study
   films one frame pulled out of the cut. The wall never plays anything,
   so a film needs a still and nothing more; if a film ever has to play
   it wants the treatment in scripts/build-film.mjs first.

   `pending()` is a brand off the client's list with nothing behind it
   yet. It draws a repo placeholder and carries the PENDING badge. These
   are not filler for their own sake - the category tabs are the
   client's own five and a tab that filters to an empty wall reads as a
   broken site, so the brands they named hold their places until their
   work turns up.

   Swapping one over is a one-line change: drop the file in the drive
   folder, add it to TILES in scripts/build-wall.mjs, run the script,
   and move the entry from pending() to real().
   ------------------------------------------------------------------ */

/* The placeholder pictures, cycled so both orientations and a range of
   aspect ratios are exercised. Only pending() reads these. */
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

const pending = (
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

/* `id` is the tile's own file name under /assets/work/wall/ and the id
   it will carry on the CDN. `slug` is the separate, optional thing: the
   case page this campaign opens into. Two campaigns have one; the rest
   pass nothing and stay as tiles that do not move.

   `title` is off the client's own board or film - the line the work
   leads with - rather than anything written here. It is not drawn on
   the tile; it is the alt text, which is the one place a description of
   the picture is owed to someone who cannot see it.

   Sizes are the derived JPG's, printed by scripts/build-wall.mjs. */
const real = (
  id: string,
  brand: string,
  title: string,
  tag: string,
  kind: "image" | "video",
  w: number,
  h: number,
  /* Set only when a case page for this campaign actually exists in
     CASES below. Passing a slug for a page nobody has written yet gives
     the reader a link to lorem ipsum, which is worse than a tile that
     does not move. */
  slug?: string,
): WorkAsset => ({
  publicId: `work/${tag}/${id}`,
  brand,
  title,
  kind,
  thumb: `/assets/work/wall/${id}.jpg`,
  w, h,
  tags: [tag],
  ...(slug ? { slug } : {}),
});

export const WORK_ASSETS: WorkAsset[] = [
  /* ---- BFSI ---- */
  real("yes-bank", "Yes Bank", "Life Ko Banao Rich", "bfsi", "image", 1600, 1131),
  real("bhim-upi", "BHIM UPI", "Mother's Day", "bfsi", "video", 1600, 900),
  pending(0, "IndusInd", "bfsi", "video"),
  pending(3, "Zurich Kotak", "bfsi"),

  /* ---- FMCG ----
     Nothing here yet. Every folder under FMCG/ in the client's drive is
     empty, so all six are still holding their places. */
  pending(4, "Belgian Waffle", "fmcg"),
  pending(5, "Prava", "fmcg"),
  pending(6, "ITC", "fmcg", "video"),
  pending(7, "Havmor", "fmcg"),
  pending(8, "Tata Soulfull", "fmcg"),
  pending(9, "Yippee", "fmcg"),

  /* ---- Fashion / Beauty / Luxury ---- */
  real("superdry", "Superdry Sport", "Chase What Drives You", "fashion", "image", 1376, 768),
  real("wacoal", "Wacoal", "#WacoalKnowsBreast", "fashion", "image", 1600, 900),
  pending(11, "Raymond", "fashion", "video"),
  pending(13, "Nykaa", "fashion"),
  pending(21, "Carlton", "fashion"),

  /* ---- Entertainment ----
     The Netflix x MI case study film in this folder is the same file as
     the pinned stage's, so it is not tiled here as well - the wall
     would be showing the reader the piece they have just scrolled past.
     Its own tile is the stage. */
  real("maa-behen", "Netflix · Maa Behen", "Reserved for Women. Reclaimed for Maa Behen.", "entertainment", "image", 1600, 1600, "maa-behen"),
  /* The case that covers both pinned Netflix pieces at once. Its own
     key art, not either of theirs - see the note in build-wall.mjs. */
  real("netflix-mi-srh", "Netflix × MI × SRH", "Chill Like a Champion", "entertainment", "video", 1600, 900, "netflix-mi-srh"),
  real("dhurandhar-2", "Netflix · Dhurandhar 2", "Two weeks before its original home", "entertainment", "video", 1600, 900),
  real("special-ops-2", "JioHotstar · Special Ops 2", "Leaked", "entertainment", "video", 1600, 900),
  real("made-in-titan", "Titan", "Made in India - A Titan Story", "entertainment", "video", 1600, 900),
  pending(15, "Ab Hoga Hissab", "entertainment"),
  pending(17, "Family Man × Alexa", "entertainment"),

  /* ---- Others ----
     Two Croma pieces, which is correct and looks like a mistake, so:
     the second arrived named FLIPKART-MOODBOARD-4.jpg and the board is
     Croma's throughout - Flipkart is the competitor the campaign is
     answering, not the client. Named for whose work it is. */
  real("boat", "boAt", "boAt × Marvel - Unleash Your Super", "others", "image", 1600, 1132),
  real("croma", "Croma", "AC Badhau Ya Ghatau", "others", "image", 1600, 900),
  real("croma-dreams", "Croma", "Flipping the Carts on the Competitors", "others", "image", 1600, 900),
  real("bgmi", "BGMI", "Update Podcast", "others", "image", 1600, 1135),
  pending(18, "TCS", "others"),
  pending(19, "Cipla Innoventia", "others"),
  pending(22, "Cordelia Cruises", "others"),
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
/* The frame a moving picture is played in. Named rather than free, so a
   set of social cutdowns cannot arrive as seven slightly different
   heights: "wide" is a film, "tall" is anything cut for a phone, "square"
   is a feed post. Default is wide, because most things are. */
export type Ratio = "wide" | "tall" | "square" | "four-five";

export type CaseBlock =
  | { type: "copy"; heading?: string; body: string }
  | { type: "image"; src: string; w: number; h: number; caption?: string; bleed?: boolean }
  | { type: "duo"; a: string; b: string; caption?: string }
  /* `src` is a file URL *or* a YouTube / Vimeo link - see parseVideo() in
     lib/video.ts. A poster is optional for the hosted providers because
     they have one of their own; for an .mp4 it is worth setting, since
     the alternative is a black rectangle until the reader presses play. */
  | { type: "video"; src: string; poster?: string; ratio?: Ratio; caption?: string }
  /* Several films in a row - the social cutdowns, the six-second edits,
     the regional versions. One block rather than a run of video blocks
     because they are one thing, and because a row of phone-shaped films
     wants to be a row rather than a stack. */
  | { type: "reel"; items: { src: string; poster?: string; label?: string }[]; ratio?: Ratio; caption?: string }
  | { type: "board"; src: string; w: number; h: number; caption?: string }
  /* Any number of stills as a grid. `duo` stays because a considered
     pair is its own composition; this is for the six frames from the
     shoot that are a gallery and not a layout. */
  | { type: "gallery"; items: { src: string; caption?: string }[]; cols?: 2 | 3 | 4; caption?: string }
  /* The reference's numbered service grid, read as scope: what was
     actually made. Numbered by position, so reordering does not mean
     renumbering by hand. */
  | { type: "scope"; heading?: string; items: { title: string; body?: string }[] }
  /* The reference's process timeline. Phases in order, each with a line
     and optionally a frame from that phase. */
  | { type: "steps"; heading?: string; items: { title: string; body: string; src?: string }[] }
  /* The billing block every work piece ends up needing: client, scope,
     year, the people. Label / value pairs so it never has to be a
     fixed set of fields. */
  | { type: "credits"; heading?: string; items: { label: string; value: string }[] }
  | { type: "stats"; items: { figure: string; label: string }[] }
  /* `role` and `avatar` are the reference's testimonial card; without
     them this is the plain pull quote it has always been. */
  | { type: "quote"; text: string; who: string; role?: string; avatar?: string }
  /* Native <details>, so it opens without JavaScript and is findable by
     the browser's own find-in-page. */
  | { type: "faq"; heading?: string; items: { q: string; a: string }[] };

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
  /* Set when the case has a film and you have not placed it in the block
     list yourself. It puts "Watch the film" on the frame and drops the
     film in as the first thing under the lede - so the shortest possible
     work piece is a hero, a film link and one paragraph, and it is a
     finished page.

     Leave it off when the film belongs somewhere else in the story and
     put a `video` block where you want it: the button appears for any
     case that has a film in it, wherever it sits. See caseBlocks(). */
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

/* ============================================================
   HOW TO ADD A WORK PIECE.

   One entry in the array below. There is no route to create, no
   component to touch and no image list to register - the slug becomes
   /work/<slug>, the page prerenders, and the card appears at the foot
   of every other case.

   ---- the smallest one that is finished ----

     {
       slug: "brand-campaign",
       brand: "Brand",
       title: "Campaign name",
       meta: ["2025", "FMCG", "Film"],
       intro: "The one paragraph under the title.",
       hero: "/assets/.../still.jpg",
       film: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
       blocks: [{ type: "copy", heading: "The brief", body: "..." }],
     }

   That is a hero, a film that plays where the reader expects it, a
   heading and a paragraph, and it reads as a complete page. `film` may
   be a YouTube link, a Vimeo link or an .mp4 - see lib/video.ts - and
   nothing downstream needs to know which.

   ---- everything that can go in `blocks` ----

   In any order, any number of times, and anything absent is simply not
   written. Do not add an empty one to "keep the rhythm": the rhythm is
   what is there.

     { type: "copy",   heading: "The challenge", body: "..." }
     { type: "image",  src, w, h, caption?, bleed? }        one still
     { type: "duo",    a, b, caption? }                     a considered pair
     { type: "gallery",items: [{ src, caption? }], cols?: 2|3|4 }
     { type: "video",  src, poster?, ratio?, caption? }     file / YouTube / Vimeo
     { type: "reel",   items: [{ src, poster?, label? }], ratio? }   the cutdowns
     { type: "board",  src, w, h, caption? }                a tall artboard
     { type: "scope",  heading?, items: [{ title, body? }] }        what we made
     { type: "steps",  heading?, items: [{ title, body, src? }] }   how it was made
     { type: "stats",  items: [{ figure, label }] }
     { type: "quote",  text, who, role?, avatar? }
     { type: "credits",heading?, items: [{ label, value }] }
     { type: "faq",    heading?, items: [{ q, a }] }

   `ratio` is "wide" | "tall" | "square" | "four-five" and defaults to
   wide for a film and tall for a reel - so a set of Reels cutdowns is
   `{ type: "reel", items: [...] }` and nothing else.

   Any block carrying a `heading` shows up in the rail's contents list
   on its own; that list is derived, never written out. See
   caseHeadings().

   ---- the two things worth knowing ----

   Blocks with a heading are what the reader navigates by, so a page of
   nothing but pictures gets no contents list. That is correct, not a
   bug - there is nothing to list.

   Copy is written as it will read. Nothing here title-cases, truncates
   or reflows a line, so a headline with a deliberate lower-case "i" or
   a line break the client asked for survives exactly as typed.
   ============================================================ */
export const CASES: CaseStudy[] = [
  /* ------------------------------------------------------------------
     THE FIRST REAL CASE.

     Every word below is off the client's own case board - the file at
     Entertainment/Maa Behen/MAA-BEHEN---Case-Study-(NEW).jpg.jpeg,
     which is a finished case study that happened to be delivered as a
     picture. The headings are its headings and the paragraphs are its
     paragraphs; nothing here was written for the website.

     Two things to know if this is ever compared against the board:

     The board's headline reads RENAMED for Maa Behen and the campaign
     cover reads RECLAIMED. Both are the client's, so each is kept where
     they put it - the board's word is the page's title because the page
     is the board, and the cover keeps its own on the wall tile.

     The board sets the renamings with arrows, and they are kept as
     arrows rather than turned into a sentence, because that is the
     idea: the old sign on the left, the new sign on the right.
     ------------------------------------------------------------------ */
  {
    slug: "maa-behen",
    brand: "Netflix · Maa Behen",
    title: "Reserved for Women. Renamed for Maa Behen.",
    meta: ["Entertainment", "Out of Home · Social", "Delhi Metro"],
    intro:
      "Delhi Metro has designated compartments exclusively for women. For Netflix's Maa Behen, we turned this everyday piece of public infrastructure into the campaign itself.",
    /* The poster in the compartment, shot on the day. It is the hero
       rather than the campaign cover because the cover carries its own
       headline set large, and a page title laid over a headline is two
       headlines. This one is a photograph with room in it. */
    hero: "/assets/work/cases/maa-behen/transit.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The problem",
        body: "Maa Behen (“Mother Sister” in Hindi) is a film about three women pushing back against society’s rules and judgement. Instead of advertising to women, we wanted to launch the film inside a space already reserved for them.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "Millions of women travel every day in Delhi Metro’s women-only compartments, identified by familiar “Ladies Only” signage. For a film called Maa Behen, the media space was already there.",
      },
      {
        type: "image",
        src: "/assets/work/cases/maa-behen/train.jpg",
        w: 720, h: 1280,
        caption: "Western Railway, Mumbai",
      },
      {
        type: "copy",
        heading: "The creative proposition",
        body: "If the space belonged to women, its language could belong to Maa Behen. Instead of adding ads, we transformed the Metro’s existing women-only signage into media for the film.",
      },
      {
        type: "copy",
        heading: "The creative manifestation",
        body: "We didn’t advertise inside the Ladies’ Compartment. We renamed it. “Ladies Only” → “Entry for Maa Behen Only.” “Reserved for Ladies” → “Reserved for Maa Behen.” From doors to compartment signage, the transit’s everyday language became the campaign.",
      },
      {
        type: "copy",
        heading: "Impact",
        body: "Commuters noticed before we told them to. Women began photographing and sharing the renamed signage organically, turning an everyday piece of transit infrastructure into a citywide conversation.",
      },
      {
        type: "stats",
        items: [
          { figure: "17M", label: "Organic social media reach" },
          { figure: "250K", label: "In earned media" },
          { figure: "1.3M", label: "Total media reach" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/cases/maa-behen/board.jpg",
        w: 2400, h: 1350,
        caption: "The case board",
      },
      {
        type: "credits",
        items: [
          { label: "Client", value: "Netflix" },
          { label: "Scope", value: "Out of Home · Social" },
          { label: "Placement", value: "Inside Delhi Metro" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------
     THE NETFLIX x IPL CASE - real picture, real film, no write-up yet.

     This is a third piece, not a duplicate of either pinned one. Netflix
     x MI and Netflix x SRH are the two announcements on the stage; this
     is the case that covers the season across both teams, and the
     client sent it with its own key art - "Chill like a champion" -
     which is why the wall tile is a picture nobody has seen upstairs.

     ---- about the film ----

     The file in Entertainment/Netflix x MI x SRH/ was byte for byte the
     same 487MB master as the pinned film - same md5 - so this page
     plays the web cut that already exists rather than a second copy of
     the same thing at a different filename. If the case is meant to run
     a different edit, that edit has not arrived yet.

     The words have not arrived either, so this is `pending`: the badge
     is drawn, the picture and the film are real, and the copy below is
     a placeholder in the same shape the rest of this file uses.
     ------------------------------------------------------------------ */
  {
    slug: "netflix-mi-srh",
    brand: "Netflix × MI × SRH",
    title: "Chill Like a Champion",
    meta: ["PENDING", "Entertainment", "Film · Social"],
    intro:
      "PENDING - the opening paragraph for the season across both teams. The picture and the film on this page are the client's; these words are not.",
    hero: "/assets/work/wall/netflix-mi-srh.jpg",
    film: "/assets/work/pinned/netflix-mi.mp4",
    pending: true,
    blocks: [
      { type: "copy", heading: "The brief", body: LOREM },
      {
        type: "credits",
        items: [
          { label: "Client", value: "Netflix" },
          { label: "Scope", value: "Film · Social" },
          { label: "Year", value: "PENDING" },
        ],
      },
    ],
  },

  {
    slug: "netflix-mi",
    brand: "Netflix × MI",
    title: "PENDING - campaign title",
    meta: ["PENDING", "Entertainment", "Film · Social"],
    intro: LOREM,
    hero: "/assets/work-entertainment.png",
    film: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4",
    pending: true,
    /* The reference page's full section vocabulary, in one case, so
       every block type can be looked at rendered before the real work
       pieces land. Open this next to /work/odyssey, which has three
       blocks: if the short one still reads as finished, the template
       holds. */
    blocks: [
      { type: "copy", heading: "The client", body: LOREM },
      { type: "copy", heading: "The challenge", body: LOREM },
      { type: "duo", a: "/assets/series/kink.jpg", b: "/assets/series/binge.jpg", caption: "PENDING - caption" },
      { type: "copy", heading: "Our approach", body: LOREM },
      { type: "scope", heading: "What we made", items: [
        { title: "PENDING - the film", body: LOREM },
        { title: "PENDING - the cutdowns", body: LOREM },
        { title: "PENDING - the stills", body: LOREM },
        { title: "PENDING - the always-on", body: LOREM },
      ] },
      { type: "image", src: "/assets/work-entertainment.png", w: 1600, h: 900, bleed: true, caption: "PENDING - caption" },
      { type: "copy", heading: "The execution", body: LOREM },
      { type: "video", src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/streaming.jpg", caption: "PENDING - the case film" },
      /* PENDING - three of the same file standing in for the cutdowns.
         Real ones are usually YouTube or Vimeo links, which go in the
         same field. */
      { type: "reel", caption: "PENDING - the cutdowns", items: [
        { src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/kink.jpg", label: "PENDING - 30s" },
        { src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/binge.jpg", label: "PENDING - 15s" },
        { src: "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4", poster: "/assets/series/streaming.jpg", label: "PENDING - 6s" },
      ] },
      { type: "steps", heading: "How it was made", items: [
        { title: "PENDING - discovery", body: LOREM, src: "/assets/series/kink.jpg" },
        { title: "PENDING - pre-production", body: LOREM },
        { title: "PENDING - the shoot", body: LOREM, src: "/assets/series/binge.jpg" },
        { title: "PENDING - post", body: LOREM },
      ] },
      { type: "board", src: "/assets/series/close-band.jpg", w: 1252, h: 495, caption: "PENDING - the case board" },
      { type: "gallery", cols: 3, caption: "PENDING - frames from the shoot", items: [
        { src: "/assets/series/kink.jpg" },
        { src: "/assets/series/binge.jpg" },
        { src: "/assets/series/streaming.jpg" },
      ] },
      { type: "copy", heading: "The outcome", body: LOREM },
      { type: "stats", items: [
        { figure: "00M", label: "PENDING - reach" },
        { figure: "00%", label: "PENDING - engagement" },
        { figure: "00K", label: "PENDING - shares" },
      ] },
      { type: "quote", text: "PENDING - a line from the client or the press.", who: "PENDING - attribution", role: "PENDING - title, brand" },
      { type: "credits", heading: "Credits", items: [
        { label: "Client", value: "PENDING" },
        { label: "Agency", value: "SoCheers" },
        { label: "Scope", value: "PENDING" },
        { label: "Year", value: "PENDING" },
      ] },
      { type: "faq", heading: "Questions", items: [
        { q: "PENDING - a question a reader asks after seeing this.", a: LOREM },
        { q: "PENDING - the second one.", a: LOREM },
      ] },
    ],
  },
  {
    slug: "titan-made-in-india",
    brand: "Titan",
    title: "Made in India",
    meta: ["PENDING", "Others", "Film · Social"],
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
    meta: ["PENDING", "Others", "Content · Social"],
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
    meta: ["PENDING", "Others", "Campaign"],
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

/* ------------------------------------------------------------------
   THE BLOCKS A CASE ACTUALLY RENDERS.

   Everything on the page reads the list through here rather than off
   `c.blocks`, because there is one thing the page adds: a case that
   names a film but does not place it gets that film first, under the
   lede. That is the whole of the magic, and it exists so the minimum
   viable work piece is three fields - hero, film, one paragraph -
   rather than a hero, a film, a paragraph and a correctly positioned
   video block that repeats the URL.

   A case that already has a video block is left exactly as written: the
   author has said where the film goes, and this does not second-guess
   them or add a second copy of it.
   ------------------------------------------------------------------ */
export const caseBlocks = (c: CaseStudy): CaseBlock[] =>
  c.film && !c.blocks.some((b) => b.type === "video")
    ? [{ type: "video", src: c.film, poster: c.hero }, ...c.blocks]
    : c.blocks;

/* Whether the frame gets its one action. Derived from the blocks rather
   than from `c.film` on its own - the button scrolls to the film, so the
   only honest condition for showing it is that there is a film on the
   page to scroll to. */
export const caseHasFilm = (c: CaseStudy) =>
  caseBlocks(c).some((b) => b.type === "video");

/* The contents list for the rail, derived from the blocks rather than
   written out. The id is the block's own index and not a counter over
   the headings, so it stays the same rule in both places that need it -
   here and in the renderer - and neither has to know how many headings
   came before it. */
const HEADED = new Set(["copy", "scope", "steps", "credits", "faq"]);

export const caseHeadings = (blocks: CaseBlock[]) =>
  blocks.flatMap((b, i) =>
    HEADED.has(b.type) && "heading" in b && b.heading
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
