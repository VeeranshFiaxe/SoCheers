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
  { slug: "yes-bank", file: "BFSI/YES BANK/Thumbnail.png" },
  /* The client's own thumbnail, not a frame out of the case film - that
     was a stand-in while the folder held only the film. */
  { slug: "bhim-upi", file: "BFSI/BHIM UPI/Thumbnail.png" },
  /* Two tiles that used to be pending() in lib/work-content.ts. Both
     campaigns have a film, but the tile is a still either way - the wall
     never plays anything - and both clients sent a key frame, so neither
     needs a grab out of the cut. */
  { slug: "indusind", file: "BFSI/IGI/Thumbnail.png" },
  { slug: "zurich-kotak", file: "BFSI/Zurich Kotak Insurance/THUMBNAIL.png" },
  /* FMCG. The first tile the tab has ever had that is not a placeholder. */
  { slug: "belgian-waffle", file: "FMCG/Belgian Waffle/Thumbnail belgian waffle.jpg" },
  /* ITC and Havmor used to be pending() placeholders; both folders came in
     the second drop with a thumbnail of their own. */
  { slug: "itc", file: "FMCG/ITC/Thumbnail.png" },
  /* Havmor's thumbnail is a 1920x750 banner - wider than every frame the
     site draws it in (the 16:9 tile, the 4:3 "More work" card, the case
     banner), so each of them cut the "80" off one side and the family off
     the other. It is padded to 4:3 with its own paper instead of being
     cropped: see padded() below. The strip is the blank paper down its
     left edge, before the "80" starts. */
  {
    slug: "havmor",
    file: "FMCG/Havmor/Thumbnail.jpg",
    pad: { ratio: 4 / 3, paper: { left: 0, top: 0, width: 190, height: 750 } },
  },
  /* Entertainment */
  /* Both of these were stand-ins until the second drop - a frame out of the
     case film, and the series thumbnail off the Series page - and both now
     have the client's own thumbnail. */
  { slug: "dhurandhar-2", file: "Entertainment/Dhurandhar 2/Thumbnail.png" },
  { slug: "mandala-murders", file: "Entertainment/Mandala Murders/Thumbnail.png" },
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
  /* YES BANK's board. Its tile used to be the board itself, so the page
     drew the board from wall/yes-bank.jpg - until the client's thumbnail
     replaced the tile, and the board block quietly started showing the
     thumbnail. The board now has files of its own, at the same 1600 /
     2400 pair as the other dense boards. */
  { slug: "yes-bank/board", file: "BFSI/YES BANK/YES bank Caseboard (1).png" },
  { slug: "yes-bank/board-large", file: "BFSI/YES BANK/YES bank Caseboard (1).png", width: 2400 },
  /* The cases that are only a board. The page draws the board across the
     full width and links it out to be zoomed, so each gets a 2400 cut
     beside its 1600 tile - the page serves whichever the screen needs.
     Wacoal's master is 1672 wide, so its tile already is the board. */
  { slug: "boat-marvel/board", file: "B2B + Others/Boat.jpg", width: 2400 },
  { slug: "croma-ac/board", file: "B2B + Others/Croma.jpg", width: 2400 },
  { slug: "croma-dreams/board", file: "B2B + Others/FLIPKART-MOODBOARD-4.jpg", width: 2400 },
  { slug: "bgmi/board", file: "B2B + Others/_BGMI UPDATE PODCAST_Case Study.jpg", width: 2400 },
  /* Superdry Sport's hoarding, and IndusInd's before and after feed
     grabs as two files - the page draws each in its own phone frame
     now, so they are no longer composited into one picture. */
  { slug: "superdry/hoarding", file: "Fashion-Beauty-Luxury/SuperDry-Superdry Sport/Hoarding.jpg" },
  { slug: "indusind/before", file: "BFSI/IGI/RGI before.png" },
  { slug: "indusind/after", file: "BFSI/IGI/IGI after.png" },
  /* A screen grab off the Belgian Waffle case video, taken with the
     YouTube player's own title bar and buttons on it. `extract` keeps
     the note and the bag and leaves the player's furniture behind. */
  {
    slug: "belgian-waffle/note",
    file: "FMCG/Belgian Waffle/Screenshot 2026-09-09 120724.png",
    extract: { left: 150, top: 240, width: 1650, height: 655 },
  },
  /* The second drop. ITC's board is a dense 16:9 slide, so it gets the
     1600 / 2400 pair the board-only cases have; Havmor's is 1280 wide and
     goes up at its own size. Dhurandhar 2's are the teaser billboard, the
     launch poster, the airport screen and the press pickup. */
  { slug: "itc/board", file: "FMCG/ITC/Caseboard.jpg" },
  { slug: "itc/board-large", file: "FMCG/ITC/Caseboard.jpg", width: 2400 },
  { slug: "havmor/board", file: "FMCG/Havmor/Caseboard.jpg" },
  { slug: "dhurandhar-2/teaser", file: "Entertainment/Dhurandhar 2/Teaser 1.png" },
  { slug: "dhurandhar-2/poster", file: "Entertainment/Dhurandhar 2/add (1).png" },
  { slug: "dhurandhar-2/launch", file: "Entertainment/Dhurandhar 2/Lauch 2.png" },
  {
    slug: "dhurandhar-2/press",
    file: "Entertainment/Dhurandhar 2/Jassi Is Returning Home. The Wait Is Finally Over.The wait is almost over as Dhurandhar The Rev.png",
  },
  { slug: "mandala-murders/entrance", file: "Entertainment/Mandala Murders/MM.png" },
  { slug: "mandala-murders/props", file: "Entertainment/Mandala Murders/MM(1).png" },
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
  /* Superdry Sport's two Sunday Times front pages, side by side. The
     gallery's 4:5 cell would crop the mastheads off both. (IndusInd's
     before and after used to be composited here; the page draws those
     in phone frames now - see CASE_SHOTS.) */
  {
    slug: "superdry/print",
    cols: 2,
    files: [
      "Fashion-Beauty-Luxury/SuperDry-Superdry Sport/Newspaper(1).jpg",
      "Fashion-Beauty-Luxury/SuperDry-Superdry Sport/Newspaper.jpg",
    ],
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
  /* ITC's two Naa Ready creatives and Havmor's four AI memory posts. Square
     posts again, so the 4:5 gallery cell would crop their headlines. */
  {
    slug: "itc/creatives",
    cols: 2,
    files: ["FMCG/ITC/Copy of na reddy-01.jpg", "FMCG/ITC/Copy of na reddy-02.jpg"],
  },
  {
    slug: "havmor/creatives",
    cols: 2,
    files: [
      "FMCG/Havmor/80 years AI creative.webp",
      "FMCG/Havmor/80 years AI creatives.webp",
      "FMCG/Havmor/Havmor 80 years AI story 2.jpg",
      "FMCG/Havmor/Havmor 80 years AI story 5.png",
    ],
  },
  /* Mandala Murders' escape room as it was planned: the 3D room and the
     props board, both 16:9, side by side. */
  {
    slug: "mandala-murders/renders",
    cols: 2,
    files: [
      "Entertainment/Mandala Murders/Mandala Murders x SoCheers _ Escape Room (2).png",
      "Entertainment/Mandala Murders/Mandala Murders x SoCheers _ Escape Room.jpg",
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

/* ------------------------------------------------------------------
   PADDING A PICTURE OUT RATHER THAN CROPPING IT.

   For a thumbnail whose shape no frame on the site matches. Every frame
   crops to fill - object-fit: cover - so a picture wider than its frame
   loses its sides, and on a banner the sides are where the logo and the
   people are. Making the picture taller instead means the frames only
   ever crop what was added.

   What is added is the picture's own ground, not a flat colour: these
   are printed on textured paper, and a flat fill beside real paper
   reads as a band. `paper` names a blank strip of the picture; it is
   tiled over a canvas of the new shape, mirrored tile to tile so the
   joins run into themselves, and the picture goes in the middle with
   its top and bottom edges faded over 40px so there is no line where
   the real paper meets the tiled paper.
   ------------------------------------------------------------------ */
async function padded(input, { ratio, paper, feather = 40 }) {
  const { width: w, height: h } = await sharp(input).metadata();
  const H = Math.round(w / ratio);
  if (H <= h) return input;

  const tile = await sharp(input).extract(paper).png().toBuffer();
  const flips = {
    n: tile,
    x: await sharp(tile).flop().png().toBuffer(),
    y: await sharp(tile).flip().png().toBuffer(),
    xy: await sharp(tile).flip().flop().png().toBuffer(),
  };
  const layers = [];
  for (let r = 0; r * paper.height < H; r++) {
    for (let c = 0; c * paper.width < w; c++) {
      const left = c * paper.width;
      const top = r * paper.height;
      const cw = Math.min(paper.width, w - left);
      const ch = Math.min(paper.height, H - top);
      const piece = flips[(c % 2 ? "x" : "") + (r % 2 ? "y" : "") || "n"];
      layers.push({
        input: cw === paper.width && ch === paper.height
          ? piece
          : await sharp(piece).extract({ left: 0, top: 0, width: cw, height: ch }).png().toBuffer(),
        left,
        top,
      });
    }
  }
  const sheet = await sharp({ create: { width: w, height: H, channels: 3, background: { r: 236, g: 225, b: 213 } } })
    .composite(layers)
    .png()
    .toBuffer();

  const f = (feather / h).toFixed(4);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${f}" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="${1 - f}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
    `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const art = await sharp(input).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();

  return sharp(sheet).composite([{ input: art, left: 0, top: Math.round((H - h) / 2) }]).png().toBuffer();
}

/* node scripts/build-wall.mjs itc havmor - only the slugs that start with
   one of the arguments. With none, everything, as before. */
const ONLY = process.argv.slice(2);
const wanted = (slug) => !ONLY.length || ONLY.some((p) => slug.startsWith(p));

const dims = [];

for (const { slug, file, master, at, pad } of TILES) {
  if (!wanted(slug)) continue;
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

  const out = await sharp(pad ? await padded(input, pad) : input)
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

for (const { slug, file, master, width, extract, at } of CASE_SHOTS) {
  if (!wanted(slug)) continue;
  const rel = master ?? file;
  const from = master ? path.join(MASTERS, master) : path.join(SRC, file);
  if (!existsSync(from)) {
    console.warn(`SKIP ${slug.padEnd(20)} missing: ${rel}`);
    continue;
  }
  await mkdir(path.join(CASES_OUT, path.dirname(slug)), { recursive: true });
  const isFilm = /\.(mp4|mov|m4v)$/i.test(rel);
  const input = isFilm ? await sharp(grab(from, at ?? 0)).png().toBuffer() : from;
  if (isFilm) await rm(path.join(OUT, ".frame.png"), { force: true });
  let pipe = sharp(input);
  if (extract) pipe = pipe.extract(extract);
  const out = await pipe
    .resize({ width: width ?? WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(CASES_OUT, `${slug}.jpg`));

  dims.push(`  ${slug.padEnd(20)} ${String(out.width).padStart(5)} x ${String(out.height).padStart(5)}`);
  console.log(`${slug.padEnd(20)} ${out.width}x${out.height}  ${(out.size / 1024).toFixed(0)}KB  <- ${rel}`);
}

for (const { slug, cols, files, width } of COMPOSITES) {
  if (!wanted(slug)) continue;
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
