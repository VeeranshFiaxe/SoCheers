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

    /* -------------------------------------------------- the founders join
       The section arrives as two separate portraits, one for each founder,
       and puts them together as you keep scrolling: the two frames travel
       in to meet in the middle, the halves of the pair shot come in with
       them and dissolve up over the top, and once the two of them are one
       photograph again the write-ups slide in to flank it.

       Two people who built the thing together, arriving separately and
       ending up in the same frame - that is the order the section is
       actually about, and it is the opposite of the tear this used to
       play.

       Scrubbed, not fired: the join is something the reader is doing with
       the scroll rather than something that happens at them, and it has to
       be as reversible as the scroll is.

       One number carries the geometry - `step`, half the distance between
       the two portrait frames. Each frame travels one step in, each half
       starts one step out, so the halves ride exactly on top of the
       portraits they are replacing and nothing has to be nudged by eye.
       Read from offsetLeft, which transforms do not touch, so it stays
       true no matter where in the tween a refresh lands. */
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

      /* The opening state, written down rather than left to the tweens to
         imply. Every fromTo below is immediateRender:false, so none of
         them touches anything until its own moment on the timeline - which
         is what stops the section from flashing through a later frame of
         the join while the page is still settling. This is the only thing
         that paints before the timeline runs, and it is the same picture
         about.css hands a script-less visitor: the two of them apart, the
         pair frame not yet up, the write-ups off to the sides. */
      const cardDir = (el: HTMLElement) => (el.closest(".founder--left") ? -1 : 1);
      const setStart = () => {
        gsap.set(arts, { x: 0 });
        gsap.set(photos, { autoAlpha: 1, scale: 1.06 });
        gsap.set(halves[0], { x: -step() });
        gsap.set(halves[1], { x: step() });
        gsap.set(duo, { autoAlpha: 0 });
        cards.forEach((el) => gsap.set(el, { autoAlpha: 0, x: 150 * cardDir(el) }));
      };
      setStart();

      /* Cued by the scroll, not driven by it. This was scrubbed, and a
         scrub means the join only ever moves while the wheel is moving and
         at whatever speed the wheel is moving - so it read as something
         being dragged into place by hand, and it never finished unless you
         kept going. It is a piece of choreography with a right speed of
         its own, so the scroll's only job is to say when: the section pins
         at full page, this fires once, and it plays all the way through on
         its own timing whether you keep scrolling, stop, or sit still.

         The founders hold at the foot of this file is what buys it the
         room: the panel pins for a screen's worth of scroll, so the whole
         thing plays out with the section standing still.

         Reversed on the way back up rather than left standing, so scrolling
         out and back in shows it again instead of handing back a section
         that has already happened. */
      const tl = gsap.timeline({
        paused: true,
        /* nothing here writes to the page before its own moment - the
           opening state above is what the section sits in until then */
        defaults: { ease: "power2.out", immediateRender: false },
        scrollTrigger: {
          trigger: section, start: "top top",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
          /* the founders hold pins this same section, and a pin moves the
             element into a spacer. Refreshing after it means this trigger
             measures the page the pin has already made, instead of firing
             off a start position that is about to move under it. */
          refreshPriority: -1,
        },
      });

      /* Seconds from here down, not fractions of a scroll window. 1 · a
            beat on the two of them apart, settling out of a slight
            oversize, before anything moves. */
      tl.fromTo(photos, { scale: 1.06 }, { scale: 1, duration: 0.9, ease: "power2.out" }, 0);

      /* 2 · the join. Frames in to the middle, halves in from where those
            frames started - the two moves are the same distance in
            opposite directions, so each half is riding on the portrait it
            is about to replace the whole way in. The long inOut is the
            whole character of it: slow to leave, slow to land, quick only
            in the middle. */
      tl.fromTo(arts[0], { x: 0 }, { x: () => step(), duration: 1.5, ease: "power2.inOut" }, 0.5);
      tl.fromTo(arts[1], { x: 0 }, { x: () => -step(), duration: 1.5, ease: "power2.inOut" }, 0.5);
      tl.fromTo(halves[0], { x: () => -step() }, { x: 0, duration: 1.5, ease: "power2.inOut" }, 0.5);
      tl.fromTo(halves[1], { x: () => step() }, { x: 0, duration: 1.5, ease: "power2.inOut" }, 0.5);

      /* the swap, under way while they are still travelling: the pair shot
         comes up over the portraits (it sits above them - see the z-index
         on .founders__duo) and the portraits go out from under it, so the
         two of them fuse into one frame rather than one picture cutting to
         another once the move has landed. */
      tl.fromTo(duo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: "power1.out" }, 1.15);
      tl.to(photos, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, 1.3);

      /* 3 · and the write-ups, each from the side its founder stands on,
            flanking the frame the pair now share (see .founder--left/
            --right in about.css - the panels travel in with their own
            article, so they arrive already beside the joined photo).
            Both on the same cue, not stepped: the stagger was small enough
            to read as the second one lagging rather than as two people
            being introduced in turn, and the section's whole point is that
            they arrive together. */
      cards.forEach((el) => {
        tl.fromTo(el,
          { autoAlpha: 0, x: 150 * cardDir(el) },
          { autoAlpha: 1, x: 0, duration: 0.9, ease: "power3.out" }, 2.05);
      });

      /* The hover on the pair shot - the whole picture coming back into
         colour and lifting off the panel (see .founders__duo.is-joined in
         about.css) - only makes sense once they are one photograph. While
         the halves are still travelling, this is off: a lift applied to
         two frames mid-flight would be the one moment the join could be
         seen for what it is. Read off progress rather than set on
         complete, so scrolling back up takes it away again. */
      const markJoined = () => duo.classList.toggle("is-joined", tl.progress() === 1);
      tl.eventCallback("onUpdate", markJoined);
      tl.eventCallback("onComplete", markJoined);

      return () => duo.classList.remove("is-joined");
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

    /* -------------------------------------------------- the founders card
       Two pins, one after the other, and they are not the same kind.

       1 · the climb. The opener is pinned from the moment its foot reaches
       the foot of the screen, and pinSpacing:false means its layout space
       is not held - so the founders panel, sitting right under it in the
       document, is drawn up through the viewport instead of only meeting
       it at the edge. That travel over a section that has stopped moving
       is the stack: a card rising over the page, its curved top edge and
       shadow (see .ab-founders in about.css) selling it as a plane above
       rather than a colour change underneath. The opener's own contents
       drift up, shrink and dim as it goes, so it recedes under the card
       instead of sitting there inert while it is covered.

       Every panel used to do this to the one before it. Only this join
       does now - which is the difference between a page with a moment in
       it and a page made of the same trick five times.

       2 · the hold, once the card has landed. The join inside the founders
       panel is a fixed three seconds of choreography (see the founders
       block above) and it needs the section to stand still while it plays.
       pinSpacing stays ON for this one: the space is reserved, so nothing
       below is pulled up over the top of it. The panel stops, the join
       plays, and then the page scrolls on into the next section plainly.

       Both are skipped under 861px, where the join does not run and the
       panels are stacked to one column anyway. */
    const holdMM = gsap.matchMedia();
    holdMM.add("(min-width: 861px)", () => {
      const opener = document.querySelector<HTMLElement>(".ab-intro");
      const panel = document.querySelector<HTMLElement>(".ab-founders");
      if (!panel) return;

      if (opener) {
        const climb = gsap.timeline({
          scrollTrigger: {
            trigger: opener,
            /* its foot, not its head: the opener is content-height rather
               than a fixed screen, so anchoring the climb to the bottom
               edge is what makes the card start exactly at the fold no
               matter how tall the copy above it runs */
            start: "bottom bottom",
            end: () => "+=" + window.innerHeight,
            pin: true,
            pinSpacing: false,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        const inner = opener.querySelector<HTMLElement>(":scope > .wrap");
        if (inner) {
          climb.fromTo(inner,
            { y: 0, scale: 1, autoAlpha: 1 },
            { y: -64, scale: 0.94, autoAlpha: 0.35, ease: "none" }, 0);
        }
      }

      ScrollTrigger.create({
        trigger: panel,
        start: "top top",
        end: () => "+=" + window.innerHeight,
        pin: true,
        invalidateOnRefresh: true,
      });
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
