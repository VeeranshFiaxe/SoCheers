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

  /* Fullscreen toggle for the embedded PDF - one native Fullscreen API
     call on the frame's own wrapper, not the whole page, so the reader
     expands without taking the tab bar and copy with it. Tracked per
     wrapper element since more than one paper can be on the page. */
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const docRefs = useRef(new Map<string, HTMLDivElement>());

  useLayoutEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      const entry = [...docRefs.current.entries()].find(([, node]) => node === el);
      setFullscreenId(entry ? entry[0] : null);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = (id: string) => {
    const node = docRefs.current.get(id);
    if (!node) return;
    if (document.fullscreenElement === node) {
      document.exitFullscreen();
    } else {
      node.requestFullscreen();
    }
  };

  /* The accent pill is one real element that slides and resizes to sit
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

              {/* ---- the reader ----

                  The viewer is the browser's own, and it arrives with a
                  toolbar on it: a page counter, zoom steps, a rotate, a
                  fit-to-page. That is somebody else's interface sitting
                  on top of our paper, in their type, with their icons,
                  and it is the first thing the eye lands on in a card
                  that is otherwise entirely ours. So the fragment turns
                  it off and leaves the pages:

                    toolbar=0   the bar itself
                    navpanes=0  the thumbnail/bookmark rail
                    scrollbar=0 the viewer's own scrollbar
                    view=FitH   the page lands at full width rather
                                than at whatever zoom was last used

                  Honoured by the Chromium viewer (Chrome, Edge, Brave),
                  which is what this is drawn for. Firefox's pdf.js and
                  Safari's PDFKit ignore the first three and will still
                  draw their own bar - hiding it there would mean
                  shipping a PDF renderer of our own, which is half a
                  megabyte of JavaScript to remove a strip of grey.

                  The <a> inside is the fallback for anything that will
                  not render a PDF inline - phones, mostly. */}
              <div className="bl-paper__doc">
                <div
                  className="bl-paper__frameWrap"
                  ref={(el) => {
                    if (el) docRefs.current.set(wp.id, el);
                    else docRefs.current.delete(wp.id);
                  }}
                >
                  <object
                    className="bl-paper__frame"
                    data={`${wp.pdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    type="application/pdf"
                    aria-label={wp.title}
                  >
                    <div className="bl-paper__fallback">
                      <p>Your browser can&rsquo;t show the paper inline.</p>
                      <a href={wp.pdf} target="_blank" rel="noopener">Open the PDF</a>
                    </div>
                  </object>
                  {/* ---- the one control ----

                      The whole frame is the button, and it carries no
                      ink of its own - the same transport the film on
                      the home page uses (.reel__toggle in globals.css),
                      for the same reason: on a page where the cursor
                      announces every actionable thing, a chrome button
                      floating over the paper is a second vocabulary.

                      It is also what puts the site's cursor back. An
                      <object> is a document of its own, so the pointer
                      crossing into it left our disc behind and the
                      operating system's arrow came back - the one place
                      on the site where that happened. The pointer never
                      reaches the plugin now; it is on this button, on
                      our page, where cursor:none and data-cursor apply.

                      The word flips with the state, and the cursor
                      relabels while you are standing still on it - see
                      the MutationObserver in initCursor (lib/motion.ts).

                      Full screen shrinks it to the corner (see the
                      stylesheet). Expanded, the reader is here to
                      scroll fourteen pages, and a button over all of
                      them is a wheel that goes nowhere. */}
                  <button
                    type="button"
                    className="bl-paper__toggle"
                    onClick={() => toggleFullscreen(wp.id)}
                    aria-label={
                      fullscreenId === wp.id
                        ? `Collapse ${wp.title}`
                        : `Expand ${wp.title} to full screen`
                    }
                    data-cursor={fullscreenId === wp.id ? "Collapse" : "Expand"}
                  >
                    {/* The mark. Not the affordance on a pointer - the
                        cursor is - but it is the whole affordance on
                        touch, where there is no hover and no disc, and
                        it is what a keyboard lands on. */}
                    {/* The pair everyone already knows: arrows out of
                        the corners, arrows back into them. What was
                        here before was four bare corner brackets - the
                        crop marks off a viewfinder, which read as a
                        frame rather than as a thing that does
                        something, and read as very nearly the same
                        drawing in both states. */}
                    <span className="bl-paper__mark" aria-hidden="true">
                      {fullscreenId === wp.id ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 20v-6H4M20 10h-6V4M14 10l7-7M3 21l7-7" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      )}
                    </span>
                    <span className="bl-paper__hint" aria-hidden="true">
                      {fullscreenId === wp.id ? "Collapse" : "Expand"}
                    </span>
                  </button>
                </div>
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
