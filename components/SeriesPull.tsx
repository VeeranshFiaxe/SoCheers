"use client";

import { useEffect, useRef } from "react";
import { ART } from "@/lib/series-content";

/* ============================================================
   THE PULL - the picture layer for section 4, the title card.

   Two photographs of the same man in the same chair, and the scroll is
   what gets him from one to the other.

   ---- what the section needs the picture to do ----

   Section 4 names the behaviour. The still the deck supplied for it is
   the behaviour already finished: a face drawn out of a head and into
   the phone it is looking at, as a band of light. Arriving finished, it
   spends itself before the line naming the thing has been read.

   So the client shot the frame BEFORE it. Same room, same light, same
   phone in the same place - and an ordinary face on it. That is what is
   on the screen when the section is met. What the scroll does is take
   him apart: his face goes into the phone, the light it leaves behind
   runs in after it, and the frame that lands is the one the deck sent.

   ---- the layers ----

   Five, and the order of them is the whole design:

     to     the deck's finished frame, underneath everything
     from   the ordinary frame, with a STATIC hole where his face is
     smear  the deck's frame again, blurred once and screen-blended,
            stretched off the phone - the band of light, over both
     face   his face, on its own layer, scaled ABOUT THE PHONE so that
            it collapses into it
     wisp   the same face again, blurred hard and screen-blended,
            thrown further and faster - what is left of him

   `from` and `face` carry complementary masks: where one is solid the
   other is clear, and they are cut from the same photograph, so at rest
   they are one picture with no seam in it. The hole does not open. His
   face LEAVES, and what was always behind it is the deck's smear.

   That is the difference from the pass before this one, where the mask
   opened and the face stayed put. A hole that opens on its own is a
   wipe: the picture changes and nothing in it moves, which is the one
   thing this section is about.

   ---- and why nothing here animates a mask or a filter ----

   Every value the scroll drives is an OPACITY or a TRANSFORM, and
   nothing else. Both are handled on the compositor: a layer is
   rasterised once and then moved and faded, so a frame of this costs
   nothing to paint.

   The pass before this one grew a mask radius and a blur radius as the
   scroll moved. Both are paint rather than composite, and both were
   being re-run every frame over a picture the size of two screens,
   which is what made it judder. The masks here are fixed. The blurs
   here are fixed. What moves is where a layer is and how much of it you
   can see.

   ---- the spray ----

   The canvas, and the part of this that is neither photograph: motes
   lifting off his face and accelerating into the phone under a real
   1/d^2 suction. Aimed at the FRAME rather than at the window, so both
   ends of the stream sit where they belong at every viewport.

   Drawn as one stretched sprite per mote rather than as a stroked path
   plus a dot - half the calls, and the streak comes out soft at both
   ends instead of needing a round cap. The backing store is capped
   below the device's own pixel ratio: these are soft glows with no edge
   in them, nobody can see the difference, and what this layer costs per
   frame is the pixels it clears and composites rather than the number
   of motes in it. It is hidden outright while it is empty.

   ---- the frame, and why any of it can be aimed ----

   Every other picture on the page is object-fit:cover, which crops by
   an amount that depends on the shape of the reader's window. Nothing
   can be positioned against the CONTENT of a frame cropped that way - a
   mask over the man's face at 16:9 is over his shoulder at 21:9.

   So this one is not cropped by object-fit. .st-pull__frame is a box
   carrying the files' own 2.39:1, sized in container units to twice
   what it takes to cover the section, and both plates fill it exactly.
   A percentage inside the frame is a percentage of the PHOTOGRAPH, at
   every window.

   Sized to twice it, rather than sized to cover it and then scaled by
   two, which is what this used to do. The box is now the size it is
   shown at, so the layers inside it rasterise at 1:1 and the only scale
   left on them is the tenth the frame closes in by across the pull.

   Two numbers, measured off the files rather than guessed: THE PHONE at
   39.8% 55.2%, where both plates go over 235 luma, and THE FACE at
   50.5% 46.8%, the lit region of the ordinary one. The phone is the
   point every layer in the stylesheet is scaled about and the point
   every mote here is pulled to, so that one has to agree across the two
   files. The face is where the motes are spawned; the stylesheet's own
   mask sits wider and a little to its left, for a reason that is
   written where it is set.

   ---- the numbers the scroll writes ----

     --p   the approach, damped. 0 while the section's top edge is two
           thirds of the way down the window, 1 once it has gone a third
           of the way past the top of it.
     --s   his face going into the phone
     --fa  how much of it you can still see, which holds high and then
           drops - a face that fades as fast as it travels has gone
           before it has gone anywhere
     --g   the handover of the rest of the room, last and separately
     --b   the burst: 0 up to 1 and back to 0 across the middle of all
           of it. The spray, the smear, the wisp and the glow are on
           this, because they are things that HAPPEN.

   Nothing moves for the first fifth of --p. The section has to be
   looked at before the picture in it changes: run any earlier and the
   whole thing happens in the corner of the reader's eye on the way up
   the screen, which is what the first pass of this did.

   And --p is not the scroll position. It CHASES it, on a frame-rate
   independent follow, so a trackpad's steps and a wheel's notches
   arrive as one continuous move rather than as the sum of their jumps.
   That is the other half of why this is smoother than the pass before
   it.

   They rest FINISHED in the stylesheet - --p, --s and --g at 1, --fa
   and --b at 0 - so a reader whose JavaScript never runs, and one who
   has asked for reduced motion, get the deck's photograph rather than a
   man stuck halfway out of his own face.
   ============================================================ */

