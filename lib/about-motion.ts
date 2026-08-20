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

  const ctx = gsap.context(() => {
    /* -------------------------------------------------- the hero
       Nothing to run. The opener used to carry eleven blurred colour orbs,
       each drifting on its own loop with a cursor-depth ticker pushing the
       whole field around - a dozen large-radius blurs being recomposited
       every frame, which is exactly the cost you feel first on a slow
       machine. The opener is the film and the line over it now (see
       components/AboutHero.tsx); the only motion left on it is the scroll
       parallax further down this file, which is one transform on one
       element. */

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
        const host = bulbs[0].closest(".ab-intro__figure") || bulbs[0].parentElement;
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

    /* -------------------------------------------------- the band
       "We are" coming out from behind the figure.

       The panel is one band of type running edge to edge with the man
       standing in the gap between its two words (see AboutIntro in
       components/AboutSections.tsx). This is the move that says the type
       is behind him rather than around him: both halves start closed up
       against his centre, where his own body hides them, and slide out to
       the places CSS has already put them - so the first thing you see is
       a man, and the claim arrives out of him.

       Nothing is positioned here. The layout is CSS and the tween only
       reads where CSS landed, so the phone fold that halves the gap and
       drops the type size needs no matching branch in this file.

       Fired once on entry rather than scrubbed. It is an arrival, not a
       state: the words come out from behind him and are then simply there
       to be read, and tying them to the scrollbar would pull them back
       into his chest every time someone scrolled up to re-read the
       payoff. */
    {
      const stage = document.querySelector<HTMLElement>(".ab-intro__stage");
      const fig = stage?.querySelector<HTMLElement>(".ab-intro__figure");
      const halves = gsap.utils.toArray<HTMLElement>("[data-band]", stage || document);
      const meta = gsap.utils.toArray<HTMLElement>("[data-meta]", stage || document);

      if (fig && halves.length) {
        if (prefersReduced) {
          gsap.set([...halves, ...meta], { autoAlpha: 1 });
        } else {
          /* Hidden from script, not from CSS: a visitor whose bundle never
             arrives should be looking at the sentence, not at an empty
             panel with a man standing in it. */
          gsap.set([...halves, ...meta], { autoAlpha: 0 });

          const play = () => {
            const f = fig.getBoundingClientRect();
            const cx = f.left + f.width / 2;

            /* Measured in one pass before a single tween is built -
               reading a rect after the first fromTo has written a
               transform would be measuring a word already moved. Each
               half is sent back to the figure's centre line and then a
               little further, so the two overlap behind him at the start
               and there is no frame where the pair sits legible in the
               middle of the panel looking like a mistake. */
            const seeded = halves.map((el) => {
              const r = el.getBoundingClientRect();
              return { el, dx: (cx - (r.left + r.width / 2)) * 1.06 };
            });

            const tl = gsap.timeline();
            tl.fromTo(seeded.map((h) => h.el),
              {
                x: (i: number) => seeded[i].dx,
                autoAlpha: 0, filter: "blur(14px)",
              },
              {
                x: 0, autoAlpha: 1, filter: "blur(0px)",
                duration: 1.25, ease: "power3.out", stagger: 0.06,
              });

            /* The fine print is the detail behind the claim, so it lands
               after it rather than with it. */
            if (meta.length) {
              tl.fromTo(meta,
                { y: 18, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" },
                0.55);
            }

            /* nothing on this panel is left holding a compositor layer for
               an animation that finished */
            tl.set([...halves, ...meta], { clearProps: "transform,filter" });
          };

          ScrollTrigger.create({
            trigger: stage!, start: "top 72%", once: true,
            /* fonts decide how wide each half is, and its width is half of
               where it has to travel from - measuring before they swap
               would build the move out of the fallback's metrics */
            onEnter: () => {
              if (document.fonts?.ready) document.fonts.ready.then(play, play);
              else play();
            },
          });
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

    foundersMM.add("(min-width: 1101px)", () => {
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
    foundersMM.add("(max-width: 1100px)", () => {
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

    /* -------------------------------------------------- the group shot
       Nothing to run. The photo used to pan across a crop window as you
       scrolled, which only exists as a move if there is picture outside
       the frame to slide to - and there is not any more: the group shot
       is shown whole, at its own 4:5, with no window and no overhang
       (see .ab-people__shot in about.css). It arrives on the shared
       engine's image reveal like every other photograph on the page. */

    /* -------------------------------------------------- the founders hold
       There used to be a climb ahead of this: the intro was pinned at the
       fold with pinSpacing off, so the founders panel was dragged up
       through the viewport as a rounded, shadowed card sliding over a
       stopped page. That is a slide transition - a rectangle flying in
       over the previous slide - and it read as one.

       It is gone, along with the card. The black-to-cream change is a
       gradient at the foot of the intro now (see .ab-intro::after in
       about.css): no pin, no cover, nothing moving except the page, and
       the colour simply changes underneath as you scroll through it.

       What is left is the hold. The join inside the founders panel is a
       fixed three seconds of choreography (see the founders block above)
       and it needs the section to stand still while it plays. pinSpacing
       stays ON: the space is reserved, so nothing below is pulled up over
       the top of it. The panel stops, the join plays, the page scrolls on.

       Skipped under 1101px, where the join does not run and the panels are
       stacked to one column anyway. */
    const holdMM = gsap.matchMedia();
    holdMM.add("(min-width: 1101px)", () => {
      const panel = document.querySelector<HTMLElement>(".ab-founders");
      if (!panel) return;

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

  return () => ctx.revert();
}
