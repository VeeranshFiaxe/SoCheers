import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   THE DECK PAGE's own scroll work.

   initSite() does the site-wide half here as it does everywhere - Lenis,
   the cursor, the progress bar, the reveals. What lives in this file is
   the part that is specific to a page which is pretending to be a
   PowerPoint.

   ---- the one idea the whole file is built on ----

   A deck has exactly two kinds of motion in it and they are both
   discrete: the slide changes, and the build lands. Nothing on a
   PowerPoint drifts. The Series tab's motion is the opposite - fourteen
   continuous mechanics, everything scrubbed, nothing with a state.

   So this file is not series-motion with different selectors. It is
   built to make a scroll feel like a deck being clicked through, and the
   difference shows up in what each function does:

     gate()  is the shared one, and the only thing borrowed wholesale.
             It is what makes both tabs read as the same site.
     push()  is the ONLY continuous tween on the page, and it is barely
             a tween - a slow drift across the still while it is on
             screen, so a slide is not a screenshot.
     lines() and build() are the clicks. They fire once, they play at
             their own speed, and they do not scrub. A sentence whose
             arrival is tied to the scroll wheel is a sentence the reader
             is scrubbing rather than reading, and every line on this
             page is a line somebody wrote to be read in a room.
     plate(), verts(), inset(), band(), cutout() are the furniture, one
             slide or two each.
     rail()  counts the deck.

   That split - one scrubbed layer under a set of triggered ones - is
   deliberate and is the whole design. Scrub the type as well and the
   page becomes the Series tab with worse pictures.

   ---- the three rules, same as the Series tab's ----

   1. Every selection is allowed to be empty. Slides come and go from
      lib/deck-content.ts and a missing piece of furniture is not an
      error.
   2. Nothing writes a transform initSite() is already writing. This
      page's headings are not [data-split] for exactly that reason - see
      lines() below.
   3. Under prefers-reduced-motion the deck still reads. Everything lands
      where it was going to land, and the builds land with it: a build
      that never arrives is a slide with half its copy missing, which is
      a content bug wearing a motion preference's clothes.
   ============================================================ */

export function initDeck(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ctx = gsap.context(() => {
    gate(reduced);
    push(reduced);
    lines(reduced);
    build(reduced);
    plate(reduced);
    verts(reduced);
    inset(reduced);
    band(reduced);
    cutout(reduced);
    rail();
  });

  return () => ctx.revert();
}

/* ------------------------------------------------------------------
   THE GATE - the letterbox, and the one piece of motion this page
   shares with the Series tab.

   Two bands, top and bottom of every slide, scaled out of the way as it
   arrives and part-way back as it leaves. Same numbers as gate() in
   lib/series-motion.ts, on purpose and to the decimal: it is the single
   device that makes two tabs built on completely different motion read
   as the same site, and the moment the two copies drift they stop doing
   that job.

   scaleY on a band whose transform-origin is its own outer edge, not
   height - height is a layout property and there are two of these on
   every one of fourteen sections.
   ------------------------------------------------------------------ */
function gate(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-dstage]").forEach((stage) => {
    const bands = stage.querySelectorAll<HTMLElement>("[data-dgate]");
    if (!bands.length) return;

    if (reduced) {
      gsap.set(bands, { scaleY: 0.18 });
      return;
    }

    gsap
      .timeline({
        scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", scrub: true },
      })
      .fromTo(bands, { scaleY: 1 }, { scaleY: 0.12, ease: "power2.out", duration: 0.34 })
      .to(bands, { scaleY: 0.12, duration: 0.32 })
      .to(bands, { scaleY: 0.72, ease: "power2.in", duration: 0.34 });
  });
}

/* ------------------------------------------------------------------
   THE PUSH - the only scrubbed thing on the page.

   Every slide in the deck is a still, and fourteen stills held dead
   still is a slideshow of screenshots. So the picture drifts: a slow
   scale and a few percent of travel across the whole time the slide is
   on screen.

   Deliberately smaller than the Series tab's held() - that page pushes
   1.00 to 1.09 across nine percent of travel. This is half of it. There,
   the movement is the beat; here, the movement's whole job is to stop a
   photograph looking pasted on, and anything more than that starts
   reading as the picture doing something, which is the one thing a
   PowerPoint's picture never does.
   ------------------------------------------------------------------ */
