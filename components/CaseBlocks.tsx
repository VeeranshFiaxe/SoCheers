import type { CaseBlock } from "@/lib/work-content";
import { pic } from "@/lib/images";
import CaseVideo from "./CaseVideo";

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

   Every picture goes through pic() (lib/images.ts), which serves the
   WebP and lets a phone take the 800-wide one. The `sizes` on each is
   roughly how wide that block is drawn - it only has to be close enough
   for the browser to pick the right file.
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
                {/* A body is one paragraph unless the writer left a
                    blank line in it, and then it is as many as they
                    left - the client's write-ups arrive broken into
                    beats, and running them together into one block
                    loses the pauses they were written with. */}
                {b.body.split("\n\n").map((p, j) => (
                  <p className="cs-copy__p" data-reveal key={j}>{p}</p>
                ))}
              </div>
            );

          /* `bleed` is the only layout switch in the file, and it is one
             the writer sets per image rather than something inferred:
             whether a frame is worth the full width is a judgement about
             the picture, not about its dimensions. */
          case "image":
            return (
              <figure
                className={b.bleed ? "cs-shot cs-shot--bleed" : "cs-shot"}
                key={key}
                /* --ar and --w let case.css hold the picture to a height
                   the screen can show and to its own width - a small
                   screen grab is never stretched across the column */
                style={{ "--ar": b.w / b.h, "--w": `${b.w}px` } as React.CSSProperties}
                data-reveal
              >
                <div className="cs-shot__in" style={{ aspectRatio: `${b.w} / ${b.h}` }}>
                  <img {...pic(b.src)} sizes="(max-width: 980px) 100vw, 1100px" alt={b.caption ?? ""} loading="lazy" />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          case "duo":
            return (
              <figure className="cs-duo" key={key} data-reveal>
                <div className="cs-duo__in">
                  <img {...pic(b.a)} sizes="(max-width: 640px) 100vw, 50vw" alt="" loading="lazy" />
                  <img {...pic(b.b)} sizes="(max-width: 640px) 100vw, 50vw" alt="" loading="lazy" />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* Nothing autoplays. A case film is something a reader chooses
             to watch - starting it for them on a page they are still
             reading is the behaviour the client already told us fails,
             in the note about video competing with text for the same
             attention. What the URL points at - a file, YouTube, Vimeo -
             is CaseVideo's problem, not this switch's. */
          /* `id="film"` is what the hero's one action points at. Only
             the first video carries it - a case with two films has one
             that is *the* film, and it is the one the page opens with. */
          case "video":
            return (
              <figure
                className={b.ratio && b.ratio !== "wide" ? "cs-video cs-video--set" : "cs-video"}
                key={key}
                id={blocks.findIndex((o) => o.type === "video") === i ? "film" : undefined}
                data-reveal
              >
                <CaseVideo src={b.src} poster={b.poster} ratio={b.ratio} label={b.caption} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* The cutdowns. `--tall` is the common case and the one the
             layout has to survive: three phone-shaped films side by side
             is a row, six of them is two rows, and neither is a stack of
             full-width portrait video. */
          case "reel":
            return (
              <figure className={`cs-reel cs-reel--${b.ratio ?? "tall"}`} key={key} data-reveal>
                <div className="cs-reel__in">
                  {b.items.map((it, j) => (
                    <div className="cs-reel__cell" key={`${it.src}-${j}`}>
                      <CaseVideo src={it.src} poster={it.poster} ratio={b.ratio ?? "tall"} label={it.label} />
                      {it.label && <span className="cs-reel__label">{it.label}</span>}
                    </div>
                  ))}
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* Screens as they were seen on a phone - a feed before and
             after, a set of stories. Each grab sits in a drawn handset at
             its own proportions, side by side, with its label over it. */
          case "phones":
            return (
              <figure className="cs-phones" key={key} data-reveal>
                <div className="cs-phones__in">
                  {b.items.map((it, j) => (
                    <div className="cs-phone" key={`${it.src}-${j}`}>
                      {it.label && <span className="cs-phone__label">{it.label}</span>}
                      <span className="cs-phone__body">
                        <span className="cs-phone__screen" style={{ aspectRatio: `${it.w} / ${it.h}` }}>
                          <img {...pic(it.src)} sizes="(max-width: 560px) 50vw, 320px" alt={it.label ?? ""} loading="lazy" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* Any number of stills. The column count is the writer's call
             for the same reason `bleed` is - how many frames read well
             in a row is a judgement about the frames. */
          case "gallery":
            return (
              <figure className="cs-gal" key={key} data-reveal>
                <div className="cs-gal__in" style={{ "--cols": b.cols ?? 3 } as React.CSSProperties}>
                  {b.items.map((it, j) => (
                    <img
                      key={`${it.src}-${j}`}
                      {...pic(it.src)}
                      sizes="(max-width: 760px) 100vw, 33vw"
                      alt={it.caption ?? ""}
                      loading="lazy"
                    />
                  ))}
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* What was made. Numbered off the index, so reordering the
             list is not also renumbering it by hand. */
          case "scope":
            return (
              <section className="cs-scope" key={key}>
                {b.heading && <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>}
                <ol className="cs-scope__in" data-reveal>
                  {b.items.map((it, j) => (
                    <li className="cs-scope__item" key={it.title}>
                      <span className="cs-scope__no">{String(j + 1).padStart(2, "0")}</span>
                      <h3 className="cs-scope__t">{it.title}</h3>
                      {it.body && <p className="cs-scope__p">{it.body}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            );

          /* How it was made. The frame per phase is optional and the
             row closes up without it - a process where two of four
             stages have a picture should not leave two grey boxes. */
          case "steps":
            return (
              <section className="cs-steps" key={key}>
                {b.heading && <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>}
                <ol className="cs-steps__in" data-reveal>
                  {b.items.map((it, j) => (
                    <li className="cs-step" key={it.title}>
                      {it.src && (
                        <span className="cs-step__shot">
                          <img {...pic(it.src)} sizes="(max-width: 760px) 100vw, 33vw" alt="" loading="lazy" />
                        </span>
                      )}
                      <span className="cs-step__no">{String(j + 1).padStart(2, "0")}</span>
                      <h3 className="cs-step__t">{it.title}</h3>
                      <p className="cs-step__p">{it.body}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );

          /* The billing. A definition list because that is what it is,
             and because a two-column table would break at the first
             credit with four names in it. */
          case "credits":
            return (
              <section className="cs-credits" key={key}>
                {b.heading && <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>}
                <dl className="cs-credits__in" data-reveal>
                  {b.items.map((it) => (
                    <div className="cs-credit" key={it.label}>
                      <dt>{it.label}</dt>
                      <dd>{it.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );

          /* A case board is a tall, dense artboard - it is read by
             zooming into it, not by glancing at it, so it gets its own
             block rather than being an image with a different caption.
             The frame is a link to the largest cut, opened on its own,
             where the browser's zoom does the reading - the JPG, so the
             zoom is never a re-compressed copy. On the page, pic() offers
             the 800, the board and `large` as WebP, and the screen takes
             the one it can use. */
          case "board":
            return (
              <figure className="cs-board" key={key} data-reveal>
                <a
                  className="cs-board__in"
                  href={b.large?.src ?? b.src}
                  target="_blank"
                  rel="noopener"
                  style={{ aspectRatio: `${b.w} / ${b.h}` }}
                  aria-label={`${b.caption ?? "Case board"} - open full size`}
                  data-cursor="Zoom"
                >
                  <img
                    {...pic(b.src, b.large)}
                    sizes="100vw"
                    alt={b.caption ?? "Case board"}
                    loading="lazy"
                  />
                  <span className="cs-board__zoom" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
                  </span>
                </a>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );

          /* The count goes to the CSS because the grid has to be full:
             a drawn lattice with a half-empty last row is a hole rather
             than a grid, and how many columns divide n evenly is
             something only n knows. See .cs-stats in case.css. */
          case "stats":
            return (
              <section className="cs-statset" key={key}>
                {b.heading && <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>}
                <div className="cs-stats" data-n={b.items.length} data-reveal>
                  {b.items.map((s) => (
                    <div className="cs-stat" key={s.label}>
                      <b>{s.figure}</b>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          /* The face and the job title are the reference's testimonial
             card; with neither set this is the plain pull quote it has
             always been, and the attribution row closes up around what
             is missing rather than reserving space for it. */
          case "quote":
            return (
              <blockquote className={b.avatar ? "cs-quote cs-quote--who" : "cs-quote"} key={key} data-reveal>
                <p>{b.text}</p>
                <footer className="cs-quote__by">
                  {b.avatar && (
                    <span className="cs-quote__face">
                      <img src={b.avatar} alt="" loading="lazy" />
                    </span>
                  )}
                  <cite>
                    {b.who}
                    {b.role && <span>{b.role}</span>}
                  </cite>
                </footer>
              </blockquote>
            );

          /* Answers to what a reader asks after seeing the work - the
             brief, the turnaround, what it was shot on. Native
             <details>, so it opens with no JavaScript and find-in-page
             can still reach the closed ones. */
          case "faq":
            return (
              <section className="cs-faq" key={key}>
                {b.heading && <h2 className="cs-copy__h" id={`heading-${i}`} data-split>{b.heading}</h2>}
                <div className="cs-faq__in" data-reveal>
                  {b.items.map((it) => (
                    <details className="cs-faq__row" key={it.q}>
                      <summary>
                        {it.q}
                        <span className="cs-faq__mark" aria-hidden="true" />
                      </summary>
                      <p>{it.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
        }
      })}
    </>
  );
}
