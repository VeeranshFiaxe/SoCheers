"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpaceShot } from "@/lib/about-content";

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

export default function AboutStage({ shots }: { shots: SpaceShot[] }) {
  const [i, setI] = useState(0);

  /* Three separate reasons to hold: the pointer is on it, something
     inside it has focus, or the section is off screen. Kept as one flag
     each rather than a single counter so no path can leave it stuck
     paused - releasing hover cannot accidentally cancel the off-screen
     hold, and vice versa. */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  /* Read in an effect, not at render: matchMedia does not exist on the
     server, and reading it during render would hand back a first paint
     that disagrees with the markup Next sent. */
  const [reduced, setReduced] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
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

  const paused = hovered || focused || !onScreen || reduced;

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
    if (paused) return;
    const t = window.setTimeout(
      () => setI((n) => (n + 1) % shots.length),
      DWELL_MS,
    );
    return () => window.clearTimeout(t);
  }, [i, paused, shots.length]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const last = shots.length - 1;
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
    [i, shots.length],
  );

  useEffect(() => {
    if (!viaKey.current) return;
    viaKey.current = false;
    tabRefs.current[i]?.focus();
  }, [i]);

  const shot = shots[i];

  return (
    <div
      className="stage"
      ref={rootRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
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
        {shots.map((s, n) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={n === i ? "is-active" : undefined}
            style={s.pos ? { objectPosition: s.pos } : undefined}
            /* only the visible frame is exposed - otherwise the section
               reads out as ten stacked photographs */
            aria-hidden={n !== i}
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
        {!reduced && (
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
          <span key={i}>{shot.cap}</span>
        </p>
        <span className="stage__idx" aria-hidden="true">
          <b>{pad(i + 1)}</b>
          <i>/</i>
          {pad(shots.length)}
        </span>
      </div>

      <div
        className="stage__rail"
        role="tablist"
        aria-label="The office, frame by frame"
        onKeyDown={onKeyDown}
      >
        {shots.map((s, n) => (
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
        ))}
      </div>
    </div>
  );
}
