/* ============================================================
   SoCheers - the overture
   GSAP, no scroll. Everything here runs on its own clock.

   The story, in order:

     0-100    the site loads under the SoCheers mark, and the counter is
              the real preload of every image the sequence is about to
              need - nothing here is allowed to arrive late and pop
     dark     the loader goes and the screen is genuinely black for a beat
     bulb     the mark itself drops in on a flex - the logo *is* the bulb,
              its O is the glass - swings on a real pendulum, turns toward
              the cursor, and waits for you with a rope hanging off it
     on       the rope is pulled, the disc inside the O stutters and
              catches, and the light finds a wall
     fall     that wall goes over forwards and there is another behind it,
              and another, faster each time
     hero     the last wall does not fall. The bulb walks off to the corner
              and shrinks into the furniture, the camera runs at the wall
              until it is exactly the size of the screen, and the sequence
              hands over to the real hero underneath it

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

/* The gap between one wall and the next, and therefore how far away the
   standing wall always is. Against the 1400px perspective on .ovt__stage
   (globals.css) a wall this far back covers ~69% of the screen: a panel in
   a room, not a fullscreen image. Change one and the other has to move. */
const GAP = 620;

/* how long each wall takes to go over. Runs out, so a longer wall list just
   keeps the last (fastest) value - the point of the ramp is that it ends up
   somewhere faster than you can follow, not that every entry is tuned. */
const FALL = [1.25, 0.95, 0.72, 0.55, 0.42, 0.33, 0.27, 0.24];
/* and how much of the previous fall has to finish before the next starts */
const OVERLAP = [1.1, 0.95, 0.84, 0.78, 0.72, 0.68, 0.64];

/* Both clocks start the moment the counter hits 100, not when the bulb
   finishes arriving - what the visitor is waiting through is the whole
   dark beat, so that is what has to be measured.

   The nudge first, then the sequence pulls the rope itself: nobody should
   ever be left standing in a dark room wondering whose move it is. */
const GUIDE_AT = 6;
const AUTO_PULL = 10;

