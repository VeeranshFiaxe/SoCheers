/* ============================================================
   EVERY PICTURE'S SIZE, FOR THE <img> TAGS THAT DO NOT SAY IT.

   An <img> without width and height gives the browser no shape to hold
   while the file loads, and audits (Lighthouse, Screaming Frog) flag
   every one. On this site the CSS sizes every picture (img{} in
   app/globals.css sets width and height), so the attributes change
   nothing on screen - they are only the aspect ratio, said up front.

   Rather than thread a size through forty components, this records the
   size of every picture under public/assets and public/media in
   worker/image-sizes.json, and the Worker (sized() in worker/index.js)
   writes width and height onto any <img> in a page that has neither.

     node scripts/build-image-sizes.mjs

   Runs as part of `npm run media`, so a new picture has its size by the
   time it is uploaded.
   ============================================================ */
import sharp from "sharp";
import { readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOTS = ["public/assets", "public/media"];
const IMAGE = /\.(webp|jpe?g|png|gif|avif|svg)$/i;
const OUT = "worker/image-sizes.json";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const files = ROOTS.filter(existsSync).flatMap(walk).filter((f) => IMAGE.test(f)).sort();
const sizes = {};
for (const file of files) {
  try {
    const { width, height } = await sharp(file).metadata();
    if (width && height) sizes["/" + path.relative("public", file).split(path.sep).join("/")] = [width, height];
  } catch (e) {
    console.warn(`skipped ${file}: ${e.message}`);
  }
}
writeFileSync(OUT, JSON.stringify(sizes) + "\n");
console.log(`${Object.keys(sizes).length} sizes -> ${OUT}`);
