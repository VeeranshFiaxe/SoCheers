"use client";

import { useEffect, useRef } from "react";
import { ART } from "@/lib/series-content";
import { isLite } from "@/lib/perf";
import { holdScroll, jumpTo } from "@/lib/motion";

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
   on the screen when the section is met. What the pull does is take him
   apart: his face goes into the phone, the light it leaves behind runs
   in after it, and the frame that lands is the one the deck sent.

   ---- the layers ----

     to     the deck's finished frame, underneath everything
     from   the ordinary frame, whole
     hole   the deck's frame cut to the shape of his profile, fading in
            as the profile leaves
     smear  the deck's frame again, blurred and screen-blended,
            stretched off the phone - the band of light
     face   the FRONT of his face, scaled ABOUT THE PHONE so that it
            collapses into it
     wisp   the same profile again, blurred hard and screen-blended,
            thrown further and faster - what is left of him
     glow   what the screen throws back into the room
     motes  the spray, pulled into the phone under a 1/d^2 suction

   WHAT LEAVES IS THE PROFILE AND NOT THE HEAD. The brow, the nose, the
   lips, the jaw. The ear, the hair and the back of his skull stay where
   they are, because in the deck's own frame they have not moved.

   ---- why all of it is one canvas ----

   This used to be six <img> layers, each twice the size of the screen,
   carrying masks, blurs and blend modes. That is a stack of GPU
   surfaces tens of megapixels each, and what a browser does when it
   runs out of room for them differs by browser and by machine: some
   frames it paints them, some it drops a tile (a black block over the
   picture), some it drops a layer (the whole face gone for a frame).
   That was the flicker, and why it came and went.

   So every layer is now prepared ONCE, when the two files arrive - the
   grade, the blurs and the masks are baked into small offscreen
   canvases, cropped to the part of the picture they cover - and each
   frame is a handful of drawImage calls into one canvas the size of the
   section. Nothing is left for the compositor to decide, so it looks
   the same on every browser, every time.

   The DOM frame underneath is only the fallback: it is what a reader
   without JavaScript, or with reduced motion, sees - the deck's
   finished frame - and it is hidden the moment the canvas has drawn.

   ---- the frame, and why any of it can be aimed ----

   The picture is not cropped by object-fit. The frame carries the
   files' own 2.39:1, sized to twice what it takes to cover the section
   (a little under twice the width on a phone), so a fraction inside the
   frame is a fraction of the PHOTOGRAPH at every window. geometry()
   below is the same box the stylesheet builds for .st-pull__frame.

   Two points, measured off the files: THE PHONE at 39.8% 55.2%, where
   both plates go over 235 luma, and THE PROFILE at 50.3% 49.5%. Every
   layer is scaled about the phone and every mote is pulled to it.

   ---- the numbers ----

     at    how far the pull has played, on a clock rather than on the
           scroll - see the hold below. It plays once and never goes
           back.
     s     his face going into the phone
     fa    how much of it you can still see, which holds high and then
           drops
     g     the handover of the rest of the room, last and separately
     b     the burst: 0 up to 1 and back to 0 across the middle. The
           spray, the smear, the wisp and the glow are on this.
   ============================================================ */

const PHONE = { x: 0.398, y: 0.552 };
const FACE = { x: 0.503, y: 0.495, rx: 0.045, ry: 0.105 };
/* the files' own 2200/920 */
const RATIO = 2.3913;

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

/* a piece of the photograph, prepared once. x/y/w/h are where it sits,
   as fractions of the frame. */
type Sprite = { c: HTMLCanvasElement; x: number; y: number; w: number; h: number };
type Box = { x: number; y: number; w: number; h: number };
type Tone = { contrast?: number; bright?: number; saturate?: number };
type Oval = { x: number; y: number; rx: number; ry: number; stops: [number, string][] };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
/* 3t^2-2t^3 */
const ease = (t: number) => t * t * (3 - 2 * t);

/* ---- the shapes, as fractions of the frame ---- */

/* the front of his face: solid over the lit profile, stopping short of
   the ear, soft past it - a face that detaches on a hard edge is a
   cut-out, not a face coming apart */
const CUT: Oval = {
  x: 0.503,
  y: 0.495,
  rx: 0.065,
  ry: 0.155,
  stops: [
    [0, "rgba(0,0,0,1)"],
    [0.5, "rgba(0,0,0,1)"],
    [0.76, "rgba(0,0,0,.5)"],
    [1, "rgba(0,0,0,0)"],
  ],
};
const CUT_BOX: Box = { x: 0.428, y: 0.33, w: 0.15, h: 0.33 };

