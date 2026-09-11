import type { Metadata } from "next";
import "./series.css";
import SeriesSections from "@/components/SeriesSections";
import SiteMotion from "@/components/SiteMotion";
import { pageMeta } from "@/lib/seo";
import {
  ART,
  CONCEPT,
  FOOT_CREDIT,
  HERO,
  META_DESCRIPTION,
  SERIES_CTA,
  TEXTURE,
} from "@/lib/series-content";

export const metadata: Metadata = pageMeta({
  title: `${CONCEPT.title} · SoCheers`,
  description: META_DESCRIPTION,
  path: "/series",
});

/* ============================================================
   SERIES - the tab.

   Ten sections, staged. Section 1 is the title card below; 2 through 10
   are SECTIONS in lib/series-content.ts, rendered by
   components/SeriesSections.tsx.

   ---- what "static" means here, and what it does not ----

   initSeries() is not mounted: none of the fourteen scroll mechanics
   the earlier pass carried run on this route, and every piece of this
   page's own staging sits at rest. Two things move and both are CSS -
   the title card's entrance, once, on load, and the showcase rows on
   section 9, because the client's brief for that section is the words
   "rapid visual sequence" and a still grid is not one. Both are off
   under prefers-reduced-motion.

   SiteMotion IS mounted, and has to be. initSite() owns the chrome that
   belongs to the whole site rather than to any one route - the custom
   cursor and its ring, the spotlight, the scroll-progress bar and the
   Lenis scroll. All four are markup in app/layout.tsx that never moves
   or lights up until initSite() reaches it, so a route without it is
   not a still version of the site, it is the site with its cursor
   missing. That was the first thing anyone noticed.
   ============================================================ */

export default function Series() {
  return (
    <>
      <main id="top" className="st-page">
        {/* ---- SECTION 1, the title card ------------------------------
            The client's first section is one sentence and nothing else,
            which is what a cold open is - so it is staged as the first
            frame of an episode rather than as a poster for one. One
            plate held full bleed and pushed back, the letterbox over
            it, and the line set small and centred in the middle of the
            screen. No slate, no cue, no highlighter block: the beat is
            the two seconds where the screen is only the sentence. See
            .st-hero in series.css.
            ---------------------------------------------------------- */}
        <header className="st-hero">
          <div className="st-hero__stage" aria-hidden="true">
            {/* 0 - the plate, one picture, edge to edge */}
            <img
              className="st-fill st-hero__plate"
              src={ART(HERO.still)}
              alt=""
              fetchPriority="high"
            />

            {/* 1 - ground for the type */}
            <span className="st-hero__scrim" />

            {/* 2 - the grade */}
            <img className="st-grain" src={ART(TEXTURE.grain)} alt="" decoding="async" />

            {/* 3 - the letterbox */}
            <span className="st-gate st-gate--t" />
            <span className="st-gate st-gate--b" />
          </div>

          <div className="wrap st-hero__type">
            <h1 className="st-hero__title">{HERO.line}</h1>
          </div>
        </header>

        <SeriesSections />
      </main>

      <footer className="st-foot">
        <div className="wrap st-foot__in">
          {/* the credit, and the one outbound link on the route. The two
              glyphs are what tell a reader the name is a place rather
              than a credit line: a globe for "this is a site", an arrow
              leaving its box for "and it opens away from here". */}
          <a
            className="st-foot__site"
            href={SERIES_CTA.secondary.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="st-foot__globe" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3c2.7 2.9 2.7 15.1 0 18-2.7-2.9-2.7-15.1 0-18Z" />
            </svg>
            {/* one flex item, not four. .st-foot__site is an inline-flex
                row with a .7em gap on it - that gap is the air around
                the two glyphs, and a bare run of text beside them
                becomes an anonymous flex item that takes the gap too,
                which would open a hole in the middle of the sentence.
                The whole credit sits in one span, and the name inside
                it is a normal inline <b> spaced by the space before it.

                That name is the only word in the line that is a place,
                so it is set in the leaf green rather than the cream the
                rest of the credit runs in: the two glyphs were telling
                a reader the line goes somewhere but not WHICH part of
                it is the destination. Now the coloured word is the
                target and the arrow beside it says where it opens. */}
            <span className="st-foot__credit">
              {FOOT_CREDIT.lead}{" "}
              <span className="st-foot__sep" aria-hidden="true">
                {FOOT_CREDIT.joiner}
              </span>{" "}
              <b className="st-foot__name">{SERIES_CTA.secondary.label}</b>
            </span>
            <svg className="st-foot__out" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 16 16 8" />
              <path d="M9 8h7v7" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </footer>

      {/* the shared engine only - no initSeries(). See the note above. */}
      <SiteMotion />
    </>
  );
}
