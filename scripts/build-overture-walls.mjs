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

   Walls two to four are not from the carousel: they are among the first
   anyone sees, held still long enough to be looked at, and a 1080 square
   blown up to a screen shows it. They are the camera originals of three
   of the About page's space shots (assets/SC Website Revamp/02. About/
   Office Images - Culture), cut the same two ways; `top`/`left` are
   fractions of the photograph, as above (`dleft` places a desktop band
   that is narrower than the photograph).

   assets/overture/ holds the masters added after that. crowd.png is the
   offsite crowd again, enhanced and widened to 16:9, for the desktop
   wall. tent.jpg is the
   office's circus-tent ceiling, decoded from tent.heic (the phone's
   original - sharp's prebuilt HEIF cannot read it, so it went through
   Windows' own codec at quality 97).

     node scripts/build-overture-walls.mjs
   ============================================================ */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "assets/anniversary-12";
const HQ = "assets/SC Website Revamp/02. About/Office Images - Culture";
const MORE = "assets/overture";
const OUT = "public/assets/home/room";

const WALLS = [
  /* the first wall on a wide screen is crowd.png, below; the phone
     keeps this one's column, because the enhanced frame is landscape and
     a column out of it would be thinner than this */
  { n: "01", top: 0.375, left: 0.27, only: "m" },
  { n: "crowd", src: `${MORE}/crowd.png`, top: 0, dleft: 0.05, only: "d" },
  { n: "run", src: `${HQ}/The morning run.jpeg`, top: 0.1, left: 0.3125 },
  { n: "cake", src: `${HQ}/A birthday, in the kitchen.jpg`, top: 0, left: 0.39, dleft: 0.05 },
  { n: "khaugalli", src: `${HQ}/Khaugalli day.JPG`, top: 0.17, left: 0.3 },
  { n: "tent", src: `${MORE}/tent.jpg`, top: 0.3, left: 0.17 },
  { n: "08", top: 0.22, left: 0.25 },
  { n: "17", top: 0.1, left: 0.22 },
  { n: "15", top: 0, left: 0.26 },
];

const D = { w: 1920, h: 1200 };
const M = { w: 960, h: 1920 };

/* The largest box of the output's shape the image holds, placed by `box`
   (fractions of the image, clamped to fit). On the 1080 squares
   that is the 1.6 band and the 0.5 column above, exactly as before. */
async function cut(file, out, box, spec) {
  const meta = await sharp(file).metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  const width = turned ? meta.height : meta.width;
  const height = turned ? meta.width : meta.height;
  const ar = spec.w / spec.h;
  const w = Math.min(width, Math.round(height * ar));
  const h = Math.min(height, Math.round(width / ar));
  const left = Math.min(width - w, Math.round(width * box.left));
  const top = Math.min(height - h, Math.round(height * box.top));
  await sharp(file)
    .rotate()
    .extract({ left, top, width: w, height: h })
    .resize(spec.w, spec.h, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 })
    .webp({ quality: 80, effort: 6 })
    .toFile(out);
}

await mkdir(OUT, { recursive: true });
for (const wall of WALLS) {
  const file = wall.src ?? `${SRC}/${wall.n}.jpg`;
  if (wall.only !== "m") await cut(file, `${OUT}/${wall.n}.webp`, { left: wall.dleft ?? 0, top: wall.top }, D);
  if (wall.only !== "d") await cut(file, `${OUT}/${wall.n}-m.webp`, { left: wall.left, top: 0 }, M);
  console.log(wall.n);
}
