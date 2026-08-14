/* ============================================================
   The mark, as a cloud of points.

   The SoCheers bulb is already geometry (lib/logo-paths.ts): a ring
   drawn as a stroked arc with a gap at the bottom, three round-capped
   bars stepping in underneath it, and an off-centre disc inside the
   glass. This file takes that same geometry and spins it - literally.
   Every part of the mark is revolved around its own vertical axis and
   then filled with grains:

     · the ring  -> a spherical shell at the ring's radius and thickness,
                    open at the bottom where the printed arc has its gap;
     · the bars  -> three stacked discs, each one the printed bar swept
                    through 360 degrees;
     · the disc  -> a soft ball of light sitting off-centre inside the
                    glass, exactly where the printed one sits.

   That revolve is not a liberty - it is the reading that puts the mark
   back where it came from. Project the shell flat and its outline *is*
   the printed ring: the aperture's rim lands on the chord between the
   two arc ends, at 32.5 degrees either side of bottom dead centre,
   because that is the same number ringArc() draws the arc from. So the
   object is genuinely three-dimensional and from the front it is still
   the logo - and since a solid of revolution looks the same from every
   side, turning it can never cost the silhouette.

   Nothing here is a picture of a bulb with particles stuck to it. The
   points are the only thing there is.

   This module is deliberately free of Three.js: it is the *shape*, and
   nothing else. What the shape then does - the springs, the cursor, the
   turn, the light - lives in lib/particle-logo.ts, which is also where
   the numbers for all of that are kept.
   ============================================================ */

import { BARS, BAR_STROKE, MARK } from "./logo-paths";

/* ============================================================
   THE FORM
   The knobs that decide what the object *is*. Everything about how it
   behaves is TUNE, in lib/particle-logo.ts.
   ============================================================ */
export const FORM = {
  /* Shares of the population: glass, base, inner light, strays. The
     glass carries the silhouette, so it takes the largest share; the
     base is small on screen but wants to read solid, so it gets more
     grains per square unit than anything else. */
  mix: { shell: 0.58, bars: 0.2, core: 0.18 },
  grain: 1.9,          // world-space diameter of a middling grain
  spring: 7.6,         // 1/s^2 - pull toward home per unit of displacement
  springSpread: 0.5,   // +/- share of that, per grain, so nobody arrives in step
  stray: 34,           // world units the loosest grains hang off the surface
};

/* ============================================================
   THE MARK, MEASURED
   Straight off lib/logo-paths.ts, so the particles and the drawn logo
   can never quietly drift apart. Local space is the mark's own 400-unit
   space, flipped to Y-up and lifted so the object's bounding box is
   centred on the origin - which is what lets the camera do nothing but
   sit back, and what puts the axis of revolution exactly on Y.
   ============================================================ */
const CAP = BAR_STROKE / 2;
const TOP = MARK.cy - MARK.r - MARK.stroke / 2;          // crown of the glass
const RUNGS = BARS.map((d) => {
  /* every bar is "Mx1 yHx2" - a flat run with round caps */
  const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  return { x1: n[0], y: n[1], x2: n[2] };
});
const FOOT = RUNGS[RUNGS.length - 1].y + CAP;            // underside of the base
const LIFT = (TOP + FOOT) / 2;                           // ...so the two are equal
const flip = (y: number) => LIFT - y;

const GLASS = { r: MARK.r, t: MARK.stroke, y: flip(MARK.cy) };
const CORE = {
  x: MARK.blob.cx - MARK.cx,
  y: flip(MARK.blob.cy),
  z: 8,                                                  // a nudge toward the viewer
  r: MARK.blob.r * 0.86,                                 // kept inside the glass
};
/* Half-angle of the printed gap, measured from bottom dead centre.
   Revolved, it is the half-angle of the hole in the shell. */
const APERTURE = MARK.gap * (Math.PI / 180);

/* How far the object reaches from its own centre, which is what the
   camera has to frame. */
export const EXTENT = { x: MARK.r + MARK.stroke / 2, y: LIFT - TOP };

/* ============================================================
   THE CLOUD
   Sampled once, deterministically, into flat typed arrays: home
   positions, surface normals for the key light, and a packed vec4 of
   per-grain identity. Nothing here allocates twice.
   ============================================================ */
