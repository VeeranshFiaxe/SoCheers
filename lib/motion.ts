/* ============================================================
   SoCheers - animation engine
   GSAP + ScrollTrigger + SplitText + Lenis

   Ported from the static build. Same behaviour, but everything it
   creates is tracked so initSite() can hand back a teardown - React
   StrictMode mounts effects twice in dev and Fast Refresh re-runs
   them, so leaking tickers or ScrollTriggers here would compound.

   The roll-over spans and the pixel-grid tiles are rendered by React
   now (see components/Roll.tsx and components/PixGrid.tsx); this file
   only reads them.
   ============================================================ */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { HERO_CUE, type HeroCue, OVERTURE_DONE, OVERTURE_START, shouldRunOverture } from "./overture";
import { keepPlaying } from "./autoplay";
import { MEANING, WCARD_SFX } from "./content";
import { acquirePointerField } from "./pointer-field";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* A phone's address bar is not a resize.

   It slides away on the first scroll down and back on the first scroll
   up, and every time it does the browser fires `resize` and the visual
   viewport changes height by 60-odd pixels. ScrollTrigger's default
   answer to a resize is a full refresh - every trigger on the page
   re-measured, every pin re-laid-out - and on the pages here that is
   sixty to ninety triggers, twice, in the middle of the reader's first
   flick. It is the single worst frame on a phone and it happens on
   every page.

   Nothing on this site is laid out against that 60px: the pins are
   viewport-height and re-solve themselves, and a genuine orientation
   change still fires a real resize with a changed width, which this
   does not suppress. So the bar is allowed to come and go without the
   page being re-measured under it.

   Set at module scope rather than inside initSite() because it is a
   property of the plugin, not of a page - and the About and Series
   engines import ScrollTrigger separately. */
ScrollTrigger.config({ ignoreMobileResize: true });

type Grid = { tiles: HTMLElement[]; cols: number; rows: number };

/* The live scroller, for the one case an anchor cannot cover.

   Every a[href^="#"] on the site is bound to Lenis down in initLenis, so
   a link is still the way to move the page and this is not a second
   route to the same thing. What it is for is a scroll that has to happen
   *after* something else does: a caller that has just grown the document
   and wants to go to the new part of it, where an anchor would have left
   for the target's old position on the click that started the change.
   The AI tab's entry fork was that caller until it was removed, so
   nothing calls this today - it is kept because the failure it handles
   (below) is one any future caller of its kind will hit.

   Module-level rather than passed around: initSite() owns one scroller
   for the life of the page, and a caller that fires before it boots (or
   after reduced motion has declined to build one) simply falls through
   to the native scroll rather than needing to know. */
let active: Lenis | null = null;

/* `force`, always. Lenis refuses a scrollTo while it is stopped, and this
   site stops it in five places (the overture, the home hero's pin). All
   of them are on other pages, which is exactly why this is easy to get
   wrong later: a caller here is asking for a scroll it has already
   decided on, and "the home page happened to have the wheel locked" is
   not a reason to silently do nothing. */
