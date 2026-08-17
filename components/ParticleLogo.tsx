"use client";

import { useEffect, useRef } from "react";
import { BARS, BAR_STROKE, MARK, RING } from "@/lib/logo-paths";

/* The mark as suspended matter - see lib/particle-logo.ts for the thing
   itself. React's only jobs here are to hand the engine a box, to keep
   it out of the way until the section is nearly in view, and to make
   sure nothing survives an unmount. Every frame after that happens
   outside React entirely: the component never re-renders.

   The engine is imported lazily rather than at the top of the file, so
   Three.js is not in the page's first payload and is not fetched at all
   until somebody scrolls this far - the opening sequence has the main
   thread to itself.

   The flat mark below is what stands there in the meantime, and what
   stays if WebGL never arrives. It is drawn from the same geometry the
   particles are sampled from, at the same framing, so the handover
   reads as the logo condensing into powder rather than a swap. */
export default function ParticleLogo() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let stop: (() => void) | null = null;
    let dropped = false;
    let booted = false;

    const boot = () => {
      if (booted) return;
      booted = true;
      io.disconnect();
      import("@/lib/particle-logo")
        .then(({ initParticleLogo }) => {
          if (dropped) return;
          stop = initParticleLogo(el);
        })
        .catch((err) => {
          /* No engine, no canvas - the still below is the whole visual,
             which is the right outcome in production. In development it
             is worth saying so out loud: a silently swallowed failure
             here looks identical to the section simply not having
             scrolled into view yet. */
          if (process.env.NODE_ENV !== "production") console.error("[ParticleLogo]", err);
        });
    };

    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) boot(); },
      { rootMargin: "500px" });
    io.observe(el);

    return () => {
      dropped = true;
      io.disconnect();
      stop?.();
      stop = null;
    };
  }, []);

  return (
    <div className="plogo" ref={host} aria-hidden="true">
      {/* Square box centred on the mark's own centre of gravity, matching
          the world box the camera frames in lib/particle-logo.ts. */}
      <svg
        className="plogo__still"
        viewBox="42 46 316 316"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        {/* The glass and the light in it carry the colour; the three bars
            of the base do not, because they are the metal. Which is the
            same division the particles make - see FORM.tint in
            lib/particle-cloud.ts - so the crossfade does not change the
            colour of anything halfway through. */}
        <circle
          className="plogo__core"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r * 0.86}
          opacity="0.22"
        />
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path className="plogo__glass" d={RING} strokeWidth={MARK.stroke} />
          {BARS.map((d) => <path key={d} d={d} strokeWidth={BAR_STROKE} />)}
        </g>
      </svg>
    </div>
  );
}