export type Cloud = {
  count: number;
  home: Float32Array;   // vec3 - where every grain belongs
  nrm: Float32Array;    // vec3 - which way it faces, for the key light
  misc: Float32Array;   // vec4 - size · core tint · opacity · seed
  stiff: Float32Array;  // per-grain spring constant
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCloud(count: number): Cloud {
  const rnd = mulberry32(0x50c8ee5);
  /* three uniforms summed - near enough to normal for a scatter, and a
     great deal cheaper than the real thing */
  const bell = () => (rnd() + rnd() + rnd() - 1.5) * 1.1547;

  const home = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  const misc = new Float32Array(count * 4);
  const stiff = new Float32Array(count);

  let i = 0;
  const put = (
    x: number, y: number, z: number,
    nx: number, ny: number, nz: number,
    size: number, tint: number, alpha: number, spring: number,
  ) => {
    const j = i * 3;
    home[j] = x; home[j + 1] = y; home[j + 2] = z;
    nrm[j] = nx; nrm[j + 1] = ny; nrm[j + 2] = nz;
    const k = i * 4;
    misc[k] = size;
    misc[k + 1] = tint;
    misc[k + 2] = alpha;
    misc[k + 3] = rnd() * 100;              // seed: phase, wobble, brightness jitter
    stiff[i] = FORM.spring * spring * (1 + (rnd() * 2 - 1) * FORM.springSpread);
    i++;
  };

  const size = (lo: number, hi: number) => FORM.grain * (lo + rnd() * (hi - lo));

  /* ---------------------------------------------------------
     1 · the glass
     Uniform over the sphere's area, so a flat projection thickens
     toward the limb exactly the way the printed monoline ring reads as
     a ring - the rim is where the shell is edge-on and every grain in a
     deep column lands on the same few pixels. The printed stroke comes
     in as a scatter on the radius rather than a hard wall, which is
     what stops the shell looking machined.

     The last stretch before the aperture is thinned out instead of cut
     off: a hard edge there would project as a bright bar straight
     across the gap the printed mark leaves open. Dissolved, it says
     "the glass ends here" without drawing a line under it.
     --------------------------------------------------------- */
  const uMin = Math.cos(Math.PI - APERTURE);
  const uFade = Math.cos((120 * Math.PI) / 180);
  const shellDir = (): [number, number, number] => {
    for (;;) {
      const u = uMin + rnd() * (1 - uMin);
      const t = (u - uFade) / (uMin - uFade);
      if (t > 0 && rnd() < t * 0.88) continue;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      const a = rnd() * Math.PI * 2;
      return [s * Math.cos(a), u, s * Math.sin(a)];
    }
  };

  const nShell = Math.round(count * FORM.mix.shell);
  for (let k = 0; k < nShell; k++) {
    const [dx, dy, dz] = shellDir();
    const r = GLASS.r + Math.max(-1, Math.min(1, bell() * 0.17)) * GLASS.t;
    put(dx * r, GLASS.y + dy * r, dz * r, dx, dy, dz, size(0.78, 1.25), 0, 1, 1);
  }

  /* ---------------------------------------------------------
     2 · the base
     Each printed bar swept around the axis: a disc as wide as the bar
     is long, as thick as the stroke, with the round cap carried into a
     rounded rim. Filled rather than hollow - seen side on, a solid disc
     is densest through its middle, which is how a flat bar in the
     printed mark reads too. The normal is mostly radial, so the light
     wraps them like the little cylinders they are.
     --------------------------------------------------------- */
  const rungs = RUNGS.map((b) => {
    const half = Math.abs(b.x2 - b.x1) / 2;
    return { half, R: half + CAP, y: flip(b.y) };
  });
  const weight = rungs.reduce((s, b) => s + b.R * b.R, 0);
  const nBars = Math.round(count * FORM.mix.bars);
  let spent = 0;
  rungs.forEach((b, idx) => {
    /* by face area, and the last rung takes whatever rounding left */
    const n = idx === rungs.length - 1
      ? nBars - spent
      : Math.round(nBars * ((b.R * b.R) / weight));
    spent += n;
    for (let k = 0; k < n; k++) {
      const rho = b.R * Math.sqrt(rnd());
      /* inside the flat run the slab is the full stroke thick; out in
         the cap it thins to the arc of the round end */
      const over = rho - b.half;
      const halfT = over <= 0 ? CAP : Math.sqrt(Math.max(0, CAP * CAP - over * over));
      const a = rnd() * Math.PI * 2;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      const nl = Math.hypot(cx, 0.4, cz);
      put(
        rho * cx, b.y + (rnd() * 2 - 1) * halfT, rho * cz,
        cx / nl, 0.4 / nl, cz / nl,
        size(0.72, 1.15), 0, 1, 1.1,
      );
    }
  });

  /* ---------------------------------------------------------
     3 · the light inside
     The printed disc, off-centre in the glass, as a ball rather than a
     plate - a plate would vanish the moment the object turned. Density
     is biased a little inward so it reads as something luminous held in
     the middle of the glass rather than a second, smaller shell. Its
     offset is a good part of why the turn registers at all: the core
     swings around inside the envelope while the silhouette stays put.
     --------------------------------------------------------- */
  const nCore = Math.round(count * FORM.mix.core);
  for (let k = 0; k < nCore; k++) {
    const u = rnd() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const a = rnd() * Math.PI * 2;
    const dx = s * Math.cos(a);
    const dz = s * Math.sin(a);
    const r = CORE.r * Math.pow(rnd(), 0.4);
    put(
      CORE.x + dx * r, CORE.y + u * r, CORE.z + dz * r,
      dx, u, dz,
      size(0.85, 1.35), 0.85, 0.6, 0.9,
    );
  }

  /* ---------------------------------------------------------
     4 · the strays
     The few grains that have drifted off the surface and hang just
     outside it. Biased hard toward the surface, dimmer and smaller the
     further out they are, and held on a slacker spring so they are the
     last ones home. This is the whole difference between a mark cut out
     of the air and one suspended in it.
     --------------------------------------------------------- */
  const nStray = count - i;
  for (let k = 0; k < nStray; k++) {
    const [dx, dy, dz] = shellDir();
    const t = rnd() * rnd();
    const r = GLASS.r + GLASS.t * 0.5 + t * FORM.stray;
    put(
      dx * r, GLASS.y + dy * r, dz * r,
      dx, dy, dz,
      size(0.5, 0.95), 0, 0.6 * (1 - t * 0.7), 0.6,
    );
  }

  return { count, home, nrm, misc, stiff };
}
