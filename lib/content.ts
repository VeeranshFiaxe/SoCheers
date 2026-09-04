/* Everything the page says, in one place. */

/* Anything under /assets/art/ is written by scripts/build-art.mjs out of
   the file the client delivered, which stays where they put it. Five of
   these arrived as PNGs of photographs - three megabytes to say what
   WebP says in four hundred kilobytes, because PNG codes flat colour and
   none of these are flat - and the artwork below was a PNG with a .jpg
   on the end of it. Re-run that script if a master is replaced. */
export const IMG = {
  frame: "/assets/art/socheers-frame.webp",
  /* 7680x4320. The hero blows this up past 1.7x the viewport width, so the
     3840 cut went soft on any hi-dpi screen; same framing, twice the pixels,
     which is what keeps the sand wall's crop of it lining up.

     Which is a good reason for the file to exist and not a reason to send
     it to a phone: 33 megapixels is about 130MB of bitmap to decode for a
     picture that will be drawn at two. So this is the top of a set rather
     than the only one - see TEAM_SRCSET below and the two <img> that use
     it (components/Hero.tsx, components/ContactModal.tsx). */
  team: "/assets/team-group-uhd.jpg",
  camera: "/assets/arri-camera-DX29MVBW.jpg",
  brain: "/assets/brain-DH7sqVir.jpg",
  creativity: "/assets/home/creativity-7.webp",
  photoshop: "/assets/photoshop-face-BOtm4GGN.jpg",
  bootPhone: "/assets/boot-phone-BJcXYlVw.jpg",
  culture: "/assets/art/culture.webp",
  workBfsi: "/assets/art/work-bfsi.webp",
  workEntertainment: "/assets/art/work-entertainment.webp",
  workLifestyle: "/assets/work-lifestyle.jpg",
  workB2b: "/assets/art/work-b2b.webp",
} as const;

/* The team photo's three widths, for the two places it is drawn. Both of
   them draw it full-bleed, which is what `sizes` says - so the browser
   picks on the device's own pixel width and a 4K laptop still ends up on
   the 7680. */
export const TEAM_SRCSET =
  "/assets/art/team-1920.jpg 1920w, /assets/art/team-3840.jpg 3840w, /assets/team-group-uhd.jpg 7680w";
export const TEAM_SIZES = "100vw";

/* ------------------------------------------------------------------
   The overture's walls, front to back - the images the bulb reveals and
   then knocks down, one behind the other, before the last one turns out
   to be the hero itself.

   Order is a story, not a shuffle: people first (who), then the tools and
   the craft, then the thinking, then back out to the room full of people.
   The falls get faster as it goes (see lib/overture-motion.ts), so the
   later entries are only on screen for a few frames - they read as texture
   rather than as pictures, which is why the loudest, highest-contrast
   images are deliberately at the back.

   Every file here is preloaded, silently, before the flicker is allowed
   to catch (see boot() in lib/overture-motion.ts) - so keep this list
   small and keep the files light, nothing here is above ~450KB.

   THE PHONE'S COLUMN.  A wall is a viewport-sized plane, so on a phone
   every one of these is being asked to fill a box about 0.46 wide where
   the desktop asks for 1.6-1.8. object-fit:cover answers that by showing
   roughly a quarter of a landscape picture's width, which is not a crop,
   it is a different photograph - the subject leaves the frame and what is
   left reads as a rendering fault rather than as a wall.

   So each entry gets two optional extras, and neither of them exists
   above 700px (see the mobile block at the end of the OVERTURE section in
   app/globals.css) - the desktop run is byte-for-byte the one it always
   was:

     m     a stand-in for the phone, and it is only ever here because the
           landscape original has nothing left once it is cut to a column.
           Every one of them is a 9:16 asset already in the same folder
           and on the same subject as the wall it replaces, so this is the
           same running order shot portrait, not a different sequence.
     mpos  object-position for the phone's crop, for the pictures that do
           survive the cut but only if it is taken off centre - a subject
           sitting high in a landscape frame is the usual reason.

   The list, its length, its order and its labels are identical at both
   widths: FALL/OVERLAP/SOUND_WALLS in lib/overture-motion.ts index this
   array by position, so the phone gets the same tempo, the same thuds and
   the same story beats. Only the pictures inside the frames change. */
