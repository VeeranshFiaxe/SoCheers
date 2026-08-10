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

gsap.registerPlugin(ScrollTrigger, SplitText);

type Grid = { tiles: HTMLElement[]; cols: number; rows: number };

export function initSite(): () => void {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover:hover)").matches;

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
  let lenis: Lenis | null = null;

  const ctx = gsap.context(() => {
    /* -------------------------------------------------- Lenis */
    function initLenis() {
      if (prefersReduced) return;
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
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

    /* -------------------------------------------------- preloader */
    function runLoader() {
      const loader = document.getElementById("loader");
      const countEl = document.getElementById("loaderCount");
      if (!loader) return;
      if (prefersReduced) { loader.style.display = "none"; return; }

      let done = false;
      const finish = () => {
        if (done) return; done = true;
        loader.style.display = "none";
        heroIntro();
      };
      const safety = setTimeout(finish, 4200);

      const state = { v: 0 };
      const tl = gsap.timeline({ onComplete: () => { clearTimeout(safety); finish(); } });
      tl.to(state, {
        v: 100, duration: 1.5, ease: "power2.inOut",
        onUpdate: () => { if (countEl) countEl.textContent = String(Math.round(state.v)); },
      });
      tl.to(".loader__sheet", { scaleY: 1, duration: 0.55, ease: "power4.in", transformOrigin: "bottom" }, "+=0.05");
      tl.to(".loader__inner", { autoAlpha: 0, duration: 0.3 }, "<0.05");
    }

    /* -------------------------------------------------- hero intro */
    function heroIntro() {
      if (prefersReduced) return;
      const host = document.querySelector("[data-hero-stage] [data-pixgrid]");
      const g = host && grids.get(host);

      const tl = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
      // the window crop is the same artwork, so it has to ride the same push-in
      tl.from("[data-frame-img], [data-stage-crop]", { scale: 1.12, autoAlpha: 0, duration: 1.6, ease: "power3.out" }, 0);
      if (g) {
        tl.set(g.tiles, { opacity: 1 }, 0);
        tl.to(g.tiles, {
          opacity: 0, duration: 0.5, ease: "power2.inOut",
          stagger: { amount: 0.8, grid: [g.rows, g.cols], from: "random" },
        }, 0.5);
      }
      tl.from("[data-hero-cue]", { autoAlpha: 0, duration: 0.6 }, 0.9);
    }

    /* -------------------------------------------------- hero pinned sequence
       Phase 1: the window inside the SOC▢HEERS artwork grows to full screen
       while the artwork pushes in and dissolves.
       Phase 2: more images stack on top of it. One pin, one continuous scroll. */
    const FRAME = { w: 1914, h: 1073 };          // artwork natural size
    // measured window (pixel scan of the artwork: x 771-1147, y 351-728), as a fraction of it
    const WIN = { l: 0.4028, t: 0.3271, w: 0.197, h: 0.3523 };
    // the same crowd shot, full size. The artwork's window is its centred square
    // (correlation-matched at 1:1), so this is the region that must line up.
    const PHOTO = { w: 1919, h: 1079 };
    const PWIN = { l: 0.2189, t: 0, w: 0.5623, h: 1 };

    function initHero() {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const pin = document.querySelector<HTMLElement>("[data-hero-pin]");
      const frame = document.querySelector<HTMLElement>("[data-frame]");
      const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
      const crop = document.querySelector<HTMLElement>("[data-stage-crop]");
      const photo = document.querySelector<HTMLElement>("[data-stage-img]");
      const entry = document.querySelector<HTMLElement>("[data-meaning]");
      if (!hero || !pin || !frame || !stage) return;

      // Where the artwork's window lands on screen. The artwork is object-fit:cover,
      // so mirror that maths to find the window's real rendered rect.
      const box = () => {
        const bw = pin.offsetWidth, bh = pin.offsetHeight;
        const scale = Math.max(bw / FRAME.w, bh / FRAME.h);
        const rw = FRAME.w * scale, rh = FRAME.h * scale;
        const ox = (bw - rw) / 2, oy = (bh - rh) / 2;
        return { left: ox + rw * WIN.l, top: oy + rh * WIN.t, w: rw * WIN.w, h: rh * WIN.h };
      };

      // Blow an image up around a named region of itself so that region exactly
      // fills the stage - uniform scale, window centre on stage centre, growing to
      // cover if the stage ever gets taller than the region. Run over both layers
      // it puts the artwork's window and the photo on identical framing, so the
      // crop is seamless with the artwork at rest and the cross-fade never ghosts.
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
      const fitCrop = () => { fit(crop, FRAME, WIN); fit(photo, PHOTO, PWIN); };

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
        // no scroll sequence: park the photo full screen and keep it fitted
        const still = () => {
          gsap.set(stage, { x: 0, y: 0, width: pin.offsetWidth, height: pin.offsetHeight });
          fitCrop();
        };
        still();
        on(window, "resize", still);
        gsap.set(frame, { autoAlpha: 0 });
        gsap.set(crop, { autoAlpha: 0 });
        gsap.set(photo, { autoAlpha: 1 });
        // the entry is simply there, already written
        gsap.set(entry, { autoAlpha: 1 });
        // no pin here, so gate the rail on the hero itself
        const reducedRail = document.querySelector<HTMLElement>(".rail");
        if (reducedRail) {
          ScrollTrigger.create({
            trigger: hero, start: "top top", end: "bottom top",
            onLeave: () => reducedRail.classList.add("is-visible"),
            onEnterBack: () => reducedRail.classList.remove("is-visible"),
          });
        }
        return;
      }

      seat();
      on(window, "resize", seat);
      gsap.set(photo, { autoAlpha: 0 });

      /* Timeline shape, as fractions of the pin:
           0 ──── EXPAND ──── +HOLD0 ──── ENTRY (the definition) ──── hold ──── 1 */
      const EXPAND = 0.30;                        // window finishes filling the screen here
      const HOLD0 = 0.08;                         // the photo holds, undisturbed, before the type
      const ENTRY = 0.44;                         // the entry writes itself in
      const AT = EXPAND + HOLD0;                  // where the entry starts
      // the remaining ~0.18 is the hold on the finished entry before the pin releases

      gsap.set(entry, { autoAlpha: 1 });

      // Anything keyed to the hero pin has to hang off *this* trigger. A second
      // ScrollTrigger with the same trigger/start created afterwards measures the
      // hero from inside the pin-spacer, so its "top top" resolves to the end of
      // the pin instead of the start, and it never fires in the right place.
      const rail = document.querySelector<HTMLElement>(".rail");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero, start: "top top", end: "+=260%",
          pin: true, scrub: 1, invalidateOnRefresh: true,
          // the rail stays out of the way until the window expand *and* the
          // definition are done - they share this one pin
          onLeave: () => rail?.classList.add("is-visible"),
          onEnterBack: () => rail?.classList.remove("is-visible"),
        },
      });

      /* - phase 1 · the window opens up -
         The window starts as the artwork's own picture and grows; the black-and-white
         photo fades up inside it partway through, so it lands full screen. */
      // power2.out, not inOut: an eased-in start meant the first stretch of
      // scroll showed almost no growth, compounding the long-runway feel
      tl.fromTo(stage,
        { x: () => box().left, y: () => box().top, width: () => box().w, height: () => box().h },
        { x: 0, y: 0, width: () => pin.offsetWidth, height: () => pin.offsetHeight,
          duration: EXPAND, ease: "power2.out", onUpdate: fitCrop }, 0);
      // the artwork pushes toward the viewer and dissolves as its window takes over
      tl.to("[data-frame-img]", { scale: 1.45, duration: EXPAND, ease: "power2.out" }, 0);
      tl.to(photo, { autoAlpha: 1, duration: EXPAND * 0.42, ease: "power1.inOut" }, EXPAND * 0.22);
      tl.to(crop, { autoAlpha: 0, duration: EXPAND * 0.14 }, EXPAND * 0.64);
      tl.to(frame, { autoAlpha: 0, duration: EXPAND * 0.6, ease: "power2.in" }, EXPAND * 0.35);
      tl.to("[data-hero-cue]", { autoAlpha: 0, duration: 0.04 }, 0.02);

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

      // "MAKING MORE HAPPEN" draws down its edge
      tl.fromTo("[data-meaning-side]",
        { autoAlpha: 0, y: -34 },
        { autoAlpha: 1, y: 0, duration: ENTRY * 0.3, ease: "power2.out" }, E(0.1));

      // the headword drops in and settles out of a tilt
      tl.fromTo("[data-meaning-word]",
        { autoAlpha: 0, yPercent: 34, rotate: -3.5, scale: 0.94 },
        { autoAlpha: 1, yPercent: 0, rotate: 0, scale: 1,
          duration: ENTRY * 0.4, ease: "power3.out" }, E(0.12));
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
    }

    /* -------------------------------------------------- SplitText lines
       Block wipe, line by line: a solid accent bar sweeps across the line,
       then retracts off the far edge, uncovering the type it was hiding.
       Reads as the headline being printed onto the page on arrival, which
       is why it earns its place: it marks where each section begins.

       The reveal is pure transform (the bar's scaleX). The type itself is
       only ever toggled instantly, at the frame the bar has it fully
       covered, so nothing expensive animates. */
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

          const bars: HTMLElement[] = [];
          split.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "wipe";
            // the split tree is presentation; the sr copy below carries the text
            mask.setAttribute("aria-hidden", "true");
            line.parentNode?.insertBefore(mask, line);
            mask.appendChild(line);

            const bar = document.createElement("span");
            bar.className = "wipe__bar";
            mask.appendChild(bar);
            bars.push(bar);
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

          // Bar colour is tiered by how much text it crosses. A hot accent bar
          // is right for a two-word title and awful across a five-line
          // paragraph, where it strobes; long copy gets a near-neutral block.
          const n = split.lines.length;
          const tier = n <= 2 ? "var(--accent)" : n <= 4 ? "var(--accent-off)" : "var(--wipe-tint)";
          el.style.setProperty("--wipe-bar", tier);

          // Sweep direction, per element. Default is left-to-right; opt an
          // element out with data-wipe="left" to break up a long page, or
          // data-wipe="down" for a vertical top-to-bottom block wipe.
          const dir = el.getAttribute("data-wipe");
          const vertical = dir === "down";
          const leftward = dir === "left";
          const axis = vertical ? "Y" : "X";
          const growFrom = vertical ? "center top" : leftward ? "right center" : "left center";
          const shrinkTo = vertical ? "center bottom" : leftward ? "left center" : "right center";
          // negative bottom keeps the descender room the mask just bought us
          const hidden = vertical
            ? "inset(0% 0% 100% 0%)"
            : leftward ? "inset(0% 0% -0.3em 100%)" : "inset(0% 100% -0.3em 0%)";
          const shown = "inset(0% 0% -0.3em 0%)";

          gsap.set(split.lines, { clipPath: hidden });
          gsap.set(bars, { transformOrigin: growFrom, scaleX: 1, scaleY: 1 });

          const COVER = 0.3, UNCOVER = 0.5, STEP = 0.075;
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 84%" } });
          bars.forEach((bar, i) => {
            const at = i * STEP;
            // 1 · the bar sweeps in until the line is fully covered
            tl.fromTo(bar, { [`scale${axis}`]: 0 }, { [`scale${axis}`]: 1, duration: COVER, ease: "power2.inOut" }, at);
            // 2 · it retracts off the far edge while the type wipes open in
            //     lockstep behind it, so the bar reads as depositing the text
            //     rather than uncovering something that was already sitting there
            tl.set(bar, { transformOrigin: shrinkTo }, at + COVER);
            tl.to(bar, { [`scale${axis}`]: 0, duration: UNCOVER, ease: "power3.inOut" }, at + COVER);
            tl.to(split.lines[i], {
              clipPath: shown, duration: UNCOVER, ease: "power3.inOut",
            }, at + COVER);
          });
        };
        // build on both settle paths: a rejected fonts.ready must not strand
        // the text behind visibility:hidden
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(build, build);
        else build();
      });
    }

    /* -------------------------------------------------- reveals + clip wipes */
    function initReveals() {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      if (prefersReduced) return;
      document.querySelectorAll<HTMLElement>("[data-clip]").forEach((el, i) => {
        gsap.fromTo(el,
          { clipPath: "inset(0% 0% 100% 0%)", y: 34 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.15, ease: "power3.inOut", delay: (i % 3) * 0.08,
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

    /* -------------------------------------------------- counters */
    function initCounters() {
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const end = parseFloat(el.getAttribute("data-count") || "0");
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: el, start: "top 88%", once: true,
          onEnter: () => gsap.to(obj, { v: end, duration: 1.7, ease: "power2.out",
            onUpdate: () => { el.textContent = String(Math.round(obj.v)); } }),
        });
      });
    }

    /* -------------------------------------------------- marquees */
    let reflow = () => {};
    function initMarquees() {
      const items: {
        track: HTMLElement; dir: number; half: number;
        current: number; boost: number; base: number;
      }[] = [];
      document.querySelectorAll<HTMLElement>("[data-marquee]").forEach((track) => {
        const dir = track.getAttribute("data-marquee") === "right" ? 1 : -1;
        const state = { track, dir, half: track.scrollWidth / 2, current: 0, boost: 0, base: 30 };
        items.push(state);
        if (lenis) {
          lenis.on("scroll", (e: { velocity?: number }) => {
            state.boost += gsap.utils.clamp(-30, 30, (e.velocity || 0) * dir);
          });
        }
      });
      let last = performance.now();
      addTicker(() => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        items.forEach((s) => {
          if (!s.half) return;
          s.current += (s.half / s.base) * s.dir * dt + s.boost * dt;
          s.boost *= 0.9;
          if (s.dir < 0 && s.current <= -s.half) s.current += s.half;
          if (s.dir > 0 && s.current >= 0) s.current -= s.half;
          gsap.set(s.track, { x: s.current });
        });
      });
      reflow = () => items.forEach((s) => { s.half = s.track.scrollWidth / 2; });
      on(window, "resize", () => reflow());
    }

    /* -------------------------------------------------- section rail */
    /* (the rail's show/hide gate lives on the hero pin trigger in initHero) */
    function initRail() {
      const items = document.querySelectorAll<HTMLElement>(".rail__item");
      if (!items.length) return;
      const setActive = (i: number) =>
        items.forEach((it, n) => it.classList.toggle("is-active", n === i));
      document.querySelectorAll<HTMLElement>("[data-sec]").forEach((sec) => {
        const i = parseInt(sec.dataset.sec || "0", 10);
        ScrollTrigger.create({
          trigger: sec, start: "top 55%", end: "bottom 55%",
          onEnter: () => setActive(i), onEnterBack: () => setActive(i),
        });
      });
    }

    /* -------------------------------------------------- cursor (dot + ring) */
    function initCursor() {
      const cursor = document.querySelector<HTMLElement>(".cursor");
      const ring = document.querySelector<HTMLElement>(".cursor-ring");
      const label = cursor && cursor.querySelector<HTMLElement>(".cursor__label");
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

      document.querySelectorAll<HTMLElement>("[data-cursor]").forEach((el) => {
        on(el, "mouseenter", () => {
          cursor.classList.add("is-active");
          ring?.classList.add("is-active");
          if (label) label.textContent = el.getAttribute("data-cursor");
        });
        on(el, "mouseleave", () => {
          cursor.classList.remove("is-active");
          ring?.classList.remove("is-active");
          if (label) label.textContent = "";
        });
      });
    }

    /* -------------------------------------------------- cursor spotlight */
    function initSpotlight() {
      const spot = document.querySelector<HTMLElement>(".spotlight");
      if (!spot || !canHover || prefersReduced) return;
      let tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty;
      on(window, "mousemove", ((e: MouseEvent) => { tx = e.clientX; ty = e.clientY; }) as EventListener);
      addTicker(() => {
        cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
        spot.style.setProperty("--mx", cx + "px");
        spot.style.setProperty("--my", cy + "px");
      });
    }

    /* -------------------------------------------------- 3D tilt + inner parallax */
    function initTilt() {
      if (!canHover || prefersReduced) return;
      const els = gsap.utils.toArray<HTMLElement>("[data-tilt]");
      if (!els.length) return;

      // The tilt used to fire only on mousemove *over* the element, so you never
      // saw it until you were already on it. Now the cursor pulls from a
      // distance: a faint lean as it approaches, full strength once it's on.
      // quickTo's easing smooths the step at the edge, so there's no pop.
      const REACH = 700;      // px beyond the element's edge that still pulls
      const AMBIENT = 0.3;    // share of the full tilt while merely approaching

      type Tilt = {
        el: HTMLElement; hover: boolean; onScreen: boolean;
        rX: gsap.QuickToFunc; rY: gsap.QuickToFunc; tZ: gsap.QuickToFunc;
        iX: gsap.QuickToFunc | null; iY: gsap.QuickToFunc | null;
      };

      const items = new Map<Element, Tilt>();
      els.forEach((el) => {
        const img = el.querySelector("img");
        items.set(el, {
          el, hover: false, onScreen: false,
          rX: gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3" }),
          rY: gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3" }),
          tZ: gsap.quickTo(el, "z", { duration: 0.8, ease: "power3" }),
          iX: img ? gsap.quickTo(img, "xPercent", { duration: 1, ease: "power3" }) : null,
          iY: img ? gsap.quickTo(img, "yPercent", { duration: 1, ease: "power3" }) : null,
        });
        on(el, "mouseenter", () => { const it = items.get(el); if (it) it.hover = true; });
        on(el, "mouseleave", () => { const it = items.get(el); if (it) it.hover = false; });
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

      // driven off the ticker, not mousemove: during the hero pin the cards move
      // under a stationary cursor, and a mousemove-only tilt would go stale
      let mx = 0, my = 0, live = false;
      on(window, "mousemove", ((e: MouseEvent) => {
        mx = e.clientX; my = e.clientY; live = true;
      }) as EventListener);

      const clamp = gsap.utils.clamp(-0.5, 0.5);
      addTicker(() => {
        if (!live) return;
        items.forEach((it) => {
          if (!it.onScreen) return;
          const r = it.el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const px = clamp((mx - cx) / r.width);
          const py = clamp((my - cy) / r.height);
          // how far outside the box the cursor is, 0 while it's over it
          const out = Math.hypot(
            Math.max(0, Math.abs(mx - cx) - r.width / 2),
            Math.max(0, Math.abs(my - cy) - r.height / 2),
          );
          const s = it.hover ? 1 : AMBIENT * Math.max(0, 1 - out / REACH);
          it.rX(-py * 11 * s);
          it.rY(px * 13 * s);
          it.tZ(34 * s);
          if (it.iX && it.iY) { it.iX(px * -5 * s); it.iY(py * -5 * s); }
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
      if (!canHover || prefersReduced) return;

      const REACH = 900;      // px from centre at which the cursor starts to register
      const MAX_PULL = 34;    // px of travel at full commitment

      type Item = {
        el: HTMLElement; onScreen: boolean;
        xTo: gsap.QuickToFunc; yTo: gsap.QuickToFunc; rTo: gsap.QuickToFunc;
      };

      const items = new Map<Element, Item>();
      els.forEach((el) => {
        items.set(el, {
          el, onScreen: false,
          xTo: gsap.quickTo(el, "x", { duration: 1.05, ease: "power3" }),
          yTo: gsap.quickTo(el, "y", { duration: 1.05, ease: "power3" }),
          rTo: gsap.quickTo(el, "rotation", { duration: 1.4, ease: "power3" }),
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

      // ticker rather than mousemove: the section scrolls under a still cursor
      let mx = 0, my = 0, live = false;
      on(window, "mousemove", ((e: MouseEvent) => {
        mx = e.clientX; my = e.clientY; live = true;
      }) as EventListener);

      addTicker(() => {
        if (!live) return;
        items.forEach((it) => {
          if (!it.onScreen) return;
          const r = it.el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const dx = mx - (r.left + r.width / 2);
          const dy = my - (r.top + r.height / 2);
          const dist = Math.hypot(dx, dy) || 1;
          const prox = 1 - Math.min(dist / REACH, 1);
          const k = prox * prox;                        // indifferent until it is close
          const pull = Math.min(dist, MAX_PULL) * k;    // never overshoots the pointer
          it.xTo((dx / dist) * pull);
          it.yTo((dy / dist) * pull);
          it.rTo((dx / dist) * k * 3);                  // a few degrees of lean, no more
        });
      });
    }

    /* -------------------------------------------------- magnetic */
    function initMagnetic() {
      if (!canHover) return;
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
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
      let lastY = 0;
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          if (bar) bar.style.width = (self.progress * 100).toFixed(2) + "%";
          const y = self.scroll();
          if (nav) nav.classList.toggle("is-hidden", y > lastY && y > 500);
          lastY = y;
        },
      });
    }

    /* -------------------------------------------------- the meaning entry
       The reveal itself is part of the hero pin (see initHero, phase 2), since
       the entry is written over the hero's own photo. All that is left here is
       the speaker: speechSynthesis, so there is no audio asset to ship, and it
       takes itself off the page on engines that lack it. */
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
        // a ring of accent pushed outward: the visual for the sound
        gsap.fromTo(say,
          { boxShadow: "0 0 0 0 rgba(47,229,137,.5)" },
          { boxShadow: "0 0 0 18px rgba(47,229,137,0)", duration: 0.9, ease: "power2.out" });
        synth.speak(u);
      });
    }

    /* -------------------------------------------------- boot */
    document.documentElement.classList.remove("no-js");

    readGrids();
    initLenis();
    initCursor();
    initSpotlight();
    initTilt();
    initSplash();
    initMagnetic();

    initHero();
    initMeaning();
    initSplits();
    initReveals();
    initTiles();
    initCounters();
    initRail();
    initNav();
    initMarquees();

    runLoader();

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
    tickers.forEach((fn) => gsap.ticker.remove(fn));
    observers.forEach((o) => o.disconnect());
    splits.forEach((s) => s.revert());
    lenis?.destroy();
    lenis = null;
    ScrollTrigger.getAll().forEach((st) => st.kill());
    ctx.revert();
    document.documentElement.classList.add("no-js");
  };
}
