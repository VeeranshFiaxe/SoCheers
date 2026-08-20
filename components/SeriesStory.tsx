import { ART, BEATS, CONCEPT, isFilm, STAT, type Beat } from "@/lib/series-content";

/* ============================================================
   THE SCROLL - component one of two.

   Server component, no state anywhere. Every beat in lib/series-content
   .ts comes through here, and the beat's `shot` picks which of the eight
   staging functions below draws it.

   ---- why staging rather than layout ----

   The page this replaces drew every beat the same way - a photograph
   behind, a line in front, a parallax on the picture - and offered three
   skins of that arrangement to choose between. The brief that came back
   asked for the opposite thing: cinema that is driven by the scroll, and
   a visual that pairs with the sentence beside it rather than sitting
   near it. Those two asks are the same ask. A frame that drifts is a
   background; a frame that squeezes into a phone exactly while the line
   says everything moved behind the screen is the argument.

   So there is no generic beat renderer any more. There are eight, they
   are all in this file, and each one exists because a specific sentence
   in the deck needed it.

   ---- the films ----

   Nothing here calls play(). A <video> is rendered inert - no src, no
   autoplay, preload="none" - and lib/series-motion.ts attaches the
   source and starts it the first time the beat is on screen, then pauses
   it the moment it is not. That keeps this a server component, keeps a
   page with three films on it from opening three sockets on load, and
   means a reader who never reaches the wall never downloads it.

   ---- the gate ----

   Every stage carries a top and bottom band - the letterbox. They are
   real elements rather than a gradient because the scroll animates them:
   the gate opens as a beat arrives and closes as it leaves, which is the
   one piece of motion the whole page shares and the reason fifteen very
   different mechanics still read as one reel.
   ============================================================ */

/* ---------- the atoms ---------------------------------------------- */

/* One frame. A film if the file is one, a still if it is not - so a
   frames[] array can mix the two and no caller has to branch. */
function Frame({ file, poster, className }: { file: string; poster?: string; className?: string }) {
  if (isFilm(file)) {
    return (
      <video
        className={className}
        /* the src is attached on first intersection - see playFilms() */
        data-film={ART(file)}
        poster={poster ? ART(poster) : undefined}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
    );
  }
  return <img className={className} src={ART(file)} alt="" loading="lazy" decoding="async" />;
}

/* The letterbox. Two bands, animated open and shut by the scroll. */
function Gate() {
  return (
    <>
      <span className="sgate sgate--t" data-gate aria-hidden="true" />
      <span className="sgate sgate--b" data-gate aria-hidden="true" />
    </>
  );
}

/* The words. Identical in every shot, because the one thing that must
   not change from beat to beat is the voice - a story that resets its
   type scale every screen reads as a deck of slides rather than as one
   piece. What the shot changes is where this block sits and what is
   behind it, never how it is set. */
