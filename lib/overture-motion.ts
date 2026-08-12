/* ============================================================
   SoCheers - the overture
   GSAP, no scroll. Everything here runs on its own clock.

   The story, in order:

     black    the room is on screen from the first frame - no loader, no
              counter. The wall images preload silently behind that black,
              which is what the beat before the mark buys its time for
     mark     the SoCheers mark resolves out of the dark standing in the
              middle of the room - the logo *is* the bulb, its O is the
              glass - turns toward the cursor, and waits for you with a
              rope hanging beside it
     on       the rope is pulled, the disc inside the O stutters and
              catches, and the light finds a wall
     dock     the flicker stops and, in the same breath, the mark leaves
              the middle of the room: it shrinks into the top-left corner
              and crosses over from the lit 3D fixture to the same flat
              lockup the two-dimensional site logo already is
     fall     that first wall goes over forwards and there is another
              behind it, and another, faster each time - the mark is
              already parked in the corner for all of it
     hero     the camera runs at the last wall until it is exactly the
              size of the screen and the sequence hands over to the real
              hero underneath it. The docked mark stays: a small fixture
              in the corner, still clickable, still the replay

   The hand-off is the only part with a hard constraint, and the whole 3D
   layout is arranged around it: every wall is a viewport-sized element, so
   a wall sitting at translateZ(0) with the camera at 0 has an identity
   transform and is therefore *pixel-identical* to the real .hero__frame
   behind it. The last camera move is the one that puts the final wall
   exactly there. Nothing has to be measured or matched; the geometry does
   it, and the cross-fade at the end is a safety net rather than the trick.

   Depth bookkeeping, since three numbers do all the work:
     · wall i sits at z = -(i+1) * GAP
     · the camera (the dolly) sits at z = cam
     · so wall i is GAP away from the camera when cam = i * GAP
   which means "the front wall is always GAP away" is just "cam steps by
   GAP every time one goes over", and the finale is one last step of GAP.
   ============================================================ */
import { gsap } from "gsap";
import {
  OVERTURE_DONE,
  OVERTURE_REPLAY,
  OVERTURE_START,
  markOvertureSeen,
} from "./overture";
import { ROPE, ropePath } from "./logo-paths";
import { OVERTURE_SFX } from "./content";

/* The gap between one wall and the next, and therefore how far away the
   standing wall always is. Against the 1400px perspective on .ovt__stage
   (globals.css) a wall this far back covers ~69% of the screen: a panel in
   a room, not a fullscreen image. Change one and the other has to move. */
const GAP = 620;

/* how long each wall takes to go over. Runs out, so a longer wall list just
   keeps the last (fastest) value - the point of the ramp is that it ends up
   somewhere faster than you can follow, not that every entry is tuned. */
const FALL = [1.25, 0.95, 0.72, 0.55, 0.42, 0.33, 0.27, 0.24, 0.22, 0.2, 0.19, 0.185, 0.18, 0.175];
/* and how much of the previous fall has to finish before the next starts */
const OVERLAP = [1.1, 0.95, 0.84, 0.78, 0.72, 0.68, 0.64, 0.62, 0.6, 0.59, 0.58, 0.57, 0.56, 0.55];
/* the first SOUND_WALLS falls are the ones with an actual thing in the
   picture - each gets its own impact thud. Everything past that is texture
   going over too fast to individually track, and a thud per one of those
   started counting as more walls falling than the eye could actually see -
   so they still jolt and dust, just silently. Covers the original seven
   plus the first extra batch (Planning/Audience/Pulse); only the newest,
   fastest four (Attitude/Reverie/Voyage/Horizon) fall silent. */
const SOUND_WALLS = 10;

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
  const navLogo = document.querySelector<HTMLElement>(".nav__logo");
  if (navLogo) {
    const r = navLogo.getBoundingClientRect();
    if (r.width) {
      /* the lockup reads as a small badge, not a wordmark, so it is sized
         a little taller than the text it is standing in for */
      return { cx: r.left + r.width * 0.4, cy: r.top + r.height / 2, h: r.height * 2.2 };
    }
  }
  /* the nav not being there yet is not a reason to skip docking */
  return { cx: 66, cy: 40, h: 46 };
}

