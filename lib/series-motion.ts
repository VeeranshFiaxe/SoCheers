import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   THE SERIES PAGE's own scroll work.

   initSite() already does the site-wide half on this page - Lenis, the
   cursor, the split-line headings, the reveals. What lives here is the
   part that only makes sense on a page whose argument is that it can
   hold you: the shots.

   ---- one function per shot ----

   Each function below is the motion half of one staging function in
   components/SeriesStory.tsx, and the pair is the whole of a shot: the
   component says what is on the screen, this says what the scroll does
   to it. They are matched by data attribute rather than by class, so
   restyling a shot cannot silently unhook its motion.

   Everything is scrubbed. Nothing here plays on a timer or on entry,
   because the brief is scroll-driven cinema and the difference between
   the two is whether the reader is holding the shuttle. The one thing
   that runs on its own is the film in the frames that carry one, and
   that is video playing, not the page animating at somebody.

   ---- the three rules the whole file obeys ----

   1. Every selection is allowed to be empty. Beats come and go from
      lib/series-content.ts and a missing shot is not an error.
   2. Nothing writes a transform that initSite() is already writing. The
      reveals own the type; this file owns the pictures, the bands and
      the boxes around them. Two owners on one transform is the bug that
      reads as jitter on a slow machine.
   3. Under prefers-reduced-motion the page still works and still tells
      the story - the frames simply arrive where they were going to end
      up, and the films do not autoplay.
   ============================================================ */

export function initSeries(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* the one place this file adds plain DOM listeners is the feed rail;
     they come off together on teardown */
  const ac = new AbortController();

  const ctx = gsap.context(() => {
    gate(reduced);
    titles(reduced);
    mosaics(reduced);
    apertures(reduced);
    strips(reduced);
    reelRows(reduced);
    phones(reduced);
    helds(reduced);
    figures();
    rulers(reduced);
    feed(reduced, ac.signal);
    episodeRail();
  });

  /* Outside the gsap context because it is an observer rather than a
     tween, and it has to be torn down by hand. */
  const stopFilms = films(reduced);

  return () => {
    ac.abort();
    ctx.revert();
    stopFilms();
  };
}

/* ------------------------------------------------------------------
   THE GATE - the one piece of motion every shot shares.

   Two bands, top and bottom of each stage, scaled out of the way as a
   beat arrives and part-way back as it leaves. It is what makes fifteen
   different mechanics read as one reel rather than as a portfolio of
   effects: whatever a beat does in the middle, it opens and closes the
   same way.

   scaleY on a band whose transform-origin is its own outer edge, not
   height - height is a layout property and there are two of these on
   every one of fifteen sections.
   ------------------------------------------------------------------ */
function gate(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-stage]").forEach((stage) => {
    const bands = stage.querySelectorAll<HTMLElement>("[data-gate]");
    if (!bands.length) return;

    if (reduced) {
      gsap.set(bands, { scaleY: 0.18 });
      return;
    }

    gsap
      .timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      })
      .fromTo(bands, { scaleY: 1 }, { scaleY: 0.12, ease: "power2.out", duration: 0.34 })
      .to(bands, { scaleY: 0.12, duration: 0.32 })
      .to(bands, { scaleY: 0.72, ease: "power2.in", duration: 0.34 });
  });
}

/* ------------------------------------------------------------------
   TITLE - the slow push. A card holds its frame while the type lands on
   it, so the only movement is the frame creeping closer over the length
   of the beat. Small numbers on purpose: a title card that visibly zooms
   is a slideshow transition.
   ------------------------------------------------------------------ */
function titles(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>('.sbeat[data-shot="title"] .sfill').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1.14, yPercent: -2 },
      {
        scale: 1,
        yPercent: 2,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".sbeat") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   HELD - the same idea, the other way round and slower still. These are
   the beats between the mechanics, and they are the ones where the copy
   is doing the work, so the picture is only just alive.
   ------------------------------------------------------------------ */
function helds(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>('.sbeat[data-shot="held"] .sfill').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1, yPercent: -5 },
      {
        scale: 1.09,
        yPercent: 5,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".sbeat") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   MOSAIC - the wall.

   Twelve windows arriving as the beat is read. The stagger is off the
   tile's own index, which the component wrote into a custom property, so
   nothing is measured and the order survives a reflow.

   `jitter` is the same wall arriving badly: the tiles come in out of
   order, slightly out of register and slightly out of square, and they
   never quite settle. That beat is the one about noise, and a wall that
   arrives neatly would be arguing the opposite of its own sentence.
   ------------------------------------------------------------------ */
