"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AI_SEGMENTS, AI_WORK, type AiAsset, type SegmentId } from "@/lib/ai-content";
import { thumb } from "@/lib/images";

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

   Thirty-odd of the eighty-nine assets are video, and as delivered they
   averaged 30MB apiece. There is an encoder in this repo now
   (scripts/build-ai-films.mjs, run by scripts/build-ai-work.mjs), so
   every film arrives here already carrying two things it did not have
   before: a cut sized for a tile, and a poster frame.

   The poster is what changed this component. A tile is an <img> - lazy,
   decoded off the main thread, a few tens of kilobytes - and there is no
   <video> in the tree at all until somebody asks to play one. Which
   means the wall costs a screen of thumbnails on load and nothing else,
   however far it is scrolled.

   What it used to do, and why it had to: with no poster on disk the only
   picture available was one inside the film, so the src carried a media
   fragment (`#t=0.1`) and `preload="metadata"` let the browser seek
   there and paint that frame. That is a range request per film into a
   file with its index at the far end - tens of megabytes to paint one
   frame - so the element was held back until the tile was within a
   screen of the viewport. It is still the path for any film that turns
   up without a poster (see `near` below), and it is no longer the one
   anything here takes.

   Hover then plays the film in place, and leaving stops it and returns
   it to its poster. Until there is a picture of any kind the tile keeps
   the typographic card at full strength; once there is, the card drops
   back to a scrim over it (`data-thumb` in ai.css). Nothing is ever
   blank.

   That is also why the card is a real <button>: playing a film is an
   action, and hover is not available to everybody. Tap plays on touch,
   Enter plays from the keyboard, and the same press stops it again.

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

  /* On touch there is no hover to play a film in place, and a tap that
     played and stopped it in the tile threw the reader back to 0:00 every
     time. So a tap on any tile - film or still - opens it whole, in a
     viewer: stills full size, films with the native controls (scrubber,
     time, pause that stays where it was). Desktop keeps hover. */
  const [touch, setTouch] = useState(false);
  const [open, setOpen] = useState<AiAsset | null>(null);
  useEffect(() => {
    const q = window.matchMedia("(hover: none)");
    const read = () => setTouch(q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);

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
            <Tile
              key={a.id}
              asset={a}
              shown={seg === "all" || a.tags.includes(seg)}
              onOpen={touch ? setOpen : undefined}
            />
          ))}
        </div>
      </div>

      {open && <Viewer asset={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function Viewer({ asset: a, onClose }: { asset: AiAsset; onClose: () => void }) {
  const isFilm = a.kind !== "static";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* portalled: an ancestor with a transform would otherwise be what
     position:fixed resolves against */
  return createPortal(
    <div
      className="ai-view"
      role="dialog"
      aria-modal="true"
      aria-label={`${a.brand ? `${a.brand}, ` : ""}${a.title}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {isFilm ? (
        <video
          className="ai-view__media"
          src={a.src}
          poster={a.poster}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <img className="ai-view__media" src={a.src} alt={a.title} />
      )}
      <div className="ai-view__cap">
        {a.brand && <b>{a.brand}</b>}
        {titleOf(a) && <span>{titleOf(a)}</span>}
      </div>
      <button type="button" className="ai-view__close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}

/* The build script names anything it could not read a title out of
   "Untitled film" / "Untitled still". That is a placeholder, not a title,
   so it is never printed over the work. */
const titleOf = (a: AiAsset) => (/^untitled\b/i.test(a.title) ? "" : a.title);

const KIND_LABEL: Record<string, string> = { video: "Film", cgi: "CGI", static: "Still" };

function Tile({
  asset: a,
  shown,
  onOpen,
}: {
  asset: AiAsset;
  shown: boolean;
  onOpen?: (a: AiAsset) => void;
}) {
  const isFilm = a.kind !== "static";
  const box = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const posterImg = useRef<HTMLImageElement>(null);
  /* `near` is the <video> being in the tree at all. A film with a poster
     does not need one until it is asked to play, so this stays false
     through the whole page for every tile nobody touches - which is what
     makes the wall cost thumbnails and nothing else. A film *without* a
     poster has no other way to show a picture, so for those it goes true
     a screen before the tile arrives, exactly as it used to, and never
     goes back. `ready` is a picture of some kind having landed.
     `playing` is only what the card is doing. */
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  /* Deliberately not IntersectionObserver on a hidden tile: a filtered-out
     tile is display:none, so it never intersects and never fetches, and
     it starts observing for real the moment its segment is picked.
     Skipped entirely when there is a poster - there is nothing to go and
     get early, and an observer per tile over ninety tiles is not free. */
  useEffect(() => {
    if (!isFilm || a.poster || near || !shown) return;
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
  }, [isFilm, a.poster, near, shown]);

  /* A poster already in the cache can finish loading before React has
     attached onLoad, and then the event is simply missed - the tile kept
     its opaque card over a picture that was there all along. */
  useEffect(() => {
    const i = posterImg.current;
    if (i && i.complete && i.naturalWidth > 0) setReady(true);
  }, []);

  const play = () => {
    setNear(true);
    setPlaying(true);
  };
  const stop = () => {
    const v = vid.current;
    setPlaying(false);
    /* Where there is a poster, the film is taken back out of the tree.
       Ninety tiles on one page and a pointer that crosses a dozen of
       them on the way anywhere means a dozen decoders, a dozen buffers
       and a dozen GPU surfaces held for the rest of the visit, for
       pictures that are already on screen as <img>. The poster is
       underneath and does not move, so there is nothing to see in the
       swap - and the cuts carry +faststart, so coming back is a chunk,
       not a load. Without a poster the element *is* the thumbnail and
       has to stay. */
    if (a.poster) setNear(false);
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
          {/* The picture, and on its own it is the whole tile. It stays
              under the film rather than being swapped out for it: the
              <video> takes a moment to have a frame to show even off a
              warm cache, and a tile that blanks on hover is worse than
              one that never moved. */}
          {a.poster && (
            <img
              ref={posterImg}
              className="ai-tile__film"
              src={a.poster}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setReady(true)}
            />
          )}

          {near && (
            <video
              ref={vid}
              className="ai-tile__film"
              /* Where there is no poster the fragment is the thumbnail -
                 see the note at the top. With one, the browser already
                 has a picture and this is only ever the film. */
              src={a.poster ? a.src : `${a.src}#t=0.1`}
              poster={a.poster}
              muted
              loop
              playsInline
              /* "metadata" is for the no-poster path, where the element
                 exists to be seeked for a frame. With a poster nothing
                 mounts this until the reader has asked to watch, so at
                 that point the answer to "how much of it do we want" is
                 all of it. */
              preload={a.poster ? "auto" : "metadata"}
              onLoadedData={() => setReady(true)}
              onPause={() => setPlaying(false)}
            />
          )}

          <button
            type="button"
            className="ai-tile__card"
            onMouseEnter={onOpen ? undefined : play}
            onMouseLeave={onOpen ? undefined : stop}
            onClick={() => (onOpen ? onOpen(a) : playing ? stop() : play())}
            data-cursor={playing ? "Stop" : "Play"}
            aria-label={`${playing ? "Stop" : "Play"} ${a.brand ? `${a.brand}, ` : ""}${a.title}`}
          >
            <span className="ai-tile__kind">{KIND_LABEL[a.kind]}</span>
            <span className="ai-tile__name">
              {a.brand && <b>{a.brand}</b>}
              {titleOf(a) && <span>{titleOf(a)}</span>}
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
          <img {...thumb(a.src)} sizes="(max-width: 760px) 50vw, 33vw" alt={a.title} loading="lazy" decoding="async" width={a.w} height={a.h} />
          {onOpen && (
            <button
              type="button"
              className="ai-tile__open"
              onClick={() => onOpen(a)}
              aria-label={`Open ${a.brand ? `${a.brand}, ` : ""}${a.title}`}
            />
          )}
          <figcaption className="ai-tile__cap">
            {a.brand && <b>{a.brand}</b>}
            {titleOf(a) && <span>{titleOf(a)}</span>}
          </figcaption>
        </>
      )}
    </figure>
  );
}