/* the band of light: only the phone and what comes off it */
const BEAM: Oval = {
  x: 0.45,
  y: 0.51,
  rx: 0.24,
  ry: 0.34,
  stops: [
    [0, "rgba(0,0,0,1)"],
    [0.34, "rgba(0,0,0,1)"],
    [0.88, "rgba(0,0,0,0)"],
  ],
};
const BEAM_BOX: Box = { x: 0.2, y: 0.16, w: 0.5, h: 0.7 };

const GLOW_BOX: Box = { x: 0.288, y: 0.289, w: 0.22, h: 0.526 };

/* the grade the three-band poster runs, so this section still belongs
   to the page rather than to its own effect */
const GRADE: Tone = { contrast: 1.09, saturate: 0.88 };

/* ---- preparing the sprites ---- */

function sheet(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/* contrast, then brightness, then saturation - the order the CSS filters
   they replace ran in. Skipped (the picture is left ungraded) if the
   pixels cannot be read, e.g. a file served from another origin. */
function tone(c: HTMLCanvasElement, t: Tone) {
  const g = c.getContext("2d");
  if (!g) return;
  let img: ImageData;
  try {
    img = g.getImageData(0, 0, c.width, c.height);
  } catch {
    return;
  }
  const d = img.data;
  const C = t.contrast ?? 1;
  const off = 127.5 * (1 - C);
  const B = t.bright ?? 1;
  const S = t.saturate ?? 1;
  const cl = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < d.length; i += 4) {
    const r = cl(cl(d[i] * C + off) * B);
    const gg = cl(cl(d[i + 1] * C + off) * B);
    const b = cl(cl(d[i + 2] * C + off) * B);
    d[i] = (0.213 + 0.787 * S) * r + (0.715 - 0.715 * S) * gg + (0.072 - 0.072 * S) * b;
    d[i + 1] = (0.213 - 0.213 * S) * r + (0.715 + 0.285 * S) * gg + (0.072 - 0.072 * S) * b;
    d[i + 2] = (0.213 - 0.213 * S) * r + (0.715 - 0.715 * S) * gg + (0.072 + 0.928 * S) * b;
  }
  g.putImageData(img, 0, 0);
}

/* a soft blur of roughly `f` pixels: halve it down, double it back up.
   Done once, so the cost is nothing; it only has to look like a glow. */
function soften(c: HTMLCanvasElement, f: number) {
  const steps = [c];
  let cur = c;
  for (let s = 1; s < f; s *= 2) {
    const n = sheet(cur.width / 2, cur.height / 2);
    const g = n.getContext("2d");
    if (!g) return;
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, n.width, n.height);
    steps.push(n);
    cur = n;
  }
  for (let i = steps.length - 2; i >= 0; i--) {
    const t = steps[i];
    const g = t.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, t.width, t.height);
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, t.width, t.height);
    cur = t;
  }
}

/* an elliptical radial gradient, which canvas does not have: a circular
   one drawn under a scale */
function oval(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stops: [number, string][],
) {
  g.save();
  g.setTransform(rx, 0, 0, ry, cx, cy);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  g.fillStyle = grad;
  g.fillRect(-cx / rx, -cy / ry, w / rx, h / ry);
  g.restore();
}

function sprite(
  src: CanvasImageSource,
  iw: number,
  ih: number,
  box: Box,
  opt: { tone?: Tone; soft?: number; mask?: Oval } = {},
): Sprite {
  const c = sheet(box.w * iw, box.h * ih);
  const g = c.getContext("2d");
  if (g) {
    g.drawImage(src, box.x * iw, box.y * ih, box.w * iw, box.h * ih, 0, 0, c.width, c.height);
    if (opt.tone) tone(c, opt.tone);
    if (opt.soft) soften(c, opt.soft);
    if (opt.mask) {
      const m = opt.mask;
      g.globalCompositeOperation = "destination-in";
      oval(g, c.width, c.height, (m.x - box.x) * iw, (m.y - box.y) * ih, m.rx * iw, m.ry * ih, m.stops);
      g.globalCompositeOperation = "source-over";
    }
  }
  return { c, ...box };
}