function mosaics(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-mos]").forEach((mos) => {
    const wins = mos.querySelectorAll<HTMLElement>("[data-win]");
    if (!wins.length) return;

    const jitter = mos.hasAttribute("data-jitter");

    if (reduced) {
      gsap.set(wins, { opacity: 1, scale: 1, y: 0, rotate: 0 });
      return;
    }

    const beat = mos.closest(".sbeat") as HTMLElement;

    gsap.fromTo(
      wins,
      {
        opacity: 0,
        scale: jitter ? 1.12 : 0.86,
        yPercent: jitter ? 0 : 26,
        xPercent: jitter ? 6 : 0,
        rotate: jitter ? 1.4 : 0,
      },
      {
        opacity: 1,
        scale: 1,
        yPercent: 0,
        xPercent: 0,
        rotate: 0,
        ease: jitter ? "steps(4)" : "power2.out",
        stagger: jitter
          ? { each: 0.06, from: "random" }
          : { each: 0.05, from: "start" },
        scrollTrigger: {
          trigger: beat,
          start: "top 88%",
          end: "top 18%",
          scrub: true,
        },
      },
    );

    /* and then the whole wall drifts, as one, for the rest of the beat -
       so the abundance keeps moving after it has finished arriving
       rather than freezing into a contact sheet */
    gsap.fromTo(
      mos,
      { yPercent: 3 },
      {
        yPercent: -3,
        ease: "none",
        scrollTrigger: { trigger: beat, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}

/* ------------------------------------------------------------------
   APERTURE - the squeeze.

   The frame starts as the whole screen and is closed into a phone by the
   time the beat is read. Done with clip-path rather than by animating
   the box, because width and height are layout and this runs on every
   scroll frame; the picture behind never moves, which is also what makes
   it read as the screen closing in rather than as a photograph shrinking.

   The target inset is a function so ScrollTrigger re-evaluates it on
   refresh - the phone is sized off the viewport, and a rotated tablet
   would otherwise keep the portrait numbers.
   ------------------------------------------------------------------ */
function apertures(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-aperture]").forEach((ap) => {
    const shut = () => {
      const r = ap.getBoundingClientRect();
      if (!r.width || !r.height) return "inset(0% 0% 0% 0%)";

      const w = Math.min(r.width * 0.3, 300);
      const h = Math.min(r.height * 0.62, (w * 16) / 9);
      /* the closed frame sits high in the beat rather than dead centre:
         the type on this one is at the foot of a taller-than-screen
         section, and a phone centred in the stage would be sitting on
         the sentence that explains it */
      const cy = r.width < 900 ? 0.3 : 0.36;

      const left = (r.width - w) / 2;
      const top = Math.max(0, r.height * cy - h / 2);
      const pct = (n: number, of: number) => ((n / of) * 100).toFixed(2);

      return `inset(${pct(top, r.height)}% ${pct(r.width - left - w, r.width)}% ${pct(
        r.height - top - h,
        r.height,
      )}% ${pct(left, r.width)}% round 18px)`;
    };

    if (reduced) {
      gsap.set(ap, { clipPath: shut() });
      return;
    }

    gsap.fromTo(
      ap,
      { clipPath: "inset(0% 0% 0% 0% round 0px)" },
      {
        clipPath: shut,
        ease: "none",
        scrollTrigger: {
          trigger: ap.closest(".sbeat") as HTMLElement,
          start: "top 70%",
          end: "bottom 85%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   STRIP - the poster, cut into bands.

   Four letterboxed bands, each travelling sideways at its own rate. The
   pictures are drawn 118% wide inside their bands (see .sstrip__band img
   in series.css) so there is 9% of travel each way and an edge can never
   appear - if that width changes, the 9 below changes with it.

   `reverse` runs the bands against the scroll, and it is used once: on
   the beat about the mind going back to what it already knows. A strip
   that travels backwards while the reader goes forwards says that
   without a caption.
   ------------------------------------------------------------------ */
function strips(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-strip]").forEach((strip) => {
    const dir = strip.hasAttribute("data-reverse") ? -1 : 1;
    const beat = strip.closest(".sbeat") as HTMLElement;

    strip.querySelectorAll<HTMLElement>("[data-band]").forEach((band, i) => {
      const img = band.firstElementChild as HTMLElement | null;
      if (!img) return;
      /* alternate rates rather than a straight ramp: four bands all
         speeding up downwards reads as a tilt, four bands disagreeing
         reads as four shots */
      const rate = [9, 5, 8, 4][i % 4] * dir;
      gsap.fromTo(
        img,
        { xPercent: -rate },
        {
          xPercent: rate,
          ease: "none",
          scrollTrigger: { trigger: beat, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    /* the bands themselves open out of the centre as the beat arrives -
       the cut, before the movement */
    gsap.fromTo(
      strip.querySelectorAll<HTMLElement>("[data-band]"),
      { scaleY: 0.55, opacity: 0.2 },
      {
        scaleY: 1,
        opacity: 1,
        ease: "power2.out",
        stagger: 0.06,
        scrollTrigger: { trigger: beat, start: "top 85%", end: "top 30%", scrub: true },
      },
    );
  });
}

/* ------------------------------------------------------------------
   REEL - eight verticals closing into a stack.

   They start as a row across the screen and slide into each other as the
   beat is read: eight episodes, compressed into the cycle of the scroll,
   which is the sentence beside them.

   xPercent, so the distance each one travels is a share of its own width
   and the compression holds at any breakpoint without a media query or a
   measurement.
   ------------------------------------------------------------------ */
function reelRows(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-reelrow]").forEach((row) => {
    const eps = gsap.utils.toArray<HTMLElement>("[data-ep]", row);
    if (!eps.length) return;
    const mid = (eps.length - 1) / 2;

    if (reduced) return;

    gsap.fromTo(
      eps,
      { xPercent: 0, rotate: 0 },
      {
        /* everything moves toward the middle of the row, by a share of
           its own distance from it */
        xPercent: (i) => (mid - i) * 62,
        rotate: (i) => (i - mid) * 0.6,
        ease: "none",
        scrollTrigger: {
          trigger: row.closest(".sbeat") as HTMLElement,
          start: "top 62%",
          end: "bottom 90%",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   PHONE - a held vertical. The only movement is inside the glass.
   ------------------------------------------------------------------ */
function phones(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-phone]").forEach((ph) => {
    const img = ph.querySelector<HTMLElement>(".sfill");
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -6, scale: 1.06 },
      {
        yPercent: 6,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: ph.closest(".sbeat") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   FIGURE - the stat counts up on the scroll.

   Reads the target out of the rendered text rather than taking a prop,
   so the number lives in one place (STAT in lib/series-content.ts) and
   the page still says something sensible with JavaScript off.

   textContent is written only when the rounded value actually changes.
   onUpdate fires every scroll frame and a text write is a layout write;
   at sixty a second, for a number with three states, that is the most
   expensive thing on the screen.

   Runs under reduced motion too - it is not decoration, it is the number
   arriving, and its "animation" is a scroll position either way.
   ------------------------------------------------------------------ */
function figures() {
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
    const raw = (el.textContent ?? "").trim();
    const match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const target = parseFloat(match[1]);
    const suffix = match[2] ?? "";
    const decimals = (match[1].split(".")[1] ?? "").length;
    const pad = match[1].split(".")[0].length;

    const proxy = { v: 0 };
    let shown = "";

    ScrollTrigger.create({
      trigger: el.closest(".sbeat") as HTMLElement,
      start: "top 80%",
      end: "center 55%",
      scrub: true,
      onUpdate: (self) => {
        proxy.v = target * self.progress;
        const next =
          proxy.v.toFixed(decimals).padStart(decimals ? pad + decimals + 1 : pad, "0") + suffix;
        if (next !== shown) {
          shown = next;
          el.textContent = next;
        }
      },
    });
  });
}

/* ------------------------------------------------------------------
   RULER - twelve months, drawn under the sentence about twelve months.

   The line fills, the month marks light as it passes them, and the loop
   back to January only appears once December has actually been reached.
   That last part is the whole reason this exists rather than being a
   static graphic: the claim is that the year closes on itself, and the
   reader gets to watch it close.
   ------------------------------------------------------------------ */
function rulers(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-ruler]").forEach((ruler) => {
    const fill = ruler.querySelector<HTMLElement>("[data-ruler-fill]");
    const marks = ruler.querySelectorAll<HTMLElement>("[data-ruler-mark]");
    const loop = ruler.querySelector<HTMLElement>("[data-ruler-loop]");

    if (reduced) {
      gsap.set(fill, { scaleX: 1 });
      gsap.set(marks, { opacity: 1 });
      gsap.set(loop, { opacity: 1 });
      return;
    }

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ruler,
          start: "top 88%",
          end: "top 40%",
          scrub: true,
        },
      })
      .fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 })
      .fromTo(marks, { opacity: 0.25 }, { opacity: 1, stagger: 1 / 12, duration: 1 }, 0)
      .fromTo(loop, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.25 }, 0.85);
  });
}