const PHONE = { x: 0.398, y: 0.552 };
const FACE = { x: 0.505, y: 0.468, rx: 0.055, ry: 0.12 };

type Mote = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  warm: number;
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
/* 3t^2-2t^3 */
const ease = (t: number) => t * t * (3 - 2 * t);

/* the sprite every mote is drawn with. One soft dot, made once and
   stretched along its own heading at draw time - a gradient built per
   mote per frame is the only thing here that would cost anything. */
function makeDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(232,242,255,.9)");
  grad.addColorStop(0.5, "rgba(160,198,255,.3)");
  grad.addColorStop(1, "rgba(120,170,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function SeriesPull({ frames }: { frames: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = box.current;
    const frame = plate.current;
    const cv = sky.current;
    if (!el || !frame || !cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const narrow = window.matchMedia("(max-width:900px)").matches;

    /* ---- the numbers -------------------------------------------- */

    let want = 0; /* where the scroll says the section is */
    let at = 0; /* where the picture actually is */
    let burst = 0;

    const aim = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      want = clamp01((vh * 0.66 - r.top) / (vh * 1.02));
    };

    const write = () => {
      /* in order: his face goes into the phone, and the rest of the
         room hands over well behind it */
      const s = ease(clamp01((at - 0.2) / 0.42));
      const g = ease(clamp01((at - 0.52) / 0.42));
      burst = Math.sin(Math.PI * clamp01((at - 0.16) / 0.58));
      const st = el.style;
      st.setProperty("--p", at.toFixed(4));
      st.setProperty("--s", s.toFixed(4));
      st.setProperty("--fa", (1 - Math.pow(s, 2.6)).toFixed(4));
      st.setProperty("--g", g.toFixed(4));
      st.setProperty("--b", burst.toFixed(4));
    };

    aim();
    write();

    /* ---- the spray ---------------------------------------------- */

    const CAP = narrow ? 80 : 200;
    const dot = makeDot();
    const motes: Mote[] = [];

    let dpr = 1;
    let cw = 0;
    let ch = 0;
    const size = () => {
      /* below the device's own ratio on purpose - see the note above */
      dpr = Math.min(window.devicePixelRatio || 1, 1.3);
      cw = el.clientWidth;
      ch = el.clientHeight;
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const spawn = () => {
      /* uniform inside the ellipse over his face */
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const x = FACE.x + Math.cos(a) * r * FACE.rx;
      const y = FACE.y + Math.sin(a) * r * FACE.ry;
      motes.push({
        x,
        y,
        px: x,
        py: y,
        vx: -0.0004 - Math.random() * 0.0009,
        vy: (Math.random() - 0.5) * 0.001,
        life: 0,
        ttl: 1.1 + Math.random() * 0.9,
        size: 0.7 + Math.random() * 1.8,
        /* some of them keep the warm cast the screen has in the plate;
           the rest are the blue the room is lit by */
        warm: Math.random() < 0.3 ? 1 : 0,
      });
    };

    let last = 0;
    let raf = 0;
    let seen = false;
    let lit = true;

    const show = (on: boolean) => {
      if (on === lit) return;
      lit = on;
      cv.style.visibility = on ? "visible" : "hidden";
    };
    show(false);

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      /* capped, so a tab coming back from the background does not
         resume with one enormous step */
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;

      aim();
      /* the follow. exp() rather than a fixed fraction of the gap, so
         the rate is the same whether the display runs at 60 or at 144 */
      const gap = want - at;
      at += gap * (1 - Math.exp(-dt * 11));
      if (Math.abs(gap) < 0.0004) at = want;
      write();

      const b0 = el.getBoundingClientRect();
      const f0 = frame.getBoundingClientRect();
      /* the frame is translated and scaled, never rotated, so its box
         IS the picture and a percentage of it is a percentage of the
         photograph */
      const fx = f0.left - b0.left;
      const fy = f0.top - b0.top;
      const fw = f0.width;
      const fh = f0.height;

      if (burst > 0.02 && motes.length < CAP) {
        const rate = burst * burst * (narrow ? 2.6 : 5.5);
        let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
        while (n-- > 0 && motes.length < CAP) spawn();
      }

      show(motes.length > 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = "lighter";

      const step = dt * 60;
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.px = m.x;
        m.py = m.y;

        const dx = PHONE.x - m.x;
        const dy = PHONE.y - m.y;
        const d = Math.hypot(dx, dy) || 1e-4;
        /* the suction: harder the closer he gets, which is the shape of
           the thing the section is naming. The softening term is what
           stops it being a singularity - without it the last two frames
           of a mote's life are a streak across the screen, and what the
           reader sees is a flicker rather than a stream. */
        const g = 0.000045 / (d * d + 0.05);
        m.vx += (dx / d) * g * step;
        m.vy += (dy / d) * g * step;
        /* a little curl, so a hundred motes on the same errand do not
           arrive as one straight line */
        m.vx += (Math.random() - 0.5) * 0.00008 * step;
        m.vy += (Math.random() - 0.5) * 0.00012 * step;
        m.vx *= 0.994;
        m.vy *= 0.994;
        /* and a ceiling, so the trail is always a length somebody can
           see rather than a line across the frame */
        const sp = Math.hypot(m.vx, m.vy);
        if (sp > 0.011) {
          m.vx *= 0.011 / sp;
          m.vy *= 0.011 / sp;
        }
        m.x += m.vx * step;
        m.y += m.vy * step;
        m.life += dt;

        if (d < 0.016 || m.life > m.ttl) {
          motes.splice(i, 1);
          continue;
        }

        /* in over the first sixth of its life, out over the last third
           of it, out again over the last of the DISTANCE - almost all
           of them die at the phone rather than of old age, and a mote
           that vanishes at full brightness pops. This is it going into
           the light rather than being switched off.

           The burst floors at .35 rather than reaching 0, because a
           mote still in the air when the burst has passed should finish
           its journey rather than blink out where it stands. */
        const t0 = m.life / m.ttl;
        const a =
          Math.max(burst, 0.35) *
          Math.min(1, t0 / 0.16) *
          (t0 > 0.66 ? 1 - (t0 - 0.66) / 0.34 : 1) *
          Math.min(1, 0.12 + ((d - 0.016) / 0.04) * 0.88);
        if (a <= 0.004) continue;

        const x0 = fx + m.px * fw;
        const y0 = fy + m.py * fh;
        const x1 = fx + m.x * fw;
        const y1 = fy + m.y * fh;

        /* sized off the frame rather than off the window: the picture
           is twice the size of the screen, so a mote in fixed pixels is
           a different thing against a face 500px wide than against one
           that is 200 */
        const head = m.size * (fw / 1900) * 9;
        const ax = x1 - x0;
        const ay = y1 - y0;
        const len = Math.hypot(ax, ay);
        const cs = len > 1e-4 ? ax / len : 1;
        const sn = len > 1e-4 ? ay / len : 0;
        /* one stretched sprite, laid along the way it came: the head
           where it is, the tail where it was */
        const long = len * 2.2 + head;
        ctx.setTransform(cs * dpr, sn * dpr, -sn * dpr, cs * dpr, x1 * dpr, y1 * dpr);
        ctx.globalAlpha = m.warm ? a : a * 0.92;
        ctx.drawImage(dot, -long + head * 0.5, -head / 2, long, head);
      }

      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      /* the picture has caught up with the scroll and the last mote has
         gone: stand down until something moves again */
      if (!seen || (at === want && burst <= 0.02 && motes.length === 0)) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        show(false);
      }
    };

    const wake = () => {
      if (!raf && seen) raf = requestAnimationFrame(tick);
    };

    /* the loop only exists while the section is on the screen. Coming
       back to it, the picture is PUT where the scroll already is rather
       than animated there from wherever it was left. */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const was = seen;
          seen = e.isIntersecting;
          if (seen && !was) {
            aim();
            at = want;
            write();
            wake();
          }
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    /* when the loop is down the scroll still has to move the plates -
       the room goes on handing over long after the last mote */
    let idle = 0;
    const onScroll = () => {
      wake();
      if (raf || idle) return;
      idle = requestAnimationFrame(() => {
        idle = 0;
        if (raf) return;
        aim();
        at = want;
        write();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      io.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (idle) cancelAnimationFrame(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* [0] the ordinary photograph, [1] the deck's finished one */
  const from = ART(frames[0]);
  const to = ART(frames[1] ?? frames[0]);

  return (
    <div className="st-pull" ref={box} aria-hidden="true">
      <div className="st-pull__frame" ref={plate}>
        {/* the deck's frame, underneath everything */}
        <img className="st-pull__to" src={to} alt="" decoding="async" />

        {/* the ordinary frame, with a static hole where his face is */}
        <img className="st-pull__from" src={from} alt="" decoding="async" />

        {/* the band of light, over both, stretched off the phone */}
        <img className="st-pull__smear" src={to} alt="" decoding="async" />

        {/* his face, going in */}
        <img className="st-pull__face" src={from} alt="" decoding="async" />

        {/* and what is left of it, thrown further and faster */}
        <img className="st-pull__wisp" src={from} alt="" decoding="async" />

        {/* what the screen throws back into the room as it takes him */}
        <span className="st-pull__glow" />
      </div>

      {/* outside the frame and over it. Hidden outright while there is
          nothing in it, so an idle section is not compositing a
          full-screen layer for no reason. */}
      <canvas className="st-pull__spray" ref={sky} />
    </div>
  );
}
