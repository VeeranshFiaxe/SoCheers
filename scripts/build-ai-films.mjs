/* ============================================================
   AI WORK - the films, cut for a grid tile.

   The wall on /ai-work is forty films and they were being served as the
   masters they were delivered as: 1080p at 13-16 Mbps with a stereo AAC
   track, 1.28GB between them. Every one of those numbers is wrong for
   where they are pointed.

     · the tile is about 600px wide in a three-column pack, and there is
       no path through the page that opens one bigger. Better than half
       the pixels in a 1080p master are decoded and thrown away;
     · the element is <video muted loop> with no controls. The audio
       track is 190kbps of something nobody can ever hear;
     · `preload="metadata"` on an MP4 whose index sits at the end of the
       file is not a metadata read, it is most of the file. None of
       these were written with +faststart, so the wall's "cheap" poster
       frame - a #t=0.1 media fragment - was costing tens of megabytes
       per tile on the way to painting one frame.

   So this makes the copies the page actually loads:

     public/assets/ai/films/<slug>.mp4    long edge 960, CRF 30, no
                                          audio, +faststart
     public/assets/ai/<slug>-poster.webp  the frame at 0.1s

   and the poster is the point as much as the cut is. With one on disk,
   components/AiGrid.tsx paints an <img> and never puts a <video> in the
   tree until somebody asks to play - so the wall costs forty small webp
   files on load instead of forty range requests into forty masters.

     node scripts/build-ai-films.mjs

   ---- the settings, and why these ----

   960 on the long edge is the tile at 2x on the widest layout the grid
   reaches, and no further. A vertical 1080x1920 comes out 540x960.

   CRF 30 rather than the 23 the pinned film gets (scripts/build-film.mjs)
   because that one fills the screen and these are thumbnails that play
   under a card. At tile size there is nothing to see between them.

   `-preset slow` costs minutes once and about a tenth of the file size
   forever. This is run when the delivery folder changes, which is rarely.

   ---- what this does not touch ----

   The masters. They stay exactly where the client put them; this only
   ever reads. See the note at the end of this file for what to do with
   them once these cuts are in - nothing serves them any more.
   ============================================================ */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT_DIR = path.join(ROOT, "public/assets/ai");
const FILM_DIR = path.join(OUT_DIR, "films");

/* The long edge of the cut. Both dimensions are capped at this and the
   aspect is kept, so a 9:16 reel lands 540x960 and a 16:9 KV 960x540. */
export const FILM_EDGE = 960;
export const FILM_CRF = 30;

/* Nothing is re-encoded if the cut is already newer than the master it
   came from - forty films is twenty minutes of ffmpeg and the whole
   point of a derived folder is that it survives between runs. */
const fresh = (out, src) => {
  try {
    return fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;
  } catch {
    return false;
  }
};

const run = (args) =>
  spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "ignore", "inherit"],
  });

/** The web cut. Returns the public path, or null if ffmpeg refused it. */
export function cutFilm(src, slug) {
  fs.mkdirSync(FILM_DIR, { recursive: true });
  const out = path.join(FILM_DIR, `${slug}.mp4`);
  if (!fresh(out, src)) {
    const r = run([
      "-i", src,
      /* cap both edges, keep the ratio, and keep the result even -
         libx264's yuv420p needs it and an odd height is a hard error */
      "-vf", `scale=w=${FILM_EDGE}:h=${FILM_EDGE}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      "-c:v", "libx264",
      "-crf", String(FILM_CRF),
      "-preset", "slow",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      /* the tile loops these, so a keyframe every two seconds keeps the
         wrap from stalling on a long GOP */
      "-g", "60",
      "-an",                       // <video muted> - there is nothing to hear
      "-movflags", "+faststart",   // the index at the front, so it plays on chunk one
      out,
    ]);
    if (r.status !== 0) return null;
  }
  return `/assets/ai/films/${slug}.mp4`;
}

/** The frame the tile shows before anybody asks to play. */
export async function cutPoster(cut, slug) {
  const out = path.join(OUT_DIR, `${slug}-poster.webp`);
  if (fresh(out, cut)) return `/assets/ai/${slug}-poster.webp`;

  const tmp = path.join(FILM_DIR, `.${slug}-frame.png`);
  /* a tenth of a second in rather than zero: the first frame of a
     rendered film is quite often black, and a black poster reads as a
     broken tile rather than a still one */
  const r = run(["-ss", "0.1", "-i", cut, "-frames:v", "1", tmp]);
  if (r.status !== 0 || !fs.existsSync(tmp)) return undefined;

  await sharp(tmp).webp({ quality: 74, effort: 5 }).toFile(out);
  fs.rmSync(tmp, { force: true });
  return `/assets/ai/${slug}-poster.webp`;
}

/* ---- who calls this ----
   scripts/build-ai-work.mjs, once per film, as it walks the delivery
   folder. It owns the slugs - the names these files are written under
   have to be the same ones the generated data file uses - so there is
   no standalone entry point here on purpose. */
