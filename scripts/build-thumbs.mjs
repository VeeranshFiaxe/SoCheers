/* ============================================================
   PHONE-SIZE COPIES OF THE PICTURES SHOWN SMALL IN GRIDS.

   The AI Work wall and the Series page draw dozens of pictures at a
   couple of hundred pixels wide on a phone - from files 1080 to 2048
   wide. The download is tolerable; the memory is not. A browser keeps
   every picture it has shown decoded at full size, four bytes a pixel,
   and scrolled to the end AI Work was holding ~360MB of them. iPhone
   Safari kills a tab that holds that much, which reads as the page
   reloading itself or "A problem repeatedly occurred".

   So beside each one this writes <name>-600.webp, 600 wide - sharp for
   a tile up to half a phone screen at 3x - and records both widths in
   lib/thumbs.json. lib/images.ts (thumb()) turns that into a srcset;
   the page names the original and the browser picks the small one when
   the tile is small. Desktops keep drawing the original.

     node scripts/build-thumbs.mjs

   Run it when a picture in these folders is added or changed, then
   `npm run media` to upload the new files.
   ============================================================ */
import sharp from "sharp";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const THUMB = 600;
const WEBP = { quality: 78, effort: 5 };

/* [folder, which files] - top level only, never the -600 copies */
const SOURCES = [
  ["public/assets/ai", (f) => !/-poster\.webp$/.test(f)],
  ["public/assets/series", () => true],
  ["public/assets/art", (f) => f.startsWith("series-")],
];

const map = {};
let before = 0, after = 0;

for (const [dir, keep] of SOURCES) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = e.name;
    if (!e.isFile() || !/\.(jpe?g|png|webp)$/i.test(f) || /-600\.webp$/.test(f) || !keep(f)) continue;
    const file = path.join(dir, f);
    const { width, height } = await sharp(file).metadata();
    if (!width || width <= THUMB + 100) continue;
    const out = file.replace(/\.(jpe?g|png|webp)$/i, `-${THUMB}.webp`);
    await sharp(file).resize({ width: THUMB }).webp(WEBP).toFile(out);
    const url = "/" + path.relative("public", file).split(path.sep).join("/");
    map[url] = width;
    before += width * height * 4;
    after += THUMB * Math.round((height * THUMB) / width) * 4;
  }
}

await writeFile("lib/thumbs.json", JSON.stringify(map, null, 2) + "\n");
console.log(`${Object.keys(map).length} thumbs; decoded ${Math.round(before / 1048576)}MB -> ${Math.round(after / 1048576)}MB`);