type Wall = {
  img: string;
  label: string;
  /** portrait stand-in, phones only */
  m?: string;
  /** object-position for the phone's crop */
  mpos?: string;
};

export const OVERTURE_WALLS: readonly Wall[] = [
  /* 1920x680 - the widest thing in the run. It holds up in a column
     because it is a poster of stacked faces rather than one wide scene:
     the cut loses the outer faces and keeps three of them, which is a
     composition. Nudged up off centre so it keeps whole heads rather
     than a band of shoulders. */
  { img: "/assets/art/crowd-wall.webp", label: "The room", mpos: "50% 42%" },
  /* already near-portrait at 0.80, and the camera is high in the frame -
     the operator's shoulder is what goes, which is what should go */
  { img: IMG.camera, label: "Production", mpos: "50% 34%" },
  /* Horizontal on purpose: this wall is held long enough to be read as a
     picture, and the tall 9:16 art that used to sit here (creativity 7,
     now down in the fast tail) lost most of itself to the crop on a wide
     screen. Wall 3 - the cat - came out of this slot; Wall 2 is promoted
     up from the fast tail to take it, being the strongest of the three
     landscape walls and one that survives being looked at rather than
     glimpsed.

     Walls 4-7 were delivered as landscape art saved rotated into a
     portrait box, and have been turned 90deg back the right way up in
     the asset folder itself rather than with a CSS transform - a wall is
     a textured plane in a 3D stack (lib/overture-motion.ts) and rotating
     the picture on it would rotate the plane. They read as landscape from
     here on, so this slot has more than three candidates now if the
     running order is ever re-cut. */
  /* the one landscape wall at the front that survives the column intact:
     the crowd is stacked in depth, so cutting the width just makes it a
     taller crowd */
  { img: "/assets/home/wall-2.webp", label: "Attention" },
  /* Wall 6 - the engraved ship - used to hold a fourth slot here, as the
     second of the two walls the sequence was still slow enough to look
     at. It is out, and nothing is promoted up to replace it: cutting a
     beat out of the front of the run is the point, so what follows just
     moves one place forward and arrives one notch faster off the ramp in
     lib/overture-motion.ts. */
  /* The puppeteer's hand is above the brain and the strings run the height
     of the frame, so a column cuts the hand off the top and leaves a brain
     with strings going nowhere. "Strategy 10" is out of the same set -
     same rust red, same halftone, same hand on the same strings - drawn
     for a 9:16 box, so the phone gets the identical beat rather than a
     substitute for it. It is also 46KB against the 1.4MB of the other
     brain in the folder, which on the wall that a phone preloads is not a
     small thing. */
  {
    img: IMG.brain,
    label: "Strategy",
    m: "/assets/home/strategy-10.webp",
  },
  { img: IMG.bootPhone, label: "Content" },
  /* the real team, square, and the group is banked up the middle of it -
     lifted a little so the cut takes floor rather than faces */
  { img: "/assets/art/who-culture.webp", label: "Us", mpos: "50% 44%" },
  /* extra beats, tacked on the back where the falls are already fastest and
     the images are only ever read as texture, not pictures - see FALL/
     OVERLAP in lib/overture-motion.ts. Past SOUND_WALLS (same file) these
     stop getting their own impact thud: at this speed a sound per wall
     started reading as more walls than were actually on screen. */
  /* A table seen from above with people round all four edges: the column
     keeps the empty white table and cuts the heads in half at the top and
     the bottom of it, which is the worst crop in the run. "Strategy 8" -
     a man over a chessboard - is planning drawn upright, and it is one of
     the pictures the tail is already made of. */
  {
    img: "/assets/home/wall-1.webp",
    label: "Planning",
    m: "/assets/home/strategy-8.webp",
  },
  /* Wall 5, into the slot Wall 2 left on its way up the stack. It is the
     last of the eight walls that wasn't already in here - which is why
     the beat Wall 8 (the op-art) used to hold is simply gone rather than
     refilled: there was one spare wall for two slots, and repeating an
     image inside one sequence is worse than one fewer beat in a tail
     that is texture anyway. FALL/OVERLAP in lib/overture-motion.ts index
     by position and clamp, so a shorter list just ends sooner. */
  { img: "/assets/home/wall-5.webp", label: "Focus" },
  /* 9:16 already - the one wall in the run the phone does not have to be
     given anything for. It is here because it was too tall for a wide
     screen, which is the same observation from the other end. */
  { img: IMG.creativity, label: "Creativity" },
  { img: "/assets/home/wall-4.webp", label: "Reverie" },
  { img: IMG.photoshop, label: "Retouch" },
  /* the horizon is a thin band across the bottom of a wide frame, and a
     column of it is mostly empty sky. "Production 9" keeps the horizon
     and stands something on it. */
  {
    img: "/assets/home/wall-7.webp",
    label: "Horizon",
    m: "/assets/home/production-9.webp",
  },
];

