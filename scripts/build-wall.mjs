/* ============================================================
   THE BROWSE WALL'S TILES, MADE READY TO SERVE.

   The client's own work folders under

     assets/SC Website Revamp/03. Work/

   are the masters: case boards exported at print size, and case study
   films delivered as 200-500MB broadcast cuts. Neither is a thing to
   put in a tile that is drawn about 750px wide.

   This reads that folder and writes one web JPG per campaign into
   public/assets/work/wall/, named as its own slug. Stills are resized
   and re-encoded; films are not transcoded at all - the wall never
   plays anything, it draws a still with a play badge on it, so all a
   film needs here is one frame pulled out of it with ffmpeg.

     node scripts/build-wall.mjs

   Run it again whenever the client drops new work in. The masters are
   left exactly where they put them; this is a derived folder.

   ---- where the films are ----

   Not in public/. The four case study cuts the client sent are 200-270MB
   broadcast masters each, and a file under public/ is a file a deploy
   ships whether or not anything asks for it. They now sit beside the
   other masters as assets/<slug>.src.mp4, gitignored, where the build
   can read them and no deploy can serve them - the same arrangement
   scripts/build-film.mjs already uses for the pinned film.

   ---- what this does not do ----

   Transcode. The wall draws stills, so a frame is all it needs. A film
   that has to actually play on a case page wants the treatment in
   scripts/build-film.mjs run over its master first.
   ============================================================ */
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const SRC = "assets/SC Website Revamp/03. Work";
/* The films, and the one still that had to be decoded by hand. Paths
   here are repo-root relative rather than under SRC, because these do
   not live in the client's folder any more - see the note above. */
const MASTERS = "assets";
const OUT = "public/assets/work/wall";

/* 1600 wide is the tile at 2x on the widest layout this site draws.
   Nothing on the wall asks for more, and withoutEnlargement means a
   small original is left at its own size rather than blown up. */
const WIDTH = 1600;

/* slug -> the file the client sent, relative to SRC.
   `at` is the second to pull a poster from, for the films only. The
   first frame of a case study is almost always a black slate or a
   logo sting, so none of these are 0. */
const TILES = [
  /* BFSI */
  { slug: "yes-bank", file: "BFSI/YES bank Caseboard.png" },
  { slug: "bhim-upi", master: "bhim-upi.src.mp4", at: 8 },
  /* Two tiles that used to be pending() in lib/work-content.ts. Both
     campaigns have a film, but the tile is a still either way - the wall
     never plays anything - and both clients sent a key frame, so neither
     needs a grab out of the cut. */
  { slug: "indusind", file: "BFSI/IGI/Thumbnail.png" },
  { slug: "zurich-kotak", file: "BFSI/Zurich Kotak Insurance/THUMBNAIL.png" },
  /* FMCG. The first tile the tab has ever had that is not a placeholder. */
  { slug: "belgian-waffle", file: "FMCG/Belgian Waffle/Thumbnail belgian waffle.jpg" },
  /* Entertainment */
  { slug: "dhurandhar-2", master: "dhurandhar-2.src.mp4", at: 24 },
  { slug: "maa-behen", file: "Entertainment/Maa Behen/Maa Behen cover.jpeg" },
  /* The Netflix x MI x SRH case study has its own key art - "Chill like
     a champion" - and it is deliberately not either of the two pinned
     thumbnails. Three different pictures for three different pieces:
     Netflix x MI and Netflix x SRH are the pinned ones, this is the
     case that covers both. */
  { slug: "netflix-mi-srh", file: "Entertainment/Netflix x MI x SRH/Thumbnail for Case work.jpg" },
  { slug: "made-in-titan", master: "made-in-titan.src.mp4", at: 45 },
  { slug: "special-ops-2", master: "special-ops-2.src.mp4", at: 70 },
  /* Fashion & Beauty */
  { slug: "superdry", file: "Fashion-Beauty-Luxury/SuperDry-Superdry Sport/Thumbnail.png" },
  { slug: "wacoal", file: "Fashion-Beauty-Luxury/Wacoal.png" },
  /* Others */
  { slug: "boat", file: "B2B + Others/Boat.jpg" },
  { slug: "croma", file: "B2B + Others/Croma.jpg" },
  /* The filename says Flipkart; the board is Croma's, and the only
     Flipkart in it is the competitor the campaign is answering. Named
     for whose work it is. */
  { slug: "croma-dreams", file: "B2B + Others/FLIPKART-MOODBOARD-4.jpg" },
  { slug: "bgmi", file: "B2B + Others/_BGMI UPDATE PODCAST_Case Study.jpg" },
];

/* ------------------------------------------------------------------
   The case pages' own pictures.

   Separate from TILES because they are a different job: a tile is one
   frame standing for a campaign, these are the campaign's own assets
   laid out down a page, and some of them want to be bigger than a tile
   ever does - a dense case board is read, not glanced at.

   `width` overrides the tile width where that matters.
   ------------------------------------------------------------------ */
