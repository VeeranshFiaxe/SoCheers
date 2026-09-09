/* ============================================================
   SoCheers - the overture, TEST CUT   (/test only)

   A copy of lib/overture-motion.ts with one act replaced. Everything up
   to and including the falls is the live sequence, unchanged - same
   camera, same physics, same ramp, same cues - because the point of this
   experiment is the ending, and the ending only earns anything if what
   leads into it is the thing people already saw.

   The story, in order:

     black    the room, with the wall images preloading behind it
     mark     the SoCheers mark resolves out of the dark, standing, with a
              rope hanging beside it
     on       the rope is pulled, the disc inside the O stutters and catches
     dock     the mark shrinks into the corner and becomes the flat lockup
     fall     the walls go over forwards, one by one, faster each time

   and then, instead of the last wall expanding into an artwork:

     dark     the last wall goes over like all the others and there is
              nothing behind it. The camera runs on into the empty room,
              the light goes with the walls, and the screen is blank

   What it hands back to is components/TestHero.tsx, which is black at
   that moment too - so the cross-fade is black over black, and the first
   thing the reader sees on the page is the greeting writing itself onto
   it. That opening is the hero's own (initHero, lib/motion.ts); this
   ending pre-empts none of it - no HERO_CUE is sent - and the reader's
   scroll only enters after it, to take the film full screen.

   Depth bookkeeping, since three numbers do all the work:
     · wall i sits at z = -(i+1) * GAP
     · the camera (the dolly) sits at z = cam
     · so wall i is GAP away from the camera when cam = i * GAP
   and every wall has been passed once cam is beyond walls.length * GAP.
   ============================================================ */
import { gsap } from "gsap";
import { OVERTURE_DONE, OVERTURE_START } from "./overture";
import { ROPE, ropePath } from "./logo-paths";
import { OVERTURE_SFX } from "./content";

/* The gap between one wall and the next, and therefore how far away the
   standing wall always is. Against the 1400px perspective on .ovt__stage
   (globals.css) a wall this far back covers ~69% of the screen: a panel in
   a room, not a fullscreen image. Change one and the other has to move. */
const GAP = 620;

/* how long each wall takes to go over. Runs out, so a longer wall list just
   keeps the last (fastest) value - the point of the ramp is that it ends up
   somewhere faster than you can follow, not that every entry is tuned.

   The first two entries are the sequence's own tempo being set and are
   deliberately untouched: the opening walls are the ones you are meant to
   be able to look at, and a faster first fall reads as the room being
   rushed rather than as it accelerating. Everything from the third on is
   steeper than it was - the ramp is what makes this feel like it is
   running away from you, so the way to take time out of the run without
   taking the effect out of it is to lean harder on the part that is
   already leaning. */
const FALL = [1.25, 0.95, 0.66, 0.48, 0.35, 0.27, 0.22, 0.19, 0.17, 0.16, 0.15, 0.145, 0.14, 0.135];
/* and how much of the previous fall has to finish before the next starts -
   same idea, tightened from the third entry on so the tail overlaps into
   itself harder rather than each wall waiting its turn */
const OVERLAP = [1.1, 0.95, 0.8, 0.72, 0.66, 0.6, 0.56, 0.54, 0.52, 0.51, 0.5, 0.49, 0.48, 0.47];
/* the first SOUND_WALLS falls are the ones with an actual thing in the
   picture - each gets its own impact thud. Everything past that is texture
   going over too fast to individually track, and a thud per one of those
   started counting as more walls falling than the eye could actually see -
   so they still jolt and dust, just silently. Nine rather than ten since
   Craft - the ship - came out of the front of the list (OVERTURE_WALLS in
   lib/content.ts): this counts positions, so keeping it at ten would have
   handed a thud to the first wall of the silent tail instead of leaving
   the same pictures sounding as before. */
const SOUND_WALLS = 9;

/* ---- the new ending's geometry ----
   How long the camera takes to run on past the fallen last wall into the
   empty dark behind it. Slower than a fall and eased at both ends: it is
   the one move in the sequence that is not something being knocked over,
   and what it arrives at is a blank screen. */
const DARK = 0.16;

/* Both clocks start the moment the mark is on screen and waiting, not from
   page load - the wait a visitor actually feels is the one after there is
   something to act on.

   The nudge first, then the sequence pulls the rope itself: nobody should
   ever be left standing in a dark room wondering whose move it is. */
const GUIDE_AT = 6;
const AUTO_PULL = 10;