/* the wall that does not fall */
export const OVERTURE_FINAL = IMG.frame;

/* the three cues, one per beat: the rope going over, the filament
   catching, a wall meeting the floor. See sfx() in lib/overture-motion.ts
   for how they're actually played. */
export const OVERTURE_SFX = {
  pull: "/assets/sfx/string-pull.mp3",
  on: "/assets/sfx/light-on.mp3",
  fall: "/assets/sfx/wall-fall.mp3",
  /* the finale's camera push into the standing hero wall - see finale()
     in lib/overture-motion.ts */
  expand: "/assets/sfx/logo-expand.mp3",
} as const;

/* the whir a WHAT WE DO service line gets as the pointer arrives on it -
   "Copywriting", "Integrated Campaigns" and the rest, not the card itself.
   One of the two is picked at random each time so a run down a list doesn't
   repeat the exact same hit. See initWCardCycle() in lib/motion.ts, and the
   note there for why it is off the card's frame cycle. */
export const WCARD_SFX = [
  "/assets/sfx/frames-1.mp3",
  "/assets/sfx/frames-2.mp3",
] as const;

/* A bare "#..." is an on-page anchor; anything else is a real route.
   components/Chrome.tsx rewrites the hashes when the nav is on a sub-page.

   `soon` is a label with nowhere to go yet: it renders as plain text rather
   than a link, so the slot is held in the running order while the page
   behind it is still being built. Drop the flag and give it an href the
   moment there is one.

   Work, Series and AI Work are all real routes now. Two of them used to
   be hashes into the home page - Series pointed at #awards, the
   recognition ticker, and Work at #what, the services grid. Both were
   the right stand-in while the tab did not exist and the wrong link the
   moment it did: "Series" and the awards ticker are different things
   that happened to share a word, and what the agency does is not the
   same page as what it has made. */
export const NAV_LINKS: { href: string; label: string; soon?: boolean }[] = [
  /* The front page is "/", not "#top". It used to be an anchor into the
     home page's own <main>, which meant hovering Home showed a hash in the
     status bar and clicking it wrote one into the address bar - the site's
     front door named after a scroll position. It is a real route now, and
     on the home page itself initTopLinks() (lib/motion.ts) takes the click
     and scrolls instead of reloading. */
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Work" },
  { href: "/ai-work", label: "AI Work" },
  { href: "/series", label: "Series" },
  /* HIDDEN, NOT DELETED - the two earlier passes at this tab are still in
     the tree and still reachable by URL, they are just off the nav while
     the picked direction is the one on show.

     /series      what used to be /series-test: the copy staged flat, one
                  treatment per beat - app/series/.
     /series-1    the first pass, the rewrite with its fourteen scroll
                  mechanics - app/series-1/.
     /series-deck the client's own PowerPoint ported slide for slide, its
                  words rather than the rewrite's - app/series-deck/.

     Put a line back here to show one again; each page's own header
     comment lists what goes with it if one is ever deleted instead. */
  { href: "/insights", label: "Insights" },
];

/* the dictionary entry, written over the photo at the end of the hero pin */
export const MEANING = {
  word: "SoCheers",
  phonetic: "/soh-cheers/",
  pos: "noun.",
  senses: ["A toast.", "An email sign-off.", "An agency."],
  note: "(Not necessarily in that order.)",
} as const;


