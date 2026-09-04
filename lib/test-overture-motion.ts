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

   and then, instead of the last wall expanding into the hero:

     setup    the camera walks up to what is left - blank plaster, and a
              slide projector standing in front of it, switched off. It
              holds there. Nothing is projected, nothing is branded: the
              only thing in the frame is a screen and a machine that is
              not running
     return   the mark comes back out of the corner. It stops being a logo
              and is a bulb again, lit, drifting in over the machine
     drop     it falls into the projector's open socket. The room's light
              goes out with it - that light is not in the room any more,
              it is inside the machine
     ignite   the projector takes it: a kick, a shudder, the reels start
              turning, the lamp house comes up, and light finds the wall
     warm-up  and does not resolve. Flashes, exposure hunting, grain,
              frame jitter, the gate finding focus, and a 3 - 2 - 1 leader
     reveal   the hero arrives as a projection on the plaster

   The hand-off is unchanged and is still the reason the geometry is what
   it is: every wall is a viewport-sized element, so the standing wall at
   translateZ(0) with the camera at 0 is pixel-identical to the real
   .hero__frame behind it. All that has changed is how the picture got
   onto that wall.

   Depth bookkeeping, since three numbers do all the work:
     · wall i sits at z = -(i+1) * GAP
     · the camera (the dolly) sits at z = cam
     · so wall i is GAP away from the camera when cam = i * GAP
   and the projector rides inside the last wall's own element, pushed
   PROJ_Z forward of the plaster, so it keeps its distance from the wall
   without anyone having to move it.
   ============================================================ */
import { gsap } from "gsap";
import { cueHero, OVERTURE_DONE, OVERTURE_START } from "./overture";
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
   How far in front of the plaster the projector stands, and how far the
   camera closes in on the pair of them before it holds. PROJ_Z is written
   twice - here and as --proj-z in app/test/test.css - because the element
   is positioned by CSS and measured by this file; if one moves the other
   has to. APPROACH has to stay well under GAP: it is a step toward the
   last wall, not the step into it, and the run at the wall at the very
   end still has GAP - APPROACH left to cover. */
const PROJ_Z = 210;
const APPROACH = 150;

/* the leader ring in the countdown - 2 * PI * r, and r is 46 in the SVG
   the markup draws (components/TestOverture.tsx) */
