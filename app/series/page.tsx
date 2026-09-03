import type { Metadata } from "next";
import "./series.css";
import SeriesSections from "@/components/SeriesSections";
import SiteMotion from "@/components/SiteMotion";
import { ART, CONCEPT, HERO, META_DESCRIPTION, SERIES_CTA, TEXTURE } from "@/lib/series-content";

export const metadata: Metadata = {
  title: `${CONCEPT.title} · SoCheers`,
  description: META_DESCRIPTION,
};

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

   The first pass - fourteen beats, seven stagings, fourteen scroll
   mechanics, and the deck copy this rewrite replaced - is still in the
   tree at /series-1 and off the nav. See the note in NAV_LINKS
   (lib/content.ts) and lib/series-v1.ts.
   ============================================================ */

/* The highlighter block, on the last words of the title card. Split
   rather than hard-coded so HERO stays the only place the line and the
   accented words are spelled; `accent` is matched off the end of the
   line, because on a title card the block belongs where the sentence
   lands rather than in the middle of it. */
const titleParts = (line: string, accent: string) => {
  const at = line.lastIndexOf(accent);
  return at < 0 ? { head: line, tail: "" } : { head: line.slice(0, at), tail: accent };
};

export default function Series() {
  const title = titleParts(HERO.line, HERO.accent);

  return (
    <>
      <main id="top" className="st-page">
        {/* ---- SECTION 1, the title card ------------------------------
            The client's first section is one sentence and nothing else,
            which is what a cold open is - so it is the card rather than
            the first screen of the story. Six layers, staged in CSS
            only: ground, frames, scrim, type, grade, gate. The one bit
            of motion is an entrance. See .st-hero in series.css.
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
              {title.tail && <em className="st-hi">{title.tail}</em>}
            </h1>
          </div>

          <span className="st-hero__cue" aria-hidden="true">
            <i />
            {HERO.cue}
          </span>
        </header>

        <SeriesSections />
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
