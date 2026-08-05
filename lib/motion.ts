/* ============================================================
   SoCheers — animation engine
   GSAP + ScrollTrigger + SplitText + Lenis

   Ported from the static build. Same behaviour, but everything it
   creates is tracked so initSite() can hand back a teardown — React
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
    // measured window (pixel scan of the artwork: x 771–1147, y 351–728), as a fraction of it
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
      const cards = gsap.utils.toArray<HTMLElement>("[data-scard]");
      const num = document.querySelector<HTMLElement>("[data-deck-num]");
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
      // fills the stage — uniform scale, window centre on stage centre, growing to
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
        gsap.set(cards, { autoAlpha: 0 });
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

      const pad = (n: number) => String(n).padStart(2, "0");
      const EXPAND = 0.34;                  // window finishes filling the screen here
      const per = (1 - EXPAND - 0.02) / cards.length;

      gsap.set(cards, { yPercent: 125, rotate: (i: number) => (i % 2 ? 9 : -9), autoAlpha: 0 });

      // Anything keyed to the hero pin has to hang off *this* trigger. A second
      // ScrollTrigger with the same trigger/start created afterwards measures the
      // hero from inside the pin-spacer, so its "top top" resolves to the end of
      // the pin instead of the start, and it never fires in the right place.
      const rail = document.querySelector<HTMLElement>(".rail");
      let layers: HTMLElement[] = [];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero, start: "top top", end: "+=600%",
          pin: true, scrub: 1, invalidateOnRefresh: true,
          // the rail stays out of the way until the window expand *and* the
          // image stack are done — they share this one pin
          onLeave: () => rail?.classList.add("is-visible"),
          onEnterBack: () => rail?.classList.remove("is-visible"),
          // counter tracks the pile in both directions
          onUpdate: (self) => {
            if (!num || !layers.length) return;
            const p = (self.progress - EXPAND) / (1 - EXPAND);
            const idx = gsap.utils.clamp(1, layers.length, Math.floor(p * layers.length) + 1);
            num.textContent = pad(idx);
          },
        },
      });

      /* — phase 1 · the window opens up —
         The window starts as the artwork's own picture and grows; the black-and-white
         photo fades up inside it partway through, so it lands full screen. */
      tl.fromTo(stage,
        { x: () => box().left, y: () => box().top, width: () => box().w, height: () => box().h },
        { x: 0, y: 0, width: () => pin.offsetWidth, height: () => pin.offsetHeight,
          duration: EXPAND, ease: "power2.inOut", onUpdate: fitCrop }, 0);
      // the artwork pushes toward the viewer and dissolves as its window takes over
      tl.to("[data-frame-img]", { scale: 1.45, duration: EXPAND, ease: "power2.inOut" }, 0);
      tl.to(photo, { autoAlpha: 1, duration: EXPAND * 0.42, ease: "power1.inOut" }, EXPAND * 0.22);
      tl.to(crop, { autoAlpha: 0, duration: EXPAND * 0.14 }, EXPAND * 0.64);
      tl.to(frame, { autoAlpha: 0, duration: EXPAND * 0.6, ease: "power2.in" }, EXPAND * 0.35);
      tl.to("[data-hero-cue]", { autoAlpha: 0, duration: 0.04 }, 0.02);
      tl.to("[data-hero-count]", { autoAlpha: 1, duration: 0.05 }, EXPAND * 0.8);

      /* — phase 2 · images stack on top — */
      layers = [stage, ...cards];
      cards.forEach((card, i) => {
        const at = EXPAND + 0.02 + i * per;
        tl.to(card, {
          yPercent: 0, rotate: (i - (cards.length - 1) / 2) * 2.4, autoAlpha: 1,
          duration: per, ease: "power3.out",
        }, at);
        // push everything already in the pile back
        for (let j = 0; j <= i; j++) {
          const depth = i + 1 - j;
          tl.to(layers[j], {
            scale: 1 - depth * 0.04,
            filter: `brightness(${Math.max(0.32, 1 - depth * 0.2)})`,
            duration: per, ease: "power3.out",
          }, at);
        }
      });

    }

    /* -------------------------------------------------- SplitText lines */
    function initSplits() {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const build = () => {
          if (ac.signal.aborted) return;
          if (prefersReduced) { gsap.set(el, { autoAlpha: 1 }); return; }
          const split = new SplitText(el, { type: "lines", linesClass: "split-line" });
          splits.push(split);
          gsap.set(el, { autoAlpha: 1 });
          gsap.set(split.lines, { yPercent: 115 });
          split.lines.forEach((l) => {
            const wrap = document.createElement("span");
            wrap.style.display = "block";
            wrap.style.overflow = "hidden";
            l.parentNode?.insertBefore(wrap, l);
            wrap.appendChild(l);
          });
          gsap.to(split.lines, {
            yPercent: 0, duration: 0.95, ease: "power4.out", stagger: 0.07,
            scrollTrigger: { trigger: el, start: "top 84%" },
          });
        };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
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

      on(window, "mousemove", ((e: MouseEvent) => {
        xTo(e.clientX); yTo(e.clientY);
        if (rxTo && ryTo) { rxTo(e.clientX); ryTo(e.clientY); }
      }) as EventListener);

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
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const img = el.querySelector("img");
        const rX = gsap.quickTo(el, "rotationX", { duration: 0.7, ease: "power3" });
        const rY = gsap.quickTo(el, "rotationY", { duration: 0.7, ease: "power3" });
        const tZ = gsap.quickTo(el, "z", { duration: 0.7, ease: "power3" });
        const iX = img && gsap.quickTo(img, "xPercent", { duration: 0.9, ease: "power3" });
        const iY = img && gsap.quickTo(img, "yPercent", { duration: 0.9, ease: "power3" });

        on(el, "mousemove", ((e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rX(-py * 11); rY(px * 13); tZ(34);
          if (iX && iY) { iX(px * -5); iY(py * -5); }
        }) as EventListener);
        on(el, "mouseleave", () => {
          rX(0); rY(0); tZ(0);
          if (iX && iY) { iX(0); iY(0); }
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

    /* -------------------------------------------------- boot */
    document.documentElement.classList.remove("no-js");

    readGrids();
    initLenis();
    initCursor();
    initSpotlight();
    initTilt();
    initMagnetic();

    initHero();
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
    splits.forEach((s) => s.revert());
    lenis?.destroy();
    lenis = null;
    ScrollTrigger.getAll().forEach((st) => st.kill());
    ctx.revert();
    document.documentElement.classList.add("no-js");
  };
}
