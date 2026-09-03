/* ============================================================
   THE PINNED THUMBNAILS, MADE READY TO SERVE.

   The five featured pieces arrive from the client's drive as PNGs
   between one and three megabytes each, with spaces and an ampersand in
   their paths. Neither is a thing to put in an <img src> on the first
   screen of the Work tab: eight megabytes of PNG for five stills that
   are never drawn wider than about 1500px, and a URL that has to be
   percent-encoded by hand every time somebody writes it down.

   So this reads the drive folder and writes web copies next to each
   other under public/assets/work/pinned/ with names that are their own
   slugs. The originals are left exactly where the client put them -
   they are the masters, and this is a derived folder.

   Run it again whenever a thumbnail is replaced:

     node scripts/build-pinned.mjs

   ---- what it does not do ----

   The film. NETFLIX X MI video_.mp4 is a 476MB broadcast master and
   nothing here can transcode it; sharp does stills. It is referenced
   from where it sits and it needs compressing or hosting before this
   goes live - see the note over PINNED in lib/work-content.ts.
   ============================================================ */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "assets/SC Website Revamp/03. Work/Pinned Work";
const OUT = "public/assets/work/pinned";

/* slug -> the file the client sent. The slug is what the site calls the
   piece everywhere else, so the mapping lives here once rather than the
   client's filenames leaking into the content file. */
const SHOTS = {
  "netflix-mi": "Netflix x MI & SRH/NETFLIX X MI thumbnail.png",
  "netflix-srh": "Netflix x MI & SRH/Netflix x SRH Thumbnail.jpg",
  "pantaloons-eoss": "Pantaloons EOSS Thumbnail.png",
  broadway: "BroadWay Thumbnail.png",
  prava: "Prava Thumbnail.png",
};

/* 1600 wide is the stage frame at its largest on a 1500px page plus a
   little headroom for a 2x rail poster; nothing on this page draws one
   bigger, and upscaling a 1376px original would only add weight. */
const WIDTH = 1600;

await mkdir(OUT, { recursive: true });

for (const [slug, file] of Object.entries(SHOTS)) {
  const from = path.join(SRC, file);
  const to = path.join(OUT, `${slug}.jpg`);

  const out = await sharp(from)
    .resize({ width: WIDTH, withoutEnlargement: true })
    /* mozjpeg at 82 is the point where these particular stills stop
       showing banding in the flat brand colours; progressive so the
       first screen paints something before the whole file is down. */
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(to);

  console.log(`${slug.padEnd(18)} ${out.width}x${out.height}  ${(out.size / 1024).toFixed(0)}KB  <- ${file}`);
}
