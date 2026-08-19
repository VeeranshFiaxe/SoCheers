/* The green burst behind the About artwork.

   Same family as components/Splash.tsx on the home page, deliberately not
   the same gesture. That one is a horizontal pour: a brush dragged sideways,
   edges melted smooth with a Gaussian blur. This one detonates - a rounder
   core with rays and spray thrown outward from the middle - because it sits
   behind a picture of people having ideas, and the artwork it backs is a
   hard-edged engraving rather than something painterly. So the alpha noise
   here runs at a higher frequency and there is far less blur: it reads as
   sprayed pigment, which sits with the linework instead of fighting it.

   Static, like the home-page splash. lib/motion.ts drags the wrapper toward
   the cursor and mists it in on scroll; the filters rasterise once. */

const C = { x: 320, y: 262 };

/* Rays thrown off the centre. Fixed, never random - this renders on the
   server too, and a random layout would not survive hydration. Each is an
   ellipse laid along +x at distance `d`, then the whole group is rotated to
   its angle, so `l`/`w` stay readable as length and thickness. */
const RAYS = [
  { a: 8, d: 214, l: 96, w: 13, f: "var(--sp-mid)" },
  { a: 34, d: 186, l: 70, w: 10, f: "var(--sp-dark)" },
  { a: 62, d: 168, l: 54, w: 9, f: "var(--sp-mid)" },
  { a: 104, d: 196, l: 78, w: 11, f: "var(--sp-mid)" },
  { a: 138, d: 176, l: 62, w: 9, f: "var(--sp-dark)" },
  { a: 168, d: 220, l: 92, w: 12, f: "var(--sp-mid)" },
  { a: 200, d: 184, l: 68, w: 10, f: "var(--sp-mid)" },
  { a: 232, d: 164, l: 50, w: 8, f: "var(--sp-dark)" },
  { a: 262, d: 150, l: 44, w: 8, f: "var(--sp-mid)" },
  { a: 296, d: 178, l: 64, w: 10, f: "var(--sp-bright)" },
  { a: 326, d: 200, l: 82, w: 11, f: "var(--sp-bright)" },
  { a: 350, d: 158, l: 48, w: 8, f: "var(--sp-dark)" },
];

/* grit thrown clear of the mass - further out and finer than the rays */
const SPECKS = [
  { a: 18, d: 268, r: 5.5, f: "var(--sp-mid)", o: 0.7 },
  { a: 52, d: 240, r: 3.5, f: "var(--sp-bright)", o: 0.6 },
  { a: 88, d: 258, r: 4.5, f: "var(--sp-dark)", o: 0.65 },
  { a: 121, d: 236, r: 3, f: "var(--sp-mid)", o: 0.55 },
  { a: 155, d: 272, r: 6, f: "var(--sp-deep)", o: 0.7 },
  { a: 186, d: 244, r: 3.5, f: "var(--sp-mid)", o: 0.6 },
  { a: 214, d: 266, r: 5, f: "var(--sp-bright)", o: 0.5 },
  { a: 248, d: 232, r: 3, f: "var(--sp-dark)", o: 0.6 },
  { a: 281, d: 254, r: 4.5, f: "var(--sp-mid)", o: 0.55 },
  { a: 312, d: 276, r: 3.5, f: "var(--sp-pale)", o: 0.6 },
  { a: 338, d: 238, r: 5, f: "var(--sp-mid)", o: 0.6 },
  { a: 2, d: 250, r: 3, f: "var(--sp-pale)", o: 0.5 },
];

/* `uid` namespaces the filter and gradient ids. There are two of these
   on the page now - one behind each figure either side of the intro copy -
   and an SVG id is document-global: two copies sharing one set would be
   duplicate ids in the document, and every filter reference in both would
   resolve to whichever copy the parser saw first. */
