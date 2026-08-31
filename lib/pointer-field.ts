/* ============================================================
   SoCheers - the pointer field

   Every cursor-driven effect on this site used to open with the same
   line: `if (!canHover) return`. Which was honest - there is no cursor
   on a phone, and a mousemove handler there is a handler that never
   fires - but the consequence was that the whole expressive layer of
   the site (the tilt on the cards, the splash that leans, the ascii
   wave, the head that looks at you, the spotlight) simply did not
   exist for most of the people looking at it.

   The fix is not to bolt a fake cursor onto touch. It is to notice
   that all of those effects want the same one thing - "where is the
   reader's attention, in viewport pixels" - and that a phone can
   answer that question perfectly well, just not with a mouse:

     - while a finger is down, the reader's attention IS the finger;
     - the rest of the time it is the middle of the screen, because
       that is the only place a phone can be looking.

   That second half is what makes the whole thing work without any new
   maths downstream. Every consumer already computes its effect from
   the pointer's position *relative to its own box* - and on a phone
   the box is what moves, scrolling up past a point held at the centre
   of the screen. So a card leans into the middle of the display as it
   rises, rocks through level as it crosses, and leans away as it
   leaves. The gesture the effect was written for happens by itself,
   driven by the scroll, with no per-effect touch branch anywhere.

   On top of that resting point sits a very slow drift (a Lissajous a
   fraction of the viewport wide, on a ~20s cycle). Without it a phone
   held still is a phone where every one of these effects is frozen at
   exactly its neutral value, which reads as broken rather than calm.

   One field is shared by the whole page, reference counted: a dozen
   consumers each attaching their own touchmove listener is a dozen
   handlers doing identical work on the hottest event on the platform.
   ============================================================ */

export type PointerRead = {
  /** viewport px */
  x: number;
  y: number;
  /** is there a position worth reading at all */
  live: boolean;
  /** is the reader actively driving it (mouse moved / finger down or
      just lifted) rather than it sitting on its resting point */
  engaged: boolean;
};

export type PointerHandle = {
  read(): PointerRead;
  /** true when this machine has no hovering pointer - consumers that
      want a genuinely different treatment (not just a different source
      of coordinates) branch on this */
  readonly coarse: boolean;
  release(): void;
};

/* The reader's attention, when nothing is telling us otherwise. Not
   dead centre: on a phone the thumb covers the bottom third and the
   eye sits above the middle, so the resting point sits a touch high. */
const ANCHOR_X = 0.5;
const ANCHOR_Y = 0.44;

/* How long the field takes to let go of a finger and settle back. Long
   enough that the tail of a flick still reads as motion, short enough
   that it is home before the reader has finished reading. */
const SETTLE_MS = 1100;

/* The idle drift, as a share of the viewport, and its periods. Slow and
   small on purpose - this is the difference between "still" and
   "stopped", not an animation in its own right. */
const DRIFT_X = 0.085;
const DRIFT_Y = 0.055;
const PERIOD_X = 19000;
const PERIOD_Y = 26300;

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Field = {
  handle: Omit<PointerHandle, "release">;
  refs: number;
  destroy(): void;
};

let field: Field | null = null;

function build(): Field {
  const coarse = isCoarsePointer();
  const reduced = prefersReducedMotion();
  const ac = new AbortController();
  const opts = { passive: true, signal: ac.signal } as AddEventListenerOptions;

  /* the last position the reader actually put the pointer at */
  let rawX = 0;
  let rawY = 0;
  let ever = false;
  let holding = false;
  /* when the hold ended - the clock the settle runs on. Seeded far in
     the past so a field nobody has touched reads as fully settled. */
  let let_go = -1e9;

  const start = typeof performance !== "undefined" ? performance.now() : 0;

  if (!coarse) {
    window.addEventListener("mousemove", (e: MouseEvent) => {
      rawX = e.clientX; rawY = e.clientY; ever = true;
    }, opts);
  } else {
    /* Touch events rather than pointer events, and deliberately.
       pointermove for a touch is cancelled the moment the browser
       decides the gesture is a scroll, which is nearly every gesture on
       this site - so a pointermove-fed field goes dead exactly when the
       reader is doing the one thing they mostly do. touchmove keeps
       firing through the scroll, which is what we want: the effects
       should track the finger that is dragging the page. */
    const take = (e: TouchEvent) => {
      const t = e.touches[0] || e.changedTouches[0];
      if (!t) return;
      rawX = t.clientX; rawY = t.clientY; ever = true;
    };
    window.addEventListener("touchstart", (e: TouchEvent) => {
      holding = true; take(e);
    }, opts);
    window.addEventListener("touchmove", take, opts);
    const end = (e: TouchEvent) => {
      take(e);
      holding = false;
      let_go = performance.now();
    };
    window.addEventListener("touchend", end, opts);
    window.addEventListener("touchcancel", end, opts);
  }

  function anchor(now: number): [number, number] {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (reduced) return [w * ANCHOR_X, h * ANCHOR_Y];
    const t = now - start;
    return [
      w * (ANCHOR_X + DRIFT_X * Math.sin((t / PERIOD_X) * Math.PI * 2)),
      h * (ANCHOR_Y + DRIFT_Y * Math.sin((t / PERIOD_Y) * Math.PI * 2 + 1.1)),
    ];
  }

  function read(): PointerRead {
    if (!coarse) return { x: rawX, y: rawY, live: ever, engaged: ever };

    const now = performance.now();
    const [ax, ay] = anchor(now);
    if (holding) return { x: rawX, y: rawY, live: true, engaged: true };
    if (!ever) return { x: ax, y: ay, live: true, engaged: false };

    const t = Math.min(Math.max((now - let_go) / SETTLE_MS, 0), 1);
    const k = t * t * (3 - 2 * t);          // smoothstep home
    return {
      x: rawX + (ax - rawX) * k,
      y: rawY + (ay - rawY) * k,
      live: true,
      engaged: t < 1,
    };
  }

  return {
    handle: { read, coarse },
    refs: 0,
    destroy() { ac.abort(); },
  };
}

/** Take a reference on the shared field. Every caller must release. */
export function acquirePointerField(): PointerHandle {
  if (!field) field = build();
  const f = field;
  f.refs += 1;
  let released = false;
  return {
    read: f.handle.read,
    coarse: f.handle.coarse,
    release() {
      if (released) return;
      released = true;
      f.refs -= 1;
      if (f.refs <= 0) { f.destroy(); if (field === f) field = null; }
    },
  };
}
