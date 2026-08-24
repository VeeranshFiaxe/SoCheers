"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import ScrollTrigger from "gsap/ScrollTrigger";
import { AI_GATE } from "@/lib/ai-content";
import { smoothTo } from "@/lib/motion";

/* ============================================================
   THE FORK - two doors, and the page does not continue past them.

   The brief: a reader arriving here either wants the story about Ashok
   or wants the work, the choice is theirs, and it is a real choice -
   nobody scrolls straight past the question into the wall of work
   without having answered it.

   ---- how the scroll is stopped ----

   Not by stopping it. Nothing here touches the wheel, and there is no
   overflow:hidden, no scroll listener and no lock class: both panels
   below simply have no height until a door is picked, so the document
   ends at the question and there is nothing under the fold to reach.

   That matters more than it sounds. Every version of this that hijacks
   the wheel has the same failure mode - a trackpad flick, a Page Down,
   a keyboard user tabbing to something they cannot see, a phone's
   momentum scroll fighting a preventDefault - and all of them end with
   a reader stuck on a page that will not move for reasons it has not
   explained. A short page is not stuck. It has just finished, in the
   place where it is asking a question, with the answer under the
   cursor.

   ---- what each door does ----

     yes   opens the story *and* the work under it, and goes to the
           story. Opening both is deliberate: a reader who has just been
           told there is a wall of work below should not hit a second
           wall at the end of the parable.
     no    opens the work alone, and goes to it.

   Neither is reversible from here, and that is fine - once the page is
   open it stays open, and the gate above it stops being a gate and
   becomes what it always read as: a line of copy with two buttons.

   ---- why the story is in the HTML either way ----

   The obvious build renders the panels only once a button is clicked.
   That would mean the page's only real writing does not exist until
   somebody interacts - invisible to a crawler, invisible to anyone who
   opens this with JavaScript blocked, and invisible to a reader who
   lands on /ai-work#ashok from a link somebody sent them.

   So both panels always render. `mounted` is what makes that safe: on
   the server and on the very first client paint it is false, nothing is
   collapsed, and the document is complete. Only once the component is
   live does the collapse apply - which is also exactly the point at
   which the buttons that undo it start working. No-JS gets the whole
   page, open, in order.

   `inert` rather than `display:none` on a shut panel: it takes the
   subtree out of the tab order and off the accessibility tree in one
   attribute while leaving the height animatable. A collapsed panel you
   can still tab into is the classic version of this bug.

   ---- and the part that is easy to miss ----

   initSite() gives every [data-reveal] and [data-split] inside these
   panels a ScrollTrigger, and it measures them at boot - while they are
   collapsed to zero height and everything inside them is stacked at one
   point just under the gate. Those measurements are wrong the instant a
   panel opens, and wrong in the direction that hides content: a trigger
   whose start was computed below the fold and whose element has since
   moved will never fire, and the type inside is held at autoAlpha 0
   until it does. An empty page under a button that said "yes".

   So the triggers are re-measured on the way through the door, and the
   whole sequence - open, commit, re-measure, go - is one synchronous
   run inside the click. See choose() for why it is not deferred any
   more, which is the same reason the panel no longer animates its
   height.
   ============================================================ */
type Door = "story" | "work";

export default function AiGate({ story, work }: { story: ReactNode; work: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<Door | null>(null);
  const storyHold = useRef<HTMLDivElement>(null);
  const workHold = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  /* Before mount nothing is shut - see above. After it, "no" leaves the
     story shut and opens the work; "yes" opens both. */
  const storyShut = mounted && open !== "story";
  const workShut = mounted && open === null;

  /* ---- opening a door, and going through it ----

     Three things have to happen in one order and they are all done here,
     synchronously, on the click:

       1. the panel is opened,
       2. the DOM is committed so the document is its full height,
       3. the triggers are re-measured and the page is sent to the panel.

     Step 2 is what flushSync is for, and it is not decoration. React
     batches a setState and commits it after the handler returns, so
     anything measuring or scrolling in the same tick is looking at the
     page as it was before the door opened - and a scroll to a target
     below the current document height is clamped to the bottom of the
     short page, which lands the reader somewhere above the story with
     no indication that anything was aimed at.

     This used to be deferred instead: a rAF, then a transitionend on the
     panel's height animation, then the scroll, with a timer behind it in
     case the transition never ran. Three separate things, every one of
     them able to not happen - and in a backgrounded tab, or any tab the
     browser has throttled, none of them do: rAF does not fire, the
     transition does not advance, and the click silently opened a panel
     and went nowhere.

     Which is also why the height no longer animates (ai.css): a panel
     that takes three quarters of a second to reach its full height is a
     document that is too short to scroll into for three quarters of a
     second, and every workaround for that was a workaround for an
     animation nobody can see - it is happening below the fold, behind a
     scroll that is travelling over it. The panel now opens at once and
     fades up, and the arrival is carried by the story's own type coming
     in as the reader lands on it. */
  const choose = (door: Door) => {
    if (open) return;
    flushSync(() => setOpen(door));

    const panel = door === "story" ? storyHold.current : workHold.current;
    if (!panel) return;

    /* Every [data-reveal] in the panel was measured while the panel was
       collapsed to nothing, so their triggers are all recorded at one
       point just under the gate. Left alone, the type inside would be
       held at autoAlpha 0 by a trigger whose start is now above the
       reader and will never come round again: an empty page under a
       button that said yes. */
    ScrollTrigger.refresh();
    smoothTo(panel);
  };

  return (
    <>
      <section className="ai-gate" id="gate">
        <div className="wrap ai-gate__in">
          <p className="ai-gate__q" data-reveal>{AI_GATE.question}</p>

          <div className="ai-gate__doors" data-reveal>
            {/* Buttons rather than anchors, and deliberately so: an
                a[href^="#"] is bound to Lenis at boot (lib/motion.ts) and
                would leave for the target the moment it is clicked,
                which here is the moment before the target has any
                height. The scroll is owned by settle() instead. */}
            <button
              type="button"
              className="ai-gate__door ai-gate__door--yes"
              onClick={() => choose("story")}
              data-magnetic
              data-cursor="Read it"
            >
              {AI_GATE.yes}
            </button>

            <button
              type="button"
              className="ai-gate__door"
              onClick={() => choose("work")}
              data-magnetic
              data-cursor="Skip"
            >
              {AI_GATE.no}
            </button>
          </div>
        </div>
      </section>

      <div
        className="ai-hold"
        id="ashok"
        ref={storyHold}
        data-collapsed={storyShut ? "" : undefined}
        inert={storyShut}
      >
        {story}
      </div>

      <div
        className="ai-hold"
        ref={workHold}
        data-collapsed={workShut ? "" : undefined}
        inert={workShut}
      >
        {work}
      </div>
    </>
  );
}
