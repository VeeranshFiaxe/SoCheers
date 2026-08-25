"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PINNED, PINNED_DWELL } from "@/lib/work-content";
import Link from "next/link";

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

     left half    the small row, the client's headline, the line under
                  it, and the one action
     right half   "MORE PINNED WORK" - the poster wall, with its arrows

   ---- two things carried over deliberately, and one not ----

   Kept: the poster wall is inside the frame rather than under it. That
   one matters - a rail under the picture reads as a separate section no
   matter how close you push it, and the moment it is its own section
   the composition is gone.

   Not kept as drawn: the reference's posters are portrait and these
   were too, until the real thumbnails arrived. All five are 16:9 and
   there is no second crop of any of them, so the wall is 16:9 - a
   centre-cut 2:3 poster of a wide still loses the brand out of both
   sides on most of them.

   Not kept: the rating. Campaign metadata in its place, per the brief.
   There is no substitute score anywhere here.

   ---- why every frame is mounted ----

   ---- the dwell ----

   The stage advances itself on PINNED_DWELL and shows how long is left
   on the selected poster, because a rail that moves on its own with no
   warning reads as a page glitching rather than as a reel playing. The
   clock stops when the reader is involved - pointer over the poster
   wall, focus inside the stage, tab in the background - and any manual
   pick restarts it from zero rather than dropping the reader into the
   tail end of the previous frame's turn.

   The pointer hold is on the wall and not on the stage, which is the
   whole opening screen: a section-wide hover meant the reel was paused
   for anyone whose cursor was anywhere on the page, which on a desktop
   is everyone, all the time. It never advanced. Hovering the wall is a
   reader about to pick a frame; a cursor resting over the picture is
   just a cursor.

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
  /* Whether the film on the current frame is running. It is a plain
     boolean rather than a per-slug map because only one frame is ever
     up: moving the stage stops the film, which is the effect below and
     the only sane reading of "play it in the tile" - a film still
     playing behind the frame that replaced it is a sound with no
     picture. */
  const [rolling, setRolling] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const active = PINNED[i];
  /* A film that is playing holds the reel open on its own account. The
     dwell would otherwise move the stage on five seconds into a
     two-minute film. */
  const paused = held.hover || held.focus || held.hidden || rolling;

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

  /* Leaving the frame stops the film. See `rolling` above. */
  useEffect(() => { setRolling(false); }, [i]);

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
      /* `is-rolling` takes the writing and the poster wall off the
         frame while the film is up. They do not unmount - the reader is
         two clicks from wanting them back, and a stage that rebuilds
         itself around every play is a stage that jumps. */
      className={rolling ? "wk-stage is-rolling" : "wk-stage"}
      aria-label="Featured work"
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

      {/* ---- the film, in the frame ----

          The client's instruction, and it is a specific one: the film
          plays where the still already is. No lightbox, no fullscreen,
          no navigation - the picture the reader is looking at starts
          moving. So this sits in the same stacking slot as the frames,
          above them and below the scrim, and it exists only while it is
          playing: stopping it unmounts the element rather than pausing
          it, which is also what frees the network for the rest of the
          page.

          `controls` is on because a two-minute film a reader cannot
          scrub is a film they will not finish, and the whole composition
          stays put underneath it. */}
      {rolling && active.link.kind === "film" && (
        <div className="wk-stage__film">
          <video
            src={active.link.src}
            poster={active.hero}
            controls
            autoPlay
            playsInline
            onEnded={() => setRolling(false)}
          />
          <button
            type="button"
            className="wk-stage__close"
            onClick={() => setRolling(false)}
            aria-label="Close the film"
            data-cursor="Close"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}

      {/* The scrim is what the type stands on, so it goes when the film
          does not need to be read over. */}
      {!rolling && <span className="wk-stage__scrim" aria-hidden="true" />}

      <div className="wrap wk-stage__grid">
        {/* ---- left: the title block ---- */}
        <div className="wk-lede">
          <ul className="wk-lede__tags">
            {active.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>

          {/* The client's own headline, and it is the display line -
              where the reference has the film's title. It replaced the
              brand set large, which was the right call when the copy
              did not exist yet and the wrong one the moment it did:
              "NETFLIX X MI X SOCheers" is already the row above, and a
              headline that asks the reader a question is a better first
              thing to read than a name they can see in the picture.

              Verbatim, in the case the client set it. Nothing here
              title-cases or trims - see the note over PINNED. */}
          <h1 className="wk-lede__head">{active.headline}</h1>

          <p className="wk-lede__line">{active.line}</p>

          {/* ---- the one action, and it is a different action per piece ----

              Three kinds, switched on rather than inferred - see
              PinnedLink in lib/work-content.ts. What they have in
              common is that there is exactly one of them and it says
              what it does: "Play the film" plays a film, "View on
              Instagram" leaves the site and says so. A reader should
              never have to click to find out which of those is about
              to happen. */}
          {active.link.kind === "film" && (
            <button
              type="button"
              className="wk-lede__go"
              onClick={() => setRolling(true)}
              data-magnetic
              data-cursor="Play"
            >
              <span className="wk-lede__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              Play the film
            </button>
          )}

          {/* rel is not boilerplate here: `noopener` is what stops the
              opened tab from reaching back into this one through
              window.opener, and it costs nothing. */}
          {active.link.kind === "external" && (
            <a
              className="wk-lede__go"
              href={active.link.href}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              data-cursor="Open"
            >
              <span className="wk-lede__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 17L17 7M9 7h8v8" /></svg>
              </span>
              View
            </a>
          )}

          {active.link.kind === "case" && (
            <Link className="wk-lede__go" href={`/work/${active.link.slug}`} prefetch data-magnetic data-cursor="Open">
              <span className="wk-lede__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              View case
            </Link>
          )}
        </div>

        {/* ---- right: the poster wall ---- */}
        <div
          className="wk-also"
          onPointerEnter={() => setHeld((h) => ({ ...h, hover: true }))}
          onPointerLeave={() => setHeld((h) => ({ ...h, hover: false }))}
        >
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
                /* Picking a frame selects it. Picking the frame that is
                   already up opens it - the film plays, an Instagram
                   piece goes to Instagram. The client asked for the
                   thumbnail itself to be the way in, and a reader who
                   clicks the same tile twice is asking for something to
                   happen.

                   The new tab is opened with `noopener` for the same
                   reason the anchor beside it carries rel="noopener": a
                   tab opened without it can reach back into this one
                   through window.opener. */
                onClick={() => {
                  if (n !== i) { setI(n); return; }
                  if (c.link.kind === "film") setRolling(true);
                  else if (c.link.kind === "external") window.open(c.link.href, "_blank", "noopener,noreferrer");
                }}
                data-cursor={n === i ? (c.link.kind === "film" ? "Play" : "View") : c.brand}
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
