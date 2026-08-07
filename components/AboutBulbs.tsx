/* Lightbulbs popping in and out of the airspace around the group - ideas
   arriving, one after another, never all at once.

   Positions are hand-placed into the gaps the artwork leaves: above the
   heads and out to either side, clear of the faces and of the bulb already
   drawn into the illustration. They are percentages of the visual box, so
   they hold their relationship to the figures at any width - and they ring
   the group wide, right out to its edges, rather than crowding the middle.

   The pop itself lives in lib/about-motion.ts - each bulb gets its own
   looping timeline on an index-derived offset so they never fall into step.
   `s` is the rendered width in px at the largest breakpoint. */
const BULBS = [
  { x: 1, y: 25, s: 28 },
  { x: 23, y: 1, s: 23 },
  { x: 46, y: 5, s: 32 },
  { x: 68, y: 0, s: 21 },
  { x: 88, y: 17, s: 29 },
  { x: 97, y: 45, s: 22 },
  { x: 1, y: 66, s: 25 },
  { x: 82, y: 68, s: 19 },
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