function Type({ beat }: { beat: Beat }) {
  return (
    <div className="wrap sbeat__type">
      {beat.eyebrow && (
        <span className="tag" data-reveal>
          {beat.eyebrow}
        </span>
      )}

      {beat.lines.length > 0 && (
        <h2 className="sbeat__line" data-split>
          {beat.lines.join(" ")}
        </h2>
      )}

      {beat.copy && (
        <p className="sbeat__copy" data-reveal>
          {beat.copy}
        </p>
      )}

      {/* twelve months, drawn as you read the sentence about twelve
          months, and the last one joins back to the first. Only the
          discipline beat asks for it. */}
      {beat.ticks && <Ruler />}
    </div>
  );
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function Ruler() {
  return (
    <div className="sruler" data-ruler aria-hidden="true">
      <span className="sruler__line">
        <i data-ruler-fill />
      </span>
      <span className="sruler__marks">
        {MONTHS.map((m) => (
          <b key={m} data-ruler-mark>
            {m}
          </b>
        ))}
      </span>
      {/* the return. It is drawn last, points backwards, and only appears
          once the ruler has actually reached December. */}
      <span className="sruler__loop" data-ruler-loop>
        <svg viewBox="0 0 40 12" width="40" height="12" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M39 1v6a4 4 0 0 1-4 4H1M5 7l-4 4 4 4" />
        </svg>
        <em>and back again</em>
      </span>
    </div>
  );
}

/* The slate in the corner of the frame. A label, not a caption. */
function Slate({ beat, index }: { beat: Beat; index: number }) {
  if (!beat.slate) return null;
  return (
    <span className="sbeat__slate" aria-hidden="true">
      <b>{String(index + 1).padStart(2, "0")}</b>
      {beat.slate}
    </span>
  );
}

/* ---------- the eight shots ---------------------------------------- */

/* TITLE - the card. One frame held full-bleed, the line set at title
   size over it, the gate doing the work on the way in and out. Three
   beats use it and they are the three that name something: the opening,
   the kink itself, and the end card. */
function ShotTitle({ beat }: { beat: Beat }) {
  const art = beat.art;
  return (
    <div className="sbeat__stage" data-stage>
      {beat.film ? (
        <Frame className="sfill" file={beat.film} poster={art} />
      ) : (
        art && <Frame className="sfill" file={art} />
      )}
      <span className="sscrim" aria-hidden="true" />
      <Gate />
    </div>
  );
}

/* MOSAIC - the wall. Twelve windows for abundance, nine for noise, and
   the difference between the two is entirely in how they arrive: the
   first tiles in cleanly on the scroll, the second is thrown at the
   screen mistimed and slightly out of register.

   The tiles are marked with an index so the motion can stagger them
   without measuring anything, and the two films in the abundance wall
   are the only moving things on it. */
function ShotMosaic({ beat }: { beat: Beat }) {
  const frames = beat.frames ?? [];

  /* A film's poster is the nearest still above it in the same wall.
     Without one, the two moving windows are black holes in the grid for
     anybody on reduced motion or a slow connection - and the wall is an
     argument about abundance, which twelve tiles make and ten do not. */
  const posterFor = (i: number) => {
    for (let j = i - 1; j >= 0; j--) if (!isFilm(frames[j])) return frames[j];
    return frames.find((f) => !isFilm(f));
  };

  return (
    <div className="sbeat__stage" data-stage>
      <div className="smos" data-mos data-jitter={beat.jitter ? "" : undefined}>
        {frames.map((f, i) => (
          <span className="smos__win" data-win style={{ ["--i" as string]: i }} key={`${f}-${i}`}>
            <Frame file={f} poster={isFilm(f) ? posterFor(i) : undefined} />
          </span>
        ))}
      </div>
      <span className="sscrim sscrim--heavy" aria-hidden="true" />
      <Gate />
    </div>
  );
}

/* APERTURE - the squeeze. The frame starts full-bleed and is closed by
   the letterbox into a 9:16 phone as the beat is read. One beat, and it
   is the one whose sentence is that everything moved behind the screen.

   The phone's own chrome is drawn as a border on the box rather than as
   a picture of a handset: a literal device mockup dates the page the
   moment the hardware does. */
function ShotAperture({ beat }: { beat: Beat }) {
  return (
    <div className="sbeat__stage" data-stage>
      <div className="sap" data-aperture>
        {beat.art && <Frame className="sfill" file={beat.art} />}
        <span className="sscrim" aria-hidden="true" />
      </div>
      <Gate />
    </div>
  );
}

/* STRIP - the poster reference. The frame is cut into four letterboxed
   bands stacked down the screen, each holding its own crop and each
   travelling at its own rate as you scroll, so a set of stills reads as
   something moving without a single frame of video.

   `reverse` runs the bands against the scroll. That variant is used once,
   on the beat about the mind returning to what it already knows. */
function ShotStrip({ beat }: { beat: Beat }) {
  const frames = beat.frames ?? [];
  return (
    <div className="sbeat__stage" data-stage>
      <div className="sstrip" data-strip data-reverse={beat.reverse ? "" : undefined}>
        {frames.map((f, i) => (
          <span className="sstrip__band" data-band style={{ ["--i" as string]: i }} key={`${f}-${i}`}>
            <Frame file={f} />
          </span>
        ))}
      </div>
      <span className="sscrim sscrim--band" aria-hidden="true" />
      <Gate />
    </div>
  );
}

/* REEL - eight verticals in a row that close up into a stack as the beat
   is read. The sentence is eight episodes compressed into the cycle of
   the scroll; the row compresses. */
function ShotReel({ beat }: { beat: Beat }) {
  const frames = beat.frames ?? [];
  return (
    <div className="sbeat__stage" data-stage>
      <div className="sreel" data-reelrow>
        {frames.map((f, i) => (
          <span className="sreel__ep" data-ep style={{ ["--i" as string]: i }} key={`${f}-${i}`}>
            <Frame file={f} />
            <b className="sreel__n">{String(i + 1).padStart(2, "0")}</b>
          </span>
        ))}
      </div>
      <span className="sscrim sscrim--low" aria-hidden="true" />
      <Gate />
    </div>
  );
}

/* PHONE - one vertical held beside the type, at the ratio it was shot
   at. Covering 9:16 footage into a widescreen hole throws away three
   quarters of the picture, and on the beat that is about what people
   watch on their phones that is the wrong three quarters. */
function ShotPhone({ beat }: { beat: Beat }) {
  return (
    <div className="sbeat__stage" data-stage>
      <div className="sphone" data-phone>
        {beat.art && <Frame className="sfill" file={beat.art} />}
        <span className="sphone__glass" aria-hidden="true" />
      </div>
      <Gate />
    </div>
  );
}

/* HELD - one frame, one slow push in, the line over it. The quiet shot,
   and the page needs it: four of these are spaced through the story so
   the mechanics either side of them land as beats rather than as a
   sequence of tricks. */
function ShotHeld({ beat }: { beat: Beat }) {
  return (
    <div className="sbeat__stage" data-stage>
      {beat.art && <Frame className="sfill" file={beat.art} />}
      <span className="sscrim" aria-hidden="true" />
      <Gate />
    </div>
  );
}

/* FIGURE - the stat, and the only beat where the picture is deliberately
   almost gone. A number is the one thing on a page like this a reader
   will repeat out loud, so it gets a screen with nothing to compete with
   and it is marked as provisional in the UI as well as in the source -
   a placeholder that looks finished is worse than no placeholder. */
function ShotFigure({ beat }: { beat: Beat }) {
  return (
    <div className="sbeat__stage" data-stage>
      {beat.art && <Frame className="sfill sfill--ghost" file={beat.art} />}
      <span className="sscrim sscrim--heavy" aria-hidden="true" />
      <Gate />
    </div>
  );
}

const SHOTS = {
  title: ShotTitle,
  mosaic: ShotMosaic,
  aperture: ShotAperture,
  strip: ShotStrip,
  reel: ShotReel,
  phone: ShotPhone,
  held: ShotHeld,
  figure: ShotFigure,
} as const;

/* The stat's own type block replaces the standard one - it is a number
   and a source rather than a line and a paragraph. */
function StatType() {
  return (
    <div className="wrap sbeat__type">
      <div className="s-stat">
        <span className="s-stat__figure" data-count>
          {STAT.figure}
        </span>
        <p className="s-stat__claim" data-reveal>
          {STAT.claim}
        </p>
        <span className="s-stat__src" data-reveal>
          {STAT.source}
        </span>
      </div>
    </div>
  );
}

export default function SeriesStory() {
  return (
    <div className="s-story" data-s-story>
      {BEATS.map((beat, i) => {
        const Shot = SHOTS[beat.shot];
        return (
          <section
            key={beat.id}
            id={`beat-${beat.id}`}
            className="sbeat"
            data-beat={beat.id}
            data-shot={beat.shot}
            /* read by the rail in lib/series-motion.ts to number the episode */
            data-beat-index={i}
          >
            <Shot beat={beat} />
            {beat.shot === "figure" ? <StatType /> : <Type beat={beat} />}
            <Slate beat={beat} index={i} />
          </section>
        );
      })}

      {/* The concept's name, once, as a plate - the reader has just been
          told they proved the loop, and this is what the loop is called.
          It is the only place on the page the name is set at size. */}
      <section className="s-plate" aria-label={CONCEPT.title}>
        <span className="s-plate__mark" data-split>
          {CONCEPT.title}
        </span>
        <span className="s-plate__sub" data-reveal>
          A SoCheers original
        </span>
      </section>
    </div>
  );
}
