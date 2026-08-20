import type { Metadata } from "next";
import "./ai.css";
import { Nav, Overlays } from "@/components/Chrome";
import AiMotion from "@/components/AiMotion";
import AiGate from "@/components/AiGate";
import AiThoughts from "@/components/AiThoughts";
import AiStory from "@/components/AiStory";
import AiGrid from "@/components/AiGrid";
import { AI_HERO } from "@/lib/ai-content";

export const metadata: Metadata = {
  title: "AI Work · SoCheers",
  description:
    "Films, statics and CGI made with AI at SoCheers - and the argument for why the strategy in front of the tool is still the part that decides anything.",
};

/* ============================================================
   AI WORK.

   Under a minute end to end, which is the brief's own measure and the
   reason this page is short on set pieces: it is a hero, a fork, a story
   somebody can skip, and a wall of work.

   ---- one caveat, carried up from lib/ai-content.ts ----

   This tab has no written spec behind it - it is built from call notes
   alone, and the shared content doc had no AI Work section at all. The
   structure is the client's; every word is a stand-in. Worth confirming
   a spec does not exist somewhere before the copy gets signed off.
   ============================================================ */
export default function AiWork() {
  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/ai-work" />

      <main id="top" className="ai-page">
        <section className="ai-hero">
          <div className="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>

          {/* The reference treatment, and it is the ground the hero is set
              on rather than an object in the corner of it: the figure
              stands in the middle of the section and the noise coming out
              of his head covers the whole width. Decoration, and it says
              so - see components/AiThoughts.tsx. */}
          <AiThoughts />

          <div className="wrap ai-hero__in">
            <div className="ai-hero__copy">
              <span className="tag" data-reveal>{AI_HERO.eyebrow}</span>

              <h1 className="ai-hero__title" data-split>
                {/* Hard break, not a balanced wrap: the first sentence has to
                    finish on its own line ("make it" included) so the accent
                    sentence gets the whole bottom line to itself.

                    The space before the break is not cosmetic: initSplits()
                    in lib/motion.ts builds the screen-reader copy of this
                    heading from textContent, which drops the break element
                    entirely - without it the two sentences run together as
                    one word. */}
                {AI_HERO.lines[0]}{" "}<br />
                <em>{AI_HERO.lines[1]}</em>
              </h1>

              <p className="ai-hero__lede" data-reveal>{AI_HERO.lede}</p>
            </div>
          </div>
        </section>

        {/* The fork, and everything it guards. Both the story and the
            wall are handed to AiGate rather than rendered after it: until
            a door is picked, the page ends at the question - which is how
            the scroll stops there without anything hijacking the wheel.
            Both panels are still in the server's HTML; the collapse only
            applies once the component is live. See components/AiGate.tsx. */}
        <AiGate story={<AiStory />} work={<AiGrid />} />
      </main>

      <AiMotion />
    </>
  );
}