/* ------------------------------------------------------------------
   THE FEED RAIL.

   The row of episodes moves sideways as the page moves down, so the
   second half of the rail arrives without the reader having to find a
   horizontal scrollbar - which on a trackpad they will, and on a phone
   they will not.

   Driven by writing scrollLeft rather than by translating the row,
   because the row is a real overflow-x container: a translated row
   cannot be flicked, dragged or reached by the keyboard, and this is the
   one part of the page whose whole job is that the reader picks
   something out of it and clicks it.

   And the moment they do reach for it themselves, the page lets go for
   good. Fighting a reader for the scroll position of the thing they are
   trying to point at is worse than not driving it at all.
   ------------------------------------------------------------------ */
function feed(reduced: boolean, signal: AbortSignal) {
  const rail = document.querySelector<HTMLElement>("[data-feed-rail]");
  if (!rail || reduced) return;

  let manual = false;
  const release = () => {
    manual = true;
  };
  rail.addEventListener("pointerdown", release, { passive: true, signal });
  rail.addEventListener("wheel", release, { passive: true, signal });
  rail.addEventListener("keydown", release, { signal });

  ScrollTrigger.create({
    trigger: rail,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      if (manual) return;
      const travel = rail.scrollWidth - rail.clientWidth;
      if (travel <= 0) return;
      /* the middle 70% of the beat does the travelling, so the rail is
         not already at its end while it is still arriving on screen */
      const p = gsap.utils.clamp(0, 1, (self.progress - 0.15) / 0.7);
      rail.scrollLeft = travel * p;
    },
  });
}

