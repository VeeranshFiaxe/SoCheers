/* ============================================================
   THE WORK TAB'S PICTURES, IN THE SIZE A SCREEN ACTUALLY ASKS FOR.

   Every picture under public/assets/work/ is a JPG, 1600 wide or close
   to it - the width a tile or a board wants at 2x on a desktop. A phone
   draws the same tile about 400px wide and was downloading all of it.

   So beside every JPG this writes two WebPs:

     <name>.webp       the same width, WebP        ~30% smaller than the JPG
     <name>-800.webp   800 wide, WebP              what a phone needs

   and records each JPG's width in lib/work-images.json. The components
   keep naming the JPG - it is what lib/work-content.ts and the other
   scripts call it - and lib/images.ts turns that into src and srcset,
   so the browser picks the smallest file that is sharp on its screen.
   A picture that is not in the list comes back as the JPG, unchanged.

   The JPGs stay. They are the social preview images (WebP previews are
   unreliable on WhatsApp and LinkedIn), the full-size zoom target for
   the case boards, and what build-wall.mjs writes.

     node scripts/build-variants.mjs

   Run it after build-wall.mjs, whenever a picture is added or changed.
   It rewrites every variant each time - there are about a hundred and
   it takes a few seconds.
   ============================================================ */
import sharp from "sharp";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOTS = ["public/assets/work/wall", "public/assets/work/cases", "public/assets/work/pinned"];
const SMALL = 800;
/* WebP at 80 lands close to mozjpeg 82 by eye on this work - flat
   colour, type, photographs - and effort 5 is the last step that still
   buys size for its time. */
const WEBP = { quality: 80, effort: 5 };

async function* jpgs(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* jpgs(p);
    else if (/\.jpe?g$/i.test(e.name)) yield p;
  }
}

const widths = {};
let jpgBytes = 0, webpBytes = 0, smallBytes = 0;

for (const root of ROOTS) {
  for await (const file of jpgs(root)) {
    const { width, size } = await sharp(file).metadata().then(async (m) => ({
      width: m.width,
      size: (await import("node:fs")).statSync(file).size,
    }));
    const base = file.replace(/\.jpe?g$/i, "");

    const full = await sharp(file).webp(WEBP).toFile(`${base}.webp`);
    jpgBytes += size;
    webpBytes += full.size;

    if (width > SMALL) {
      const small = await sharp(file).resize({ width: SMALL }).webp(WEBP).toFile(`${base}-${SMALL}.webp`);
      smallBytes += small.size;
    }

    widths["/" + path.relative("public", file).split(path.sep).join("/")] = width;
  }
}

const sorted = Object.fromEntries(Object.entries(widths).sort(([a], [b]) => a.localeCompare(b)));
await writeFile("lib/work-images.json", JSON.stringify(sorted, null, 2) + "\n");

const kb = (n) => `${Math.round(n / 1024)}KB`;
console.log(`${Object.keys(sorted).length} pictures`);
console.log(`JPG ${kb(jpgBytes)} -> WebP ${kb(webpBytes)}, and ${kb(smallBytes)} for the ${SMALL}-wide set`);
