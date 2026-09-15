"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { trackRect } from "@/lib/perf";
import { OVERTURE_DONE } from "@/lib/overture";

/* The team photo behind the bulb, kept on exactly the rectangle the hero's
   own photo occupies. The hero pin dissolves off the top of WHO WE ARE, so
   if the two pictures line up the dissolve reads as the type lifting away
   and the photo going soft, rather than one picture swapped for another.

   The hero's stage is scaled by GSAP and stays fixed while this section
   scrolls up under it, so the rectangle is copied from the live element -
   relative to the section, so once the pin lets go both simply scroll
   together. With no pin (no script, reduced motion) the CSS default - one
   screen at the top of the section - is left alone. See .who-bg in
   app/globals.css.

   Copied only while it can be seen, and never through layout. This used to
   run from page load, reading two boxes and writing a width, a height and
   a transform on every frame - through the whole opening, when the pin is
   opaque and this photo is underneath it - and the reads landed after GSAP
   had written that frame's styles, so each one was a forced layout and
   each write queued another. Now the boxes come off the start-of-frame
   read (trackRect, lib/perf.ts), the copy runs only once the pin has begun
   to dissolve (data-dissolve) or has finished (is-spent), and the stage's
   scale is carried as a scale: width and height are its layout size, which
   only a resize changes. */
export default function WhoBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  /* The pixelation: the photo is shrunk once to a thumbnail and that is
     what the <img> shows, scaled back up blocky (image-rendering in
     globals.css). One small draw at load, nothing per frame. The aspect is
     kept, so object-fit:cover still crops it exactly like the hero's. */
  useEffect(() => {
    const src = new Image();
    src.decoding = "async";
    src.onload = () => {
      const w = 160;
      const h = Math.max(1, Math.round((w * src.naturalHeight) / src.naturalWidth));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx || !img.current) return;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, w, h);
      img.current.src = c.toDataURL("image/png");
    };
    const load = () => { src.src = "/assets/art/team-960.jpg"; };
    /* not while the opening is playing over it - see html.sc-intro in
       globals.css */
    if (document.documentElement.classList.contains("sc-intro")) {
      document.addEventListener(OVERTURE_DONE, load, { once: true });
    } else {
      load();
    }
    return () => {
      src.onload = null;
      document.removeEventListener(OVERTURE_DONE, load);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const sec = el?.parentElement;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const pin = document.querySelector<HTMLElement>("[data-hero-pin]");
    const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
    if (!el || !sec || !hero || !pin || !stage) return;

    const root = document.documentElement;
    const stageBox = trackRect(stage);
    const secBox = trackRect(sec);

    /* the stage's own layout size - the box its transform is a scale of */
    let bw = 0;
    let bh = 0;
    const ro = new ResizeObserver(([e]) => {
      bw = e.contentRect.width;
      bh = e.contentRect.height;
    });
    ro.observe(stage);

    let near = false;
    /* what was last written, so a frame with nothing new writes nothing */
    let w = -1;
    let h = -1;
    let t = "";

    const tick = () => {
      const live = near && bw > 0 && bh > 0 &&
        root.classList.contains("is-pinned") &&
        (pin.hasAttribute("data-dissolve") || hero.classList.contains("is-spent"));
      stageBox.active(live);
      secBox.active(live);
      if (!live) return;

      const r = stageBox.read();
      if (!r.width || !r.height) return;
      const s = secBox.read();

      if (bw !== w || bh !== h) {
        w = bw;
        h = bh;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      }
      const next =
        `translate3d(${(r.left - s.left).toFixed(1)}px, ${(r.top - s.top).toFixed(1)}px, 0) ` +
        `scale(${(r.width / w).toFixed(4)}, ${(r.height / h).toFixed(4)})`;
      if (next !== t) {
        t = next;
        el.style.transform = next;
      }
    };
    gsap.ticker.add(tick);

    const io = new IntersectionObserver(
      ([e]) => { near = e.isIntersecting; },
      { rootMargin: "100% 0px" },
    );
    io.observe(sec);

    return () => {
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
      stageBox.release();
      secBox.release();
    };
  }, []);

  return (
    <div className="who-bg" ref={ref} aria-hidden="true">
      <img ref={img} src="/assets/art/team-960.jpg" alt="" loading="lazy" decoding="async" />
    </div>
  );
}
