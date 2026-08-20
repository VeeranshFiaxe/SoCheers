import { ART, REELS, SERIES_CTA } from "@/lib/series-content";

/* ============================================================
   THE FEED - component two of two, and the way out under it.

   The brief for this tab is a page with two things on it: a story you
   scroll, and the episodes themselves as links. This is the second one.

   ---- why these are not Instagram embeds ----

   Instagram's official embed is an iframe plus embed.js per post. On a
   rail of eight that is eight iframes, eight scripts and a third-party
   tracker, on a page whose entire argument is that it can hold a
   reader's attention for ninety seconds without dropping a frame. A
   thumbnail inside an <a> is the same content and the same destination
   for one image and no JavaScript, and it keeps the page's own scroll -
   an embed captures the wheel the moment the pointer is over it, which
   on a horizontal rail is exactly where the pointer is.

   So: hyperlinked thumbnails, styled as what they are - episodes of a
   show, each one carrying its brand and its number.

   ---- the rail ----

   It moves with the scroll rather than on a timer. A row that ticks
   along on its own is a row you cannot point at on a call, and this one
   exists to be pointed at. Dragging and flicking still work; the scroll
   drift only runs while the section is on screen and stops dead under
   prefers-reduced-motion. See feed() in lib/series-motion.ts.
   ============================================================ */

function Glyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SeriesFeed() {
  return (
    <section className="s-feed" id="feed" aria-label="The episodes on Instagram">
      <div className="wrap s-feed__head">
        <span className="tag" data-reveal>
          Straight from the feed
        </span>
        <h2 className="s-feed__title" data-split>
          Every episode, where it actually lives.
        </h2>
        <p className="s-feed__note" data-reveal>
          Each frame opens the post on Instagram.
        </p>
      </div>

      {/* the rail is outside .wrap on purpose - it runs off both edges of
          the screen, which is what tells the reader there is more of it
          than fits */}
      <div className="s-feed__rail" data-feed-rail>
        {REELS.map((r) => {
          const tile = (
            <>
              <span className="s-ep__shot">
                <img src={ART(r.thumb)} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="s-ep__glyph" aria-hidden="true">
                <Glyph />
              </span>
              <span className="s-ep__slate">
                <b>{r.ep}</b>
                <em>{r.brand}</em>
              </span>
            </>
          );

          /* A placeholder that is still clickable is a placeholder
             somebody clicks on a client call, lands on "#", and loses
             confidence over. So a pending tile is not a link at all, and
             it says so on its face - visibly enough to survive a
             screenshot going into a deck. */
          return r.pending ? (
            <div className="s-ep is-pending" data-ep-tile key={r.id}>
              {tile}
            </div>
          ) : (
            <a
              className="s-ep"
              data-ep-tile
              key={r.id}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Watch"
            >
              {tile}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* The way out. Two doors and no third: talk to us, or go and look at the
   production house. It is deliberately small after the feed - the page
   has already made its argument, and a second full-screen pitch after
   the end card would be the page failing to take its own advice about
   knowing when an episode is over. */
export function SeriesClose() {
  return (
    <section className="s-cta">
      <div className="wrap">
        <h2 className="s-cta__title" data-split>
          {SERIES_CTA.lines.join(" ")}
        </h2>
        <p className="s-cta__copy" data-reveal>
          {SERIES_CTA.copy}
        </p>

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
