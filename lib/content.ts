/* Everything the page says, in one place. */

export const IMG = {
  frame: "/assets/socheers-frame-n-T4ylIx.jpg",
  /* 7680x4320. The hero blows this up past 1.7x the viewport width, so the
     3840 cut went soft on any hi-dpi screen; same framing, twice the pixels,
     which is what keeps the sand wall's crop of it lining up. */
  team: "/assets/team-group-uhd.jpg",
  camera: "/assets/arri-camera-DX29MVBW.jpg",
  brain: "/assets/brain-DH7sqVir.jpg",
  warMask: "/assets/war-mask-7z_N0Huv.jpg",
  photoshop: "/assets/photoshop-face-BOtm4GGN.jpg",
  bootPhone: "/assets/boot-phone-BJcXYlVw.jpg",
  culture: "/assets/SC Website Revamp/01. Home/WWA 4.0.png",
  workBfsi: "/assets/work-bfsi.png",
  workEntertainment: "/assets/work-entertainment.png",
  workLifestyle: "/assets/work-lifestyle.jpg",
  workB2b: "/assets/work-b2b.png",
} as const;

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
   small and keep the files light, nothing here is above ~450KB. */
export const OVERTURE_WALLS = [
  { img: "/assets/about/crowd.jpg", label: "The room" },
  { img: IMG.camera, label: "Production" },
  { img: IMG.warMask, label: "Creativity" },
  { img: IMG.photoshop, label: "Craft" },
  { img: IMG.brain, label: "Strategy" },
  { img: IMG.bootPhone, label: "Content" },
  { img: "/assets/who-culture.jpg", label: "Us" },
  /* extra beats, tacked on the back where the falls are already fastest and
     the images are only ever read as texture, not pictures - see FALL/
     OVERLAP in lib/overture-motion.ts. Past SOUND_WALLS (same file) these
     stop getting their own impact thud: at this speed a sound per wall
     started reading as more walls than were actually on screen. */
  { img: "/assets/SC Website Revamp/01. Home/Wall 1.jpg", label: "Planning" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 2.jpg", label: "Audience" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 8.jpg", label: "Pulse" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 3.jpg", label: "Attitude" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 4.jpg", label: "Reverie" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 6.jpg", label: "Voyage" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 7.jpg", label: "Horizon" },
] as const;

/* the wall that does not fall */
export const OVERTURE_FINAL = IMG.frame;

/* the three cues, one per beat: the rope going over, the filament
   catching, a wall meeting the floor. See sfx() in lib/overture-motion.ts
   for how they're actually played. */
export const OVERTURE_SFX = {
  pull: "/assets/SC Website Revamp/Sound effects/String Pull.mp3",
  on: "/assets/SC Website Revamp/Sound effects/Light On.mp3",
  fall: "/assets/SC Website Revamp/Sound effects/Wall Fall.mp3",
  /* the finale's camera push into the standing hero wall - see finale()
     in lib/overture-motion.ts */
  expand: "/assets/SC Website Revamp/Sound effects/logo expand.mp3",
} as const;

/* the whir each WHAT WE DO card gets on hover, once per frame swap - one of
   the two is picked at random each time so the cycle doesn't repeat the
   exact same hit on every swap. See initWCardCycle() in lib/motion.ts. */
export const WCARD_SFX = [
  "/assets/SC Website Revamp/Sound effects/Frames 1.mp3",
  "/assets/SC Website Revamp/Sound effects/Frames 2.mp3",
] as const;

/* The footer's cues - the overture in reverse, so it borrows the
   overture's own three sounds rather than asking for new ones: the same
   filament catching is what a filament dying sounds like, the same cord
   sound plays whichever way the cord is moving, and a bulb settling on
   its drop is the same weight as a wall meeting the floor. See
   initFooter() in lib/motion.ts. */