function push(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-dpush]").forEach((art) => {
    gsap.fromTo(
      art,
      { scale: 1.02, yPercent: -2.5 },
      {
        scale: 1.07,
        yPercent: 2.5,
        ease: "none",
        scrollTrigger: {
          trigger: art.closest(".dk-slide") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE LINES - the slide arriving.

   Every hard-broken line rises out of its own mask, one after the next.
   Which is what [data-split] does everywhere else on this site, and this
   page cannot use it: initSplits() measures where the BROWSER broke an
   element and cuts it there, and every sentence on this page is already
   cut where the DECK broke it. Running the splitter over that would
   re-wrap the deck's own line breaks at whatever width the viewport
   happens to be - which is the one thing a port of a deck must not do.

   So the spans are written by components/DeckStory.tsx and the rise is
   done here, and the numbers are initSplits()'s numbers: 120% below,
   0.95s, power3.out, 0.08 apart. Same arrival, different source of
   truth about where a line ends.

   Triggered, not scrubbed - see the note at the head of this file.
   ------------------------------------------------------------------ */
function lines(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>(".dk-slide").forEach((slide) => {
    /* the column's lines, in document order. The build's lines are in
       here too and are deliberately left alone: build() owns those, and
       two owners on one transform is the bug that reads as jitter. */
    const ln = slide.querySelectorAll<HTMLElement>(":scope .dk-col > .dk-lines [data-dline]");
    if (!ln.length) return;

    if (reduced) {
      gsap.set(ln, { yPercent: 0, autoAlpha: 1 });
      return;
    }

    gsap.fromTo(
      ln,
      { yPercent: 120, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.95,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: slide, start: "top 62%" },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE BUILD - the click.

   Five slides in this deck are the slide before them with one more block
   of type on it. In the room somebody pressed a key; here the reader
   keeps scrolling, and the block arrives when they are about two thirds
   of the way down the section - late enough that they have read what was
   already there, early enough that it lands while the slide is still
   the whole screen.

   `start: "top top+=18%"` rather than a percentage of the section,
   because the sections are svh-tall and identical: the top of the
   section passing just under the header is the same moment on every one
   of them, on any viewport, and it is the moment the reader has stopped
   arriving and started reading.

   Under reduced motion the block is simply there. A build that never
   fires is half a slide missing, and no motion preference asks for that.
   ------------------------------------------------------------------ */
function build(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-dbuild]").forEach((el) => {
    if (reduced) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el.closest(".dk-slide") as HTMLElement,
          start: "top top+=18%",
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE PLATE - the orange panel on the title card.

   The deck's own first move, and the loudest thing in the file. It
   wipes in from the left rather than fading: a flat colour that fades is
   a colour with a wrong value in the middle of it, and the deck's plate
   is a hard edge or it is nothing.

   transform-origin is on the left in the stylesheet, so this is one
   number. It runs on arrival rather than on scrub because the title card
   is the first screen of the route and there may be no scroll yet to
   scrub - a hero that needs the wheel turned before it is finished is a
   hero that is broken on landing.
   ------------------------------------------------------------------ */
function plate(reduced: boolean) {
  const el = document.querySelector<HTMLElement>("[data-dplate]");
  if (!el) return;

  if (reduced) {
    gsap.set(el, { scaleX: 1 });
    return;
  }

  gsap.fromTo(
    el,
    { scaleX: 0 },
    { scaleX: 1, duration: 1.1, ease: "power3.inOut", delay: 0.15 },
  );
}

/* ------------------------------------------------------------------
   THE VERTICALS - three episode frames on the micro-series slide.

   The deck drops them in with the build; here they rise as the reader
   travels, and they rise at three different rates. That is the one place
   this page borrows the Series tab's depth idea: three frames that move
   by different amounts are at different distances, and three that move
   together are a strip.

   Scrubbed rather than triggered, and it is the exception that proves
   the rule at the head of this file - these are pictures, not sentences,
   and nobody reads a photograph at a fixed speed.
   ------------------------------------------------------------------ */
function verts(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-dverts]").forEach((row) => {
    const frames = gsap.utils.toArray<HTMLElement>(".dk-vert", row);
    if (!frames.length) return;

    frames.forEach((f, i) => {
      gsap.fromTo(
        f,
        { yPercent: 26 + i * 9 },
        {
          yPercent: -(10 + i * 6),
          ease: "none",
          scrollTrigger: {
            trigger: row.closest(".dk-slide") as HTMLElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });
  });
}

/* ------------------------------------------------------------------
   THE INSETS - a still lifted over the ground.

   Two slides carry one: the cinema frame on the title card and the cafe
   interior that arrives with the Mokai build. Both travel further than
   the picture behind them, which is the only thing that says they are in
   front of it rather than printed on it.
   ------------------------------------------------------------------ */
function inset(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-dinset]").forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 14 },
      {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".dk-slide") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE BAND - the torn paper strip on the end card.

   It tears open. The deck has it sitting there as a graphic; a strip of
   torn paper that arrives by growing out of its own middle is the same
   graphic doing the one thing torn paper suggests, and it costs a
   scaleX.
   ------------------------------------------------------------------ */
function band(reduced: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-dband]").forEach((el) => {
    if (reduced) {
      gsap.set(el, { scaleX: 1, autoAlpha: 1 });
      return;
    }
    gsap.fromTo(
      el,
      { scaleX: 0.18, autoAlpha: 0 },
      {
        scaleX: 1,
        autoAlpha: 1,
        duration: 1.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el.closest(".dk-slide") as HTMLElement,
          start: "top 55%",
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE CUTOUT - the audience in their 3D glasses.

   On the title card and on the end card and nowhere between, which is
   the deck's own bracket: the page opens with them looking at it and
   closes with them still there. They stand nearest the reader, so they
   travel furthest - the same depth ladder the Series tab's posters use,
   with two rungs instead of five.
   ------------------------------------------------------------------ */
function cutout(reduced: boolean) {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>("[data-dcutout]").forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 18 },
      {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".dk-slide") as HTMLElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

/* ------------------------------------------------------------------
   THE RAIL - the slide counter.

   The Series tab counts episodes; this one counts slides, and it counts
   the DECK's slides rather than this page's sections. A section that is
   a build pair reads "07-08", because somebody with the PowerPoint open
   beside the browser should be able to see the two are in step - which
   is the entire claim this route is making.

   One ScrollTrigger over the whole story rather than one per slide, same
   reasoning as episodeRail() in lib/series-motion.ts: fourteen triggers
   each writing the same two nodes is fourteen chances to disagree about
   which slide is current at a boundary.
   ------------------------------------------------------------------ */
function rail() {
  const story = document.querySelector<HTMLElement>("[data-dk-story]");
  const fill = document.querySelector<HTMLElement>("[data-dk-fill]");
  const num = document.querySelector<HTMLElement>("[data-dk-num]");
  const slides = gsap.utils.toArray<HTMLElement>(".dk-slide");
  if (!story || !slides.length) return;

  let shown = "";

  ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (fill) gsap.set(fill, { scaleY: self.progress });

      /* read off the live rects rather than off progress - the sections
         are not all the same height once the builds and the asides are
         in them, so progress is not proportional to index */
      const mid = window.innerHeight / 2;
      let idx = 0;
      for (let i = 0; i < slides.length; i++) {
        if (slides[i].getBoundingClientRect().top <= mid) idx = i;
      }
      const pages = slides[idx].dataset.pages ?? "";
      if (pages !== shown && num) {
        shown = pages;
        num.textContent = pages;
      }
    },
  });

  ScrollTrigger.create({
    trigger: story,
    start: "top top+=40%",
    end: "bottom bottom",
    toggleClass: { targets: ".dk-rail", className: "is-live" },
  });
}
