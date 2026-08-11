/* ============================================================
   SoCheers - the overture
   GSAP, no scroll. Everything here runs on its own clock.

   The story, in order:

     0-100    the site loads, and the counter is the real preload of every
              image the sequence is about to need - nothing here is allowed
              to arrive late and pop
     dark     the loader goes and the screen is genuinely black for a beat
     bulb     a pendant drops in, swings on a real pendulum, turns toward
              the cursor, and waits for you
     on       the switch is flipped, the filament stutters and catches, and
              the light finds a wall
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

/* nobody should ever be stuck in a dark room: if the switch has not been
   touched by now, the sequence flips it itself */
const AUTO_FLIP = 9;

const rad = 180 / Math.PI;

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
    const cord = q("[data-ovt-cord]")!;
    const lamp = q<HTMLButtonElement>("[data-ovt-lamp]")!;
    const svg = q("svg.ovt__svg")!;
    const switchEl = q<HTMLButtonElement>("[data-ovt-switch]")!;
    const rocker = q("[data-rocker]")!;
    const hint = q("[data-ovt-hint]")!;
    const loader = q("[data-ovt-loader]")!;
    const loaderInner = q("[data-ovt-loader-inner]")!;
    const countEl = q("[data-ovt-count]")!;
    const skip = q<HTMLButtonElement>("[data-ovt-skip]")!;

    if (!walls.length) return;

    /* ---------------------------------------------------- the camera */
    const cam = { z: 0 };
    const pushCam = () => gsap.set(dolly, { z: cam.z });

    /* Reset to a known first frame. This runs again on every replay, so it
       has to put back everything the previous run moved rather than assume
       a fresh DOM. */
    root.classList.remove("is-done");
    gsap.set(root, { "--lit": 0, backgroundColor: "#000" });
    gsap.set([stage, vignette], { autoAlpha: 1 });
    gsap.set(flash, { autoAlpha: 1, opacity: 0 });
    gsap.set(loader, { autoAlpha: 1 });
    gsap.set(loaderInner, { autoAlpha: 1, y: 0 });
    gsap.set(rig, { x: 0, y: 0, scale: 1, autoAlpha: 0 });
    gsap.set(sway, { rotation: 0 });
    gsap.set(cord, { autoAlpha: 1, scaleY: 1 });
    gsap.set(svg, { rotationY: 0, rotationX: 0 });
    gsap.set(switchEl, { autoAlpha: 0, y: 18, display: "" });
    gsap.set(skip, { autoAlpha: 0, display: "" });
    gsap.set(rocker, { rotation: 0, transformOrigin: "48px 70px" });
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

    /* ---------------------------------------------------- 2 · the bulb
       It is lowered in rather than faded in - the cord grows down from the
       top of the screen and the lamp comes with it - and it is already
       swinging when it arrives, because a pendant that appears dead still
       reads as a picture of a bulb. */
    function bulb(next: () => void) {
      startPendulum();
      angVel = 0.014;                          // the kick it arrives with

      const tl = line({ onComplete: next });
      tl.set(rig, { autoAlpha: 1 });
      tl.fromTo(cord,
        { scaleY: 0, transformOrigin: "50% 0%" },
        { scaleY: 1, duration: 1.05, ease: "power2.out" }, 0);
      tl.fromTo(lamp,
        { y: -180, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.05, ease: "power2.out" }, 0);

      /* the switch shows up a beat later, so the bulb has the screen to
         itself first and the switch reads as the answer to it */
      tl.to(switchEl, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.85);
      tl.to(skip, { autoAlpha: 1, duration: 0.5 }, 1.2);
    }

    /* ---------------------------------------------------- the pendulum
       A real one, integrated per frame, not a yoyo tween: theta'' =
       -k sin(theta) - c theta' + drive. The cursor is the drive term, so
       moving past the bulb pushes it and it keeps swinging after you have
       gone - which is the whole difference between "it reacts to the mouse"
       and "it is hanging there".

       k sets the period (~1.5s at this value, about right for a metre of
       flex), c bleeds it off slowly enough that it never looks damped. */
    let angle = 0;
    let angVel = 0;
    let mx = -1;
    let my = -1;
    let pendulum = false;

    function startPendulum() {
      if (pendulum) return;
      pendulum = true;

      on(window, "mousemove", ((e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
      }) as EventListener);

      const turnY = gsap.quickTo(svg, "rotationY", { duration: 0.9, ease: "power3" });
      const turnX = gsap.quickTo(svg, "rotationX", { duration: 0.9, ease: "power3" });

      addTicker(() => {
        const r = lamp.getBoundingClientRect();
        if (!r.width) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        /* the push, strongest just beside the bulb and gone by ~520px, so
           crossing the room does nothing and walking past it does */
        let drive = 0;
        if (mx >= 0) {
          const dx = mx - cx;
          const near = Math.max(0, 1 - Math.abs(dx) / 520);
          drive = gsap.utils.clamp(-1, 1, dx / 260) * near * near * 0.0009;
        }
        angVel += -0.0072 * Math.sin(angle) + drive - angVel * 0.0075;
        angle += angVel;
        gsap.set(sway, { rotation: angle * rad });

        /* and the lamp itself turns to face you - a few degrees only. This
           is the part that stops it reading as a flat SVG: the glass
           highlight travels across the envelope as it turns. */
        if (mx >= 0) {
          turnY(gsap.utils.clamp(-16, 16, (mx - cx) / 34));
          turnX(gsap.utils.clamp(-10, 10, -(my - cy) / 46));
        }
      });
    }

    /* ---------------------------------------------------- 3 · the switch
       Armed until something flips it: the plate, the bulb, a keypress, or
       eventually the clock. Whichever gets there first disarms the rest. */
    function arm(fire: () => void) {
      let fired = false;
      const go = () => {
        if (fired) return;
        fired = true;
        gsap.to(hint, { autoAlpha: 0, duration: 0.25 });
        gsap.killTweensOf(switchEl);
        fire();
      };

      /* the hint breathes rather than blinks - it has to be findable in a
         black room without becoming the loudest thing in it */
      gsap.fromTo(switchEl,
        { "--pilot": 0.35 },
        { "--pilot": 1, duration: 1.15, ease: "sine.inOut", repeat: -1, yoyo: true });

      on(switchEl, "click", go);
      on(lamp, "click", go);
      /* Enter/Space anywhere, so it works without having to find the switch
         first - except when the skip button has focus, where the browser is
         about to turn the same keypress into a click on it. */
      on(window, "keydown", ((e: KeyboardEvent) => {
        if (e.target === skip) return;
        if (e.key === "Enter" || e.key === " ") go();
      }) as EventListener);
      after(AUTO_FLIP, go);
    }

    /* ---------------------------------------------------- 4 · ignition
       Three failed strikes and then it catches. The stutter is written as
       hard sets rather than tweens because that is what a filament striking
       actually does - it is either conducting or it is not, and easing
       between the two is exactly what makes CGI flicker look fake. */
    function ignite(next: () => void) {
      const tl = line({ onComplete: next });

      /* the rocker goes over first, and the bulb feels it */
      tl.to(rocker, { rotation: 14, duration: 0.12, ease: "power3.out" }, 0);
      tl.add(() => { angVel += 0.004; }, 0.12);

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

      /* and the switch is done being the point of the screen */
      tl.to(switchEl, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 0.7);
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
       The bulb has done its job, so it walks out of the middle of the frame
       and shrinks into the corner, and the camera runs the last GAP at the
       standing wall. At the end of that run the wall is at z = 0 with an
       identity transform, which is to say it *is* the hero - so all the
       hand-off has to do is stop being in front of it. */
    function finale() {
      const tl = line({ onComplete: handOff });

      /* Shrink about the glass rather than about the box, so the bulb goes
         to the corner and the cord goes away from it instead of the whole
         assembly sliding off as a unit. Measured now, not at build time:
         the cord's height is viewport-relative. */
      const glassY = cord.offsetHeight + 152;
      gsap.set(rig, { transformOrigin: `110px ${glassY}px` });
      const toX = 62 - window.innerWidth / 2;
      const toY = window.innerHeight - 64 - glassY;

      tl.to(rig, { x: toX, y: toY, scale: 0.15, duration: 1.5, ease: "power2.inOut" }, 0);
      tl.to(cord, { autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.35);
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
        gsap.set([switchEl, skip], { display: "none" });
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
      gsap.killTweensOf([switchEl, hint, svg, ...slabs]);
      timers.forEach(clearTimeout);
      timers.length = 0;

      gsap.set(root, { "--lit": 0.55 });
      gsap.set(slabs, { autoAlpha: 0 });
      gsap.set(slabs[walls.length - 1], { autoAlpha: 1, rotationX: 0, "--lit-floor": 1 });
      gsap.set(rig, { autoAlpha: 0 });
      gsap.set([switchEl, skip, loader], { autoAlpha: 0 });
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