export function initOverture(
  root: HTMLElement,
  opts: { instant?: boolean } = {},
): () => void {
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
  const sfx = (name: keyof typeof clips) => {
    const el = clips[name].cloneNode(true) as HTMLAudioElement;
    const boost = GAIN[name];
    if (boost) {
      try {
        actx ??= new AudioContext();
        const gain = actx.createGain();
        gain.gain.value = boost;
        actx.createMediaElementSource(el).connect(gain).connect(actx.destination);
      } catch {
        el.volume = 1; // best it can do without WebAudio
      }
    } else {
      el.volume = clips[name].volume;
    }
    void el.play().catch(() => {});
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

    /* ---------------------------------------------------- 7 · the finale
       The mark has already docked (dock(), run alongside the first wall
       going over), so all that is left is the run at the standing wall:
       the camera closes the last GAP until the wall is at z = 0 with an
       identity transform, which is to say it *is* the hero - so the
       hand-off only has to stop being in front of it. */
    function finale() {
      const tl = line({ onComplete: handOff });

      /* it stops being a lamp lighting a room and becomes a light on a page */
      tl.to(root, { "--lit": 0.55, duration: 1.2, ease: "power2.inOut" }, 0);

      tl.add(() => sfx("expand"), 0);

      /* the run at the wall */
      tl.to(cam, {
        z: walls.length * GAP,
        duration: 1.45,
        ease: "power3.inOut",
        onUpdate: pushCam,
      }, 0);

      /* and as it fills the screen it stops being lit *by* something and
         just becomes the picture: the room's darkness lifts off it */
      tl.to(slabs[walls.length - 1], { "--lit-floor": 1, duration: 1.1, ease: "power2.inOut" }, 0);
      tl.to(vignette, { autoAlpha: 0, duration: 1.1, ease: "power2.inOut" }, 0);
      tl.to(skip, { autoAlpha: 0, duration: 0.4 }, 0);
    }

    /* ---------------------------------------------------- the hand-off */
    function handOff(instant: boolean) {
      if (handedOff) return;
      handedOff = true;
      markOvertureSeen();

      /* The bulb stays. It is the one piece of the overture that survives
         into the page - a fixture in the corner that is still swinging, and
         still the switch: clicking it runs the whole thing again. */
      lamp.tabIndex = 0;
      lamp.setAttribute("aria-label", "Play the opening sequence again");
      lamp.setAttribute("data-cursor", "Again?");
      on(lamp, "click", () => {
        document.dispatchEvent(new CustomEvent(OVERTURE_REPLAY));
      });

      const finish = () => {
        root.classList.add("is-done");
        gsap.set([pull, skip], { display: "none" });
        document.dispatchEvent(new CustomEvent(OVERTURE_DONE));
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

      gsap.set(root, { "--lit": 0.55, "--guide": 0 });
      gsap.set(slabs, { autoAlpha: 0 });
      gsap.set(slabs[walls.length - 1], { autoAlpha: 1, rotationX: 0, "--lit-floor": 1 });

      const t = dockTarget();
      gsap.set(rig, {
        autoAlpha: 1,
        transformOrigin: "50% 50%",
        x: t.cx - window.innerWidth / 2,
        y: t.cy - window.innerHeight / 2,
        scale: t.h / 476,
      });
      gsap.set(svg, { autoAlpha: 0 });
      gsap.set(dockMark, { autoAlpha: 1 });
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
       A tab that has already seen the show, or asked for reduced motion,
       does not get the room at all - just the mark, already docked,
       already the logo, with nothing having moved to get there. */
    if (opts.instant) {
      bail(true);
    } else {
      boot(() => bulb(() => arm(() => ignite(() => { dock(); falls(finale); }))));
    }
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
    void actx?.close();
  };
}
