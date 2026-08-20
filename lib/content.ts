/* Everything the page says, in one place. */

export const IMG = {
  frame: "/assets/socheers-frame-n-T4ylIx.jpg",
  /* 7680x4320. The hero blows this up past 1.7x the viewport width, so the
     3840 cut went soft on any hi-dpi screen; same framing, twice the pixels,
     which is what keeps the sand wall's crop of it lining up. */
  team: "/assets/team-group-uhd.jpg",
  camera: "/assets/arri-camera-DX29MVBW.jpg",
  brain: "/assets/brain-DH7sqVir.jpg",
  creativity: "/assets/SC Website Revamp/01. Home/creativity 7.jpg",
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
  { img: "/assets/SC Website Revamp/01. Home/Wall 2.jpg", label: "Attention" },
  /* The fourth wall, and the second of the two the sequence is still slow
     enough to actually look at. Wall 6 - the engraved ship - rather than
     the Photoshop screen that used to be here: it is the same beat about
     craft, made by hand rather than on a screen, and it is the one of the
     four newly-turned walls that holds up at this size without going
     quiet. The Photoshop frame is not lost, it swaps down into the slot
     this came out of, so the run is exactly as long as it was. */
  { img: "/assets/SC Website Revamp/01. Home/Wall 6.jpg", label: "Craft" },
  { img: IMG.brain, label: "Strategy" },
  { img: IMG.bootPhone, label: "Content" },
  { img: "/assets/who-culture.jpg", label: "Us" },
  /* extra beats, tacked on the back where the falls are already fastest and
     the images are only ever read as texture, not pictures - see FALL/
     OVERLAP in lib/overture-motion.ts. Past SOUND_WALLS (same file) these
     stop getting their own impact thud: at this speed a sound per wall
     started reading as more walls than were actually on screen. */
  { img: "/assets/SC Website Revamp/01. Home/Wall 1.jpg", label: "Planning" },
  /* Wall 5, into the slot Wall 2 left on its way up the stack. It is the
     last of the eight walls that wasn't already in here - which is why
     the beat Wall 8 (the op-art) used to hold is simply gone rather than
     refilled: there was one spare wall for two slots, and repeating an
     image inside one sequence is worse than one fewer beat in a tail
     that is texture anyway. FALL/OVERLAP in lib/overture-motion.ts index
     by position and clamp, so a shorter list just ends sooner. */
  { img: "/assets/SC Website Revamp/01. Home/Wall 5.jpg", label: "Focus" },
  { img: IMG.creativity, label: "Creativity" },
  { img: "/assets/SC Website Revamp/01. Home/Wall 4.jpg", label: "Reverie" },
  { img: IMG.photoshop, label: "Retouch" },
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
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/ai-work", label: "AI Work" },
  { href: "/series", label: "Series" },
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
    img: "/assets/SC Website Revamp/01. Home/Production 4.jpg",
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
    img: "/assets/SC Website Revamp/01. Home/creativity 8.jpg",
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
    img: "/assets/SC Website Revamp/01. Home/Production 7.jpg",
    alt: "Placeholder still from the winning work",
  },
];
