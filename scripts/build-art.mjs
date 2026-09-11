/* ============================================================
   THE LOOSE STILLS, MADE READY TO SERVE.

   Most of the pictures on this site come out of a derived folder that
   some script already owns - the browse wall (build-wall.mjs), the
   pinned shots (build-pinned.mjs), the AI grid (build-ai-work.mjs).
   These are the ones that never did: a dozen page images referenced
   straight out of lib/content.ts, lib/about-content.ts and
   lib/work-content.ts at whatever the client exported them as.

   Two things were wrong with that, and they are different problems.

   ---- the PNGs ----

   Half of them are PNG because they arrived with an alpha channel, and
   PNG is the format that keeps one. It is also the format that spends
   three megabytes on a 1536x1024 photographic image, because PNG does
   not do photographs - it does flat colour, and none of these are flat.
   WebP keeps the alpha and codes the photograph, so the same picture
   comes back at a twentieth of the weight with nothing to see between
   them. That is the whole trade and there is no other side to it.

   ---- the team photo ----

   Not a format problem. 7680x4320 is a deliberate choice and the note
   over IMG.team in lib/content.ts explains it: the hero grows this past
   1.7x the viewport width, so a 3840 cut went soft on a hi-dpi screen.
   True, and only true of that screen. Every other device decodes 33
   megapixels - about 130MB of bitmap, before anything is drawn with it -
   to paint a photo it will never show more than a few million pixels of.
   On a phone that is the single most expensive thing on the home page.

   So it stays, and it gets company: the same frame at 960, 1920 and 3840, and
   a `sizes`/`srcset` on the two <img> that use it (components/Hero.tsx,
   components/ContactModal.tsx) so the browser picks. The 4K laptop still
   gets its 7680; a phone gets a picture it can decode in one frame.

     node scripts/build-art.mjs

   The masters are left exactly where they are. This only ever reads.
   ============================================================ */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = path.join(ROOT, "public/assets/art");

/* slug -> the file as delivered. The slug is the name the site will use,
   so the client's folder names and their spaces never reach an <img>. */
const ART = {
  /* the home hero's artwork, and the last wall the overture walks into.
     Delivered as a PNG with a .jpg on the end of it. */
  "socheers-frame": "public/assets/socheers-frame-n-T4ylIx.jpg",
  "work-entertainment": "public/assets/work-entertainment.png",
  "work-b2b": "public/assets/work-b2b.png",
  "work-bfsi": "public/assets/work-bfsi.png",
  culture: "assets/SC Website Revamp/01. Home/WWA 4.0.png",
  "ai-visual": "assets/SC Website Revamp/05. AI work/AI work visual.png",
  "blog-reading": "assets/SC Website Revamp/06. Blogs/reading visual.png",
  crowd: "public/assets/about/crowd.png",
  /* the two walls that do not live in the home folder - see
     OVERTURE_WALLS in lib/content.ts */
  "who-culture": "public/assets/who-culture.jpg",
  "crowd-wall": "public/assets/about/crowd.jpg",
  /* three more walls, delivered as JPEGs and referenced straight from IMG
     in lib/content.ts until PageSpeed flagged them */
  brain: "public/assets/brain-DH7sqVir.jpg",
  "photoshop-face": "public/assets/photoshop-face-BOtm4GGN.jpg",
  "boot-phone": "public/assets/boot-phone-BJcXYlVw.jpg",
  /* the four step cards on the Series page (`steps` in
     lib/series-content.ts). Drawn about 400px square and delivered as
     PNGs of up to two megabytes each - re-run this after replacing any
     of them, or the page keeps showing the old one. */
  "series-brand": "public/assets/series/Brand.png",
  "series-strategy": "public/assets/series/Strategy.png",
  "series-films": "public/assets/series/Films.png",
  "series-together": "public/assets/series/Together.png",
};

/* Nothing on this site draws one of these wider than about 1500px, and
   2x that is the largest screen it is designed for. Anything already
   smaller is left at its own size - upscaling only adds weight. */
const MAX_EDGE = 3000;

