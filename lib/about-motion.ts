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
       Three separate jobs, kept on three separate elements so none of them
       ever write to the same transform: the entrance lifts the type, the
       colour field drifts on its own, and the cursor pushes whole layers
       around at different depths. */
    const heroCopy = document.querySelector<HTMLElement>(".abh__copy");
    if (heroCopy) {
      /* · entrance · The lines fade and rise in, then the supporting copy
         follows. Nothing is scroll-triggered here - the hero is already in
         view on load, so it just plays.

         Was a clipped mask-lift (overflow:hidden + yPercent). Swapped for
         a plain fade+rise, same technique as the sub/CTA lines right below
         it, after that version went invisible-but-selectable in testing -
         see the .abh__title comment in about.css for why. */
      if (prefersReduced) {
        gsap.set("[data-hero-line], [data-hero-eyebrow], [data-hero-sub], [data-hero-cta]",
          { autoAlpha: 1, y: 0 });
      } else {
        const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
        tl.fromTo("[data-hero-eyebrow]",
          { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.7 }, 0);
        tl.fromTo("[data-hero-line]",
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.09 }, 0.12);
        tl.fromTo("[data-hero-sub]",
          { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.75);
        tl.fromTo("[data-hero-cta]",
          { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.95);
      }

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

    /* -------------------------------------------------- the film gate
       The photo pans across its window while the perforations crawl the
       other way. Opposed directions is what sells it - matched ones just
       read as the whole block sliding. */
    document.querySelectorAll<HTMLElement>("[data-film]").forEach((strip) => {
      const img = strip.querySelector<HTMLElement>("[data-film-img]");
      const st = {
        trigger: strip, start: "top bottom", end: "bottom top",
        scrub: 1, invalidateOnRefresh: true,
      };
      if (img) {
        gsap.fromTo(img, { xPercent: 2 }, { xPercent: -12, ease: "none", scrollTrigger: st });
      }
      // The sprockets are a repeating gradient, so panning them is a
      // background shift. Travel is a whole number of the 48px period
      // (see .filmstrip__perf) so the holes never land half-cut.
      gsap.fromTo(strip, { "--perf-x": "0px" },
        { "--perf-x": "-192px", ease: "none", scrollTrigger: st });
    });

    /* -------------------------------------------------- pixel veils
       Tiles sit over the top of a section and fall away as you scroll in -
       a bold dissolve instead of a soft gradient. Two of these on the page
       now: black tiles opening the white "drives" section, and white tiles
       (about.css recolours the mirror) opening "the space" straight after -
       same mechanic, run in reverse, so the hand-off out of the light
       section reads as one move rather than two different transitions.
       Random stagger so each crumbles as pixels, not as flat horizontal bars. */
    document.querySelectorAll<HTMLElement>("[data-ab-pixveil]").forEach((veil) => {
      const host = veil.querySelector<HTMLElement>("[data-pixgrid]");
      const tiles = host
        ? (Array.from(host.querySelectorAll("i")) as HTMLElement[])
        : [];
      const cols = parseInt(host?.dataset.cols || "24", 10);
      const section = veil.closest("section");

      if (tiles.length && section) {
        // Bias the order: lower tiles drop first so the section beneath
        // punches upward into the veil, and the top edge stays locked to
        // whatever sits above until the end. Noise keeps it from reading
        // as a flat wipe.
        const ranked = tiles
          .map((el, i) => {
            const row = Math.floor(i / cols);
            const noise = ((i * 17) % 10) / 10;
            return { el, score: -row + noise * 2.8 };
          })
          .sort((a, b) => a.score - b.score)
          .map((t) => t.el);

        gsap.set(ranked, { opacity: 1, y: 0, force3D: true });

        const st = {
          trigger: section,
          start: "top 85%",
          end: "top 10%",
          scrub: 0.4,
          invalidateOnRefresh: true,
        } as const;

        // Fall is continuous; opacity snaps so tiles pop off as hard pixels
        // instead of melting into grey.
        gsap.to(ranked, {
          y: (i) => 64 + (i % 9) * 16,
          ease: "none",
          stagger: { each: 0.0045, from: "start" },
          scrollTrigger: st,
        });
        gsap.to(ranked, {
          opacity: 0,
          ease: "steps(1)",
          stagger: { each: 0.0045, from: "start" },
          scrollTrigger: st,
        });
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
