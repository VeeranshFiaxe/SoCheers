/* ============================================================
   SoCheers - what this machine, and this line, can take

   Two answers, and they are different questions.

   LITE is about the device. The expressive layer of the site - glass
   blur on the header, a blended spotlight over the whole page, blur-in
   reveals, a WebGL field of thirty thousand grains - is priced for a
   decent laptop GPU. On a thin one each of those is a full-screen
   composite on every scroll frame, and together they are the lag.
   html.sc-lite is the switch: the stylesheet drops the effects nobody
   would miss and the engines ask for less. It is set

     · before the first paint, by the head script in app/layout.tsx,
       off the hardware hints (few cores, little memory, Save-Data);
     · at runtime, by watchFrames() below, when the page is visibly not
       keeping up, or the browser turns out to have no GPU to give it.
       The hints are advisory and missing on half the browsers, so the
       frame clock is the ground truth - and the answer is remembered for
       the tab, so the next page starts lite instead of finding out all
       over again.

   It only ever goes one way. A machine that could not hold the frame
   rate a minute ago has not got faster.

   SLOW NETWORK is about the line, and it only decides WHEN heavy files
   are fetched, never how anything looks.
   ============================================================ */
import { gsap } from "gsap";

export const LITE_CLASS = "sc-lite";
/* fired on document the moment a runtime switch happens, for engines
   that sized something at boot and want to size it down */
export const LITE_EVENT = "sc:lite";
/* spelled out again in the head script in app/layout.tsx, which runs
   before any module does - if one moves, both move */
const LITE_KEY = "sc-lite";

type Connection = { saveData?: boolean; effectiveType?: string; downlink?: number };

const connection = (): Connection | undefined =>
  typeof navigator === "undefined"
    ? undefined
    : (navigator as Navigator & { connection?: Connection }).connection;

export function isLite(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains(LITE_CLASS);
}

/* Chromium-only (navigator.connection), so everywhere else this is
   "fine" - which is the same assumption the site made before it asked. */
export function slowNetwork(): boolean {
  const c = connection();
  if (!c) return false;
  if (c.saveData) return true;
  if (/2g|3g/.test(c.effectiveType ?? "")) return true;
  return typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 2;
}

function goLite() {
  const root = document.documentElement;
  if (root.classList.contains(LITE_CLASS)) return;
  root.classList.add(LITE_CLASS);
  try { sessionStorage.setItem(LITE_KEY, "1"); } catch { /* storage blocked - this page still goes lite */ }
  document.dispatchEvent(new CustomEvent(LITE_EVENT));
}

/* ---------------------------------------------------- the frame clock
   A rolling average over WINDOW frames, not a single long frame: image
   decodes, a font landing and the first WebGL compile all cost one bad
   frame on any machine. Ninety frames averaging worse than SLOW_MS is a
   couple of seconds of the page running under 40fps, which is not a
   hitch, it is the machine. It was 30ms (~33fps), and that let a laptop
   sit in the high thirties - visibly laggy, never quite slow enough to be
   told - for a whole visit. The first GRACE_MS after boot are not counted
   at all - that is the page loading, not the page running. */
const WINDOW = 90;
const SLOW_MS = 25;
const GRACE_MS = 3000;
let watching = false;

/* A GPU the browser will not use. When Chrome has blocklisted the driver -
   old laptops, virtual machines, remote desktops - every layer on the page
   is composited on the CPU, and the frame clock takes seconds of stutter
   to notice. failIfMajorPerformanceCaveat asks the question outright: a
   context that could only exist in software is refused, and so is one
   where WebGL is off altogether. Either way the expressive layer is not
   affordable. The probe's context is handed straight back. */
function softwareOnly(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl", { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null;
    if (!gl) return true;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return false;
  } catch {
    return false;
  }
}

export function watchFrames(): void {
  if (watching || typeof window === "undefined" || isLite()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  watching = true;

  /* asked once the page is quiet: a context is a few milliseconds the
     first paint should not be paying for */
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  }).requestIdleCallback;
  const probe = () => { if (!isLite() && softwareOnly()) goLite(); };
  if (idle) idle(probe, { timeout: 3000 });
  else window.setTimeout(probe, 1500);

  const start = performance.now();
  const ring = new Float32Array(WINDOW);
  let at = 0;
  let filled = 0;
  let sum = 0;
  let last = 0;

  const frame = (now: number) => {
    if (isLite()) { watching = false; return; }
    const dt = now - last;
    last = now;
    /* over a quarter of a second is a background tab or a debugger, not
       a slow frame */
    if (dt > 0 && dt < 250 && !document.hidden && now - start > GRACE_MS) {
      sum += dt - ring[at];
      ring[at] = dt;
      at = (at + 1) % WINDOW;
      if (filled < WINDOW) filled += 1;
      if (filled === WINDOW && sum / WINDOW > SLOW_MS) {
        goLite();
        watching = false;
        return;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------- where things are
   Several engines want an element's box every frame - the cursor has to
   be compared against it - and getBoundingClientRect() asked in the
   middle of a frame, after GSAP and ScrollTrigger have already written
   that frame's styles, is a forced layout of the whole document. Three
   of those a frame is most of a thin machine's budget.

   So the boxes are read once, together, at the very START of GSAP's
   tick (a prioritised ticker callback runs before GSAP renders anything)
   when layout is still clean from the frame before, and handed out from
   there. A box is one frame behind the scroll, which at these easings is
   nothing anyone can see. */
type Tracked = { el: Element; rect: DOMRect | null; on: boolean };

const tracked = new Set<Tracked>();
const readAll = () => {
  tracked.forEach((t) => { if (t.on) t.rect = t.el.getBoundingClientRect(); });
};

export type RectTrack = {
  /** the box as of the start of this frame (read directly if it has not been yet) */
  read(): DOMRect;
  /** stop measuring while the consumer is off screen */
  active(on: boolean): void;
  release(): void;
};

export function trackRect(el: Element): RectTrack {
  const t: Tracked = { el, rect: null, on: true };
  if (!tracked.size) gsap.ticker.add(readAll, false, true);
  tracked.add(t);
  return {
    read: () => t.rect ?? (t.rect = el.getBoundingClientRect()),
    active(on) {
      t.on = on;
      if (!on) t.rect = null;
    },
    release() {
      if (!tracked.delete(t)) return;
      if (!tracked.size) gsap.ticker.remove(readAll);
    },
  };
}