export const STATS = [
  { count: 200, label: "People" },
  { count: 12, label: "Years" },
  { count: 30, label: "Categories" },
];

/* Per-bucket hover reels for the WHAT WE DO cards - the first frame in each
   is the existing cover (untouched), the rest are the "2..10" pass the
   client dropped into the same folder. Cycled on hover, see initWCardCycle()
   in lib/motion.ts.

   Every service line under a card also owns one frame out of its own
   bucket's reel - `img` on each item below. Pointing at the card runs the
   reel; pointing at a line stops it on that line's frame, which is what
   makes the picture answer the word rather than just move behind it.

   The pairings are positional, not pictorial, and it is worth being plain
   about why: the assets arrive named "Strategy 2..10", so there is nothing
   in them that says which one is Media Planning and which is Insights. So
   each list is dealt the reel in order from frame 2 on, leaving frame 1 -
   the cover - as the resting picture it already was. They are written out
   one by one rather than computed from the index precisely so that this is
   a line to edit the day someone who has seen the images wants Copywriting
   to be a particular one of them. */
/* The home folder's pictures are referenced out of /assets/home now,
   not out of the client's delivery folder. scripts/build-art.mjs writes
   them: the eight overture walls at 1800 on the long edge and the card
   reels at 1100, both as WebP. Two of the card frames were 1.3MB PNGs of
   photographs for a picture drawn 500px wide at 28% opacity; the whole
   folder came down from about 8MB to 1.5MB and nothing about it looks
   different. Re-run that script if a master is replaced. */

export const BUCKETS = [
  {
    idx: "01",
    name: "Strategy",
    img: "/assets/home/strategy-9.webp",
    images: [
      "/assets/home/strategy-9.webp",
      "/assets/home/strategy-7.webp",
      "/assets/home/strategy-2.webp",
      "/assets/home/strategy-3.webp",
      "/assets/home/strategy-4.webp",
      "/assets/home/strategy-5.webp",
      "/assets/home/strategy-6.webp",
      "/assets/home/strategy-8.webp",
      "/assets/home/strategy-10.webp",
    ],
    items: [
      { label: "Brand Positioning", img: "/assets/home/strategy-7.webp" },
      { label: "Digital Strategy", img: "/assets/home/strategy-2.webp" },
      { label: "Content Planning", img: "/assets/home/strategy-3.webp" },
      { label: "Insights & Journey Mapping", img: "/assets/home/strategy-4.webp" },
      { label: "Communications Planning", img: "/assets/home/strategy-5.webp" },
      { label: "Media Planning", img: "/assets/home/strategy-6.webp" },
    ],
  },
  {
    idx: "02",
    name: "Creativity",
    img: "/assets/home/creativity-7.webp",
    images: [
      "/assets/home/creativity-7.webp",
      "/assets/home/creativity-2.webp",
      "/assets/home/creativity-3.webp",
      "/assets/home/creativity-4.webp",
      "/assets/home/creativity-5.webp",
      "/assets/home/creativity-6.webp",
      "/assets/home/creativity-8.webp",
      "/assets/home/creativity-9.webp",
      "/assets/home/creativity-10.webp",
    ],
    items: [
      { label: "Integrated Campaigns", img: "/assets/home/creativity-2.webp" },
      { label: "Creative & Content Development", img: "/assets/home/creativity-3.webp" },
      { label: "Copywriting", img: "/assets/home/creativity-4.webp" },
      { label: "Branding & Merchandising", img: "/assets/home/creativity-5.webp" },
      { label: "Tactical Execution", img: "/assets/home/creativity-6.webp" },
    ],
  },
  {
    idx: "03",
    name: "Production",
    img: IMG.camera,
    images: [
      IMG.camera,
      "/assets/home/production-2.webp",
      "/assets/home/production-3.webp",
      "/assets/home/production-4.webp",
      "/assets/home/production-5.webp",
      "/assets/home/production-6.webp",
      "/assets/home/production-7.webp",
      "/assets/home/production-8.webp",
      "/assets/home/production-9.webp",
      "/assets/home/production-10.webp",
    ],
    items: [
      { label: "TVC & DVC", img: "/assets/home/production-2.webp" },
      { label: "Digital Production", img: "/assets/home/production-3.webp" },
      { label: "Social Content", img: "/assets/home/production-4.webp" },
      { label: "Photography", img: "/assets/home/production-5.webp" },
      { label: "Audio & Mixing", img: "/assets/home/production-6.webp" },
      { label: "Motion + 3D", img: "/assets/home/production-7.webp" },
    ],
  },
];