export default function AboutSplash({ uid = "ab" }: { uid?: string }) {
  return (
    <svg
      className="splash splash--burst"
      viewBox="0 0 640 540"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`${uid}-aura`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--sp-bright)" stopOpacity="0.5" />
          <stop offset="45%" stopColor="var(--sp-dark)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--sp-deep)" stopOpacity="0" />
        </radialGradient>

        {/* the outer mass: torn wide, then heavily eaten by grain */}
        <filter id={`${uid}-halo`} x="-45%" y="-50%" width="190%" height="200%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves={3} seed={61} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={104} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="4" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.19" numOctaves={4} seed={17} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    1.15 0 0 0 -0.14" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>

        {/* the body: sprayed rather than poured, so barely any blur */}
        <filter id={`${uid}-body`} x="-38%" y="-42%" width="176%" height="184%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.017" numOctaves={3} seed={83} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={76} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="1.6" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves={4} seed={29} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0.95 0 0 0 0.14" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>

        {/* rays and spray: shredded lengthwise so they taper off */}
        <filter id={`${uid}-ray`} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves={3} seed={47} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={40} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.26" numOctaves={3} seed={7} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    1 0 0 0 0.02" />
          <feComposite in="d1" in2="ga" operator="in" />
        </filter>

        {/* the centre: hot, and the only part left nearly intact */}
        <filter id={`${uid}-core`} x="-40%" y="-45%" width="180%" height="190%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.017 0.023" numOctaves={2} seed={97} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={50} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="1.2" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves={3} seed={53} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0.5 0 0 0 0.56" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>
      </defs>

      {/* 0 · unfiltered aura, so the burst has something to sit in */}
      <ellipse cx={C.x} cy={C.y} rx="300" ry="248" fill={`url(#${uid}-aura)`} />

      {/* 1 · rays, under the mass so they read as thrown from behind it */}
      <g filter={`url(#${uid}-ray)`} opacity="0.8">
        {RAYS.map((r) => (
          <g key={`${r.a}-${r.d}`} transform={`rotate(${r.a} ${C.x} ${C.y})`}>
            <ellipse cx={C.x + r.d} cy={C.y} rx={r.l} ry={r.w} fill={r.f} />
          </g>
        ))}
      </g>

      {/* 2 · the dark outer mass */}
      <g filter={`url(#${uid}-halo)`} opacity="0.88">
        <ellipse cx="286" cy="250" rx="196" ry="168" transform="rotate(-14 286 250)" fill="var(--sp-deep)" />
        <ellipse cx="368" cy="268" rx="180" ry="152" transform="rotate(12 368 268)" fill="var(--sp-deep)" />
        <ellipse cx="322" cy="206" rx="164" ry="118" transform="rotate(-4 322 206)" fill="var(--sp-dark)" />
      </g>

      {/* 3 · the green body */}
      <g filter={`url(#${uid}-body)`}>
        <ellipse cx="300" cy="252" rx="162" ry="132" transform="rotate(-12 300 252)" fill="var(--sp-mid)" />
        <ellipse cx="356" cy="262" rx="146" ry="120" transform="rotate(10 356 262)" fill="var(--sp-mid)" />
        <ellipse cx="326" cy="222" rx="128" ry="88" transform="rotate(-5 326 222)" fill="var(--sp-bright)" />
        {/* weight settling at the bottom, where the desk is */}
        <ellipse cx="322" cy="330" rx="188" ry="60" transform="rotate(-3 322 330)" fill="var(--sp-deep)" />
      </g>

      {/* 4 · spray thrown clear */}
      <g filter={`url(#${uid}-ray)`}>
        {SPECKS.map((s) => (
          <g key={`${s.a}-${s.d}`} transform={`rotate(${s.a} ${C.x} ${C.y})`}>
            <circle cx={C.x + s.d} cy={C.y} r={s.r} fill={s.f} opacity={s.o} />
          </g>
        ))}
      </g>

      {/* 5 · the hot centre */}
      <g filter={`url(#${uid}-core)`}>
        <ellipse cx="318" cy="240" rx="112" ry="76" transform="rotate(-6 318 240)" fill="var(--sp-bright)" />
        <ellipse cx="326" cy="230" rx="62" ry="40" transform="rotate(-3 326 230)" fill="var(--sp-pale)" />
      </g>
    </svg>
  );
}