/* ------------------------------------------------------------------
   THE EPISODE RAIL.

   A page that argues people finish things they can see the end of should
   not hide its own length. A hairline down the left edge with a fill and
   a running count, alive only while the story is - past the last beat
   the page is a feed and a way out, neither of which is an episode, and
   a counter still running over them says the story did not end.

   One ScrollTrigger over the whole story rather than one per beat:
   fifteen triggers each writing the same two nodes is fifteen chances to
   disagree about which beat is current at a boundary.
   ------------------------------------------------------------------ */
function episodeRail() {
  const story = document.querySelector<HTMLElement>("[data-s-story]");
  const fill = document.querySelector<HTMLElement>("[data-s-fill]");
  const num = document.querySelector<HTMLElement>("[data-s-num]");
  const beats = gsap.utils.toArray<HTMLElement>(".sbeat");
  if (!story || !beats.length) return;

  let shown = -1;

  ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (fill) gsap.set(fill, { scaleY: self.progress });

      /* which beat is under the middle of the screen, read off the live
         rects rather than off progress: the beats are wildly different
         heights, so progress is not proportional to index and mapping
         one onto the other runs the count ahead of the page */
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

  ScrollTrigger.create({
    trigger: story,
    start: "top top+=40%",
    end: "bottom bottom",
    toggleClass: { targets: ".s-rail", className: "is-live" },
  });
}

/* ------------------------------------------------------------------
   THE FILMS.

   Rendered inert by components/SeriesStory.tsx - no src, preload="none"
   - and connected here on the first intersection, then paused the moment
   they leave. So the page opens with zero video sockets, a reader who
   stops at the stat never downloads the wall, and nothing is decoding
   frames off screen.

   Once attached, the src stays attached: coming back to a beat should be
   instant rather than a second download of a file that is already in the
   cache anyway.

   Under reduced motion nothing plays. The poster still paints, which is
   why every film that has a still worth showing is given one.
   ------------------------------------------------------------------ */
function films(reduced: boolean): () => void {
  const nodes = document.querySelectorAll<HTMLVideoElement>("video[data-film]");
  if (!nodes.length) return () => {};

  if (reduced) {
    /* attach nothing and play nothing - but do let the poster through,
       which it already is, since poster paints without a source */
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          const src = v.dataset.film;
          if (src && !v.src) v.src = src;
          /* the catch is not optional: a browser that has decided this
             tab may not autoplay rejects, and an unhandled rejection
             here would be thrown once per beat per scroll */
          v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      }
    },
    { rootMargin: "150px 0px", threshold: 0.01 },
  );

  nodes.forEach((v) => io.observe(v));

  return () => {
    io.disconnect();
    nodes.forEach((v) => {
      v.pause();
      /* dropping the source releases the decoder on teardown - React
         StrictMode mounts this twice in dev and Fast Refresh re-runs it */
      v.removeAttribute("src");
      v.load();
    });
  };
}
