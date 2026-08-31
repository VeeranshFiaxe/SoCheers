/* ============================================================
   THE SYMBOL FIELD

   The photograph in the About page's space section, retyped as a grid of
   characters behind its own frame, with the cursor pushing a wave through
   it. Reference: revelatio.studio's hero.

   Mounted by components/StageAscii.tsx; sits between the blurred colour
   spill and the frame itself (see .stage__ascii in app/about/about.css).

   ---- what is actually being drawn ----

   Not glyphs in an ink colour. The characters are a *stencil*: the
   photograph is drawn at full colour and then everything outside the
   glyph shapes is erased, so each character is cut out of the picture and
   carries whatever colour the picture has at that point. That is the
   difference between a texture that happens to have come from a photo and
   one you can still read the photo through - which is the whole point of
   the effect, and what the first pass at this got wrong by drawing the
   grid in a single dark ink.

   It costs nothing extra. `destination-in` against a mask canvas is two
   blits over a region, so the colour is exact and the per-frame work does
   not depend on how many characters are in the region at all.

   ---- the performance shape of it ----

   This has to run on a weak machine, and a symbol grid is easy to get
   wrong: at this cell size a wide screen is around nineteen thousand
   cells, and typing all of them every frame is not a thing any machine
   does at 60fps. Four things keep it cheap:

   1. Glyphs are drawn once, at startup, into a sprite sheet, and only
      ever into the mask - never into the visible canvas. A cell is one
      drawImage of one tile. No font work at render time, no text metrics.
   2. Neither canvas is ever cleared whole. Cells are redrawn only when
      their character or their shade actually changes, and the picture is
      recomposited only over the rectangle those cells fall in - so a
      cursor moving through a still image costs the few hundred cells
      under it and one small blit.
   3. A change of picture is a wipe, not a cut: cells are retyped in a
      ragged diagonal order over ~900ms. Spreading a full repaint across
      fifty frames is the obvious half of that; the half that matters is
      that a diagonal order means each frame's new cells fall in a narrow
      band, so the recomposite stays a band too. A random dissolve would
      look similar and force a full-canvas blit every frame of it.
   4. The loop is not always running. It starts when there is something to
      do and stops when the last cell has settled. Off screen it never
      starts, so the steady state - which is what the machine is doing
      almost all of the time - is nothing.
   ============================================================ */
import { acquirePointerField, isCoarsePointer } from "./pointer-field";

/* Ordered by how much of the cell each one fills, lightest first. The
   glyph is a stencil now, so this ramp is doing exactly what a pixel's
   value does: how much of the photograph gets through here. Mostly
   punctuation and figures rather than letters - a stray "a" or "e" in the
   grid reads as a word starting and pulls the eye looking for the rest. */
const RAMP = " .:·-=+co*%#8@M";

/* And what the wave types instead. Not on the ramp: these are what the
   crest swaps in, which is what makes the cursor read as changing the
   characters rather than just brightening them. Strokes and rules, so a
   disturbed patch looks like interference in the grid. */
const WAVE = "/\\|—~×+≡";

/* The side of one cell, and the size of one character with it - the
   glyph is drawn at 92% of this (see buildSheet).

   It was 10, and at 10 the field was a halftone: the characters were the
   size of a dot, so what the eye got was a grid of varying density and
   the fact that the density was being made out of punctuation was
   something you had to lean in to notice. The point of a symbol field is
   that you can see the symbols.

   16 was the other end of that argument and it overshot; 13 was still
   more than the picture wanted to give up. 11.5 is where it settled: the
   glyph is drawn at about 10.5px, which is enough that a "%" reads as a
   "%" rather than as a dark speck, and the grid stays fine enough to hold
   a face together behind it.

   A fraction is fine here and is not rounded away by accident. This is a
   CSS-pixel figure and the only places it is turned into a whole number
   are the two that have to be whole: the device-pixel side of a cell in
   buildSheet, and the column and row counts in layout. Nothing else
   divides by it. */
const CELL = 11.5;        // css px, the side of one cell
/* Up with the cell, and by the same ratio: this is a distance in pixels
   but what it has to hold steady is a count of characters. Twenty cells
   of reach was what the field was tuned at, and 20 x 11.5 is what keeps
   it there - left at 200 the wave would disturb seventeen and read as a
   smaller patch than the one the effect was built around. */
const RADIUS = 230;       // css px, how far the cursor reaches
/* And the rings get longer for the same reason. This is radians per pixel,
   so leaving it alone would have kept the rings the same width in pixels
   while the things resolving them got fewer - and a ring drawn with too
   few cells stair-steps instead of curving. At .043 a ring is ~146px,
   which is the same twelve-and-a-half cells across it had at the old cell
   size. */
