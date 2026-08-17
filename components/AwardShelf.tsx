"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Award } from "@/lib/content";

/* ============================================================
   RECOGNITION, as a catalogue rather than a ticker.

   What was here before was a single-line marquee of show names in
   outlined type. Two sections above it, the client wall runs three
   marquees of brand names in solid type - so the page ended on what
   looked like a fourth row of the same wall, and the awards read as more
   logos rather than as work that won something.

   So: an index on the left, one frame on the right. The index carries a
   thumbnail per show, which is the part that makes it a catalogue and not
   another list - you can see there is *work* behind each line before you
   pick it. The frame never moves; only the picture inside it changes,
   the same device the About page's space uses (components/AboutStage.tsx),
   which is deliberate - two sections of one site, not two treatments.

   The index is the whole navigation. There is no second thumbnail rail
   under the frame and no prev/next pair: one control for one job.
   ============================================================ */

/* How long a show holds before the next one comes up. Slower than the
   About stage's rail because there is reading to do on the left - the
   picture is the second thing the eye goes to here, not the first. */
const DWELL_MS = 5200;

const PANEL_ID = "rec-frame";
const tabId = (n: number) => `rec-tab-${n}`;
const pad = (n: number) => String(n).padStart(2, "0");

/* Where the still comes out of.

   The show name is cut in two at one of its own word gaps, and the
   picture grows out of that gap - so it arrives from inside the type
   rather than sitting next to it as a bullet would.

   Which gap: the one that leaves the two halves closest to the same
   length, measured in characters rather than in words. THE DRUM GLOBAL
   splits after DRUM (8 against 6) and not after THE (3 against 12);
   CAMPAIGN SOUTH ASIA splits after CAMPAIGN (8 against 10) and not after
   SOUTH (14 against 4). Word count alone gets both of those wrong,
   because it cannot tell a three-letter word from a nine-letter one, and
   the opening it makes then reads as off-centre.

   A name with no space in it keeps the whole word on the left and the
   picture comes out of the end of it - there is no gap to open. */