export const CLIENT_ROWS: { dir: "left" | "right"; names: string[] }[] = [
  {
    dir: "left",
    names: [
      "Netflix", "JioHotstar", "TCS", "Pantaloons", "Raymond", "Superdry",
      "ITC", "Sunfeast Yippee!", "Nykaa Pro", "Schweppes",
      "Universal Pictures", "Sony LIV",
    ],
  },
  {
    dir: "right",
    names: [
      "Audi", "YES Bank", "Bingo!", "Carlton", "Broadway", "Dabur",
      "Haldiram's", "Chandon", "Glenmorangie", "ASUS", "IndusInd", "boAt",
    ],
  },
  {
    dir: "left",
    names: [
      "Havmor", "Belgian Waffle", "Zurich Kotak", "BHIM", "Lupin",
      "Reliance General", "Croma", "Nykaa", "Schweppes", "ITC",
    ],
  },
];

/* ---- the names, drawn in their own letterforms ----

   The wall used to be thirty-odd names in the site's bold sans, which is
   accurate and unrecognisable: these are brands a reader knows by their
   type before they know them by their spelling, and one typeface throws
   that away.

   What is NOT the answer is a lookalike font off a font library. Raymond,
   Nykaa, Bingo!, Schweppes, Haldiram's - those letterforms were drawn
   once, by hand, for that brand. They were never cut as typefaces, so
   there is no font to find; anything close enough to fool you does not
   exist, and anything that exists is not close.

   So the mark itself is the type. Every entry points at a wordmark in
   public/assets/clients, cut from the supplied 6144x4096 wall - letters
   only, no devices, which is how that artwork already draws them. The
   row renders each as a CSS MASK rather than an image, and that is what
   keeps it a wall of type instead of a logo sheet: a mask carries only
   the shape, so each mark arrives in the row's own grey and takes its
   own colour on hover, exactly as the text did.

     slug  the file in public/assets/clients
     ar    the mark's own width/height, so the row sizes by height and
           lets the width follow rather than squashing anything
     k     the mark's height as a fraction of NETFLIX, which is the ruler

   k is the part worth not "tidying". Somebody balanced that artwork -
   NETFLIX is set heavier than JioHotstar, CHANDON is letterspaced small,
   Belgian Waffle stacks over two lines - and carrying each mark's own
   height through as a fraction is what reproduces those proportions on
   the row. Normalising every k to 1 would flatten a designed wall into a
   list of equal-sized cut-outs.

   Both numbers are measured, not chosen: scripts/extract-client-marks.py
   cuts the marks and prints this table. Re-run it rather than editing a
   number by hand. */
