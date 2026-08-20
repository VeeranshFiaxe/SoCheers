import type { CaseBlock } from "@/lib/work-content";

/* ============================================================
   THE CASE TEMPLATE'S RENDERER.

   One switch over the block list. That is the whole thing, and it is
   worth being explicit about why it is this dull:

   The client's hard rule is that a case missing an asset type must not
   leave visible empty space. Every template that fails that rule fails
   it the same way - it has named slots, the slot for the missing thing
   collapses to zero but keeps its margins, and the page reads as damaged
   rather than as short.

   There are no slots here. A case with no video does not have a video
   block that renders nothing; it has a shorter list. Absence is not a
   state the layout can be in, so there is nothing to reflow and nothing
   to test for. The margins belong to the blocks that exist.

   The one consequence worth knowing: the *order* of blocks is content,
   not layout. A case is arranged by whoever writes its entry in
   lib/work-content.ts, and two cases with the same assets can read
   completely differently. That is the right trade for a portfolio -
   it is the same reason the reference the client gave
   (cardboard-spaceship.com/portfolio/vyepti) does not look like a form.
   ============================================================ */
export default function CaseBlocks({ blocks }: { blocks: CaseBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${b.type}-${i}`;

        switch (b.type) {
          case "copy":
            return (
              <div className="cs-copy" key={key}>
                {b.heading && (
                  /* The id is what the rail's contents list points at,
                     and it is the block's index - the same rule
                     caseHeadings() uses, so the two cannot drift. */
                  <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>
                )}
                <p className="cs-copy__p" data-reveal>{b.body}</p>
              </div>
            );

          /* `bleed` is the only layout switch in the file, and it is one
             the writer sets per image rather than something inferred:
             whether a frame is worth the full width is a judgement about
             the picture, not about its dimensions. */
          case "image":
            return (
              <figure className={b.bleed ? "cs-shot cs-shot--bleed" : "cs-shot"} key={key} data-reveal>
                <div className="cs-shot__in" style={{ aspectRatio: `${b.w} / ${b.h}` }}>
                  <img src={b.src} alt={b.caption ?? ""} loading="lazy" />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          case "duo":
            return (
              <figure className="cs-duo" key={key} data-reveal>
                <div className="cs-duo__in">
                  <img src={b.a} alt="" loading="lazy" />
                  <img src={b.b} alt="" loading="lazy" />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* Controls, no autoplay, and a real poster. A case film is
             something a reader chooses to watch - starting it for them
             on a page they are still reading is the behaviour the client
             already told us fails, in the note about video competing
             with text for the same attention. */
          /* `id="film"` is what the hero's one action points at. Only
             the first video carries it - a case with two films has one
             that is *the* film, and it is the one the page opens with. */
          case "video":
            return (
              <figure
                className="cs-video"
                key={key}
                id={blocks.findIndex((o) => o.type === "video") === i ? "film" : undefined}
                data-reveal
              >
                <video src={b.src} poster={b.poster} controls preload="none" playsInline />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* A case board is a tall, dense artboard - it is read by
             zooming into it, not by glancing at it, so it gets its own
             block rather than being an image with a different caption. */
          case "board":
            return (
              <figure className="cs-board" key={key} data-reveal>
                <div className="cs-board__in" style={{ aspectRatio: `${b.w} / ${b.h}` }}>
                  <img src={b.src} alt={b.caption ?? "Case board"} loading="lazy" />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          case "stats":
            return (
              <div className="cs-stats" key={key} data-reveal>
                {b.items.map((s) => (
                  <div className="cs-stat" key={s.label}>
                    <b>{s.figure}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            );

          case "quote":
            return (
              <blockquote className="cs-quote" key={key} data-reveal>
                <p>{b.text}</p>
                <cite>{b.who}</cite>
              </blockquote>
            );
        }
      })}
    </>
  );
}