/* The one that is not a format problem. Widths, largest last. The
   master is the last entry and is referenced rather than re-encoded -
   there is nothing to gain from putting a 7680 JPEG through sharp. */
const TEAM = {
  src: "public/assets/team-group-uhd.jpg",
  out: "public/assets/art",
  widths: [960, 1920, 3840],
};

/* ------------------------------------------------------------------
   THE HOME FOLDER

   Eight megabytes of it are on the first screen of the site, eagerly,
   and most of that is the WHAT WE DO cards: four cards holding nine or
   ten frames each, cycled on hover. As delivered they are print-sized
   exports - two of them over a megabyte - and they are drawn about
   500px wide, at 28% opacity, behind a gradient. There is no version of
   that arithmetic that comes out in favour of the master.

   Two sizes, because the folder has two jobs in it. A wall in the
   overture is a viewport-filling plane and is held long enough to be
   looked at; a card frame is a texture. Everything else in the folder
   is unreferenced and is not touched at all.
   ------------------------------------------------------------------ */
const HOME_SRC = "assets/SC Website Revamp/01. Home";
const HOME_OUT = "public/assets/home";

/* the eight that the overture puts on a wall - see OVERTURE_WALLS in
   lib/content.ts. These get the larger cut. */
const WALLS = new Set([
  "Wall 1.jpg", "Wall 2.jpg", "Wall 4.jpg", "Wall 5.jpg", "Wall 7.jpg",
  "Strategy 8.jpg", "Strategy 10.jpg", "Production 9.jpg",
]);

/* the card reels, in the order lib/content.ts lists them. Anything in
   the folder and not in either set is something the site never asks
   for - a backup, an alternate crop, the hero upscale - and is left
   where it is rather than encoded for nobody. */
const CARDS = [
  "Strategy 9.jpg", "Strategy 7.png", "Strategy 2.png", "Strategy 3.jpg",
  "Strategy 4.jpg", "Strategy 5.jpg", "Strategy 6.jpg",
  "creativity 7.jpg", "Creativity 2.jpg", "Creativity 3.png", "Creativity 4.jpg",
  "creativity 5.jpg", "creativity 6.jpg", "creativity 8.jpg", "creativity 9.jpg",
  "creativity 10.jpg",
  "Production 2.jpg", "Production 3.jpg", "Production 4.jpg", "Production 5.png",
  "Production 6.jpg", "Production 7.jpg", "Production 8.jpg", "Production 10.jpg",
];

/* A wall fills the viewport, so 1800 is the widest screen this is
   designed for with nothing spare. A card is drawn at about 500 and is
   never opened bigger, so 1100 is already 2x on a retina laptop. */
const WALL_EDGE = 1800;
const CARD_EDGE = 1100;

/* the client's filenames, as something an <img src> can carry */
const slug = (f) =>
  f
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + "KB";
let saved = 0;

/* One picture, capped on its long edge, out as WebP. Nothing is ever
   enlarged - a master already smaller than the cap is re-encoded at its
   own size, which is still most of the saving where the master is a PNG.
   `nearLossless` is deliberately not on: it is for line art, and every
   one of these is a photograph or a render of one. */
async function encode(from, to, edge, quality) {
  const before = fs.statSync(from).size;
  const img = sharp(from, { failOn: "none" });
  const meta = await img.metadata();
  const scale = Math.min(1, edge / Math.max(meta.width ?? 1, meta.height ?? 1));
  const info = await img
    .rotate()
    .resize({
      width: Math.round((meta.width ?? 1) * scale),
      height: Math.round((meta.height ?? 1) * scale),
      fit: "inside",
    })
    .webp({ quality, effort: 6 })
    .toFile(to);
  saved += before - info.size;
  return { before, info };
}

fs.mkdirSync(OUT, { recursive: true });

