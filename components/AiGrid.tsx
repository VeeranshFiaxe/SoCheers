"use client";

import { useEffect, useRef, useState } from "react";
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

   ---- the films, and where their thumbnails come from ----

   Thirty-odd of the eighty-nine assets are video, they average 30MB
   apiece, and there is no encoder in this repo - no ffmpeg on the
   machine that builds this - to cut poster frames with. The tiles still
   have to show the film rather than a card with its name on it, so the
   frame is taken from the file itself: the src carries a media fragment
   (`#t=0.1`), which is an instruction to the browser to seek there and
   paint that frame, and `preload="metadata"` is what lets it do that
   without pulling the whole thing. A tenth of a second in rather than
   zero because the first frame of a rendered film is quite often black.

   The cost of that is one range request per film, so it is not paid on
   load either: the element is not put in the tree until the tile is
   within a screen of the viewport (see `near` below). A wall that
   quietly pulled a gigabyte of MP4 on scroll would be a page about AI
   that cannot be loaded on a train.

   Hover then plays the film in place, and leaving stops it and returns
   it to its frame. Until the frame is actually decoded the tile keeps
   the old typographic card at full strength; once it is, the card drops
   back to a scrim over the picture (`data-thumb` in ai.css). Nothing is
   ever blank.

   That is also why the card is a real <button>: playing a film is an
   action, and hover is not available to everybody. Tap plays on touch,
   Enter plays from the keyboard, and the same press stops it again.

   When the films move to Cloudinary (see lib/ai-content.ts) they arrive
   with derived posters, and `poster` on the asset - already honoured
   below - becomes the cheaper way to get the same picture.

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

  /* The tabs used to carry a count each. They do not any more, and that
     is a content decision rather than a layout one: the wall is meant to
     read as a body of work, and a number beside the label turns it into
     an inventory - it invites the reader to weigh the segments against
     each other, and it dates the page every time a film is added or
     taken out. Nothing on this page states a quantity now. */
  return (
    <section className="ai-work" id="ai-grid">
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
  const box = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  /* `near` is the src being attached at all - it goes true a screen
     before the tile arrives and never goes back, so a film that has been
     scrolled past once is already sitting on its own frame when the
     reader comes back to it. `ready` is that frame having been decoded.
     `playing` is only what the card is doing. */
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  /* Deliberately not IntersectionObserver on a hidden tile: a filtered-out
     tile is display:none, so it never intersects and never fetches, and
     it starts observing for real the moment its segment is picked. */
  useEffect(() => {
    if (!isFilm || near || !shown) return;
    const el = box.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isFilm, near, shown]);

  const play = () => {
    setNear(true);
    setPlaying(true);
  };
  const stop = () => {
    const v = vid.current;
    setPlaying(false);
    if (!v) return;
    v.pause();
    /* back to the frame the tile is meant to be showing, rather than
       leaving it parked on whatever it happened to be on */
    try { v.currentTime = 0.1; } catch { /* not seekable yet */ }
  };

  useEffect(() => {
    if (!playing) return;
    /* the element only exists once `near` has put it in the tree, so the
       play() call waits for the render that did */
    vid.current?.play().catch(() => setPlaying(false));
  }, [playing, near]);

  /* A film left running inside a segment that has just been filtered
     out is audio-free, invisible and still decoding frames. */
  useEffect(() => {
    if (!shown && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <figure
      ref={box}
      className="ai-tile"
      data-kind={a.kind}
      data-playing={playing ? "" : undefined}
      data-thumb={ready ? "" : undefined}
      hidden={!shown}
      /* the asset's own ratio, so nothing is cropped and the column
         packer knows the real height before anything loads */
      style={{ aspectRatio: `${a.w} / ${a.h}` }}
    >
      {isFilm ? (
        <>
          {near && (
            <video
              ref={vid}
              className="ai-tile__film"
              /* the fragment is the thumbnail - see the note at the top.
                 Dropped once the asset carries a real poster, since then
                 the browser has a picture without seeking for one. */
              src={a.poster ? a.src : `${a.src}#t=0.1`}
              poster={a.poster}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setReady(true)}
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