export function smoothTo(target: HTMLElement | number, duration = 1.2): void {
  if (active) {
    /* Remeasured first, and this is the whole reason a scroll into
       freshly-grown page used to go nowhere. Lenis does not read the document height when it
       is asked to scroll - it keeps its own `limit` and clamps every
       target to it, and that number is refreshed by a ResizeObserver,
       which does not fire until after the frame the DOM changed in. So a
       caller that has just made the page taller and wants to go to the
       new part of it is asking a scroller that still believes the old,
       shorter page: the target is clamped to the old bottom and the
       reader lands short of it, or does not move at all.

       resize() is synchronous, so by the time scrollTo runs the limit is
       the one the reader can actually see. */
    active.resize();
    active.scrollTo(target, { duration, force: true });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function initSite(): () => void {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover:hover)").matches;
  /* The phone's column. Kept as a live MediaQueryList rather than a
     boolean read once: everything that asks it is a measuring function
     that already re-runs on resize (box(), seat(), ScrollTrigger's
     refresh), so it has to be able to change its mind - a desktop window
     dragged narrow, or a tablet turned on its side, crosses this line
     without a reload.

     700px, and it is the same number three files deep: PHONE in
     components/Overture.tsx and the phone block at the end of the OVERTURE
     section in app/globals.css. That block fits the hero artwork whole on
     a phone instead of cropping it to fill, and box() below mirrors
     whichever fit is in force to find the artwork's window - so if these
     two ever disagree, the stage seats itself somewhere the window is
     not. */
  const phone = window.matchMedia("(max-width:700px)");
  /* Where the reader's attention is, however this machine expresses it -
     a cursor, a finger, or the middle of the screen while neither is
     saying. Everything below that used to bail out on `!canHover` reads
     this instead; see lib/pointer-field.ts for why that is enough to make
     the whole expressive layer work on a phone without a second
     implementation of any of it. */
  const pointer = acquirePointerField();
  const touch = pointer.coarse;
  /* Asked once, synchronously, and answered identically over in
     components/Overture.tsx - see lib/overture.ts for why it has to be a
     pure function rather than a look at the DOM. When it is true this file
     does not run the preloader or the hero's own intro: the overture owns
     the screen until it says otherwise, and its camera move *is* the
     intro. */
  const overture = shouldRunOverture();

  const ac = new AbortController();
  const on = <K extends keyof WindowEventMap>(
    target: Window | Document | Element,
    type: K | string,
    fn: EventListenerOrEventListenerObject,
  ) => target.addEventListener(type, fn, { signal: ac.signal } as AddEventListenerOptions);

  const tickers: gsap.TickerCallback[] = [];
  const addTicker = (fn: gsap.TickerCallback) => { gsap.ticker.add(fn); tickers.push(fn); };
  const splits: SplitText[] = [];
  const observers: IntersectionObserver[] = [];
  const intervals: number[] = [];
  // anything that has to be undone by hand on teardown and is not an
  // AbortController-able DOM listener (ScrollTrigger's own event bus)
  const cleanups: (() => void)[] = [];
  let lenis: Lenis | null = null;

  const ctx = gsap.context(() => {
    /* Who gets to say how far through the page the reader is.

       The scroll bar at the top is normally just document scroll over
       document height, which is true of every page here except the one
       that matters: on the home page the hero takes the scroll away and
       plays its sequence on its own clock (see initHero). For as long as
       that lasts the document does not move at all - it is clamped to the
       pin's anchor - so the bar sat frozen through the whole opening and
       then jumped a screen's worth in one frame when the scroll was handed
       back. Which is the report: it does not account for the part that
       animates itself.

       So whoever currently owns the reader's progress can say so here.
       Returning null means "not me, use the scroll" - and every page that
       is not the home page never sets this at all. */
    let barSource: (() => number | null) | null = null;

    /* How much document there is to get through, remembered rather than
       asked for. The bar is repainted on a ticker now (initNav), and
       ScrollTrigger.maxScroll reads scrollHeight - a layout read, every
       frame, forever, for a number that only changes when the page is
       remeasured. So it is read when the page *is* remeasured instead. */
    let barMax = 0;
    const readBarMax = () => { barMax = ScrollTrigger.maxScroll(window); };

    /* Whoever is currently moving the page for the reader rather than the
       reader moving it themselves. The header hides on a downward scroll
       (initNav), and the hero's handover is a downward scroll of a whole
       screen in a single frame - so the row was being yanked off the top
       at the exact moment the definition finished, which reads as the
       header breaking rather than tucking away. While this returns true
       the header is left alone; the next gesture the reader actually makes
       is what decides. Null on every page that never sets it. */
    let navHold: (() => boolean) | null = null;

    /* -------------------------------------------------- Lenis */
    function initLenis() {
      if (prefersReduced) return;
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      active = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      addTicker((time: number) => lenis?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
        on(a, "click", (e) => {
          const id = a.getAttribute("href");
          if (id && id.length > 1) {
            const target = document.querySelector(id);
            if (target) { e.preventDefault(); lenis?.scrollTo(target as HTMLElement, { duration: 1.4 }); }
          }
        });
      });
    }

    /* -------------------------------------------------- going back to the top
       Nothing on this site says "#top" any more. The nav's Home and the
       mark in the corner are the real route, "/", and the footer's Back to
       top is a button with no href at all - so hovering them shows a page,
       not a scroll position, and clicking them leaves the address bar
       alone.

       Which leaves the behaviour to do by hand. On the page those links
       already point at, going there is a scroll: letting the browser
       follow "/" from the home page would reload the whole site - loader,
       overture and all - to arrive somewhere the reader is already looking
       at. From anywhere else it is a genuine trip home and is left alone.

       Bound outside initLenis on purpose: that one bails under reduced
       motion, and this has to work whether or not there is smooth
       scrolling to do it with. */
    function initTopLinks() {
      const toTop = () => {
        if (lenis) lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      };

      document.querySelectorAll<HTMLElement>("[data-top]").forEach((el) => {
        on(el, "click", (e) => { e.preventDefault(); toTop(); });
      });

      document.querySelectorAll<HTMLAnchorElement>('a[href="/"]').forEach((a) => {
        on(a, "click", ((e: MouseEvent) => {
          // a real navigation home, or a deliberate new tab / new window
          if (window.location.pathname !== "/") return;
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          toTop();
        }) as EventListener);
      });
    }

    /* -------------------------------------------------- pixel grids
       React renders the <i> tiles; collect them per host. */
    const grids = new Map<Element, Grid>();
    function readGrids() {
      document.querySelectorAll<HTMLElement>("[data-pixgrid]").forEach((host) => {
        grids.set(host, {
          tiles: Array.from(host.querySelectorAll("i")) as HTMLElement[],
          cols: parseInt(host.dataset.cols || "20", 10),
          rows: parseInt(host.dataset.rows || "8", 10),
        });
      });
    }

    /* -------------------------------------------------- the overture
       While the opening sequence has the screen the page underneath it must
       not move: it is sitting at the top with the hero at rest, which is
       exactly the frame the overture hands back to. Bound to events rather
       than done once, because the docked bulb can take the screen again at
       any point (see OVERTURE_REPLAY in lib/overture.ts). */
    function initOvertureBridge() {
      const html = document.documentElement;
      const lock = () => {
        html.classList.add("is-overture");
        lenis?.stop();
        window.scrollTo(0, 0);
      };
      const release = () => {
        html.classList.remove("is-overture");
        lenis?.start();
        // the lock changed the document height, so every trigger measured
        // during it is wrong
        ScrollTrigger.refresh();
      };
      on(document, OVERTURE_START, lock);
      on(document, OVERTURE_DONE, release);

      /* Every load starts at the hero, overture or not.

         The hero pin stops the page the moment it mounts, so a browser-
         restored scroll leaves the reader parked somewhere down the site
         with the scroll locked and the hero sequence still waiting to be
         played. Everything below is measured against that wrong position
         too: the stat counters and the reveals are built with their
         triggers already scrolled past, so they never run - which is why a
         plain reload used to show dead numbers where a hard reload
         (which lands at the top) showed them counting. */
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      if (overture) lock();
    }

    /* -------------------------------------------------- the door
       The count is not here any more. It is components/Loader.tsx, where
       it can be a real number: the overture's wall images and the hero
       artwork are fetched behind that black and the percentage is how far
       through them the browser actually is - which is also the only honest
       reason to hold the screen at all. It runs once per tab, in front of
       the sequence it is loading for, and a second visit to the home page
       gets no door at all.

       What is left here is the other half of the same decision. A visit
       that does not get the overture does not get a camera move arriving
       on the hero either, so the hero has to introduce itself; a visit
       that does gets nothing from this file, because the push-in at the
       end of the sequence *is* the intro and a second one would fight it. */
    function runLoader() {
      if (prefersReduced || overture) return;
      heroIntro();
    }

    /* -------------------------------------------------- hero intro

       What this used to be: the artwork arrived behind a grid of 176
       black tiles which then cleared one at a time in a random stagger -
       a block dissolve, which is the transition a slide deck reaches for
       and reads as one wherever else it turns up. The picture did not
       arrive, it was uncovered a square at a time.

       What it is now is the picture arriving. One settle - a push-in that
       eases out rather than lands, held a little longer and starting a
       little closer, so it reads as the frame coming to rest rather than
       as an entrance - and the scroll cue afterwards. No tiles, no
       stagger, nothing on the artwork with a corner in it.

       The grid itself is still in the file (components/PixGrid.tsx) and
       still used by the featured-work tiles; it is the hero that no
       longer carries one. */
    function heroIntro() {
      if (prefersReduced) return;

      const tl = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
      // the stage photo sits inside the same window as the artwork, so it
      // rides the same settle
      tl.from("[data-frame-img], [data-stage-img]",
        { scale: 1.06, autoAlpha: 0, duration: 2.0, ease: "power2.out" }, 0);
      // the greeting is written on the frame, so it follows the frame in
      // rather than arriving with it
      tl.from(".hero__greet", { autoAlpha: 0, y: 12, duration: 0.9, ease: "power2.out" }, 0.5);
      tl.from("[data-hero-cue]", { autoAlpha: 0, duration: 0.6 }, 1.0);
    }

    /* -------------------------------------------------- hero pinned sequence
       Phase 1: the window inside the SOC▢HEERS artwork grows to full screen
       while the artwork pushes in and dissolves.
       Phase 2: more images stack on top of it. One pin, one continuous scroll. */
    const FRAME = { w: 1914, h: 1073 };          // artwork natural size
    // measured window (pixel scan of the artwork: x 771-1147, y 351-728), as a fraction of it
    const WIN = { l: 0.4028, t: 0.3271, w: 0.197, h: 0.3523 };
    // the same crowd shot, full size. The uncropped frame - not a square
    // slice of it - is what the stage grows into, so the photo is stretched
    // no further than object-fit:contain would stretch it and never needs
    // to be blown up past a sane size.
    const PHOTO = { w: 1919, h: 1079 };
    const PWIN = { l: 0, t: 0, w: 1, h: 1 };

    // Where the grown window ends up: contained within the viewport at the
    // photo's own aspect ratio (a landscape rectangle, not a square) so
    // covering it is close to 1:1 scale, never full-bleed. The margin left
    // on the constraining side is where the blurred backdrop shows through.
    const CONTAIN_MARGIN = 0.94;
    function containedBox(bw: number, bh: number) {
      const aspect = PHOTO.w / PHOTO.h;
      let h = bh * CONTAIN_MARGIN, w = h * aspect;
      if (w > bw * CONTAIN_MARGIN) { w = bw * CONTAIN_MARGIN; h = w / aspect; }
      return { left: (bw - w) / 2, top: (bh - h) / 2, w, h };
    }

    // where phase 2 leaves the stage: scaled about its own centre, dimmed
    const STAGE_REST = 1.05;

    function initHero() {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const pin = document.querySelector<HTMLElement>("[data-hero-pin]");
      const frame = document.querySelector<HTMLElement>("[data-frame]");
      const backdrop = document.querySelector<HTMLElement>("[data-hero-backdrop]");
      const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
      const photo = document.querySelector<HTMLElement>("[data-stage-img]");
      const tint = document.querySelector<HTMLElement>("[data-stage-tint]");
      const vignette = document.querySelector<HTMLElement>("[data-stage-vignette]");
      const entry = document.querySelector<HTMLElement>("[data-meaning]");
      if (!hero || !pin || !frame || !stage) return;
      const boxEnd = () => containedBox(pin.offsetWidth, pin.offsetHeight);

      // Where the artwork's window lands on screen. The artwork is
      // object-fit:cover on a wide screen and object-fit:contain on a phone
      // (see .hero__frame in globals.css - a column through this artwork
      // keeps the window and slices the wordmark off either side of it), so
      // mirror whichever of the two is in force to find the window's real
      // rendered rect. Both fits are the same line with the max/min swapped:
      // cover scales until neither axis is short, contain until neither
      // overflows.
      const box = () => {
        const bw = pin.offsetWidth, bh = pin.offsetHeight;
        const scale = phone.matches
          ? Math.min(bw / FRAME.w, bh / FRAME.h)
          : Math.max(bw / FRAME.w, bh / FRAME.h);
        const rw = FRAME.w * scale, rh = FRAME.h * scale;
        const ox = (bw - rw) / 2, oy = (bh - rh) / 2;
        return { left: ox + rw * WIN.l, top: oy + rh * WIN.t, w: rw * WIN.w, h: rh * WIN.h };
      };

      // Blow the photo up around a named region of itself so that region exactly
      // fills the stage - uniform scale, window centre on stage centre, growing to
      // cover if the stage ever gets taller than the region. At rest that region
      // is the artwork's window (PWIN below tracks it 1:1 as the stage grows),
      // so the photo sits seamlessly inside the artwork before it ever moves.
      const fit = (el: HTMLElement | null, nat: { w: number; h: number }, win: typeof WIN) => {
        if (!el) return;
        const sw = stage.offsetWidth, sh = stage.offsetHeight;
        let cw = sw / win.w, ch = cw * (nat.h / nat.w);
        if (ch * win.h < sh) { const k = sh / (ch * win.h); cw *= k; ch *= k; }
        gsap.set(el, {
          width: cw, height: ch,
          x: sw / 2 - (win.l + win.w / 2) * cw,
          y: sh / 2 - (win.t + win.h / 2) * ch,
        });
      };
      const fitCrop = () => { fit(photo, PHOTO, PWIN); };

      // publish where the window's centre sits relative to the viewport centre,
      // so the nav links can sit exactly above it (the window is not quite
      // centred in the artwork, and cover-fitting shifts it further)
      const publishCentre = () => {
        const b = box();
        const dx = b.left + b.w / 2 - pin.offsetWidth / 2;
        document.documentElement.style.setProperty("--hero-cx", `${dx.toFixed(2)}px`);
      };
      publishCentre();
      on(window, "resize", publishCentre);
      const seat = () => {
        const b = box();
        gsap.set(stage, { x: b.left, y: b.top, width: b.w, height: b.h });
        fitCrop();
      };

      if (prefersReduced) {
        // no scroll sequence: park the photo contained (not full-bleed) and keep it fitted
        const still = () => {
          const b = boxEnd();
          gsap.set(stage, { x: b.left, y: b.top, width: b.w, height: b.h });
          fitCrop();
        };
        still();
        on(window, "resize", still);
        gsap.set(frame, { autoAlpha: 0 });
        gsap.set(photo, { autoAlpha: 1 });
        gsap.set(tint, { autoAlpha: 0 });
        gsap.set(backdrop, { autoAlpha: 1 });
        gsap.set(vignette, { autoAlpha: 1 });   // already at rest, so already expanded
        // the entry is simply there, already written
        gsap.set(entry, { autoAlpha: 1 });
        return;
      }

      // one-off: paints the correct pre-scroll frame before the scrubbed
      // timeline below has rendered anything. Not bound to resize - once
      // that timeline exists, ScrollTrigger's own resize -> refresh (below,
      // invalidateOnRefresh:true) is what has to own re-seating the stage,
      // because it re-renders at the *actual* current scroll progress. A
      // plain resize -> seat() binding would instead force the tiny
      // pre-scroll box every time, even deep into the pin, and leave it
      // stuck there (outside the scrub) until the next scroll event - the
      // frozen-small-box-top-left glitch on a mid-hero reload.
      seat();
      gsap.set(tint, { autoAlpha: 1 });
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(vignette, { autoAlpha: 0 });

      /* Timeline shape, as fractions of the pin:
           0 ──── EXPAND ──── +HOLD0 ──── ENTRY (the definition) ──── hold ──── 1 */
      const EXPAND = 0.30;                        // window finishes filling the screen here
      const HOLD0 = 0.03;                         // the photo holds, undisturbed, before the type
      const ENTRY = 0.44;                         // the entry writes itself in
      const AT = EXPAND + HOLD0;                  // where the entry starts
      // the remaining ~0.18 is the hold on the finished entry before the pin releases

      gsap.set(entry, { autoAlpha: 1 });

      /* Not scrubbed. A scrub ties every frame of this to the raw scroll
         delta, which is exactly what made it fall apart under a fast or
         hesitant scroll - half a gesture left it half-finished, and a fast
         one made it stutter, chasing scroll events instead of running its
         own clock. This timeline is paused and driven by hand (below): a
         small scroll is just an intent - "go" - and once it fires, the
         whole beat plays out on GSAP's own ticker at a fixed pace, the
         same every time, no matter how the trigger was scrolled. */
      const tl = gsap.timeline({ paused: true });

      /* - phase 1 · the window opens up -
         The window is the photo itself the whole time - it starts blue-tinted
         to read as the artwork's own window, then the tint fades off as the
         window grows, so there is nothing to cross-fade and no seam. */
      // power2.out, not inOut: an eased-in start meant the first stretch of
      // scroll showed almost no growth, compounding the long-runway feel
      tl.fromTo(stage,
        { x: () => box().left, y: () => box().top, width: () => box().w, height: () => box().h },
        { x: () => boxEnd().left, y: () => boxEnd().top, width: () => boxEnd().w, height: () => boxEnd().h,
          duration: EXPAND, ease: "power2.out", onUpdate: fitCrop }, 0);
      /* The one tween whose values are pixels off the current viewport, kept
         so a viewport change can make it read them again - see remeasure()
         below. It is the first thing added to tl, so it is child 0. */
      const grow = tl.getChildren(false, true, false)[0] as gsap.core.Tween;
      // the artwork pushes toward the viewer and dissolves as its window takes over
      tl.to("[data-frame-img]", { scale: 1.45, duration: EXPAND, ease: "power2.out" }, 0);
      tl.to(tint, { autoAlpha: 0, duration: EXPAND * 0.75, ease: "power1.inOut" }, EXPAND * 0.1);
      // the blurred backdrop arrives on the same beat, so the letterboxed
      // margin never reads as an empty gap once the photo takes over
      tl.to(backdrop, { autoAlpha: 1, duration: EXPAND * 0.42, ease: "power1.inOut" }, EXPAND * 0.22);
      tl.to(frame, { autoAlpha: 0, duration: EXPAND * 0.6, ease: "power2.in" }, EXPAND * 0.35);
      tl.to("[data-hero-cue]", { autoAlpha: 0, duration: 0.04 }, 0.02);
      // only once the stage is done growing - the small window never gets it
      tl.to(vignette, { autoAlpha: 1, duration: EXPAND * 0.25, ease: "power1.out" }, EXPAND * 0.8);

      /* - phase 2 · the name gets defined, over the photo -
         The photo does not go anywhere. It settles back a touch and dims under
         a scrim so the type has something to sit on, then the entry arrives in
         reading order: headword, phonetics, part of speech, then each sense.
         Offsets below are fractions of ENTRY, so retiming the phase is one
         number. */
      const E = (f: number) => AT + ENTRY * f;

      /* The photo eases back and dims - it becomes the page, not the subject.
         fromTo with an explicit starting filter, never to(): from a computed
         `filter:none` GSAP reads every missing component as 0, not 1, so a
         plain to() ramps brightness 0 → .5 and the screen goes black first. */
      tl.fromTo(stage,
        { scale: 1, filter: "brightness(1) saturate(1)" },
        { scale: 1.05, filter: "brightness(.55) saturate(.7)",
          duration: ENTRY * 0.4, ease: "power1.inOut" }, AT);
      tl.fromTo("[data-meaning-veil]",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: ENTRY * 0.4, ease: "power1.inOut" }, AT);

      // the headword types itself in, one letter at a time - steps(1) so
      // each character snaps straight to visible instead of fading, which
      // is what actually reads as typing rather than a staggered fade-in.
      // Fast and punchy on purpose: the whole word is done in a fraction of
      // the budget the old drop-in used.
      tl.fromTo("[data-meaning-word]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0 }, E(0.12));
      tl.fromTo("[data-meaning-char]",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: ENTRY * 0.02, stagger: ENTRY * 0.017, ease: "steps(1)" },
        E(0.12));
      tl.fromTo("[data-meaning-caret]",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: ENTRY * 0.02 }, E(0.12));
      tl.to("[data-meaning-caret]",
        { autoAlpha: 0, duration: ENTRY * 0.05 },
        E(0.12) + ENTRY * 0.017 * (MEANING.word.length - 1) + ENTRY * 0.06);
      tl.fromTo("[data-meaning-say]",
        { autoAlpha: 0, scale: 0.3 },
        { autoAlpha: 1, scale: 1, duration: ENTRY * 0.22, ease: "back.out(2.4)" }, E(0.34));

      // phonetics and part of speech
      tl.fromTo("[data-meaning-meta]",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: ENTRY * 0.22, stagger: ENTRY * 0.05, ease: "power2.out" },
        E(0.34));

      // the rule draws itself, then the senses land on it one at a time
      tl.fromTo("[data-meaning-rule]",
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: "left center", duration: ENTRY * 0.28, ease: "power3.inOut" },
        E(0.44));
      tl.fromTo("[data-meaning-sense]",
        { autoAlpha: 0, x: -34 },
        { autoAlpha: 1, x: 0, duration: ENTRY * 0.28, stagger: ENTRY * 0.12, ease: "power3.out" },
        E(0.54));

      // the closing note, once every sense has landed
      tl.fromTo("[data-meaning-note]",
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: ENTRY * 0.2, ease: "power2.out" },
        E(1.1));

      /* - phase 3 · the frame gives way -
         The whole hero comes apart from the bottom up and WHO WE ARE is
         behind it. Not a slab laid over the next section: .who is pulled up
         a screen (globals.css), so once this phase finishes it is already
         sitting under the hero waiting, and what the grains uncover is the
         real section arriving rather than black. */
      const CRUMBLE = 100 / 260;
      dissolve(tl, 1, CRUMBLE, pin, stage);

      /* -------------------------------------------------- the sequencing
         Three checkpoints on tl's own clock - REST (nothing has happened
         yet), HOLD (the window is full screen and the entry is written -
         a resting frame, not a mid-animation one) and DONE (crumbled away,
         WHO WE ARE uncovered). A scroll intent in either direction just
         asks "which checkpoint next" - it never sets a position itself, so
         a twitchy trackpad and a single hard flick produce the same beat. */
      // HOLD sits just short of 1, not on it: the crumble's handover to the
      // grain grid is an instant .set() planted exactly at time 1 (below),
      // so parking the hold checkpoint there would have every "rest" frame
      // land mid-swap instead of on the finished entry.
      const REST = 0, HOLD = 0.97, DONE = 1 + CRUMBLE;
      type Stage = "rest" | "hold" | "done";
      let phase: Stage = "rest";
      let busy = false;
      let cooldown = 0;
      /* Whether a scroll gesture is currently ours to intercept. Not the
         same thing as `phase !== "done"`: after the crumble finishes,
         phase is "done" but locked is also false because we have just
         handed scrolling back to the page - and scrolling back up into
         the pin from WHO WE ARE re-locks with phase still "done" (that is
         the state being reversed out of), so the two have to be tracked
         separately or the reverse gesture has nothing listening for it. */
      let locked = true;
      /* A short grace window opened the moment scrolling is handed back to
         the page. Nothing may claim the gesture again until it lapses.
         Without it the handover was a coin toss: Lenis is still carrying
         the momentum of the flick that finished the crumble, and it settles
         on the pin's end with sub-pixel wobble, so a single stray upward
         frame - or one jitter tick from a trackpad - read as "the reader is
         coming back up" and dragged the whole hero back onto the screen a
         beat after it had fallen away. */
      let handoff = 0;
      const settling = () => performance.now() < handoff;

      /* The pin exists purely to hold the layout - a spacer exactly one
         viewport tall, cancelled out by .who's own --screen margin (globals.css)
         so it sits right at the hero's natural bottom edge with no gap. It
         does not drive anything: scrub is off, and the section only ever
         moves through this space in one jump (below), never by scrolling
         through it a pixel at a time. */
      /* Both callbacks bail during a refresh. ScrollTrigger re-evaluates
         every trigger's state on refresh and fires the crossings it thinks
         it found, which on this pin is not a reader moving - it is a
         remeasure. Acting on those is what let a late refresh re-lock the
         pin, or reverse the hero out of a crumble that had already finished
         (see `reassert` below for the other half). */
      // ScrollTrigger.isRefreshing is real (it is set around refreshAll's
      // own _updateAll pass, which is where those crossings come from) but
      // it is missing from the shipped typings.
      const refreshing = () =>
        (ScrollTrigger as unknown as { isRefreshing?: boolean }).isRefreshing === true;
      /* Nothing in here may run until everything it reaches for exists.
         ScrollTrigger evaluates a trigger the moment it is created and
         fires whatever crossings it finds, and every one of these
         callbacks calls a `const` declared further down this function -
         so a crossing found during create() is a ReferenceError out of
         the temporal dead zone, thrown from inside ScrollTrigger.create.
         boot()'s step() catches it and the page carries on looking almost
         fine: the pin is half-built, the scroll was never taken, no
         gesture is ever listened for, and the sequence simply cannot be
         played. Which is the failure being chased here - it depends on
         where the browser put the reader on load, so it is per-machine
         and per-visit rather than per-build. The initial state is asserted
         by hand below anyway (locked, held, Lenis stopped), so there is
         nothing for a crossing to tell us at this point. */
      /* ScrollTrigger's own wrapper round the pinned hero, looked up
         rather than remembered: it does not exist until the trigger below
         has been built, and a refresh can rebuild it. Returns null before
         then and on any load where the pin was never spacered, which is
         the same condition html.is-pinned is keyed off. */
      const spacer = () => {
        const p = hero.parentElement;
        return p && p.classList.contains("pin-spacer") ? p : null;
      };

      let wired = false;
      const st = ScrollTrigger.create({
        trigger: hero, start: "top top", end: "+=100%", pin: true,
        onEnter: () => { if (!wired || refreshing()) return; locked = true; hold(); lenis?.stop(); },
        onEnterBack: () => { if (!wired || refreshing()) return; reclaim(); },
        /* Forward out of the pin while we still think we own the scroll.
           With the clamp below in place this should be unreachable, but if
           anything ever gets the reader past the hero without the sequence
           having been played - a scroll the browser refused to let us
           cancel, an extension, an in-page find - the page must not be left
           with Lenis stopped and the hero frozen half-told. Settle the
           timeline on its end state and hand the scroll back. */
        onLeave: () => {
          if (!wired || refreshing() || !locked) return;
          gsap.killTweensOf(tl);
          tl.time(DONE);
          phase = "done";
          busy = false;
          release();
        },
      });

      /* The margin and the space it cancels, claimed together and only once
         the space is real. ScrollTrigger wraps a pinned trigger in its own
         .pin-spacer, so the presence of that wrapper is the one honest
         answer to "is there a screen of spare scroll under the hero" - and
         it is the answer `html.is-pinned .who { margin-top:calc(var(--screen)
         * -1) }` in globals.css is betting on. (--screen is one viewport,
         100vh on a desktop and 100svh on a phone; it is a token because the
         hero's box, the pin's box and that margin all have to agree on the
         same number.) Claimed before the pin was built, that
         bet was blind: any load where the pin did not come out the other
         side (an older browser, a throw inside ScrollTrigger, a layout it
         refused to spacer) still got the margin, and WHO WE ARE was dragged
         a screen up and parked under the hero's opaque black. That is the
         "the section just isn't there" report. Now the class cannot exist
         without the spacer, and it leaves with it. */
      const spaced = () => hero.parentElement?.classList.contains("pin-spacer") === true;
      const claimPin = () => {
        document.documentElement.classList.toggle("is-pinned", spaced());
        if (!spaced()) console.warn("[socheers] hero pin has no spacer - WHO WE ARE left in place");
      };
      claimPin();
      // the spacer is torn down and rebuilt across refreshes; re-answer with it
      ScrollTrigger.addEventListener("refresh", claimPin);
      cleanups.push(() => {
        ScrollTrigger.removeEventListener("refresh", claimPin);
        document.documentElement.classList.remove("is-pinned");
      });
      /* Where the page is held while the sequence owns the screen. Not
         always the pin's start: coming back up into a finished hero
         re-takes the lock from wherever the reader already is, and yanking
         them to the top of the pin to do it would be a jump. Anywhere
         inside the pin shows the same fixed hero, so the anchor is
         whatever position the lock was taken at, kept inside the pin's own
         range - and re-clamped after every refresh, since that range moves
         with the viewport. */
      let anchor = 0;
      const hold = (y?: number) => {
        const lo = st.start, hi = Math.max(lo, st.end - 2);
        anchor = Math.min(Math.max(y ?? lo, lo), hi);
      };
      hold();

      /* -------------------------------------------------- the scroll bar
         What the bar should read while the hero owns the scroll. The pin
         is a real screen of document - the reader will be put on the far
         side of it the moment the sequence finishes - so the sequence's
         own clock is mapped straight onto that range: REST is the top of
         the pin, DONE is its end, and everything the timeline does in
         between moves the bar exactly as far as scrolling through the pin
         would have. The handover then costs nothing visually, because the
         bar is already sitting on the number the released scroll lands on.

         Read live rather than pushed, so a resize (which moves both the
         pin's range and the document height under it) is answered by the
         next frame rather than by a stale value. */
      const heroProgress = () => {
        if (barMax <= 0) readBarMax();
        if (barMax <= 0) return 0;
        const span = Math.max(st.end - st.start, 1);
        const t = Math.min(Math.max(tl.time() / DONE, 0), 1);
        return Math.min((st.start + span * t) / barMax, 1);
      };
      barSource = () => (locked ? heroProgress() : null);
      cleanups.push(() => { barSource = null; });

      /* The header sits still for the whole of the sequence and for the
         grace window after it - the scroll it would be reacting to is ours,
         not the reader's. */
      navHold = () => locked || settling();
      cleanups.push(() => { navHold = null; });

      // the hero is on screen at rest as soon as it mounts - lock the page
      // right away rather than waiting for a scroll event to discover it
      lenis?.stop();

      // hand scroll back to the page, seated just past where the pin ends -
      // the crumble already carried the picture, so nothing visibly moves,
      // and normal scroll just continues into WHO WE ARE. Just past, not
      // exactly on it: the pin's end boundary is where onEnterBack lives,
      // and landing dead on it left the reader one rounding error away from
      // being pulled back inside.
      const release = () => {
        locked = false;
        handoff = performance.now() + 700;
        /* And the hero stops taking the pointer.

           .hero is z-index 5 and WHO WE ARE is z-index 0 with a negative
           margin that pulls it a whole screen up underneath it
           (html.is-pinned .who, globals.css) - which is the mechanic that
           lets the crumble uncover that section rather than black. The
           cost of it is that .hero__pin stays a full-screen box on top of
           WHO WE ARE for the entire time that section is on screen, and a
           box on top eats every mouseenter aimed at what is under it. So
           the counts were unhoverable: the pointer never reached .stat,
           :hover never matched, and the figures never took their colour.

           Once the crumble has run, the hero has nothing left to draw and
           nothing left to click, so it gets out of the way. Put back by
           reclaim() below, because coming back up into the pin makes the
           hero the live screen again.

           The spacer has to be told separately. ScrollTrigger wraps a
           pinned trigger in a .pin-spacer of its own and copies the
           trigger's position and z-index onto it, so the box actually
           sitting over WHO WE ARE is that wrapper - an element no
           stylesheet here authored and one the `.hero.is-spent *` rule
           cannot reach, since it is the hero's PARENT rather than a
           descendant. Hence a property written by hand rather than a
           second class: it is the one node in this whole arrangement that
           does not belong to us. */
        hero.classList.add("is-spent");
        spacer()?.style.setProperty("pointer-events", "none");
        lenis?.scrollTo(st.end + 2, { immediate: true, force: true });
        lenis?.start();
        ScrollTrigger.update();
      };

      /* Late refreshes are the other half of the unreliability, and the
         reason it only ever misbehaved on the first load or two. The hero
         sequence is usually played before the page has finished loading, so
         `window.load` and `fonts.ready` fire their ScrollTrigger.refresh()
         either mid-sequence or seconds after the reader has been handed the
         page back; a refresh remeasures the pin and restores scroll, and
         where it put the reader decided what happened next. Rather than
         leave that to the remeasure, the state we know to be true is
         re-asserted on the far side of every refresh. */
      const reassert = () => {
        if (phase === "done" && !locked) {
          handoff = performance.now() + 300;
          lenis?.scrollTo(st.end + 2, { immediate: true, force: true });
          lenis?.start();
        } else if (locked) {
          hold(anchor);
          lenis?.stop();
        }
      };
      ScrollTrigger.addEventListener("refresh", reassert);
      cleanups.push(() => ScrollTrigger.removeEventListener("refresh", reassert));

      /* And the geometry is the other half of it. `grow` carries the stage's
         rectangle as function-based values, which GSAP evaluates once and
         then caches for the life of the tween; every other timeline in here
         is scrubbed, so ScrollTrigger's own invalidateOnRefresh re-reads
         them for free. This one is paused and driven by hand (below), so
         nothing ever re-renders it on its own - after the viewport changes
         size (a window drag, F11 in or out of full screen) the photo is
         still sitting on the old screen's numbers, off its mark and stuck
         there until a reload. That is what the reload was fixing.

         A refresh is where the pin is remeasured, so re-read here too and
         repaint the frame the timeline is currently parked on. Only this
         tween is invalidated, never the whole timeline: the plain to()s
         around it record their start values from the DOM, so invalidating
         them at rest-after-expand would record the *end* state as the start
         and the artwork would have nothing to come back to on the way up.
         Events suppressed - this is a remeasure, not a playthrough, and the
         crumble's handover .set()s must not fire a second time. */
      const remeasure = () => {
        grow.invalidate();
        grow.render(grow.totalTime(), true, true);
        fitCrop();
      };
      ScrollTrigger.addEventListener("refresh", remeasure);
      cleanups.push(() => ScrollTrigger.removeEventListener("refresh", remeasure));

      const play = (time: number, duration: number, onDone?: () => void) => {
        // one clock on this timeline, ever. Two overlapping tweens on
        // tl.time fight, and the loser's onComplete never runs - which left
        // `busy` stuck true and the hero frozen wherever it happened to be.
        gsap.killTweensOf(tl);
        busy = true;
        gsap.to(tl, {
          time, duration, ease: "none", overwrite: true,
          onInterrupt: () => { busy = false; },
          onComplete: () => { busy = false; cooldown = performance.now() + 420; onDone?.(); },
        });
      };

      /* -------------------------------------------------- driven from outside
         The /test cut's projector reveals the crowd photo and then the
         definition over it, so the hero it hands back to has to already
         be at one of those frames rather than at its first. Nothing on
         the live site sends this - see HERO_CUE in lib/overture.ts - and
         it deliberately goes through the same play() and the same `phase`
         the reader's own scroll does, so whatever it leaves behind is a
         state the rest of this machine already knows how to reverse out
         of and carry on from. */
      on(document, HERO_CUE, ((e: CustomEvent<HeroCue>) => {
        const to = e.detail?.at === "defined" ? HOLD : AT;
        const next: Stage = e.detail?.at === "defined" ? "hold" : "rest";
        const run = Number(e.detail?.run) || 0;
        gsap.killTweensOf(tl);
        if (run > 0) {
          phase = next;
          play(to, run);
        } else {
          busy = false;
          phase = next;
          tl.time(to);
          fitCrop();
        }
      }) as EventListener);

      const advance = () => {
        if (phase === "rest") { phase = "hold"; play(HOLD, 2.6); return; }
        if (phase === "hold") { phase = "done"; play(DONE, 1.5, release); return; }
        // Already crumbled, yet still holding the scroll. Nothing is left to
        // advance into and the pinned screen is empty, so this used to be a
        // dead end - a reader stranded on the black wall with scrolling
        // eaten. Whatever put us here, the answer is the same: give the
        // page back.
        if (locked) release();
      };
      const retreat = () => {
        if (phase === "hold") { phase = "rest"; play(REST, 1.5); return; }
        if (phase === "done") { phase = "hold"; play(HOLD, 1.3); }
      };

      /* Taking the scroll back as the reader comes up into the pin.
         Being inside the pin at DONE is not a state anyone should ever sit
         in: the hero has already come apart, so the pinned screen is empty
         - the blank black wall. The only reason to be here is to reverse
         out of it, so re-entry *is* the trigger for the reverse rather than
         something that merely re-arms it. Previously the first flick up was
         swallowed re-locking the scroll and the reader was parked in that
         empty frame until a second one arrived, which is why it only ever
         looked right when you were already scrolling up from further down. */
      const reclaim = () => {
        if (locked || settling()) return;
        locked = true;
        /* the hero owns the screen again, so it takes the pointer back -
           see release() for what this is and why */
        hero.classList.remove("is-spent");
        spacer()?.style.removeProperty("pointer-events");
        /* Where the reverse is taken from, and it cannot be "wherever the
           gesture left the page" once the hero has crumbled.

           Anywhere inside the pin shows the same fixed hero - true, but
           only while there is a hero left to show. At `done` there is not:
           the frame has fallen away and what is behind it is WHO WE ARE,
           sitting a screen up (html.is-pinned .who, globals.css) and
           therefore lined up with the top of the screen at ONE scroll
           position - the pin's end. Lock anywhere short of that and the
           section is left hanging a few hundred pixels down the screen
           with black above it, and it stays there, because the lock's own
           clamp is now happily holding it: that is the gap.

           So the reverse starts from the end of the pin, put there rather
           than waited for. force, because Lenis is about to be stopped and
           a stopped Lenis ignores a plain scrollTo; and ScrollTrigger is
           told by hand, since a scroll it did not see is a pin transform
           it has not caught up with. */
        const at = phase === "done"
          ? Math.max(st.start, st.end - 2)
          : window.scrollY;
        hold(at);
        lenis?.stop();
        if (Math.abs(window.scrollY - anchor) > 1) {
          if (lenis) lenis.scrollTo(anchor, { immediate: true, force: true });
          else window.scrollTo(0, anchor);
          ScrollTrigger.update();
        }
        if (phase === "done" && !busy) retreat();
      };

      /* The overture holds the screen with the hero already mounted and
         already locked underneath it, so every gesture aimed at the intro -
         and an intro that runs this long collects a few - was landing on
         the hero's state machine instead. Scroll twice while the bulb is
         still swinging and the sequence had spent both its phases behind
         the curtain: the definition wrote itself onto a photo nobody could
         see, and what the overture handed back was a hero that had already
         happened. Nothing may be spent until the screen is actually ours. */
      const overtureOwns = () =>
        document.documentElement.classList.contains("is-overture");
      const canAct = () => !overtureOwns() && !busy && performance.now() > cooldown;
      const intent = (dir: 1 | -1) => {
        if (!canAct()) return;
        if (dir > 0) advance(); else retreat();
      };

      // non-passive: the whole point is to eat the scroll while the sequence
      // is being decided or played, and only ever let the browser actually
      // move once the sequence is done with it
      /* Heading back up while sitting at the pin's end: claim the gesture
         here rather than letting the page carry into the pin first and
         relying on onEnterBack to notice. Lenis smooth-scrolls with
         momentum, so by the time that fires the reader has already been
         moved a chunk of the way into the empty frame. */
      const returning = (up: boolean) =>
        !locked && !settling() && up && phase === "done" && window.scrollY <= st.end;

      /* A wheel notch, in pixels, whatever the browser chose to measure it
         in. deltaY is only pixels when deltaMode is 0, and nothing
         guarantees that: Firefox reports a mouse wheel in *lines*
         (deltaMode 1, deltaY of 3 per notch) and keeps pixels for the
         trackpad, and deltaMode 2 is whole pages. Read raw, the deadzones
         below - 4px to act, 8px to come back up - threw every line-mode
         notch away, so on Firefox with a mouse the hero could not be
         advanced at all: the scroll was eaten by the lock and the sequence
         never moved. Same multipliers Lenis normalises with, so the two
         agree about how big a gesture is. */
      const LINE_PX = 100 / 6;
      const wheelPx = (e: WheelEvent) =>
        e.deltaY * (e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1);

      const onWheel = (e: WheelEvent) => {
        const dy = wheelPx(e);
        if (!locked) {
          // a real gesture, not the tail of the one that finished the
          // crumble: coming back up costs the same deadzone as everything
          // else, or momentum wobble reverses the hero on its own
          if (Math.abs(dy) < 8) return;
          if (!returning(dy < 0)) return;
          if (e.cancelable) e.preventDefault();
          reclaim();                     // starts the reverse itself
          return;
        }
        // cancelable is not a given. Chrome stops making wheel events
        // cancelable once it has decided the main thread is too busy to be
        // asked (the "input event was delayed" intervention) and scrolls on
        // the compositor instead, which is why the lock leaked on slower
        // machines and held on fast ones. preventDefault is still the first
        // line of defence; the scroll clamp below is what makes it not
        // matter when the browser declines.
        if (e.cancelable) e.preventDefault();
        if (Math.abs(dy) < 4) return;
        intent(dy > 0 ? 1 : -1);
      };
      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
      const onTouchMove = (e: TouchEvent) => {
        const y = e.touches[0]?.clientY ?? touchY;
        const dy = touchY - y;
        if (!locked) {
          if (Math.abs(dy) < 10) return;
          if (!returning(dy < 0)) return;
          e.preventDefault();
          reclaim();
          return;
        }
        if (e.cancelable) e.preventDefault();
        if (Math.abs(dy) < 6) return;
        touchY = y;
        intent(dy > 0 ? 1 : -1);
      };

      /* The rest of the ways a page moves.

         Wheel and touch were the whole input layer, and they are only two
         of them: space, page up/down, the arrows, home/end, dragging the
         scrollbar, middle-click autoscroll and find-in-page all move the
         document without ever producing a wheel event. On a trackpad you
         never notice; on a laptop where the reader reaches for the space
         bar or the scrollbar - which is most of them - the gesture went
         straight past the hero with the sequence unplayed and left the
         engine holding a lock on a page that had already moved. The keys
         are given the same meaning a notch of wheel has; everything else
         is caught by the clamp below. */
      const KEYS_FWD = new Set([" ", "Spacebar", "PageDown", "ArrowDown", "End"]);
      const KEYS_BACK = new Set(["PageUp", "ArrowUp", "Home"]);
      const onKey = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        /* Never a key that already means something where it landed: typed
           into a field, or space on a focused control - the skip button
           and the entry's speaker are both reachable that way, and taking
           the space bar off them would be trading one broken thing for
           another. */
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable
          || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)
          || t.getAttribute("role") === "button")) return;
        const fwd = KEYS_FWD.has(e.key);
        if (!fwd && !KEYS_BACK.has(e.key)) return;
        if (!locked) {
          if (!returning(!fwd)) return;
          e.preventDefault();
          reclaim();
          return;
        }
        e.preventDefault();
        intent(fwd ? 1 : -1);
      };

      /* The lock itself, rather than the promise of one.

         Everything above asks the browser not to scroll. This checks
         whether it listened. While the sequence owns the screen the
         document belongs on its anchor, so any scroll that lands somewhere
         else - an uncancelable wheel event, a scrollbar drag, a key we do
         not know about, a browser that scrolled first and told us after -
         is put straight back. This is the piece that was missing: the whole
         hold rested on preventDefault, and a scroll the browser would not
         let us cancel walked right through it - which is exactly the "it
         plays for us and not for them" split, since whether the browser
         cancels depends on the machine rather than on the page.

         With one deliberate way out. If the reader has somehow ended up
         more than a screen and a half from the pin, something has gone
         wrong that clamping cannot fix, and trapping them against the top
         of a page they are trying to leave is worse than an unplayed
         sequence: give the scroll back instead. */
      const onScroll = () => {
        if (refreshing()) return;
        /* Drifted back inside the pin with nobody holding it.

           reclaim() refuses during the grace window after the handover
           (settling(), above) and onEnterBack only fires on the crossing
           itself - so a flick up taken in that first fraction of a second
           is carried into the pin by Lenis's own momentum and then never
           answered, because the one event that would have answered it has
           already been and gone. What is left on screen is the pin with
           nothing drawn in it: black, and WHO WE ARE showing through part
           way down. Scroll events keep coming while that momentum plays
           out, so the crossing is re-asked here, every frame the reader is
           somewhere they should not be. */
        if (!locked) {
          if (phase === "done" && !settling() && window.scrollY < st.end - 4) reclaim();
          return;
        }
        const at = anchor;
        const off = window.scrollY - at;
        if (Math.abs(off) < 2) return;
        if (off > window.innerHeight * 1.5) {
          console.warn("[socheers] hero lock overrun - releasing");
          gsap.killTweensOf(tl);
          tl.time(DONE);
          phase = "done";
          busy = false;
          release();
          return;
        }
        if (lenis) lenis.scrollTo(at, { immediate: true, force: true });
        else window.scrollTo(0, at);
      };

      // every callback the trigger can reach now exists - see `wired` above
      wired = true;

      /* -------------------------------------------------- the read-out
         Add ?motion-debug to the URL and the hero's whole state machine is
         printed over the top of it, live. This exists because the only
         machines the sequence has ever misbehaved on are machines we do
         not have: the report is "it does not play", and everything that
         could cause that - a pin with no spacer, a wheel measured in lines,
         a lock the browser walked through, a phase stuck busy - looks
         identical from the outside. One screenshot from the far end says
         which. Off unless asked for, and nothing above knows it exists. */
      if (/[?&]motion-debug/.test(location.search)) {
        const panel = document.createElement("pre");
        panel.style.cssText =
          "position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:8px 10px;" +
          "font:11px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre;" +
          "background:rgba(0,0,0,.82);color:#7CFFB2;border:1px solid #7CFFB2;" +
          "border-radius:4px;pointer-events:none;max-width:46ch;";
        document.body.appendChild(panel);
        cleanups.push(() => panel.remove());

        let wheelSeen = "none";
        window.addEventListener("wheel", (e) => {
          wheelSeen = `mode ${e.deltaMode} raw ${e.deltaY.toFixed(1)} -> ${wheelPx(e).toFixed(0)}px` +
            `${e.cancelable ? "" : " UNCANCELABLE"}`;
        }, { signal: ac.signal, passive: true });

        const paintPanel = () => {
          panel.textContent = [
            `phase    ${phase}${busy ? " (busy)" : ""}  t=${tl.time().toFixed(2)}`,
            `locked   ${locked}${settling() ? " (settling)" : ""}`,
            `scroll   ${Math.round(window.scrollY)}  anchor ${Math.round(anchor)}`,
            `pin      ${Math.round(st.start)}..${Math.round(st.end)}  spacer ${spaced()}`,
            `is-pinned ${document.documentElement.classList.contains("is-pinned")}`,
            `lenis    ${lenis ? (lenis.isStopped ? "stopped" : "running") : "none"}`,
            `reduced  ${prefersReduced}   overture ${overture}`,
            `wheel    ${wheelSeen}`,
          ].join("\n");
        };
        addTicker(paintPanel);
      }

      window.addEventListener("wheel", onWheel, { signal: ac.signal, passive: false });
      window.addEventListener("touchstart", onTouchStart, { signal: ac.signal, passive: true });
      window.addEventListener("touchmove", onTouchMove, { signal: ac.signal, passive: false });
      window.addEventListener("keydown", onKey, { signal: ac.signal, passive: false });
      window.addEventListener("scroll", onScroll, { signal: ac.signal, passive: true });
    }

    /* -------------------------------------------------- the hero dissolving

       How the page gets from the definition to WHO WE ARE.

       WHAT THIS REPLACED, and why. The hero's last frame used to be
       rebuilt as a grid of 48x27 grains on a canvas and poured off the
       bottom of the screen, bottom row first, each grain falling under
       its own gravity. It was a lot of machinery - an offscreen copy of
       the two layers under it, the vignette and the dim redrawn by hand
       in canvas so the handover to the copy was invisible, a per-grain
       start and offset table, and a render loop doing up to ~1300
       drawImage calls a frame - and what it read as was a slide
       transition. Bricks. Every deck-building tool has shipped that
       effect since 1997, which is exactly the association: a picture
       that breaks into tiles is not a picture leaving, it is a
       transition being performed on top of one.

       WHAT IT IS NOW. The frame does not break. It evaporates, from the
       bottom edge upward, on a soft edge about half a screen deep -
       while the picture eases back and lifts a little, so it reads as
       receding rather than as sliding away. WHO WE ARE is already there
       behind it (see .who's negative margin in globals.css), rising, so
       the two moves are one: the space clears from the bottom exactly
       where the section coming up needs it.

       There is no copy of anything any more. The real layers stay real
       and the whole pin - the photo, the letterboxed black around it,
       the type written on it - is masked away together, so nothing has
       to be reproduced in a second renderer to keep the handover
       seamless. There is no handover.

       The mask lives in the stylesheet and is on .hero__pin at all
       times, parked fully opaque, which is why nothing switches on here:
       a mask that arrives at the moment it starts moving is a pop on the
       first frame. See .hero__pin in app/globals.css for the geometry -
       the gradient is twice the pin's height, black over the top half,
       fading out across the next quarter.

       All this animates is where that mask sits. One style write a
       frame, on a property the compositor already owns, against ~1300
       canvas draws - and because it is one number from 0 to 1 it
       scrubs and reverses exactly as the old one did. */
    function dissolve(
      tl: gsap.core.Timeline,
      at: number,
      dur: number,
      pin: HTMLElement,
      stage: HTMLElement | null,
    ) {
      /* How far the mask travels, as a multiple of the pin's own height.
         At 0 the pin sits in the mask's solid half and is untouched; by
         1.6 the whole of it has passed the gradient's transparent end and
         nothing is left. Read off the live element rather than captured,
         since a resize mid-sequence has to move the same fraction of a
         different screen. */
      const TRAVEL = 1.6;
      /* And the height it is a multiple of, with a floor under it. A zero
         here is not a smaller dissolve, it is no dissolve at all - the
         mask would never leave 0 and the hero would sit on top of WHO WE
         ARE for good - so a pin that measures nothing (a collapsed or
         hidden window, a measurement taken before layout) falls back to
         the viewport, and then to a plausible screen. Over-travelling
         costs nothing: past ~1.5 the pin is already fully clear. */
      const height = () => pin.offsetHeight || window.innerHeight || 900;
      const place = (p: number) => {
        const y = -(height() * TRAVEL * p);
        const pos = `0px ${y.toFixed(1)}px`;
        pin.style.webkitMaskPosition = pos;
        pin.style.maskPosition = pos;
      };

      /* The type goes first, and it goes on its own terms: it was written
         on the picture, so it leaves with the picture - but a headword
         fading at exactly the rate the ground under it fades reads as one
         flat crossfade. It lifts out over the first third instead, and
         the veil clears just behind it so the section arriving is not
         read through a scrim. */
      tl.to(".meaning__inner",
        { yPercent: -18, autoAlpha: 0, duration: dur * 0.38, ease: "power2.in" }, at);
      tl.to("[data-meaning-veil]",
        { autoAlpha: 0, duration: dur * 0.44, ease: "power1.in" }, at + dur * 0.08);

      /* The picture pulls back as it goes. Small numbers on purpose - the
         stage is already at STAGE_REST from phase 2 and this is the last
         thing the reader sees of it, so it is a breath rather than a zoom.
         power1.in, so almost all of the travel is in the second half and
         the frame is still holding still while the dissolve has already
         started eating the bottom of it. */
      if (stage) {
        tl.to(stage,
          { scale: STAGE_REST * 1.07, yPercent: -2.5, duration: dur, ease: "power1.in" }, at);
      }

      /* And the dissolve itself. Linear on the timeline - the softness is
         in the gradient's own falloff, not in an ease, so the edge travels
         at a constant rate and the picture thins out rather than
         accelerating away from the reader. */
      const state = { p: 0 };
      tl.to(state, {
        p: 1, duration: dur, ease: "none",
        immediateRender: false,
        onUpdate: () => place(state.p),
      }, at);

      /* A resize part-way through moves the pin's height under the mask,
         so the edge has to be put back where the timeline says it is
         rather than where it was drawn for the old height. */
      on(window, "resize", () => place(state.p));
    }

    /* -------------------------------------------------- SplitText lines
       Line by line, each one masked by its own overflow:hidden wrapper and
       rising up into frame as it fades in - no bar, no hard clip-path
       sweep. The mask is what keeps it classy rather than a plain fade: the
       line still arrives from behind a fixed edge, so it reads as type
       being set into place, just without the sweep across it that a solid
       block reads as an effect rather than typography.

       Pure transform + opacity, no clip-path at all, so there is nothing
       here for the GPU to rasterise every frame beyond a compositor layer. */
    function initSplits() {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const build = () => {
          if (ac.signal.aborted) return;
          // reduced motion: no mask at all, so nothing can clip a descender
          if (prefersReduced) { gsap.set(el, { autoAlpha: 1 }); return; }

          // the real sentence, captured before it gets cut into line spans
          const sentence = (el.textContent || "").replace(/\s+/g, " ").trim();

          // reveal first: the element is visibility:hidden in CSS so the type
          // never flashes before the wipe, which means nothing below may throw
          // and leave it hidden forever
          gsap.set(el, { autoAlpha: 1 });

          const split = new SplitText(el, { type: "lines", linesClass: "split-line" });
          splits.push(split);

          // Each line gets its own overflow:hidden mask so it can rise up
          // from behind a fixed edge instead of just fading in place - the
          // mask is what keeps this reading as typography arriving, not a
          // generic fade. No bar, no clip-path animation: the wrapper's
          // static overflow:hidden does the clipping for free.
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "line-mask";
            // the split tree is presentation; the sr copy below carries the text
            mask.setAttribute("aria-hidden", "true");
            line.parentNode?.insertBefore(mask, line);
            mask.appendChild(line);
          });

          // One readable copy for assistive tech. It lives inside the original
          // element so the heading keeps its role and its accessible name comes
          // from real text, rather than aria-label on a split-up container.
          if (sentence) {
            const sr = document.createElement("span");
            sr.className = "sr-only";
            sr.textContent = sentence;
            el.insertBefore(sr, el.firstChild);
          }

          // data-wipe="down" is the one spot on the site that wants the
          // entrance reversed (the contact title, dropping onto the page
          // rather than rising onto it); everything else rises.
          const fromAbove = el.getAttribute("data-wipe") === "down";

          gsap.set(split.lines, { yPercent: fromAbove ? -120 : 120, autoAlpha: 0 });

          const STEP = 0.08;
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 84%" } });
          tl.to(split.lines, {
            yPercent: 0, autoAlpha: 1,
            duration: 0.95, ease: "power3.out", stagger: STEP,
          }, 0);
        };
        // build on both settle paths: a rejected fonts.ready must not strand
        // the text behind visibility:hidden
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(build, build);
        else build();
      });
    }

    /* -------------------------------------------------- reveals */
    function initReveals() {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      if (prefersReduced) return;
      // Images settle in on a soft fade + scale rather than a hard-edged
      // clip-path wipe: no travelling mask edge to draw attention to
      // itself, just the photo easing up to full size and opacity as it
      // arrives, which reads as considered rather than as an effect firing.
      document.querySelectorAll<HTMLElement>("[data-clip]").forEach((el, i) => {
        gsap.fromTo(el,
          { autoAlpha: 0, y: 22, scale: 1.04, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)",
            duration: 1.2, ease: "power2.out", delay: (i % 3) * 0.08,
            scrollTrigger: { trigger: el, start: "top 86%" } });
      });
    }

    /* -------------------------------------------------- work tiles pixel reveal */
    function initTiles() {
      document.querySelectorAll<HTMLElement>("[data-tile]").forEach((tile) => {
        const host = tile.querySelector("[data-pixgrid]");
        const g = host && grids.get(host);
        if (!g) return;
        if (prefersReduced) { gsap.set(g.tiles, { opacity: 0 }); return; }
        gsap.set(g.tiles, { opacity: 1 });
        gsap.to(g.tiles, {
          opacity: 0, duration: 0.45, ease: "power2.out",
          stagger: { amount: 0.5, grid: [g.rows, g.cols], from: "random" },
          scrollTrigger: { trigger: tile, start: "top 82%" },
        });
      });
    }

    /* -------------------------------------------------- counters
       Started a little later than the reveal that fades the stat in
       (initReveals, "top 86%") rather than earlier: the count is the whole
       point of the number, and at 88% a chunk of it used to run behind the
       reveal's own fade, so what landed was a figure already most of the
       way up. The delay leaves it running in full view.

       The other half of "it only ran on a hard refresh" is in
       initOvertureBridge: a restored scroll built these triggers already
       past their own start. */
    /* The brand's own solids, read off the tokens rather than restated
       here: :root in globals.css is where the design book's palette
       lives, so this cannot drift from it. */
    const HUE_TOKENS = ["--pink", "--sky", "--purple", "--tangerine", "--leaf", "--yellow"];
    let hues: string[] | null = null;
    function brandHues() {
      if (!hues) {
        const cs = getComputedStyle(document.documentElement);
        hues = HUE_TOKENS.map((t) => cs.getPropertyValue(t).trim()).filter(Boolean);
      }
      return hues;
    }

    function initCounters() {
      const DUR = 1.7;
      /* How long one colour is held. The cycle runs on the clock, never
         on the digits: 200 ticks through two hundred values in the same
         1.7s that 12 ticks through twelve, so anything keyed to the
         number itself would strobe on the big count and barely move on
         the small one. A fixed hold gives all three counts the same
         rhythm, and at 0.3s that is six colours over the run - a change
         you read as a change rather than as a flicker. */
      const HOLD = 0.3;
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el, i) => {
        const end = parseFloat(el.getAttribute("data-count") || "0");
        const obj = { v: 0 };
        /* Opt-in, and only where it is wanted: [data-count] is claimed
           site-wide (see the note in lib/series-motion.ts), and the
           colour belongs to the WHO WE ARE strip, not to every figure
           that happens to count. */
        const cycle = el.hasAttribute("data-count-hue") && !prefersReduced ? brandHues() : [];
        ScrollTrigger.create({
          trigger: el, start: "top 82%", once: true,
          onEnter: () => {
            gsap.to(obj, { v: end, duration: DUR, ease: "power2.out",
              onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
            if (!cycle.length) return;
            /* The plus is part of the figure, not punctuation after it.
               It is a sibling element (components/Sections.tsx) with a
               colour of its own in the stylesheet, so it cannot inherit
               its way through the cycle - it has to be painted alongside,
               or the run reads as a number changing colour next to a
               cream sign that will not. */
            const plus = el.parentElement?.querySelector<HTMLElement>("i") ?? null;
            const paint = (c: string) => {
              el.style.color = c;
              if (plus) plus.style.color = c;
            };
            /* Each count starts a different distance into the palette, so
               the three of them are never on the same colour at the same
               time - a row that changes in unison reads as the page
               flashing, not as three numbers arriving. */
            const seed = i * 2;
            const step = { n: 0 };
            gsap.to(step, {
              n: DUR / HOLD, duration: DUR, ease: "none",
              onUpdate: () => {
                paint(cycle[(seed + Math.floor(step.n)) % cycle.length]);
              },
              /* Handed back to the stylesheet rather than parked on the
                 last colour: the figure's resting state is cream, and
                 .stat__num's own colour transition carries it there. */
              onComplete: () => { paint(""); },
            });
          },
        });
      });
    }

    /* -------------------------------------------------- marquees

       `base` is seconds per pass of half the track, which is the honest
       unit for a loop that wraps on half its own width - but it is not a
       speed. Two rows on the same base do not travel at the same rate:
       the further a track is, the faster it has to go to cover it in the
       same time. That is why the awards row reads quicker than the client
       wall on identical numbers - it is four passes of six names set big,
       against one pass of twelve set small, so its half is a great deal
       wider and its pixels-per-second follow.

       So the base is per-row now, off data-marquee-base, defaulting to the
       30 every row used to share. */
    /* The rows used to take a shove off the scroll: every Lenis velocity
       reading was banked as a `boost` on top of the row's own clock and
       spent over the next few frames, so a flick down the page threw the
       client wall and the awards strip forward and let them coast back.
       It is out. A row that changes speed because of something the reader
       did somewhere else on the page reads as a glitch rather than as
       parallax - and these two are lists of names, which are the one
       thing on the page you have to be able to actually read while they
       move. They run at their own rate now, and only at that. */
    let reflow = () => {};
    function initMarquees() {
      const items: {
        track: HTMLElement; dir: number; half: number;
        current: number; base: number; onScreen: boolean;
      }[] = [];
      /* A strip that is not on screen is still a strip being written to:
         the same transform every frame, the same layer recomposited, for
         a row of client names four screens down the page.

         The arithmetic below still runs for every row - it is a multiply
         and a modulo, and stopping it would mean a row that had been
         scrolled past came back parked where it was left rather than
         where its own clock says it should be. What stops is the write. */
      const seen = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          const it = items.find((s) => s.track === e.target);
          if (it) it.onScreen = e.isIntersecting;
        }),
        { rootMargin: "20%" },
      );
      observers.push(seen);
      document.querySelectorAll<HTMLElement>("[data-marquee]").forEach((track) => {
        const dir = track.getAttribute("data-marquee") === "right" ? 1 : -1;
        const base = Number(track.dataset.marqueeBase);
        const state = {
          track, dir, half: track.scrollWidth / 2, current: 0,
          base: Number.isFinite(base) && base > 0 ? base : 30,
          onScreen: false,
        };
        items.push(state);
        seen.observe(track);
      });
      let last = performance.now();
      addTicker(() => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        items.forEach((s) => {
          if (!s.half) return;
          s.current += (s.half / s.base) * s.dir * dt;
          /* Wrapped by modulo rather than by a pair of one-step tests.
             The track is the same content twice, so any two offsets a
             half apart are the same picture and this can never be seen -
             but it holds for *any* offset, which the two tests did not.
             They only ever subtracted one half, in one direction each, so
             an offset that had got past the end of the content the wrap
             was guarding left the strip running out mid-viewport, dead
             stopping and jumping back. */
          const t = ((s.current % s.half) + s.half) % s.half;
          s.current = t - s.half;
          if (s.onScreen) gsap.set(s.track, { x: s.current });
        });
      });
      reflow = () => items.forEach((s) => { s.half = s.track.scrollWidth / 2; });
      on(window, "resize", () => reflow());
    }

    /* -------------------------------------------------- cursor (dot + ring) */
    function initCursor() {
      const cursor = document.querySelector<HTMLElement>(".cursor");
      const ring = document.querySelector<HTMLElement>(".cursor-ring");
      if (!cursor || !canHover) return;

      const xTo = gsap.quickTo(cursor, "x", { duration: 0.28, ease: "power3" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.28, ease: "power3" });
      const rxTo = ring && gsap.quickTo(ring, "x", { duration: 0.75, ease: "power3" });
      const ryTo = ring && gsap.quickTo(ring, "y", { duration: 0.75, ease: "power3" });

      let mx = 0, my = 0;
      on(window, "mousemove", ((e: MouseEvent) => {
        mx = e.clientX; my = e.clientY;
        xTo(mx); yTo(my);
        if (rxTo && ryTo) { rxTo(mx); ryTo(my); }
        cursor.classList.add("is-visible");
        ring?.classList.add("is-visible");
      }) as EventListener);

      /* Inertia read-out.
         The ring already lags the pointer by design. The gap between where it
         has got to and where the pointer actually is IS the velocity vector, so
         rather than throwing it away, use it: stretch the ring along the
         direction of travel and squash it across, and point it that way. The
         ring goes back to a circle the moment you stop, for free. */
      if (ring && !prefersReduced) {
        const STRETCH_AT = 190;   // px of lag that counts as "full tilt"
        let press = 1;
        const setRing = gsap.quickSetter(ring, "css") as (v: object) => void;

        on(window, "mousedown", () => { press = 0.82; });
        on(window, "mouseup", () => { press = 1; });

        addTicker(() => {
          const rx = gsap.getProperty(ring, "x") as number;
          const ry = gsap.getProperty(ring, "y") as number;
          const dx = mx - rx, dy = my - ry;
          const lag = Math.min(Math.hypot(dx, dy) / STRETCH_AT, 1);
          // ease the response so small jitters near the pointer do nothing
          const k = lag * lag;
          setRing({
            rotate: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`,
            scaleX: (1 + k * 0.6) * press,
            scaleY: (1 - k * 0.34) * press,
          });
        });
      }

      /* Nothing here reads [data-cursor] any more. The disc that opened
         over those elements with the word in it is gone (see .cursor in
         globals.css) - so is the mouseenter/mouseleave pass that armed it
         and the MutationObserver that kept the word current on the tiles
         that rewrite it. The attribute is left on the markup because it
         is still the selector that takes the native arrow off anything
         the dot is standing in for. */
    }

    /* -------------------------------------------------- cursor spotlight */
    function initSpotlight() {
      const spot = document.querySelector<HTMLElement>(".spotlight");
      if (!spot || prefersReduced) return;
      let cx = window.innerWidth / 2, cy = window.innerHeight / 2;

      /* On touch the light is lit by a finger and goes out after it, and
         that is not a compromise on the desktop behaviour - it is the only
         version of this effect that means anything without a cursor. A
         glow parked in the middle of a phone screen is not a highlight;
         it is a tint on the whole page that never moves, which is to say
         it is invisible except as a cost.

         And it is a real cost. This is a viewport-sized fixed layer with
         mix-blend-mode:screen on it, which forces the whole page under it
         through a blended composite on every frame it changes - the sort
         of thing a mid-range Android pays for in scroll smoothness. So
         off is the resting state (is-lit is dropped, the element goes to
         opacity 0, and nothing composites), the ticker does no work while
         it is off, and the light exists for exactly as long as there is a
         finger on the glass to justify it. */
      /* Which is also the argument for the last line here. The chase is a
         lerp, so it never formally arrives - cx creeps at the mouse for
         ever in ninths, and every one of those creeps used to be two
         custom property writes on the layer described above, which is a
         full-screen blended composite for a light that has not visibly
         moved in half a second. Below a tenth of a pixel it has stopped,
         so the write stops with it and the compositor has nothing to do
         until the reader moves again. */
      let px = NaN, py = NaN;
      addTicker(() => {
        const p = pointer.read();
        if (!p.live) return;
        if (touch) {
          spot.classList.toggle("is-lit", p.engaged);
          if (!p.engaged) return;
        }
        cx += (p.x - cx) * 0.09; cy += (p.y - cy) * 0.09;
        if (Math.abs(cx - px) < 0.1 && Math.abs(cy - py) < 0.1) return;
        px = cx; py = cy;
        spot.style.setProperty("--mx", cx + "px");
        spot.style.setProperty("--my", cy + "px");
      });
    }

    /* -------------------------------------------------- 3D tilt + inner parallax */
    function initTilt() {
      if (prefersReduced) return;
      const els = gsap.utils.toArray<HTMLElement>("[data-tilt]");
      if (!els.length) return;

      // The tilt used to fire only on mousemove *over* the element, so you never
      // saw it until you were already on it. Now the cursor pulls from a
      // distance: a faint lean as it approaches, full strength once it's on.
      // quickTo's easing smooths the step at the edge, so there's no pop.
      const REACH = 700;      // px beyond the element's edge that still pulls
      const AMBIENT = 0.3;    // share of the full tilt while merely approaching

      type Tilt = {
        el: HTMLElement; hover: boolean; onScreen: boolean; ambient: boolean;
        rX: gsap.QuickToFunc; rY: gsap.QuickToFunc; tZ: gsap.QuickToFunc;
        iX: gsap.QuickToFunc | null; iY: gsap.QuickToFunc | null;
        /* what this frame's measurement worked out to, parked here between
           the read pass and the write pass - see the ticker below for why
           there are two of them. Fields on the item rather than a list of
           results, so a frame allocates nothing. */
        px: number; py: number; s: number; wrote: boolean;
      };

      const items = new Map<Element, Tilt>();
      els.forEach((el) => {
        // wcards already animate their own image swap on hover (see
        // initWCardCycle) - stacking the inner xPercent/yPercent parallax on
        // top of that crossfade read as a shake, so they skip it. They also
        // skip the ambient at-a-distance lean: three cards sit well within
        // the 700px reach, so hovering one used to visibly tilt its neighbours.
        // The founders' pair shot opts out of both for its own reasons: it
        // holds three copies of one photograph (two clipped halves and the
        // whole one over them - see AboutFounders), so an inner parallax
        // would move the left half's image and nothing else and tear the
        // join open; and it sits on top of the two portraits it replaces,
        // where a lean from across the room would give the frame away
        // before the join has even played.
        const flat = el.classList.contains("wcard") || el.classList.contains("founders__duo");
        const img = flat ? null : el.querySelector("img");
        items.set(el, {
          el, hover: false, onScreen: false, ambient: !flat,
          px: 0, py: 0, s: 0, wrote: false,
          rX: gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3" }),
          rY: gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3" }),
          tZ: gsap.quickTo(el, "z", { duration: 0.8, ease: "power3" }),
          iX: img ? gsap.quickTo(img, "xPercent", { duration: 1, ease: "power3" }) : null,
          iY: img ? gsap.quickTo(img, "yPercent", { duration: 1, ease: "power3" }) : null,
        });
        if (touch) {
          /* "hover" on a phone is a finger held on the card. It takes the
             tilt from the ambient third up to full for as long as the
             touch lasts, which makes a press the same act of commitment a
             hover is on a desktop - and it settles back on its own the
             moment the finger leaves, whether that was a tap or a scroll. */
          const down = () => { const it = items.get(el); if (it) it.hover = true; };
          const up = () => { const it = items.get(el); if (it) it.hover = false; };
          on(el, "touchstart", down);
          on(el, "touchend", up);
          on(el, "touchcancel", up);
        } else {
          on(el, "mouseenter", () => { const it = items.get(el); if (it) it.hover = true; });
          on(el, "mouseleave", () => { const it = items.get(el); if (it) it.hover = false; });
        }
      });

      // only what's on screen is worth measuring each frame
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          const it = items.get(e.target);
          if (it) it.onScreen = e.isIntersecting;
        }),
        { rootMargin: "25%" },
      );
      els.forEach((el) => io.observe(el));
      observers.push(io);

      // driven off the ticker, not off a pointer event: during the hero pin
      // the cards move under a stationary cursor, and an event-only tilt
      // would go stale. On touch that is not an edge case but the whole
      // mechanism - the field rests at the middle of the screen and the
      // cards scroll past it, so the lean is the scroll's doing.
      const clamp = gsap.utils.clamp(-0.5, 0.5);
      /* Two passes, and they are not allowed to interleave.

         This used to measure a card and immediately write to it, then
         measure the next one. Every one of those writes is an inline
         transform, which dirties style, and the next getBoundingClientRect
         cannot be answered until the browser has recalculated - so a
         section with eight cards on screen paid eight forced reflows a
         frame, sixty times a second, and the cost went up with the number
         of cards rather than staying flat. Reading everything first and
         writing everything after is one reflow, whatever is on screen.

         The other half is not writing at all when there is nothing to say.
         Most cards on screen are outside REACH most of the time, which
         means the honest value for them is zero - and quickTo does not
         treat a repeat of the value it is already on as a no-op, it
         restarts the tween. So a card that has already been told zero is
         left alone until it has something else to hear. */
      addTicker(() => {
        const p = pointer.read();
        if (!p.live) return;
        const mx = p.x, my = p.y;

        // ---- read
        items.forEach((it) => {
          if (!it.onScreen) return;
          const r = it.el.getBoundingClientRect();
          if (!r.width || !r.height) { it.s = 0; return; }
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          it.px = clamp((mx - cx) / r.width);
          it.py = clamp((my - cy) / r.height);
          // how far outside the box the cursor is, 0 while it's over it
          const out = Math.hypot(
            Math.max(0, Math.abs(mx - cx) - r.width / 2),
            Math.max(0, Math.abs(my - cy) - r.height / 2),
          );
          it.s = it.hover ? 1 : (it.ambient ? AMBIENT * Math.max(0, 1 - out / REACH) : 0);
        });

        // ---- write
        items.forEach((it) => {
          if (!it.onScreen) return;
          /* nothing to say, and it has already been said - the tween that
             took it back to level has long since finished */
          if (it.s === 0 && !it.wrote) return;
          it.wrote = it.s !== 0;
          const { px, py, s } = it;
          it.rX(-py * 11 * s);
          it.rY(px * 13 * s);
          it.tZ(34 * s);
          if (it.iX && it.iY) { it.iX(px * -5 * s); it.iY(py * -5 * s); }
        });
      });
    }

    /* -------------------------------------------------- wcard hover cycle
       Each WHAT WE DO card stacks its cover plus nine extra frames (see
       BUCKETS in lib/content.ts). On hover, flip through them fast with a
       quick crossfade (see .wcard__img img.is-active in globals.css);
       on leave, settle back on the cover.

       A line under the card holds the reel still. Each one carries its own
       frame out of the same reel (data-frame, dealt in BUCKETS and written
       out in components/Sections.tsx), so pointing at "Copywriting" stops
       the cycle on Copywriting's picture and holds it there; coming off the
       line and back onto the card's own area starts the reel again from
       wherever it was parked. That is the whole reason the hold is a flag
       rather than just a clearInterval: leaving a line has to be able to
       tell "still on the card" from "off the card entirely", and the card's
       own mouseleave is what settles it back to the cover.

       The whir is NOT on that cycle. It used to fire on every frame swap,
       which is a hit every 420ms for as long as the pointer is anywhere
       on the card - the card is most of the tile, so simply crossing the
       section played it - and a cue that constant stops being a cue. It
       is on the service lines instead: one hit as the pointer arrives on
       "Copywriting", one as it arrives on the next line. The reader is
       picking something out at that point, so the sound is answering a
       hover rather than narrating an animation. */
    function initWCardCycle() {
      if (prefersReduced) return;

      // One clip, cloned per play so a fast cycle doesn't cut its own last
      // hit short - same approach as the overture's cues (see sfx() in
      // lib/overture-motion.ts). Autoplay rejection is swallowed: a missed
      // whir is not a reason to break the hover cycle.
      const wcardClips = WCARD_SFX.map((src) => {
        const a = new Audio(src);
        a.preload = "auto";
        a.volume = 0.5;
        return a;
      });
      const playWCardSfx = () => {
        const clip = wcardClips[Math.floor(Math.random() * wcardClips.length)];
        const el = clip.cloneNode(true) as HTMLAudioElement;
        el.volume = clip.volume;
        void el.play().catch(() => {});
      };

      document.querySelectorAll<HTMLElement>(".wcard").forEach((card) => {
        const imgs = Array.from(card.querySelectorAll<HTMLImageElement>(".wcard__img img"));
        if (imgs.length < 2) return;

        let i = 0;
        let timer: number | null = null;
        // set while the pointer is parked on a service line: the reel is
        // stopped on that line's frame and must not restart under it
        let held = false;
        const show = (n: number) => {
          imgs.forEach((img, j) => img.classList.toggle("is-active", j === n));
        };
        const run = () => {
          if (timer || held) return;
          timer = window.setInterval(() => {
            i = (i + 1) % imgs.length;
            show(i);
          }, 420);
          intervals.push(timer);
        };
        const halt = () => {
          if (timer) { window.clearInterval(timer); timer = null; }
        };

        const settle = () => {
          halt();
          held = false;
          i = 0;
          show(0);
        };

        if (touch) {
          /* There is no "arriving at the card" on a phone, so the thing
             that stands in for it is the card arriving at the reader: the
             reel runs while the card is on screen and stops when it is
             not. Which is not a compromise - it is closer to what the
             card is for than the hover was, because on a desktop you have
             to go and find out that these are reels and here you cannot
             miss it.

             It runs on the same interval and the same service lines park
             it on the same frames, so nothing about the card's behaviour
             is a second implementation. The whir does not come along: a
             sound nobody asked for, fired by scrolling, on a device that
             is usually in a pocket or a quiet room, is not the same cue
             it is on a desktop where it answers a deliberate hover. */
          const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) run(); else settle(); });
          }, { threshold: 0.35 });
          io.observe(card);
          observers.push(io);
        } else {
          on(card, "mouseenter", run);
          on(card, "mouseleave", settle);
        }

        card.querySelectorAll<HTMLElement>(".wcard__list li").forEach((li) => {
          const frame = Number(li.dataset.frame);
          const own = Number.isInteger(frame) && frame >= 0 && frame < imgs.length;

          if (touch) {
            /* Touch and hold a line to hold the reel on that line's
               frame, exactly as pointing at it does. touchstart rather
               than a tap, so the frame is there while the finger is still
               down and the reader can slide between lines and watch the
               reel answer - a tap that only resolved on release would
               make this a thing you operate rather than a thing you feel.

               The scroll is deliberately NOT swallowed. The service list
               is most of the height of the card, so a touchstart here is
               as often the beginning of a scroll as it is a hold, and a
               preventDefault would turn the card into a dead patch the
               page will not move under. Letting both happen costs
               nothing: a scroll ends the touch, which releases the reel. */
            const grab = () => {
              if (!own) return;
              held = true;
              halt();
              i = frame;
              show(i);
            };
            const drop = () => {
              if (!own) return;
              held = false;
              run();
            };
            on(li, "touchstart", grab);
            on(li, "touchend", drop);
            on(li, "touchcancel", drop);
            return;
          }

          // one hit per line arrived at. mouseenter, not mouseover: mouseover
          // re-fires as the pointer crosses inside the same <li>, which is a
          // stutter of hits on one item rather than one hit per item.
          on(li, "mouseenter", () => {
            playWCardSfx();
            if (!own) return;
            held = true;
            halt();
            // parked *and* remembered: leaving the line carries on from this
            // frame instead of snapping back to wherever the reel had got to
            i = frame;
            show(i);
          });
          // Fires before the card's own mouseleave when the pointer leaves
          // the card from a line, so the reel restarted here is stopped again
          // a moment later by the handler above - which is why that one does
          // the settling back to the cover and this one does not.
          on(li, "mouseleave", () => {
            if (!own) return;
            held = false;
            run();
          });
        });
      });
    }

    /* -------------------------------------------------- paint splash
       The splash behind the WHO WE ARE cutout leans toward the cursor. The
       pull is quadratic in proximity, so from across the section it barely
       registers and only really commits once you are near it - a linear
       falloff made the whole section feel twitchy.

       Two things keep it from ever snapping: quickTo carries the actual
       easing (the splash always lags the pointer), and the travel is capped
       by the distance itself, so as the cursor arrives on top of it the
       target collapses to zero instead of thrashing around a singularity.

       Only the wrapper moves. The SVG's turbulence filters are expensive to
       rasterise and this way they are rasterised once, then composited. */
    function initSplash() {
      const els = gsap.utils.toArray<HTMLElement>("[data-splash]");
      if (!els.length) return;

      // It mists into the frame - blur and scale settling out along with the
      // fade, rather than a flat cut to visible - on the same beat as the
      // cutout next to it. Triggering off the cutout image itself (the
      // sibling initReveals already wires up via data-clip) rather than off
      // the splash's own box or its parent: the splash's box is inset well
      // past the photo's edges, so using itself would fire early, and even
      // the shared parent is one extra layout read that can drift a frame
      // out of step. Sharing the exact element the image reveal triggers
      // off guarantees the same "top 86%" crossing fires both at once.
      els.forEach((el) => {
        const photo = el.closest<HTMLElement>("[data-tilt]");
        const trigger = photo?.querySelector<HTMLElement>("[data-clip]") || el.parentElement || el;
        gsap.fromTo(el,
          { autoAlpha: 0, scale: 0.92, filter: "blur(18px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.3, ease: "power3.out",
            scrollTrigger: { trigger, start: "top 86%" } });
      });
      if (prefersReduced) return;

      // Defaults, overridable per element with data-splash-reach / -pull /
      // -bite, because the two splashes on the site want different manners:
      // the about page's pour is a background that should barely stir, the
      // WHO WE ARE splatter is meant to visibly chase the pointer.
      const REACH = 900;      // px from centre at which the cursor starts to register
      const MAX_PULL = 34;    // px of travel at full commitment
      const BITE = 2;         // falloff exponent: higher = indifferent for longer

      const num = (el: HTMLElement, key: string, fallback: number) => {
        const v = parseFloat(el.dataset[key] ?? "");
        return Number.isFinite(v) ? v : fallback;
      };

      type Item = {
        el: HTMLElement; onScreen: boolean;
        reach: number; pull: number; bite: number;
        xTo: gsap.QuickToFunc; yTo: gsap.QuickToFunc; rTo: gsap.QuickToFunc;
        /* this frame's measurement, parked between the two passes - same
           arrangement, and for the same reason, as initTilt above */
        ux: number; uy: number; k: number; pull2: number; wrote: boolean;
      };

      const items = new Map<Element, Item>();
      els.forEach((el) => {
        items.set(el, {
          el, onScreen: false,
          ux: 0, uy: 0, k: 0, pull2: 0, wrote: false,
          reach: num(el, "splashReach", REACH),
          pull: num(el, "splashPull", MAX_PULL),
          bite: num(el, "splashBite", BITE),
          xTo: gsap.quickTo(el, "x", { duration: 1.6, ease: "power2" }),
          yTo: gsap.quickTo(el, "y", { duration: 1.6, ease: "power2" }),
          rTo: gsap.quickTo(el, "rotation", { duration: 1.9, ease: "power2" }),
        });
      });

      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          const it = items.get(e.target);
          if (it) it.onScreen = e.isIntersecting;
        }),
        { rootMargin: "30%" },
      );
      els.forEach((el) => io.observe(el));
      observers.push(io);

      // ticker rather than a pointer event: the section scrolls under a
      // still cursor, and on touch that scroll is the entire gesture.
      // Read pass then write pass, and nothing written that is already
      // where it is being sent - see the long note over initTilt's ticker
      // for what interleaving the two costs.
      addTicker(() => {
        const p = pointer.read();
        if (!p.live) return;
        const mx = p.x, my = p.y;

        // ---- read
        items.forEach((it) => {
          if (!it.onScreen) return;
          const r = it.el.getBoundingClientRect();
          if (!r.width || !r.height) { it.k = 0; it.pull2 = 0; return; }
          const dx = mx - (r.left + r.width / 2);
          const dy = my - (r.top + r.height / 2);
          const dist = Math.hypot(dx, dy) || 1;
          const prox = 1 - Math.min(dist / it.reach, 1);
          it.k = Math.pow(prox, it.bite);               // indifferent until it is close
          it.pull2 = Math.min(dist, it.pull) * it.k;    // never overshoots the pointer
          it.ux = dx / dist;
          it.uy = dy / dist;
        });

        // ---- write
        items.forEach((it) => {
          if (!it.onScreen) return;
          if (it.k === 0 && !it.wrote) return;
          it.wrote = it.k !== 0;
          it.xTo(it.ux * it.pull2);
          it.yTo(it.uy * it.pull2);
          it.rTo(it.ux * it.k * 3);                     // a few degrees of lean, no more
        });
      });
    }

    /* -------------------------------------------------- magnetic */
    function initMagnetic() {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });

        if (touch) {
          /* A magnet needs somewhere to pull the button *from*, and a
             finger arrives already on top of it: there is no approach to
             answer. So touch gets the other half of what the magnet was
             for - the button acknowledging that it has been taken hold
             of. Same elastic settle, so it is recognisably the same
             control, and it leans off the touch's own offset within the
             button, which is the magnet's gesture run backwards: press a
             corner and that corner gives. */
          on(el, "touchstart", ((e: TouchEvent) => {
            const t = e.touches[0];
            if (!t) return;
            const r = el.getBoundingClientRect();
            xTo((t.clientX - (r.left + r.width / 2)) * 0.16);
            yTo((t.clientY - (r.top + r.height / 2)) * 0.16);
          }) as EventListener);
          const settle = () => { xTo(0); yTo(0); };
          on(el, "touchend", settle);
          on(el, "touchcancel", settle);
          return;
        }

        on(el, "mousemove", ((e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.4);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        }) as EventListener);
        on(el, "mouseleave", () => { xTo(0); yTo(0); });
      });
    }

    /* -------------------------------------------------- nav + progress */
    function initNav() {
      const nav = document.getElementById("nav");
      const bar = document.querySelector<HTMLElement>(".progress__bar");

      /* ---- the scroll bar ----
         One place the bar is ever written, and one number it is ever
         written from: whoever owns the reader's progress (barSource, top
         of this context) if anyone does, and plain document scroll if not.
         Painted through a transform (see .progress__bar in globals.css)
         and only when the value has actually changed, since the ticker
         below asks on every frame. */
      let painted = -1;
      const paintBar = (p: number) => {
        if (!bar) return;
        const v = Math.min(Math.max(p, 0), 1);
        if (Math.abs(v - painted) < 0.0005) return;
        painted = v;
        bar.style.transform = `scaleX(${v.toFixed(4)})`;
      };
      const docProgress = () => (barMax > 0 ? window.scrollY / barMax : 0);
      const readBar = () => paintBar(barSource?.() ?? docProgress());

      /* Every frame, not every scroll event. The hero's sequence plays on
         its own clock with the document held still, so there are no scroll
         events at all for most of the opening - the one stretch of the page
         the bar was getting wrong. Off the home page barSource is null and
         a frame costs one scrollY read against a remembered height, with
         the write skipped unless the number actually moved. */
      addTicker(readBar);
      /* Anything that changes how long the page is - fonts landing, the
         hero's pin spacer appearing, a resize, a section opening - ends in
         a ScrollTrigger refresh, so that is where the height is re-read.
         Without this the bar kept reporting against the height the page
         had on the frame it booted. */
      readBarMax();
      const remeasure = () => { readBarMax(); readBar(); };
      ScrollTrigger.addEventListener("refresh", remeasure);
      cleanups.push(() => ScrollTrigger.removeEventListener("refresh", remeasure));
      readBar();                                  // right on the first frame

      /* ---- which way round the nav is drawn ----
         The header is fixed and the site is not one colour: the home page
         runs black, the About page's panels come up cream under it, and
         Insights and Contact are cream from the first frame. So the ink
         has to follow whatever is behind it - white line work over black,
         black over cream - or half the row is unreadable half the time.

         This used to be a difference blend on the links, which is the
         trick that *looks* like it solves this and does not: .nav is a
         fixed element with a z-index, so it opens a stacking context, and
         a blend inside one is composited against that context rather than
         against the page scrolling under it. It never had the backdrop it
         was supposed to be a function of.

         So: the light grounds say so in the markup (`data-nav-light`, and
         the About page's own .is-light panels), and this asks - on every
         scroll, off rectangles that are already in the layout - whether
         any of them is under the header's own midline. One class, and the
         stylesheet does the rest (see --nav-ink in globals.css). */
      const lights = gsap.utils.toArray<HTMLElement>("[data-nav-light], .is-light");
      const readGround = () => {
        if (!nav) return;
        /* A route with no light grounds at all is an answer - "dark" - not
           a reason to skip the write. The header is rendered once in the
           layout and survives the navigation, so bailing here left the
           previous page's class on it: Insights turned the ink black and
           every dark page after it kept it, until something happened to
           land on a page that had lights of its own to say otherwise. */
        if (!lights.length) { nav.classList.remove("is-on-light"); return; }
        const r = nav.getBoundingClientRect();
        /* the logo's own middle, not the header's bottom edge: the header
           is padded well past its ink, and the corner the mark sits in is
           what has to stay legible */
        const y = r.top + r.height / 2;
        const light = lights.some((el) => {
          const b = el.getBoundingClientRect();
          return b.top <= y && b.bottom >= y && b.width > 0;
        });
        nav.classList.toggle("is-on-light", light);
      };
      /* pages that are cream from the top have to be right on the first
         frame, before anything has scrolled. Same reasoning for the hide:
         the header is the same element across a navigation, so a route
         left mid-scroll with the bar tucked away would arrive on the next
         page still tucked away. */
      readGround();
      nav?.classList.remove("is-hidden");

      /* ---- when the header gets out of the way ----

         Not "is this frame going down". That is what it used to ask, and
         a scroll is not a monotonic thing: Lenis eases, a pinned section
         hands the scroll back a pixel or two as it releases, a trackpad
         gives up in tiny alternating deltas. Every one of those flipped
         the answer on a single frame, so the row blinked in and out the
         whole way down the page - and never on the way up, where the
         gesture is one long committed run and there is nothing to flip.

         So it measures a RUN instead: how far the reader has gone one way
         without turning round. Turning round starts the measure again from
         wherever they turned, which is what makes a wobble cost nothing -
         it never gets far enough in either direction to be an answer. One
         number decides both edges, so the header cannot be asked to hide
         and show inside the same gesture. */
      const ARM = 90;      // px of one-way travel before the header answers
      const TOP = 500;     // and never inside the first screen
      let lastY = 0;
      let mark = 0;        // where the current run began
      let way = 0;         // which way it is going: 1 down, -1 up
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          readBar();
          const y = self.scroll();
          if (nav) {
            /* held: the hero is driving, and the jump it makes at the
               handover is not a reader scrolling down. The run is reset
               with it, so what the reader does next is measured from
               where the page actually ended up. */
            if (navHold?.()) {
              nav.classList.remove("is-hidden");
              mark = y; way = 0;
            } else {
              const d = Math.sign(y - lastY);
              if (d !== 0 && d !== way) { way = d; mark = y; }
              const run = y - mark;
              if (y <= TOP || run < -ARM) nav.classList.remove("is-hidden");
              else if (run > ARM) nav.classList.add("is-hidden");
            }
          }
          lastY = y;
          readGround();
        },
      });
      on(window, "resize", () => { readGround(); remeasure(); });
    }

    /* -------------------------------------------------- the meaning entry
       The reveal itself is part of the hero pin (see initHero, phase 2), since
       the entry is written over the hero's own photo. All that is left here is
       the speaker: speechSynthesis, so there is no audio asset to ship, and it
       takes itself off the page on engines that lack it. */
    /* --accent as numbers. getComputedStyle resolves a custom property's
       own var() chain, so this comes back as the hex the page is leading
       with (#38c6f0, #ffcb0c, ...) whatever route we are on. The fallback
       is the site default rather than the old hard-coded green. */
    function accentRGBA(el: Element, alpha: number): string {
      const raw = getComputedStyle(el).getPropertyValue("--accent").trim();
      const hex = /^#([0-9a-f]{6})$/i.exec(raw)?.[1] ?? "38c6f0";
      const n = parseInt(hex, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
    }

    function initMeaning() {
      const say = document.querySelector<HTMLButtonElement>("[data-meaning-say]");
      if (!say) return;

      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) { say.hidden = true; return; }

      on(say, "click", () => {
        synth.cancel();                           // re-taps restart, never queue
        const u = new SpeechSynthesisUtterance("So Cheers");
        u.rate = 0.92; u.pitch = 1.05;
        const off = () => say.classList.remove("is-saying");
        u.onend = off; u.onerror = off;
        say.classList.add("is-saying");
        /* a ring of accent pushed outward: the visual for the sound.
           Read off --accent rather than spelled out, because the accent
           is now the page's own colour. Resolved to rgba() here on
           purpose: GSAP interpolates the two shadows by parsing their
           colours, and it does not parse var()/color-mix() - it wants
           numbers on both ends. */
        gsap.fromTo(say,
          { boxShadow: `0 0 0 0 ${accentRGBA(say, 0.5)}` },
          { boxShadow: `0 0 0 18px ${accentRGBA(say, 0)}`, duration: 0.9, ease: "power2.out" });
        synth.speak(u);
      });
    }

    /* -------------------------------------------------- the reel
       A couple of screens of scroll where the page stops being a page.

       Four jobs, and they are deliberately four rather than one.

       a · the file. It is by a long way the heaviest thing on this site,
           and it hangs off a section most readers reach and plenty do
           not. So the <video> is rendered with no src at all
           (components/Sections.tsx) and one gets attached the first time
           the stage is within a screen of the viewport - close enough
           that there is time to buffer, far enough that a reader who
           turns back at WHO WE ARE never pays for it. The observer
           disconnects itself the moment it has done that: it exists to
           attach a string once, not to watch the page.

       b · the transport. Playing is gated on the stage actually being on
           screen, not on the preload margin above - a film running a
           screen and a half off-stage is a decode budget spent on
           nothing. It runs under reduced motion too: the film is this
           section's content, and pausing it off screen is housekeeping
           rather than choreography.

       c · the lock, and d · the window, below. Those two are one
           ScrollTrigger, and they are the only part reduced motion opts
           out of. */
    function initReel() {
      const stage = document.querySelector<HTMLElement>("[data-reel-stage]");
      const frame = document.querySelector<HTMLElement>("[data-reel-frame]");
      const film = document.querySelector<HTMLVideoElement>("[data-reel-film]");
      if (!stage || !frame || !film) return;

      /* Both of the jobs below are IntersectionObservers rather than
         ScrollTriggers, and that is a correction rather than a
         preference.

         The transport was a ScrollTrigger over the section's own box
         first, and it paused the film halfway through the close - which
         looks exactly like the video giving up as it shrinks. The cause
         is that ScrollTrigger refreshes triggers in the order they were
         created, and this one was created before the pin below it. So it
         measured the section *before* the pin's spacer had added two
         screens to it, and its "bottom top" end resolved about 200vh
         earlier than the section actually ends - which is to say, right
         in the middle of the close.

         An observer cannot have that bug. It is handed live geometry by
         the browser every time the element moves, it does not care that
         the element spends part of its life at position:fixed under the
         pin, and it has no notion of document order to get wrong. For a
         question as simple as "is this on screen" that is the right
         instrument. */

      /* a · the file, fetched early.
;
             This used to wait on an observer a screen and a half out,
             on the theory that a reader who never reaches WHO WE ARE
             should not pay for the heaviest asset on the site. That
             theory cost more than it saved: a screen and a half is a
             second or two of scrolling, which is not enough runway to
             buffer a film on anything but a fast line, so the common
             case was the lock engaging over an empty frame. The reel is
             the second section of the home page - practically everyone
             who lands here reaches it - so it is fetched as soon as the
             page is quiet, and preload="metadata" in the markup means
             the element has dimensions and a first frame long before
             that.

             requestIdleCallback keeps it behind the things that decide
             what the first screen looks like; the timeout is the
             backstop for browsers that never go idle (and for Safari,
             which has no such callback at all). */
      /* One source, and it is h264. A VP9 webm was cut of this same
         film to sit in front of it and came out half again as large at
         matched quality - this footage is flat colour and hard cuts,
         which is the shape x264 is already good at. A second file that
         is bigger than the first is not a fallback, it is a regression,
         so there is only the mp4. */
      const src = film.dataset.reelFilm;
      if (src && !film.src) {
        const fetchFilm = () => {
          if (ac.signal.aborted || film.src) return;
          film.src = src;
          /* an explicit load(): setting .src on an element that was
             parsed with preload="none" does not always start the fetch
             on its own */
          film.load();
        };
        const idle = (window as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        }).requestIdleCallback;
        if (idle) idle(fetchFilm, { timeout: 2500 });
        else {
          const t = window.setTimeout(fetchFilm, 1200);
          cleanups.push(() => window.clearTimeout(t));
        }
      }

      /* b · the transport. Runs whenever any part of the stage is on
             screen, plus a tenth of a screen either side so it is
             already going by the time it is worth looking at, and stops
             only once it is genuinely gone. Nothing about the open, the
             hold or the close can reach this - the film plays for the
             whole time it is visible and that is the entire rule. */
      /* The intent goes to keepPlaying rather than to play() directly.
         A bare play().catch(() => {}) asks exactly once per pass and
         swallows the answer, which is why the film "sometimes" did not
         run: the one ask often landed before a frame had decoded, or
         against an autoplay policy that would have relented the moment
         the reader touched anything. lib/autoplay.ts holds the intent
         and re-asserts it - on readiness, on a stall, on the first
         gesture - until it takes. */
      const projector = keepPlaying(film);
      cleanups.push(() => projector.destroy());

      const transport = new IntersectionObserver((entries) => {
        for (const e of entries) projector.want(e.isIntersecting);
      }, { rootMargin: "10% 0px", threshold: 0 });
      transport.observe(stage);
      observers.push(transport);

      /* The reader's own stop.

         The button (components/Sections.tsx) has no ink: the word lives
         in the cursor's disc, so all this has to do is keep the disc,
         the accessible name and the film saying the same thing.

         The pause goes through projector.hold rather than film.pause().
         A bare pause() would be undone within the second - lib/autoplay.ts
         listens for exactly that, on the assumption that a pause nobody
         asked for is a policy or a stall. hold() is how it is told this
         one was asked for.

         It deliberately outlives the section: scroll away from a paused
         film and back, and it is still paused. The transport keeps
         writing want() underneath, so letting go picks up wherever the
         reader is. */
      const toggle = document.querySelector<HTMLElement>("[data-reel-toggle]");
      if (toggle) {
        const hint = toggle.querySelector<HTMLElement>(".reel__hint");
        let paused = false;
        on(toggle, "click", () => {
          paused = !paused;
          projector.hold(paused);
          const word = paused ? "Play" : "Pause";
          toggle.setAttribute("data-cursor", word);
          toggle.setAttribute("aria-label", `${word} the film`);
          if (hint) hint.textContent = word;
        });
      }

      /* Under reduced motion the stylesheet has already left the window
         open, and nothing is pinned: the section is one plain screen of
         film in the flow of the page. Writing --reel-open here would be
         overriding the media query that said so. */
      if (prefersReduced) return;

      /* ---- the lock ----

         ScrollTrigger's pin, the same way the hero and the About panels
         hold a screen, and *not* position:sticky. That is worth spelling
         out because sticky is the obvious tool and it does not work on
         this site: body carries overflow-x:hidden (app/globals.css),
         which makes body a scroll container, and a sticky descendant of
         a scroll container that never itself scrolls never sticks. It
         fails silently - the element simply scrolls - so the symptom was
         not "the pin is broken", it was the whole section going past at
         full speed while this timeline scrubbed against it, which put
         full bleed at about the moment the film left the screen.

         HOLD is the length of the lock and the only number in this
         section anyone should need to move: 160% of the viewport, so a
         screen and a half of wheel is spent inside the film.

         ---- the beats ----

         The three durations below are read as shares of that, and the
         two that matter are the cuts: the open costs 40vh of scroll and
         the close 60vh, which is where they were when the move felt
         right and is why HOLD and the shares moved together rather than
         HOLD alone. What changed is the middle. Full bleed used to be
         held for a screen; it is held for 60vh now - the hold is the
         one beat that is not a move, so it is the one beat where extra
         length reads as the page having stopped rather than as the film
         being given room. It is still long enough to have watched some
         of the film rather than watched it arrive, which is the floor
         under this number.

         Not symmetrical, and on purpose. The close is half again as
         long as the open, because the two are not the same event: the
         open is an interruption and wants to be quick, the close is the
         page taking itself back and reads as abrupt at the same speed.

         Note what this leaves *outside* the lock. Before the pin
         engages, the shut frame - a small letterboxed clip on a black
         card - rides up into view on nothing but ordinary scroll, and
         after the pin releases it rides out the same way. Those two
         stretches are a screen each and they are free; they are what
         makes the lock read as the film taking the screen rather than
         as a video section beginning.

         Eased in and out rather than linear so the window does not start
         and stop dead on the wheel, and scrub:.5 so a flicked wheel
         still arrives smoothly instead of snapping the aperture to
         wherever the scroll landed. */
      const HOLD = "+=160%";

      const cut = { open: 0 };
      /* on the stage, not the frame: the label and the transport are the
         frame's siblings and both are written off this number, so it has
         to land somewhere all three inherit it from */
      const write = () => stage.style.setProperty("--reel-open", cut.open.toFixed(4));

      gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onUpdate: write,
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: HOLD,
          pin: stage,
          pinSpacing: true,
          /* the pin is a whole screen of black arriving at once, and on
             a smoothed scroller the hand-off can land a frame late and
             show as a jump. one frame of lead time is enough. */
          anticipatePin: 1,
          scrub: 0.5,
        },
      })
        .to(cut, { open: 1, duration: 20 })   // the open  - 40vh of scroll
        .to(cut, { open: 1, duration: 30 })   // the hold  - 60vh, was 100
        .to(cut, { open: 0, duration: 30 });  // the close - 60vh

      /* and the state the timeline has not been asked for yet - a reload
         with the scroll already inside the lock would otherwise leave the
         frame at whatever the stylesheet says until the first scroll
         event, which on a section that is supposed to be full-bleed is a
         small letterboxed window in the middle of a black screen with no
         explanation. */
      write();
    }

    /* -------------------------------------------------- the footer
       The page ends by being lifted off a room that was always there.

       Two things, and they are deliberately not one: the lift is scrubbed,
       because it *is* the scroll, and what happens in the room is played
       in real time, because a filament dying and a cord letting go are
       events with their own tempo - scrubbing them would let you hold a
       bulb half dead with the scroll wheel, which is the one thing that
       would give the whole conceit away.

       Everything in app/globals.css is written as the end of it: mark
       upright, cord gone, room dark, copy up. So this sets the *start* -
       hanging, alight, a white room, nothing else in it - and the
       timeline's job is to get back to the stylesheet. */
    function initFooter() {
      const foot = document.querySelector<HTMLElement>("[data-foot]");
      const page = document.querySelector<HTMLElement>("[data-foot-lift]");
      const run = document.querySelector<HTMLElement>("[data-foot-run]");
      if (!foot || !page || !run) return;

      const pivot = foot.querySelector<HTMLElement>("[data-foot-pivot]");
      const cord = foot.querySelector<HTMLElement>("[data-foot-cord]");
      const mark = foot.querySelector<HTMLElement>("[data-foot-mark]");
      if (!pivot || !cord || !mark) return;

      /* Two reveal groups, because the two addresses are tilted onto the
         ring by the stylesheet and a rise would overwrite that transform.
         They come up on opacity alone; everything else gets the rise. */
      const parts = gsap.utils.toArray<HTMLElement>("[data-foot-part]", foot);
      const fades = parts.filter((p) => p.dataset.footPart === "fade");
      const rises = parts.filter((p) => p.dataset.footPart !== "fade");

      const html = document.documentElement;

      /* --- the lift ---
         The page slides straight up off the room and does nothing else.

         It used to scale down a little as it went, which drew the sides in
         and let the room show along the left and right edges as well as
         the bottom - so the page read as receding into the distance rather
         than lifting away, and the white appeared on three sides at once.
         The only thing left is the bottom edge rounding off as it goes,
         which keeps the departing page reading as a card without ever
         moving its left or right edge. The upward travel is the scroll
         itself; nothing here has to animate it. */
      if (!prefersReduced) {
        gsap.fromTo(page,
          { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
          {
            borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
            ease: "none", immediateRender: false,
            scrollTrigger: { trigger: run, start: "top bottom", end: "top top", scrub: true },
          });
      }

      /* Reduced motion gets the stylesheet's own end state and no room
         to watch - the copy is all there, the mark is upright, and the
         only thing that happens is the page sliding off it. */
      if (prefersReduced) return;

      /* --- the pre-state ---
         The bulb is already there.

         It used to be parked a screen above the ceiling with no cord, and
         the sequence began by lowering it in - which meant the room was
         uncovered onto an empty ceiling and the fixture arrived afterwards,
         from nowhere, as a thing that happened *at* you. It hangs now, from
         the first pixel of the room you can see: lit, on a full cord, upside
         down the way a pendant bulb is, waiting. Nothing about the opening
         is animated any more. The only thing left to play is the ending. */
      const REST = 1.7;                 // degrees either side of plumb
      const hang = () => {
        gsap.set(foot, { "--lit": 1 });
        gsap.set(pivot, { rotation: -REST });
        gsap.set(cord, { scaleY: 1 });
        gsap.set(mark, { y: 0, rotation: 180 });
        gsap.set(rises, { autoAlpha: 0, y: 28 });
        gsap.set(fades, { autoAlpha: 0 });
      };
      hang();

      /* --- and it dangles the whole time ---
         A slow, shallow drift about the ceiling rose - a couple of degrees,
         four seconds a pass - so the fixture is alive while you scroll
         toward it rather than nailed to the ceiling. This is not part of the
         sequence and it is not on the scrub: it is the room's idle, running
         for as long as the room is uncovered at all, and the sequence's
         first move is to still it. */
      const idle = gsap.to(pivot, {
        rotation: REST,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        paused: true,
      });
      cleanups.push(() => idle.kill());

      const tl = gsap.timeline({ paused: true });

      /* This is the ending and only the ending, about two seconds of it.

         The arrival used to live in here too - the bulb lowered in on a
         growing cord, then four damped throws as the cord went taut - and
         all of that is gone, because the bulb is already hanging by the
         time anything below can fire (see hang() above). What is left is
         the light going out, the cord letting go, and the room filling in.

         1 · the drift stills. Whatever angle the idle happens to have the
             fixture at when the gate fires, it comes back to plumb - and it
             is a tween to a number rather than a resume of anything, so it
             does not matter where in its four seconds the idle was. */
      tl.to(pivot, { rotation: 0, duration: 0.5, ease: "sine.inOut" }, 0);

      /* 2 · it goes. Hard sets, not tweens, for the same reason the
            overture's ignition is hard sets: a filament is conducting or
            it is not, and easing between the two is what makes flicker
            look drawn. The room is the same number, so the white goes
            with it - the strobe is the whole screen, not the bulb. */
      /* Hard on the heels of the settle rather than a second and a half
         later: there is no arrival to wait out any more. */
      const OUT = 0.42;
      const strike = (v: number, t: number) => tl.set(foot, { "--lit": v }, OUT + t);
      strike(0.4, 0);
      strike(1, 0.04);
      strike(0, 0.09);
      strike(0.9, 0.16);
      strike(0, 0.2);
      strike(0.45, 0.32);
      strike(0, 0.36);
      strike(0.18, 0.44);
      tl.to(foot, { "--lit": 0, duration: 0.22, ease: "power2.in" }, OUT + 0.46);

      /* 3 · in the dark, the cord lets go. It retracts to the ceiling it
            came from, the mark drops the inch it was being held up by,
            and on the way back it turns over - so the thing that was a
            bulb hanging upside down finishes as the logo, the right way
            up, exactly where it already was. */
      const CUT = OUT + 0.78;
      tl.to(cord, { scaleY: 0, duration: 0.32, ease: "power2.in" }, CUT);
      tl.to(mark, { y: 26, duration: 0.2, ease: "power2.in" }, CUT);
      tl.to(mark, { y: 0, rotation: 0, duration: 0.72, ease: "power3.inOut" }, CUT + 0.18);

      /* 4 · and the room fills in around it, overlapping the turn rather
            than waiting for it to finish */
      tl.to(rises, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }, CUT + 0.5);
      tl.to(fades, { autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.08 }, CUT + 0.6);

      /* Three gates, because three different things are being asked here,
         and they used to be one.

         a · the chrome. A cream nav over a white room reads as a bug and
             the progress bar has nothing left to report, so both step off
             as soon as the room starts showing. This one has to work in
             both directions on every pass - scrolling back up must give
             the header back - which is exactly why it cannot go on sharing
             a trigger with the sequence below. */
      ScrollTrigger.create({
        trigger: run,
        start: "top 75%",
        onEnter: () => html.classList.add("is-foot"),
        onLeaveBack: () => html.classList.remove("is-foot"),
      });

      /* b · the idle. Runs for as long as there is any room to see it in,
             which is from the moment the page's bottom edge lifts. */
      ScrollTrigger.create({
        trigger: run,
        start: "top bottom",
        onEnter: () => idle.play(),
        onLeaveBack: () => idle.pause(),
      });

      /* c · the sequence, and it waits.

             It used to fire at a quarter uncovered and then play out behind
             the page that was still covering it - so the light went out,
             the cord let go and the copy came up while there was nothing
             but a strip of room to watch it in, and by the time you had
             actually arrived it was over. The whole ending happened
             off-stage.

             So it holds until the page above is off the screen: run's own
             top at the top of the viewport is <main> fully scrolled past
             and the room completely uncovered. 4% rather than a flat "top
             top" only because that is the last pixel of the document, and
             a gate on the exact end of the scroll is one you can stop a
             wheel-notch short of and never open.

             And it plays once. Not once per visit to the bottom - once.
             Scrolling back up and coming down again used to reset the room
             to a hanging bulb and no copy, which meant the footer's text
             was there or not there depending on how many times you had
             passed it. The ending is a thing that has happened. */
      ScrollTrigger.create({
        trigger: run,
        start: "top 4%",
        once: true,
        onEnter: () => { idle.pause(); tl.play(); },
      });

      /* And the case those gates cannot see: a page that is *already* past
         them when it is built. Reload with the scroll restored to the
         bottom of the page - which is exactly where anyone looking at the
         footer is - and there is no crossing for onEnter to fire on, so
         hang() had hidden every part of the room and nothing was ever
         going to bring them back. The room came up empty, and it came up
         empty only on a reload, which is what made it look random.

         Idempotent: on a normal load from the top every test is false and
         the gates above do the work. */
      const at = run.getBoundingClientRect().top;
      if (at <= window.innerHeight * 0.75) html.classList.add("is-foot");
      if (at <= window.innerHeight * 0.04) tl.play();
      else if (at <= window.innerHeight) idle.play();
    }

    /* -------------------------------------------------- boot */
    document.documentElement.classList.remove("no-js");

    /* Every step below is independent, and several of them are the only
       thing that will ever un-hide a piece of the page. Run bare and in a
       row, the first one to throw takes every later one with it - so one bad
       frame in, say, the cursor rig used to cost the hero its pin (and with
       it the WHO WE ARE section, dragged under the hero by a margin whose
       spacer was never built) and every [data-split] heading on the page,
       which sit at visibility:hidden until initSplits() reaches them. None
       of those failures announced itself; the section simply was not there.
       Isolated, a broken step costs its own feature and nothing else, and
       says so in the console. */
    const step = (name: string, fn: () => void) => {
      try { fn(); } catch (err) { console.error(`[socheers] ${name} failed`, err); }
    };

    step("readGrids", readGrids);
    step("initLenis", initLenis);
    step("initOvertureBridge", initOvertureBridge);   // must follow initLenis: it stops it
    step("initCursor", initCursor);
    step("initSpotlight", initSpotlight);
    step("initTilt", initTilt);
    step("initSplash", initSplash);
    step("initMagnetic", initMagnetic);

    step("initHero", initHero);
    /* Straight after the hero and before everything else, and the order
       is load-bearing rather than tidy. ScrollTrigger refreshes triggers
       in the order they were created, and both of these pin - which
       means each one inserts a spacer that pushes every element below it
       down the document. A trigger measured before that spacer exists
       resolves its start and end against a page that is two screens
       shorter than the one the reader gets.

       Down where this used to sit, the reel's own two screens of pin
       were added after initReveals, initCounters and the rest had
       already measured WHAT WE DO, the client wall and the awards row -
       so all of them were armed two screens early and had finished
       before the reader arrived. The two pins therefore go first, in
       document order: the hero is above the reel, so it settles the
       page's height first, and the reel settles the rest. */
    step("initReel", initReel);
    step("initMeaning", initMeaning);
    step("initSplits", initSplits);
    step("initReveals", initReveals);
    step("initTiles", initTiles);
    step("initWCardCycle", initWCardCycle);
    step("initCounters", initCounters);
    step("initNav", initNav);
    step("initTopLinks", initTopLinks);
    step("initMarquees", initMarquees);
    step("initFooter", initFooter);

    step("runLoader", runLoader);

    /* The backstop, for the copy that a stylesheet hides and a script is
       supposed to bring back. [data-split] waits on document.fonts.ready and
       .meaning waits on initHero, so anything that strands either promise -
       or an isolated failure above - leaves real text invisible with no way
       out. Nothing here runs on a healthy load: by four seconds every one of
       these has long since been revealed, and the check is a computed style
       read, not a write. */
    const watchdog = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>("[data-split], [data-meaning]")
        .forEach((el) => {
          if (getComputedStyle(el).visibility !== "hidden") return;
          console.warn("[socheers] revealing stranded element", el);
          gsap.set(el, { autoAlpha: 1 });
        });
    }, 4000);
    cleanups.push(() => window.clearTimeout(watchdog));

    on(window, "load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (ac.signal.aborted) return;
        reflow();
        ScrollTrigger.refresh();
      });
    }
  });

  /* -------------------------------------------------- teardown */
  return () => {
    ac.abort();
    pointer.release();
    cleanups.forEach((fn) => fn());
    tickers.forEach((fn) => gsap.ticker.remove(fn));
    observers.forEach((o) => o.disconnect());
    intervals.forEach((id) => window.clearInterval(id));
    splits.forEach((s) => s.revert());
    lenis?.destroy();
    lenis = null;
    active = null;
    ScrollTrigger.getAll().forEach((st) => st.kill());
    ctx.revert();
    /* The header is outside the route now (app/layout.tsx), so it is not
       rebuilt between pages - which means anything this page wrote onto
       :root and never took off would follow the reader to the next one.
       This one shifts the link capsule sideways to sit over the home
       hero's window; off the home page there is no window to sit over. */
    document.documentElement.style.removeProperty("--hero-cx");
    document.documentElement.classList.remove("is-foot");
    document.documentElement.classList.remove("is-pinned");
    document.documentElement.classList.add("no-js");
  };
}