export const FOOTER_SFX = {
  drop: OVERTURE_SFX.fall,      // the cord snapping taut on the first swing
  flicker: OVERTURE_SFX.on,     // the strikes, right before it goes dark
  retract: OVERTURE_SFX.pull,   // the cord letting go and drawing back up
} as const;

/* A bare "#..." is an on-page anchor; anything else is a real route.
   components/Chrome.tsx rewrites the hashes when the nav is on a sub-page. */
export const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "/about", label: "About" },
  { href: "#what", label: "Work" },
  { href: "#awards", label: "Series" },
  { href: "/blogs", label: "Insights" },
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
   in lib/motion.ts. */
const HOME_DIR = "/assets/SC Website Revamp/01. Home";

export const BUCKETS = [
  {
    idx: "01",
    name: "Strategy",
    img: `${HOME_DIR}/Strategy 9.jpg`,
    images: [
      `${HOME_DIR}/Strategy 9.jpg`,
      `${HOME_DIR}/Strategy 7.png`,
      `${HOME_DIR}/Strategy 2.png`,
      `${HOME_DIR}/Strategy 3.jpg`,
      `${HOME_DIR}/Strategy 4.jpg`,
      `${HOME_DIR}/Strategy 5.jpg`,
      `${HOME_DIR}/Strategy 6.jpg`,
      `${HOME_DIR}/Strategy 8.jpg`,
      `${HOME_DIR}/Strategy 10.jpg`,
    ],
    items: [
      "Brand Positioning",
      "Digital Strategy",
      "Content Planning",
      "Insights & Journey Mapping",
      "Communications Planning",
      "Media Planning",
    ],
  },
  {
    idx: "02",
    name: "Creativity",
    img: `${HOME_DIR}/creativity 7.jpg`,
    images: [
      `${HOME_DIR}/creativity 7.jpg`,
      `${HOME_DIR}/Creativity 2.jpg`,
      `${HOME_DIR}/Creativity 3.png`,
      `${HOME_DIR}/Creativity 4.jpg`,
      `${HOME_DIR}/creativity 5.jpg`,
      `${HOME_DIR}/creativity 6.jpg`,
      `${HOME_DIR}/creativity 8.jpg`,
      `${HOME_DIR}/creativity 9.jpg`,
      `${HOME_DIR}/creativity 10.jpg`,
    ],
    items: [
      "Integrated Campaigns",
      "Creative & Content Development",
      "Copywriting",
      "Branding & Merchandising",
      "Tactical Execution",
    ],
  },
  {
    idx: "03",
    name: "Production",
    img: IMG.camera,
    images: [
      IMG.camera,
      `${HOME_DIR}/Production 2.jpg`,
      `${HOME_DIR}/Production 3.jpg`,
      `${HOME_DIR}/Production 4.jpg`,
      `${HOME_DIR}/Production 5.png`,
      `${HOME_DIR}/Production 6.jpg`,
      `${HOME_DIR}/Production 7.jpg`,
      `${HOME_DIR}/Production 8.jpg`,
      `${HOME_DIR}/Production 9.jpg`,
      `${HOME_DIR}/Production 10.jpg`,
    ],
    items: [
      "TVC & DVC",
      "Digital Production",
      "Social Content",
      "Photography",
      "Audio & Mixing",
      "Motion + 3D",
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

export const TILES = [
  { idx: "01", name: "BFSI", img: IMG.workBfsi },
  { idx: "02", name: "FMCG", img: IMG.bootPhone },
  { idx: "03", name: "Fashion & Beauty", img: IMG.photoshop },
  { idx: "04", name: "Entertainment", img: IMG.workEntertainment },
  { idx: "05", name: "Lifestyle", img: IMG.workLifestyle },
  { idx: "06", name: "B2B", img: IMG.workB2b },
];

export const AWARDS = [
  "THE DRUM GLOBAL",
  "CLIO ENTERTAINMENT",
  "WEBBY AWARDS",
  "CAMPAIGN SOUTH ASIA",
  "MMA SMARTIES",
  "SPIKES ASIA",
];