const CASES_OUT = "public/assets/work/cases";

const CASE_SHOTS = [
  /* The board is the whole case study in one picture and it is set in
     9pt type, so it goes up at twice the tile width or it cannot be
     read at all. */
  { slug: "maa-behen/board", file: "Entertainment/Maa Behen/MAA-BEHEN---Case-Study-(NEW).jpg.jpeg", width: 2400 },
  { slug: "maa-behen/train", file: "Entertainment/Maa Behen/IMG_8013.JPG" },
  /* Shot on a phone in HEIC, and libheif refuses this particular file -
     it carries 45 references in its iref box against a security limit
     of 16, which is what a Live Photo looks like to a decoder that was
     not expecting one. Decoded once through Windows' own imaging stack
     and kept as assets/maa-behen-transit.src.jpg, so this script stays
     portable and nobody has to repeat that by hand. */
  { slug: "maa-behen/transit", master: "maa-behen-transit.src.jpg" },
  /* Zurich Kotak. The board is a 16:9 deck slide rather than an
     artboard, so it does not need the 2400 the Maa Behen one does - it
     is already legible at the width a bleed block draws it. The four
     that follow are the deck itself: two studio renders and two
     photographs of the printed cards. */
  { slug: "zurich-kotak/board", file: "BFSI/Zurich Kotak Insurance/Caseboard.png" },
  { slug: "zurich-kotak/deck-box", file: "BFSI/Zurich Kotak Insurance/6 (1).jpg" },
  { slug: "zurich-kotak/deck-cards", file: "BFSI/Zurich Kotak Insurance/3 (1).jpg" },
  { slug: "zurich-kotak/deck-held", file: "BFSI/Zurich Kotak Insurance/2.jpg" },
  { slug: "zurich-kotak/deck-fan", file: "BFSI/Zurich Kotak Insurance/13.jpg" },
  /* Belgian Waffle's board, same shape and same reasoning. */
  { slug: "belgian-waffle/board", file: "FMCG/Belgian Waffle/Case Study.png" },
];

/* ------------------------------------------------------------------
   THE THREE PICTURES THAT HAD TO BE MADE RATHER THAN RESIZED.

   Some of what the client sent is a set and not a picture: four square
   social posts, two phone-shaped feed grids, two influencer screen
   grabs. The case template's `duo` and `gallery` blocks would take them,
   but both draw their cells at a fixed 4:5 - which centre-crops a 1:1
   post through its logo, and takes a 399x864 feed grid down to a third
   of itself. That is a real constraint of the layout and the right one
   for photography; these are not photographs.

   So they are composited here instead, into one picture each, and go on
   the page as a single `image` block that keeps its own proportions.
   The ground is --bg (#0b0b0c), so the gaps between cells read as the
   page showing through rather than as a border round a contact sheet.

   `cols` is the grid width; cells are laid out in order, each scaled to
   the same cell width, and rows are as tall as their tallest cell.
   ------------------------------------------------------------------ */
const GROUND = { r: 11, g: 11, b: 12 };
const GAP = 28;

const COMPOSITES = [
  /* IndusInd's rebrand, which is a before and an after and is not
     legible as either one alone. Left is the Reliance General feed, right
     is the same account after the change - the client's own pair. */
  {
    slug: "indusind/feed",
    cols: 2,
    files: ["BFSI/IGI/RGI before.png", "BFSI/IGI/IGI after.png"],
  },
  /* The four YES BANK social posts, as the 2x2 the case board itself
     lays them out in. Square, so a 4:5 cell would cut the logo off. */
  {
    slug: "yes-bank/creatives",
    cols: 2,
    files: [
      "BFSI/YES BANK/1 (4).jpg",
      "BFSI/YES BANK/4 (2).jpg",
      "BFSI/YES BANK/new-creatives.jpg",
      "BFSI/YES BANK/Final-.jpg",
    ],
  },
  /* The two influencer pickups. These are phone screen grabs at 256px
     wide and they are not going to get sharper - but they are the
     campaign's own proof of the influencer leg, and the page says the
     influencers picked it up. Drawn small, at close to their own size. */
  {
    slug: "belgian-waffle/influencers",
    cols: 2,
    files: [
      "FMCG/Belgian Waffle/Screenshot 2026-09-09 120611.png",
      "FMCG/Belgian Waffle/Screenshot 2026-09-09 120630.png",
    ],
  },
];

await mkdir(OUT, { recursive: true });

/* One frame out of a film, written beside the script and handed to the
   same sharp pipeline the stills go through - so a film's tile and a
   board's tile are encoded identically and nothing on the wall looks
   like it came from somewhere else. */
function grab(from, at) {
  const tmp = path.join(OUT, ".frame.png");
  const run = spawnSync(ffmpeg, [
    "-hide_banner", "-y", "-ss", String(at), "-i", from,
    "-frames:v", "1", tmp,
  ], { stdio: ["ignore", "ignore", "inherit"] });
  if (run.status !== 0) throw new Error(`ffmpeg failed on ${from}`);
  return tmp;
}

