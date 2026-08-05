/* Everything the page says, in one place. */

export const IMG = {
  frame: "/assets/socheers-frame-n-T4ylIx.jpg",
  team: "/assets/team-group-D203M1bi.jpg",
  camera: "/assets/arri-camera-DX29MVBW.jpg",
  brain: "/assets/brain-DH7sqVir.jpg",
  warMask: "/assets/war-mask-7z_N0Huv.jpg",
  photoshop: "/assets/photoshop-face-BOtm4GGN.jpg",
  bootPhone: "/assets/boot-phone-BJcXYlVw.jpg",
} as const;

export const RAIL = [
  "Index",
  "Who",
  "What",
  "Brands",
  "Work",
  "Awards",
  "Contact",
];

export const NAV_LINKS = [
  { href: "#who", label: "Who" },
  { href: "#what", label: "What" },
  { href: "#work", label: "Work" },
  { href: "#awards", label: "Awards" },
];

/* hero — the images that stack once the window is full screen */
export const DECK = [
  { src: IMG.camera, idx: "02", label: "Production · films that land" },
  { src: IMG.brain, idx: "03", label: "Strategy · the thinking bit" },
  { src: IMG.warMask, idx: "04", label: "Creative · occasionally unhinged" },
  { src: IMG.photoshop, idx: "05", label: "Craft · down to the pixel" },
];

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
    items: ["Brand Strategy", "Comms Planning", "Research & Insights", "Media Strategy"],
  },
  {
    idx: "02",
    name: "Creativity",
    img: IMG.warMask,
    items: [
      "Creative & Art Direction",
      "Social & Content",
      "Design & Identity",
      "Influencer & Community",
    ],
  },
  {
    idx: "03",
    name: "Production",
    img: IMG.camera,
    items: ["Films & Production", "Photography", "CGI & AI", "Post & Edit"],
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
  { idx: "01", name: "BFSI", img: IMG.warMask },
  { idx: "02", name: "FMCG", img: IMG.bootPhone },
  { idx: "03", name: "Fashion & Beauty", img: IMG.photoshop },
  { idx: "04", name: "Entertainment", img: IMG.brain },
  { idx: "05", name: "Lifestyle", img: IMG.camera },
  { idx: "06", name: "B2B", img: IMG.frame },
];

export const AWARDS = [
  "THE DRUM GLOBAL",
  "CLIO ENTERTAINMENT",
  "WEBBY AWARDS",
  "CAMPAIGN SOUTH ASIA",
  "MMA SMARTIES",
  "SPIKES ASIA",
];
