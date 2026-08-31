import type { Metadata } from "next";
import "./series.css";
import SeriesTestStory from "@/components/SeriesTestStory";
import SiteMotion from "@/components/SiteMotion";
import { ART, CONCEPT, HERO, SERIES_CTA, TEXTURE } from "@/lib/series-content";

export const metadata: Metadata = {
  title: `${CONCEPT.title} · SoCheers`,
  /* the standfirst on the card itself - the tab describes itself the
     same way in a search result as it does on the screen */
  description: HERO.standfirst,
};

/* ============================================================
   SERIES - the flat pass, and the live tab.

   This started as /series-test, the scratch route: the same copy as the
   first pass, in the same order, staged flat - every section is the
   sentence on the left and four frames on the right, and nothing moves.
   It was there to see whether the argument survives without the fourteen
   mechanics carrying it. It does, so it is the tab now.

   The pass it replaced is still in the tree at /series-1 and off the
   nav - see the note in NAV_LINKS (lib/content.ts).

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
/* The name, with its last word carrying the page's highlighter block -
   the same device the beats use on one word of a line, spent here on
   the word the concept is named for. Split rather than hard-coded so
   CONCEPT stays the only place the title is spelled. */
const titleParts = (full: string) => {
  const at = full.lastIndexOf(" ");
  return at < 0 ? { head: "", last: full } : { head: full.slice(0, at + 1), last: full.slice(at + 1) };
};

export default function SeriesTest() {
  const title = titleParts(CONCEPT.title);

  return (
    <>
      <main id="top" className="st-page">
        {/* ---- the title card -------------------------------------
            The opening screen is the one place this page is allowed to
            be a picture before it is an argument. Same seven layers as
            a poster beat on /series-1 - ground, frames, scrim, type,
            a frame lifted in FRONT of the words, grade, gate - staged
            in CSS only, because this route still runs no scroll work.
            The one bit of motion is an entrance: the gate opens, the
            frames settle, the type rises. See .st-hero in series.css.
            ---------------------------------------------------------- */}
        <header className="st-hero">
          <div className="st-hero__stage" aria-hidden="true">
            {/* 0 - the room the composition hangs in */}
            <img
              className="st-fill st-hero__ground"
              src={ART(HERO.frames[0])}
              alt=""
              fetchPriority="high"
            />

            {/* 1 - the frames, overlapping rather than tiling */}
            <div className="st-hero__frames">
              {HERO.frames.map((f, i) => (
                <span className="st-hero__frame" key={f} style={{ ["--i" as string]: i }}>
                  <img src={ART(f)} alt="" decoding="async" />
                </span>
              ))}
            </div>

            {/* 2 - ground for the type */}
            <span className="st-hero__scrim" />

            {/* 3 - the grade */}
            <img className="st-grain" src={ART(TEXTURE.grain)} alt="" decoding="async" />

            {/* 4 - the letterbox */}
            <span className="st-gate st-gate--t" />
            <span className="st-gate st-gate--b" />
          </div>

          <div className="wrap st-hero__type">
            <span className="st-hero__tag">{HERO.tag}</span>
            <h1 className="st-hero__title">
              {title.head}
              <em className="st-hi">{title.last}</em>
            </h1>
            <p className="st-hero__note">{HERO.standfirst}</p>
          </div>

          {/* 5 - the frame in front of the words. Outside the stage so
              it sits over the type rather than under it, which is the
              layer that gives the card depth. */}
          <span className="st-hero__inset" aria-hidden="true">
            <img src={ART(HERO.inset)} alt="" decoding="async" />
          </span>

          <span className="st-hero__cue" aria-hidden="true">
            <i />
            {HERO.cue}
          </span>
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
