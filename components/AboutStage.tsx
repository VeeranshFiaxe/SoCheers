"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpaceShot } from "@/lib/about-content";
import StageAscii from "./StageAscii";
import { keepPlaying } from "@/lib/autoplay";

/* ============================================================
   THE SPACE, one frame at a time.

   This replaced a mosaic - eight photos of different shapes tiled into a
   jigsaw. A collage shows you everything at once and asks you to sort it
   out yourself, which is the opposite of what the brief wanted: the
   office, shown deliberately, without handing over the whole floor plan.

   So there is one frame here and it never moves. The photograph inside it
   changes; the frame, the caption line and the counter stay exactly where
   they are, which is what makes it read as a projection rather than a
   gallery. The rail underneath is the whole navigation - every frame is
   visible as a thumbnail, so you can see how much there is without any of
   it being large enough to give itself away.

   The whole section is built to sit inside one screen (see .ab-space in
   about.css - the frame is sized off the viewport height, not the column
   width), so nothing here scrolls and nothing is pinned. No parallax
   either, by instruction and by sense.
   ============================================================ */

/* How long a frame holds before the next one comes up. Slow on purpose:
   this is something running in the corner of your eye while you read the
   copy above it, not a carousel demanding to be watched. Declared once
   and handed to CSS as well (see the progress hairline below) so the bar
   and the timer cannot drift apart. */
const DWELL_MS = 6000;

const PANEL_ID = "ab-stage-panel";
const tabId = (n: number) => `ab-stage-tab-${n}`;
const pad = (n: number) => String(n).padStart(2, "0");