function glowSprite(): Sprite {
  const px = 480;
  const c = sheet(px, px);
  const g = c.getContext("2d");
  if (g) {
    const sx = px / GLOW_BOX.w;
    const sy = px / GLOW_BOX.h;
    const cx = (PHONE.x - GLOW_BOX.x) * sx;
    const cy = (PHONE.y - GLOW_BOX.y) * sy;
    /* the wide one under, the hot one over - the order the stylesheet
       stacked them in */
    oval(g, px, px, cx, cy, 0.11 * sx, 0.263 * sy, [
      [0, "rgba(206,228,255,.5)"],
      [0.45, "rgba(150,190,255,.18)"],
      [0.84, "rgba(120,170,255,0)"],
      [1, "rgba(120,170,255,0)"],
    ]);
    oval(g, px, px, cx, cy, 0.04 * sx, 0.096 * sy, [
      [0, "rgba(255,255,255,.5)"],
      [0.6, "rgba(220,236,255,.12)"],
      [1, "rgba(180,214,255,0)"],
    ]);
  }
  return { c, ...GLOW_BOX };
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    if (/^https?:/.test(src)) i.crossOrigin = "anonymous";
    i.decoding = "async";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/* the sprite every mote is drawn with. One soft dot, made once and
   stretched along its own heading at draw time. */
function makeDot() {
  const c = sheet(64, 64);
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
  const sky = useRef<HTMLCanvasElement>(null);

  /* [0] the ordinary photograph, [1] the deck's finished one */
  const from = ART(frames[0]);
  const to = ART(frames[1] ?? frames[0]);

  useEffect(() => {
    const el = box.current;
    const cv = sky.current;
    if (!el || !cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const narrowQ = window.matchMedia("(max-width:900px)");
    let dead = false;

    /* ---- the numbers -------------------------------------------- */

    let at = 0; /* how far the pull has played, 0 .. 1 */
    let s = 0;
    let fa = 1;
    let g = 0;
    let burst = 0;

    const compute = () => {
      /* the face goes first and fastest; the rest of the room hands over
         well behind it */
      s = ease(clamp01((at - 0.2) / 0.42));
      g = ease(clamp01((at - 0.52) / 0.42));
      burst = Math.sin(Math.PI * clamp01((at - 0.16) / 0.58));
      fa = 1 - Math.pow(s, 2.6);
    };
    compute();

    /* ---- the pictures ------------------------------------------- */

    type Kit = {
      to: Sprite;
      from: Sprite;
      hole: Sprite;
      smear: Sprite;
      face: Sprite;
      wisp: Sprite;
      glow: Sprite;
    };
    let kit: Kit | null = null;

    /* ---- the box ------------------------------------------------ */

    let dpr = 1;
    let cw = 0;
    let ch = 0;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isLite() ? 1 : 1.5);
      cw = el.clientWidth;
      ch = el.clientHeight;
      const w = Math.max(1, Math.round(cw * dpr));
      const h = Math.max(1, Math.round(ch * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
    };
    size();

    /* where the photograph sits in the section this frame - the same box
       the stylesheet builds for .st-pull__frame, closing in by a twentieth
       across the pull */
    let fx = 0;
    let fy = 0;
    let fw = 0;
    let fh = 0;
    const geometry = () => {
      const k = 1 + at * 0.05;
      let FW: number;
      let FH: number;
      let lift = 0;
      if (narrowQ.matches) {
        FW = cw * 1.9;
        FH = FW / RATIO;
      } else {
        FW = Math.max(cw * 2, ch * 2 * RATIO);
        FH = Math.max(ch * 2, (cw * 2) / RATIO);
        /* keeps the bottom of the phone inside the frame */
        lift = 0.02;
      }
      fw = FW * k;
      fh = FH * k;
      fx = cw / 2 - fw / 2;
      fy = ch / 2 - k * (FH / 2 + lift * FH);
    };

    /* one layer: scaled about the phone, stretched and shifted along x */
    const layer = (
      sp: Sprite,
      alpha: number,
      op: GlobalCompositeOperation,
      sx = 1,
      sy = 1,
      tx = 0,
    ) => {
      if (alpha <= 0.003) return;
      const a = fw * sx;
      const d = fh * sy;
      const e = fx + fw * (PHONE.x + tx - sx * PHONE.x);
      const f = fy + fh * (PHONE.y - sy * PHONE.y);
      ctx.setTransform(a * dpr, 0, 0, d * dpr, e * dpr, f * dpr);
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.globalCompositeOperation = op;
      ctx.drawImage(sp.c, sp.x, sp.y, sp.w, sp.h);
    };

    const paint = () => {
      if (!kit) return;
      geometry();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#0b0b0c";
      ctx.fillRect(0, 0, cv.width, cv.height);

      layer(kit.to, 1, "source-over");
      layer(kit.from, 1 - g, "source-over");
      layer(kit.hole, 1 - fa, "source-over");
      layer(kit.smear, burst * 0.85 + g * 0.12, "screen", 1 + burst * 0.55, 1, burst * -0.03);
      layer(kit.face, fa, "source-over", 1 - s * 0.6, 1 - s * 0.9);
      layer(kit.wisp, burst * 0.8, "screen", 1 - s * 0.35, 1 - s * 0.95);
      layer(kit.glow, burst * 0.85 + g * 0.2, "screen");
    };

    /* ---- the hold -----------------------------------------------

       The pull PLAYS - on a clock, at the same speed however the reader
       scrolls - and the page is held still while it does.

       When the section reaches the screen (a section taller than the
       screen with its bottom at the screen's bottom), the scroll is put
       exactly there and locked: Lenis is stopped, wheel, touch and
       scroll keys are swallowed, and anything that still moves the page
       is put straight back. The lock lifts the moment the pull has
       finished and is never set again.

       The clock does not start until both pictures are ready, so the
       first thing the reader sees is always the first frame of it.

       A reader who lands below the section (a restored scroll) never
       sees it play; the picture is simply the finished frame. */
    const DUR = 2600;
    const FROM = 0.12; /* nothing happens in the first stretch of `at` */
    const sec = el.closest<HTMLElement>(".st-beat") ?? el;

    let armed = false;
    let start = 0;
    let done = false;
    let locked = false;
    let lockY = 0;
    let unlockT = 0;
    let prev: number | null = null;

    const KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
    const swallow = (e: Event) => {
      if (locked && e.cancelable) e.preventDefault();
    };
    const swallowKey = (e: KeyboardEvent) => {
      if (locked && KEYS.has(e.key)) e.preventDefault();
    };

    const unlock = () => {
      window.clearTimeout(unlockT);
      if (!locked) return;
      locked = false;
      holdScroll(false);
    };

    const finish = () => {
      done = true;
      at = 1;
      compute();
      unlock();
      paint();
    };

    const play = (y: number) => {
      armed = true;
      locked = true;
      lockY = Math.max(0, Math.round(y));
      jumpTo(lockY);
      holdScroll(true);
      /* a backstop: if the pictures never arrive, the page is never left
         locked. Replaced by a tighter one when the clock starts. */
      unlockT = window.setTimeout(finish, DUR + 4000);
      wake();
    };

    const check = () => {
      if (done || armed) return;
      const vh = window.innerHeight;
      const r = sec.getBoundingClientRect();
      const d = r.top - Math.min(0, vh - r.height);
      /* Already wholly above the screen: landed below it (a restored
         reload, which arrives a few frames after the first look and so
         reads as a crossing) or jumped clean past it. Pulling the reader
         back up a screen to play it would be the page moving on its own. */
      if (r.bottom <= 0) {
        finish();
        return;
      }
      /* Same for a crossing made in one jump of more than a screen - a
         restore landing part way into the section. Nobody scrolls that far
         between two looks, so it was not read and is not played. */
      if (prev !== null && prev > 0 && d < 0 && prev - d > vh) {
        finish();
        return;
      }
      /* at the mark, or crossed it since the last look - either way,
         from above or below */
      if (Math.abs(d) < 2 || (prev !== null && prev > 0 !== d > 0)) {
        play(window.scrollY + d);
        return;
      }
      prev = d;
    };

    const onLockedScroll = () => {
      if (locked && Math.abs(window.scrollY - lockY) > 1) window.scrollTo(0, lockY);
    };

    window.addEventListener("wheel", swallow, { passive: false });
    window.addEventListener("touchmove", swallow, { passive: false });
    window.addEventListener("keydown", swallowKey);
    window.addEventListener("scroll", onLockedScroll, { passive: true });

    /* ---- the spray ---------------------------------------------- */

    const dot = makeDot();
    const motes: Mote[] = [];

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

    const spray = (dt: number) => {
      /* a phone, or a lite machine (lib/perf.ts), gets the thinner spray */
      const thin = narrowQ.matches || isLite();
      const cap = thin ? 80 : 200;
      if (burst > 0.02 && motes.length < cap) {
        const rate = burst * burst * (thin ? 2.6 : 5.5);
        let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
        while (n-- > 0 && motes.length < cap) spawn();
      }
      if (!motes.length) return;

      ctx.globalCompositeOperation = "lighter";
      const step = dt * 60;
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.px = m.x;
        m.py = m.y;

        const dx = PHONE.x - m.x;
        const dy = PHONE.y - m.y;
        const d = Math.hypot(dx, dy) || 1e-4;
        /* the suction: harder the closer he gets. The softening term
           stops it being a singularity. */
        const pull = 0.000045 / (d * d + 0.05);
        m.vx += (dx / d) * pull * step;
        m.vy += (dy / d) * pull * step;
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

        /* in over the first sixth of its life, out over the last third,
           out again over the last of the distance - a mote that vanishes
           at full brightness pops */
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

        /* sized off the frame rather than off the window */
        const head = m.size * (fw / 1900) * 9;
        const ax = x1 - x0;
        const ay = y1 - y0;
        const len = Math.hypot(ax, ay);
        const cs = len > 1e-4 ? ax / len : 1;
        const sn = len > 1e-4 ? ay / len : 0;
        /* one stretched sprite, laid along the way it came */
        const long = len * 2.2 + head;
        ctx.setTransform(cs * dpr, sn * dpr, -sn * dpr, cs * dpr, x1 * dpr, y1 * dpr);
        ctx.globalAlpha = m.warm ? a : a * 0.92;
        ctx.drawImage(dot, -long + head * 0.5, -head / 2, long, head);
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    };

    /* ---- the loop ----------------------------------------------- */

    let last = 0;
    let raf = 0;
    let seen = false;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      /* capped, so a tab coming back from the background does not resume
         with one enormous step */
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;

      /* the clock, not the scroll - and only once there is something to
         show */
      if (armed && !done && kit) {
        if (!start) {
          start = t;
          window.clearTimeout(unlockT);
          unlockT = window.setTimeout(unlock, DUR + 1200);
        }
        const k = clamp01((t - start) / DUR);
        at = FROM + (1 - FROM) * k;
        if (k >= 1) {
          done = true;
          unlock();
        }
        compute();
      }

      paint();
      if (kit) spray(dt);

      const playing = armed && !done;
      if (!seen || (!playing && burst <= 0.02 && motes.length === 0)) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    };

    const wake = () => {
      if (!raf && seen) raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => {
      size();
      paint();
    });
    ro.observe(el);

    /* the loop only exists while the section is on the screen */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const was = seen;
          seen = e.isIntersecting;
          if (seen && !was) {
            check();
            wake();
          }
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    const onScroll = () => check();
    requestAnimationFrame(check);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /* ---- the prep ----------------------------------------------- */

    Promise.all([load(from), load(to)])
      .then(([a, b]) => {
        if (dead) return;
        const iw = b.naturalWidth;
        const ih = b.naturalHeight;
        const aw = a.naturalWidth;
        const ah = a.naturalHeight;
        const whole: Box = { x: 0, y: 0, w: 1, h: 1 };
        const toS = sprite(b, iw, ih, whole, { tone: GRADE });
        const fromS = sprite(a, aw, ah, whole, { tone: GRADE });
        kit = {
          to: toS,
          from: fromS,
          hole: sprite(toS.c, iw, ih, CUT_BOX, { mask: CUT }),
          smear: sprite(b, iw, ih, BEAM_BOX, { tone: { bright: 1.12 }, soft: 4, mask: BEAM }),
          face: sprite(fromS.c, aw, ah, CUT_BOX, { mask: CUT }),
          wisp: sprite(a, aw, ah, CUT_BOX, {
            tone: { bright: 1.45, saturate: 0.8 },
            soft: 8,
            mask: CUT,
          }),
          glow: glowSprite(),
        };
        size();
        paint();
        /* the canvas has drawn: the fallback frame can go */
        el.classList.add("is-live");
        wake();
      })
      .catch(() => {
        /* the fallback frame stays, and the page is never left held */
        if (armed) finish();
        done = true;
      });

    return () => {
      dead = true;
      io.disconnect();
      ro.disconnect();
      unlock();
      window.removeEventListener("wheel", swallow);
      window.removeEventListener("touchmove", swallow);
      window.removeEventListener("keydown", swallowKey);
      window.removeEventListener("scroll", onLockedScroll);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.classList.remove("is-live");
    };
  }, [from, to]);

  return (
    <div className="st-pull" ref={box} aria-hidden="true">
      {/* the fallback: the deck's finished frame, framed the way the
          canvas frames it. What no-JS and reduced motion get. */}
      <div className="st-pull__frame">
        <img className="st-pull__to" src={to} alt="" decoding="async" />
      </div>

      {/* everything the pull draws, in one surface */}
      <canvas className="st-pull__canvas" ref={sky} />
    </div>
  );
}
