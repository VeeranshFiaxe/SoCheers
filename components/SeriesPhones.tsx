"use client";

import { useEffect, useRef } from "react";
import { PHONES, type Phone } from "@/lib/series-content";

/* ============================================================
   THE FIVE HANDSETS - section 9 of /series.

   The showreel, held in the frame the work is actually watched in.
   Five iPhones on an arc, each running one piece, laid out so the
   middle one is nearest and the outers fall away from it.

   ---- why this is the one client component on the route ----

   /series has no scroll mechanics: initSeries() is not mounted and
   nothing else on the page carries [data-reveal]. This section is the
   exception the brief asks for by name - "rapid visual sequence" - and
   an arc of handsets that does not answer the scroll is a photograph of
   five phones.

   The motion is one number. A rAF-throttled scroll handler writes the
   rig's progress through the viewport onto it as --p, running 0 as the
   rig's top reaches the bottom of the screen through 1 as its bottom
   leaves the top, and --c, the same thing centred (-1 .. 1). A separate
   var --e holds the entrance, which runs once the first time the rig is
   seen and then stays. Every transform in the CSS is a function of
   those and of --o, a handset's own signed distance from the middle of
   the five. No per-frame JavaScript touches any phone.

   A fourth var, --mx, is the pointer's position across the rig, which
   leans the whole arc toward the cursor. Only ever set on a device with
   a real pointer.

   Under prefers-reduced-motion the handler never starts, the vars stay
   at their rest values, and the arc renders as a still composition -
   which it is built to be, rather than collapsing into a stack.

   ---- the screens ----

   There is no series footage in the tree yet. A handset without `film`
   holds its poster still under a slow sweep, and that sweep is the only
   thing saying the cut is not here - no badge, no grey box, no word
   "placeholder" set in type. The day a vertical cut lands, put its path
   in `film` on that entry in lib/series-content.ts: the <video> takes
   over, the sweep goes, and nothing else changes.
   ============================================================ */

export default function SeriesPhones() {
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rig.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* The rig renders ARRIVED - --e is 1 in the stylesheet - and this
       is what puts it back to 0 so the entrance has somewhere to come
       from. That order is on purpose: the section is a long way below
       the fold, so nobody sees this happen at hydration, and a reader
       whose JavaScript never runs gets the finished composition rather
       than five invisible phones.

       The latch is one-way. Once the rig has been seen it stays
       arrived, so scrolling back up does not re-play it. */
    el.style.setProperty("--e", "0");

    let entered = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !entered) {
            entered = true;
            el.style.setProperty("--e", "1");
            io.disconnect();
          }
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);

    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - r.top) / (vh + r.height);
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--c", (p * 2 - 1).toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /* the pointer lean, on pointing devices only */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / (r.width || 1);
      el.style.setProperty("--mx", (x * 2 - 1).toFixed(3));
    };
    const onLeave = () => el.style.setProperty("--mx", "0");
    if (fine.matches) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const mid = (PHONES.length - 1) / 2;

  return (
    <div className="st-rig" ref={rig}>
      <ul className="st-rig__arc">
        {PHONES.map((p, i) => (
          <li
            className="st-hs"
            key={p.id}
            style={
              {
                "--i": i,
                "--o": i - mid,
                "--a": Math.abs(i - mid),
              } as React.CSSProperties
            }
          >
            <Handset phone={p} />
            <span className="st-hs__cap">
              <b>{p.label}</b>
              <i>{p.note}</i>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------
   ONE HANDSET.

   Built rather than photographed: the frame, the band, the four
   buttons, the island and the home indicator are all elements, so the
   whole thing scales off one width and stays sharp at any size - which
   a PNG of a phone does not.

   Everything inside is decoration and hidden from the accessibility
   tree. The piece a handset is holding is named once, in the caption
   underneath it.
   ------------------------------------------------------------------ */
function Handset({ phone }: { phone: Phone }) {
  return (
    <span className="st-ph" aria-hidden="true">
      {/* the polished band around the titanium - what catches the light
          at the edges and reads as thickness */}
      <span className="st-ph__band" />

      <span className="st-ph__btn st-ph__btn--mute" />
      <span className="st-ph__btn st-ph__btn--up" />
      <span className="st-ph__btn st-ph__btn--dn" />
      <span className="st-ph__btn st-ph__btn--pwr" />

      <span className="st-ph__screen">
        {phone.film ? (
          <video
            className="st-ph__media"
            src={phone.film}
            poster={phone.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
          />
        ) : (
          <>
            <img
              className="st-ph__media"
              src={phone.poster}
              alt=""
              loading="lazy"
              decoding="async"
            />
            {/* the only thing that says the cut is not here yet */}
            <span className="st-ph__wait" />
          </>
        )}

        {/* the vertical player's own furniture, kept to the two things
            every one of them has and to no platform's marks: a caption
            block and a progress hairline */}
        <span className="st-ph__ui">
          <span className="st-ph__cap">
            <em>{phone.label}</em>
            <i>{phone.note}</i>
          </span>
          <span className="st-ph__bar">
            <span />
          </span>
        </span>

        <span className="st-ph__status">
          <span className="st-ph__clock">{phone.clock}</span>
          <span className="st-ph__sys">
            <svg viewBox="0 0 18 12" width="15" height="10" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="4.5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="9" y="3" width="3" height="9" rx="1" />
              <rect x="13.5" y="0.5" width="3" height="11.5" rx="1" opacity=".4" />
            </svg>
            <svg viewBox="0 0 16 12" width="14" height="10" fill="currentColor">
              <path d="M8 10.8 6.1 8.9a2.7 2.7 0 0 1 3.8 0Z" />
              <path
                d="M3.4 6.1a6.5 6.5 0 0 1 9.2 0"
                fill="none"
                strokeWidth="1.5"
                stroke="currentColor"
                strokeLinecap="round"
              />
              <path
                d="M1 3.4a10 10 0 0 1 14 0"
                fill="none"
                strokeWidth="1.5"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
            <span className="st-ph__batt">
              <i />
            </span>
          </span>
        </span>

        {/* the island, over the picture and under the glass */}
        <span className="st-ph__island">
          <i />
        </span>

        {/* one raking highlight across the whole face */}
        <span className="st-ph__glass" />

        <span className="st-ph__home" />
      </span>
    </span>
  );
}
