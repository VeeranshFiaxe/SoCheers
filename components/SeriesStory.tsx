import { BEATS, STAT, ART, CONCEPT, type Beat, type TreatmentId } from "@/lib/series-content";

/* ============================================================
   THE SCROLL, one beat at a time.

   Server component. Every beat in lib/series-content.ts renders through
   this one function, and the treatment only ever changes how a beat is
   *composed* - the markup is identical in all three, and app/series/
   series.css does the rest off [data-treatment] on the page root.

   That is the whole reason the switcher is cheap: there is no second
   component tree to keep in step, so a copy change lands in all three
   directions at once and the client is genuinely comparing treatments
   rather than three pages that drifted.

   The one place the treatment reaches into the markup is the opening
   beat's video, which the "still" and "type" directions must not load at
   all - a <video> that CSS has hidden is still a download.
   ============================================================ */

/* PENDING CLIENT FOOTAGE - the site's existing banner film, standing in
   for the opener's moving frame. The real one is a cut from the micro
   series work; when it arrives this is the only line that changes. */
const OPEN_FILM =
  "https://www.socheers.net/wp-content/uploads/2024/12/home-banner-video.mp4";

function StatBlock() {
  return (
    <div className="s-stat" data-reveal>
      <span className="s-stat__figure">{STAT.figure}</span>
      <p className="s-stat__claim">{STAT.claim}</p>
      <span className="s-stat__src">{STAT.source}</span>
    </div>
  );
}

function BeatArt({ beat, treatment }: { beat: Beat; treatment: TreatmentId }) {
  /* The type direction draws no pictures at all, so it renders none -
     `display:none` would still cost the fetch, and the whole point of
     that direction is that it is the light one. */
  if (treatment === "type" || !beat.art) return null;

  const film = beat.id === "open" && treatment === "film";

  return (
    <div className="sbeat__art" data-sbeat-art aria-hidden="true">
      {film ? (
        <video src={OPEN_FILM} autoPlay muted loop playsInline data-sbeat-img />
      ) : (
        <img src={ART(beat.art)} alt="" data-sbeat-img />
      )}
      {/* the scrim, and it is not decoration: every one of these frames is
          a graded night interior and the type over it is cream. Without a
          ground the line survives on the dark half of the frame and
          disappears on the lamp. */}
      <span className="sbeat__scrim" />
    </div>
  );
}

function BeatBody({ beat }: { beat: Beat }) {
  if (beat.id === "stat") return <StatBlock />;

  return (
    <>
      {beat.eyebrow && (
        <span className="tag" data-reveal>
          {beat.eyebrow}
        </span>
      )}

      <h2 className="sbeat__line" data-split>
        {beat.lines.join(" ")}
      </h2>

      {beat.copy && (
        <p className="sbeat__copy" data-reveal>
          {beat.copy}
        </p>
      )}
    </>
  );
}

export default function SeriesStory({ treatment }: { treatment: TreatmentId }) {
  return (
    <div className="s-story" data-s-story>
      {BEATS.map((beat, i) => (
        <section
          key={beat.id}
          id={`beat-${beat.id}`}
          className="sbeat"
          data-beat={beat.id}
          data-weight={beat.weight}
          data-tall={beat.tall ? "" : undefined}
          /* read by the rail in lib/series-motion.ts to number the episode */
          data-beat-index={i}
        >
          <BeatArt beat={beat} treatment={treatment} />

          <div className="wrap sbeat__type">
            <BeatBody beat={beat} />
          </div>
        </section>
      ))}

      {/* The concept's name, once, as a plate - the reader has just been
          told they proved the loop, and this is what the loop is called.
          It is the only place on the page the name is set at size. */}
      <section className="s-plate" aria-label={CONCEPT.title}>
        <span className="s-plate__mark" data-reveal>
          {CONCEPT.title}
        </span>
      </section>
    </div>
  );
}
