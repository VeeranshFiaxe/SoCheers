"use client";

import Link from "@/components/IntentLink";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BARS, BAR_STROKE, LOGO_DISC, RING } from "@/lib/logo-paths";

/* ============================================================
   THE 404 - the one room on the site with the light out.

   The "0" is the mark itself, dead. There is a cord beside it and pulling
   it does exactly what pulling a cord in an empty room does: the light
   comes on, there is still nothing there, and it goes back out. The line
   under it keeps score. Pull it enough times and the site gives up and
   leaves it on.
   ============================================================ */

type Lamp = "off" | "on" | "dying";

/* one line per pull; the last one is where it stops */
const LINES = [
  "Pull the cord. Go on.",
  "Nope. Still no page here.",
  "Brighter doesn't make it exist.",
  "We checked behind the sofa too.",
  "It's not in the other room either.",
  "Okay, you're committed. We like that.",
  "Fine. It stays on. Still a 404, though.",
];
const STAYS_ON = LINES.length - 1;

/* how far the knob can be dragged, and how far counts as a pull */
const MAX_DRAG = 90;
const TRIGGER = 36;

function Bulb() {
  return (
    <svg className="nf__bulb" viewBox="80 60 240 272" aria-hidden="true" focusable="false">
      <circle className="nf__disc" cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} />
      <path className="nf__ink" d={RING} strokeWidth={BAR_STROKE} />
      {BARS.map((d) => (
        <path key={d} className="nf__ink" d={d} strokeWidth={BAR_STROKE} />
      ))}
    </svg>
  );
}

export default function NotFound() {
  /* The page is prerendered once (out/404.html) and served for every
     missing path, so the path it was built at is never the one asked
     for - rendering it straight away was a hydration mismatch. Filled
     in after mount instead. */
  const livePath = usePathname();
  const [pathname, setPathname] = useState("");
  useEffect(() => setPathname(livePath), [livePath]);
  const [lamp, setLamp] = useState<Lamp>("off");
  const [pulls, setPulls] = useState(0);
  const [drag, setDrag] = useState(0);
  const [swing, setSwing] = useState(0);
  const timers = useRef<number[]>([]);
  const start = useRef<number | null>(null);
  const moved = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const pull = () => {
    setSwing((n) => n + 1);
    if (pulls >= STAYS_ON) return;           // on for good already
    const next = pulls + 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPulls(next);
    setLamp("on");
    if (next >= STAYS_ON) return;
    later(() => setLamp("dying"), 1100);
    later(() => setLamp("off"), 1800);
  };

  /* The knob drags down and springs back; past TRIGGER is a pull. A plain
     click (or Enter / Space - it is a button) is one too. */
  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    start.current = e.clientY;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const d = Math.max(0, Math.min(MAX_DRAG, e.clientY - start.current));
    if (d > 4) moved.current = true;
    setDrag(d);
  };
  const onUp = () => {
    if (start.current === null) return;
    const pulled = moved.current && drag >= TRIGGER;
    start.current = null;
    setDrag(0);
    if (pulled) pull();
  };
  const onClick = () => {
    /* a drag already decided for itself on the way up */
    if (moved.current) { moved.current = false; return; }
    pull();
  };

  return (
    <main className="nf" data-lamp={lamp} data-ever={pulls > 0 ? "" : undefined}>
      <div className="nf__glow" aria-hidden="true" />

      <section className="nf__stage">
        <p className="nf__eyebrow">
          Error 404 <span aria-hidden="true">·</span> Room not found
        </p>

        <div className="nf__digits">
          <h1 className="nf__num" aria-label="404">
            <span aria-hidden="true">4</span>
            <span className="nf__zero" aria-hidden="true"><Bulb /></span>
            <span aria-hidden="true">4</span>
          </h1>

          <div
            className="nf__cord"
            /* two identical swings, alternated, so each pull restarts the
               animation without remounting the button under the finger
               (or the keyboard focus) */
            data-swing={swing === 0 ? undefined : swing % 2 ? "a" : "b"}
            style={{ "--drag": `${drag}px` } as React.CSSProperties}
          >
            <span className="nf__rope" aria-hidden="true" />
            <button
              type="button"
              className="nf__knob"
              data-cursor="Pull"
              aria-label="Pull the light cord"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onClick={onClick}
            />
          </div>
        </div>

        <p className="nf__line" aria-live="polite" key={pulls}>{LINES[pulls]}</p>

        <h2 className="nf__head">This room&rsquo;s empty.</h2>
        <p className="nf__body">
          <code className="nf__path">{pathname || "This page"}</code> moved out, never moved in, or
          was a typo. Happens to the best of us. The rest of the house is open.
        </p>

        <nav className="nf__ways" aria-label="Ways out">
          <Link href="/" className="nf__way nf__way--main" data-cursor="Home">
            Take me home
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="/work" className="nf__way">See the work</Link>
          <Link href="/contact" className="nf__way">Let&rsquo;s chat</Link>
        </nav>
      </section>
    </main>
  );
}
