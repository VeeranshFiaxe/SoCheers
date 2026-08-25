import SoCheersLockup from "@/components/SoCheersLockup";
import { DART, PLATES, SLIDES, type Build, type Slide } from "@/lib/deck-content";

/* ============================================================
   THE DECK, AS A PAGE - one section per slide.

   The staging half of the port. lib/deck-content.ts says what is on each
   slide; this says how it is drawn; lib/deck-motion.ts says what the
   scroll does to it. Same three-file split as the Series tab, and the
   same rule about which file is allowed to write words: none of them
   except the content one.

   ---- the shape of a slide, back to front ----

   A PowerPoint slide is a stack, and so is this. Every section draws the
   same layers in the same order and simply leaves out the ones that
   slide has not got:

     art        the full-bleed still, and the only layer on most slides
     plate      the orange panel                        (title card only)
     verticals  9:16 frames laid across the picture      (the cure only)
     insets     a still lifted over the ground            (Mokai only)
     band       the torn paper strip                    (end card only)
     scrim      the gradient that makes cream type legible on a photo
     grain      the sheet of film grain, over everything photographic
     leak       the warm plate, on the slides after the turn
     gate       the letterbox, top and bottom
     cutout     the audience, over the gate     (title card and end card)
     type       the column, over all of it
     slate      the mono chip in the corner

   That order is not negotiable per slide, and that is the point: the
   deck's own consistency is the thing being ported. A slide that needed
   its layers in a different order would be a slide the content file is
   describing wrongly.

   ---- what is NOT here ----

   No shot system. The Series tab has seven stagings and a renderer each
   because it is a rewrite that gets to decide how to say things; this is
   a port, and the deck stages every one of its twenty slides identically
   - a picture, and type on it. Building seven mechanics for a deck that
   uses one would be the port arguing with its source.

   Nothing on this page imports from app/series/** or components/Series*,
   and it must stay that way. The two tabs live beside each other so they
   can be read against each other, which only works while either one can
   be changed without touching the other.
   ============================================================ */

/* ------------------------------------------------------------------
   THE BLOCKED WORD.

   One word behind an orange block, the device the deck uses exactly once
   - the plate on the title card - carried across the sentences that have
   a word doing the same job. `accent` on the slide names the word;
   nothing is chosen here.

   Matched case-insensitively, first occurrence only, and a miss renders
   as plain text rather than throwing: copy edited out from under its
   accent should cost a highlight, not the sentence.
   ------------------------------------------------------------------ */
