import { HERO } from "@/lib/about-content";

/* 1 · the opener.

   This used to be the film with a field of eleven blurred colour orbs
   drifting over it and nothing else - no words at all. Two problems with
   that: a dozen large-radius CSS blurs repainting every frame is the most
   expensive thing on the page and it showed on anything but a fast
   machine, and the graphics were carrying the whole opener on their own
   while the client's own line ("We turn ideas into impact.") sat unused
   in lib/about-content.ts.

   So the treatment is inverted. The film is the only image, graded and
   scrimmed so type can live on it, and what opens the page is the line
   itself at full size. No blur filters, no per-frame colour field - the
   only thing that moves is the video, the scroll parallax already on it,
   and one hairline under the scroll cue. */
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

      {/* two scrims, one job each: the side wash gives the type its
          ground, the foot fade hands off to the panel below with no seam */}
      <span className="ab-open__wash" aria-hidden="true" />
      <span className="ab-open__veil" aria-hidden="true" />

      <div className="wrap ab-open__inner">
        <span className="tag ab-open__eyebrow" data-reveal>{HERO.eyebrow}</span>

        <h1 className="ab-open__title" data-split>
          {HERO.lines.join(" ")} <em>{HERO.accent}</em>
        </h1>

        <p className="ab-open__sub" data-reveal>{HERO.sub.join(" ")}</p>
      </div>

      <div className="ab-open__cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="ab-open__cue-line" />
      </div>
    </section>
  );
}
