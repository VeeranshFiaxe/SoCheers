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
  footerLeft: "/assets/SC Website Revamp/01. Home/footer left.png",
  footerRight: "/assets/SC Website Revamp/01. Home/footer right.png",
} as const;

export const RAIL = [
  "Index",
  "Who",
  "What",
  "Brands",
  "Awards",
  "Contact",
];

/* A bare "#..." is an on-page anchor; anything else is a real route.
   components/Chrome.tsx rewrites the hashes when the nav is on a sub-page. */
export const NAV_LINKS = [
  { href: "#who", label: "Who" },
  { href: "#what", label: "What" },
  { href: "#awards", label: "Awards" },
  { href: "/about", label: "About" },
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

export const BUCKETS = [
  {
    idx: "01",
    name: "Strategy",
    img: IMG.brain,
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
    img: IMG.warMask,
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
