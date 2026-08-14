/* ============================================================
   SoCheers - About page motion

   The About page boots the shared engine (lib/motion.ts) for everything it
   has in common with the home page: Lenis, the cursor, split reveals,
   marquees, tilt, the progress bar. This file only adds what is specific to
   this page, and deliberately creates no Lenis and no ticker of its own -
   two smooth-scroll instances on one document fight each other.

   Everything here is scrub-linked to scroll rather than fired once, because
   the whole brief for this page was continuity: it should read as one move
   through a story, not a stack of slides that each animate on entry.
   ============================================================ */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAbout(): () => void {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover:hover)").matches;

  const tickers: gsap.TickerCallback[] = [];
  const addTicker = (fn: gsap.TickerCallback) => { gsap.ticker.add(fn); tickers.push(fn); };
  const ac = new AbortController();

  const ctx = gsap.context(() => {
    /* -------------------------------------------------- the hero
       The video plays on its own; this just runs the colour field - drift
       on its own, and the cursor pushing whole layers around at different
       depths. */
    if (!prefersReduced) {
      /* · the colour field drifts · Each orb wanders on its own loop, on
         an index-derived path so no two ever sync up. This rides the
         inner <b>; the outer <i> is left free for the cursor. */
      gsap.utils.toArray<HTMLElement>("[data-hero-drift]").forEach((b, i) => {
        gsap.to(b, {
          x: `random(-26, 26)`, y: `random(-30, 30)`,
          duration: 7 + (i % 5) * 1.6,
          repeat: -1, yoyo: true, ease: "sine.inOut",
          delay: (i * 0.7) % 3.5,
        });
      });

      /* · cursor depth · One ticker for every layer that declares a
         depth. Driven off the ticker rather than mousemove because the
         hero also moves under a still cursor while scrolling, and a
         mousemove-only read would go stale mid-scroll. Negative depths
         lean against the pointer, which is what separates the type
         plane from the artwork behind it. */
      if (canHover) {
        type Layer = { d: number; xTo: gsap.QuickToFunc; yTo: gsap.QuickToFunc };
        const layers: Layer[] = gsap.utils
          .toArray<HTMLElement>("[data-hero-depth]")
          .map((el) => ({
            d: parseFloat(el.dataset.heroDepth || "0"),
            xTo: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3" }),
            yTo: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3" }),
          }));

        if (layers.length) {
          const MAX = 30;                 // px of travel at full depth
          let mx = 0, my = 0, live = false, onScreen = true;
          window.addEventListener("mousemove", (e: MouseEvent) => {
            mx = e.clientX; my = e.clientY; live = true;
          }, { signal: ac.signal });

          ScrollTrigger.create({
            trigger: ".ab-open", start: "top bottom", end: "bottom top",
            onToggle: (self) => { onScreen = self.isActive; },
          });

          addTicker(() => {
            if (!live || !onScreen) return;
            // -1..1 from the viewport centre
            const nx = (mx / window.innerWidth) * 2 - 1;
            const ny = (my / window.innerHeight) * 2 - 1;
            layers.forEach((l) => {
              l.xTo(nx * MAX * l.d);
              l.yTo(ny * MAX * l.d * 0.7);
            });
          });
        }
      }
    }

    /* -------------------------------------------------- the bulbs
       Ideas arriving over the team, one at a time. Each bulb owns a looping
       timeline whose offsets come from its index rather than Math.random:
       the primes make the cycles drift apart and stay apart, where random
       delays clump often enough to read as a flicker, and a reload would
       reshuffle a layout that has been tuned by eye.

       CSS starts them at opacity 0, so if this never runs they stay off
       rather than sitting frozen on the artwork. */
    const bulbs = gsap.utils.toArray<HTMLElement>("[data-bulb]");
    if (bulbs.length) {
      if (prefersReduced) {
        // no popping: just light them, once
        gsap.set(bulbs, { autoAlpha: 0.85, scale: 1 });
      } else {
        const loops = bulbs.map((b, i) => {
          const tl = gsap.timeline({
            repeat: -1,
            delay: (i * 0.83) % 4.1,
            repeatDelay: 2.2 + ((i * 1.7) % 3.4),
            paused: true,
          });
          tl.fromTo(b,
            { autoAlpha: 0, scale: 0.35, y: 10 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2.8)" })
            // the beat where it is simply on - this is the "idea" itself
            .to(b, { autoAlpha: 0.78, duration: 0.75, ease: "sine.inOut" })
            .to(b, { autoAlpha: 0, scale: 0.6, y: -12, duration: 0.45, ease: "power2.in" });
          return tl;
        });

        // nothing ticks while the artwork is off screen
        const host = bulbs[0].closest(".ab-intro__visual") || bulbs[0].parentElement;
        if (host) {
          ScrollTrigger.create({
            trigger: host, start: "top 92%", end: "bottom 8%",
            onToggle: (self) => loops.forEach((tl) => (self.isActive ? tl.play() : tl.pause())),
          });
        } else {
          loops.forEach((tl) => tl.play());
        }
      }
    }

    if (prefersReduced) return;

    /* -------------------------------------------------- opener parallax
       The frame drifts up slower than the page and settles darker, so the
       first scroll has something to push against. */
    const media = document.querySelector<HTMLElement>("[data-ab-parallax]");
    if (media) {
      gsap.fromTo(media,
        { yPercent: -8, scale: 1.12 },
        {
          yPercent: 8, scale: 1, ease: "none",
          scrollTrigger: {
            trigger: media.closest("section") || media,
            start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true,
          },
        });
    }

    /* -------------------------------------------------- the founders split
       The section arrives as one photograph of the two of them and comes
       apart as you keep scrolling: the frame tears down the middle, the
       halves draw out to where each founder will stand, and as they go the
       two portraits come up underneath them and the write-ups slide in
       from the outer edges.

       Scrubbed, not fired: the whole point is that the tear is something
       the reader is doing with the scroll rather than something that
       happens at them, and it has to be as reversible as the scroll is.

       One number carries the geometry - `step`, half the distance between
       the two portrait frames. Each half travels one step out, each frame
       starts one step in, so the halves land exactly where the portraits
       are and nothing has to be nudged by eye. Read from offsetLeft, which
       transforms do not touch, so it stays true no matter where in the
       tween a refresh lands. */
    const foundersMM = gsap.matchMedia();

    foundersMM.add("(min-width: 861px)", () => {
      const section = document.querySelector<HTMLElement>(".ab-founders");
      const grid = document.querySelector<HTMLElement>("[data-founders]");
      if (!section || !grid) return;

      const duo = grid.querySelector<HTMLElement>("[data-founders-duo]");
      const halves = gsap.utils.toArray<HTMLElement>("[data-founders-half]", grid);
      const arts = gsap.utils.toArray<HTMLElement>(".founder", grid);
      const photos = gsap.utils.toArray<HTMLElement>("[data-founder-photo]", grid);
      const cards = gsap.utils.toArray<HTMLElement>(".founder__revealIn", grid);
      if (!duo || halves.length !== 2 || arts.length !== 2) return;

      const step = () => (arts[1].offsetLeft - arts[0].offsetLeft) / 2;

      /* about.css keeps the pair frame hidden - that is the state the page
         ends in, and the one it has to be in if this never runs. Here it is
         the state the page *starts* in, so it is turned on by hand and the
         timeline is what takes it away again. */
      gsap.set(duo, { autoAlpha: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: "top 88%", end: "top 16%",
          scrub: 1, invalidateOnRefresh: true,
        },
      });

      /* 1 · the pair, held. A slow settle out of a slight oversize, so the
            first third of the window is a photograph being looked at
            rather than a still frame waiting for its cue. */
      tl.fromTo(duo, { scale: 1.05 }, { scale: 1, duration: 0.34, ease: "none" }, 0);

      /* 2 · the tear. Halves out, frames in from where the halves were -
            the two moves are the same distance in opposite directions, so
            each portrait is arriving exactly as its half leaves. */
      tl.fromTo(halves[0], { x: 0 }, { x: () => -step(), duration: 0.44, ease: "power2.inOut" }, 0.34);
      tl.fromTo(halves[1], { x: 0 }, { x: () => step(), duration: 0.44, ease: "power2.inOut" }, 0.34);
      tl.fromTo(arts[0], { x: () => step() }, { x: 0, duration: 0.44, ease: "power2.inOut" }, 0.34);
      tl.fromTo(arts[1], { x: () => -step() }, { x: 0, duration: 0.44, ease: "power2.inOut" }, 0.34);

      tl.fromTo(photos, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0.44);
      tl.to(duo, { autoAlpha: 0, duration: 0.28, ease: "power1.in" }, 0.46);

      /* 3 · and the write-ups, each from the side its founder stands on
            (see .founder--left/--right in about.css). */
      cards.forEach((el) => {
        const dir = el.closest(".founder--left") ? -1 : 1;
        tl.fromTo(el,
          { autoAlpha: 0, x: 120 * dir },
          { autoAlpha: 1, x: 0, duration: 0.34, ease: "power2.out" }, 0.7);
      });
    });

    /* Stacked to one column there is no middle for a photo to tear along,
       so the pair shot is out (about.css hides it) and the write-ups keep
       the plain slide they always had. */
    foundersMM.add("(max-width: 860px)", () => {
      const section = document.querySelector<HTMLElement>(".ab-founders");
      if (!section) return;
      document.querySelectorAll<HTMLElement>(".founder__revealIn").forEach((el) => {
        gsap.fromTo(el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1, y: 0, ease: "none",
            scrollTrigger: {
              trigger: el, start: "top 92%", end: "top 62%",
              scrub: 1, invalidateOnRefresh: true,
            },
          });
      });
    });

    /* -------------------------------------------------- the group shot pan
       The photo pans across its own crop window as you scroll. */
    document.querySelectorAll<HTMLElement>("[data-film]").forEach((strip) => {
      const img = strip.querySelector<HTMLElement>("[data-film-img]");
      if (!img) return;
      gsap.fromTo(img, { xPercent: 2 }, {
        xPercent: -12, ease: "none",
        scrollTrigger: {
          trigger: strip, start: "top bottom", end: "bottom top",
          scrub: 1, invalidateOnRefresh: true,
        },
      });
    });

    /* -------------------------------------------------- the panel stack
       Each panel pins in place - the section itself stops moving the
       moment its top hits the viewport top - while pinSpacing:false keeps
       its layout space from being reserved, so the next panel (already
       sitting right below it in the document) is dragged up through the
       viewport for the whole pin window instead of only meeting it at the
       edge. That's what actually reads as "the next section slides up and
       stacks on top" rather than the page just changing colour underfoot;
       the rounded top edge and shadow from about.css are what sell the
       covering card as a separate plane once it arrives.

       The pinned card's own contents drift up a little, shrink a little
       and dim over that same window, so it reads as sinking away under
       the new one rather than just sitting there inert while it's covered. */
    gsap.utils.toArray<HTMLElement>("[data-panel]").forEach((panel, i, all) => {
      // the last card has nothing after it to cover it, so it never pins
      if (i === all.length - 1) return;

      const inner = panel.querySelector<HTMLElement>(":scope > .wrap");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          pin: true,
          pinSpacing: false,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      if (inner) {
        tl.fromTo(inner,
          { y: 0, scale: 1, autoAlpha: 1 },
          { y: -64, scale: 0.94, autoAlpha: 0.35, ease: "none" }, 0);
      }
    });

    /* -------------------------------------------------- the crowd
       Rises a little slower than the page so the light section keeps
       opening up underneath the pillars rather than arriving all at once. */
    const crowd = document.querySelector<HTMLElement>("[data-ab-crowd]");
    if (crowd) {
      gsap.fromTo(crowd.querySelector("img"),
        { yPercent: -6, scale: 1.06 },
        {
          yPercent: 4, scale: 1, ease: "none",
          scrollTrigger: {
            trigger: crowd, start: "top bottom", end: "bottom top",
            scrub: 1, invalidateOnRefresh: true,
          },
        });
    }
  });

  return () => {
    ac.abort();
    tickers.forEach((fn) => gsap.ticker.remove(fn));
    ctx.revert();
  };
}
