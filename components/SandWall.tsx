/* A slab of black sand laid over the top of a section. The grains are
   rendered here and driven by lib/motion.ts, which finds the host via
   [data-sand], paints the photo across the top band, and pours the whole
   wall off on scroll.

   Shades are picked from the index, never Math.random(): this renders on
   the server too, and a random fill would hydrate to a different wall.
   The variance is the whole point - a single flat black would read as an
   empty gap rather than as a surface with grain in it. */
export default function SandWall({
  img,
  cols = 56,
  rows = 30,
  band = 8,
}: {
  /* the picture the top rows carry, so the wall starts as the section
     above it rather than as a block of dark */
  img?: string;
  cols?: number;
  rows?: number;
  band?: number;
}) {
  return (
    <div
      className="sandwall"
      data-sand
      data-cols={cols}
      data-rows={rows}
      data-band={band}
      data-img={img}
      aria-hidden="true"
      style={{ ["--cols" as string]: cols, ["--rows" as string]: rows }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <i key={i} className={`s${(i * 7 + Math.floor(i / cols) * 3) % 4}`} />
      ))}
    </div>
  );
}
