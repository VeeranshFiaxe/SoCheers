import type { Metadata } from "next";
import "./series.css";
import { Nav, Overlays } from "@/components/Chrome";
import SeriesMotion from "@/components/SeriesMotion";
import SeriesStory from "@/components/SeriesStory";
import { SeriesClose, SeriesFeed } from "@/components/SeriesFeed";
import { CONCEPT, SERIES_CTA } from "@/lib/series-content";

export const metadata: Metadata = {
  title: `${CONCEPT.title} · SoCheers`,
  description:
    "Post-lockdown the audience stopped hunting for discovery and started hunting for lore. The micro series is what that behaviour is asking for - and SoCheers builds them.",
};

/* ============================================================
   SERIES.

   One page, one scroll, two components - the story you read, and the
   episodes as links out. That is the brief, verbatim, and it is worth
   keeping written down what it replaced.

   ---- what came out, and why ----

   1. THE NETFLIX WALL. A grid of preview tiles you pick from was
      proposed for this tab early and turned down. A tile wall asks the
      reader to choose what to look at, and the argument here only lands
      in order - you cannot skip to the middle of an insight.

   2. THE THREE TREATMENTS. The page carried a `?t=film|still|type`
      switcher so the client could compare directions on one URL. The
      direction is now chosen: cinematic, scroll-driven, footage over
      stills. Keeping the two that lost would be three pages drifting
      apart, so they are deleted rather than commented out.

   3. THE PROCESS AND THE EXAMPLE SEASONS. Two evidence sections that
      sat between the story and the feed. The revamped brief is two
      components; the how-it-gets-made belongs in a deck or on /contact,
      and the seasons *are* the feed.

   ---- what is not real yet ----

   The stat and the eight Instagram links are marked PENDING in
   lib/series-content.ts and are visibly marked in the UI too. The
   imagery is lifted from the client's own deck and is placeholder for
   the same reason - it is their reference, not their licence. Series
   footage does not exist in this repo at all: every beat can carry an
   mp4, three currently do, and the note over FILM in the content file
   says what to drop in when the cuts land.
   ============================================================ */
export default function Series() {
  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/series" />

      <main id="top" className="s-page">
        {/* The episode rail. Fixed, hairline, and only alive while the
            story is - see episodeRail() in lib/series-motion.ts. */}
        <aside className="s-rail" aria-hidden="true">
          <span className="s-rail__label">EP</span>
          <span className="s-rail__num" data-s-num>01</span>
          <span className="s-rail__track">
            <i data-s-fill />
          </span>
        </aside>

        {/* one - the story */}
        <SeriesStory />

        {/* two - the episodes, as links */}
        <SeriesFeed />

        <SeriesClose />
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
