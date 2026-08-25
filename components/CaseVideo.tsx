"use client";

import { useState } from "react";
import { parseVideo, RATIO } from "@/lib/video";

/* ============================================================
   ONE MOVING PICTURE, WHEREVER IT LIVES.

   The case template hands this a URL and a frame and does not know
   whether it is an .mp4 on our own storage, a YouTube link off the
   brand's channel or a Vimeo link off the edit house's. parseVideo()
   in lib/video.ts works that out; this renders the result.

   Two shapes come out of it:

     a file      a real <video>, controls on, preload off, poster set.
                 Nothing here autoplays - the client's own note about
                 video competing with text for the same attention is the
                 reason, and it applies to a page that is mostly reading
                 more than anywhere else on the site.

     a hosted    the poster and a play button, and the player itself is
                 built on the click. Half a megabyte of third-party
                 script per embed is not a thing to spend on a reader
                 who may never press play, and the click they were
                 always going to make is a perfectly good moment to
                 spend it. The frame that replaces it *does* autoplay,
                 because it was asked for.

   The button is a real <button>, so it takes the keyboard for free and
   announces itself; the poster underneath is decorative and carries no
   alt text of its own.
   ============================================================ */
export default function CaseVideo({
  src,
  poster,
  ratio = "wide",
  label,
}: {
  src: string;
  poster?: string;
  ratio?: string;
  label?: string;
}) {
  const v = parseVideo(src, poster);
  const [playing, setPlaying] = useState(false);
  /* YouTube generates maxresdefault only for uploads that had the
     resolution to begin with; for the rest the URL 404s and the frame
     goes empty. hqdefault always exists, so a failed still falls back to
     it once rather than leaving a hole. */
  const [still, setStill] = useState(v.kind === "youtube" ? v.poster : poster);

  const style = { aspectRatio: RATIO[ratio] ?? RATIO.wide };

  if (v.kind === "file") {
    return (
      <div className="cs-play" style={style}>
        <video src={v.src} poster={poster} controls preload="none" playsInline />
      </div>
    );
  }

  if (playing) {
    return (
      <div className="cs-play" style={style}>
        <iframe
          src={v.src}
          title={label ?? "Video"}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cs-play cs-play--facade"
      style={style}
      onClick={() => setPlaying(true)}
      aria-label={label ? `Play ${label}` : "Play video"}
      data-cursor="Play"
    >
      {still && (
        <img
          src={still}
          alt=""
          loading="lazy"
          onError={() =>
            setStill(v.kind === "youtube" ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : undefined)
          }
        />
      )}
      <span className="cs-play__btn" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </button>
  );
}
