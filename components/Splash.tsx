import type { CSSProperties } from "react";

/* The splash behind the WHO WE ARE cutout. It is a splatter, not a cloud:
   pigment thrown at the wall and caught mid-spread, so everything here
   radiates *out* from one impact point instead of billowing as a single
   soft mass. Three things carry that read:

     · mist   - six loose bodies of colour, each one its own element with
                its own size, path, tempo and morphing outline, wandering
                the whole box and passing through one another;
     · petals - elongated lobes fanned around the impact point and torn by a
                high-frequency displacement pass, which is what makes an
                edge read as flung paint instead of a blurred blob;
     · specks - the fine debris that always lands ahead of a splatter, out
                past the petal tips, sized down as they travel.

   Colour is the artwork's own palette, sampled off the WHO WE ARE visual -
   green, violet, gold, magenta, cyan - each hue driven from its own
   --sp-acc-* var and applied per petal, so no single colour reads as the
   background the others sit on. Both var() calls fall back to --accent, so
   a page that never opts into the palette still gets a coherent splash.

   The thrown paint below is static geometry: lib/motion.ts drags the
   *wrapper* toward the cursor and mists it in on scroll (see initSplash),
   so the displacement filters rasterise once and are then composited -
   which is the only reason a pass this heavy is affordable. The mist in
   front of it is the one part that animates continuously, which is why it
   is plain CSS transforms on composited layers and touches no filter. */

/* The petals, as [angle, distance from impact, length, width, colour var,
   opacity]. Written as data rather than markup so the fan stays readable
   and the spread is obvious at a glance - the angles are deliberately
   uneven, since an even fan reads as a flower. */
const PETALS: [number, number, number, number, string, number][] = [
  [-172, 150, 128, 62, "pink", 0.85],
  [-134, 128, 104, 70, "violet", 0.8],
  [-96, 118, 92, 58, "gold", 0.78],
  [-52, 138, 116, 64, "accent", 0.8],
  [-14, 158, 132, 58, "cyan", 0.75],
  [26, 130, 108, 68, "blue", 0.72],
  [68, 112, 88, 54, "gold", 0.7],
  [112, 134, 112, 60, "accent", 0.75],
  [148, 120, 96, 66, "violet", 0.7],
];

/* The debris. Same shape of tuple, minus the colour weight - these are
   small enough that only position, size and hue register. */
const SPECKS: [number, number, number, string, number][] = [
  [-166, 236, 13, "pink", 0.8],
  [-142, 268, 8, "violet", 0.7],
  [-118, 222, 10, "gold", 0.75],
  [-88, 262, 7, "accent", 0.7],
  [-46, 248, 12, "accent", 0.8],
  [-24, 288, 6, "cyan", 0.65],
  [8, 232, 9, "cyan", 0.7],
  [38, 268, 7, "blue", 0.6],
  [82, 214, 11, "gold", 0.7],
  [124, 244, 9, "accent", 0.7],
  [158, 226, 7, "violet", 0.65],
  [-104, 312, 5, "pink", 0.55],
  [-60, 320, 4, "gold", 0.5],
  [16, 306, 5, "accent", 0.55],
];

const CX = 310;
const CY = 210;

const hue = (k: string) =>
  k === "accent" ? "var(--accent)" : `var(--sp-acc-${k}, var(--accent))`;

/* The mist, as [colour var, size as a share of the box, start x, start y,
   drift keyframe, seconds per cycle, phase offset]. Each entry becomes one
   independent body - its own size, its own path, its own tempo - because
   the whole point is that no two of them are attached to each other. The
   start points are spread right across the box rather than ringed around
   the impact, so at any given moment the colours are somewhere different
   from each other instead of reading as one clustered mass. */
const MIST: [string, number, number, number, string, number, number][] = [
  ["violet", 0.3, 42, 44, "wander-a", 23, 0],
  ["accent", 0.33, 66, 54, "wander-b", 31, -8],
  ["gold", 0.25, 56, 28, "wander-c", 19, -14],
  ["cyan", 0.29, 48, 68, "wander-d", 37, -5],
  ["pink", 0.22, 74, 34, "wander-e", 27, -19],
  ["blue", 0.26, 36, 62, "wander-f", 41, -11],
];

