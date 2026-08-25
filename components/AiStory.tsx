import { ASHOK } from "@/lib/ai-content";

/* ============================================================
   The Ashok story.

   Server component - it is nine paragraphs, a heading and a picture, and
   there is nothing on this page for a client bundle to do.

   Set as a plain column rather than as a full-bleed set piece, and the
   beats are not numbered: an index down the left turns nine paragraphs
   into a list of points, which is a document, and this is meant to read
   as somebody telling you about a bloke they know. The restraint is the
   point: the page's argument is that everyone's output looks the same
   because everyone reached for the same generator, and a story making
   that case should not itself arrive as nine screens of drifting stock
   footage. It reads like something a person wrote.

   ---- the portrait ----

   The brief for it was "part of the story, not standing separately", so
   it is not a card, not a bordered figure and not a hero image with the
   text underneath. It stands to the side of the column the story runs
   in and stays there: sticky, so the beats scroll up past him while he
   holds, and then he lifts away with the last of them because the
   sticky is scoped to the beats and not to the section.

   Three things do the blending, all of them in ai.css:

     - the delivered PNG is a figure on near-black with a warm and green
       glow behind it, and the page's own ground is #0b0b0c. So the file
       is composited rather than placed: mix-blend-mode screen drops its
       black into the page's black, and the mask fades what is left out
       at the bottom and the sides. There is no edge anywhere, which is
       the whole trick - a rectangle is what would make it an insert.
     - he holds the left of the measure with the type running down the
       right of him; he is never the full width of anything.
     - no border, no radius, no shadow, no caption. The only other thing
       on this page with a frame is a tile in the wall of work, and this
       is deliberately not one of those.

   Narrow screens drop the whole arrangement: there is no room for a
   column beside a column, so he goes back to sitting in the flow above
   the beats and scrolls with them.

   alt text rather than aria-hidden: he is the subject of the story, not
   an ornament, and a reader who cannot see the picture should still be
   told who is in it.

   The story ends by handing the reader back to the work - the brief
   calls that out specifically, and the alternative is a reader who took
   the funny door and is now at the bottom of a page with nothing under
   them.
   ============================================================ */
export default function AiStory() {
  return (
    <section className="ai-story" aria-labelledby="ashok-title">
      <div className="wrap ai-story__in">
        <div className="ai-story__head">
          <span className="tag" data-reveal>A short story</span>

          <h2 className="ai-story__title" id="ashok-title" data-split>
            {ASHOK.title}
          </h2>
        </div>

        {/* Ashok sits beside the story rather than above it: he is stuck
            to the side of the column while the beats scroll past him, and
            he only leaves when the last beat does - the sticky lives
            inside .ai-story__body, so it releases at the end of the
            narration and rides up with it.

            Ordered before the beats so that with no CSS at all it still
            lands in the one place it makes sense: the reader is shown him
            immediately after being told his name. */}
        <div className="ai-story__body">
          <div className="ai-story__aside">
            <div className="ai-story__figure" data-reveal>
              <img
                src={ASHOK.figure.src}
                alt={ASHOK.figure.alt}
                width={1024}
                height={1536}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* data-highlight: the nine beats light up word by word, line by
              line, as the reader scrolls past them - see initWordHighlight
              in lib/motion.ts. The words start dim (each paragraph keeps its
              own colour - a beat and a lift beat stay visually distinct,
              only their opacity moves) and read in as the section scrolls
              through, rather than arriving all at once with the paragraph. */}
          <div className="ai-story__beats" data-highlight>
            {ASHOK.beats.map((b, i) => (
              <p className="ai-beat" data-lift={b.lift ? "" : undefined} key={i}>
                {b.copy}
              </p>
            ))}
          </div>
        </div>

        <div className="ai-story__out" data-reveal>
          <span className="ai-story__outline">{ASHOK.out.line}</span>
          <a className="ai-story__go" href="#ai-grid" data-magnetic data-cursor="The work">
            {ASHOK.out.label}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
