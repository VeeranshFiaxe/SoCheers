import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   THE SERIES PAGE's own scroll work.

   initSite() already does the heavy lifting on this page - Lenis, the
   cursor, the split-line headings, the reveals. What is left is the two
   things that are specific to a page whose whole argument is that it
   holds you: the frames have to move under their type, and the reader
   has to be able to see how much of the episode is left.

   Everything here guards on an empty selection, so the same function is
   safe on the treatment that draws no pictures at all.
   ============================================================ */

export function initSeries(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = gsap.context(() => {
    /* ---- 1. the frames drift under their type ----

       A slow counter-scroll on the picture inside a box that is already
       overflow:hidden. The picture is drawn 116% tall (see .sbeat__art img
       in series.css) precisely so this has somewhere to travel to without
       ever showing an edge - the 8% each way below is half of that
       overhang and the arithmetic is not a coincidence.

       yPercent rather than top/translate on the element itself: the
       reveals from initSite() are already writing transforms on the type
       beside it, and two owners on one transform is the bug that ends up
       looking like jitter on a slow machine. */
    if (!reduced) {
      gsap.utils.toArray<HTMLElement>("[data-sbeat-art]").forEach((art) => {
        const img = art.querySelector<HTMLElement>("[data-sbeat-img]");
        if (!img) return;
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: art,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    }

    /* ---- 2. the episode rail ----

       A page that argues people finish things they can see the end of
       should not hide its own length. The rail is a hairline down the
       left edge with a fill and a running count.

       Driven off one ScrollTrigger over the whole story rather than one
       per beat: twelve triggers each writing the same two nodes is twelve
       chances for them to disagree about which beat is current at a
       boundary. One trigger, one number, no disagreement.

       The count is written only when it changes. `onUpdate` fires on
       every scroll frame and textContent is a layout write; at sixty
       frames a second that is the most expensive thing on an otherwise
       static page, for a number that changes twelve times in total. */
    const story = document.querySelector<HTMLElement>("[data-s-story]");
    const fill = document.querySelector<HTMLElement>("[data-s-fill]");
    const num = document.querySelector<HTMLElement>("[data-s-num]");
    const beats = gsap.utils.toArray<HTMLElement>(".sbeat");

    if (story && beats.length) {
      let shown = -1;
      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (fill) gsap.set(fill, { scaleY: self.progress });

          /* Which beat is under the middle of the screen. Read off the
             live rects rather than off progress: the beats are wildly
             different heights - a held frame is a full screen, a stat is
             a third of one - so progress is not proportional to index and
             mapping one onto the other would run the count ahead of the
             page on the short beats. */
          const mid = window.innerHeight / 2;
          let idx = 0;
          for (let i = 0; i < beats.length; i++) {
            if (beats[i].getBoundingClientRect().top <= mid) idx = i;
          }
          if (idx !== shown && num) {
            shown = idx;
            num.textContent = String(idx + 1).padStart(2, "0");
          }
        },
      });

      /* The rail is only up while the story is. Past the last beat the
         page turns into process, work and a call to action - none of
         which is an episode, and a counter still running over them says
         the story did not end. */
      ScrollTrigger.create({
        trigger: story,
        start: "top top+=40%",
        end: "bottom bottom",
        toggleClass: { targets: ".s-rail", className: "is-live" },
      });
    }
  });

  return () => ctx.revert();
}