const WAVELEN = 0.043;    // radians per px - the spacing of the rings
/* How fast the rings travel outward, and there are two of them now: the
   speed the effect runs at while the cursor is being moved, and the one
   it settles to when it is put down and left.

   Moving, nothing has changed - .0055 is what the wave was always tuned
   at and the whole point of a cursor effect is that it answers the cursor
   at the cursor's own pace. Held still, that same rate is a machine
   running flat out with nobody asking it to: the rings pour out of a
   stationary point several times a second and the patch reads as busy.
   At .0021 the same rings take about two and a half times as long to
   cross the reach, which is slow enough to watch and not so slow that it
   looks stopped.

   The two are blended by how fast the cursor is actually travelling (see
   `mo` in the loop), so there is no threshold to cross and no moment
   where the effect changes gear - it winds up as you move and unwinds as
   you stop. */
const SPEED = 0.0055;     // radians per ms, moving
const SPEED_IDLE = 0.0021;// radians per ms, at rest
/* And it softens as it slows. This scales the whole amplitude, so it
   pulls back both halves of the effect at once: the shade is pushed less
   far along the ramp, and fewer cells reach the threshold where they are
   retyped out of the wave alphabet. A held cursor is a quiet disturbance
   in the grid rather than a hole punched in it. */
const GAIN_IDLE = 0.52;
/* How fast a cell that has been retyped churns through the wave alphabet,
   again as a moving and a resting rate. This is the flicker in the middle
   of the patch and it is the single busiest thing on the section when the
   cursor is parked, so it comes down hardest. */
const CHURN = 0.012;      // wave-alphabet steps per ms, moving
const CHURN_IDLE = 0.0034;// ditto, at rest
/* The travelling speed at which the effect is considered fully "moving",
   in css px per ms. An unhurried drag across the frame is around half of
   this, so ordinary movement sits near the top of the range and only a
   cursor genuinely at rest gets the slow reading. */
const MOVE_FULL = 0.55;
const EASE = 0.14;        // pointer lerp; the wave centre trails the mouse
const WIPE_MS = 900;
/* The grade, and the brightness in it is not a taste call.

   The page under this is cream. A photograph cut out of its own light
   parts is white type on off-white paper, which is nothing at all - so
   every shot with a bright wall, a window or a whiteboard in it lost that
   whole region, and the ones that were mostly bright lost almost
   everything. Pulling the whole picture down by a third puts its lightest
   parts clearly under the paper's tone, so white reads as pale rather than
   as absent, and the darks - which had no trouble to begin with - only
   get more of what they had.

   The saturation goes up to pay for it: darkening a photograph drains the
   colour out of it, and the colour is the reason the characters are cut
   from the picture instead of typed in ink.

   Down again, and the contrast up with it. .66 was still leaving the top
   third of a bright shot within a few levels of the paper it is printed
   on - visible if you went looking for it, which is not the same as
   visible. At .58 the picture's own whites land clearly below the cream,
   so a lit wall reads as a lit wall rather than as a gap in the grid, and
   the extra contrast keeps the darks from closing up into one mass now
   that everything above them has come down to meet them. */
const GRADE = "brightness(.58) saturate(1.62) contrast(1.14)";

/* No cell is ever blank, and the floor is well up off the blank now.

   The ramp starts at a space, which is right for an ASCII rendering on
   its own terms and wrong here: a blank cell is a hole in the grid, and a
   bright region made of holes is the same invisibility the brightness is
   fixing. But a floor of 1 is a full stop - a character that covers a few
   percent of its cell - so the brightest regions were technically typing
   something and letting almost none of the photograph through. That is
   the whole complaint about the whites: they were not eaten by the mask,
   they were eaten by the stencil being nearly closed there.

   At 4 the lightest cell types a hyphen, which is a real aperture. The
   ramp gives up three of its fourteen steps to buy it and loses nothing
   that was doing any work: those steps were all inside the range that was
   invisible anyway. */
const GMIN = 4;

export type AsciiField = {
  /* Re-measure the type the field has to stay off. Call it after the type
     has changed and before setImage - the caption under the frame is a
     different length for every photograph, and a clearing cut to the last
     one leaves the longer ones running out of their hole and into the
     grid. Deliberately not automatic: a MutationObserver here would fire
     on the counter ticking over too, and the cost is a full re-stencil. */
  remeasure: () => void;
  /* Point it at a new photograph. Safe to call before the previous one has
     finished wiping in - the run in flight is simply retargeted. */
  setImage: (src: string) => void;
  /* Off screen the loop is not merely paused: it never starts, and the
     pointer is dropped so the field settles flat behind the frame. */
  setActive: (on: boolean) => void;
  /* Static mode, for prefers-reduced-motion: the picture still resolves
     into characters, it simply arrives at once and the cursor does
     nothing to it. */
  setStill: (on: boolean) => void;
  destroy: () => void;
};

