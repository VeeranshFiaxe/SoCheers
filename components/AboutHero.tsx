import { HERO } from "@/lib/about-content";

/* 1 · the opener.

   The film, and one block of type standing on it. It ran for a while as
   the film alone with nothing written across it, which left the page
   opening on a mood rather than on a claim.

   The block is the page's name over the page's line over the discipline
   line, in that order and on one left margin, sitting near the middle of the frame rather than up in
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
          {/* Ours, off our own deploy. This ran off the old WordPress
              install for a while - nine megabytes fetched from a server
              that has nothing to do with this site being up, so every
              load of this page was a bet on someone else's box. It is
              half the size now and it ships with the page.

              The poster is the film's first frame, so the opener is the
              picture the moment the markup lands and stays it whatever
              the network does; autoplay here is a request, not a
              guarantee, and initAbout re-asks until it takes (see
              lib/autoplay.ts). muted is what makes the request askable
              at all - a film with sound is never allowed to start
              itself, and this one has no audio track to begin with. */}
          <video
            data-ab-film
            poster="/media/about-hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src="/media/about-hero.mp4"
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

        {/* What the claim above is made of. Back under the headline where
            it opened the first build of this page: the line says what the
            work is for, this says what it takes, and the disciplines it
            names are the thread the rest of the page pulls on. Its own
            spans so each line reveals as a line rather than the block
            fading in as one lump. */}
        <p className="ab-open__sub">
          {HERO.sub.map((line) => (
            <span key={line} data-reveal>{line}</span>
          ))}
        </p>
      </div>

      <div className="ab-open__cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="ab-open__cue-line" />
      </div>
    </section>
  );
}
