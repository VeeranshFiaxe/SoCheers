"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { AI_GATE } from "@/lib/ai-content";

/* ============================================================
   THE FORK - two doors, and neither of them a trap.

   The brief: a reader arriving here either wants the story about Ashok
   or wants the work, and being made to scroll past a parable to reach a
   portfolio is the second thing on that list going wrong.

   ---- why the story is in the HTML either way ----

   The obvious build is to render the story only after "yes" is clicked.
   That would mean the page's only real writing does not exist until
   somebody interacts - invisible to a crawler, invisible to anyone who
   opens this with JavaScript blocked, and invisible to a reader who
   lands on /ai-work#ashok from a link somebody sent them.

   So the story always renders. `mounted` is what makes that safe: on the
   server and on the very first client paint it is false, nothing is
   collapsed, and the document is complete. Only once the component is
   live does the collapse apply - which is also exactly the point at
   which the buttons that undo it start working. No-JS gets a page with
   the story open and two anchors that jump; everyone else gets the fork.

   `inert` rather than `display:none` on the collapsed state: it takes the
   whole subtree out of the tab order and off the accessibility tree in
   one attribute, while leaving the height animatable. A collapsed panel
   you can still tab into is the classic version of this bug.

   ---- why both doors are anchors ----

   lib/motion.ts binds every a[href^="#"] on the page to Lenis at boot,
   so an anchor gets the site's own smooth scroll for free and a button
   would have to reach into the scroller to get the same thing. "Yes"
   opens the panel on the way past; the scroll target is the top of that
   panel either way, which does not move when it expands.
   ============================================================ */
export default function AiGate({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const hold = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  const collapsed = mounted && !open;

  /* ---- and the part that is easy to miss ----

     initSite() gives every [data-reveal] and [data-split] in here a
     ScrollTrigger, and it measures them at boot - while this panel is
     collapsed to zero height and everything inside it is stacked at one
     point just under the gate. Those measurements are wrong the instant
     the panel opens, and wrong in the direction that hides content: a
     trigger whose start was computed below the fold and whose element
     has since moved will simply never fire, and the story's own type is
     held at autoAlpha 0 until it does. An empty page under a button that
     said "yes".

     So the triggers are re-measured once the row has finished growing.
     transitionend rather than a timer, because the timer and the CSS
     duration are two numbers that have to agree forever; the timer is
     only the fallback for the case where the transition never runs at
     all (reduced motion turns it off, and transitionend does not fire
     for a transition that did not happen). */
  useEffect(() => {
    if (!open) return;
    const el = hold.current;
    let done = false;
    const refresh = () => {
      if (done) return;
      done = true;
      ScrollTrigger.refresh();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === "grid-template-rows") refresh();
    };
    el?.addEventListener("transitionend", onEnd);
    const t = window.setTimeout(refresh, 900);
    return () => {
      el?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <>
      <section className="ai-gate" id="gate">
        <div className="wrap ai-gate__in">
          <p className="ai-gate__q" data-reveal>{AI_GATE.question}</p>

          <div className="ai-gate__doors" data-reveal>
            <a
              className="ai-gate__door ai-gate__door--yes"
              href="#ashok"
              onClick={() => setOpen(true)}
              data-magnetic
              data-cursor="Read it"
            >
              {AI_GATE.yes}
            </a>

            <a
              className="ai-gate__door"
              href="#ai-grid"
              data-magnetic
              data-cursor="Skip"
            >
              {AI_GATE.no}
            </a>
          </div>
        </div>
      </section>

      <div
        className="ai-hold"
        id="ashok"
        ref={hold}
        data-collapsed={collapsed ? "" : undefined}
        inert={collapsed}
      >
        {children}
      </div>
    </>
  );
}
