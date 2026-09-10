"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { OVERTURE_WALLS } from "@/lib/content";
import { cueOverture, shouldRunOverture } from "@/lib/overture";
import SoCheersLockup from "./SoCheersLockup";

/* ============================================================
   THE LOADER

   Once per tab, at the front door, and never again: the same gate the
   overture runs on (lib/overture.ts), so the count and the sequence it
   hands over to are one opening rather than two things that can disagree.
   Coming back to the home page from /about does not replay it - by then
   the tab has seen the show, the assets are in cache, and a percentage
   counting up to a page that is already there is a delay dressed as work.

   And it is not dressed as work here either. The number is real: the
   overture's wall images and the hero artwork are fetched behind this
   black, and the count is the smaller of what has actually landed and the
   floor below - so the bar cannot finish before the room can be played,
   which is the whole reason to hold the screen at all. MIN keeps it from
   flashing past on a warm connection; MAX means a wall that will never
   arrive costs six seconds, not the site.
   ============================================================ */

/* Everything the opening sequence paints, in the order it needs them.

   A function rather than a constant because a phone does not paint the
   same pictures: some walls have a 9:16 stand-in that the <picture> in
   components/Overture.tsx will pick instead (see OVERTURE_WALLS in
   lib/content.ts). Preloading the landscape original in that case is a
   count that finishes against files the sequence never shows, and the one
   it does show still arriving mid-fall - which is the exact pop this door
   exists to prevent. Called from inside the effect, so it is only ever
   asked on the client. */
function assets() {
  const phone =
    typeof window !== "undefined" && window.matchMedia("(max-width:700px)").matches;
  return OVERTURE_WALLS.map((w) => (phone && w.m) || w.img);
}

const MIN = 1150;   // ms - the floor, so the count reads as a count
const MAX = 6000;   // ms - the ceiling, past which the door opens regardless

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* A tab that has already seen the show - or one that asked for reduced
       motion - gets no door at all. Not a fast one: none. The element is
       server-rendered so there is nothing to flash, and the overture is
       told to build straight away (it will dock the mark and hand back on
       the same frame). */
    if (!shouldRunOverture()) {
      el.style.display = "none";
      cueOverture();
      return;
    }

    const ASSETS = assets();
    const countEl = el.querySelector<HTMLElement>("#loaderCount");
    const total = ASSETS.length;
    let loaded = 0;
    let done = false;

    /* Held rather than left to the garbage collector on purpose: an Image
       with no references can be dropped mid-flight, and the point of this
       is the browser cache entry at the end of it. */
    const pending = ASSETS.map((src) => {
      const im = new Image();
      const tick = () => { loaded += 1; };
      im.onload = tick;
      im.onerror = tick;          // a missing wall must not hold the door
      im.src = src;
      return im;
    });

    const started = performance.now();
    const state = { v: 0 };

    const finish = () => {
      if (done) return;
      done = true;
      gsap.ticker.remove(chase);
      if (countEl) countEl.textContent = "100";

      /* The sheet comes up, the cue goes out under it, and the loader
         fades off the front of a room that is already there. Nothing is
         ever seen mid-build: the overture takes the attribute off and
         starts its own boot behind this accent. */
      const tl = gsap.timeline();
      tl.to(el.querySelector(".loader__sheet"), {
        scaleY: 1, duration: 0.5, ease: "power4.in", transformOrigin: "bottom",
      }, 0);
      tl.to(el.querySelector(".loader__inner"), { autoAlpha: 0, duration: 0.28 }, 0.05);
      tl.add(cueOverture);
      tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" });
      tl.set(el, { display: "none" });
    };

    /* One chase, on the ticker, toward whichever is further behind: the
       assets or the clock. Eased rather than stepped so eight files do not
       read as eight jumps. */
    const chase = () => {
      const elapsed = performance.now() - started;
      const target = elapsed > MAX
        ? 100
        : Math.min(loaded / total, elapsed / MIN) * 100;

      state.v += (target - state.v) * 0.12;
      if (countEl) countEl.textContent = String(Math.round(state.v));
      if (target >= 100 && state.v > 99.3) finish();
    };
    gsap.ticker.add(chase);

    return () => {
      gsap.ticker.remove(chase);
      pending.forEach((im) => { im.onload = null; im.onerror = null; });
    };
  }, []);

  return (
    <div className="loader" id="loader" ref={root} aria-hidden="true">
      <div className="loader__inner">
        <SoCheersLockup className="loader__mark" />
        <div className="loader__count">
          <span id="loaderCount">0</span>
          <i>%</i>
        </div>
        <div className="loader__tag">MAKING MORE HAPPEN</div>
      </div>
      <div className="loader__sheet" />
    </div>
  );
}