for (const [name, rel] of Object.entries(ART)) {
  const from = path.join(ROOT, rel);
  if (!fs.existsSync(from)) {
    console.warn(`missing: ${rel}`);
    continue;
  }
  /* 82 rather than the card frames' 78 below: these are drawn large - a
     full-bleed hero, a case study board - where a card frame is 500px
     wide at 28% opacity behind a gradient. The two walls are the
     exception: they are in the overture's preload, and at 82 they were
     most of its weight. */
  const quality = name === "who-culture" || name === "crowd-wall" ? 72 : 82;
  const { before, info } = await encode(from, path.join(OUT, `${name}.webp`), MAX_EDGE, quality);
  console.log(
    `· ${name.padEnd(20)} ${info.width}x${info.height}  ` +
      `${kb(before)} -> ${kb(info.size)}  (${(100 - (info.size / before) * 100).toFixed(0)}% off)`,
  );
}

/* ---- the team photo's smaller cuts ---- */
const teamFrom = path.join(ROOT, TEAM.src);
if (fs.existsSync(teamFrom)) {
  for (const w of TEAM.widths) {
    const info = await sharp(teamFrom)
      .resize({ width: w, withoutEnlargement: true })
      /* mozjpeg and not webp, and only here: this one is referenced from
         a srcset next to the 7680 master, which is a JPEG. A set that
         mixes formats is a set where the browser's choice depends on
         which formats it supports as well as on which width it wants,
         and there is nothing to win here for the confusion - the master
         is already down at 0.07 bits per pixel and webp would save
         kilobytes. Progressive, so the hero paints something early. */
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(path.join(ROOT, TEAM.out, `team-${w}.jpg`));
    console.log(`· team-${w}`.padEnd(22) + `  ${info.width}x${info.height}  ${kb(info.size)}`);
  }
} else {
  console.warn(`missing: ${TEAM.src}`);
}

/* ---- the home folder's walls and card reels ---- */
fs.mkdirSync(path.join(ROOT, HOME_OUT), { recursive: true });
for (const [set, edge, quality, label] of [
  [WALLS, WALL_EDGE, 82, "wall"],
  [CARDS, CARD_EDGE, 78, "card"],
]) {
  for (const file of set) {
    const from = path.join(ROOT, HOME_SRC, file);
    if (!fs.existsSync(from)) {
      console.warn(`missing: ${HOME_SRC}/${file}`);
      continue;
    }
    const to = path.join(ROOT, HOME_OUT, `${slug(file)}.webp`);
    const { before, info } = await encode(from, to, edge, quality);
    console.log(
      `· ${label} ${slug(file).padEnd(15)} ${info.width}x${info.height}  ` +
        `${kb(before)} -> ${kb(info.size)}  (${(100 - (info.size / before) * 100).toFixed(0)}% off)`,
    );
  }
}

/* ---- the WHAT WE DO card frames, cut again for the card ----

   The reels mix frames out of the home folder with the service pages' own
   pictures (/assets/services), and the service pages draw those large - so
   the cards get their own copy rather than a smaller file under the same
   name. A frame is a texture at 28% opacity, 386px wide on a laptop and a
   column on a phone, so it is cut to cover about 660x990 and no more. Read
   off the web cuts, not masters: the service pictures have none here.
   components/Sections.tsx (cardCut) maps a reel's path onto this folder. */
const CARDS_OUT = path.join(ROOT, "public/assets/cards");
fs.mkdirSync(CARDS_OUT, { recursive: true });
const content = fs.readFileSync(path.join(ROOT, "lib/content.ts"), "utf8");
const buckets = content.slice(content.indexOf("export const BUCKETS"));
const frames = new Set(
  buckets.slice(0, buckets.indexOf("\nexport ")).match(/\/assets\/(?:home|services)\/[^"]+\.webp/g) ?? [],
);
for (const frame of frames) {
  const info = await sharp(path.join(ROOT, "public", frame))
    .resize({ width: 660, height: 990, fit: "outside", withoutEnlargement: true })
    .webp({ quality: 68, effort: 6 })
    .toFile(path.join(CARDS_OUT, path.basename(frame)));
  console.log(`· card ${path.basename(frame).padEnd(28)} ${info.width}x${info.height}  ${kb(info.size)}`);
}

console.log(`\n${(saved / 1048576).toFixed(1)}MB off the wire.`);

