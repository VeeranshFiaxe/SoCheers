"use client";

import { useEffect, useRef } from "react";

/* The team photo behind the bulb, kept on exactly the rectangle the hero's
   own photo occupies. The hero pin dissolves off the top of WHO WE ARE, so
   if the two pictures line up the dissolve reads as the type lifting away
   and the photo going soft, rather than one picture swapped for another.

   The hero's stage is scaled by GSAP and stays fixed while this section
   scrolls up under it, so the rectangle is copied from the live element
   every frame the section is anywhere near the screen - relative to the
   section, so once the pin lets go both simply scroll together. With no
   pin (no script, reduced motion) the CSS default - one screen at the top
   of the section - is left alone. See .who-bg in app/globals.css. */
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
    src.src = "/assets/art/team-960.jpg";
    return () => { src.onload = null; };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const sec = el?.parentElement;
    const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
    if (!el || !sec || !stage) return;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!document.documentElement.classList.contains("is-pinned")) return;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = sec.getBoundingClientRect();
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
      el.style.transform = `translate3d(${r.left - s.left}px, ${r.top - s.top}px, 0)`;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(raf);
        if (e.isIntersecting) tick();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(sec);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="who-bg" ref={ref} aria-hidden="true">
      <img ref={img} src="/assets/art/team-960.jpg" alt="" loading="lazy" decoding="async" />
    </div>
  );
}
