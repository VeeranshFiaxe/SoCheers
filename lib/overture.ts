/* ============================================================
   SoCheers - the overture, and its handshake with the site engine

   The opening sequence (components/Overture.tsx + lib/overture-motion.ts)
   takes the screen for as long as it runs, so the two engines have to agree
   on one thing before either of them touches the DOM: is it running at all?

   That answer has to be identical in both places and it has to be available
   *synchronously*, because lib/motion.ts decides whether to run its own
   preloader and hero intro at boot - long before the overture has rendered
   anything it could be asked about. So the gate is a pure function of
   matchMedia + sessionStorage and nothing else: no element lookups, no
   ordering assumptions between the two useEffects.

   After that first handshake the two talk over document events, which is
   also what makes the replay (click the docked bulb) work: the overture can
   take the screen back at any time and the site engine simply re-locks.
   ============================================================ */

/* the overture has taken the screen: stop the scroll, hide the chrome */
export const OVERTURE_START = "socheers:overture-start";
/* the hero is on screen and real: give the page back */
export const OVERTURE_DONE = "socheers:overture-done";
/* the docked bulb was clicked: run the whole thing again */
export const OVERTURE_REPLAY = "socheers:overture-replay";

const SEEN = "sc-overture-seen";

/* Once per tab, not once per page view. Coming back from /about should not
   replay the whole opening - but a genuinely new visit should always get it,
   which is why this is sessionStorage rather than localStorage. */
export function shouldRunOverture(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(SEEN) !== "1";
  } catch {
    /* private mode / storage disabled - better to play it than to throw */
    return true;
  }
}

/* Called at the hand-off, never at the start: a run that is interrupted
   halfway (reload mid-sequence) should still get another go. */
export function markOvertureSeen() {
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* nothing to do - the sequence simply plays again next time */
  }
}

/* ------------------------------------------------------------------
   The cue.

   The percentage loader and the overture are one opening, not two: the
   loader is what the first visit looks like *while the room is being
   built* - the wall images fetched and decoded behind the black, so the
   sequence does not stutter on the first fall and the hero underneath is
   already in cache by the time the camera arrives.

   So the overture no longer builds itself on mount. It waits here, and
   components/Loader.tsx fires this when the count has landed and its
   sheet is over the screen. The flag matters as much as the event: the
   two mount in the same commit and the loader can be finished (the
   already-seen path bails synchronously) before the overture has
   subscribed, and a cue nobody heard would leave the room dark forever. */
export const OVERTURE_CUE = "socheers:overture-cue";

let cued = false;

export function cueOverture() {
  if (cued) return;
  cued = true;
  document.dispatchEvent(new CustomEvent(OVERTURE_CUE));
}

/* already fired - build now rather than wait for a second one */
export function overtureCued(): boolean {
  return cued;
}
