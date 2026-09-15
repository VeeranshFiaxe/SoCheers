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
   of the section - is left alone. */
export default function WhoBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

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
      <img src="/assets/art/team-960.jpg" alt="" loading="lazy" decoding="async" />
    </div>
  );
}
