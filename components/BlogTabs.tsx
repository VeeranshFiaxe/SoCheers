"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { SOON_LABEL, TABS, WHITEPAPERS, type TabId } from "@/lib/blog-content";

/* The three-way split the client asked for: Blogs / White Papers / Reports
   under one section instead of a page that's only ever called "Blogs".
   Only White Papers has anything in it, so it's the only tab that opens -
   the other two stay in the bar, dimmed and unclickable, and say "coming
   soon" on hover. A tab that opens onto nothing is worse than a tab that
   plainly isn't ready yet. */
export default function BlogTabs() {
  const [active, setActive] = useState<TabId>("whitepapers");

  /* The green pill is one real element that slides and resizes to sit
     behind whichever button is active, rather than each button toggling
     its own background - a CSS transition on a shared element is what
     actually reads as motion; three buttons quietly swapping colour does
     not. Measured off the DOM because the buttons aren't equal widths. */
  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef(new Map<TabId, HTMLButtonElement>());
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const place = () => {
      const btn = btnRefs.current.get(active);
      if (!btn) return;
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  return (
    <section className="bl-tabs" data-reveal>
      <div className="wrap">
        <div className="bl-tabs__bar" role="tablist" aria-label="Insights sections" ref={barRef}>
          <span
            className="bl-tabs__pill"
            aria-hidden="true"
            style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              /* aria-disabled rather than the `disabled` attribute: a
                 disabled button stops firing mouse events in some
                 browsers, which would kill the very hover that carries
                 the "coming soon" line. The click is turned off below
                 instead. */
              aria-disabled={!t.live}
              aria-selected={active === t.id}
              tabIndex={t.live ? 0 : -1}
              data-soon={t.live ? undefined : SOON_LABEL}
              className={
                !t.live
                  ? "bl-tabs__btn is-soon"
                  : active === t.id
                    ? "bl-tabs__btn is-active"
                    : "bl-tabs__btn"
              }
              ref={(el) => {
                if (el) btnRefs.current.set(t.id, el);
                else btnRefs.current.delete(t.id);
              }}
              onClick={t.live ? () => setActive(t.id) : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bl-tabs__panel bl-paper__list">
          {/* The paper itself, embedded - not a card that sends the
              visitor off to a file. The copy sits on one side and the
              reader on the other, so the pitch and the paper are on
              screen together; the link underneath is for anyone who
              wants the PDF in its own tab instead. */}
          {WHITEPAPERS.map((wp) => (
            <article className="bl-paper__card" key={wp.id}>
              <div className="bl-paper__body">
                <span className="tag">{wp.tag}</span>
                <h2 className="bl-paper__title">{wp.title}</h2>
                <p className="bl-paper__blurb">{wp.blurb}</p>
                <ul className="bl-paper__points">
                  {wp.points.map((p) => <li key={p}>{p}</li>)}
                </ul>

                <a
                  className="bl-paper__open"
                  href={wp.pdf}
                  target="_blank"
                  rel="noopener"
                  data-cursor="Open"
                >
                  <span>{wp.cta}</span>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </div>

              {/* #view=FitH so the page lands at full width in the
                  browser's own viewer instead of at whatever zoom it
                  last remembered. The <a> inside is the fallback for
                  anything that won't render a PDF inline - phones,
                  mostly. */}
              <div className="bl-paper__doc">
                <object
                  className="bl-paper__frame"
                  data={`${wp.pdf}#view=FitH`}
                  type="application/pdf"
                  aria-label={wp.title}
                >
                  <div className="bl-paper__fallback">
                    <p>Your browser can&rsquo;t show the paper inline.</p>
                    <a href={wp.pdf} target="_blank" rel="noopener">Open the PDF</a>
                  </div>
                </object>
                <a className="bl-paper__file" href={wp.pdf} download={wp.file}>
                  Download PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
