/* ============================================================
   COMING BACK TO THE WALL WHERE YOU LEFT IT.

   The browser's own Back already does this - it restores the scroll it
   remembers. The "All work" link on a case page does not: to the router
   it is a new visit to /work, and a new visit starts at the top, so a
   reader who opened a tile halfway down the wall was dropped back on
   the pinned stage and had to find their place again.

   So the wall notes where it was when a tile is opened, the case page's
   back link says it is a return, and the wall puts the reader back.

   In memory only, on purpose. The note is only true inside the one
   client-side session it was taken in: a full page load - a case reached
   from a shared link, or through the plain links in "More work" - starts
   empty, and "All work" from there is an ordinary visit to the top.
   ============================================================ */
let wallY: number | null = null;
let returning = false;

/* the wall, as a tile is opened */
export const leaveWall = () => {
  wallY = window.scrollY;
};

/* a case page's "All work" */
export const returnToWall = () => {
  returning = wallY !== null;
};

/* the wall, as it mounts: the place to go back to, once */
export const takeWallY = (): number | null => {
  if (!returning) return null;
  returning = false;
  return wallY;
};