export function initOverture(root: HTMLElement): () => void {
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
    const loader = q("[data-ovt-loader]")!;
    const loaderInner = q("[data-ovt-loader-inner]")!;
    const countEl = q("[data-ovt-count]")!;
    const skip = q<HTMLButtonElement>("[data-ovt-skip]")!;

    if (!walls.length) return;

    /* when the counter hit 100 - see GUIDE_AT / AUTO_PULL */
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
    gsap.set(loader, { autoAlpha: 1 });
    gsap.set(loaderInner, { autoAlpha: 1, y: 0 });
    gsap.set(rig, { x: 0, y: 0, scale: 1, autoAlpha: 0, transformOrigin: "50% 50%" });
    gsap.set(sway, { rotation: 0, y: 0 });
    gsap.set(svg, { rotationY: 0, rotationX: 0 });
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

    /* ---------------------------------------------------- 0 · the load
       The counter is the actual preload, not a tween pretending to be one.
       Two things shape it so it never looks like either:
         · a floor, so a warm cache does not flash 100 and cut - the number
           still takes ~1.4s to walk up even when every file is already there
         · easing toward the real figure rather than jumping to it, so a
           burst of four images landing together reads as acceleration
           instead of as a jump cut. */
    function load(next: () => void) {
      const urls = qq<HTMLImageElement>("img.ovt__face")
        .map((img) => img.currentSrc || img.src)
        .filter(Boolean);

      const st = { real: urls.length ? 0 : 1, shown: 0 };
      let loaded = 0;
      urls.forEach((url) => {
        const im = new Image();
        const tick = () => {
          loaded += 1;
          st.real = loaded / urls.length;
        };
        im.onload = tick;
        im.onerror = tick;      // a missing wall must not hang the door
        im.src = url;
      });

      const FLOOR = 1.4;
      const t0 = performance.now();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        countEl.textContent = "100";
        /* the two idle clocks in arm() are measured from here */
        t100 = performance.now();
        next();
      };

      const drive: gsap.TickerCallback = () => {
        const elapsed = (performance.now() - t0) / 1000;
        const target = Math.min(st.real, elapsed / FLOOR) * 100;
        const gap = target - st.shown;
        st.shown += Math.abs(gap) < 0.4 ? gap : gap * 0.12;
        countEl.textContent = String(Math.min(100, Math.round(st.shown)));
        if (st.real >= 1 && st.shown > 99.5) {
          gsap.ticker.remove(drive);
          finish();
        }
      };
      addTicker(drive);
      /* a slow connection is a reason to start late, not a reason to hang */
      after(7, finish);
    }

    /* ---------------------------------------------------- 1 · the dark
       The loader lifts and there is nothing underneath it. The beat of
       genuine black is the point - it is what makes the bulb an arrival
       rather than just the next thing on screen. */
    function dark(next: () => void) {
      const tl = line({ onComplete: next });
      tl.to(loaderInner, { autoAlpha: 0, y: -18, duration: 0.5, ease: "power2.in" }, 0);
      tl.to(loader, { autoAlpha: 0, duration: 0.4 }, 0.35);
      tl.to({}, { duration: 0.55 });          // the held beat
    }

    /* ---------------------------------------------------- 2 · the mark
       It resolves out of the dark rather than sliding in from anywhere:
       the room is pitch black and then there is an object in the middle
       of it, very slightly too large, settling to its own size. Nothing
       travels, because nothing is hanging - it is standing there and it
       was always standing there, you just could not see it. */
    function bulb(next: () => void) {
      startTurn();

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

    /* ---------------------------------------------------- the turn
       The mark stands still, so this is the only thing keeping it from
       reading as a flat SVG pinned to the middle of the screen: it turns
       a few degrees toward the cursor, and as it does the specular
       highlight travels across the glass and the ring's tube shading
       rolls. Ten degrees is enough - any more and the wordmark starts to
       keystone and it stops being a logo. */
    let mx = -1;
    let my = -1;
    let turning = false;

    function startTurn() {
      if (turning) return;
      turning = true;

      on(window, "mousemove", ((e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
      }) as EventListener);

      const turnY = gsap.quickTo(svg, "rotationY", { duration: 1.1, ease: "power3" });
      const turnX = gsap.quickTo(svg, "rotationX", { duration: 1.1, ease: "power3" });

      addTicker(() => {
        if (mx < 0) return;
        const r = lamp.getBoundingClientRect();
        if (!r.width) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        turnY(gsap.utils.clamp(-10, 10, (mx - cx) / 62));
        turnX(gsap.utils.clamp(-7, 7, -(my - cy) / 78));
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
          { "--pilot": 0.4 },
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

    /* ---------------------------------------------------- the impact
       Weight, in three cheap parts: the room jolts, the light bounces off
       whatever just hit the floor, and dust comes up off it. `force` falls
       away as the sequence speeds up - by the end the walls are going over
       too fast for a full-strength jolt to be anything but sickening. */
    function impact(force: number) {
      const tl = line();
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

    /* ---------------------------------------------------- 5 · the falls
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

        tl.add(impact(force), at + dur * 0.9);

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

    /* ---------------------------------------------------- 6 · the finale
       The mark has done its job, so it walks out of the middle of the frame
       and shrinks into the corner, and the camera runs the last GAP at the
       standing wall. At the end of that run the wall is at z = 0 with an
       identity transform, which is to say it *is* the hero - so all the
       hand-off has to do is stop being in front of it. */
    function finale() {
      const tl = line({ onComplete: handOff });

      /* The rig is the whole screen and the mark is dead centre in it, so
         the origin is the middle and the trip to the corner is just the
         vector from the centre of the screen to where it is going. */
      gsap.set(rig, { transformOrigin: "50% 50%" });
      const toX = 74 - window.innerWidth / 2;
      const toY = window.innerHeight - 74 - window.innerHeight / 2;

      tl.to(rig, { x: toX, y: toY, scale: 0.13, duration: 1.5, ease: "power2.inOut" }, 0);
      /* it stops being a lamp lighting a room and becomes a light on a page */
      tl.to(root, { "--lit": 0.55, duration: 1.2, ease: "power2.inOut" }, 0.5);

      /* the run at the wall */
      tl.to(cam, {
        z: walls.length * GAP,
        duration: 1.45,
        ease: "power3.inOut",
        onUpdate: pushCam,
      }, 0.3);

      /* and as it fills the screen it stops being lit *by* something and
         just becomes the picture: the room's darkness lifts off it */
      tl.to(slabs[walls.length - 1], { "--lit-floor": 1, duration: 1.1, ease: "power2.inOut" }, 0.5);
      tl.to(vignette, { autoAlpha: 0, duration: 1.1, ease: "power2.inOut" }, 0.5);
      tl.to(skip, { autoAlpha: 0, duration: 0.4 }, 0);
    }

    /* ---------------------------------------------------- the hand-off */
    function handOff() {
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

      const tl = line();
      tl.to([stage, vignette, flash], { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, 0);
      tl.to(root, { backgroundColor: "rgba(0,0,0,0)", duration: 0.6, ease: "power2.inOut" }, 0);
      tl.add(() => {
        /* the page is clickable again from here; the bulb is the only thing
           in this layer that still takes a pointer */
        root.classList.add("is-done");
        gsap.set([pull, skip], { display: "none" });
        document.dispatchEvent(new CustomEvent(OVERTURE_DONE));
      }, 0.2);
    }

    /* ---------------------------------------------------- skipping out
       Not a fast-forward - a cut. Everything in flight dies, the room is
       set to its last frame, and the hand-off runs on its own. */
    function bail() {
      if (handedOff) return;
      running.forEach((tl) => tl.kill());
      running.length = 0;
      ropeLive = false;
      ropeMode = "idle";
      gsap.killTweensOf([root, ropeState, pull, svg, ...slabs]);
      timers.forEach(clearTimeout);
      timers.length = 0;

      gsap.set(root, { "--lit": 0.55, "--guide": 0 });
      gsap.set(slabs, { autoAlpha: 0 });
      gsap.set(slabs[walls.length - 1], { autoAlpha: 1, rotationX: 0, "--lit-floor": 1 });
      gsap.set(rig, { autoAlpha: 0 });
      gsap.set([pull, skip, loader], { autoAlpha: 0 });
      cam.z = walls.length * GAP;
      pushCam();
      handOff();
    }
    on(skip, "click", bail);
    on(window, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape") bail();
    }) as EventListener);

    /* ---------------------------------------------------- run it */
    load(() => dark(() => bulb(() => arm(() => ignite(() => falls(finale))))));
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
  };
}
