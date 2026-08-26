/* ============================================================
   SoCheers - keeping a background film running.

   Every silent film on this site - the reel on the home page, the
   opener on About - is the same kind of object: no controls, no sound,
   nothing a reader can act on, and it is simply expected to be moving
   whenever it is on screen. The browser does not share that
   expectation. A muted <video> is *allowed* to start itself; it is not
   promised to.

   The ways one refuses, all of which we have seen:

     not ready      play() is called the moment the element scrolls in,
                    before a single frame has been decoded. It rejects,
                    and a lone .catch(() => {}) makes that permanent -
                    the film never gets asked a second time.

     denied         iOS Low Power Mode, Safari's autoplay policy, a
                    tab restored in the background. The rejection here
                    is a decision, not a timing accident, and it stands
                    until the reader touches the page. The first tap or
                    key or wheel is the moment it stops standing.

     stalled        the network drops the ball mid-buffer. The element
                    is not paused and not playing; it is waiting, and
                    nothing will wake it on its own.

     errored        the fetch failed outright. Only a fresh load() gets
                    a second chance at it.

   So this does not call play() once. It holds an intent - "this film
   should be running" - and re-asserts it on every event that could
   plausibly change the answer, backing off between tries so a genuine
   denial does not turn into a spin. It stops asking the instant the
   caller says the film is off screen, and it stops for good on
   destroy().

   Nothing here is decorative: each listener below is one of the four
   failures above, and dropping any of them puts back an intermittent
   "sometimes it just doesn't play".
   ============================================================ */

export type FilmHandle = {
  /** on screen and should be running, or gone and should not be */
  want(on: boolean): void;
  /** the reader has asked for it to stop, and that outranks everything
      above: every listener here exists to undo a pause nobody chose, so
      a pause somebody *did* choose has to be visible to them or the
      keeper simply presses play again a quarter of a second later */
  hold(on: boolean): void;
  destroy(): void;
};

/* Six tries, 250ms doubling to 4s - about eight seconds of patience.
   Past that the cause is a policy decision rather than a slow buffer,
   and the only thing that resolves it is the reader, so we stop
   burning timers and wait for a gesture instead. */
const MAX_TRIES = 6;
const MAX_RELOADS = 2;

export function keepPlaying(video: HTMLVideoElement): FilmHandle {
  let wanted = false;
  let held = false;
  let dead = false;
  let tries = 0;
  let reloads = 0;
  let timer = 0;

  const clear = () => {
    if (timer) { window.clearTimeout(timer); timer = 0; }
  };

  const attempt = () => {
    if (dead || !wanted || held) return;
    /* already running - nothing to prove, and reset the patience so a
       later stall starts from a short wait rather than a long one */
    if (!video.paused && !video.ended) { tries = 0; return; }
    /* no file attached yet (the reel holds its src back until the
       section is near); the loadeddata listener will bring us back */
    if (!video.src && !video.currentSrc) return;

    /* the one condition a self-starting film must meet, re-asserted
       every time in case something else on the page unmuted it */
    video.muted = true;

    let p: Promise<void> | undefined;
    try { p = video.play(); } catch { retry(); return; }
    if (!p || typeof p.then !== "function") return;   // older Safari returns void
    p.then(() => { tries = 0; }).catch(() => { retry(); });
  };

  const retry = () => {
    if (dead || !wanted || held || timer || tries >= MAX_TRIES) return;
    const wait = Math.min(250 * 2 ** tries, 4000);
    tries += 1;
    timer = window.setTimeout(() => { timer = 0; attempt(); }, wait);
  };

  /* The gesture unlock. A denial is only ever lifted by the reader
     doing something, so the first thing they do is the best moment to
     ask again - and it resets the patience, because the reason the
     earlier tries failed has just gone away. Passive and on the
     window, so it costs nothing and never blocks a scroll. */
  const onGesture = () => {
    if (dead) return;
    tries = 0;
    attempt();
  };

  /* Readiness. Any of these means the element knows more than it did
     when we last asked, which is exactly when a "not ready" rejection
     is worth re-testing. */
  const onReady = () => { tries = 0; attempt(); };

  /* A pause we did not ask for - the browser reclaiming a background
     tab, a decoder hiccup, a policy kicking in late. */
  const onPause = () => { if (wanted) retry(); };

  /* Buffer underrun. The element is neither playing nor paused, so
     nothing above fires; a nudge on the same backoff is all it takes
     once the bytes arrive. */
  const onStall = () => { if (wanted) retry(); };

  /* The fetch itself failed. play() cannot recover from this - only a
     fresh load() can - and if two of those do not take, the file or
     the network is the problem and no amount of asking will fix it. */
  const onError = () => {
    if (dead || !wanted || reloads >= MAX_RELOADS) return;
    reloads += 1;
    try { video.load(); } catch { /* nothing left to try */ }
    tries = 0;
    retry();
  };

  /* Coming back to the tab. Browsers pause background video and do not
     always resume it. */
  const onVisible = () => {
    if (document.visibilityState === "visible") onReady();
  };

  video.addEventListener("loadeddata", onReady);
  video.addEventListener("canplay", onReady);
  video.addEventListener("canplaythrough", onReady);
  video.addEventListener("pause", onPause);
  video.addEventListener("stalled", onStall);
  video.addEventListener("waiting", onStall);
  video.addEventListener("suspend", onStall);
  video.addEventListener("error", onError);
  document.addEventListener("visibilitychange", onVisible);

  const gestures = ["pointerdown", "touchstart", "keydown", "wheel"] as const;
  gestures.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));

  return {
    want(on: boolean) {
      if (dead || on === wanted) return;
      wanted = on;
      if (on) {
        tries = 0;
        attempt();
      } else {
        clear();
        if (!video.paused) video.pause();
      }
    },
    /* The reader's own stop. It does not clear `wanted` - whether the
       film is on screen is a separate fact, and the caller keeps
       writing it while the hold stands - so letting go resumes only if
       the section is still there to resume into. */
    hold(on: boolean) {
      if (dead || on === held) return;
      held = on;
      if (on) {
        clear();
        if (!video.paused) video.pause();
      } else {
        tries = 0;
        attempt();
      }
    },
    destroy() {
      dead = true;
      wanted = false;
      clear();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("stalled", onStall);
      video.removeEventListener("waiting", onStall);
      video.removeEventListener("suspend", onStall);
      video.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisible);
      gestures.forEach((g) => window.removeEventListener(g, onGesture));
    },
  };
}