function splitName(name: string): [string, string] {
  const words = name.split(" ");
  if (words.length < 2) return [name, ""];
  let best = 1;
  let bestGap = Infinity;
  for (let at = 1; at < words.length; at++) {
    const left = words.slice(0, at).join(" ").length;
    const gap = Math.abs(left - (name.length - left - 1));
    if (gap < bestGap) { bestGap = gap; best = at; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export default function AwardShelf({ awards }: { awards: Award[] }) {
  const [i, setI] = useState(0);

  /* Pointing at a row shows that row's still, and holds the turnover for
     as long as you are pointing at it. Which means hover is not a pause
     flag with a separate meaning any more - it IS the selection, just a
     provisional one that gives itself back the moment you leave. Null
     when nothing is being pointed at, and then the frame is the timer's.

     Nothing else in the section holds anything: pointing at the frame,
     the title or the gaps between the rows leaves the clock alone. */
  const [preview, setPreview] = useState<number | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  /* Read in an effect, never during render: matchMedia does not exist on
     the server, and reading it while rendering hands back a first paint
     that disagrees with the markup Next already sent. */
  const [reduced, setReduced] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  /* Roving tabindex over the index: one tab stop for the whole list, and
     the arrow keys move inside it. Refs so a keyboard pick can actually
     move focus onto the row it selected. */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /* Focus is only forced when the change came from a key - never from a
     click, the autoplay tick, or first paint. Stealing focus on mount
     would jump the page down here on load. */
  const viaKey = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = preview !== null || !onScreen || reduced;
  /* What the frame is actually showing: the row under the pointer if
     there is one, otherwise wherever the timer has got to. */
  const shown = preview ?? i;

  /* setTimeout keyed on `i`, not a long-lived setInterval: an interval
     keeps its own phase, so picking a show a moment before the next tick
     would get overwritten immediately.

     The hold left over from the last run is carried in a ref rather than
     restarted from DWELL_MS every time this effect re-runs, and that is
     the whole fix for the frame that used to sit on a full progress bar
     doing nothing. The bar is a CSS animation that pauses and resumes
     where it stopped; the timer used to throw its remaining time away and
     start a fresh five seconds on every unpause. So a hover of two
     seconds put them four seconds out of step, and the bar finished long
     before the timeout it was supposed to be reporting. Now both sides
     keep the same remainder, so the picture always changes on the frame
     the bar fills.

     cycleOf guards the reset: the remainder belongs to one index, and it
     only goes back to a full DWELL_MS when the index itself moves on -
     never when the effect re-runs because the hold came or went. */
  const remaining = useRef(DWELL_MS);
  const cycleOf = useRef(0);

  useEffect(() => {
    if (cycleOf.current !== i) {
      cycleOf.current = i;
      remaining.current = DWELL_MS;
    }
    if (paused) return;
    const started = performance.now();
    const t = window.setTimeout(
      () => setI((n) => (n + 1) % awards.length),
      remaining.current,
    );
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [i, paused, awards.length]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const last = awards.length - 1;
      let next: number | null = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = last;
      if (next === null) return;
      e.preventDefault();
      viaKey.current = true;
      setI(next);
    },
    [i, awards.length],
  );

  useEffect(() => {
    if (!viaKey.current) return;
    viaKey.current = false;
    tabRefs.current[i]?.focus();
  }, [i]);

  const current = awards[shown];

  return (
    <div className="rec" ref={rootRef}>
      {/* ---- the index ----
          The leave handler is on the list, not on each row: moving from
          one row to the next fires the new row's enter before the old
          row's leave, and a per-row leave would then hand the frame back
          to the timer for a frame in the middle of a drag down the list.
          One leave, at the edge of the whole list, cannot flicker. */}
      <div
        className="rec__index"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Shows we have won at"
        onKeyDown={onKeyDown}
        onPointerLeave={() => setPreview(null)}
        onBlurCapture={() => setPreview(null)}
      >
        {awards.map((a, n) => {
          const [head, tail] = splitName(a.name);
          return (
          <button
            key={a.name}
            type="button"
            role="tab"
            id={tabId(n)}
            aria-controls={PANEL_ID}
            /* aria-selected follows the real selection, not the pointer:
               hover is a look, not a choice, and it is not something a
               screen reader is ever going to be doing. Keyboard focus
               does preview, but the arrow keys move `i` with it, so for
               anyone on a keyboard the two never disagree. */
            aria-selected={n === i}
            tabIndex={n === i ? 0 : -1}
            ref={(el) => { tabRefs.current[n] = el; }}
            className={n === shown ? "rec__row is-active" : "rec__row"}
            onClick={() => setI(n)}
            onPointerEnter={() => setPreview(n)}
            onFocus={() => setPreview(n)}
            data-cursor={a.year}
          >
            {/* The name, cut in two at its most central word gap, with
                the still growing out of the opening (see splitName above,
                and .rec__slot in globals.css for the mechanics). The row
                that is being shown is the row that is open - which means
                the index opens and closes in step with the frame on its
                own as well, not only under the pointer, and you can see
                at a glance which line the picture belongs to. */}
            <span className="rec__name">
              <span className="rec__seg">{head}</span>
              <span className="rec__slot" aria-hidden="true">
                <img src={a.img} alt="" loading="lazy" draggable={false} />
              </span>
              {tail && <span className="rec__seg">{tail}</span>}
            </span>
            <span className="rec__yr">{a.year}</span>
          </button>
          );
        })}
      </div>

      {/* ---- the frame ---- */}
      <div className="rec__view">
        {/* Every still is mounted and stacked; the active one is simply
            the one at full opacity. Crossfading two decoded images is
            instant, where swapping a single src would blank the frame for
            as long as the next file takes to arrive. */}
        <div
          className="rec__frame"
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={tabId(shown)}
          data-clip
        >
          {awards.map((a, n) => (
            <img
              key={a.name}
              src={a.img}
              alt={n === shown ? a.alt : ""}
              className={n === shown ? "is-active" : undefined}
              aria-hidden={n !== shown}
              loading={n === 0 ? undefined : "lazy"}
              draggable={false}
            />
          ))}

          {/* The hold running out. Keyed on `i` and not on `shown`: this
              reports the timer, and the timer is still sat on its own
              show while you are looking at another one. So it holds where
              it stopped for the length of a hover and picks up from there
              - it does not restart because you glanced down the list.

              It does snap back to empty when `i` itself moves, because
              React replaces the node: a pick is a fresh hold, and the bar
              and the timeout are started by the same render. */}
          {!reduced && (
            <span
              className="rec__prog"
              key={i}
              aria-hidden="true"
              style={{
                animationDuration: `${DWELL_MS}ms`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          )}
        </div>

        {/* Citation and counter at the two ends of one hairline. No
            aria-live: the frame turns over on a timer, and a region that
            announces itself every five seconds unprompted is worse than
            none. The tab/tabpanel pairing already reports the changes a
            screen reader actually asks for. */}
        <div className="rec__meta">
          <p className="rec__cap">
            {/* keyed so React swaps the node instead of editing it, which
                is what lets the fade run on every change and not just on
                first paint */}
            <span key={shown}>{current.category}</span>
          </p>
          <span className="rec__idx" aria-hidden="true">
            <b>{pad(shown + 1)}</b>
            <i>/</i>
            {pad(awards.length)}
          </span>
        </div>
      </div>
    </div>
  );
}