function Hi({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.toLowerCase().indexOf(accent.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="dk-hi">{text.slice(at, at + accent.length)}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

/* The deck breaks its own lines, and where it breaks them is a design
   decision - "Look at the world," over "In and Out of the screen." is
   two lines because somebody set it as two lines. So each entry gets its
   own pair of spans and the block never re-wraps at a width the deck did
   not choose, until the viewport is narrower than the line, at which
   point the browser wraps it and there is nothing better to do about it.

   Two spans and not one: the outer is the mask (overflow:hidden, and it
   stays put) and the inner is the thing that moves. Putting the travel
   on the element that does the clipping moves the clip with it, which is
   a fade with extra steps - the line has to rise out from behind an edge
   that is standing still.

   [data-split] is deliberately not on these. initSplits() in
   lib/motion.ts finds lines by measuring where the BROWSER broke an
   element, and every break here is already the deck's - running the
   splitter over it would re-wrap the source material at whatever width
   the viewport happens to be. The rise is done by lines() in
   lib/deck-motion.ts instead, at initSplits()'s own numbers. */
function Lines({ lines, accent }: { lines: string[]; accent?: string }) {
  return (
    <>
      {lines.map((l, i) => (
        <span className="dk-ln" key={i}>
          <span className="dk-ln__i" data-dline>
            <Hi text={l} accent={accent} />
          </span>
        </span>
      ))}
    </>
  );
}

/* The build - the next slide's extra type, on the same picture. Rendered
   inside the column at the foot of it and hidden until the reader is far
   enough into the section, which is where a click used to be. */
function BuildBlock({ build }: { build: Build }) {
  return (
    <div className="dk-build" data-dbuild>
      {build.lines && (
        <p className="dk-lines dk-lines--build">
          <Lines lines={build.lines} />
        </p>
      )}
      {build.mark && (
        <p className="dk-mark" data-scale={build.markScale ?? "lg"}>
          {build.mark}
        </p>
      )}
      {build.body?.map((p, i) => (
        <p className="dk-body" key={i}>
          {p}
        </p>
      ))}
    </div>
  );
}

function Slide({ slide, index }: { slide: Slide; index: number }) {
  /* the accent belongs to whichever of the two the word is actually in.
     The mark is checked first: on every slide that has both, the mark is
     the loud half and the sentence is the set-up. */
  const inMark = Boolean(
    slide.mark && slide.accent && slide.mark.toLowerCase().includes(slide.accent.toLowerCase()),
  );

  return (
    <section
      className="dk-slide"
      id={`slide-${slide.id}`}
      data-dstage
      data-pages={slide.pages}
      data-align={slide.align ?? "left"}
      data-at={slide.at ?? "mid"}
    >
      <div className="dk-slide__stage" aria-hidden="true">
        {slide.art && (
          <img
            className="dk-fill dk-art"
            data-dpush
            src={DART(slide.art)}
            alt=""
            /* the first slide is the first paint of the route; every
               other one is below the fold by definition */
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        )}

        {/* the orange panel. A <span> and not an image: it is a flat fill
            in the deck, and a 1258x864 PNG of one colour is 40KB spent
            on something CSS already has. The colour is picked off that
            PNG - see --plate in deck.css. */}
        {slide.plate && <span className="dk-plate" data-dplate />}

        {slide.verticals && (
          <div className="dk-verts" data-dverts>
            {slide.verticals.map((v) => (
              <span className="dk-vert" key={v}>
                <img src={DART(v)} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        )}

        {slide.insets && (
          <div className="dk-insets">
            {slide.insets.map((f) => (
              <span className="dk-inset" key={f} data-dinset>
                <img src={DART(f)} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        )}

        {slide.band && (
          <img
            className="dk-band"
            data-dband
            src={DART(slide.band)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}

        <span className="dk-scrim" />

        {/* the grade. Only over slides that carry a photograph - the end
            card is black in the deck and grain over black is a grey
            rectangle with nothing under it. */}
        {slide.art && (
          <img
            className="dk-grain"
            src={DART(PLATES.grain)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
        {slide.warm && (
          <img
            className="dk-leak"
            src={DART(PLATES.leak)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}

        <span className="dk-gate dk-gate--t" data-dgate />
        <span className="dk-gate dk-gate--b" data-dgate />

        {/* over the gate, because the whole point of it is a subject
            standing in front of the frame rather than inside it */}
        {slide.cutout && (
          <img
            className="dk-cutout"
            data-dcutout
            src={DART(slide.cutout)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      <div className="wrap dk-slide__type">
        <div className="dk-col">
          {slide.kicker && <p className="dk-kicker">{slide.kicker}</p>}

          {slide.lead?.map((p, i) => (
            <p className="dk-body dk-body--lead" key={i}>
              {p}
            </p>
          ))}

          {slide.lines && (
            <h2 className="dk-lines">
              <Lines lines={slide.lines} accent={inMark ? undefined : slide.accent} />
            </h2>
          )}

          {slide.body?.map((p, i) => (
            <p className="dk-body" key={i}>
              {p}
            </p>
          ))}

          {slide.mark &&
            /* the title card's mark is the page's <h1>; every other one
               is a paragraph. A deck sets the same word at the same size
               on four slides and means something different by it each
               time, but a document still only gets one first heading. */
            (slide.id === "title" ? (
              <h1 className="dk-mark" data-scale={slide.markScale ?? "lg"}>
                <Hi text={slide.mark} accent={inMark ? slide.accent : undefined} />
              </h1>
            ) : (
              <p className="dk-mark" data-scale={slide.markScale ?? "lg"}>
                <Hi text={slide.mark} accent={inMark ? slide.accent : undefined} />
              </p>
            ))}

          {slide.foot?.map((p, i) => (
            <p className="dk-body dk-body--foot" key={i}>
              {p}
            </p>
          ))}

          {slide.build && <BuildBlock build={slide.build} />}

          {/* the end card's lockup, in the flow under the closing line
              rather than pinned to the foot of the section - the slide
              clips its own overflow, and anything hung past its bottom
              edge is a mark nobody ever sees */}
          {slide.logo && <SoCheersLockup className="dk-logo" />}
        </div>

        {slide.aside && (
          /* the second column. On slide 4 it is a block hung off the far
             edge; on Mokai it is the other half of the argument. Same
             markup for both - which half of the screen it lands in is
             the stylesheet's business, not this file's. */
          <div className="dk-aside">
            {slide.aside.body?.map((p, i) => (
              <p className="dk-body" key={i}>
                {p}
              </p>
            ))}
            {slide.aside.mark && (
              <p className="dk-mark" data-scale={slide.aside.markScale ?? "md"}>
                {slide.aside.mark}
              </p>
            )}
          </div>
        )}
      </div>

      {slide.slate && (
        <span className="dk-slate" aria-hidden="true">
          <b>{slide.pages}</b>
          {slide.slate}
        </span>
      )}
    </section>
  );
}

export default function DeckStory() {
  return (
    <div className="dk-story">
      {SLIDES.map((slide, i) => (
        <Slide slide={slide} index={i} key={slide.id} />
      ))}
    </div>
  );
}