export const BRAND_MARK: Record<string, { slug: string; ar: number; k: number }> = {

  /* screens and streamers */
  "Netflix":            { slug: "netflix", ar: 3.64, k: 1.01 },
  "JioHotstar":         { slug: "jiohotstar", ar: 5.78, k: 0.72 },
  "Universal Pictures": { slug: "universal", ar: 7.45, k: 0.63 },
  "Sony LIV":           { slug: "sonyliv", ar: 5.39, k: 0.67 },

  /* the wordmarks that are just the name */
  "TCS":              { slug: "tcs", ar: 1.56, k: 1.47 },
  "Pantaloons":       { slug: "pantaloons", ar: 8.1, k: 0.64 },
  "Superdry":         { slug: "superdry", ar: 4.32, k: 0.88 },
  "ITC":              { slug: "itc", ar: 2.95, k: 1.06 },
  "Audi":             { slug: "audi", ar: 3.9, k: 0.88 },
  "YES Bank":         { slug: "yesbank", ar: 6.47, k: 0.7 },
  "ASUS":             { slug: "asus", ar: 4.82, k: 0.81 },
  "IndusInd":         { slug: "indusind", ar: 4.99, k: 0.83 },
  "BHIM":             { slug: "bhim", ar: 4.8, k: 0.81 },
  "Lupin":            { slug: "lupin", ar: 4.1, k: 0.72 },
  "Croma":            { slug: "croma", ar: 4.21, k: 1.03 },
  "Zurich Kotak":     { slug: "zurichkotak", ar: 8.76, k: 0.87 },
  "Reliance General": { slug: "reliance", ar: 3.44, k: 1.11 },

  /* the drawn ones - script, slab and deco */
  "Raymond":      { slug: "raymond", ar: 3.0, k: 1.39 },
  "Schweppes":    { slug: "schweppes", ar: 2.19, k: 1.68 },
  "Carlton":      { slug: "carlton", ar: 8.07, k: 0.63 },
  "Broadway":     { slug: "broadway", ar: 3.85, k: 1.09 },
  "Dabur":        { slug: "dabur", ar: 3.1, k: 1.08 },
  "Haldiram's":   { slug: "haldirams", ar: 3.65, k: 1.12 },
  "Chandon":      { slug: "chandon", ar: 7.82, k: 0.51 },
  "Glenmorangie": { slug: "glenmorangie", ar: 7.79, k: 0.7 },
  "boAt":         { slug: "boat", ar: 2.4, k: 1.37 },
  "Havmor":       { slug: "havmor", ar: 3.83, k: 1.07 },
  "Nykaa":        { slug: "nykaa", ar: 3.05, k: 1.47 },
  "Nykaa Pro":    { slug: "nykaapro", ar: 3.87, k: 1.14 },

  /* the tall ones - two lines or a lockup */
  "Sunfeast Yippee!": { slug: "yippee", ar: 1.84, k: 2.12 },
  "Bingo!":           { slug: "bingo", ar: 1.71, k: 1.97 },
  "Belgian Waffle":   { slug: "belgianwaffle", ar: 1.25, k: 2.37 },
};

export const TILES = [
  { idx: "01", name: "BFSI", img: IMG.workBfsi },
  { idx: "02", name: "FMCG", img: IMG.bootPhone },
  { idx: "03", name: "Fashion & Beauty", img: IMG.photoshop },
  { idx: "04", name: "Entertainment", img: IMG.workEntertainment },
  { idx: "05", name: "Lifestyle", img: IMG.workLifestyle },
  { idx: "06", name: "B2B", img: IMG.workB2b },
];

/* Recognition.

   Six shows, run past in two marquees under the section title (see
   Awards() in components/Sections.tsx). `img` and `alt` are carried but
   nothing renders them at the moment - the ticker is names and years
   only; they are kept because the stills are the obvious next thing this
   section grows.

   The six shows are real. The year, the category line and the image on
   each entry are PLACEHOLDERS - swap them for the actual citation and the
   winning campaign's still once those land. */
export type Award = {
  name: string;
  year: string;
  category: string;
  img: string;
  alt: string;
};

export const AWARDS: Award[] = [
  {
    name: "THE DRUM GLOBAL",
    year: "2025",
    category: "Social and influencer",
    img: "/assets/home/production-4.webp",
    alt: "Placeholder still from the winning work",
  },
  {
    name: "CLIO ENTERTAINMENT",
    year: "2025",
    category: "Audience and engagement",
    img: IMG.workEntertainment,
    alt: "Placeholder still from the winning work",
  },
  {
    name: "WEBBY AWARDS",
    year: "2024",
    category: "Branded content",
    img: "/assets/home/creativity-8.webp",
    alt: "Placeholder still from the winning work",
  },
  {
    name: "CAMPAIGN SOUTH ASIA",
    year: "2024",
    category: "Integrated campaign",
    img: IMG.workLifestyle,
    alt: "Placeholder still from the winning work",
  },
  {
    name: "MMA SMARTIES",
    year: "2023",
    category: "Brand experience",
    img: IMG.workBfsi,
    alt: "Placeholder still from the winning work",
  },
  {
    name: "SPIKES ASIA",
    year: "2023",
    category: "Film craft",
    img: "/assets/home/production-7.webp",
    alt: "Placeholder still from the winning work",
  },
];
