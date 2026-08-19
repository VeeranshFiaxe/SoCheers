import { HERO } from "@/lib/about-content";

/* 1 · the opener.

   The film, and one block of type standing on it. It ran for a while as
   the film alone with nothing written across it, which left the page
   opening on a mood rather than on a claim.

   The block is the page's name over the page's line, in that order and on
   one left margin, sitting near the middle of the frame rather than up in
   the corner - a label above a headline is how every other section on
   this site introduces itself, and the opener had no reason to be the
   exception. The name is still the <h1>: it is the page's title, where
   the line under it is the page's argument.

   The scroll cue keeps the bottom right to itself. */
export default function AboutHero() {
  return (
    <section className="ab-open" data-sec="0">
      <div className="ab-open__media" data-ab-parallax>
        <div className="ab-open__mediaIn">
          <video
            src="https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>

      {/* two scrims, one job each: the wash gives the type its ground,
          the veil hands off to the panel below with no seam */}
      <span className="ab-open__wash" aria-hidden="true" />
      <span className="ab-open__veil" aria-hidden="true" />

      {/* One block, in normal flow - the section is a flex row centred on
          its cross axis, so the stack finds the middle of the film on its
          own and nothing here is positioned against an edge. */}
      <div className="ab-open__intro">
        <h1 className="tag ab-open__eyebrow" data-reveal>{HERO.eyebrow}</h1>

        {/* the em stays inline: a nested block tag gets cloned onto every
            visual line SplitText wraps to, so it can carry colour and
            style but never a margin */}
        <p className="ab-open__line" data-split>
          {HERO.line} <em>{HERO.lineAccent}</em>
        </p>
      </div>

      <div className="ab-open__cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="ab-open__cue-line" />
      </div>
    </section>
  );
}
