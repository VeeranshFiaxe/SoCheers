import { ART, BEATS, TEXTURE, type Beat } from "@/lib/series-content";

/* ============================================================
   SERIES 2.0 - ONE SHOT, FOURTEEN TIMES, NUDGED.

   A throwaway comparison for /series-test, answering one question: what
   does this argument read like if every beat is staged the same way
   instead of each one getting its own mechanic?

   The staging picked is the STRIP - the beat the direction pointed at.
   Full screen, the sentence held in one half, and four letterbox frames
   cascading down the other against a blown-up blurred plate. Every
   section gets it: the cold open, the title cards, the wall, the end
   card. No exceptions on the *treatment* - that is the test.

   ---- the variation, and why it is a cycle and not a design ----

   Fourteen identical screens is not a page, it is a wallpaper: the eye
   stops arriving anywhere and the eleventh beat looks like the third.
   So the frame is held and three small things underneath it move, on
   fixed cycles read off the beat's index:

     side   alternates. Even beats keep the sentence left and the strip
            right; odd beats flip, and the scrim and the slate flip with
            them so the type is always on the weighted half.
     drift  a three-step cycle of vertical offset, so the column is not
            dead-centre on every single screen.
     step   which bands take the cascade inset - the evens or the odds -
            so consecutive strips zigzag differently.

   The cycles are out of phase with each other on purpose: side runs on
   2, drift on 3, step on 4. That is a period of twelve, so across
   fourteen beats no two adjacent screens share a combination and only
   the last two repeat the first two - by which point they are twelve
   screens apart and nobody is holding both in their head.

   None of it is random. A layout that reshuffles on every build is a
   layout nobody can point at on a call, and this page exists to be
   pointed at.

   ---- what is deliberately kept ----

   The letterbox gate, the scrim, the grain plate and the warm leak all
   stay. Without them this is not "the same treatment every section", it
   is a different and much cheaper page - and the question on the table
   is about repetition, not about grading.

   ---- what is deliberately dropped ----

   All of it is at rest. The gate sits at its parked scale, the bands sit
   where the scroll would have finished putting them, and nothing here
   carries [data-split] or [data-reveal] - those sit at visibility:hidden
   until a splitter reaches them, and no motion runs on this route.

   The copy is BEATS, untouched and in the deck's order. Nothing in this
   file writes words. app/series/** is not imported by any of it and must
   not be: this is a parallel page so the two can be opened side by side,
   and so throwing it away is throwing away three files.
   ============================================================ */

/* ------------------------------------------------------------------
   THE FRAMES, PICKED AGAINST THE SENTENCE.

   The first pass filled these mechanically - a beat's own frames, then
   whatever came next in the folder - and it showed. The discipline beat
   about twelve months of planting and seeding was illustrated with a
   cafe interior because the cafe happened to be the next file along.

   So the four are chosen per beat here, by hand, against what that beat
   actually says. Keyed by beat id rather than by position, so reordering
   BEATS cannot silently re-point a picture at a different sentence.

   This lives in the component and not in lib/series-content.ts on
   purpose. It is a picture selection for one experimental layout, not
   the story - the live tab has its own, and the copy file is shared.
   ------------------------------------------------------------------ */
const FRAMES: Record<string, [string, string, string, string]> = {
  /* in and out of the screen - the empty house, the lit one, the screen
     being watched, the room it is watched from */
  open: ["open-wide.jpg", "open-tall.jpg", "micro-series.jpg", "night-scroll.jpg"],
  /* abundance. Four different feeds, four different rooms, all at once */
  peak: ["peak-content.jpg", "binge.jpg", "episodes.jpg", "night-scroll.jpg"],
  /* everything moved behind the screen */
  post: ["behind-screen.jpg", "night-scroll.jpg", "binge.jpg", "chaos.jpg"],
  /* the chaos, and the fetish the brain built inside it */
  kink: ["chaos.jpg", "peak-content.jpg", "night-scroll.jpg", "binge.jpg"],
  /* returning to what is already known - the seasons, the re-watch */
  lore: ["wardrobe.jpg", "binge.jpg", "episodes.jpg", "night-scroll.jpg"],
  /* the misread: brands seeing a trend where there is a pattern */
  trends: ["chaos.jpg", "noise.jpg", "peak-content.jpg", "micro-series.jpg"],
  /* rewired by the binge - one neurological pattern, four rooms */
  binge: ["binge.jpg", "night-scroll.jpg", "behind-screen.jpg", "wardrobe.jpg"],
  /* the pile of unwanted noise */
  noise: ["noise.jpg", "chaos.jpg", "peak-content.jpg", "micro-series.jpg"],
  /* the cure. The only beat that gets the episode stills this early. */
  cure: ["micro-series.jpg", "episodes.jpg", "reel-1.jpg", "mokai-3.jpg"],
  /* eight episodes, compressed - the reels themselves */
  episodes: ["mokai-1.jpg", "reel-1.jpg", "mokai-2.jpg", "reel-2.jpg"],
  /* Mokai. All four from the cafe, because the beat is about one world */
  mokai: ["mokai-3.jpg", "mokai-1.jpg", "mokai-2.jpg", "reel-3.jpg"],
  /* twelve months of structure - planting, seeding, and the return */
  discipline: ["wardrobe.jpg", "episodes.jpg", "reel-2.jpg", "open-tall.jpg"],
  /* the receipts. Built with the platforms that taught the world to
     binge, so: the rooms people binge in. */
  credentials: ["open-tall.jpg", "binge.jpg", "episodes.jpg", "open-wide.jpg"],
  /* the end card, and the loop closing - the empty cinema the page
     opened in is the last frame in the strip */
  proof: ["mokai-3.jpg", "reel-3.jpg", "open-tall.jpg", "open-wide.jpg"],
};

