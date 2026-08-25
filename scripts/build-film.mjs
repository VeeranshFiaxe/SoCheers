/* ============================================================
   THE PINNED FILM, CUT FOR THE WEB.

   The client uploaded the Netflix x MI film as the master it was
   delivered as:

     3840x2160, 25fps, H.264, 28.7 Mbps, 2m15s, 476MB.

   That is a broadcast master. Nothing about it is wrong except where it
   was pointed - the stage frame draws it at about 1500px wide on the
   largest screen this site is designed for, so three quarters of those
   pixels are decoded and thrown away, and 476MB down a normal Indian
   mobile connection is not a film anybody watches, it is a film that
   buffers. This makes the copy the page actually loads:

     1920x1080, H.264 high, CRF 23, AAC 128k, faststart, ~33MB.

   Fourteen times smaller, and at the size it is drawn there is nothing
   to see between them.

     node scripts/build-film.mjs

   ---- the settings, and why these ----

   CRF 23 rather than a target bitrate: the film is graded dark with
   long flat passages, and a fixed bitrate spends the same on those as
   on the busy ones. Constant quality gives the motion the bits and
   leaves the still frames alone - it landed at 1.9 Mbps average here,
   which no bitrate ladder would have guessed.

   `-preset slow` costs a few minutes once and about 10% of the file
   size forever. This is run when a film changes, which is rarely.

   `+faststart` moves the index to the front so the browser can start
   playing on the first chunk instead of waiting for the last one. On a
   file this size it is the difference between a play button that works
   and one that appears not to.

   ---- what this does not touch ----

   The master. It has been moved out of public/ - it now sits at
   assets/netflix-mi.src.mp4, alongside the other source masters, where
   the build can still read it but no deploy will ever serve it. It
   stays out of git; see the note at the end of this file.
   ============================================================ */
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { statSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const SRC = "assets/netflix-mi.src.mp4";
const OUT = "public/assets/work/pinned/netflix-mi.mp4";

await mkdir("public/assets/work/pinned", { recursive: true });

const args = [
  "-hide_banner", "-y",
  "-i", SRC,
  "-vf", "scale=-2:1080",
  "-c:v", "libx264",
  "-crf", "23",
  "-preset", "slow",
  "-profile:v", "high",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  "-c:a", "aac",
  "-b:a", "128k",
  OUT,
];

console.log("cutting", SRC);
const run = spawnSync(ffmpeg, args, { stdio: ["ignore", "ignore", "inherit"] });
if (run.status !== 0) process.exit(run.status ?? 1);

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(1);
console.log(`\n${mb(SRC)}MB master -> ${mb(OUT)}MB web cut  ${OUT}`);

/* ---- the thing this script cannot fix ----

   The 476MB master is committed (ec7d010). GitHub refuses any single
   file over 100MB, so that commit cannot be pushed as it stands, and
   deleting the file now would not help - the blob is in the history
   either way. Fixing it means rewriting that commit, which is a call
   for whoever owns the remote to make, not for a build script:

     git rm --cached "public/assets/SC Website Revamp/03. Work/Pinned Work/Netflix x MI & SRH/NETFLIX X MI video_.mp4"
     # then rewrite the commit that introduced it, or start the history
     # from a commit that never had it

   The web cut this script makes is 33MB and is fine to commit. */
