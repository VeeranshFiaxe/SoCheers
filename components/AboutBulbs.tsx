/* Lightbulbs popping in and out of the airspace around the figure - ideas
   arriving, one after another, never all at once.

   Positions are percentages of the figure's box, so they hold their
   relationship to it at any width. They were placed against a full-length
   figure in a tall narrow column and have been re-placed against the
   torso crop that replaced it (see FLOOR_Y in scripts/build-about-man.mjs
   and FRAME_H in components/AboutMan.tsx): in that frame the monitor
   spans roughly x 36-64% and y 8-33%, and the shoulders reach out to
   x 22-78% below it. So the ring goes round the head and out along the
   tops of the shoulders, which is where the empty corners of the frame
   now are - the old set clustered at the vertical extremes of a portrait
   box that no longer exists and would have sat half of them over the
   jacket and half off the top.

   None are placed below about a quarter of the way down. Two things are
   under there and neither wants a bulb over it: the band of type crosses
   the chest, with its cap-tops at roughly 31% of this box (see --band-y
   in about.css), and below that the canvas is already fading out into the
   panel, where a bulb popping in over a dissolve reads as a hole in it.
   So the whole ring goes in the airspace around the monitor, which is
   where the composition leaves room for it anyway.

   The pop itself lives in lib/about-motion.ts - each bulb gets its own
   looping timeline on an index-derived offset so they never fall into step.
   `s` is the rendered width in px at the largest breakpoint. */
const BULBS = [
  { x: 13, y: 13, s: 28 },
  { x: 29, y: 1, s: 23 },
  { x: 48, y: -5, s: 32 },
  { x: 67, y: -1, s: 21 },
  { x: 86, y: 9, s: 29 },
  { x: 95, y: 25, s: 22 },
  { x: 3, y: 26, s: 25 },
  { x: 76, y: 19, s: 19 },
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