/* How far the clearing extends past the text's own box, and how far it
   takes to get there, both in css px. The pad is what stops a descender
   or a wide letter-spaced caption from touching live grid; the feather is
   what stops the clearing from being a rectangle. Without the second one
   this reads as a white box lying on the effect, which is worse than the
   problem it fixes. */
const KEEP_PAD = 14;
const KEEP_FEATHER = 40;

export function createAsciiField(
  canvas: HTMLCanvasElement,
  /* Elements the field must stay off. Given as selectors rather than refs
     because the field is plain DOM and the three of them do not share a
     React parent - the title and the copy are the section's, the caption
     is the stage's. */
  keepClear: string[] = [],
): AsciiField {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return noop();

  /* Capped hard, and lower than the rest of the site's canvases. This
     layer is decorative, it sits behind an opaque frame, and it is the
     one thing on the page holding two full-viewport backing stores - at
     1.25 that is about 32MB, at 2 it would be 80. */
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

  let cols = 0, rows = 0, n = 0;
  let cw = 0, ch = 0;                 // cell size in device px
  let W = 0, H = 0;

  /* Flat arrays, rebuilt only on resize - nothing here allocates while
     the loop is running.
       base*  what the cell settles to: the photograph, undisturbed
       draw*  what is actually on the mask right now
       next*  the picture being wiped in, if there is one */
  let baseG = new Uint8Array(0), baseA = new Uint8Array(0);
  let drawG = new Uint8Array(0), drawA = new Uint8Array(0);
  let nextG = new Uint8Array(0), nextA = new Uint8Array(0);
  let order = new Uint32Array(0);     // the wipe's cell order
  /* How much of the field each cell is allowed, 0..255. Everywhere it is
     255 except behind the type, where it is 0 with a soft ring around it -
     see keepOut(). A cell at 0 is cleared once and then never touched
     again by anything: not the wipe, not the wave. */
  let keep = new Uint8Array(0);

  /* The stencil. White characters on transparent, at the same size as the
     visible canvas; the picture is cut out against its alpha. */
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");

  /* The sprite sheet: every character of both alphabets, drawn once.
     Shade is applied at blit time with globalAlpha rather than by
     rendering each character at every shade. */
  const sheet = document.createElement("canvas");
  const sctx = sheet.getContext("2d");
  const GLYPHS = RAMP + WAVE;
  const WAVE0 = RAMP.length;

  // the downscaler, made once and reused for every picture
  const small = document.createElement("canvas");
  const smallCtx = small.getContext("2d", { willReadFrequently: true });

  const img = new Image();
  img.decoding = "async";
  let imgReady = false;
  // the cover-fit source rectangle, recomputed per picture
  let sx = 0, sy = 0, sw = 0, sh = 0;

  let active = false, still = false, alive = true;
  let running = false, raf = 0;

  // the pointer, in device px on the canvas, trailing the real one
  let px = 0, py = 0, tx = 0, ty = 0;
  let radius = 0, wantRadius = 0, seeded = false;
  /* Where the eased pointer was last frame, and how fast it is going -
     smoothed, in css px per ms. This is the only input to how hard and
     how fast the wave runs; see the loop. */
  let lastPx = 0, lastPy = 0, mv = 0;
  /* The wave's phase and the retype churn, both integrated rather than
     computed from the clock.

     They used to be `t * SPEED` and `t * 0.012` off performance.now(),
     which is exact only while the rate never changes. The rate changes
     every frame now, and multiplying a rate that has just moved by a
     timestamp in the millions restarts the rings somewhere else entirely -
     every change of speed would show as the whole pattern jumping. Adding
     `dt * rate` to a running total cannot do that: the phase is
     continuous through any change of rate, which is what lets the effect
     wind up and down without a seam. */
  let phase = 0, churn = 0, gain = 1, last = 0;

  let rect: DOMRect | null = null;
  let wipeAt = 0, wiping = false, shown = 0;

  // the box the wave touched last frame, so the cells it has left behind
  // get one more visit to settle back
  let pl = 0, pt = 0, pr = -1, pb = -1;

  /* ---------------------------------------------- the sheet */
  function buildSheet() {
    if (!sctx) return;
    cw = Math.max(1, Math.round(CELL * dpr));
    ch = cw;
    sheet.width = cw * GLYPHS.length;
    sheet.height = ch;
    sctx.clearRect(0, 0, sheet.width, sheet.height);
    /* A hair under the cell so neighbouring characters never touch and
       the grid keeps its ruled look. ui-monospace first for the crisp
       system face, with the generic as the guarantee. */
    sctx.font = `${Math.round(cw * 0.92)}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillStyle = "#fff";          // a stencil: only its alpha is ever used
    for (let i = 0; i < GLYPHS.length; i++) {
      sctx.fillText(GLYPHS[i], i * cw + cw / 2, ch / 2 + ch * 0.04);
    }
  }

  /* ---------------------------------------------- the grid */
  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    const c = Math.max(1, Math.floor(w / CELL));
    const r = Math.max(1, Math.floor(h / CELL));
    if (c === cols && r === rows && canvas.width) return false;

    cols = c; rows = r; n = c * r;
    W = cols * cw; H = rows * ch;
    canvas.width = W; canvas.height = H;
    mask.width = W; mask.height = H;

    baseG = new Uint8Array(n); baseA = new Uint8Array(n);
    drawG = new Uint8Array(n); drawA = new Uint8Array(n);
    nextG = new Uint8Array(n); nextA = new Uint8Array(n);
    drawG.fill(255);                  // nothing drawn yet, so everything differs
    pl = cols; pt = rows; pr = -1; pb = -1;

    /* The wipe's order: a diagonal, roughened. Sorting by a key that is
       mostly the cell's position and partly noise gives an edge that
       arrives as a torn line rather than a ruler, and - the reason it is
       a sweep at all rather than a shuffle - keeps every frame's new
       cells inside one narrow band, so the picture behind them is
       recomposited a band at a time instead of whole. */
    const key = new Float32Array(n);
    const idx = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const x = (i % cols) / cols, y = ((i / cols) | 0) / rows;
      /* Weighted hard toward x on purpose. The vertical and random terms
         are what tear the edge, but they are also what widens the band a
         frame's cells fall in - and the band is the rectangle being
         recomposited. At these weights it stays around a fifth of the
         canvas; at equal weights it would be most of it. */
      key[i] = x * 0.84 + y * 0.1 + Math.random() * 0.14;
      idx[i] = i;
    }
    idx.sort((a, b) => key[a] - key[b]);
    order = Uint32Array.from(idx);

    keepOut();
    return true;
  }

  /* ---------------------------------------------- the clearings
     The type on this section sits directly on the field, and two pieces of
     it cannot afford that: the heading and the paragraph under it, and the
     caption line under the frame - which is where the rooms are actually
     named, so a word of it lost to the grid costs the joke.

     A shadow in the paper colour was the first answer and it was the wrong
     one: it lightens the grid behind the letters but the grid is still
     moving there, and a caption sitting on top of characters that churn
     every time the cursor goes past is a caption you read twice. So the
     field is simply not drawn there at all. Those cells are cleared once
     and then held out of everything - the wipe skips them, the wave skips
     them, they are paper for as long as the page is open.

     ---- cut to the type, not to the element ----

     This measured element boxes, and an element box is nothing like the
     shape of the words in it. A block-level heading is the full width of
     its column whether the line on it is "The space." or a full measure; a
     paragraph capped at 56ch reserves all 56 of them on its last line even
     when that line is one word; and .stage__meta is a space-between flex
     row, so the caption at one end and the counter at the other were
     clearing a single unbroken band the entire width of the stage, nearly
     all of it holding nothing but the gap between the two.

     So the clearing is cut to the rendered text instead - one rectangle
     per run of text per line, each only as wide as the words actually
     sitting on it. A three-line paragraph whose last line is one word
     clears three steps and the short line clears short. Which is what this
     is for: the grid should come as close to the type as it can without
     touching it, and every cell cleared past that is a cell of the effect
     thrown away.

     ---- and the ranges are over text nodes, not over the element ----

     A Range across an element's contents does NOT give you line boxes. For
     any child element wholly inside the range it hands back that child's
     *border box*, and only bare text gets measured as runs. Which was
     fine until it met the one heading on this section that also carries
     [data-split]: SplitText cuts it into .split-line elements, each in an
     overflow:hidden .line-mask wrapper, and both of those are block-level
     and therefore the full width of the column. So the heading went on
     clearing its entire row, wrapper boxes instead of its own box, and the
     white band to the right of "The space." never moved.

     Walking to the text nodes and measuring each one is what actually
     asks the question we mean. A range whose two ends are inside a text
     node can only return text-run rectangles - there is no element in it
     to hand back a border box - so it gives the same answer whether the
     type has been split into line wrappers, wrapped in an <em>, or left
     as one bare string. */
  function textRects(el: HTMLElement): DOMRect[] {
    const out: DOMRect[] = [];
    try {
      /* Type that is not on the screen does not get to clear the grid.

         The split heading carries a .sr-only copy of its own text - the
         readable string, kept for the screen reader, because what is left
         for the eye is a stack of aria-hidden line wrappers. Visually it
         is nothing: a 1px box, clipped to inset(50%).

         A Range does not care. .sr-only is also white-space:nowrap, so the
         text run inside that 1px box lays out at its natural width and
         overflows it, and getClientRects hands back the run's own
         geometry - it reports the ink, and clip-path is a paint-time
         operation that never touches it. On "The space." that is a 313px
         box starting at the exact centre of the column and running right,
         which is why the clearing was hard against the T on the left and
         had most of a heading's width of empty paper after the full stop
         on the right. The heading was centred the whole time; the hole cut
         for it was not, because it was being cut for two strings, one of
         them invisible.

         Rejecting the subtree rather than filtering the rects afterwards:
         by the time it is a DOMRect there is nothing left on it that says
         where it came from. */
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (t) =>
          t.parentElement?.closest(".sr-only")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      const range = document.createRange();
      let node = walker.nextNode();
      while (node) {
        /* the whitespace between two block children is a text node too,
           and it measures as a zero-width run somewhere off the end of a
           line - a clearing centred on nothing */
        if (node.nodeValue && node.nodeValue.trim()) {
          range.selectNodeContents(node);
          for (const b of Array.from(range.getClientRects())) {
            if (b.width > 1 && b.height > 1) out.push(b);
          }
        }
        node = walker.nextNode();
      }
    } catch {
      /* nothing walkable in it - fall through to the element's own box */
    }
    if (!out.length) {
      const b = el.getBoundingClientRect();
      if (b.width > 1 && b.height > 1) out.push(b);
    }
    return out;
  }

  /* Recomputed whenever the grid is rebuilt, once more after the webfonts
     land - the one thing that moves this type after first paint - and
     again on every change of frame, which is what keeps the caption's
     clearing the size of whatever caption is currently in it rather than
     the size of the one it was measured against. See remeasure() below. */
  function keepOut() {
    keep = new Uint8Array(n).fill(255);
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const kx = W / r.width, ky = H / r.height;   // css px -> the canvas's own
    const pad = KEEP_PAD * kx, feather = KEEP_FEATHER * kx;

    for (const sel of keepClear) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        for (const b of textRects(el)) {
          const l = (b.left - r.left) * kx - pad;
          const t = (b.top - r.top) * ky - pad;
          const rt = (b.right - r.left) * kx + pad;
          const bt = (b.bottom - r.top) * ky + pad;

          const c0 = Math.max(0, ((l - feather) / cw) | 0);
          const c1 = Math.min(cols - 1, ((rt + feather) / cw) | 0);
          const r0 = Math.max(0, ((t - feather) / ch) | 0);
          const r1 = Math.min(rows - 1, ((bt + feather) / ch) | 0);

          for (let y = r0; y <= r1; y++) {
            const cy = y * ch + ch / 2;
            // how far outside the padded box this row is, vertically
            const dy = cy < t ? t - cy : cy > bt ? cy - bt : 0;
            for (let x = c0; x <= c1; x++) {
              const cx = x * cw + cw / 2;
              const dx = cx < l ? l - cx : cx > rt ? cx - rt : 0;
              const d = Math.hypot(dx, dy);
              if (d >= feather) continue;
              // smoothstep out of the clearing, so the grid comes back on a
              // curve rather than on a line
              const u = d / feather;
              const v = (u * u * (3 - 2 * u) * 255) | 0;
              const i = y * cols + x;
              if (v < keep[i]) keep[i] = v;
            }
          }
        }
      });
    }
  }

  /* ---------------------------------------------- reading the photograph
     Once per picture, at grid resolution: the browser's own downscale to
     cols x rows is faster and better than any sampling loop here, and it
     means the pixel data read back is a few thousand bytes rather than a
     few million. */
  function sample() {
    if (!imgReady || !n || !smallCtx) return false;
    const c2 = smallCtx;
    small.width = cols; small.height = rows;

    // object-fit: cover, so the field is cropped the way the frame is
    const ia = img.naturalWidth / img.naturalHeight, ga = cols / rows;
    sw = img.naturalWidth; sh = img.naturalHeight; sx = 0; sy = 0;
    if (ia > ga) { sw = img.naturalHeight * ga; sx = (img.naturalWidth - sw) / 2; }
    else { sh = img.naturalWidth / ga; sy = (img.naturalHeight - sh) / 2; }
    c2.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);

    let data: Uint8ClampedArray;
    try { data = c2.getImageData(0, 0, cols, rows).data; }
    catch { return false; }           // a tainted canvas: leave the field empty

    for (let i = 0; i < n; i++) {
      const p = i * 4;
      // Rec. 601 luma, integer weights - the grid is a stencil and this is
      // the one loop that runs over every cell
      const lum = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
      /* Inverted: the section is cream, so the darker the pixel the more
         of it has to be let through for the tones to come out the right
         way round. On a black page this would read straight. */
      const ink = 255 - lum;
      nextG[i] = GMIN + (((ink * (RAMP.length - 1 - GMIN)) / 255) | 0);
      /* Shade, quantised to sixteen steps. Not a nicety: `drawA` is
         compared against every frame to decide whether a cell needs
         redrawing at all, and against a continuous value almost every
         cell would count as changed almost every frame. */
      nextA[i] = ((ink * 15) / 255) | 0;
    }
    return true;
  }

  /* ---------------------------------------------- the stencil */
  function stencil(i: number, g: number, a: number) {
    /* Held out entirely. Forced to the blank glyph rather than merely
       skipped, so the first pass clears whatever was there and every pass
       after it costs the comparison below and nothing else. */
    if (!keep[i]) { g = 0; a = 0; }
    if (drawG[i] === g && drawA[i] === a) return;
    drawG[i] = g; drawA[i] = a;
    const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
    mctx!.clearRect(x, y, cw, ch);
    if (!g) return;                   // a blank cell: the clear is the whole job
    /* The floor was 0.1, which meant the lightest third of any photograph
       was drawn at almost nothing on top of being almost the colour of
       the paper - two ways of disappearing stacked on each other. At 0.42
       a pale cell is faint but unarguably there, and the ramp from here
       to nearly solid still carries the tone.

       Both ends are up. The floor moves 0.42 -> 0.56, which is where the
       pale half of the picture lives and so is most of what "the image
       should be more visible" means; the ceiling goes to a full 1 at the
       dark end. The old ceiling of .96 was held under one on the argument
       that a fully opaque grid competes with the framed photograph - but
       the thing keeping this field subordinate is the vignette it is
       masked with and the fact that it is characters rather than pixels,
       not four percent of alpha on its darkest cells.

       Scaled by the clearing, which is 255 everywhere that matters and a
       curve down to 0 around the type. */
    mctx!.globalAlpha = (0.56 + a * 0.0293) * (keep[i] / 255);
    mctx!.drawImage(sheet, g * cw, 0, cw, ch, x, y, cw, ch);
  }

  /* The picture, cut out against the stencil, over one rectangle.
     Two blits and a clear, clipped - the clip is what keeps
     `destination-in` from erasing the rest of the canvas along with it. */
  function cut(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0 || !imgReady) return;
    const kx = sw / W, ky = sh / H;
    ctx!.save();
    ctx!.beginPath();
    ctx!.rect(x, y, w, h);
    ctx!.clip();
    ctx!.clearRect(x, y, w, h);
    ctx!.filter = GRADE;
    ctx!.drawImage(img, sx + x * kx, sy + y * ky, w * kx, h * ky, x, y, w, h);
    ctx!.filter = "none";
    ctx!.globalCompositeOperation = "destination-in";
    ctx!.drawImage(mask, x, y, w, h, x, y, w, h);
    ctx!.restore();
  }

  /* ---------------------------------------------- the wave
     One frame of it, over the union of the cells it covers now and the
     cells it covered last frame - the second half is what lets a patch
     the cursor has left settle back without a full-grid sweep. */
  function wave() {
    const R = radius * dpr;
    let l = cols, tp = rows, r = -1, b = -1;
    if (R > 1) {
      l = Math.max(0, ((px - R) / cw) | 0);
      r = Math.min(cols - 1, ((px + R) / cw) | 0);
      tp = Math.max(0, ((py - R) / ch) | 0);
      b = Math.min(rows - 1, ((py + R) / ch) | 0);
    }
    const L = Math.min(l, pl === cols ? l : pl);
    const T = Math.min(tp, pt === rows ? tp : pt);
    const Rt = Math.max(r, pr), B = Math.max(b, pb);
    pl = l; pt = tp; pr = r; pb = b;
    if (Rt < L || B < T) return;

    /* The wave runs straight through a change of picture, and this is the
       one line that makes that safe.

       cut() blits whichever photograph is loaded, and during a wipe that
       is already the new one - the wipe is a transition in the *stencil*,
       not in the source. So a rectangle cut by the wave out ahead of the
       wipe's diagonal would show the new picture through characters still
       shaped by the old one, and the mismatch reads as a rectangular
       glitch chasing the cursor. That is what the effect used to be
       stopped for.

       Promoting the cells under the wave to the new picture answers it
       properly rather than by waiting: the patch the cursor is holding
       simply arrives at the new frame first, and the diagonal fills in
       around it. It reads as the ripple bringing the picture in, which is
       a better ninth of a second than a frozen one. The wipe walks over
       these cells again later and finds them already settled - stencil()
       compares before it draws, so that costs nothing. */
    if (wiping) {
      for (let y = T; y <= B; y++) {
        for (let x = L; x <= Rt; x++) {
          const i = y * cols + x;
          baseG[i] = nextG[i]; baseA[i] = nextA[i];
        }
      }
    }

    const R2 = R * R;
    for (let y = T; y <= B; y++) {
      const cy = y * ch + ch / 2;
      const dy = cy - py;
      for (let x = L; x <= Rt; x++) {
        const i = y * cols + x;
        if (!keep[i]) continue;       // paper, and staying paper
        const dx = (x * cw + cw / 2) - px;
        const d2 = dx * dx + dy * dy;
        if (R2 < 1 || d2 > R2) { stencil(i, baseG[i], baseA[i]); continue; }

        const d = Math.sqrt(d2);
        // squared falloff, so the edge of the reach dies out rather than
        // ending on a visible circle
        const f = 1 - d / R;
        /* `gain` is the softening: at rest it pulls the whole swell back
           by about half, which takes the shade push and the retype
           threshold down together. */
        const amp = Math.sin(d * WAVELEN - phase) * f * f * gain;

        /* Two things at once, and together they are the effect. The shade
           is pushed along the ramp, which is the swell; and past a
           threshold the cell is retyped out of the wave alphabet, which
           is the interference. The character picked is keyed off the
           cell's own position and the phase, so a held cursor keeps
           churning rather than freezing into a pattern. */
        const a = clamp(baseA[i] + amp * 7, 0, 15) | 0;
        const g = amp > 0.4
          ? WAVE0 + ((i * 7 + (churn | 0)) % WAVE.length)
          : clamp(baseG[i] + amp * 4, GMIN, RAMP.length - 1) | 0;
        stencil(i, g, a);
      }
    }
    cut(L * cw, T * ch, (Rt - L + 1) * cw, (B - T + 1) * ch);
  }

  function clamp(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* ---------------------------------------------- the loop */
  function frame() {
    raf = 0;
    if (!alive) return;

    if (wiping) {
      const p = Math.min(1, (performance.now() - wipeAt) / WIPE_MS);
      const upto = (p * n) | 0;
      // the band this frame's cells fall in, so the picture behind them
      // is cut out once rather than per cell
      let l = cols, t = rows, r = -1, b = -1;
      for (let k = shown; k < upto; k++) {
        const i = order[k];
        baseG[i] = nextG[i]; baseA[i] = nextA[i];
        stencil(i, baseG[i], baseA[i]);
        const x = i % cols, y = (i / cols) | 0;
        if (x < l) l = x; if (x > r) r = x;
        if (y < t) t = y; if (y > b) b = y;
      }
      shown = upto;
      if (r >= l) cut(l * cw, t * ch, (r - l + 1) * cw, (b - t + 1) * ch);
      /* No reset of the wave's box here any more. It existed because the
         wave had been stopped for the whole wipe and came back to a grid
         it had lost track of; it runs throughout now, so its record of
         where it was last frame was never interrupted. */
      if (p >= 1) wiping = false;
    }

    if (pointer && active && !still) {
      flip = !flip;
      if (flip) { const q = pointer.read(); if (q.live) at(q.x, q.y); }
    }

    /* The wave runs through everything - including a change of picture.
       See the promotion at the top of wave() for how the two are kept
       from disagreeing about which photograph is on the canvas. */
    if (!still) {
      const now = performance.now();
      /* Capped: a tab that has been in the background, or a long frame,
         must not advance the phase by a second's worth in one step and
         teleport the rings. */
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;

      px += (tx - px) * EASE;
      py += (ty - py) * EASE;
      radius += (wantRadius - radius) * 0.1;
      if (wantRadius === 0 && radius < 1) radius = 0;

      /* How fast the cursor is travelling, measured off the eased pointer
         rather than off the raw one: the eased pointer is what the wave
         is actually centred on, and it is already smooth, so the reading
         does not jitter with the mouse's own sampling.

         Asymmetric, and deliberately. Rising it takes almost at once, so
         the effect is at full speed by the time the eye has followed the
         cursor into motion; falling it takes about a second, so putting
         the mouse down winds the wave gently down instead of dropping it
         into the slow state the moment the hand stops. */
      const mdx = (px - lastPx) / dpr, mdy = (py - lastPy) / dpr;
      lastPx = px; lastPy = py;
      const inst = Math.sqrt(mdx * mdx + mdy * mdy) / dt;
      mv += (inst - mv) * (inst > mv ? 0.4 : 0.05);
      const mo = clamp(mv / MOVE_FULL, 0, 1);

      phase += dt * (SPEED_IDLE + (SPEED - SPEED_IDLE) * mo);
      churn += dt * (CHURN_IDLE + (CHURN - CHURN_IDLE) * mo);
      gain = GAIN_IDLE + (1 - GAIN_IDLE) * mo;

      wave();
    }

    /* On touch the loop is held open for as long as the section is on
       screen: there is no pointermove to restart it once the wave has
       decayed to nothing, so letting it stop would mean it stops for
       good. setActive(false) closes it when the section leaves. */
    if (wiping || radius > 0 || (pointer && active && !still)) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function kick() {
    if (running || !alive || !active) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------- pointer
     On the window rather than on the canvas, with the bounds checked by
     hand. The field is decorative and sits behind an opaque frame: giving
     it pointer-events of its own to catch a mousemove would put a
     transparent sheet across the section, over the thumbnails and under
     the custom cursor, to no purpose. And the rect is cached, not read in
     the handler - getBoundingClientRect on every move forces a layout,
     and this section shares a page with pinned GSAP timelines that are
     already reading geometry. */
  function at(clientX: number, clientY: number) {
    if (!active || still) return;
    if (!rect) rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const cx = clientX - rect.left, cy = clientY - rect.top;
    // a margin of one reach: the wave should already be running when the
    // cursor arrives at the edge, not start from flat at the boundary
    if (cx < -RADIUS || cy < -RADIUS ||
        cx > rect.width + RADIUS || cy > rect.height + RADIUS) {
      if (wantRadius) { wantRadius = 0; kick(); }
      return;
    }
    const x = cx * (canvas.width / rect.width);
    const y = cy * (canvas.height / rect.height);
    tx = x; ty = y;
    // no swipe in from 0,0 - and the velocity reference starts there too,
    // or the first frame reads as one jump the width of the section
    if (!seeded) { px = x; py = y; lastPx = x; lastPy = y; seeded = true; }
    wantRadius = RADIUS;
    kick();
  }
  function onMove(e: PointerEvent) { at(e.clientX, e.clientY); }
  function onLeave() { wantRadius = 0; kick(); }
  function invalidate() { rect = null; }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave, { passive: true });

  /* On a phone a pointermove is cancelled the instant the browser decides
     the gesture is a scroll, so the wave arrived, died mid-stroke and
     never came back - which is worse than not having it. The shared field
     (lib/pointer-field.ts) is read per frame instead: it rests near the
     middle of the screen, so the section scrolling past drags the wave
     across the picture on its own, and a finger laid on it takes over.

     Sampled every other frame there. The wave is a full-canvas cell
     redraw and this is the one effect on the site with a real per-frame
     cost; at the speeds the resting point moves, thirty of them a second
     is indistinguishable from sixty and costs half as much. */
  const coarse = isCoarsePointer();
  const pointer = coarse ? acquirePointerField() : null;
  let flip = false;
  window.addEventListener("scroll", invalidate, { passive: true });
  window.addEventListener("resize", invalidate, { passive: true });

  const ro = new ResizeObserver(() => {
    invalidate();
    if (layout() && sample()) reset();
  });
  ro.observe(canvas);

  /* The clearings are measured off type, and type moves once after first
     paint - when the webfonts arrive and every line rewraps at its real
     width. Measuring again then is the difference between a caption sitting
     in its hole and a caption sitting half out of one. */
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!alive || !n) return;
      keepOut();
      if (imgReady) reset();
    });
  }

  /* Straight down, no wipe: for a resize, and for the very first picture
     under reduced motion. */
  function reset() {
    baseG.set(nextG); baseA.set(nextA);
    for (let i = 0; i < n; i++) stencil(i, baseG[i], baseA[i]);
    cut(0, 0, W, H);
  }

  buildSheet();
  layout();

  function load(src: string) {
    imgReady = false;
    img.onload = () => {
      imgReady = true;
      if (!alive || !n) return;
      if (!sample()) return;
      if (still) { reset(); return; }
      wipeAt = performance.now();
      wiping = true;
      shown = 0;
      kick();
    };
    img.src = src;
  }

  return {
    /* The new clearing, and then every cell marked as differing from what
       is on the mask so that nothing is skipped by the redraw test in
       stencil() - a cell whose character and shade are unchanged but whose
       share of the field went from 0 to 255 has to be retyped, and drawG/
       drawA alone cannot tell you that.

       No repaint of its own. This is called immediately before setImage,
       and the wipe that follows retypes every cell in the grid anyway over
       its 900ms - so the new clearing simply comes in on the back of the
       change of picture, which is the one moment on this section where a
       full repaint was already happening. */
    remeasure() {
      if (!alive || !n) return;
      keepOut();
      drawG.fill(255);
    },
    setImage(src) { if (src && img.src !== src) load(src); },
    setActive(on) {
      active = on;
      if (!on) { wantRadius = 0; radius = 0; seeded = false; mv = 0; last = 0; invalidate(); }
      else kick();
    },
    setStill(on) {
      still = on;
      if (on) { wantRadius = 0; radius = 0; if (imgReady && n) reset(); }
    },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      pointer?.release();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      img.onload = null;
    },
  };
}

function noop(): AsciiField {
  return { remeasure() {}, setImage() {}, setActive() {}, setStill() {}, destroy() {} };
}
