/* ============================================================
   THE FILMS THE SITE PLAYS, CUT FOR THE WEB.

   The list is at FILMS below. The settings are one set for all of them,
   and they were chosen against the worst master on it: the client
   uploaded the Netflix x MI film as it was delivered.

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

   The two later films - the IndusInd rebrand launch and the Zurich
   Kotak New Year film - arrived already compressed, so this pass buys
   them very little size. It is still worth running: it is what makes
   every film on the site one profile, one pixel format and faststart,
   rather than three files that each play somewhere slightly different.

   ---- what this does not touch ----

   The masters. They have been moved out of public/ - they sit as
   assets/<name>.src.mp4 alongside the other source masters, where the
   build can still read them but no deploy will ever serve them. They
   stay out of git; see the note at the end of this file.
   ============================================================ */
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { statSync, existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

/* Every film the site plays, master -> web cut. One list rather than one
   script per film: the settings above are the argument, and a second
   film that wanted different ones would want its own reasoning written
   down, not a copy of this file.

   The masters all sit in assets/ as <name>.src.mp4, gitignored, for the
   reason at the foot of this file. */
const FILMS = [
  /* The pinned stage's film. 476MB broadcast master; this is the 33MB
     cut the note above is about. */
  { src: "assets/netflix-mi.src.mp4", out: "public/assets/work/pinned/netflix-mi.mp4" },
  /* The IndusInd General Insurance rebrand launch film, and the Zurich
     Kotak New Year film. Both were delivered already compressed - 5.6MB
     and 27MB - so neither is the 476MB problem the settings were chosen
     for. They go through the same pass anyway: the point is not only
     size, it is that every film on the site is the same profile, the
     same pixel format and faststart, so none of them is the one that
     will not play on somebody's phone. */
  { src: "assets/igi-rebranding.src.mp4", out: "public/assets/work/cases/indusind/rebranding.mp4" },
  { src: "assets/zurich-kotak.src.mp4", out: "public/assets/work/cases/zurich-kotak/new-year.mp4" },
];

/* Re-encoding is minutes per film at -preset slow, and the cuts are
   committed - so a cut that is already there is left alone unless you
   ask. `node scripts/build-film.mjs --force` re-does all of them. */
const FORCE = process.argv.includes("--force");

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(1);

for (const { src, out } of FILMS) {
  if (!existsSync(src)) {
    /* The normal state of a fresh clone - the masters are gitignored.
       The cut is committed and still serves. */
    console.warn(`SKIP  missing master ${src}`);
    continue;
  }
  if (existsSync(out) && !FORCE) {
    console.log(`KEEP  ${out}  (--force to re-cut)`);
    continue;
  }
  await mkdir(path.dirname(out), { recursive: true });

  console.log("cutting", src);
  const run = spawnSync(ffmpeg, [
    "-hide_banner", "-y",
    "-i", src,
    /* Cap the long side at 1920 and never enlarge. `scale=-2:1080` was
       the rule while there was one film and it was a 4K landscape
       master; it is wrong for the two that followed. The IndusInd film
       is 1280x720 and upscaling it to 1080 made the web cut more than
       twice the size of the master it came from, for no new detail. The
       Zurich Kotak film is 1080x1350 - portrait, cut for a feed - and
       "height 1080" quietly threw a fifth of it away. This says the
       thing that was actually meant: nothing on the site is bigger than
       1920 on its long side, and nothing is ever blown up. */
    "-vf", "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v", "libx264",
    "-crf", "23",
    "-preset", "slow",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac",
    "-b:a", "128k",
    out,
  ], { stdio: ["ignore", "ignore", "inherit"] });
  if (run.status !== 0) process.exit(run.status ?? 1);

  /* Not every master is a broadcast master. The IndusInd film arrived
     already cut for the web - 720p at 941kbps - and a CRF 23 pass over
     an already-compressed file spends more bits than it started with
     and throws away a generation of quality to do it. When the cut
     comes out bigger than the source, the source was the better file:
     keep its bits and only remux, which still buys the one thing this
     script is really for on a file like that - faststart. */
  if (statSync(out).size > statSync(src).size) {
    const remux = spawnSync(ffmpeg, [
      "-hide_banner", "-y", "-i", src,
      "-c", "copy", "-movflags", "+faststart", out,
    ], { stdio: ["ignore", "ignore", "inherit"] });
    if (remux.status !== 0) process.exit(remux.status ?? 1);
    console.log(`${mb(src)}MB master -> ${mb(out)}MB remux (re-encode was larger)  ${out}
`);
    continue;
  }

  console.log(`${mb(src)}MB master -> ${mb(out)}MB web cut  ${out}
`);
}

/* ---- the thing this script cannot fix ----

   The 476MB master is committed (ec7d010), and so is the rest of the
   client's delivery folder. Both have since been moved out of public/
   and untracked - see the end of .gitignore - so nothing new is being
   added to the problem and no deploy ships them any more. But untracking
   a file does not remove it from the history: the blobs are in ec7d010
   and in the commits around it either way, which is why a clone of this
   repo is still measured in gigabytes.

   Fixing that means rewriting those commits, which is a call for whoever
   owns the remote to make and not something a build script should do
   behind anybody's back. It is a `git filter-repo --strip-blobs-bigger-than`
   over the history and a force push, and everyone with a clone has to
   re-clone afterwards.

   The web cut this script makes is 33MB and is fine to commit. */
