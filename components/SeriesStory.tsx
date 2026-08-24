import SeriesCrossers from "@/components/SeriesCrossers";
import {
  ART,
  BEATS,
  CONCEPT,
  PLATE_STRIP,
  TEXTURE,
  isFilm,
  type Beat,
} from "@/lib/series-content";

/* ============================================================
   THE SCROLL - component one of two.

   Server component, no state anywhere. Every beat in lib/series-content
   .ts comes through here, and the beat's `shot` picks which of the seven
   staging functions below draws it.

   ---- why staging rather than layout ----

   The page this replaces drew every beat the same way - a photograph
   behind, a line in front, a parallax on the picture. The brief that
   came back asked for cinema driven by the scroll, and a visual that
   pairs with the sentence beside it rather than sitting near it. Those
   two asks are the same ask. A frame that drifts is a background; a
   frame that squeezes into a phone exactly while the line says
   everything moved behind the screen is the argument.

   ---- the poster, and why the title cards stopped being cards ----

   The second round of direction on this page was that the beats still
   read as separate blocks: a picture, then a sentence, then the next
   picture. The references sent with it are compositions - several frames
   working as one image, the type set *inside* the picture, and a subject
   cut out of its background and lifted across the frame edges so the
   thing has depth.

   ShotPoster is that, and the four beats that used to be flat title
   cards carry it. The layer order is the whole mechanic and it is worth
   writing down, because getting it wrong turns the effect back into a
   collage:

       1  the bands          the frames, clipped, parallaxing
       2  the scrim          ground for the type
       3  the back inset     a frame lifted out, BEHIND the words
       4  the type           kicker, the sentence, the mark, the copy
       5  the front insets   frames lifted out, IN FRONT of the words
       6  the cutout         the subject, on top of everything
       7  grain / leak       the grade, over the whole composition

   Layers 3 and 5 are the point. One picture plane behind the sentence
   and another in front of it is what stops a stack of frames reading as
   a stack, and it is why a beat can carry depth before anybody has cut a
   subject out for it.

   ---- the films ----

   Nothing here calls play(). A <video> is rendered inert - no src, no
   autoplay, preload="none" - and lib/series-motion.ts attaches the
   source and starts it the first time the beat is on screen, then pauses
   it the moment it is not. That keeps this a server component and means
   a reader who never reaches the wall never downloads it.

   ---- the gate ----

   Every stage carries a top and bottom band - the letterbox. They are
   real elements rather than a gradient because the scroll animates them:
   the gate opens as a beat arrives and shuts as it leaves, which is the
   one piece of motion the whole page shares and the reason fourteen very
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

/* The grade. Two files in the asset folder are sheets of texture rather
   than photographs - a grain plate and a warm light leak - and they were
   both wired up as full-bleed frames, which is why two beats used to
   render as an empty grey screen and an empty orange one. Laid over a
   composition they do the job they were shot for, and they are what
   makes five stills from five different shoots read as one picture. */