/* How large the docked mark ends up, and where. Read off the site's own
   nav logo when it can be found, so "become the logo of SoCheers" is not
   a figure of speech - the docked mark actually lands where that logo
   sits. Falls back to a plain corner inset if the nav is not there. */
function dockTarget() {
  /* the nav's own lockup, not the header slot around it: the two are the
     same graphic now (components/Chrome.tsx), so this can land on the
     artwork itself rather than on a text box standing in for it - which is
     what makes the swap at the hand-off invisible. */
  const navLogo = document.querySelector<HTMLElement>(".nav__logo-mark");
  if (navLogo) {
    const r = navLogo.getBoundingClientRect();
    if (r.width) {
      /* DOCK_FILL: .ovt__dock is 74% of the rig's own height (globals.css),
         and `h` here is the rig's height - so the lockup inside it only
         comes out the size of the nav's mark if the rig is scaled up by
         the inverse of that. */
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: r.height / 0.74 };
    }
  }
  /* the nav not being there yet is not a reason to skip docking */
  return { cx: 66, cy: 40, h: 62 };
}

export function initTestOverture(root: HTMLElement): () => void {
  const ac = new AbortController();
  const tickers: gsap.TickerCallback[] = [];
  const timers: number[] = [];

  const addTicker = (fn: gsap.TickerCallback) => {
    gsap.ticker.add(fn);
    tickers.push(fn);
  };
  const after = (s: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, s * 1000));
  };
  const on = (t: EventTarget, type: string, fn: EventListener) =>
    t.addEventListener(type, fn, { signal: ac.signal } as AddEventListenerOptions);

  /* The three cues, one per beat: pulled, caught, landed. Each is loaded
     once and played by cloning the node rather than restarting it - the
     falls overlap each other by the end of the sequence, and a shared
     element would just cut its own previous hit short instead of
     layering. Autoplay policy can refuse any of this (silently, if the
     visitor has not interacted with the tab yet - the auto-pull at
     AUTO_PULL is the case that can actually hit this), and a sound effect
     failing to play is not a reason to break the sequence, so the
     rejection is swallowed rather than surfaced. */
  const clips = {
    pull: new Audio(OVERTURE_SFX.pull),
    on: new Audio(OVERTURE_SFX.on),
    fall: new Audio(OVERTURE_SFX.fall),
    expand: new Audio(OVERTURE_SFX.expand),
  };
  Object.values(clips).forEach((a) => { a.preload = "auto"; a.volume = 0.85; });
  /* a plain <audio> element's volume tops out at 1 - the expand cue asked
     to run twice as loud needs a real gain stage past that ceiling, so it
     alone is routed through a WebAudio gain node instead of el.volume. */
  let actx: AudioContext | null = null;
  const GAIN: Partial<Record<keyof typeof clips, number>> = { expand: 2 };

  /* Every clip currently sounding, held on purpose until it says it is
     done - and, for the boosted ones, its audio graph held with it.

     Nothing else refers to any of it: sfx() clones the element, builds the
     nodes and returns, so the element, its source node and its gain are
     all locals that go out of scope while the sound is still playing. A
     detached <audio> feeding a graph nothing points at is collectable, and
     Chrome does collect it - mid-clip, which sounds exactly like the cue
     being cut off part way through. Short cues finish before the collector
     ever looks at them, which is why this only showed up when the expand
     cue was replaced with a longer recording. */
  const sounding = new Map<HTMLAudioElement, AudioNode[]>();

  const sfx = (name: keyof typeof clips) => {
    const el = clips[name].cloneNode(true) as HTMLAudioElement;
    const boost = GAIN[name];
    const chain: AudioNode[] = [];
    if (boost) {
      try {
        actx ??= new AudioContext();
        /* A context built before the tab has been touched starts
           suspended, and a suspended graph is silence, not a delay - the
           element plays out with nothing coming through it. Harmless when
           it is already running. */
        void actx.resume().catch(() => {});
        const gain = actx.createGain();
        gain.gain.value = boost;
        const source = actx.createMediaElementSource(el);
        source.connect(gain).connect(actx.destination);
        chain.push(source, gain);
      } catch {
        el.volume = 1; // best it can do without WebAudio
      }
    } else {
      el.volume = clips[name].volume;
    }
    sounding.set(el, chain);
    const release = () => { sounding.delete(el); };
    el.addEventListener("ended", release, { once: true });
    el.addEventListener("error", release, { once: true });
    void el.play().catch(release);
  };

  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const qq = <T extends HTMLElement>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));

  let handedOff = false;

  /* Every timeline the sequence builds, so skipping out can end all of them
     at once. Tracking them explicitly rather than walking gsap's global
     timeline: the site's own engine is running underneath this one and must
     not be touched by anything here. */
  const running: gsap.core.Timeline[] = [];
  const line = (vars?: gsap.TimelineVars) => {
    const tl = gsap.timeline(vars);
    running.push(tl);
    return tl;
  };

  const ctx = gsap.context(() => {
    const stage = q("[data-ovt-stage]")!;
    const dolly = q("[data-ovt-dolly]")!;
    const walls = qq("[data-ovt-wall]");
    const slabs = qq("[data-ovt-slab]");
    const dust = q("[data-ovt-dust]")!;
    const vignette = q("[data-ovt-vignette]")!;
    const flash = q("[data-ovt-flash]")!;
    const rig = q("[data-ovt-rig]")!;
    const sway = q("[data-ovt-sway]")!;
    const lamp = q<HTMLButtonElement>("[data-ovt-lamp]")!;
    const svg = q("svg.ovt__svg")!;
    const pull = q<HTMLButtonElement>("[data-ovt-pull]")!;
    const ropeSvg = q("[data-ovt-rope-svg]")!;
    /* every stroke that has to follow the cord's path, redrawn together */
    const ropeLines = qq("[data-ovt-rope-bed],[data-ovt-rope],[data-ovt-rope-twist],[data-ovt-rope-hit]");
    const bead = q("[data-ovt-bead]")!;
    const dockMark = q("[data-ovt-dock]")!;
    const skip = q<HTMLButtonElement>("[data-ovt-skip]")!;
    if (!walls.length) return;

    /* when the mark had the room to itself and started waiting - see
       GUIDE_AT / AUTO_PULL, set at the top of bulb() */
    let t100 = performance.now();

    /* ---------------------------------------------------- the camera */
    const cam = { z: 0 };
    const pushCam = () => gsap.set(dolly, { z: cam.z });

    /* Reset to a known first frame. This runs again on every replay, so it
       has to put back everything the previous run moved rather than assume
       a fresh DOM. */
    root.classList.remove("is-done");
    gsap.set(root, { "--lit": 0, "--guide": 0, "--pilot": 0.35, backgroundColor: "#000" });
    gsap.set([stage, vignette], { autoAlpha: 1 });
    gsap.set(flash, { autoAlpha: 1, opacity: 0 });
    gsap.set(rig, { x: 0, y: 0, scale: 1, autoAlpha: 0, transformOrigin: "50% 50%" });
    gsap.set(sway, { rotation: 0, y: 0 });
    gsap.set(svg, { autoAlpha: 1, rotationY: 0, rotationX: 0 });
    gsap.set(dockMark, { autoAlpha: 0 });
    gsap.set(lamp, { y: 0, scale: 1 });
    gsap.set(pull, { autoAlpha: 0, display: "" });
    gsap.set(skip, { autoAlpha: 0, display: "" });
    gsap.set(dust, { opacity: 0 });
    lamp.tabIndex = -1;
    lamp.setAttribute("aria-label", "Turn the light on");
    lamp.setAttribute("data-cursor", "Light it");
    /* The pivot is the slab's own bottom edge - it is hinged to the floor,
       not spun about its middle. Set here rather than trusted from the
       stylesheet because GSAP caches a transform origin per element the
       first time it touches one, and a replay must not inherit the last
       run's. */
    gsap.set(slabs, {
      rotationX: 0, rotationZ: 0, opacity: 1, autoAlpha: 1,
      transformOrigin: "50% 100%", "--lit-floor": 0,
    });
    walls.forEach((w, i) => gsap.set(w, { z: -(i + 1) * GAP }));
    cam.z = 0;
    pushCam();
    /* The page belongs to us now. Fires on replays too, which is what
       re-locks the scroll after the site has already been handed back. */
    document.dispatchEvent(new CustomEvent(OVERTURE_START));

    /* ---------------------------------------------------- 0 · the room
       No loader, no counter: the room is on screen from the very first
       frame, black, with nothing in it yet. That black is real time,
       though, not just a beat - it is what the wall images preload
       behind, silently, so nothing pops into view mid-fall later on. A
       slow connection is a reason to start late, not a reason to hang the
       door, so it is capped short: there is no visible progress to hide
       a long wait behind any more. */
    function boot(next: () => void) {
      /* The walls get their srcs here, and this is the only place they
         ever get them.

         The room is rendered into every page - it lives in the layout,
         because the mark it docks is the site's logo and not a one-time
         flourish - and on all but the first page view of a tab it is
         never played: `instant` below bails straight to the docked mark
         without touching any of this. But a src in the markup is a fetch
         whether or not the element is display:none, so the room was
         costing every navigation about 1.3MB of pictures for a sequence
         that had already happened. Held on a data attribute instead, the
         way the home page's reel holds its film back (see initReel in
         lib/motion.ts), the bytes are spent exactly on the runs that
         show them.

         Source before img, which is the order the DOM is in: <picture>
         resolves against whatever sources are present at the moment the
         img gets a src, so setting them the other way round would pick
         the landscape original on a phone and then swap. */
      qq<HTMLElement>("[data-ovt-src]").forEach((el) => {
        const url = el.dataset.ovtSrc;
        if (!url) return;
        if (el instanceof HTMLSourceElement) el.srcset = url;
        else if (el instanceof HTMLImageElement) {
          /* the crowd shot is delivered as a set (TEAM_SRCSET in
             lib/content.ts) and the wall pictures are single files, so
             the srcset is optional - and it goes on first, because an
             <img> resolves against whatever is present the moment it
             gets a src */
          const set = el.dataset.ovtSrcset;
          if (set) el.srcset = set;
          el.src = url;
        }
      });

      const urls = qq<HTMLImageElement>("img.ovt__face")
        .map((img) => img.currentSrc || img.src)
        .filter(Boolean);

      if (!urls.length) { next(); return; }

      let loaded = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        next();
      };
      urls.forEach((url) => {
        const im = new Image();
        const tick = () => {
          loaded += 1;
          if (loaded >= urls.length) finish();
        };
        im.onload = tick;
        im.onerror = tick;      // a missing wall must not hang the door
        im.src = url;
      });
      after(2.2, finish);
    }

    /* ---------------------------------------------------- 1 · the mark
       It resolves out of the dark rather than sliding in from anywhere:
       the room is pitch black and then there is an object in the middle
       of it, very slightly too large, settling to its own size. Nothing
       travels, because nothing is hanging - it is standing there and it
       was always standing there, you just could not see it. */
    function bulb(next: () => void) {
      /* the two idle clocks in arm() are measured from here: from the
         moment there is something on screen to act on, not from load */
      t100 = performance.now();

      const tl = line({ onComplete: next });
      tl.set(rig, { autoAlpha: 1 });
      tl.fromTo(lamp,
        { scale: 1.14, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.3, ease: "power3.out" }, 0);

      /* the rope drops in a beat later and swings itself still, so the
         mark has the screen to itself first and the rope reads as the
         answer to it */
      tl.to(pull, { autoAlpha: 1, duration: 0.5 }, 0.75);
      tl.add(() => { ropeState.vy = 7; ropeState.vx = 5; }, 0.75);
      tl.to(skip, { autoAlpha: 1, duration: 0.5 }, 1.2);
    }

    /* ---------------------------------------------------- the rope
       A hanging thing you can actually take hold of. Two numbers, px and
       py, say where the knob is relative to where it wants to be; the
       drag writes them, a spring returns them, and the path and the knob
       are redrawn off them every frame. Nothing else in here knows or
       cares which of the two is currently in charge.

       The switch fires the moment py crosses the click point on the way
       *down*, not on release - that is what a real chain switch does, and
       it is the difference between pulling a cord and pressing a button
       shaped like one. */
    const ropeState = { px: 0, py: 0, vx: 0, vy: 0 };
    const dragTo = { x: 0, y: 0 };
    let ropeMode: "idle" | "drag" | "auto" = "idle";
    let ropeFire: (() => void) | null = null;
    let ropeLive = false;

    /* The rope works in screen pixels, so its SVG is handed a viewBox that
       is exactly its own client box. Re-measured on resize, because the
       box is sized in vh and the cord has to keep reaching the knob. */
    const box = { w: 220, h: 460 };
    const measure = () => {
      const r = pull.getBoundingClientRect();
      if (!r.width || !r.height) return;
      box.w = Math.round(r.width);
      box.h = Math.round(r.height);
      ropeSvg.setAttribute("viewBox", `0 0 ${box.w} ${box.h}`);
    };
    measure();
    on(window, "resize", () => { measure(); drawRope(); });

    const drawRope = () => {
      const { px, py } = ropeState;
      /* where the cord ends and the knob begins */
      const len = box.h - ROPE.knob;
      const d = ropePath(px, py, len, box.w);
      ropeLines.forEach((el) => el.setAttribute("d", d));
      gsap.set(bead, { x: box.w / 2 + px, y: len + py });
    };
    drawRope();

    addTicker(() => {
      if (ropeMode === "drag") {
        /* chase the pointer rather than snapping to it - the lag is the
           weight of the cord */
        ropeState.px += (dragTo.x - ropeState.px) * 0.42;
        ropeState.py += (dragTo.y - ropeState.py) * 0.42;
      } else if (ropeMode === "idle") {
        ropeState.vx += -0.26 * ropeState.px;
        ropeState.vy += -0.26 * ropeState.py;
        ropeState.vx *= 0.8;
        ropeState.vy *= 0.8;
        ropeState.px += ropeState.vx;
        ropeState.py += ropeState.vy;
        if (Math.abs(ropeState.py) < 0.04 && Math.abs(ropeState.vy) < 0.04) {
          ropeState.py = 0; ropeState.vy = 0;
        }
        if (Math.abs(ropeState.px) < 0.04 && Math.abs(ropeState.vx) < 0.04) {
          ropeState.px = 0; ropeState.vx = 0;
        }
      }
      drawRope();
      if (ropeLive && ropeFire && ropeState.py > ROPE.trigger) {
        ropeLive = false;
        ropeFire();
      }
    });

    /* Tap, keyboard, and the clock all come through here: the rope is
       pulled for you and everything downstream happens exactly as if you
       had done it by hand. */
    function autoPull(depth = ROPE.trigger + 34) {
      if (ropeMode === "drag") return;
      ropeMode = "auto";
      gsap.killTweensOf(ropeState);
      gsap.to(ropeState, {
        py: depth,
        duration: 0.26,
        ease: "power2.out",
        onComplete: () => {
          ropeMode = "idle";
          ropeState.vy = -2.2;          // let go, and it whips back
        },
      });
    }

    /* what the mark does when the rope goes over: a short, hard settle,
       the way a fixture on a bracket takes the click of a switch */
    function jolt() {
      const tl = line();
      tl.fromTo(sway,
        { y: 0 },
        { y: 5, duration: 0.07, ease: "power3.out" }, 0);
      tl.to(sway, { y: 0, duration: 0.7, ease: "elastic.out(1, 0.32)" }, 0.07);
    }

    /* ---------------------------------------------------- 3 · the pull
       Armed until something pulls it: the rope by hand, a tap on the rope
       or the bulb, a keypress, or eventually the clock. Whichever gets
       there first disarms the rest. */
    function arm(fire: () => void) {
      let fired = false;
      const go = () => {
        if (fired) return;
        fired = true;
        ropeLive = false;
        gsap.killTweensOf(root);
        gsap.to(root, { "--guide": 0, duration: 0.25 });
        sfx("pull");
        jolt();
        fire();
      };
      /* what the rope itself calls once it is pulled far enough */
      ropeFire = go;
      ropeLive = true;

      /* --- dragging it -------------------------------------------- */
      let id = -1;
      let sx = 0, sy = 0, moved = 0;

      on(pull, "pointerdown", ((e: PointerEvent) => {
        if (fired) return;
        e.preventDefault();
        id = e.pointerId;
        sx = e.clientX; sy = e.clientY; moved = 0;
        dragTo.x = ropeState.px; dragTo.y = ropeState.py;
        gsap.killTweensOf(ropeState);
        ropeMode = "drag";
        try { pull.setPointerCapture(id); } catch { /* not capturable, fine */ }
      }) as EventListener);

      on(window, "pointermove", ((e: PointerEvent) => {
        if (ropeMode !== "drag" || e.pointerId !== id) return;
        /* the rope's units are screen pixels, so this is the raw delta */
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        moved = Math.max(moved, Math.hypot(dx, dy));
        dragTo.x = gsap.utils.clamp(-ROPE.maxX, ROPE.maxX, dx);
        /* it can be pushed up a little, but a rope does not compress */
        dragTo.y = gsap.utils.clamp(-10, ROPE.maxY, dy);
      }) as EventListener);

      const release = ((e: PointerEvent) => {
        if (ropeMode !== "drag" || e.pointerId !== id) return;
        ropeMode = "idle";
        /* a grab-and-let-go with no travel in it is a tap, and a tap on a
           pull rope obviously means pull it */
        if (moved < 8) autoPull();
      }) as EventListener;
      on(window, "pointerup", release);
      on(window, "pointercancel", release);

      /* --- and everything that is not a drag ---------------------- */
      on(lamp, "click", go);
      /* Enter/Space anywhere, so it works without having to find the rope
         first - except when the skip button has focus, where the browser is
         about to turn the same keypress into a click on it. */
      on(window, "keydown", ((e: KeyboardEvent) => {
        if (e.target === skip) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); autoPull(); }
      }) as EventListener);

      /* --- the two idle clocks, measured from the counter hitting 100 --- */
      const since = (performance.now() - t100) / 1000;

      after(Math.max(0.2, GUIDE_AT - since), () => {
        if (fired) return;
        gsap.to(root, { "--guide": 1, duration: 0.6, ease: "power2.out" });
        /* it breathes rather than blinks - it has to be findable in a black
           room without becoming the loudest thing in it */
        gsap.fromTo(root,
          { "--pilot": 0.7 },
          { "--pilot": 1, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true });
      });

      after(Math.max(0.6, AUTO_PULL - since), () => {
        if (fired) return;
        autoPull();
      });
    }

    /* ---------------------------------------------------- 4 · ignition
       Three failed strikes and then it catches. The stutter is written as
       hard sets rather than tweens because that is what a filament striking
       actually does - it is either conducting or it is not, and easing
       between the two is exactly what makes CGI flicker look fake. */
    function ignite(next: () => void) {
      const tl = line({ onComplete: next });
      tl.add(() => sfx("on"), 0);

      const strike = (v: number, t: number) => tl.set(root, { "--lit": v }, t);
      strike(0.5, 0.1);
      strike(0, 0.16);
      strike(0.85, 0.24);
      strike(0, 0.3);
      strike(0.3, 0.42);
      strike(0, 0.46);
      strike(1, 0.56);
      strike(0.2, 0.63);
      tl.to(root, { "--lit": 1, duration: 0.55, ease: "power2.out" }, 0.68);

      /* every strike throws light into the room, so the wall behind flashes
         with them before it settles into being lit */
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.1, duration: 0.05, yoyo: true, repeat: 1 }, 0.24);
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.14, duration: 0.06, yoyo: true, repeat: 1 }, 0.56);

      /* and the rope is done being the point of the screen. It is let go of
         first, so it is still swinging itself back up as it fades. */
      tl.to(pull, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 0.8);
      tl.to({}, { duration: 0.5 });            // the light holds on the first wall
    }

    /* ---------------------------------------------------- 5 · the dock
       The flicker stops and, in the same breath, the mark leaves the
       middle of the room: it shrinks into the corner the site's own logo
       already lives in and crosses over from the lit 3D fixture to the
       flat lockup that logo is. Runs alongside the first wall going over
       rather than blocking it - the mark retreating and the room coming
       to life read as one thing happening, not two. */
    function dock() {
      const t = dockTarget();
      /* LAMP_VIEWBOX (lib/logo-paths.ts) is 476 tall; the target height
         is what the rig's scale has to work out to */
      const scale = t.h / 476;
      const toX = t.cx - window.innerWidth / 2;
      const toY = t.cy - window.innerHeight / 2;

      const tl = line();
      tl.to(rig, { x: toX, y: toY, scale, duration: 1.3, ease: "power2.inOut" }, 0);
      /* the crossfade happens mid-flight, once the fixture is small
         enough that the two croppings do not have to agree */
      tl.to(svg, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.6);
      tl.to(dockMark, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.85);
    }

    /* ---------------------------------------------------- the impact
       Weight, in three cheap parts: the room jolts, the light bounces off
       whatever just hit the floor, and dust comes up off it. `force` falls
       away as the sequence speeds up - by the end the walls are going over
       too fast for a full-strength jolt to be anything but sickening. */
    function impact(force: number, sound: boolean) {
      const tl = line();
      if (sound) tl.add(() => sfx("fall"), 0);
      tl.to(stage, {
        keyframes: [
          { y: 13 * force, duration: 0.07 },
          { y: -8 * force, duration: 0.08 },
          { y: 4 * force, duration: 0.08 },
          { y: 0, duration: 0.1 },
        ],
        ease: "power2.out",
      }, 0);
      tl.fromTo(flash,
        { opacity: 0 },
        { opacity: 0.09 * force, duration: 0.05, yoyo: true, repeat: 1 }, 0);
      tl.fromTo(dust,
        { opacity: 0, scaleY: 0.25, y: 0 },
        { opacity: 0.55 * force, scaleY: 1, duration: 0.16, ease: "power2.out" }, 0);
      tl.to(dust, { opacity: 0, y: -70, duration: 0.75, ease: "power1.out" }, 0.16);
      return tl;
    }

    /* ---------------------------------------------------- 6 · the falls
       Each slab pivots on its own bottom edge, so it goes over forwards and
       *through* the camera on the way down rather than away from it - which
       is what makes the front of the sequence feel like something is being
       knocked over at you. It fades out in the last third, once it is
       already past being readable as a picture.

       While it falls the camera closes the gap it left, so the wall behind
       arrives at exactly the size the fallen one used to be. That is what
       makes this a corridor being opened up rather than a slideshow: the
       composition never changes, the room just keeps going. */
    function falls(next: () => void) {
      const tl = line();
      let at = 0;
      /* the frame the last slab is down and gone - see the note under the
         loop, which is where `next` is actually fired from */
      let landed = 0;

      /* Every one of them, the last included. The room does not end on a
         wall any more - it ends on the hole where the last one was. */
      for (let i = 0; i < walls.length; i++) {
        const dur = FALL[Math.min(i, FALL.length - 1)];
        const slab = slabs[i];
        const force = Math.max(0.34, 1 - i * 0.11);

        tl.to(slab, { rotationX: -97, duration: dur, ease: "power2.in" }, at);
        /* a couple of degrees of twist, alternating, so no two go over the
           same way and the stack never reads as a mechanism */
        tl.to(slab, { rotationZ: i % 2 ? 2.4 : -2.4, duration: dur, ease: "power1.in" }, at);
        tl.to(slab, { opacity: 0, duration: dur * 0.34, ease: "power2.in" }, at + dur * 0.68);

        /* The tail of the stack goes over too fast to track one wall at
           a time, so it falls silently (SOUND_WALLS above) - except for
           the very last one, which is not texture: it is the last thing
           that happens in this room, everything after it is waiting on
           it, and a final impact with no sound on it reads as the
           sequence being cut off rather than finished. */
        tl.add(impact(force, i < SOUND_WALLS || i === walls.length - 1), at + dur * 0.9);

        /* the camera moves up into the space, starting before the wall has
           finished going over so the two read as one motion */
        tl.to(cam, {
          z: (i + 1) * GAP,
          duration: dur * 1.2,
          ease: "power2.inOut",
          onUpdate: pushCam,
        }, at + dur * 0.5);

        landed = at + dur;
        at += dur * (OVERLAP[Math.min(i, OVERLAP.length - 1)]);
      }

      /* And the hand-off goes on the frame the last slab finishes going
         over, not on this timeline's onComplete.

         onComplete waits for the longest child, and the longest child at
         the end of the run is the last impact: its dust plume alone is
         0.16 + 0.75 of a second, and the camera step behind it another
         0.7 of a fall. All of that plays out with every wall already flat
         and nothing standing behind them - which is a second of black
         screen between the last thing you see happen and the page being
         handed the screen. That second was the whole gap.

         Nothing is cut short by moving it: the fall has finished, its
         thud has been struck, and the dust and the camera keep running
         underneath a page that already owns the screen (the room fades
         out over the top of them in handOff). */
      tl.add(next, landed);

      /* The hand-off is not aimed inside the fall either. It was once, to
         kill the black that followed it, and it killed the fall instead:
         the room's fade-out started while the last wall was still
         rotating, so the last thing the sequence does was never seen
         finishing. `landed` is the frame after it, not during it. */
    }

    /* ============================================================
       7 · THE DARK

       There is no wall at the end of this corridor. The last one goes
       over with all the others, and what is behind it is nothing - so
       the only thing left for the camera to do is keep going, into a
       room with everything in it knocked flat.

       That blank is the point. It is the sheet the page writes itself
       onto: the hero underneath is black at this moment too, so the
       cross-fade below is black over black and there is no seam to see.

       And none of it is in front of the page any more. It hands the
       screen over on its own first frame, so everything in it - the
       light dying, the last step of the camera, the vignette going -
       runs behind a page that already has the screen. The pause before
       the sentence starts is held there rather than here (initHero's
       opening, lib/motion.ts), which is the only place it can be tuned
       as a beat rather than as a camera move.
       ============================================================ */
    function arrive() {
      /* On this frame, with everything below running over the top of it.
         The last wall has finished going over by the time this is
         reached, so there is nothing left in the room to interrupt - and
         the beat the reader waits through before the sentence starts is
         held on the page's own clock rather than here, where it would be
         a camera moving past nothing. */
      handOff(false);

      const tl = line();
      /* the light in the room goes with the walls - nothing left to lift
         off the floor, so it falls away rather than coming up */
      tl.to(root, { "--lit": 0.12, duration: DARK * 0.9, ease: "power2.inOut" }, 0);
      tl.to(cam, {
        z: (walls.length + 0.55) * GAP,
        duration: DARK, ease: "power2.inOut", onUpdate: pushCam,
      }, 0);
      tl.to(vignette, { autoAlpha: 0, duration: DARK * 0.7, ease: "power2.inOut" }, 0);
      tl.to(skip, { autoAlpha: 0, duration: 0.3 }, 0);
    }

    /* ---------------------------------------------------- the hand-off */
    function handOff(instant: boolean) {
      if (handedOff) return;
      handedOff = true;

      /* Nothing is marked as seen. /test is a thing you load in order to
         watch, so it plays from the top every single time rather than
         once per tab: no sessionStorage, no replay button, reload is the
         replay - which is also why the docked mark is left as scenery
         rather than being wired up as one. */
      lamp.tabIndex = -1;

      const finish = () => {
        root.classList.add("is-done");
        gsap.set([pull, skip], { display: "none" });
        document.dispatchEvent(new CustomEvent(OVERTURE_DONE));

        /* And nothing else. This cut hands the screen back at the hero's
           own first frame - the greeting and the small film - so every
           beat after this one belongs to the reader's scroll. No HERO_CUE
           is sent (contrast the projector cut, which had to jump the hero
           past the beats the room had already played). */
      };

      if (instant) {
        /* nothing to fade from - a tween here would be a black flash on
           every repeat visit, not a transition */
        gsap.set([stage, vignette, flash], { autoAlpha: 0 });
        gsap.set(root, { backgroundColor: "rgba(0,0,0,0)" });
        finish();
        return;
      }

      /* finish() on the first frame of it, not part-way through.

         Both halves of this fade are black over black: the room has
         nothing left standing and the page under it has not written a
         word yet, so there is nothing here for anyone to see dissolve.
         And finish() is what actually hands the screen over - it adds
         .is-done, which is `background:transparent !important`
         (app/globals.css), so the page is visible the instant it runs
         and every frame of tween after it is invisible by definition.
         Delaying it was therefore not a cross-fade, it was a wait: the
         reader sat in front of black for as long as the delay lasted.

         The tween is kept, and kept short, only for the room's own
         leftovers - the vignette and the flash still have to go
         somewhere rather than pop off. */
      const tl = line();
      tl.to([stage, vignette, flash], { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, 0);
      tl.to(root, { backgroundColor: "rgba(0,0,0,0)", duration: 0.35, ease: "power2.inOut" }, 0);
      tl.add(finish, 0);
    }

    /* ---------------------------------------------------- skipping out
       Not a fast-forward - a cut. Everything in flight dies, the room is
       set to its last frame, and the hand-off runs on its own - but the
       mark still ends up docked, because skipping the show (or never
       running it at all - see the `instant` branch below) is not a
       reason to skip having a logo. */
    function bail(instant = false) {
      if (handedOff) return;
      running.forEach((tl) => tl.kill());
      running.length = 0;
      ropeLive = false;
      ropeMode = "idle";
      gsap.killTweensOf([root, ropeState, pull, svg, dockMark, rig, ...slabs]);
      timers.forEach(clearTimeout);
      timers.length = 0;

      /* The end state of this cut: every wall down, the room dark, the
         camera already past where the last one stood. */
      gsap.set(root, { "--lit": 0.12, "--guide": 0 });
      gsap.set(slabs, { autoAlpha: 0 });

      /* The mark survives this ending, so a skip has to leave it docked
         rather than gone - the corner is where it lives from here on. */
      gsap.set(rig, { autoAlpha: 1 });
      gsap.set(svg, { autoAlpha: 0 });
      gsap.set(dockMark, { autoAlpha: 1 });
      gsap.set([pull, skip], { autoAlpha: 0 });
      cam.z = (walls.length + 0.55) * GAP;
      pushCam();
      handOff(instant);
    }
    on(skip, "click", () => bail(false));
    on(window, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape") bail(false);
    }) as EventListener);

    /* ---------------------------------------------------- run it
       No gate on this route and no instant path: /test is loaded in order
       to watch the sequence, so it always plays, and always from black.
       The only change to the chain is its last link - falls() knocks
       every wall over and hands to a run into the dark, rather than
       leaving one standing to expand into an artwork. */
    boot(() => bulb(() => arm(() => ignite(() => { dock(); falls(arrive); }))));
  }, root);

  /* -------------------------------------------------- teardown
     Called on unmount and, more often, at the start of a replay - so this
     has to leave nothing behind: a leaked ticker here would compound on
     every replay, and gsap.context() is what puts the inline styles back. */
  return () => {
    ac.abort();
    timers.forEach(clearTimeout);
    tickers.forEach((fn) => gsap.ticker.remove(fn));
    ctx.revert();
    // a replay starts the room again from black - anything still sounding
    // from the last run belongs to a sequence that no longer exists
    sounding.forEach((_chain, el) => el.pause());
    sounding.clear();
    void actx?.close();
  };
}