export default function Splash() {
  return (
    <>
      {/* The mist is HTML, not SVG, and deliberately so. These bodies have
          to change *shape*, not just position - an <ellipse> can only ever
          be an ellipse, however you transform it, which is exactly why the
          previous pass read as the same silhouette sliding around. A box
          with an animated eight-value border-radius has a genuinely moving
          silhouette: each corner radius travels on its own, so the outline
          swells on one side while it pulls in on another.

          Blur, blend and drift all live in globals.css under .splash__mist;
          the only thing set here is the per-blob identity. */}
      <span className="splash__mist" aria-hidden="true">
        {MIST.map(([k, size, x, y, anim, dur, delay], i) => (
          <span
            key={i}
            className="splash__blob"
            style={{
              "--blob-c": hue(k),
              "--blob-size": `${size * 100}%`,
              "--blob-x": `${x}%`,
              "--blob-y": `${y}%`,
              animation: `${anim} ${dur}s ease-in-out ${delay}s infinite alternate`,
            } as CSSProperties}
          />
        ))}
      </span>

    <svg
      className="splash"
      viewBox="0 0 620 420"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Petals: coarse turbulence at high amplitude tears the lobe into
            fingers, then a small blur takes the hard edge off the tearing
            without putting the billow back. */}
        <filter id="sp-petal" x="-55%" y="-70%" width="210%" height="240%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves={3} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={58} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="3.4" />
        </filter>

        {/* The impact point itself - warped least, so the centre of the
            throw stays the densest, most saturated part of the mass. */}
        <filter id="sp-core" x="-45%" y="-60%" width="190%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.026" numOctaves={2} seed={23} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={30} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="6" />
        </filter>

        {/* Debris: barely softened. Specks want to stay legible as specks. */}
        <filter id="sp-speck" x="-70%" y="-70%" width="240%" height="240%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={37} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.4" />
        </filter>
      </defs>

      {/* 1 · the fan of petals thrown clear of the impact */}
      <g filter="url(#sp-petal)">
        {PETALS.map(([a, dist, len, wid, k, o], i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <ellipse
              key={i}
              cx={CX + Math.cos(rad) * dist}
              cy={CY + Math.sin(rad) * dist * 0.62}
              rx={len}
              ry={wid}
              transform={`rotate(${a * 0.62} ${CX + Math.cos(rad) * dist} ${CY + Math.sin(rad) * dist * 0.62})`}
              fill={hue(k)}
              opacity={o}
            />
          );
        })}
      </g>

      {/* 2 · the impact - where the colours actually overlap and go dense */}
      <g filter="url(#sp-core)">
        <ellipse cx={CX} cy={CY} rx="126" ry="82" fill={hue("accent")} opacity="0.7" />
        <ellipse cx={CX - 34} cy={CY - 12} rx="82" ry="58" fill={hue("violet")} opacity="0.6" />
        <ellipse cx={CX + 40} cy={CY + 10} rx="76" ry="52" fill={hue("gold")} opacity="0.55" />
        <ellipse cx={CX + 6} cy={CY - 4} rx="52" ry="34" fill="var(--sp-pale, #fff)" opacity="0.28" />
      </g>

      {/* 3 · debris, out past the petal tips */}
      <g filter="url(#sp-speck)">
        {SPECKS.map(([a, dist, r, k, o], i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <ellipse
              key={i}
              cx={CX + Math.cos(rad) * dist}
              cy={CY + Math.sin(rad) * dist * 0.66}
              rx={r}
              ry={r * 0.66}
              transform={`rotate(${a * 0.5} ${CX + Math.cos(rad) * dist} ${CY + Math.sin(rad) * dist * 0.66})`}
              fill={hue(k)}
              opacity={o}
            />
          );
        })}
      </g>
    </svg>
    </>
  );
}
