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
import { OVERTURE_DONE, OVERTURE_START, shouldRunOverture } from "./overture";
import { MEANING, WCARD_SFX } from "./content";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Grid = { tiles: HTMLElement[]; cols: number; rows: number };

export function initSite(): () => void {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover:hover)").matches;
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
      if (overture) {
        // a reload mid-page would otherwise restore the scroll under the
        // sequence and hand back to the wrong part of the site
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        lock();
      }
    }

    /* -------------------------------------------------- preloader */
    function runLoader() {
      const loader = document.getElementById("loader");
      const countEl = document.getElementById("loaderCount");
      if (!loader) return;
      if (prefersReduced) { loader.style.display = "none"; return; }
      // The overture runs its own count, over its own black, and the hero
      // arrives already pushed in at the end of its camera move - so both
      // this and heroIntro() would be a second, contradictory opening.
      if (overture) { loader.style.display = "none"; return; }

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
      // the stage photo sits inside the same window as the artwork, so it
      // rides the same push-in
      tl.from("[data-frame-img], [data-stage-img]", { scale: 1.12, autoAlpha: 0, duration: 1.6, ease: "power3.out" }, 0);
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
    const STAGE_DIM = 0.55;             // the brightness() phase 2 settles on

    /* .hero__stage-vignette, evaluated in JS - the black-alpha of the edge
       fade at a point (u,v) inside the stage box, so a fallen-apart grain
       can be painted with the same darkening the real layer had. Two
       gradients, composited the way the browser composites them. */
    function vignetteAt(u: number, v: number) {
      // linear-gradient(to right, #000 0%, transparent 20%, transparent 80%, #000 100%)
      const edge = (t: number) => (t < 0.2 ? 1 - t / 0.2 : t > 0.8 ? (t - 0.8) / 0.2 : 0);
      // radial-gradient(ellipse at center, transparent 78%, rgba(0,0,0,.6) 100%),
      // farthest-corner, so the corner of the box is r = 1
      const r = Math.hypot((u - 0.5) * 2, (v - 0.5) * 2) / Math.SQRT2;
      const rad = r <= 0.78 ? 0 : Math.min(1, (r - 0.78) / 0.22) * 0.6;
      return 1 - (1 - edge(u)) * (1 - rad);
    }

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

      // Where the artwork's window lands on screen. The artwork is object-fit:cover,
      // so mirror that maths to find the window's real rendered rect.
      const box = () => {
        const bw = pin.offsetWidth, bh = pin.offsetHeight;
        const scale = Math.max(bw / FRAME.w, bh / FRAME.h);
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

      // "MAKING MORE HAPPEN" draws down its edge
      tl.fromTo("[data-meaning-side]",
        { autoAlpha: 0, y: -34 },
        { autoAlpha: 1, y: 0, duration: ENTRY * 0.3, ease: "power2.out" }, E(0.1));

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
      crumble(tl, 1, CRUMBLE, pin, boxEnd, [backdrop, stage]);

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

      /* The pin exists purely to hold the layout - a spacer exactly one
         viewport tall, cancelled out by .who's own -100vh margin (globals.css)
         so it sits right at the hero's natural bottom edge with no gap. It
         does not drive anything: scrub is off, and the section only ever
         moves through this space in one jump (below), never by scrolling
         through it a pixel at a time. */
      const st = ScrollTrigger.create({
        trigger: hero, start: "top top", end: "+=100%", pin: true,
        onEnter: () => { locked = true; lenis?.stop(); },
        onEnterBack: () => { reclaim(); },
      });
      // the hero is on screen at rest as soon as it mounts - lock the page
      // right away rather than waiting for a scroll event to discover it
      lenis?.stop();

      const play = (time: number, duration: number, onDone?: () => void) => {
        busy = true;
        gsap.to(tl, {
          time, duration, ease: "none",
          onComplete: () => { busy = false; cooldown = performance.now() + 420; onDone?.(); },
        });
      };

      const advance = () => {
        if (phase === "rest") { phase = "hold"; play(HOLD, 2.6); return; }
        if (phase === "hold") {
          phase = "done";
          play(DONE, 1.5, () => {
            // hand scroll back to the page, seated exactly where the pin
            // ends - the crumble already carried the picture, so nothing
            // visibly moves, and normal scroll just continues into WHO WE ARE
            locked = false;
            lenis?.scrollTo(st.end, { immediate: true, force: true });
            lenis?.start();
            ScrollTrigger.update();
          });
        }
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
        if (locked) return;
        locked = true;
        lenis?.stop();
        if (phase === "done" && !busy) retreat();
      };

      const canAct = () => !busy && performance.now() > cooldown;
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
        !locked && up && phase === "done" && window.scrollY <= st.end;

      const onWheel = (e: WheelEvent) => {
        if (!locked) {
          if (!returning(e.deltaY < 0)) return;
          e.preventDefault();
          reclaim();                     // starts the reverse itself
          return;
        }
        e.preventDefault();
        if (Math.abs(e.deltaY) < 4) return;
        intent(e.deltaY > 0 ? 1 : -1);
      };
      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
      const onTouchMove = (e: TouchEvent) => {
        const y = e.touches[0]?.clientY ?? touchY;
        const dy = touchY - y;
        if (!locked) {
          if (!returning(dy < 0)) return;
          e.preventDefault();
          reclaim();
          return;
        }
        e.preventDefault();
        if (Math.abs(dy) < 6) return;
        touchY = y;
        intent(dy > 0 ? 1 : -1);
      };
      window.addEventListener("wheel", onWheel, { signal: ac.signal, passive: false });
      window.addEventListener("touchstart", onTouchStart, { signal: ac.signal, passive: true });
      window.addEventListener("touchmove", onTouchMove, { signal: ac.signal, passive: false });
    }

    /* -------------------------------------------------- the hero crumbling
       The hero's last frame, rebuilt as grains so it can fall apart.

       Every grain is painted to match what is under it - the sharp photo
       inside the stage's rectangle, carrying the same vignette and dim the
       real layer has; flat black outside it, same as the backdrop - so
       handing over from the real layers to the grid moves nothing on
       screen. Then the
       grid pours off the bottom of the pin, bottom row first, the ones
       above following into the gap, with a per-grain offset so the eroding
       edge stays ragged instead of marching row by row. */
    function crumble(
      tl: gsap.core.Timeline,
      at: number,
      dur: number,
      pin: HTMLElement,
      boxEnd: () => { left: number; top: number; w: number; h: number },
      hide: (HTMLElement | null)[],
    ) {
      const host = document.querySelector<HTMLElement>("[data-crumble]");
      const photo = document.querySelector<HTMLImageElement>("[data-stage-img]");
      if (!host || !photo) return;
      const grains = Array.from(host.querySelectorAll<HTMLElement>("i"));
      if (!grains.length) return;

      const cols = parseInt(host.dataset.cols || "48", 10);
      const rows = parseInt(host.dataset.rows || "27", 10);
      const src = photo.getAttribute("src") || "";

      const paint = () => {
        const pw = pin.offsetWidth, ph = pin.offsetHeight;
        if (!pw || !ph) return;
        const tw = pw / cols, th = ph / rows;

        // the stage's resting rectangle: the contained box, scaled about its
        // own centre by the settle phase 2 applies
        const b = boxEnd();
        const bw = b.w * STAGE_REST, bh = b.h * STAGE_REST;
        const bl = b.left + b.w / 2 - bw / 2, bt = b.top + b.h / 2 - bh / 2;

        // initHero's fit(), replayed for that rectangle
        let iw = bw / PWIN.w, ih = iw * (PHOTO.h / PHOTO.w);
        if (ih * PWIN.h < bh) { const k = bh / (ih * PWIN.h); iw *= k; ih *= k; }
        const ix = bl + bw / 2 - (PWIN.l + PWIN.w / 2) * iw;
        const iy = bt + bh / 2 - (PWIN.t + PWIN.h / 2) * ih;

        grains.forEach((g, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          const u = ((c + 0.5) * tw - bl) / bw;
          const v = ((r + 0.5) * th - bt) / bh;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            g.style.backgroundColor = "";
            g.style.backgroundImage = `url("${src}")`;
            g.style.backgroundSize = `${iw.toFixed(1)}px ${ih.toFixed(1)}px`;
            g.style.backgroundPosition =
              `${(ix - c * tw).toFixed(1)}px ${(iy - r * th).toFixed(1)}px`;
            // the vignette, then the stage's brightness over it - one black
            // overlay that comes to the same place as the two stacked
            const a = 1 - STAGE_DIM * (1 - vignetteAt(u, v));
            g.style.boxShadow = `inset 0 0 0 999px rgba(0,0,0,${a.toFixed(3)})`;
          } else {
            g.style.backgroundImage = "";
            g.style.boxShadow = "";
            g.style.backgroundColor = "#000";     // matches the flat-black backdrop
          }
        });
      };

      paint();
      on(window, "resize", paint);

      /* The handover. The grid is a copy of the two layers under it, so
         swapping them is invisible - and the pin's own black has to go with
         them, otherwise the grains would fall to reveal the pin rather than
         the section behind it. gsap.set inside a timeline is reversible, so
         scrubbing back up puts all of it straight again. */
      tl.set(host, { autoAlpha: 1 }, at);
      tl.set(hide.filter(Boolean), { autoAlpha: 0 }, at);
      tl.set(pin, { backgroundColor: "transparent" }, at);

      /* The type goes with the frame rather than surviving it - it was
         written on the picture, so it falls when the picture does. The veil
         has to clear too, or the section coming up behind reads dimmed. */
      tl.to(".meaning__inner, [data-meaning-side]",
        { yPercent: 42, autoAlpha: 0, duration: dur * 0.34, ease: "power2.in" }, at);
      tl.to("[data-meaning-veil]",
        { autoAlpha: 0, duration: dur * 0.42, ease: "power1.in" }, at + dur * 0.1);

      /* One tween across every grain, not one per grain: at this count a
         timeline of individual tweens is enough per-frame overhead to be
         felt on a scrub. The fall and the stagger together have to span
         exactly `dur`, so both are scaled off the shape's own total. */
      const seed = grains.map(() => Math.random());
      const K = dur / 1.45;               // the shape below runs .5 + .95
      tl.to(grains, {
        // far enough to clear the pin's overflow box; they have faded out
        // long before they get there
        yPercent: (i: number) => 620 + seed[i] * 680,
        xPercent: (i: number) => (seed[(i * 7 + 3) % seed.length] - 0.5) * 70,
        scale: 0.5,
        opacity: 0,
        duration: 0.5 * K,
        ease: "power2.in",                // gravity, not a fade
        stagger: (i: number) => {
          const lead = rows > 1 ? (rows - 1 - Math.floor(i / cols)) / (rows - 1) : 0;
          return (lead * 0.55 + seed[i] * 0.4) * K;
        },
      }, at);
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
        el: HTMLElement; hover: boolean; onScreen: boolean; ambient: boolean;
        rX: gsap.QuickToFunc; rY: gsap.QuickToFunc; tZ: gsap.QuickToFunc;
        iX: gsap.QuickToFunc | null; iY: gsap.QuickToFunc | null;
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
          const s = it.hover ? 1 : (it.ambient ? AMBIENT * Math.max(0, 1 - out / REACH) : 0);
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
       on leave, settle back on the cover. */
    function initWCardCycle() {
      if (!canHover || prefersReduced) return;

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
        const show = (n: number) => {
          imgs.forEach((img, j) => img.classList.toggle("is-active", j === n));
        };

        on(card, "mouseenter", () => {
          if (timer) return;
          timer = window.setInterval(() => {
            i = (i + 1) % imgs.length;
            show(i);
            playWCardSfx();
          }, 420);
          intervals.push(timer);
        });
        on(card, "mouseleave", () => {
          if (timer) { window.clearInterval(timer); timer = null; }
          i = 0;
          show(0);
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
      };

      const items = new Map<Element, Item>();
      els.forEach((el) => {
        items.set(el, {
          el, onScreen: false,
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
          const prox = 1 - Math.min(dist / it.reach, 1);
          const k = Math.pow(prox, it.bite);            // indifferent until it is close
          const pull = Math.min(dist, it.pull) * k;     // never overshoots the pointer
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

      /* --- the pre-state --- */
      const hang = () => {
        gsap.set(foot, { "--lit": 1 });
        gsap.set(pivot, { rotation: 0 });
        gsap.set(rises, { autoAlpha: 0, y: 28 });
        gsap.set(fades, { autoAlpha: 0 });
      };
      hang();

      const tl = gsap.timeline({ paused: true });

      /* The whole thing runs in about three seconds now. It used to take
         nearly seven, which is a long time to hold someone at the bottom
         of a page watching a light they have already understood - so
         every beat below is shorter and they overlap harder. The shapes
         are unchanged; only the clock is. */

      /* 1 · lowered in, already alight. The cord is scaled rather than
            sized: it is a 2px line, so scaleY and a growing height are
            the same picture, and one of them costs a layout per frame. */
      tl.fromTo(mark,
        { y: () => -(cord.offsetHeight + mark.offsetHeight + 60), rotation: 180 },
        { y: 0, duration: 0.62, ease: "power2.out" }, 0);
      tl.fromTo(cord, { scaleY: 0 }, { scaleY: 1, duration: 0.62, ease: "power2.out" }, 0);

      /* 2 · and then it dangles. A damped swing about the ceiling rose,
            written out rather than looped: the first throw is the cord
            going taut and is much bigger than the rest, which is the
            part a uniform oscillation always gets wrong. Four throws
            rather than six - past the fourth the movement is smaller than
            the line is thick, so they were costing a second to show
            nothing. */
      const swing: [number, number][] = [[6.2, 0.3], [-3.6, 0.34], [1.8, 0.3], [0, 0.28]];
      swing.forEach(([r, d], i) => {
        tl.to(pivot, { rotation: r, duration: d, ease: i === 0 ? "sine.out" : "sine.inOut" }, i === 0 ? 0.58 : ">");
      });

      /* 3 · it goes. Hard sets, not tweens, for the same reason the
            overture's ignition is hard sets: a filament is conducting or
            it is not, and easing between the two is what makes flicker
            look drawn. The room is the same number, so the white goes
            with it - the strobe is the whole screen, not the bulb. */
      const OUT = 1.5;
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

      /* 4 · in the dark, the cord lets go. It retracts to the ceiling it
            came from, the mark drops the inch it was being held up by,
            and on the way back it turns over - so the thing that was a
            bulb hanging upside down finishes as the logo, the right way
            up, exactly where it already was. */
      const CUT = OUT + 0.78;
      tl.to(cord, { scaleY: 0, duration: 0.32, ease: "power2.in" }, CUT);
      tl.to(mark, { y: 26, duration: 0.2, ease: "power2.in" }, CUT);
      tl.to(mark, { y: 0, rotation: 0, duration: 0.72, ease: "power3.inOut" }, CUT + 0.18);

      /* 5 · and the room fills in around it, overlapping the turn rather
            than waiting for it to finish */
      tl.to(rises, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }, CUT + 0.5);
      tl.to(fades, { autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.08 }, CUT + 0.6);

      /* The gate. Not "when the footer is in view" - it is always in
         view, it is fixed - but when enough of it has been uncovered
         that the room is worth looking at.

         Fires early, at a quarter uncovered rather than well past half:
         the drop and the first swings then happen *while* the page is
         still being scrolled off, so the bulb is already hanging there by
         the time the room is actually being looked at, instead of the
         reader arriving at an empty ceiling and waiting for it.

         Scrolling back up puts it back to hanging, so it plays again on
         the way down rather than handing you a dark room and nothing to
         watch. */
      ScrollTrigger.create({
        trigger: run,
        start: "top 75%",
        onEnter: () => { html.classList.add("is-foot"); tl.play(); },
        onLeaveBack: () => {
          html.classList.remove("is-foot");
          tl.pause(0).invalidate();
          hang();
        },
      });
    }

    /* -------------------------------------------------- boot */
    document.documentElement.classList.remove("no-js");

    readGrids();
    initLenis();
    initOvertureBridge();               // must follow initLenis: it stops it
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
    initWCardCycle();
    initCounters();
    initNav();
    initMarquees();
    initFooter();

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
    intervals.forEach((id) => window.clearInterval(id));
    splits.forEach((s) => s.revert());
    lenis?.destroy();
    lenis = null;
    ScrollTrigger.getAll().forEach((st) => st.kill());
    ctx.revert();
    document.documentElement.classList.remove("is-foot");
    document.documentElement.classList.add("no-js");
  };
}