const ARC = 289.03;

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

    /* --- the new ending's cast -------------------------------------- */
    const proj = q("[data-ovt-proj]")!;
    const socket = q("[data-ovt-socket]")!;
    const reels = qq("[data-ovt-reel]");
    const beam = q("[data-ovt-beam]")!;
    const lens = q("[data-ovt-lens]")!;
    const screenEl = q("[data-ovt-screen]")!;
    const wash = q("[data-ovt-wash]")!;
    const gate = q("[data-ovt-gate]")!;
    const grain = q("[data-ovt-grain]")!;
    const count = q("[data-ovt-count]")!;
    const countArc = q("[data-ovt-count-arc]")!;
    const countN = q("[data-ovt-count-n]")!;

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

    /* and the machine, cold. Every one of these is put back rather than
       assumed, for the same reason the slabs are: a rebuild has to start
       from a known first frame, not from wherever the last one stopped. */
    /* --proj-z is declared in app/test/test.css so the machine is in the
       right place on the server-rendered frame too, but this file is the
       one that owns the number: it is the distance the beam is cut
       against and the depth the bulb is dropped into. */
    gsap.set(root, {
      "--proj": 0, "--beam": 0, "--proj-img": 0, "--grain": 0, "--count": 0,
      "--proj-z": `${PROJ_Z}px`,
    });
    gsap.set(proj, { autoAlpha: 1, x: 0, y: 0, rotation: 0 });
    /* Each reel turns about its own hub, in the SVG's own coordinates -
       svgOrigin rather than transformOrigin, because the two are
       different sizes in different places and a percentage origin would
       be measured against each one's own box after GSAP had already
       started writing transforms into it. The numbers come off the
       element (components/TestOverture.tsx), so the drawing owns them. */
    reels.forEach((r) => gsap.set(r, { rotation: 0, svgOrigin: r.dataset.ovtReel || "0 0" }));
    gsap.set(gate, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    gsap.set([beam, wash, grain, count, countN], { clearProps: "opacity,visibility" });
    countN.textContent = "";
    countArc.style.strokeDashoffset = String(ARC);

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
      const tl = line({ onComplete: next });
      const last = walls.length - 1;            // the hero wall - it stays up
      let at = 0;

      for (let i = 0; i < last; i++) {
        const dur = FALL[Math.min(i, FALL.length - 1)];
        const slab = slabs[i];
        const force = Math.max(0.34, 1 - i * 0.11);

        tl.to(slab, { rotationX: -97, duration: dur, ease: "power2.in" }, at);
        /* a couple of degrees of twist, alternating, so no two go over the
           same way and the stack never reads as a mechanism */
        tl.to(slab, { rotationZ: i % 2 ? 2.4 : -2.4, duration: dur, ease: "power1.in" }, at);
        tl.to(slab, { opacity: 0, duration: dur * 0.34, ease: "power2.in" }, at + dur * 0.68);

        tl.add(impact(force, i < SOUND_WALLS), at + dur * 0.9);

        /* the camera moves up into the space, starting before the wall has
           finished going over so the two read as one motion */
        tl.to(cam, {
          z: (i + 1) * GAP,
          duration: dur * 1.2,
          ease: "power2.inOut",
          onUpdate: pushCam,
        }, at + dur * 0.5);

        at += dur * (OVERLAP[Math.min(i, OVERLAP.length - 1)]);
      }

      /* a held beat on the hero wall before the camera commits to it */
      tl.to({}, { duration: 0.45 });
    }

    /* ============================================================
       7 · THE PROJECTOR

       Everything from here down is what this cut exists to try. The last
       wall is blank and there is a machine in front of it, and the
       sequence now has to explain - without a word of copy - that the
       light you switched on at the start is what makes the machine work.

       Five beats, and they are deliberately in that order:

         setup    hold on a blank wall and a dead projector. Cut this beat
                  and the drop lands on a frame nobody has read yet
         return   the bulb comes back out of the corner, lit
         drop     it falls into the socket; the room goes dark with it
         ignite   the machine takes the light and starts turning
         warm-up  and only then does the wall get a picture - badly, and
                  then properly

       The camera does not move from the moment it arrives until the run
       at the wall at the very end: the machine is what is happening, and
       a camera drifting over it would be a second thing happening.
       ============================================================ */

    /* The beam runs between two things that are both inside a perspective
       stack, so where it starts and ends is a measurement rather than a
       number that can be written into a stylesheet. Cut once, on the
       frame the lamp house comes up, and again on a resize - the camera
       is holding still through all of it. */
    function fitBeam() {
      const l = lens.getBoundingClientRect();
      const w = screenEl.getBoundingClientRect();
      if (!l.width || !w.width) return;
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const X = (v: number) => ((v / vw) * 100).toFixed(2);
      const Y = (v: number) => ((v / vh) * 100).toFixed(2);
      /* The front element of the lens, which is where the light actually
         leaves the machine, and the lit rectangle, which is where it
         lands. Everything between the two is the cone - so the beam is
         the only thing in here that never has to be told where either the
         machine or the picture is. */
      const ax = l.left + l.width / 2;
      const ay = l.top + l.height / 2;
      const r = l.width * 0.45;
      beam.style.clipPath =
        `polygon(${X(ax - r)}% ${Y(ay)}%, ` +
        `${X(w.left)}% ${Y(w.bottom)}%, ${X(w.left)}% ${Y(w.top)}%, ` +
        `${X(w.right)}% ${Y(w.top)}%, ${X(w.right)}% ${Y(w.bottom)}%, ` +
        `${X(ax + r)}% ${Y(ay)}%)`;
    }
    on(window, "resize", fitBeam);

    /* Where the bulb has to end up, in the screen pixels the rig is moved
       in. Read when the tween starts rather than when the timeline is
       built: the camera moves between those two points and the socket
       moves with it. */
    const socketAt = () => {
      const r = socket.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };
    /* and how big it has to be to look like it belongs in that socket - a
       fraction of the machine's own on-screen width. sway.offsetWidth is
       --lamp-w in plain pixels: a layout width, so it is not itself
       scaled by whatever the rig currently is. */
    const bulbScale = () =>
      (proj.getBoundingClientRect().width * 0.3) / (sway.offsetWidth || 400);

    /* a frame slipping through the gate: one shake, at whatever strength
       the warm-up has reached */
    function jitter(tl: gsap.core.Timeline, at: number, amt: number, dur: number) {
      tl.to(gate, {
        keyframes: [
          { x: amt, y: -amt * 1.6, duration: dur * 0.3 },
          { x: -amt * 0.7, y: amt * 0.9, duration: dur * 0.35 },
          { x: 0, y: 0, duration: dur * 0.35 },
        ],
        ease: "none",
      }, at);
    }

    function projector() {
      const tl = line({ onComplete: () => handOff(false) });
      const finalSlab = slabs[slabs.length - 1];

      /* ---- a - the setup ------------------------------------------ */
      /* One step toward what is left, and stop. Not the whole gap: that
         step is the last thing that happens, and spending it here would
         leave the reveal with nowhere to go. */
      tl.to(cam, {
        z: (walls.length - 1) * GAP + APPROACH,
        duration: 0.9, ease: "power2.inOut", onUpdate: pushCam,
      }, 0);
      /* and the room comes down to what one bulb parked in a corner
         actually throws: enough to read blank plaster and a dark machine
         by, and not a lumen more */
      tl.to(root, { "--lit": 0.4, duration: 0.9, ease: "power2.inOut" }, 0);

      /* the hold. Short - it is the beat in which a viewer sees that
         there is a projector and that it is off, and no longer than
         that; a longer one was the sequence waiting for the audience
         rather than the other way round. */
      let t = 1.35;

      /* ---- b - the bulb comes back -------------------------------- */
      /* It stops being the site's logo and is an object again: the flat
         lockup goes, the lit fixture comes back under it, and it lights
         on the way in rather than arriving already alight - the idea is
         being carried across the room, not teleported into it.

         One move, and it lands. There used to be a hover-and-breathe
         beat over the socket before the drop; it read as the sequence
         padding itself out, and it was the single longest thing between
         the last wall falling and the picture arriving. */
      tl.to(dockMark, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, t);
      tl.to(svg, { autoAlpha: 1, duration: 0.24, ease: "power2.out" }, t + 0.08);
      tl.to(root, { "--lit": 0.75, duration: 0.42, ease: "power2.out" }, t + 0.08);

      tl.to(rig, {
        x: () => socketAt().cx - window.innerWidth / 2,
        y: () => socketAt().cy - window.innerHeight / 2
              - proj.getBoundingClientRect().height * 0.62,
        scale: bulbScale,
        duration: 0.86, ease: "power2.inOut",
      }, t + 0.04);
      t += 0.94;

      /* ---- c - the drop ------------------------------------------- */
      tl.to(rig, {
        y: () => socketAt().cy - window.innerHeight / 2,
        duration: 0.2, ease: "power2.in",
      }, t);
      t += 0.2;

      /* Contact. The machine takes the hit, and the room's light goes out
         with it - that light is not in the room any more, it is inside
         the housing. */
      tl.add(() => sfx("fall"), t);
      tl.to(rig, { autoAlpha: 0, duration: 0.12, ease: "power2.in" }, t + 0.02);
      tl.to(root, { "--lit": 0.06, duration: 0.22, ease: "power2.in" }, t);
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.16, duration: 0.05, yoyo: true, repeat: 1 }, t);
      tl.to(proj, {
        keyframes: [
          { y: 5, duration: 0.05 },
          { y: -3, duration: 0.06 },
          { y: 0, duration: 0.11 },
        ], ease: "power2.out",
      }, t);
      t += 0.26;

      /* ---- d - ignition ------------------------------------------- */
      /* It does not start cleanly. It coughs: the lamp strikes and dies
         twice before it holds, and the body shakes the whole time it is
         deciding. Hard sets, for the same reason the bulb's own ignition
         is hard sets - a lamp is conducting or it is not, and easing
         between the two is what makes CGI flicker look fake. */
      tl.add(() => sfx("on"), t);
      tl.add(fitBeam, t);

      const strike = (v: number, at: number) => tl.set(root, { "--proj": v }, at);
      strike(0.55, t + 0.05);
      strike(0, t + 0.1);
      strike(0.85, t + 0.19);
      strike(0.1, t + 0.24);
      strike(1, t + 0.34);
      tl.to(root, { "--proj": 1, duration: 0.3, ease: "power2.out" }, t + 0.34);

      /* the vibration of a motor that has just been asked to start */
      tl.to(proj, {
        keyframes: [
          { x: 1.6, y: -1, duration: 0.05 },
          { x: -1.4, y: 1.2, duration: 0.05 },
          { x: 1, y: 0.6, duration: 0.05 },
          { x: -0.6, y: -0.5, duration: 0.05 },
          { x: 0, y: 0, duration: 0.06 },
        ],
        ease: "none", repeat: 2,
      }, t + 0.05);

      /* and the reels start turning, and keep turning - slow to begin
         with, because the same motor is dragging them up to speed.

         The second half of that is started from a callback rather than
         added to this timeline, and it is not a style choice: a child
         with repeat:-1 gives its parent an infinite duration, so the act
         would never reach its own onComplete and the hand-off would never
         fire. It is killed by bail() and by the teardown, which is where
         every other ticker and tween in here ends up anyway. */
      tl.to(reels, { rotation: 300, duration: 1, ease: "power1.in" }, t + 0.16);
      tl.add(() => {
        gsap.to(reels, { rotation: "+=3600", duration: 8, ease: "none", repeat: -1 });
      }, t + 1.16);

      t += 0.44;

      /* ---- e - the warm-up ---------------------------------------- */
      /* Light finds the rectangle, and the rectangle is not a picture
         yet: it is white with nothing in it, hunting for an exposure.
         This part has to read as mechanical rather than designed -
         everything below is a machine failing to settle. */
      const bm = (v: number, at: number) => tl.set(root, { "--beam": v }, at);
      bm(0.35, t);
      bm(0, t + 0.05);
      bm(0.8, t + 0.12);
      bm(0.15, t + 0.18);
      bm(0.6, t + 0.25);
      bm(1, t + 0.32);
      tl.to(root, { "--beam": 0.9, duration: 0.36, ease: "power1.inOut" }, t + 0.36);

      /* grain arrives with the light and does not fully leave until the
         picture does */
      tl.to(root, { "--grain": 1, duration: 0.2 }, t + 0.12);
      /* the wall stops being a thing lit by a bulb and becomes a screen */
      tl.to(finalSlab, { "--lit-floor": 0.72, duration: 0.5, ease: "power2.out" }, t + 0.14);

      /* the gate finding focus: soft and off its marks, and then not */
      tl.fromTo(gate,
        { filter: "blur(9px)", scale: 1.035 },
        { filter: "blur(0px)", scale: 1, duration: 0.8, ease: "power2.out" }, t + 0.14);
      jitter(tl, t + 0.06, 7, 0.2);
      jitter(tl, t + 0.3, 5, 0.17);
      jitter(tl, t + 0.56, 3, 0.15);

      t += 0.68;

      /* ---- f - the leader ----------------------------------------- */
      /* 3 - 2 - 1, one ring sweep per number, with the exposure still
         hunting underneath. Academy leader, more or less, which is the
         one piece of film language everybody can read without being told
         what it is. Run faster than a real one: the beat is recognised
         in the first half second and everything after that is waiting. */
      const BEAT = 0.62;
      tl.to(root, { "--count": 1, duration: 0.14 }, t);
      [3, 2, 1].forEach((n, i) => {
        const at = t + i * BEAT;
        tl.add(() => { countN.textContent = String(n); }, at);
        tl.fromTo(countArc,
          { strokeDashoffset: ARC },
          { strokeDashoffset: 0, duration: BEAT * 0.92, ease: "none" }, at);
        tl.fromTo(countN, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.1 }, at);
        jitter(tl, at, 4, 0.14);
        /* the exposure ticking down and back as each frame goes through */
        tl.set(root, { "--beam": 0.62 }, at + 0.02);
        tl.set(root, { "--beam": 0.95 }, at + 0.06);
      });
      t += BEAT * 3;

      /* the last frame of leader runs out and the gate goes dark for
         about as long as a splice does */
      tl.to(root, { "--count": 0, duration: 0.1 }, t);
      tl.set(root, { "--beam": 0.1 }, t + 0.1);
      tl.set(root, { "--beam": 0 }, t + 0.15);
      t += 0.22;

      /* ---- g - the reveal ----------------------------------------- */
      /* and the crowd is there.

         Not the artwork, and nothing that then expands into something
         else: the picture the projector puts on the wall is the picture
         the hero used to travel to on the first scroll. So there is no
         wordmark-then-whoomph beat any more, and no swell under it - a
         carriage drops, a frame lands, and that is the sound a projector
         makes. It arrives on one frame for the same reason: a fade is a
         dissolve, and a dissolve belongs to a different machine. */
      tl.add(() => sfx("fall"), t);
      tl.set(root, { "--beam": 1 }, t);
      tl.set(root, { "--proj-img": 1 }, t);
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.2, duration: 0.06, yoyo: true, repeat: 1 }, t);
      tl.to(finalSlab, { "--lit-floor": 1, duration: 0.7, ease: "power2.out" }, t);
      jitter(tl, t + 0.02, 5, 0.18);
      jitter(tl, t + 0.36, 2, 0.12);
      /* the grain thins as the machine settles, but a trace of it stays
         until the very last frame - the picture is still on a wall */
      tl.to(root, { "--grain": 0.4, duration: 0.9, ease: "power2.out" }, t + 0.14);
      t += 0.6;

      /* ---- h - the run at the wall -------------------------------- */
      /* The camera closes what is left of the last GAP until the wall
         sits at translateZ(0) with an identity transform - and .ovt__screen
         inside it is cut to exactly the box the hero's own expanded photo
         occupies, so what is on screen at the end of this is the same
         picture, the same size, in the same place as the page underneath.

         Which is what the cue below is for. The hero is normally at its
         first frame - the crowd shot still folded up inside the artwork's
         little window - and handing a full-screen projection back to that
         would be a cut. It is jumped to its expanded frame here, behind
         the black, so the fade at the end has nothing to travel. The
         definition is not written yet: that is the next beat, and it
         happens on the page (see finish() in handOff). */
      const RUN = 1.3;
      tl.add(() => cueHero("expanded"), t);
      tl.to(cam, {
        z: walls.length * GAP,
        duration: RUN, ease: "power3.inOut", onUpdate: pushCam,
      }, t);
      /* the gate has to land at exactly zero - it is carrying the picture
         and the hand-off is a match, so half a pixel of jitter left on it
         would be the seam */
      tl.set(gate, { x: 0, y: 0, scale: 1, filter: "none" }, t);
      /* the machine goes with the camera: it is nearer than the wall, so
         it grows and leaves the bottom of the frame on its own */
      tl.to(proj, { autoAlpha: 0, duration: RUN * 0.45, ease: "power2.in" }, t);
      tl.to(root, { "--grain": 0, "--beam": 0, duration: RUN * 0.7, ease: "power2.inOut" }, t + RUN * 0.22);
      tl.to(vignette, { autoAlpha: 0, duration: RUN * 0.76, ease: "power2.inOut" }, t);
      tl.to(skip, { autoAlpha: 0, duration: 0.4 }, t);
    }

    /* ---------------------------------------------------- the hand-off */
    function handOff(instant: boolean) {
      if (handedOff) return;
      handedOff = true;

      /* Nothing is marked as seen and nothing is left docked in the
         corner, and both of those follow from the same change. The bulb
         does not survive this cut - it went into the projector, which is
         the whole point of it - so the corner is left to the nav's own
         lockup, which is already fading up there (see .nav__logo in
         globals.css). And /test is a thing you load in order to watch, so
         it plays from the top every single time rather than once per tab:
         no sessionStorage, no replay button, reload is the replay. */
      lamp.tabIndex = -1;

      const finish = () => {
        root.classList.add("is-done");
        gsap.set([pull, skip], { display: "none" });
        document.dispatchEvent(new CustomEvent(OVERTURE_DONE));

        /* And then the definition, over the photo that was just
           projected. It is the real one - the hero's own phase 2, played
           on its own timeline (HERO_CUE in lib/overture.ts) - rather than
           a copy of the type laid into the room, so the words, the
           typesetting and the order they arrive in are the page's and
           there is only ever one of them.

           Held a beat past the fade so the two do not overlap: the
           picture has to be seen arriving before anything is written on
           top of it. A skipped run gets it immediately and at speed,
           since skipping means "put me at the end". */
        after(instant ? 0 : 0.4, () => cueHero("defined", instant ? 0 : 2.2));
      };

      if (instant) {
        /* nothing to fade from - a tween here would be a black flash on
           every repeat visit, not a transition */
        gsap.set([stage, vignette, flash], { autoAlpha: 0 });
        gsap.set(root, { backgroundColor: "rgba(0,0,0,0)" });
        finish();
        return;
      }

      const tl = line();
      tl.to([stage, vignette, flash], { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, 0);
      tl.to(root, { backgroundColor: "rgba(0,0,0,0)", duration: 0.6, ease: "power2.inOut" }, 0);
      tl.add(finish, 0.2);
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

      gsap.killTweensOf([proj, reels, gate, beam, wash, grain, count]);

      /* The end state of this cut, not of the live one: the picture is on
         the wall because it has been projected there, so skipping out
         means the projection has already happened - beam spent, machine
         gone with the camera, gate square, grain off. */
      gsap.set(root, {
        "--lit": 0.06, "--guide": 0,
        "--proj": 0, "--beam": 0, "--grain": 0, "--count": 0, "--proj-img": 1,
      });
      gsap.set(slabs, { autoAlpha: 0 });
      gsap.set(slabs[walls.length - 1], { autoAlpha: 1, rotationX: 0, "--lit-floor": 1 });
      gsap.set(gate, { x: 0, y: 0, scale: 1, filter: "none", autoAlpha: 1 });
      gsap.set(proj, { autoAlpha: 0 });

      /* and the bulb is inside the machine, which is off screen - so
         unlike the live cut there is nothing left in the corner to set */
      gsap.set(rig, { autoAlpha: 0 });
      gsap.set(svg, { autoAlpha: 0 });
      gsap.set(dockMark, { autoAlpha: 0 });
      gsap.set([pull, skip], { autoAlpha: 0 });
      cam.z = walls.length * GAP;
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
       The only change to the chain is its last link - falls() now hands
       to the projector rather than to a wall that expands. */
    boot(() => bulb(() => arm(() => ignite(() => { dock(); falls(projector); }))));
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
