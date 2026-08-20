"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PINNED, PINNED_DWELL } from "@/lib/work-content";

/* ============================================================
   SECTION A - the pinned stage, and it is the whole opening screen.

   The client's reference is the Filmhunt detail screen, and the thing
   that makes it work is that it is one composition rather than a stack
   of sections: the frame fills the screen, and the title, the credits
   and the wall of other titles all sit on top of it. Nothing introduces
   it, because the picture is the introduction.

   So there is no copy hero above this. A reader arriving at /work sees a
   campaign frame first, at full height, and everything the page has to
   say about it is written over that frame.

   Layout inside the stage, matching the reference:

     left half    the genre row, the brand set large, the credits, the
                  synopsis, and the one action
     right half   "MORE PINNED WORK" - the poster wall, with its arrows

   ---- two things carried over deliberately, and one not ----

   Kept: the poster wall is portrait, and it is inside the frame rather
   than under it. Both matter - a landscape rail reads as a separate
   section no matter how close you push it, and the moment it is its own
   section the composition is gone.

   Not kept: the rating. Campaign metadata in its place, per the brief.
   There is no substitute score anywhere here.

   ---- why every frame is mounted ----

   ---- the dwell ----

   The stage advances itself on PINNED_DWELL and shows how long is left
   on the selected poster, because a rail that moves on its own with no
   warning reads as a page glitching rather than as a reel playing. The
   clock stops the moment the reader is involved - pointer over the
   stage, focus inside it, tab in the background - and any manual pick
   restarts it from zero rather than dropping the reader into the tail
   end of the previous frame's turn.

   ---- why every frame is mounted ----

   All five heroes are in the DOM and cross-faded, one at full opacity.
   Swapping a single <img>'s src decodes on click and flashes white on
   the frame the reader just asked for. Five large images is the cost;
   they are the five the agency most wants seen, and this is the first
   thing on the page.
   ============================================================ */
export default function WorkPinned() {
  const [i, setI] = useState(0);
  /* `held` is every reason the clock might be stopped at once, not a
     boolean, because they overlap: a reader can hover the stage, tab
     away and come back, and a single flag would resume the reel while
     the pointer is still sitting on it. */
  const [held, setHeld] = useState({ hover: false, focus: false, hidden: false });
  const [ticking, setTicking] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const active = PINNED[i];
  const paused = held.hover || held.focus || held.hidden;

  const go = useCallback((n: number) => {
    setI((prev) => (n + PINNED.length) % PINNED.length);
  }, []);

  /* Reduced motion turns the reel off rather than speeding it up or
     cross-fading it faster. Someone who has asked for less movement has
     not asked for the same movement on a different schedule, and the
     rail is fully operable by hand without it. */
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setTicking(!q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  /* A background tab should not burn through all five frames and land
     the reader back on a stage that has moved on without them. */
  useEffect(() => {
    const onVis = () => setHeld((h) => ({ ...h, hidden: document.hidden }));
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* `i` is in the deps on purpose: picking a poster by hand tears down
     the pending timer and starts a fresh full turn, so a manual choice
     is never cut short by whatever was left on the previous one. */
  useEffect(() => {
    if (!ticking || paused) return;
    const t = window.setTimeout(() => go(i + 1), PINNED_DWELL);
    return () => window.clearTimeout(t);
  }, [i, ticking, paused, go]);

  /* Arrow keys walk the wall once it has focus. Tabbing through five
     posters to reach the last one is not what anyone expects of a rail. */
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  };

  /* Keep the selected poster in view when the selection moves by keyboard
     or by the arrows - the wall scrolls on a narrow screen, and changing
     the frame to something the reader cannot see reads as a bug. */
  useEffect(() => {
    const card = railRef.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [i]);

  return (
    <section
      className="wk-stage"
      aria-label="Featured work"
      onPointerEnter={() => setHeld((h) => ({ ...h, hover: true }))}
      onPointerLeave={() => setHeld((h) => ({ ...h, hover: false }))}
      onFocusCapture={() => setHeld((h) => ({ ...h, focus: true }))}
      onBlurCapture={() => setHeld((h) => ({ ...h, focus: false }))}
    >
      {/* the frames, stacked */}
      {PINNED.map((c, n) => (
        <div
          className="wk-stage__frame"
          key={c.slug}
          data-on={n === i ? "" : undefined}
          aria-hidden={n === i ? undefined : "true"}
        >
          <img src={c.hero} alt="" />
        </div>
      ))}
      <span className="wk-stage__scrim" aria-hidden="true" />

      <div className="wrap wk-stage__grid">
        {/* ---- left: the title block ---- */}
        <div className="wk-lede">
          <ul className="wk-lede__tags">
            {active.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>

          {/* The brand is the headline - where the reference has the film
              title. The campaign's own name goes in the credits under it:
              "Netflix × MI" is what a reader recognises, and the title of
              the campaign is something they learn afterwards. */}
          <h1 className="wk-lede__brand">{active.brand}</h1>

          <div className="wk-lede__credits">
            <b>{active.year}</b>
            {active.title && (
              <span><i>Campaign:</i> {active.title}</span>
            )}
            {active.credits.map((c) => (
              <span key={c.label}><i>{c.label}:</i> {c.value}</span>
            ))}
          </div>

          <p className="wk-lede__line">{active.line}</p>

          <a className="wk-lede__go" href={`/work/${active.slug}`} data-magnetic data-cursor="Open">
            <span className="wk-lede__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            View case
          </a>
        </div>

        {/* ---- right: the poster wall ---- */}
        <div className="wk-also">
          <div className="wk-also__head">
            <span className="wk-also__label">More pinned work</span>
            <div className="wk-also__nav">
              <button type="button" onClick={() => go(i - 1)} aria-label="Previous case" data-cursor="Prev">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" onClick={() => go(i + 1)} aria-label="Next case" data-cursor="Next">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>

          <div
            className="wk-also__track"
            ref={railRef}
            role="listbox"
            aria-label="Pinned work"
            tabIndex={0}
            onKeyDown={onKey}
          >
            {PINNED.map((c, n) => (
              <button
                type="button"
                role="option"
                aria-selected={n === i}
                className={c.pending ? "wk-poster is-pending" : "wk-poster"}
                key={c.slug}
                onClick={() => setI(n)}
                data-cursor={c.brand}
              >
                <span className="wk-poster__shot">
                  <img src={c.thumb} alt="" loading="lazy" />
                  {/* The turn left on this frame. Keyed on `i` so React
                      replaces the node on every change and the animation
                      runs from zero - restarting a CSS animation on a
                      surviving element is otherwise a class-toggle and a
                      reflow read, and it drops a frame every time. */}
                  {n === i && ticking && (
                    <span
                      className="wk-poster__clock"
                      key={i}
                      aria-hidden="true"
                      style={{
                        animationDuration: `${PINNED_DWELL}ms`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  )}
                </span>
                <span className="wk-poster__name">{c.brand}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
