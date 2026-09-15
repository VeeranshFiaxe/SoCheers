/* ============================================================
   A RELOAD PUTS THE READER BACK WHERE THEY WERE.

   The site boots every page at the top (initOvertureBridge in
   lib/motion.ts) because the browser's own restore lands before the pins
   and reveals exist and leaves them measured against the wrong place. So
   the position is kept here instead and handed back once the page is
   built: saved as the page goes away, read on the next load if that load
   was a reload of the same address.

   A hard reload (Ctrl+Shift+R, Ctrl+F5, Shift+F5) is the way back to the
   top, so its keypress drops the saved position. A hard reload from the
   browser's toolbar cannot be told apart from a plain one and restores
   like one.
   ============================================================ */
const KEY = "sc-scroll";

let installed = false;
/* undefined: not read yet. null: nothing to restore on this document. */
let pending: { path: string; y: number } | null | undefined;

const here = () => location.pathname + location.search;

export function installScrollMemory(): void {
  if (installed) return;
  installed = true;
  let hard = false;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (
      ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "r") ||
      (k === "f5" && (e.ctrlKey || e.shiftKey))
    ) hard = true;
  }, true);
  window.addEventListener("pagehide", () => {
    try {
      if (hard) sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, JSON.stringify({ path: here(), y: Math.round(window.scrollY) }));
    } catch { /* storage blocked - a reload just starts at the top */ }
  });
}

/* Where to put the reader, or null. Asked again by a second boot of the
   same page (React's dev double-mount) and answers the same, until
   doneRestoring() or a client-side move to another address. */
export function reloadY(): number | null {
  if (pending === undefined) {
    pending = null;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      if (nav?.type === "reload" && raw) {
        const v = JSON.parse(raw) as { path?: unknown; y?: unknown };
        if (typeof v.path === "string" && typeof v.y === "number" && v.y > 0) {
          pending = { path: v.path, y: v.y };
        }
      }
    } catch { /* nothing to restore */ }
  }
  if (!pending || pending.path !== here()) {
    pending = null;
    return null;
  }
  return pending.y;
}

export const doneRestoring = (): void => {
  pending = null;
};
