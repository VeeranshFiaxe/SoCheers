import type { Metadata } from "next";
import "./series-test.css";
import SeriesTestStory from "@/components/SeriesTestStory";
import SiteMotion from "@/components/SiteMotion";
import { CONCEPT, SERIES_CTA } from "@/lib/series-content";

export const metadata: Metadata = {
  title: `${CONCEPT.title} · Series 2.0 · SoCheers`,
  description: "A flat, static pass at the Series tab - one layout for every beat.",
  /* a comparison sheet, not a page anyone should land on from search */
  robots: { index: false, follow: false },
};

/* ============================================================
   SERIES 2.0 - a scratch route.

   /series is untouched and stays the live tab. This is the same copy,
   in the same order, staged flat: every section is the sentence on the
   left and four frames on the right, and nothing moves.

   It exists to see whether the argument survives without the fourteen
   mechanics carrying it, and it is meant to be thrown away. Deleting it
   is deleting app/series-test/ and components/SeriesTestStory.tsx, plus
   the second Series entry in NAV_LINKS.

   ---- what "static" means here, and what it does not ----

   initSeries() is not mounted: none of the fourteen scroll mechanics
   run, and every piece of this page's own staging sits at rest.

   SiteMotion IS mounted, and has to be. initSite() owns the chrome that
   belongs to the whole site rather than to any one route - the custom
   cursor and its ring, the spotlight, the scroll-progress bar and the
   Lenis scroll. All four are markup in app/layout.tsx that never moves
   or lights up until initSite() reaches it, so a route without it is
   not a still version of the site, it is the site with its cursor
   missing. That was the first thing anyone noticed.

   It is also why the feed and CTA blocks from the live tab are still
   not reused: those are built around [data-split], which is a different
   argument - a heading that only exists once a splitter has run.
   ============================================================ */
export default function SeriesTest() {
  return (
    <>
      <main id="top" className="st-page">
        <header className="st-head">
          <div className="wrap">
            <span className="st-head__tag">Series 2.0 · static pass</span>
            <h1 className="st-head__title">{CONCEPT.title}</h1>
            <p className="st-head__note">
              The same story as the Series tab, staged flat - one treatment for every
              section, no scroll work. Here to be read against the live one.
            </p>
          </div>
        </header>

        <SeriesTestStory />
      </main>

      <footer className="st-foot">
        <div className="wrap st-foot__in">
          <span>{CONCEPT.title}</span>
          <a href={SERIES_CTA.secondary.href} target="_blank" rel="noopener noreferrer">
            Produced with {SERIES_CTA.secondary.label}
          </a>
        </div>
      </footer>

      {/* the shared engine only - no initSeries(). See the note above. */}
      <SiteMotion />
    </>
  );
}
