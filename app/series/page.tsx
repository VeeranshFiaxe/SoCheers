import type { Metadata } from "next";
import "./series.css";
import { Nav, Overlays } from "@/components/Chrome";
import SeriesMotion from "@/components/SeriesMotion";
import SeriesStory from "@/components/SeriesStory";
import SeriesSwitch from "@/components/SeriesSwitch";
import { SeriesCta, SeriesExamples, SeriesProcess, SeriesReels } from "@/components/SeriesEnd";
import {
  CONCEPT, DEFAULT_TREATMENT, isTreatment, SERIES_CTA,
} from "@/lib/series-content";

export const metadata: Metadata = {
  title: `${CONCEPT.title} · SoCheers`,
  description:
    "Post-lockdown the audience stopped hunting for discovery and started hunting for lore. The micro series is what that behaviour is asking for - and SoCheers builds them.",
};

/* ============================================================
   SERIES.

   One page, one scroll, no click-through. The Netflix pattern - a wall of
   preview tiles you pick from - was proposed for this tab and turned
   down, and the reason is worth keeping written down: a tile wall asks
   the reader to choose what to look at, and the argument here only lands
   in order. You cannot skip to the middle of an insight.

   ---- the treatment ----

   `?t=film | still | type` picks the direction; anything else falls back
   to DEFAULT_TREATMENT. It is read on the server and written onto <main>
   as a data attribute, so the whole page arrives already in the right
   direction - no flash, no client state, and the URL is shareable, which
   is the point of a thing built for a client to review async.

   ---- what is not real yet ----

   The stat, the four example seasons, the reel links and the Tito Films
   URL are all marked PENDING in lib/series-content.ts. The imagery is
   lifted from the client's own deck and is placeholder for the same
   reason - it is their reference, not their licence.
   ============================================================ */
export default async function Series({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const treatment = isTreatment(t) ? t : DEFAULT_TREATMENT;

  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/series" />

      <main id="top" className="s-page" data-treatment={treatment}>
        {/* The episode rail. Fixed, hairline, and only alive while the
            story is - see initSeries() in lib/series-motion.ts. */}
        <aside className="s-rail" aria-hidden="true">
          <span className="s-rail__label">EP</span>
          <span className="s-rail__num" data-s-num>01</span>
          <span className="s-rail__track">
            <i data-s-fill />
          </span>
        </aside>

        <SeriesStory treatment={treatment} />

        {/* Past here the page is the same in every direction - the story
            is the thing being compared, the evidence under it is not. */}
        <SeriesProcess />
        <SeriesExamples />
        <SeriesReels />
        <SeriesCta />

        {/* REVIEW TOOL - comes out with the treatment decision. See the
            note at the top of components/SeriesSwitch.tsx. */}
        <SeriesSwitch active={treatment} />
      </main>

      {/* The production house, at the foot of the page by name, because
          the client asked for it there specifically and the CTA above
          hands off to it too. Kept out of the CTA block so the page ends
          on a credit rather than on a second button. */}
      <footer className="s-foot">
        <div className="wrap s-foot__in">
          <span>{CONCEPT.title}</span>
          <a href={SERIES_CTA.secondary.href} target="_blank" rel="noopener noreferrer">
            Produced with {SERIES_CTA.secondary.label}
          </a>
        </div>
      </footer>

      <SeriesMotion />
    </>
  );
}
