/* The green splash that sits behind the WHO WE ARE cutout.

   Drawn, not shipped as an asset: the mass is a handful of overlapping
   ellipses, warped by a single broad turbulence pass so the silhouette
   billows rather than cracks, then a light Gaussian blur so every edge
   melts into the next one - the read is poured ink or liquid paint, not
   dry chalk. There is no fine-grain second pass and no grit texture
   anymore; both fought the fluid read by re-introducing hard, dry edges.

   Three stacked layers do the colour: a soft dark halo, the accent green
   body, and a pale hot core, each blurred a little less than the last so
   the centre stays the crispest, brightest point - same as how a real
   pour of pigment thins and softens toward its edges.

   Everything here is static. lib/motion.ts drags the *wrapper* toward the
   cursor, so the filters rasterise once instead of every frame. */
export default function Splash() {
  return (
    <svg
      className="splash"
      viewBox="0 0 620 420"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* the soft dark halo the pour trails behind itself */}
        <filter id="sp-halo" x="-45%" y="-60%" width="190%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.016" numOctaves={3} seed={7} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={100} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="9" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={31} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0.7 0 0 0 0.05" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>

        {/* the body: one broad billow, edges melted rather than torn */}
        <filter id="sp-body" x="-36%" y="-50%" width="172%" height="200%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves={3} seed={3} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={72} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="5" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={5} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0.6 0 0 0 0.28" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>

        {/* the core: barely warped, so the middle stays the brightest point */}
        <filter id="sp-core" x="-32%" y="-48%" width="164%" height="196%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.026" numOctaves={2} seed={13} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={48} xChannelSelector="R" yChannelSelector="G" result="d1" />
          <feGaussianBlur in="d1" stdDeviation="2.5" result="b1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={41} result="g" />
          <feColorMatrix in="g" type="matrix" result="ga"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0.45 0 0 0 0.55" />
          <feComposite in="b1" in2="ga" operator="in" />
        </filter>

        {/* the two tendrils trailing clear of the mass, softened to match */}
        <filter id="sp-tendril" x="-70%" y="-70%" width="240%" height="240%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={29} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={26} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2.2" />
        </filter>
      </defs>

      {/* 1 · the soft dark halo */}
      <g filter="url(#sp-halo)" opacity="0.85">
        <ellipse cx="252" cy="210" rx="224" ry="92" transform="rotate(-11 252 210)" fill="var(--sp-deep)" />
        <ellipse cx="404" cy="202" rx="196" ry="80" transform="rotate(9 404 202)" fill="var(--sp-deep)" />
        <ellipse cx="316" cy="268" rx="258" ry="60" transform="rotate(-4 316 268)" fill="var(--sp-deep)" />
        <ellipse cx="196" cy="176" rx="104" ry="78" transform="rotate(-24 196 176)" fill="var(--sp-dark)" />
        <ellipse cx="438" cy="174" rx="112" ry="70" transform="rotate(18 438 174)" fill="var(--sp-dark)" />
      </g>

      {/* 2 · the green body of the pour */}
      <g filter="url(#sp-body)">
        <ellipse cx="262" cy="206" rx="188" ry="74" transform="rotate(-9 262 206)" fill="var(--sp-mid)" />
        <ellipse cx="398" cy="202" rx="164" ry="64" transform="rotate(8 398 202)" fill="var(--sp-mid)" />
        <ellipse cx="214" cy="180" rx="88" ry="62" transform="rotate(-22 214 180)" fill="var(--sp-bright)" />
        <ellipse cx="424" cy="180" rx="94" ry="56" transform="rotate(16 424 180)" fill="var(--sp-bright)" />
        <ellipse cx="318" cy="270" rx="232" ry="48" transform="rotate(-5 318 270)" fill="var(--sp-deep)" />
      </g>

      {/* 3 · the hot centre */}
      <g filter="url(#sp-core)">
        <ellipse cx="300" cy="208" rx="138" ry="46" transform="rotate(-5 300 208)" fill="var(--sp-bright)" />
        <ellipse cx="322" cy="202" rx="80" ry="28" transform="rotate(-2 322 202)" fill="var(--sp-pale)" />
      </g>

      {/* 4 · two tendrils, still liquid, off the top right */}
      <g filter="url(#sp-tendril)">
        <ellipse cx="494" cy="104" rx="26" ry="7" transform="rotate(-36 494 104)" fill="var(--sp-pale)" opacity="0.7" />
        <ellipse cx="524" cy="90" rx="30" ry="7" transform="rotate(-28 524 90)" fill="var(--sp-bright)" opacity="0.6" />
      </g>
    </svg>
  );
}
