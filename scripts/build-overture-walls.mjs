/* ============================================================
   THE OVERTURE'S WALLS, CUT FROM THE 12TH ANNIVERSARY DUMP.

   The masters are the carousel stills from SoCheers' own Instagram post
   (instagram.com/p/DIdZHPGNh6l), saved at the 1080x1080 Instagram
   serves, in assets/anniversary-12/. Each one is cut twice:

     NN.webp     the desktop wall - a 1.6 band across the full width.
                 A wall is viewport-sized and cover-fitted, so 16:10
                 shows all of it and 16:9 loses a sliver top and bottom;
                 every band is placed so that sliver is never a face.
     NN-m.webp   the phone's stand-in - a 0.5 column at full height,
                 which a ~0.46 phone trims a hair off each side of.
                 Placed so the column edge falls between people.

   `top` and `left` are fractions of the square. Both cuts are upscaled
   with lanczos3 and a light sharpen: 1080 is all Instagram keeps, and a
   browser stretching it by itself is softer than this.

     node scripts/build-overture-walls.mjs
   ============================================================ */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "assets/anniversary-12";
const OUT = "public/assets/home/room";

const WALLS = [
  { n: "01", top: 0.375, left: 0.27 },
  { n: "03", top: 0.1, left: 0.17 },
  { n: "05", top: 0.2, left: 0.23 },
  { n: "04", top: 0, left: 0.02 },
  { n: "08", top: 0.22, left: 0.25 },
  { n: "12", top: 0.05, left: 0.44 },
  { n: "14", top: 0.02, left: 0.22 },
  { n: "17", top: 0.1, left: 0.22 },
  { n: "15", top: 0, left: 0.26 },
  { n: "19", top: 0.05, left: 0.45 },
];

const D = { w: 1920, h: 1200, frac: [1, 0.625] };
const M = { w: 960, h: 1920, frac: [0.5, 1] };

async function cut(file, out, box, spec) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const w = Math.round(width * spec.frac[0]);
  const h = Math.round(height * spec.frac[1]);
  const left = Math.min(width - w, Math.round(width * box.left));
  const top = Math.min(height - h, Math.round(height * box.top));
  await img
    .extract({ left, top, width: w, height: h })
    .resize(spec.w, spec.h, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 })
    .webp({ quality: 80, effort: 6 })
    .toFile(out);
}

await mkdir(OUT, { recursive: true });
for (const wall of WALLS) {
  const file = `${SRC}/${wall.n}.jpg`;
  await cut(file, `${OUT}/${wall.n}.webp`, { left: 0, top: wall.top }, D);
  await cut(file, `${OUT}/${wall.n}-m.webp`, { left: wall.left, top: 0 }, M);
  console.log(wall.n);
}
