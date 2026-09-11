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

   The browse wall under it is most of the way there. Fifteen campaigns
   are real now - the client's own case boards, key art and case study
   films out of assets/SC Website Revamp/03. Work/, cut for the web by
   scripts/build-wall.mjs. The rest of the brands on their list are
   still holding their places behind placeholder pictures. FMCG used to
   be the whole of one empty tab; Belgian Waffle is the first thing in
   it, and the other five are still waiting.

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
  "/assets/art/work-bfsi.webp",
  "/assets/art/work-entertainment.webp",
  "/assets/work-lifestyle.jpg",
  "/assets/art/work-b2b.webp",
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
  /* A brand can have its write-up before it has its pictures - the five
     BFSI and FMCG cases arrived as copy with the imagery still to come.
     Those tiles keep the placeholder picture and the PENDING badge, and
     still open into the case page, because the page is real. */
  slug?: string,
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
    ...(slug ? { slug } : {}),
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
  real("yes-bank", "Yes Bank", "Life Ko Banao Rich", "bfsi", "image", 1376, 768, "yes-bank"),
  real("bhim-upi", "BHIM UPI", "Ask Her Again", "bfsi", "video", 1600, 900, "bhim-upi"),
  real("indusind", "IndusInd General Insurance", "Forward Together", "bfsi", "video", 1600, 900, "indusind-general-insurance"),
  real("zurich-kotak", "Zurich Kotak", "Game of Dares", "bfsi", "video", 1376, 768, "zurich-kotak-game-of-dares"),

  /* ---- FMCG ----
     Belgian Waffle, ITC and Havmor are real - every folder under FMCG/ in
     the client's drive used to be empty. The other three brands are still
     holding their places. */
  real("belgian-waffle", "The Belgian Waffle Co.", "Everyone Knows", "fmcg", "video", 1600, 1200, "belgian-waffle"),
  pending(5, "Prava", "fmcg"),
  real("itc", "ITC Store", "Naa Ready", "fmcg", "image", 1376, 768, "itc-naa-ready"),
  real("havmor", "Havmor", "#80YearsOfHappyMemories", "fmcg", "image", 1600, 625, "havmor-80-years"),
  pending(8, "Tata Soulfull", "fmcg"),
  pending(9, "Yippee", "fmcg"),

  /* ---- Fashion / Beauty / Luxury ---- */
  real("superdry", "Superdry Sport", "Chase What Drives You", "fashion", "image", 1376, 768, "superdry"),
  real("wacoal", "Wacoal", "#WacoalKnowsBreast", "fashion", "image", 1600, 900, "wacoal"),
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
  real("dhurandhar-2", "Netflix · Dhurandhar 2", "Two weeks before its original home", "entertainment", "video", 1600, 900, "dhurandhar-2"),
  real("special-ops-2", "JioHotstar · Special Ops 2", "Leaked", "entertainment", "video", 1600, 900, "special-ops-2"),
  real("made-in-titan", "Titan", "Made in India - A Titan Story", "entertainment", "video", 1600, 900, "made-in-titan"),
  real("mandala-murders", "Netflix · Mandala Murders", "The World of Mandala Murders", "entertainment", "image", 960, 540, "mandala-murders"),
  pending(15, "Ab Hoga Hissab", "entertainment"),
  pending(17, "Family Man × Alexa", "entertainment"),

  /* ---- Others ----
     Two Croma pieces, which is correct and looks like a mistake, so:
     the second arrived named FLIPKART-MOODBOARD-4.jpg and the board is
     Croma's throughout - Flipkart is the competitor the campaign is
     answering, not the client. Named for whose work it is. */
  real("boat", "boAt", "boAt × Marvel - Unleash Your Super", "others", "image", 1600, 1132, "boat-marvel"),
  real("croma", "Croma", "AC Badhau Ya Ghatau", "others", "image", 1600, 900, "croma-ac-badhau-ya-ghatau"),
  real("croma-dreams", "Croma", "Flipping the Carts on the Competitors", "others", "image", 1600, 900, "croma-festival-of-dreams"),
  real("bgmi", "BGMI", "Update Podcast", "others", "image", 1600, 1135, "bgmi-update-podcast"),
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
  /* Phone screen grabs, each in a drawn handset at its own proportions -
     a feed before and after, a run of stories. */
  | { type: "phones"; items: { src: string; w: number; h: number; label?: string }[]; caption?: string }
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
  /* `large` is a bigger cut of the same board: served to screens that can
     use it, and what the frame links out to for zooming. */
  | { type: "board"; src: string; w: number; h: number; caption?: string; large?: { src: string; w: number } }
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
  | { type: "stats"; heading?: string; items: { figure: string; label: string }[] }
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

     The client's own write-up, verbatim, with the photo from the day
     and their finished case board - the file at
     Entertainment/Maa Behen/MAA-BEHEN---Case-Study-(NEW).jpg.jpeg.

     The board's headline reads RENAMED for Maa Behen and the campaign
     cover reads RECLAIMED. Both are the client's, so each is kept where
     they put it - the board's word is the page's title because the page
     is the board, and the cover keeps its own on the wall tile.
     ------------------------------------------------------------------ */
  {
    slug: "maa-behen",
    brand: "Netflix · Maa Behen",
    title: "Reserved for Women. Renamed for Maa Behen.",
    meta: ["Entertainment", "Out of Home · Social", "Delhi Metro"],
    intro:
      "Maa Behen is a film about three women pushing back against society’s rules and judgements.",
    /* The poster in the compartment, shot on the day. It is the hero
       rather than the campaign cover because the cover carries its own
       headline set large, and a page title laid over a headline is two
       headlines. This one is a photograph with room in it. */
    hero: "/assets/work/cases/maa-behen/transit.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "We wanted to launch it in a space where women were already a defined part of the environment: Delhi Metro’s women-only compartments.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "The Metro already had a language for women: “Ladies Only” and “Reserved for Ladies.”\n\nFor a film called Maa Behen, we could simply change who those signs were talking to.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We renamed the Metro’s existing signage for Maa Behen.\n\n“Ladies Only” → “Entry for Maa Behen Only.”\n\n“Reserved for Ladies” → “Reserved for Maa Behen.”\n\nThe new signage went across the women-only compartments, turning the Metro’s existing infrastructure into the film’s media.",
      },
      {
        type: "image",
        src: "/assets/work/cases/maa-behen/train.jpg",
        w: 720, h: 1280,
        caption: "Western Railway, Mumbai",
      },
      {
        type: "stats",
        items: [
          { figure: "17M+", label: "Organic social reach" },
          { figure: "250K", label: "Earned media" },
          { figure: "1.3M", label: "Total media reach" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/cases/maa-behen/board.jpg",
        w: 2400, h: 1350,
        caption: "The case board",
      },
    ],
  },

  /* ------------------------------------------------------------------
     NETFLIX · DHURANDHAR 2 - the client's own write-up, verbatim, and
     their case video on YouTube, which opens the page. Then the pictures
     from the drive: the teaser billboard, the launch poster, and the
     airport screen beside the press pickup.
     ------------------------------------------------------------------ */
  {
    slug: "dhurandhar-2",
    brand: "Netflix · Dhurandhar 2",
    title: "Ghar Aa Gaya, Jassi.",
    meta: ["Entertainment", "Out of Home"],
    intro:
      "Dhurandhar 1 was a hit in theatres and eventually on Netflix with its characters and lines becoming part of internet pop culture.",
    hero: "/assets/work/wall/dhurandhar-2.jpg",
    film: "https://www.youtube.com/watch?v=AT-L7dGUBp0",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "The catch was that the film was releasing on another streaming platform two weeks earlier, so Netflix had no trailer, footage or other launch assets to work with.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "Dhurandhar had already given people plenty to quote. One line in particular had stuck:\n\n“Ghar ki yaad nahi aayi tujhe, Jassi?”\n\nIt was perfect for what we needed. Because once Netflix asked Jassi the question, “ghar” could mean something else too.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We put “Ghar ki yaad nahi aayi tujhe, Jassi?” on billboards across India, with Netflix signing off the line.\n\nThen we left it there for a few days. As the Netflix premiere came closer, the same billboards changed to:\n\n“Ghar aa gaya, Jassi.”\n\nThe question had its answer. And Netflix had its announcement.",
      },
      {
        type: "image",
        src: "/assets/work/cases/dhurandhar-2/teaser.jpg",
        w: 1448, h: 1086,
      },
      {
        type: "image",
        src: "/assets/work/cases/dhurandhar-2/poster.jpg",
        w: 1600, h: 1600,
      },
      /* Both are 4:5 already, so the duo's cells take them whole. */
      {
        type: "duo",
        a: "/assets/work/cases/dhurandhar-2/launch.jpg",
        b: "/assets/work/cases/dhurandhar-2/press.jpg",
      },
    ],
  },

  /* ------------------------------------------------------------------
     THE NETFLIX x IPL CASE - the season across both teams, told by its
     case study film. No board and no write-up came with it; the client
     attached the film, so the film is the page (see caseIsVisual). It is
     byte for byte the pinned stage's master, so it plays the web cut that
     already exists. The intro is only the page description.
     ------------------------------------------------------------------ */
  {
    slug: "netflix-mi-srh",
    brand: "Netflix × MI × SRH",
    title: "Chill Like a Champion",
    meta: ["Entertainment", "Film · Social"],
    intro: "Netflix × MI × SRH - Chill Like a Champion.",
    hero: "/assets/work/wall/netflix-mi-srh.jpg",
    film: "/assets/work/pinned/netflix-mi.mp4",
    blocks: [],
  },

  /* ------------------------------------------------------------------
     NETFLIX · MANDALA MURDERS - the client's own write-up, verbatim.
     It is one run of copy with no brief / insight / what-we-did beats, so
     it has no headings. It is split in two only so each set of pictures
     sits after the half it belongs to: the 3D room after the digital
     build, the real one after it leaves the screen.

     The hero is the client's thumbnail, the same picture as the wall
     tile, so the page opens on what the reader clicked.
     ------------------------------------------------------------------ */
  {
    slug: "mandala-murders",
    brand: "Netflix · Mandala Murders",
    title: "The World of Mandala Murders",
    meta: ["Entertainment", "Digital · 3D · Experiential"],
    intro: "A murder mystery is only as immersive as the world around it.",
    hero: "/assets/work/wall/mandala-murders.jpg",
    blocks: [
      {
        type: "copy",
        body: "For Mandala Murders, we spent 150+ working hours building that world piece by piece.\n\nFirst came the characters, brought to life digitally and introduced one by one. Then came 3D, adding the kind of detail you could almost feel through the screen.",
      },
      {
        type: "image",
        src: "/assets/work/cases/mandala-murders/renders.jpg",
        w: 1600, h: 444,
        bleed: true,
      },
      {
        type: "copy",
        body: "And then we took the whole thing out of the screen.\n\nThe Mandala Murders Escape Room brought the world into a real mall, with every detail planned and every corner mapped to make the experience feel like you had stepped inside the show.",
      },
      {
        type: "duo",
        a: "/assets/work/cases/mandala-murders/entrance.jpg",
        b: "/assets/work/cases/mandala-murders/props.jpg",
      },
    ],
  },

  /* ------------------------------------------------------------------
     TITAN and JIOHOTSTAR · SPECIAL OPS 2 - the case study film is the
     whole case. Neither came with a board or a write-up; the client
     attached the film, cut for the web by scripts/build-film.mjs. With
     nothing to read the page lays out as a visual case (caseIsVisual):
     the film across the full width under the hero. The intros are only
     the page descriptions.
     ------------------------------------------------------------------ */
  {
    slug: "made-in-titan",
    brand: "Titan",
    title: "Made in India - A Titan Story",
    meta: ["Entertainment", "Film"],
    intro: "Titan - Made in India, A Titan Story.",
    hero: "/assets/work/wall/made-in-titan.jpg",
    film: "/assets/work/cases/made-in-titan/film.mp4",
    blocks: [],
  },

  {
    slug: "special-ops-2",
    brand: "JioHotstar · Special Ops 2",
    title: "Leaked",
    meta: ["Entertainment", "Film"],
    intro: "JioHotstar · Special Ops 2 - Leaked.",
    hero: "/assets/work/wall/special-ops-2.jpg",
    film: "/assets/work/cases/special-ops-2/film.mp4",
    blocks: [],
  },

  /* ------------------------------------------------------------------
     SUPERDRY SPORT - the client's own write-up, verbatim. The brief is a
     single sentence, so it is the lede and there is no brief block under
     it. Then the campaign film, the hoarding, and the two Sunday Times
     front pages side by side (composited by scripts/build-wall.mjs,
     because the gallery's 4:5 cell would crop the mastheads off).
     ------------------------------------------------------------------ */
  {
    slug: "superdry",
    brand: "Superdry Sport",
    title: "Chase What Drives You",
    meta: ["Fashion / Beauty / Luxury", "Film · Social · Outdoor · Print"],
    intro:
      "Superdry Sport was launching in India, and the launch needed a communication that could define what the brand stood for in sport and establish the thought that would sit behind it.",
    hero: "/assets/work/wall/superdry.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The insight",
        body: "Performance is what people see. What drives it is what makes it personal.\n\nThe reason someone trains harder, plays longer, gets back on the court or keeps chasing the next level is different for everyone. There’s always something behind the performance. That gave us Chase What Drives You.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We identified Rasha Thadani and Lakshya Suri as the faces of this range and then shot the campaign film with them, bringing their own energy and pursuit into the idea.\n\nFrom there, we built out the launch across social, outdoor and a front-page Sunday Times takeover, and brought the brand into the sporting community through experiences like Sip & Padel, with Lakshya on court alongside fitness creators.",
      },
      {
        type: "video",
        src: "https://www.youtube.com/watch?v=2VYRKzOfJL0",
        caption: "Superdry Sport | Lakshya | Rasha Thadani | Chase What Drives You",
      },
      {
        type: "image",
        src: "/assets/work/cases/superdry/hoarding.jpg",
        w: 1600, h: 1200,
      },
      {
        type: "image",
        src: "/assets/work/cases/superdry/print.jpg",
        w: 1600, h: 1234,
      },
    ],
  },

  /* ------------------------------------------------------------------
     THE FIVE WRITTEN-UP CASES - the client's own copy for BFSI and FMCG,
     sent as a document rather than as case boards. Every heading and
     every line below is theirs; the only editorial act was breaking the
     bodies at the beats they wrote them in, which the copy block now
     renders as paragraphs.

     YES BANK is here rather than in the board batch below because its
     write-up was rewritten by the client and replaces what was
     transcribed off the board. The board itself is still on the page.

     These arrived as copy with the pictures still to come, and the
     pictures have since come: the Game of Dares stills and film, the
     IndusInd launch film and before/after grid, the Belgian Waffle board
     and influencer pickups, and a second set of YES BANK creatives. Every
     hero on them is now the campaign's own key art rather than repo
     placeholder. The BHIM case video has since been cut for the web too,
     by scripts/build-film.mjs.
     ------------------------------------------------------------------ */
  {
    slug: "yes-bank",
    brand: "YES BANK",
    title: "Life Ko Banao Rich",
    meta: ["BFSI", "Social · Influencer"],
    intro:
      "YES BANK was going through a rebrand, with a new identity and a new thought: Life Ko Banao Rich.",
    hero: "/assets/work/wall/yes-bank.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "The challenge was to make that idea mean something more than financial wealth, and show people what a richer life could actually look like.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "A bank statement usually tells you what happened to your money. But a rich life has a very different set of transactions. Time with your parents. A spontaneous night out. A holiday you still talk about. The little moments you'd happily spend on again.\n\nSo we asked a simple question: what would your life statement look like if it measured the moments that made it rich?",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We turned one of the most recognisable things a bank sends you into something far more personal: a Life Ki Statement from YES BANK.\n\nUsing the format of a real bank statement, we reimagined everyday moments as deposits, withdrawals and balances, with influencers showing what richness meant in their own lives.\n\nThe campaign then extended across social, giving people more ways to see that richness isn't only what sits in your bank account. It's also what fills your life.\n\nLife Ko Banao Rich became a way for YES BANK to talk about wealth in a much more human way.",
      },
      {
        type: "stats",
        heading: "And it worked.",
        items: [
          { figure: "72M", label: "Total Instagram reach" },
          { figure: "10X", label: "Engagement across Facebook + Instagram" },
          { figure: "3.1M", label: "Organic reach on LinkedIn" },
          { figure: "10%", label: "Follower growth on LinkedIn" },
        ],
      },
      /* The four social posts, as one picture rather than four blocks or
         a gallery - they are 1:1 and the gallery cell is 4:5, which would
         crop every one of them through its logo. Composited by
         scripts/build-wall.mjs; see the note over COMPOSITES there. */
      {
        type: "image",
        src: "/assets/work/cases/yes-bank/creatives.jpg",
        w: 1600, h: 1600,
        caption: "Life Ko Banao Rich, across the feed",
      },
      {
        type: "board",
        src: "/assets/work/cases/yes-bank/board.jpg",
        w: 1600, h: 1131,
        large: { src: "/assets/work/cases/yes-bank/board-large.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  /* ------------------------------------------------------------------
     ZURICH KOTAK - the client's own write-up, verbatim, and now their
     own pictures too: the deck as it was rendered and as it was printed,
     the New Year film, and the case board.
     ------------------------------------------------------------------ */
  {
    slug: "zurich-kotak-game-of-dares",
    brand: "Zurich Kotak General Insurance",
    title: "Game of Dares",
    meta: ["BFSI", "Gaming · Quick Commerce"],
    intro:
      "New Year is all about getting people together and having a good time.",
    hero: "/assets/work/wall/zurich-kotak.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "That gave Zurich Kotak a much more interesting way into the occasion than another festive message.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "New Year parties have their own little routine. Food gets ordered, people get together, and sooner or later someone reaches for a game.\n\nAnd this year, there was yet another behaviour that was a new addition to fulfil this routine. Zepto - a brand that was already becoming part of how people prepared for the celebration, delivering everything from the last-minute essentials to the things nobody remembered to buy until the party had already started.\n\nIf the occasion was already happening on Zepto, and the behaviour was already happening around a game, we had two very useful pieces of the puzzle.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We brought them together with Game of Dares, a card game that folded insurance into the kind of playful challenges people were already looking for on New Year's Eve.\n\nThe game was then distributed through Zepto, reaching people at the very moment they were ordering for their celebrations.\n\nSo instead of asking people to engage with an insurance campaign, we gave them something they could actually bring to the party.",
      },
      /* The film is cut 4:5 for a feed, so it is placed here rather than
         left to `film` - the automatic block runs 16:9 and would draw a
         portrait film in a letterbox twice its width. The hero's "watch
         the film" still finds it; see caseBlocks(). */
      {
        type: "video",
        src: "/assets/work/cases/zurich-kotak/new-year.mp4",
        poster: "/assets/work/wall/zurich-kotak.jpg",
        ratio: "four-five",
        caption: "The New Year film",
      },
      /* The deck itself: two studio renders and two photographs of the
         printed cards, which is the point of putting them in one row -
         the thing was made, not only designed. */
      {
        type: "gallery",
        cols: 4,
        items: [
          { src: "/assets/work/cases/zurich-kotak/deck-box.jpg" },
          { src: "/assets/work/cases/zurich-kotak/deck-cards.jpg" },
          { src: "/assets/work/cases/zurich-kotak/deck-held.jpg" },
          { src: "/assets/work/cases/zurich-kotak/deck-fan.jpg" },
        ],
        caption: "Game of Dares - the deck, and the deck in somebody's house",
      },
      {
        type: "stats",
        heading: "And it worked.",
        items: [
          { figure: "17,000+", label: "Game of Dares decks found their way into homes" },
          { figure: "8.8M", label: "Reach" },
          { figure: "164K", label: "Engagements" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/cases/zurich-kotak/board.jpg",
        w: 1600, h: 900,
        caption: "The case board",
      },
    ],
  },

  /* ------------------------------------------------------------------
     BHIM UPI - the client's own write-up, verbatim.

     The case video is the web cut of their broadcast master, made by
     scripts/build-film.mjs, and sits under the figures where the
     write-up puts it.
     ------------------------------------------------------------------ */
  {
    slug: "bhim-upi",
    brand: "BHIM UPI",
    title: "Ask Her Again",
    meta: ["BFSI", "Social · Film", "Mother's Day"],
    intro:
      "Every Mother's Day, we ask our mothers the same question: What do you want? And every year, millions of mothers give us the same answer: Nothing.",
    hero: "/assets/work/wall/bhim-upi.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "BHIM wanted to use Mother's Day to challenge that answer, and make its role in giving people financial freedom feel relevant to mothers too.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "A mother knows exactly what her child wants.\n\nShe remembers the toy we pointed at in a shop. The restaurant we've been talking about. The thing we casually mentioned six months ago and forgot about themselves. Yet ask her what she wants, and “nothing” comes almost instinctively.\n\nWe've spent generations calling that selflessness. But somewhere along the way, selflessness became conditioning. A reflex so deeply learnt that she has stopped being asked to choose for herself. So maybe the problem was never that mothers didn't want anything. Maybe we just got too comfortable accepting “nothing” as an answer.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "For Mother's Day, BHIM launched Ask Her Again.\n\nWe asked the internet to do one small thing differently: when your mother said “nothing”, don't accept the first answer. Ask her again.\n\nAnd when children pushed a little harder, the “nothing” started giving way to the things she actually wanted. The conversation then moved beyond families, as brands across India joined in and helped turn a private exchange into a larger cultural issue.\n\nBecause financial agency isn't just about having money. It's about feeling free enough to choose what to do with it.",
      },
      {
        type: "stats",
        heading: "And it worked.",
        items: [
          { figure: "7.6M", label: "Views" },
          { figure: "75+", label: "UGC entries" },
          { figure: "1.8L+", label: "App downloads in 3 days" },
          { figure: "50%", label: "Increase in gift card feature volume" },
        ],
      },
      {
        type: "video",
        src: "/assets/work/cases/bhim-upi/film.mp4",
        poster: "/assets/work/wall/bhim-upi.jpg",
      },
    ],
  },

  /* ------------------------------------------------------------------
     INDUSIND GENERAL INSURANCE - the client's own write-up, verbatim,
     with the launch film and the before/after feed grid they asked for.
     ------------------------------------------------------------------ */
  {
    slug: "indusind-general-insurance",
    brand: "IndusInd General Insurance",
    title: "Rebranding",
    meta: ["BFSI", "Brand Film · Social"],
    intro:
      "Reliance General Insurance was becoming IndusInd General Insurance.",
    hero: "/assets/work/wall/indusind.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "For a brand that people were already familiar with, a rebrand is a strange moment: the name, identity and visual world change, while the relationship with the brand has to remain familiar.\n\nHaving handled Reliance General's communication end-to-end, we were tasked with carrying that transition across its communication, from the first brand film to everyday social content.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "A new identity doesn't become familiar because you announce it once. People need to see it, recognise it and keep seeing it before the new name starts feeling like the brand they already knew.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We took the new IndusInd General Insurance identity through the entire communication journey, starting with the launch film and carrying it into the everyday content that followed.\n\nThe communication began subtly introducing the new identity on social, while the visual language of the feed moved from the old Reliance General world to the new IndusInd General Insurance one.",
      },
      /* The write-up asks for the case video and then the feed before and
         after, in that order - so the film is placed here rather than
         left to `film`, which would put it first. The hero's "watch the
         film" still finds it. The feed grabs are 399x864 phone screens,
         drawn in handsets side by side. */
      {
        type: "video",
        src: "/assets/work/cases/indusind/rebranding.mp4",
        poster: "/assets/work/wall/indusind.jpg",
      },
      {
        type: "phones",
        items: [
          { src: "/assets/work/cases/indusind/before.jpg", w: 399, h: 864, label: "Before" },
          { src: "/assets/work/cases/indusind/after.jpg", w: 399, h: 864, label: "After" },
        ],
        caption: "The feed, before and after",
      },
    ],
  },

  /* ------------------------------------------------------------------
     BELGIAN WAFFLE - the client's own write-up, verbatim, and the first
     piece of FMCG work on the site. The film is their own case video.
     ------------------------------------------------------------------ */
  {
    slug: "belgian-waffle",
    brand: "The Belgian Waffle Co.",
    title: "Everyone Knows",
    meta: ["FMCG", "Social · Outdoor · Influencer"],
    intro:
      "National Waffle Day falls on 19th July, and The Belgian Waffle Co. had already made the date synonymous with waffles.",
    hero: "/assets/work/wall/belgian-waffle.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "The job was to keep that association growing, and turn the day into a moment people would actively look forward to.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "By this point, 19th July didn't need an introduction. People already knew what the date meant.\n\nSo instead of spending the campaign telling everyone that National Waffle Day was coming, we decided to make the date itself the conversation.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We started by putting a fake ₹100 note into every order, with a simple message: “You know what this means, right?”\n\nThat became the first clue to 19th July. Influencers picked it up, employees took their own #EveryoneKnows stories on LinkedIn, and the conversation kept building around what was coming.\n\nThen we took it out of the feed and into the streets, turning the same ₹100 idea into outdoor, with the date and the offer waiting for people across the city.\n\nBy 19th July, the word was out. And so were the queues.",
      },
      /* The ₹100 note itself, off the case video - cropped out of a screen
         grab so the player's own title bar and buttons are not on it. */
      {
        type: "image",
        src: "/assets/work/cases/belgian-waffle/note.jpg",
        w: 1600, h: 635,
      },
      /* The influencer leg, as it was actually seen: two phone screen
         grabs, drawn at close to their own size rather than blown up
         across the column. They are 256px wide and they are not going to
         get sharper - they are also the only record of that part of the
         campaign the client sent. */
      {
        type: "image",
        src: "/assets/work/cases/belgian-waffle/influencers.jpg",
        w: 540, h: 470,
        caption: "The influencers picked it up",
      },
      {
        type: "stats",
        heading: "And it worked.",
        items: [
          { figure: "143.3M+", label: "Reach" },
          { figure: "123.6M+", label: "Views" },
          { figure: "2.2M+", label: "Engagements" },
          { figure: "5L+", label: "Footfalls" },
        ],
      },
      {
        type: "video",
        src: "https://www.youtube.com/watch?v=wv8XtVq8HbA",
        poster: "/assets/work/wall/belgian-waffle.jpg",
      },
      {
        type: "board",
        src: "/assets/work/cases/belgian-waffle/board.jpg",
        w: 1536, h: 864,
        caption: "The case board",
      },
    ],
  },

  /* ------------------------------------------------------------------
     ITC STORE and HAVMOR - the client's own write-ups, verbatim, with the
     pictures from the second drop where the write-ups ask for them: the
     creatives after What we did (one picture each - see COMPOSITES in
     scripts/build-wall.mjs), then the figures, then the case board. The
     hero is each campaign's own thumbnail.
     ------------------------------------------------------------------ */
  {
    slug: "itc-naa-ready",
    brand: "ITC Store",
    title: "Naa Ready",
    meta: ["FMCG", "Hyperlocal · Social · Influencer"],
    intro: "ITC products were already popular in Chennai.",
    hero: "/assets/work/wall/itc.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "The problem was that when people wanted them, they were buying them everywhere else. ITC Store needed to become the place Chennai thought of first when it was time to stock up.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "In Chennai, cinema doesn’t stay on the screen. It becomes a language, a mood, a way of responding to everyday life. And few things captured that better than Thalapathy’s “Naa Ready”.\n\nThe phrase had already become a cultural shorthand for being up for whatever came next. That was exactly the territory ITC Store needed to own.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We turned “Naa Ready” into a hyperlocal campaign for ITC Store, making Chennai the star and its people the “Thalaivas” of their own lives.\n\nThe campaign showed up wherever those everyday challenges and occasions did, from social and influencers to WhatsApp, the ITC Store website and media partnerships with Meta, Criteo and Flipkart. Local festivals, local buying habits and local humour all became part of the communication.\n\nAnd wherever Chennai was ready for something, ITC Store was ready with them.",
      },
      {
        type: "image",
        src: "/assets/work/cases/itc/creatives.jpg",
        w: 1600, h: 797,
      },
      {
        type: "stats",
        items: [
          { figure: "47%", label: "Increase in customer retention" },
          { figure: "179%", label: "Growth in new orders" },
          { figure: "48%", label: "Increase in revenue" },
          { figure: "13X", label: "More website visits" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/cases/itc/board.jpg",
        w: 1600, h: 900,
        large: { src: "/assets/work/cases/itc/board-large.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  {
    slug: "havmor-80-years",
    brand: "Havmor",
    title: "#80YearsOfHappyMemories",
    meta: ["FMCG", "Packaging · Out of Home · Social"],
    intro:
      "Havmor was turning 80. And while an anniversary is usually a chance for a brand to look back at everything it has achieved, we had a much bigger archive to work with: 80 years of Havmor in people’s lives.",
    hero: "/assets/work/wall/havmor.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "The brief was to celebrate that history through the people who had actually lived it.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "Havmor could tell us when it started. Only its consumers could tell us what those 80 years meant.\n\nThe ice cream had been there for summer holidays, family outings, first dates, midnight cravings and all the little occasions that people remember long after the ice cream is gone.\n\nSo the anniversary wasn't really about collecting 80 years of Havmor history. It was about getting India to open its own memory bank.",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We turned #80YearsOfHappyMemories into a nationwide call for stories, using limited-edition packs, OOH, newspapers and social to get people sharing their own Havmor memories.\n\nThose memories became the content. Some were brought to life on social, while the campaign kept giving people reasons to add their own. One story even earned its author a trip to Italy, and selected fans were invited into Havmor's factory to meet the brand behind their memories.",
      },
      {
        type: "image",
        src: "/assets/work/cases/havmor/creatives.jpg",
        w: 1600, h: 1600,
      },
      {
        type: "stats",
        items: [
          { figure: "20,000+", label: "Memories submitted" },
          { figure: "9 lakh+", label: "Packs sold in under 48 hours" },
          { figure: "150M+", label: "Views" },
          { figure: "620K+", label: "Engagements" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/cases/havmor/board.jpg",
        w: 1280, h: 907,
        caption: "The case board",
      },
    ],
  },

  /* ------------------------------------------------------------------
     THE CASE BOARDS - campaigns the client sent as a finished case
     study image and no write-up. The board is the write-up, so the page
     shows the board and does not retell it in paragraphs: the hero, the
     board across the full width, and a link out to read it at full
     size. See caseIsVisual() for the layout that gets.

     `large` is the 2400 cut from scripts/build-wall.mjs, served to
     screens that can use it. Wacoal has none - its master is 1672 wide,
     so the tile is already the largest there is. The intros are kept
     for the page description and are not drawn.
     ------------------------------------------------------------------ */
  {
    slug: "boat-marvel",
    brand: "boAt",
    title: "Unleash Your Super",
    meta: ["Others", "Marvel Collaboration", "Social · Content"],
    intro:
      "A boAt × Marvel audio collection built for boAtheads and Marvel fans alike, inviting them to #UnleashYourSuper.",
    hero: "/assets/work/cases/boat-marvel/hero.jpg",
    blocks: [
      {
        type: "board",
        src: "/assets/work/wall/boat.jpg",
        w: 1600, h: 1132,
        large: { src: "/assets/work/cases/boat-marvel/board.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  /* Croma's AC case has had its write-up since this batch was set - the
     client's own, verbatim - so it reads like the written cases above:
     copy, the figures, then the board. */
  {
    slug: "croma-ac-badhau-ya-ghatau",
    brand: "Croma",
    title: "Settling the Debate for Once - AC Badhau Ya Ghatau?",
    meta: ["Others", "Social · Influencer"],
    intro:
      "There’s one AC instruction that has probably caused more arguments in Indian homes than it deserves: “AC badha do.”",
    hero: "/assets/work/cases/croma-ac/hero.jpg",
    blocks: [
      {
        type: "copy",
        heading: "The brief",
        body: "Does that mean increase the temperature? Increase the cooling? Or, depending on who’s saying it, something else entirely? Croma decided it was time to settle the debate.",
      },
      {
        type: "copy",
        heading: "The insight",
        body: "The problem was hiding in the language itself.\n\nWe all say “AC badhana” and “AC ghatana”, but rarely stop to think about what we actually mean. Which meant everyone had an answer, and somehow everyone could still be right.\n\nThat gave Croma a rather entertaining question to put to the country:\n\n“AC badhane ka matlab kya hai?”",
      },
      {
        type: "copy",
        heading: "What we did",
        body: "We took the question to the streets.\n\nInfluencers conducted Vox Pops across the country, asking people to define what “AC badhana” actually meant. The answers turned a household disagreement into a proper internet debate, which Croma then turned into a viral rap video to finally give the question its moment.\n\nMemes, contests and giveaways kept the debate moving, while Croma's AC exchange offer gave the conversation a very practical ending: if the AC is the problem, maybe it’s time to change the AC.",
      },
      {
        type: "stats",
        items: [
          { figure: "19.07M", label: "Reach" },
          { figure: "3.26%", label: "Engagement" },
          { figure: "5.26M", label: "Rap video views" },
        ],
      },
      {
        type: "board",
        src: "/assets/work/wall/croma.jpg",
        w: 1600, h: 900,
        large: { src: "/assets/work/cases/croma-ac/board.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  {
    slug: "croma-festival-of-dreams",
    brand: "Croma",
    title: "Flipping the Carts on the Competitors",
    meta: ["Others", "Festival of Dreams", "Out of Home · Social"],
    intro:
      "When a competitor's billboard started a trend, Croma's Festival of Dreams answered overnight - with a bigger billboard and a free iPhone.",
    hero: "/assets/work/cases/croma-dreams/hero.jpg",
    blocks: [
      {
        type: "board",
        src: "/assets/work/wall/croma-dreams.jpg",
        w: 1600, h: 900,
        large: { src: "/assets/work/cases/croma-dreams/board.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  {
    slug: "bgmi-update-podcast",
    brand: "BGMI",
    title: "Update Podcast - BGMI Gives a Spin to the Updates",
    meta: ["Others", "Influencer · Video"],
    intro:
      "Gamers rely on trusted sources for complex game updates. Teaming up with esports celebrities for a fun explainer campaign bypasses unreliable information and delivers clear, engaging content.",
    hero: "/assets/work/cases/bgmi/hero.jpg",
    blocks: [
      {
        type: "board",
        src: "/assets/work/wall/bgmi.jpg",
        w: 1600, h: 1135,
        large: { src: "/assets/work/cases/bgmi/board.jpg", w: 2400 },
        caption: "The case board",
      },
    ],
  },

  {
    slug: "wacoal",
    brand: "Wacoal",
    title: "#WacoalKnowsBreast",
    meta: ["Fashion / Beauty / Luxury", "Breast Cancer Awareness", "Influencer · CGI"],
    intro:
      "Advancing breast cancer awareness with 3 simple steps - Wacoal, a premium Japanese lingerie brand, ventured into the second year of the campaign #WacoalKnowsBreast, solidifying itself as an intellectual property for breast cancer awareness.",
    hero: "/assets/work/cases/wacoal/hero.jpg",
    blocks: [
      {
        type: "board",
        src: "/assets/work/wall/wacoal.jpg",
        w: 1600, h: 900,
        caption: "The case board",
      },
    ],
  },

  {
    slug: "netflix-mi",
    brand: "Netflix × MI",
    title: "PENDING - campaign title",
    meta: ["PENDING", "Entertainment", "Film · Social"],
    intro: LOREM,
    hero: "/assets/art/work-entertainment.webp",
    film: "/assets/work/cases/placeholder/home-banner-video.mp4",
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
      { type: "image", src: "/assets/art/work-entertainment.webp", w: 1600, h: 900, bleed: true, caption: "PENDING - caption" },
      { type: "copy", heading: "The execution", body: LOREM },
      { type: "video", src: "/assets/work/cases/placeholder/home-banner-video.mp4", poster: "/assets/series/streaming.jpg", caption: "PENDING - the case film" },
      /* PENDING - three of the same file standing in for the cutdowns.
         Real ones are usually YouTube or Vimeo links, which go in the
         same field. */
      { type: "reel", caption: "PENDING - the cutdowns", items: [
        { src: "/assets/work/cases/placeholder/home-banner-video.mp4", poster: "/assets/series/kink.jpg", label: "PENDING - 30s" },
        { src: "/assets/work/cases/placeholder/home-banner-video.mp4", poster: "/assets/series/binge.jpg", label: "PENDING - 15s" },
        { src: "/assets/work/cases/placeholder/home-banner-video.mp4", poster: "/assets/series/streaming.jpg", label: "PENDING - 6s" },
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
        { label: "Agency", value: "SoCheers" },
        { label: "Year", value: "PENDING" },
      ] },
      { type: "faq", heading: "Questions", items: [
        { q: "PENDING - a question a reader asks after seeing this.", a: LOREM },
        { q: "PENDING - the second one.", a: LOREM },
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
const HEADED = new Set(["copy", "scope", "steps", "credits", "faq", "stats"]);

export const caseHeadings = (blocks: CaseBlock[]) =>
  blocks.flatMap((b, i) =>
    HEADED.has(b.type) && "heading" in b && b.heading
      ? [{ id: `heading-${i}`, label: b.heading }]
      : [],
  );

/* Whether a case has anything to read. The case boards arrive as the
   whole case study in one picture, and a page of only pictures has no
   reading column for the rail to sit beside - so the rail becomes a row
   over the work and the work gets the full width. Derived from the
   blocks like the contents list is, so a board case that later gets a
   write-up changes layout by getting one. */
const TEXT = new Set(["copy", "scope", "steps", "credits", "stats", "quote", "faq"]);

export const caseIsVisual = (blocks: CaseBlock[]) =>
  !blocks.some((b) => TEXT.has(b.type));

/* The copy hero this page used to open with is gone - the stage is the
   first thing on the page now and the work introduces itself. What was
   the hero's eyebrow and lede survives as the browse wall's heading,
   which is the one place on the page that still needs a sentence. */
/* The eyebrow and title that used to head the browse wall are gone at
   the client's request - the wall now opens on its tabs. Only the count
   is left, and it is not drawn either: it is the live region a screen
   reader hears when a filter changes. See WorkGrid.tsx. */
export const WORK_BROWSE = {
  /* The small label over the tabs. */
  heading: "Select work pieces",
  /* The count under the filter. It is a live number rather than a
     sentence about how much work there is, which is the one thing a
     filtered wall owes the reader: a tab that returns four things
     should say four before they have to count the tiles. */
  count: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"} of work`,
} as const;