export default function AboutStage({
  shots,
  film,
}: {
  shots: SpaceShot[];
  /* The film, and it is frame 01 - not a separate block above the stage.
     The section is one frame with a rail under it; a video parked over
     the top of that would be a second treatment of the same idea, and it
     would push the photographs off the first screen entirely. Here the
     film is simply what the frame is showing when you arrive, and the
     rail says how much else there is. */
  film?: { src: string; poster?: string; cap: string };
}) {
  const [i, setI] = useState(0);

  /* Two reasons to hold: something inside it has focus, or the section is
     off screen. Kept as one flag each rather than a single counter so no
     path can leave it stuck paused.

     Hover used to be a third, and it was wrong here. This frame is the
     centre of its own section, so the pointer is resting on it for most of
     the time anyone is looking at the thing - which meant the cycle
     stopped exactly when it was being watched and only ran when nobody
     was there to see it. It reads as a slideshow that does not work. The
     hold on focus stays: that one is a keyboard user part way through the
     rail, and moving the frame under them is a different problem. */
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  /* Read in an effect, not at render: matchMedia does not exist on the
     server, and reading it during render would hand back a first paint
     that disagrees with the markup Next sent. */
  const [reduced, setReduced] = useState(false);

  /* Index 0 is the film when there is one, so every photograph is one
     further along. Kept as two numbers rather than a merged array of
     union-typed slides: the photographs are handed straight to the same
     <img> loop and the same rail cells they always were, and only the
     three places that actually care about the film branch on `n === 0`. */
  const filmAt = film ? 0 : -1;
  const count = shots.length + (film ? 1 : 0);
  const onFilm = i === filmAt;
  /* what the frame is showing, when it is showing a photograph */
  const shotIdx = film ? i - 1 : i;

  const rootRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  /* The rail owns a roving tabindex: one stop for the whole strip rather
     than ten in a row, and the arrow keys move between them. Refs so the
     newly-selected tab can actually take focus when it is chosen by
     keyboard - a roving tabindex that never moves focus is just a set of
     unreachable buttons. */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /* Focus is only forced when the change came from a key, never from a
     click, from the autoplay tick, or from first paint: stealing focus on
     mount would jump the page down to this section on load, and stealing
     it every six seconds would be unusable. */
  const viaKey = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  /* Nothing cycles while the section is out of view. Without this the
     frame you finally scroll down to is wherever the clock happened to
     leave it, which is both a waste and a worse first impression than
     frame one. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = focused || !onScreen || reduced;

  /* The auto-advance, and the reason it is a setTimeout keyed on `i`
     rather than one long-lived setInterval.

     An interval keeps its own phase: pick a frame two hundred
     milliseconds before the next tick and the interval fires anyway, so
     the frame you just chose is replaced almost immediately and you land
     on the one after it. Because this effect lists `i` as a dependency,
     every change - autoplay's own, a click, an arrow key - tears the
     pending timeout down and starts a fresh, full DWELL_MS. The timer
     cannot carry anything over from the frame before it. */
  useEffect(() => {
    if (paused || onFilm) return;
    const t = window.setTimeout(
      /* wraps to the first photograph, never back to the film: the film
         is the way in, and a slideshow that drops you into the middle of
         a video every ten frames is a different section. Once you are in
         the photographs the cycle stays there. */
      () => setI((n) => (n + 1 === count ? (film ? 1 : 0) : n + 1)),
      DWELL_MS,
    );
    return () => window.clearTimeout(t);
  }, [i, paused, count, onFilm, film]);

  /* The film's own transport, and its src.

     No src in the markup: this is the heaviest asset on the site and the
     section is most of a page down, so the string is set the first time
     the stage is anywhere near the viewport and not before. After that it
     plays whenever it is the frame that is up and the section is on
     screen, and pauses for everything else - another frame chosen, the
     section scrolled past, reduced motion. play() is caught because a tab
     that has denied autoplay rejects, and an unhandled rejection here
     would be thrown on every pass of the section. */
  /* The projector is built once and lives as long as the element does:
     it is the thing that keeps asking, so tearing it down and rebuilding
     it every time the frame changes would throw away the backoff and the
     gesture listener that are the entire point of it. */
  const projector = useRef<ReturnType<typeof keepPlaying> | null>(null);
  useEffect(() => {
    const v = filmRef.current;
    if (!v || !film) return;
    projector.current = keepPlaying(v);
    return () => {
      projector.current?.destroy();
      projector.current = null;
    };
  }, [film]);

  useEffect(() => {
    const v = filmRef.current;
    if (!v || !film) return;
    if (!v.src && onScreen) {
      /* Reduced motion still gets a picture, not an empty black box: the
         markup asks for nothing, and this is the one place that decides
         how much to fetch. "metadata" is enough for the browser to paint
         the first frame, which is exactly what a reader who has asked for
         no motion should see - the film, held still. */
      v.preload = reduced ? "metadata" : "auto";
      v.src = film.src;
    }
    /* The intent, not a one-shot play(). What stood here was
       play().catch(() => {}), which asks exactly once per pass and
       throws the answer away - so a rejection for a frame that had not
       decoded yet, or an autoplay policy that would have relented on the
       reader's next tap, was permanent. lib/autoplay.ts keeps asking. */
    projector.current?.want(Boolean(onFilm && onScreen && !reduced));
  }, [film, onFilm, onScreen, reduced]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const last = count - 1;
      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = last;
      if (next === null) return;
      e.preventDefault();
      viaKey.current = true;
      setI(next);
    },
    [i, count],
  );

  useEffect(() => {
    if (!viaKey.current) return;
    viaKey.current = false;
    tabRefs.current[i]?.focus();
  }, [i]);

  /* The frame's photograph. On the film slide there is none, and the
     symbol field still needs an image to resolve - it is given the first
     photograph, which is the one that comes up the moment anybody leaves
     the film. So the grid behind the frame is already the picture you are
     about to see rather than a blank field or a still of the video, which
     it cannot sample from a <video> anyway. */
  const shot = shots[Math.max(0, shotIdx)];
  const cap = onFilm && film ? film.cap : shot.cap;

  return (
    <div
      className="stage"
      ref={rootRef}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      {/* The same photograph again, typed out as symbols, with the cursor
          pushing a wave through it. It sits under the frame, so what you
          see of it is the margin around the picture.

          There was a blurred copy of the photograph under this for a
          while, to put the picture's colour on the paper around the frame.
          It came out before the field went in: the characters are cut out
          of the photograph itself and carry its colour at full strength,
          so a soft wash of the same colours underneath was not adding to
          them, it was lifting the paper toward them and taking away the
          contrast the grid needs to be read at all.

          Fed the same `i` as everything else, and told when the section is
          on screen so it can keep its loop stopped the rest of the time.
          Everything else about it is in lib/ascii-field.ts. */}
      <StageAscii src={shot.src} active={onScreen} still={reduced} />

      {/* Every photo is mounted and stacked; only one is at full opacity.
          Cross-fading between two elements that are already decoded is
          what keeps the swap instant - swapping one <img>'s src would
          show a blank frame for as long as the next file takes to
          arrive, on exactly the frame the eye is fixed on. */}
      <div
        className="stage__frame"
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(i)}
        data-clip
      >
        {/* The film, stacked in the same box as the photographs and faded
            in and out by the same rule. It sits first so every photo
            paints over it: only one layer is ever at full opacity, and
            the video is the one that is up when the section is reached.
            No controls and no pointer target - the rail is the whole
            navigation here, the same as it is for the stills. */}
        {film && (
          <video
            ref={filmRef}
            className={onFilm ? "stage__film is-active" : "stage__film"}
            poster={film.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        {shots.map((s, n) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={n === shotIdx ? "is-active" : undefined}
            style={s.pos ? { objectPosition: s.pos } : undefined}
            /* only the visible frame is exposed - otherwise the section
               reads out as ten stacked photographs */
            aria-hidden={n !== shotIdx}
            loading={n === 0 ? undefined : "lazy"}
            draggable={false}
          />
        ))}

        {/* The hairline that shows the hold running out. It is the only
            thing telling you the frame is going to change on its own, and
            - because it is keyed on `i`, so React replaces the node - it
            visibly snaps back to empty the instant you pick a frame
            yourself. That restart IS the reset; the timeout above and
            this bar are started by the same render. */}
        {/* Nothing to run down on the film: it holds until a frame is
            picked, so a bar draining towards a change that is not coming
            would be lying about what the section is doing. */}
        {!reduced && !onFilm && (
          <span
            className="stage__prog"
            key={i}
            aria-hidden="true"
            style={{
              animationDuration: `${DWELL_MS}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>

      {/* The caption and the counter sit on one hairline under the frame,
          at the two ends of it - the same device the group shot's caption
          uses further up the page, so the two read as one page rather
          than two treatments.

          No aria-live: the frame changes on a timer, and a live region
          that announces itself every six seconds unprompted is a worse
          experience than none. The tab/tabpanel pairing already reports
          the change on the interactions a screen reader actually
          initiates. */}
      <div className="stage__meta">
        <p className="stage__cap">
          {/* keyed so React swaps the node rather than editing it in
              place, which is what lets the CSS fade run on every change
              instead of only the first */}
          <span key={i}>{cap}</span>
        </p>
        <span className="stage__idx" aria-hidden="true">
          <b>{pad(i + 1)}</b>
          <i>/</i>
          {pad(count)}
        </span>
      </div>

      <div
        className="stage__rail"
        role="tablist"
        aria-label="The office, frame by frame"
        onKeyDown={onKeyDown}
      >
        {/* The film's cell. A still would have to be pulled out of the
            video by hand and would then sit in the rail looking like an
            eleventh photograph of the office; a dark tile with a play
            mark says what it is at thumbnail size, which is the only size
            this is ever seen at. */}
        {film && (
          <button
            type="button"
            role="tab"
            id={tabId(0)}
            aria-controls={PANEL_ID}
            aria-selected={onFilm}
            aria-label={film.cap}
            tabIndex={onFilm ? 0 : -1}
            ref={(el) => { tabRefs.current[0] = el; }}
            className={onFilm ? "stage__thumb stage__thumb--film is-active" : "stage__thumb stage__thumb--film"}
            onClick={() => setI(0)}
            data-cursor={film.cap}
          >
            <span aria-hidden="true" />
          </button>
        )}

        {shots.map((s, n0) => {
          const n = film ? n0 + 1 : n0;
          return (
          <button
            key={s.src}
            type="button"
            role="tab"
            id={tabId(n)}
            aria-controls={PANEL_ID}
            aria-selected={n === i}
            aria-label={s.cap}
            tabIndex={n === i ? 0 : -1}
            ref={(el) => { tabRefs.current[n] = el; }}
            className={n === i ? "stage__thumb is-active" : "stage__thumb"}
            onClick={() => setI(n)}
            data-cursor={s.cap}
          >
            <img
              src={s.src}
              alt=""
              style={s.pos ? { objectPosition: s.pos } : undefined}
              loading="lazy"
              draggable={false}
            />
          </button>
          );
        })}
      </div>
    </div>
  );
}
