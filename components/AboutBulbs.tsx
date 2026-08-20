/* Lightbulbs popping in and out of the airspace around the figure - ideas
   arriving, one after another, never all at once.

   Positions are percentages of the figure's box, so they hold their
   relationship to it at any width. They have moved twice, and both times
   for the same reason: they go wherever the composition is not.

   They used to ring the head, which was the empty part of a tall portrait
   box. It is not empty any more - the claim now sits at head height and
   its caps run from a little above the top of the frame down to about 45%
   of it (see --band-y and --band-fs in about.css), and a bulb popping on
   over a letter reads as a rendering fault rather than as an idea. So the
   ring has come down onto the shoulders and the outer air beside them,
   between the claim's baseline and the point the canvas begins fading out
   at 70%. Everything here sits in that band.

   There are five rather than eight. The panel carries a field of type, a
   burst, a claim, a figure and two blocks of small copy already; eight
   more things blinking on and off over the top of that is not a layer, it
   is noise.

   The pop itself lives in lib/about-motion.ts - each bulb gets its own
   looping timeline on an index-derived offset so they never fall into step.
   `s` is the rendered width in px at the largest breakpoint. */
const BULBS = [
  { x: 3, y: 51, s: 26 },
  { x: 18, y: 63, s: 21 },
  { x: 72, y: 66, s: 19 },
  { x: 84, y: 54, s: 28 },
  { x: 96, y: 62, s: 22 },
];

function Bulb() {
  return (
    <svg viewBox="0 0 24 30" fill="none" aria-hidden="true" focusable="false">
      {/* glass */}
      <path
        d="M12 1.6a7.6 7.6 0 0 0-4.5 13.7c.9.7 1.4 1.6 1.5 2.6h6c.1-1 .6-1.9 1.5-2.6A7.6 7.6 0 0 0 12 1.6Z"
        fill="color-mix(in srgb, var(--accent) 22%, transparent)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* filament */}
      <path d="M10 11.4c0-1.2.9-2 2-2s2 .8 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* screw base */}
      <path d="M9.2 20.6h5.6M10 23.4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* the little ticks that say "it just went on" */}
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
        <path d="M12 0v-0.1M2.4 5.6l-.9-.5M21.6 5.6l.9-.5M1.4 13.4H.4M22.6 13.4h1" />
      </g>
    </svg>
  );
}

/* There is one figure on the panel now rather than two flanking the copy,
   so the whole ring goes on it - the `pick` slice that used to hand four
   positions to each of the two boxes has nothing left to divide. */
export default function AboutBulbs() {
  return (
    <span className="bulbs" aria-hidden="true">
      {BULBS.map((b) => (
        <i
          className="bulb"
          key={`${b.x}-${b.y}`}
          data-bulb
          /* size goes through a variable, not `width` directly: GSAP owns the
             transform on these, so a CSS scale() at a breakpoint would be
             overwritten the moment a timeline runs */
          style={{ left: `${b.x}%`, top: `${b.y}%`, "--bulb-s": `${b.s}px` } as React.CSSProperties}
        >
          <Bulb />
        </i>
      ))}
    </span>
  );
}
