
/* Drifting colour thrown off the illustration. Every hue is sampled from
   the artwork itself - electric blue, magenta, teal, violet, amber - so the
   field reads as light coming off the portrait rather than decoration
   dropped on top of it.

   `d` is the parallax depth: how hard each one answers the cursor. The big
   soft ones sit deep and barely move, the small hard ones ride up front and
   travel furthest, which is what sells the space as having depth at all.
   Fixed values, never random - this renders on the server too. */
const ORBS = [
  { x: 11, y: 20, s: 190, c: "#291df1", d: 0.55, b: 62, o: 0.5 },
  { x: 51, y: 12, s: 155, c: "#431dcd", d: 0.45, b: 58, o: 0.42 },
  { x: 79, y: 34, s: 135, c: "#01ddc0", d: 0.6, b: 52, o: 0.26 },
  { x: 36, y: 71, s: 125, c: "#f91e7e", d: 0.9, b: 46, o: 0.4 },
  { x: 7, y: 73, s: 95, c: "#01ddc0", d: 1.15, b: 36, o: 0.34 },
  { x: 67, y: 82, s: 115, c: "#fd4faa", d: 0.8, b: 42, o: 0.28 },
  { x: 27, y: 43, s: 72, c: "#fea320", d: 1.35, b: 28, o: 0.24 },
  // the crisp ones - sparks rather than glow
  { x: 21, y: 58, s: 7, c: "#01ddc0", d: 2.1, b: 0, o: 0.85, dot: true },
  { x: 44, y: 30, s: 5, c: "#f91e7e", d: 2.6, b: 0, o: 0.8, dot: true },
  { x: 60, y: 63, s: 6, c: "#fea320", d: 2.3, b: 0, o: 0.7, dot: true },
  { x: 15, y: 38, s: 4, c: "#fd4faa", d: 3, b: 0, o: 0.75, dot: true },
];

function Orbs() {
  return (
    <span className="abh__orbs" aria-hidden="true">
      {ORBS.map((o) => (
        <i
          key={`${o.x}-${o.y}`}
          className={o.dot ? "abh__orb abh__orb--dot" : "abh__orb"}
          data-hero-depth={o.d}
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: `${o.s}px`,
            "--orb-c": o.c,
            "--orb-b": `${o.b}px`,
            "--orb-o": o.o,
          } as React.CSSProperties}
        >
          {/* inner element takes the idle drift so the outer one is free to
              answer the cursor - two transforms, two owners, no fight */}
          <b data-hero-drift />
        </i>
      ))}
    </span>
  );
}

export default function AboutHero() {
  return (
    <section className="ab-open" data-sec="0">
      <div className="ab-open__media" data-ab-parallax>
        {/* nested so the scroll parallax (outer) and the cursor depth
            (inner) never write to the same transform */}
        <div className="ab-open__mediaIn" data-hero-depth="0.32">
          <video
            src="https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>

      {/* bottom fade, so section 2 picks up on flat --bg with no seam */}
      <span className="ab-open__veil" aria-hidden="true" />

      <Orbs />

      <div className="ab-open__cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="ab-open__cue-line" />
      </div>
    </section>
  );
}