function Grade({ warm }: { warm?: boolean }) {
  return (
    <>
      <img
        className="sgrain"
        src={ART(TEXTURE.grain)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
      {warm && (
        <img
          className="sleak"
          src={ART(TEXTURE.leak)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );
}

/* The words. Identical in every shot that carries this block, because
   the one thing that must not change from beat to beat is the voice - a
   story that resets its type scale every screen reads as a deck of
   slides rather than as one piece. What the shot changes is where this
   block sits and what is behind it, never how it is set.

   The posters do not use it: their type lives inside the composition,
   which is the whole reason they exist. */
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

/* ---------- the seven shots ---------------------------------------- */

/* ------------------------------------------------------------------
   POSTER - the composition, and the shot the second round of direction
   was asked for by name.

   Two variants, and they are two different pictures rather than two
   skins of one:

     stack - the film-poster reference. Full-width letterbox bands of
             uneven height running the height of the screen, the sentence
             set at reading size high in the frame, and the mark set
             enormous across the middle of the stack with the subject
             rising through it. Used on the two beats that name the thing
             - the kink itself, and the end card.

     grid  - the editorial reference. Three frames at different sizes
             that overlap each other rather than tile, and a type block
             sitting on the corner of one of them with a plate behind it.
             Used on the two beats that open and turn - the cold open and
             the cure.

   The mark is not a [data-split] heading. Every other heading on the
   site is, and they are all plain text; this one carries a highlighted
   word inside it, and handing markup to a line splitter is how you get a
   heading that renders once correctly and then never again after a
   resize. It gets its own reveal in lib/series-motion.ts instead.
   ------------------------------------------------------------------ */

/* The highlight block, behind one word of the mark. The reference blocks
   a single word in a solid colour and lets the rest of the line sit on
   the picture; matching is case-insensitive and first-occurrence only,
   because a mark is one line of type and not a document. */
function Mark({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.toLowerCase().indexOf(accent.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="spost__hi">{text.slice(at, at + accent.length)}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

function ShotPoster({ beat }: { beat: Beat }) {
  const variant = beat.variant ?? "stack";
  const frames = beat.frames ?? [];
  const insets = beat.insets ?? [];

  /* the mark defaults to the beat's own line. When it is set explicitly
     the line becomes the sub - the sentence that sets the mark up - and
     is set at reading size above it rather than repeated. */
  const mark = beat.mark ?? beat.lines.join(" ");
  const sub = beat.mark ? beat.lines.join(" ") : "";

  /* Which side of the type a lifted frame lands on is a property of the
     variant, not of the array. The stack has type across its whole width
     and wants one frame behind the sentence and the rest in front of it;
     the grid has its type in a column down one side, where a frame
     behind it would simply be invisible, so everything is in front. */
  const back = variant === "stack" ? insets.slice(0, 1) : [];
  const front = variant === "stack" ? insets.slice(1) : insets;

  return (
    <div className="sbeat__stage" data-stage>
      <div className={`spost spost--${variant}`} data-poster data-variant={variant}>
        {/* 0 - the wall the poster hangs on. Stack only, and only because
            the stack is a bounded column: the black either side of it is
            the mount, and a mount with nothing behind it reads as a page
            that failed to fill rather than as a composition. The grid
            variant fills its own frame and does not need one. */}
        {variant === "stack" && frames[0] && !isFilm(frames[0]) && (
          <img
            className="spost__ground"
            src={ART(frames[0])}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* 1 - the frames */}
        <div className="spost__bands" data-pbands>
          {frames.map((f, i) => (
            <span
              className="spost__band"
              data-pband
              style={{ ["--i" as string]: i }}
              key={`${f}-${i}`}
            >
              <Frame file={f} />
            </span>
          ))}
        </div>

        {/* 2 - ground for the type */}
        <span className="spost__scrim" aria-hidden="true" />

        {/* 3 - the frame behind the words */}
        {back.map((f, i) => (
          <span className="spost__inset spost__inset--back" data-pinset key={`b-${f}-${i}`}>
            <img src={ART(f)} alt="" loading="lazy" decoding="async" />
          </span>
        ))}

        {/* 4 - the words, inside the picture */}
        <div className="spost__type">
          <div className="spost__head">
            {beat.eyebrow && (
              <span className="tag" data-reveal>
                {beat.eyebrow}
              </span>
            )}
            {sub && (
              <h2 className="spost__sub" data-split>
                {sub}
              </h2>
            )}
          </div>

          {/* when there is a sub, the sub is the heading and this is the
              plate under it, so it must not be a second <h2> */}
          {sub ? (
            <p className="spost__mark" data-poster-mark>
              <Mark text={mark} accent={beat.accent} />
            </p>
          ) : (
            <h2 className="spost__mark" data-poster-mark>
              <Mark text={mark} accent={beat.accent} />
            </h2>
          )}

          {beat.copy ? (
            <p className="spost__copy" data-reveal>
              {beat.copy}
            </p>
          ) : (
            <span className="spost__copy spost__copy--empty" aria-hidden="true" />
          )}
        </div>

        {/* 5 - the frames in front of the words */}
        {front.map((f, i) => (
          <span
            /* the slot is in the class rather than in an index custom
               property: these are spans among other spans, so a
               :nth-of-type rule in the stylesheet would count the scrim
               and the cutout too */
            className={`spost__inset spost__inset--front spost__inset--f${i}`}
            data-pinset
            style={{ ["--i" as string]: i }}
            key={`f-${f}-${i}`}
          >
            <img src={ART(f)} alt="" loading="lazy" decoding="async" />
          </span>
        ))}

        {/* 6 - the subject, over the type. The one layer that cannot be
            faked from a rectangular still: the background has to already
            be gone from the file. */}
        {beat.cutout && (
          <span className="spost__cut" data-pcut aria-hidden="true">
            <img src={ART(beat.cutout)} alt="" loading="lazy" decoding="async" />
          </span>
        )}

        {/* 7 - the grade */}
        <Grade warm={beat.warm} />
      </div>
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

/* STRIP - four frames, held as a filmstrip beside the type.

   ---- what this was, and why it changed ----

   Four full-bleed bands running the width of the screen. On a laptop
   that is four slots about 170px tall and 1900px wide - a 11:1 crop of a
   photograph, which is not a crop of anything: you get a band of somebody's
   forearm and a band of a curtain. The direction that came back said it
   plainly - four visuals, too cropped, they do not read.

   So the strip is a strip now rather than a set of slots. The bands are
   sized off their own height and take their width from a 21:9 ratio, so
   they are recognisable frames at any viewport, and the column of them
   sits to one side with the sentence in the space it leaves. The picture
   behind is the first frame again, pushed right back - it gives the
   column a room to hang in rather than a black void, and it is what the
   figure crossing the seam is read against.

   `reverse` runs the bands against the scroll. That variant is used once,
   on the beat about the mind returning to what it already knows. */
function ShotStrip({ beat }: { beat: Beat }) {
  const frames = beat.frames ?? [];
  /* the ground the strip hangs on. Same picture as the first band, blown
     up and pushed right back - see .sstrip__bg. */
  const ground = frames.find((f) => !isFilm(f));
  return (
    <div className="sbeat__stage" data-stage>
      {ground && (
        <img
          className="sfill sstrip__bg"
          src={ART(ground)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      )}
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
   and the page needs it: the beats either side of the compositions land
   as beats rather than as a sequence of tricks because of these. */
function ShotHeld({ beat }: { beat: Beat }) {
  return (
    <div className="sbeat__stage" data-stage>
      {beat.art && <Frame className="sfill" file={beat.art} />}
      <span className="sscrim" aria-hidden="true" />
      {beat.warm && <Grade warm />}
      <Gate />
    </div>
  );
}

const SHOTS = {
  poster: ShotPoster,
  mosaic: ShotMosaic,
  aperture: ShotAperture,
  strip: ShotStrip,
  reel: ShotReel,
  phone: ShotPhone,
  held: ShotHeld,
} as const;

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
            {/* a poster sets its own type inside the composition */}
            {beat.shot !== "poster" && <Type beat={beat} />}
            <Slate beat={beat} index={i} />
          </section>
        );
      })}

      {/* The concept's name, once, as a plate - the reader has just been
          told they proved the loop, and this is what the loop is called.
          It is the only place on the page the name is set at size.

          The filmstrip along its foot is the eight episodes at thumbnail
          size, and it is there to join two things that used to be a hard
          cut: the story ends on a black screen, the feed starts on a row
          of verticals, and this is the frame that is both. */}
      <section className="s-plate" aria-label={CONCEPT.title}>
        <div className="s-plate__in">
          <span className="s-plate__mark" data-split>
            {CONCEPT.title}
          </span>
          <span className="s-plate__sub" data-reveal>
            A SoCheers original
          </span>
        </div>

        <div className="s-plate__strip" aria-hidden="true" data-plate-strip>
          {PLATE_STRIP.map((f, i) => (
            <span className="s-plate__cell" style={{ ["--i" as string]: i }} key={`${f}-${i}`}>
              <img src={ART(f)} alt="" loading="lazy" decoding="async" />
            </span>
          ))}
        </div>

        <img
          className="sgrain"
          src={ART(TEXTURE.grain)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </section>

      {/* The figures on the seams. Last in the DOM and outside every
          beat, because a beat clips its own overflow and the entire
          point of these is to be in two beats at once. See
          components/SeriesCrossers.tsx. */}
      <SeriesCrossers />
    </div>
  );
}
