/* ============================================================
   THE YOUTUBE CASE FILMS' TILES, SERVED FROM OUR OWN STORAGE.

   The case study films carried over from the old site's "latest work"
   gallery stay on YouTube - each plays in the embed on its own case
   page - but the still on the tile and the case hero does not come off
   i.ytimg.com. It is pulled once, here, and
   written into public/assets/work/wall/ beside every other tile, so the
   wall loads from R2 like the rest of the page and never asks YouTube
   for anything until somebody presses play.

   YouTube's best still is maxresdefault (1280x720). Older uploads do
   not have one, and sddefault is 640x480 with the 16:9 picture
   letterboxed inside it, so that one is cropped back to 16:9.

     node scripts/build-yt-thumbs.mjs
     node scripts/build-variants.mjs

   The list is FILMS in lib/work-content.ts - read here as text so the
   two cannot drift.
   ============================================================ */
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const OUT = "public/assets/work/wall";
const src = await readFile("lib/work-content.ts", "utf8");
const films = [...src.matchAll(/film\("([\w-]+)",\s*"([\w-]{11})"/g)].map((m) => ({ slug: m[1], id: m[2] }));

const get = async (url) => {
  const r = await fetch(url);
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
};

for (const { slug, id } of films) {
  let buf = await get(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
  let img;
  if (buf) img = sharp(buf);
  else {
    /* 640x480 with the picture at 640x360 in the middle */
    buf = await get(`https://i.ytimg.com/vi/${id}/sddefault.jpg`);
    if (!buf) { console.warn(`${slug}: no still`); continue; }
    /* and some films carry black bars of their own inside that, so the
       black is trimmed off and the rest cropped back to 16:9 */
    const cut = await sharp(buf).extract({ left: 0, top: 60, width: 640, height: 360 }).toBuffer();
    const inner = await sharp(cut).trim({ background: "#000", threshold: 24 }).toBuffer();
    img = sharp(inner).resize(640, 360, { fit: "cover" });
  }
  const out = await img.jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/${slug}.jpg`);
  console.log(`${slug}  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB`);
}
