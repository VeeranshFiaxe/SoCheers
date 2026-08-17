/* The hero's own last frame, rebuilt as a grid of grains so it can fall
   apart. It sits inside the hero pin, on top of the backdrop and the stage
   and underneath the definition, and until the crumble phase it is hidden -
   lib/motion.ts paints the frame beneath it onto an offscreen copy, swaps
   this in for the real layers, then pours it off the bottom of the screen
   from the bottom row upwards. WHO WE ARE is scrolling up behind the pin the
   whole time (see .who's negative margin), so what the grains uncover is the
   next section rather than black.

   One canvas, not cols*rows elements. The grid used to be real DOM - an <i>
   per grain, each carrying its own slice of the photo as a background and
   its own inset shadow, all of them tweened at once. At this count that is
   ~1300 style writes and a full-screen repaint every frame, which is what
   made the fall stutter. Drawing the same grid into a single canvas keeps
   the look identical and costs the compositor one layer. */
/* 48x27 rather than something finer: the grains still have to read as
   pieces of a wall rather than pixels, and the canvas draws one tile per
   grain per frame. */
export default function HeroCrumble({
  cols = 48,
  rows = 27,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <canvas
      className="hero__crumble"
      data-crumble
      data-cols={cols}
      data-rows={rows}
      aria-hidden="true"
    />
  );
}
