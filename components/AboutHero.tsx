import { HERO } from "@/lib/about-content";

/* 1 · the opener.

   The film, and one label. This carried the client's line ("We turn ideas
   into impact.") at full size with a sub under it; both are gone, and what
   is left is the footer row - the page's name bottom left, the scroll cue
   bottom right, the film between them with nothing written across it.

   The name is the <h1>. It is the only heading the section has now, and a
   page still needs one: it is set as a .tag like every other label on the
   page rather than as a headline, so it reads as a caption and not as a
   line of copy. */
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

      <h1 className="tag ab-open__eyebrow" data-reveal>{HERO.eyebrow}</h1>

      <div className="ab-open__cue" aria-hidden="true">
        <span>SCROLL</span>
        <span className="ab-open__cue-line" />
      </div>
    </section>
  );
}