/* The fallback exists so a new beat id cannot render an empty strip. It
   is not meant to be hit - if a beat is showing these four, it is
   missing an entry above. */
const DEFAULT_FRAMES: [string, string, string, string] = [
  "peak-content.jpg",
  "night-scroll.jpg",
  "binge.jpg",
  "episodes.jpg",
];

const framesFor = (beat: Beat) => FRAMES[beat.id] ?? DEFAULT_FRAMES;

/* ------------------------------------------------------------------
   THE HIGHLIGHTED WORD.

   A block behind one word of a line - "kink." in A continuity kink.,
   "screen." in in and out of the screen. The word is not chosen here:
   `accent` is already on the beat in lib/series-content.ts, where the
   live tab's poster reads it from. Four beats carry one.

   Matching is case-insensitive and first-occurrence only, because a
   heading is one line of type and not a document. Anything that does
   not match renders as plain text rather than throwing - a beat whose
   copy is edited out from under its accent should lose a highlight, not
   the sentence.

   The colour is the one thing this page changes about it - see --hi in
   app/series-test/series-test.css.
   ------------------------------------------------------------------ */
function Hi({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.toLowerCase().indexOf(accent.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="st-hi">{text.slice(at, at + accent.length)}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

export default function SeriesTestStory() {
  return (
    <div className="st-story">
      {BEATS.map((beat, i) => {
        const frames = framesFor(beat);

        /* the three cycles, out of phase - see the note at the head of
           this file. Written as data attributes rather than as inline
           style, so every number they stand for lives in the stylesheet
           and this file decides nothing about how far anything moves. */
        const side = i % 2 === 0 ? "right" : "left";
        const drift = i % 3;
        const step = i % 4 < 2 ? "even" : "odd";

        /* the plate behind: the beat's own first frame, blown up and
           pushed right back, so the column hangs in a room rather than
           in a void */
        const ground = frames[0];

        /* the highlight lands on whichever of the two lines actually
           contains the word, and only on one of them. On `open` and
           `cure` the accent is in the sentence; on `kink` and `proof`
           the sentence sets the thing up and the accent is in the mark
           below it. Highlighting both would be the same word blocked
           twice on one screen. */
        const line = beat.lines.join(" ");
        const inLine = Boolean(
          beat.accent && line.toLowerCase().includes(beat.accent.toLowerCase()),
        );

        return (
          <section
            className="st-beat"
            id={`beat-${beat.id}`}
            key={beat.id}
            data-side={side}
            data-drift={drift}
            data-step={step}
          >
            <div className="st-beat__stage">
              <img
                className="st-fill st-bg"
                src={ART(ground)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />

              <div className="st-strip">
                {frames.map((f, j) => (
                  <span className="st-band" key={`${beat.id}-${f}-${j}`}>
                    <img src={ART(f)} alt="" loading="lazy" decoding="async" />
                  </span>
                ))}
              </div>

              <span className="st-scrim" aria-hidden="true" />

              {/* the grade. Same two plates as the live tab, and the leak
                  only on the beats after the turn, so the cure still
                  looks like a warmer room than the problem. */}
              <img
                className="st-grain"
                src={ART(TEXTURE.grain)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              {beat.warm && (
                <img
                  className="st-leak"
                  src={ART(TEXTURE.leak)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
              )}

              {/* the letterbox, parked. On the live tab the scroll opens
                  and shuts it; here it is the hairline it rests at. */}
              <span className="st-gate st-gate--t" aria-hidden="true" />
              <span className="st-gate st-gate--b" aria-hidden="true" />
            </div>

            <div className="wrap st-beat__type">
              <div className="st-beat__words">
                {beat.eyebrow && <span className="st-beat__eyebrow">{beat.eyebrow}</span>}

                <h2 className="st-beat__line">
                  <Hi text={line} accent={inLine ? beat.accent : undefined} />
                </h2>

                {/* the posters' big word. On the live tab it is set
                    enormous inside the composition; there is no
                    composition here to set it in, so it runs under the
                    sentence at reading scale. */}
                {beat.mark && (
                  <p className="st-beat__mark">
                    <Hi text={beat.mark} accent={inLine ? undefined : beat.accent} />
                  </p>
                )}

                {beat.copy && <p className="st-beat__copy">{beat.copy}</p>}
              </div>
            </div>

            {beat.slate && (
              <span className="st-beat__slate" aria-hidden="true">
                <b>{String(i + 1).padStart(2, "0")}</b>
                {beat.slate}
              </span>
            )}
          </section>
        );
      })}
    </div>
  );
}
