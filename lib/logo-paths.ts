/* ============================================================
   The SoCheers mark, as geometry.

   The logo is already a light bulb - a monoline ring with the base
   stacked underneath it and a coloured disc sitting off-centre inside.
   The overture leans on that: the same paths are drawn twice, once flat
   and cream on the loading screen (components/SoCheersLockup.tsx) and
   once as a physical object lit from the inside (the Lamp in
   components/Overture.tsx).

   The mark stands the right way up and stays there. Its base is at the
   bottom, so there is no honest way to hang it from a flex - a pendant
   would be the logo upside down, which is worse than no pendant. The
   rope is a separate ceiling pull beside it (see ROPE below), which is
   how a pull cord is usually fitted anyway.

   Everything is expressed in one 400-wide coordinate space, proportioned
   off the printed lockup. The CSS scales that space with --lamp-w and
   nothing here ever has to know the screen size.
   ============================================================ */

/* ---- the bulb glyph ---- */
export const MARK = {
  cx: 200,
  cy: 176,
  /* the ring is drawn as a stroked arc, so this is its centre line */
  r: 88,
  stroke: 16.5,
  /* the opening at the bottom of the ring, either side of dead centre */
  gap: 32.5,
  /* inside face of the ring - the glass */
  glass: 79.75,
  /* the off-centre disc. In print it overhangs the ring; here it is kept
     inside the glass, because a bulb whose light spills past its own
     envelope stops reading as a bulb. */
  blob: { cx: 188, cy: 164, r: 70 },
};

/* The ring at an arbitrary radius, so the same arc can be re-run a few
   units in or out to build the highlight and the shadow that turn a flat
   stroke into a tube. */
export function ringArc(r: number) {
  const a = (MARK.gap * Math.PI) / 180;
  const dx = r * Math.sin(a);
  const y = (MARK.cy + r * Math.cos(a)).toFixed(2);
  return `M${(MARK.cx - dx).toFixed(2)} ${y}A${r} ${r} 0 1 1 ${(MARK.cx + dx).toFixed(2)} ${y}`;
}

export const RING = ringArc(MARK.r);

/* The three bars of the base, round-capped and stepping in, at the
   lengths and spacing they have in the printed mark. Same colour as the
   ring - they are one drawn object, not a fitting bolted to a bulb. */
export const BARS = [
  "M163.5 275H236.5",
  "M169.6 298H230.4",
  "M175.1 320H224.9",
];
export const BAR_STROKE = 16.5;

/* ---- the wordmark ----
   Monoline geometric caps on a 42pt body (368 to 410) with round
   terminals, set nearly touching the way the printed lockup is - the
   letters are wide and the spacing is tight, and getting that the wrong
   way round is what makes a geometric sans read as a default font.

   The S and the C are built from ellipses rather than circles: a round
   S drawn from two true circles can only ever be half as wide as it is
   tall, which is much narrower than this face. The O is a plain circle
   so the small disc inside it can sit off its own centre. */
export const WORD_STROKE = 7.4;
export const WORD_O = { cx: 95, cy: 389, r: 21 };
export const WORD_BLOB = { cx: 89.5, cy: 383.5, r: 13.5 };

export const WORD = [
  /* S */ "M55.12 368.63A13.5 10.5 0 1 0 50.5 389A13.5 10.5 0 1 1 45.88 409.37",
  /* C */ "M160.14 374.15A20 21 0 1 0 160.14 403.85",
  /* H */ "M176 368V410M210 368V410M176 389H210",
  /* E */ "M220 368V410M220 368H248M220 389H243M220 410H248",
  /* E */ "M258 368V410M258 368H286M258 389H281M258 410H286",
  /* R */ "M296 410V368H307A19 11.5 0 0 1 307 391H296M307 391L324 410",
  /* S */ "M354.12 368.63A13.5 10.5 0 1 0 349.5 389A13.5 10.5 0 1 1 344.88 409.37",
];

/* The lamp's box. Deliberately not tight: the y range is centred on the
   glass (176), so an element carrying this viewBox has the centre of the
   bulb at its own centre - which is the whole reason the fixture can be
   positioned by nothing more than "put it in the middle of the screen". */
export const LAMP_VIEWBOX = "0 -62 400 476";
export const LAMP_RATIO = 476 / 400;

/* and the flat lockup's box, which *is* tight */
export const LOCKUP_VIEWBOX = "28 70 344 348";

/* ---- the pull rope ----
   A ceiling cord beside the mark rather than anything attached to it.
   It is measured in screen pixels, not in the mark's units: the rope's
   SVG takes a viewBox matching its own client box (see initOverture), so
   one unit here is one pixel and the drag distances below mean the same
   thing on every screen.

   `len` is how far the cord falls before the knob, which is the element's
   height less the room the knob and its tuft need. */
export const ROPE = {
  knob: 52,
  /* how far it can be dragged, and how far is far enough to click */
  maxY: 150,
  maxX: 70,
  trigger: 46,
};

/* Straight down, with the bottom of the cord swinging out if you pull it
   sideways and the top staying put. Pulling it takes the bow out, which
   is most of why the interaction reads as rope rather than as a slider. */
export function ropePath(px: number, py: number, len: number, w: number) {
  const ax = w / 2;
  const ex = ax + px;
  const ey = len + py;
  return (
    `M${ax.toFixed(1)} 0C${(ax + px * 0.06).toFixed(1)} ${(ey * 0.38).toFixed(1)} ` +
    `${(ax + px * 0.62).toFixed(1)} ${(ey * 0.74).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
  );
}
