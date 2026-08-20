"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AI_SEGMENTS, AI_WORK, type AiAsset, type SegmentId } from "@/lib/ai-content";

/* ============================================================
   THE WORK GRID - four segments, two orientations, one column flow.

   ---- the tiling ----

   The assets are a mix of vertical and horizontal - 9:16 reels next to
   16:9 key visuals next to square posts - and the client was explicit
   that both have to sit in the same grid without one of them being
   ruined. Three ways to do that, and only one of them is right here:

     - one fixed aspect per tile and cover-crop into it. Cheapest, and it
       throws away the top and bottom of every vertical film - on a page
       about AI video, where the vertical crop *is* the format.
     - a real grid with each tile spanning rows computed from its own
       ratio. Works, needs the ratio in JS and a row-span calculation per
       tile per breakpoint.
     - CSS columns, each tile keeping its own aspect-ratio. The browser
       does the packing, nothing is cropped, no measurement, and it
       reflows on filter change for free.

   The third. The one thing it costs is reading order - columns run down
   rather than across - which for an unordered wall of work is not a
   meaning anyone is relying on.

   ---- the films ----

   Thirty-odd of the eighty-nine assets are video, they average 30MB
   apiece, and there is no encoder in this repo to cut posters with. So
   nothing about a film is fetched until somebody asks for it: the tile
   is a typographic card carrying the title, `preload="none"`, and the
   src is not attached to the element until the first hover or tap. A
   wall that quietly pulled a gigabyte of MP4 on scroll would be a page
   about AI that cannot be loaded on a train.

   That is also why the card is a real <button>: playing a film is an
   action, and hover is not available to everybody. Tap plays on touch,
   Enter plays from the keyboard, and the same press stops it again.

   When the films move to Cloudinary (see lib/ai-content.ts) they arrive
   with derived posters and this can become a still that starts playing
   in place - the markup is already shaped for it, and `poster` on the
   asset is the only thing that has to start being set.

   ---- the filter ----

   Filtered on `tags`, not on `kind`, even though right now they agree.
   That is on purpose: when this list becomes a Cloudinary fetch the tags
   are what comes back from the CDN, and an asset that arrives with a tag
   nobody planned for should still show up under All rather than vanish.

   The whole list stays mounted and hidden tiles are marked rather than
   unmounted, so switching segments never re-decodes an image the reader
   has already seen.
   ============================================================ */
export default function AiGrid() {
  const [seg, setSeg] = useState<SegmentId>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: AI_WORK.length };
    for (const a of AI_WORK) for (const t of a.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, []);

  return (
    <section className="ai-work is-light" id="ai-grid">
      <div className="wrap">
        <span className="tag" data-reveal>The work</span>

        <div className="ai-tabs" role="tablist" aria-label="Filter work by type">
          {AI_SEGMENTS.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              className="ai-tab"
              aria-selected={seg === s.id}
              onClick={() => setSeg(s.id)}
              data-cursor={s.label}
            >
              {s.label}
              <sup>{counts[s.id] ?? 0}</sup>
            </button>
          ))}
        </div>

        <div className="ai-grid">
          {AI_WORK.map((a) => (
            <Tile key={a.id} asset={a} shown={seg === "all" || a.tags.includes(seg)} />
          ))}
        </div>
      </div>
    </section>
  );
}

const KIND_LABEL: Record<string, string> = { video: "Film", cgi: "CGI", static: "Still" };

function Tile({ asset: a, shown }: { asset: AiAsset; shown: boolean }) {
  const isFilm = a.kind !== "static";
  const vid = useRef<HTMLVideoElement>(null);
  /* `live` is the src being attached at all - once a film has been asked
     for once it stays attached, so a second hover is instant rather than
     a second download. `playing` is only what the card is doing. */
  const [live, setLive] = useState(false);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setLive(true);
    setPlaying(true);
  };
  const stop = () => {
    vid.current?.pause();
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    /* the element only exists once `live` has put it in the tree, so the
       play() call waits for the render that did */
    vid.current?.play().catch(() => setPlaying(false));
  }, [playing, live]);

  /* A film left running inside a segment that has just been filtered
     out is audio-free, invisible and still decoding frames. */
  useEffect(() => {
    if (!shown && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <figure
      className="ai-tile"
      data-kind={a.kind}
      data-playing={playing ? "" : undefined}
      hidden={!shown}
      /* the asset's own ratio, so nothing is cropped and the column
         packer knows the real height before anything loads */
      style={{ aspectRatio: `${a.w} / ${a.h}` }}
    >
      {isFilm ? (
        <>
          {live && (
            <video
              ref={vid}
              className="ai-tile__film"
              src={a.src}
              poster={a.poster}
              muted
              loop
              playsInline
              preload="none"
              onPause={() => setPlaying(false)}
            />
          )}

          <button
            type="button"
            className="ai-tile__card"
            onMouseEnter={play}
            onMouseLeave={stop}
            onClick={() => (playing ? stop() : play())}
            data-cursor={playing ? "Stop" : "Play"}
            aria-label={`${playing ? "Stop" : "Play"} ${a.brand ? `${a.brand}, ` : ""}${a.title}`}
          >
            <span className="ai-tile__kind">{KIND_LABEL[a.kind]}</span>
            <span className="ai-tile__name">
              {a.brand && <b>{a.brand}</b>}
              <span>{a.title}</span>
            </span>
            <span className="ai-tile__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      ) : (
        <>
          <img src={a.src} alt={a.title} loading="lazy" decoding="async" width={a.w} height={a.h} />
          <figcaption className="ai-tile__cap">
            {a.brand && <b>{a.brand}</b>}
            <span>{a.title}</span>
          </figcaption>
        </>
      )}
    </figure>
  );
}
