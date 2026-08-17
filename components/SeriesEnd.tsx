import { ART, EXAMPLES, PROCESS, REELS, SERIES_CTA } from "@/lib/series-content";

/* ============================================================
   Everything after the story: the process, the work, the rail, the way
   out. Three server components, no state anywhere.

   These sit outside SeriesStory on purpose. The story is the argument and
   it is treatment-dependent; this half is evidence, and evidence looks
   the same whichever way the argument was told. So the switcher does not
   reach down here, and the client comparing directions is comparing the
   thing that actually differs.
   ============================================================ */

/* 1 - how it gets made, and only now.
   The brief is explicit that this cannot appear before the reader has
   bought the concept. It is the first thing after the story ends. */
export function SeriesProcess() {
  return (
    <section className="s-process is-light">
      <div className="wrap">
        <span className="tag" data-reveal>How a season gets made</span>
        <h2 className="s-process__title" data-split>
          Three rooms, in this order.
        </h2>

        <div className="s-process__grid">
          {PROCESS.map((p) => (
            <article className="s-step" data-reveal key={p.step}>
              <span className="s-step__n">{p.step}</span>
              <h3 className="s-step__title">{p.title}</h3>
              <p className="s-step__copy">{p.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 2 - the work. Four shows, each one an outbound link.
   `pending` on an entry drops the link and marks the tile: a placeholder
   that is still clickable is a placeholder somebody will click on a
   client call, land on "#", and lose confidence over. */
export function SeriesExamples() {
  return (
    <section className="s-work is-light">
      <div className="wrap">
        <span className="tag" data-reveal>Seasons we&rsquo;ve run</span>
        <h2 className="s-work__title" data-split>
          It already works. Here it is working.
        </h2>

        <div className="s-work__grid">
          {EXAMPLES.map((e) => {
            const body = (
              <>
                <div className="s-card__shot">
                  <img src={ART(e.thumb)} alt="" />
                </div>
                <div className="s-card__foot">
                  <b className="s-card__brand">{e.brand}</b>
                  <span className="s-card__eps">{e.episodes}</span>
                </div>
                <p className="s-card__premise">{e.premise}</p>
              </>
            );

            return e.pending ? (
              <div className="s-card is-pending" data-reveal key={e.brand}>
                {body}
              </div>
            ) : (
              <a
                className="s-card"
                data-reveal
                key={e.brand}
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Watch"
              >
                {body}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* 3 - the Instagram rail.
   Thumbnails linking out, not Instagram's embed - see the note over
   REELS in lib/series-content.ts for why an iframe per post is the wrong
   trade on this page in particular.

   A rail rather than a grid, and it scrolls with the finger rather than
   on a ticker: these are individual posts a reader picks from, and a row
   that moves on its own is a row you cannot point at. */
export function SeriesReels() {
  return (
    <section className="s-reels is-light">
      <div className="wrap">
        <span className="tag" data-reveal>Straight from the feed</span>
      </div>

      <div className="s-reels__rail" data-reveal>
        {REELS.map((r) => {
          const shot = (
            <>
              <img src={ART(r.thumb)} alt="" />
              <span className="s-reel__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="s-reel__cap">{r.caption}</span>
            </>
          );

          return r.pending ? (
            <div className="s-reel is-pending" key={r.id}>{shot}</div>
          ) : (
            <a
              className="s-reel"
              key={r.id}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Open"
            >
              {shot}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* 4 - the two ways out, and the production house at the foot of the page
   where the client asked for it. */
export function SeriesCta() {
  return (
    <section className="s-cta">
      <div className="wrap">
        <h2 className="s-cta__title" data-split>
          {SERIES_CTA.lines.join(" ")}
        </h2>
        <p className="s-cta__copy" data-reveal>{SERIES_CTA.copy}</p>

        <div className="s-cta__row" data-reveal>
          <a
            className="s-cta__go"
            href={SERIES_CTA.primary.href}
            data-magnetic
            data-cursor="Say hi"
          >
            {SERIES_CTA.primary.label}
          </a>

          <a
            className="s-cta__alt"
            href={SERIES_CTA.secondary.href}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="Tito Films"
          >
            <span>Shot with</span>
            <b>{SERIES_CTA.secondary.label}</b>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