const dims = [];

for (const { slug, file, master, at } of TILES) {
  const rel = master ?? file;
  const from = master ? path.join(MASTERS, master) : path.join(SRC, file);
  if (!existsSync(from)) {
    /* A missing master is the normal state of a fresh clone - they are
       gitignored. Say so and carry on; the tile that is already in
       public/assets/work/wall/ is committed and still serves. */
    console.warn(`SKIP ${slug.padEnd(14)} missing: ${rel}`);
    continue;
  }
  const isFilm = /\.(mp4|mov|m4v)$/i.test(rel);
  const input = isFilm ? grab(from, at ?? 0) : from;

  const out = await sharp(input)
    .resize({ width: WIDTH, withoutEnlargement: true })
    /* Same encode as the pinned stills (scripts/build-pinned.mjs) -
       mozjpeg 82, progressive - so the two sections of the page are
       not two different qualities of picture. */
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT, `${slug}.jpg`));

  if (isFilm) await rm(input, { force: true });

  dims.push(`  ${slug.padEnd(14)} ${String(out.width).padStart(5)} x ${String(out.height).padStart(5)}`);
  console.log(`${slug.padEnd(14)} ${out.width}x${out.height}  ${(out.size / 1024).toFixed(0)}KB  <- ${rel}`);
}

for (const { slug, file, master, width } of CASE_SHOTS) {
  const rel = master ?? file;
  const from = master ? path.join(MASTERS, master) : path.join(SRC, file);
  if (!existsSync(from)) {
    console.warn(`SKIP ${slug.padEnd(20)} missing: ${rel}`);
    continue;
  }
  await mkdir(path.join(CASES_OUT, path.dirname(slug)), { recursive: true });
  const out = await sharp(from)
    .resize({ width: width ?? WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(CASES_OUT, `${slug}.jpg`));

  dims.push(`  ${slug.padEnd(20)} ${String(out.width).padStart(5)} x ${String(out.height).padStart(5)}`);
  console.log(`${slug.padEnd(20)} ${out.width}x${out.height}  ${(out.size / 1024).toFixed(0)}KB  <- ${rel}`);
}

for (const { slug, cols, files, width } of COMPOSITES) {
  const froms = files.map((f) => path.join(SRC, f));
  const missing = froms.filter((f) => !existsSync(f));
  if (missing.length) {
    console.warn(`SKIP ${slug.padEnd(20)} missing: ${missing.length} of ${froms.length}`);
    continue;
  }

  /* Every cell is drawn at the width of the widest source, so the
     composite is never an upscale of anything - the smaller ones are
     the ones that get resized, and only downwards. */
  const metas = await Promise.all(froms.map((f) => sharp(f).metadata()));
  const cell = Math.max(...metas.map((m) => m.width));

  const cells = await Promise.all(
    froms.map((f) =>
      sharp(f).resize({ width: cell }).toBuffer({ resolveWithObject: true }),
    ),
  );

  /* A row is as tall as its tallest cell; a shorter cell is centred. */
  const rows = Math.ceil(cells.length / cols);
  const rowH = Array.from({ length: rows }, (_, r) =>
    Math.max(...cells.slice(r * cols, r * cols + cols).map((c) => c.info.height)),
  );
  const usedCols = Math.min(cols, cells.length);
  const W = usedCols * cell + (usedCols - 1) * GAP;
  const H = rowH.reduce((a, b) => a + b, 0) + (rows - 1) * GAP;

  let y = 0;
  const layers = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const it = cells[r * cols + c];
      if (!it) break;
      layers.push({
        input: it.data,
        left: c * (cell + GAP),
        top: y + Math.round((rowH[r] - it.info.height) / 2),
      });
    }
    y += rowH[r] + GAP;
  }

  await mkdir(path.join(CASES_OUT, path.dirname(slug)), { recursive: true });
  /* Two passes on purpose. sharp applies resize before composite within
     one pipeline, which would scale the empty ground and leave every
     layer pinned to coordinates that no longer exist. So: composite at
     full size to a buffer, then resize and encode that. */
  const sheet = await sharp({
    create: { width: W, height: H, channels: 3, background: GROUND },
  })
    .composite(layers)
    .png()
    .toBuffer();

  const out = await sharp(sheet)
    .resize({ width: width ?? WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(CASES_OUT, `${slug}.jpg`));

  dims.push(`  ${slug.padEnd(20)} ${String(out.width).padStart(5)} x ${String(out.height).padStart(5)}`);
  console.log(`${slug.padEnd(20)} ${out.width}x${out.height}  ${(out.size / 1024).toFixed(0)}KB  <- ${files.length} files`);
}


console.log("\nfor lib/work-content.ts:\n" + dims.join("\n"));
