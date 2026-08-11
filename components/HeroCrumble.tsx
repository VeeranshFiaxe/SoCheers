/* The hero's own last frame, rebuilt as a grid of grains so it can fall
   apart. It sits inside the hero pin, on top of the backdrop and the stage
   and underneath the definition, and until the crumble phase it is hidden -
   lib/motion.ts paints every grain to match the layers beneath it exactly,
   swaps them for this, then pours it off the bottom of the screen from the
   bottom row upwards. WHO WE ARE is scrolling up behind the pin the whole
   time (see .who's negative margin), so what the grains uncover is the next
   section rather than black.

   Shades are picked from the index, never Math.random(): this renders on the
   server too, and a random fill would hydrate to a different wall. They only
   show through where the paint has nothing to say. */
/* 48x27 rather than something finer: nearly every grain carries a slice of
   a very large photo, and past about this many the first paint of the grid
   is felt. It also keeps the grains reading as pieces of a wall. */
export default function HeroCrumble({
  cols = 48,
  rows = 27,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <div
      className="hero__crumble"
      data-crumble
      data-cols={cols}
      data-rows={rows}
      aria-hidden="true"
      style={{ ["--cols" as string]: cols, ["--rows" as string]: rows }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <i key={i} className={`s${(i * 7 + Math.floor(i / cols) * 3) % 4}`} />
      ))}
    </div>
  );
}
