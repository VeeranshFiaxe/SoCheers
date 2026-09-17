"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { REPORTS, SOON_LABEL, TABS, WHITEPAPERS, type TabId } from "@/lib/blog-content";

/* The three-way split the client asked for: Blogs / White Papers / Reports
   under one section instead of a page that's only ever called "Blogs".
   Only White Papers has anything in it, so it's the only tab that opens -
   the other two stay in the bar, dimmed and unclickable, and say "coming
   soon" on hover. A tab that opens onto nothing is worse than a tab that
   plainly isn't ready yet. */
export default function BlogTabs() {
  const [active, setActive] = useState<TabId>("whitepapers");

  /* A phone has no hover to carry the "coming soon" tip, so tapping a dead
     tab shows it above the button for a moment instead. */
  const [told, setTold] = useState<TabId | null>(null);
  const toldTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tell = (id: TabId) => {
    clearTimeout(toldTimer.current);
    setTold(id);
    toldTimer.current = setTimeout(() => setTold(null), 1600);
  };
  useLayoutEffect(() => () => clearTimeout(toldTimer.current), []);

  /* Fullscreen toggle for the embedded PDF - one native Fullscreen API
     call on the frame's own wrapper, not the whole page, so the reader
     expands without taking the tab bar and copy with it. Tracked per
     wrapper element since more than one paper can be on the page. */
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const docRefs = useRef(new Map<string, HTMLDivElement>());

  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      const entry = [...docRefs.current.entries()].find(([, node]) => node === el);
      setFullscreenId(entry ? entry[0] : null);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* iPhone Safari has no Fullscreen API for anything but a <video>, so
     Expand did nothing there. Where the real call is missing or refused,
     the wrapper is pinned over the viewport by CSS instead
     (.bl-paper__frameWrap.is-full, blog.css). */
  const [pseudoId, setPseudoId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!pseudoId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudoId(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    /* the section's reveal leaves a transform on it, and a transformed
       ancestor is what position:fixed resolves against */
    const sec = sectionRef.current;
    const was = sec?.style.transform ?? "";
    if (sec) sec.style.transform = "none";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (sec) sec.style.transform = was;
    };
  }, [pseudoId]);

  const toggleFullscreen = (id: string) => {
    const node = docRefs.current.get(id);
    if (!node) return;
    if (pseudoId === id) { setPseudoId(null); return; }
    if (document.fullscreenElement === node) {
      document.exitFullscreen();
      return;
    }
    if (typeof node.requestFullscreen === "function") {
      node.requestFullscreen().catch(() => setPseudoId(id));
    } else {
      setPseudoId(id);
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
    <section className="bl-tabs" data-reveal ref={sectionRef}>
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
                  ? told === t.id ? "bl-tabs__btn is-soon is-told" : "bl-tabs__btn is-soon"
                  : active === t.id
                    ? "bl-tabs__btn is-active"
                    : "bl-tabs__btn"
              }
              ref={(el) => {
                if (el) btnRefs.current.set(t.id, el);
                else btnRefs.current.delete(t.id);
              }}
              onClick={t.live ? () => setActive(t.id) : () => tell(t.id)}
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
          {(active === "reports" ? REPORTS : WHITEPAPERS).map((wp) => (
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

              <div className="bl-paper__doc">
                <div
                  className={pseudoId === wp.id ? "bl-paper__frameWrap is-full" : "bl-paper__frameWrap"}
                  ref={(el) => {
                    if (el) docRefs.current.set(wp.id, el);
                    else docRefs.current.delete(wp.id);
                  }}
                >
                  {/* Page images, not the browser's PDF plugin: a plugin is
                      its own document, so it swallowed our cursor and could
                      not be scrolled under a covering button. These are on
                      our page, scroll with the wheel, and load lazily. */}
                  <div className="bl-paper__frame" tabIndex={0} aria-label={wp.title} data-lenis-prevent>
                    {Array.from({ length: wp.pages }, (_, i) => (
                      <img
                        key={i}
                        className="bl-paper__page"
                        src={`/assets/whitepapers/${wp.id}/p${String(i + 1).padStart(2, "0")}.jpg`}
                        alt={i === 0 ? `${wp.title}, page 1` : ""}
                        width={1240}
                        height={1754}
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                  {/* The one control, always visible so a reader can see the
                      paper opens full screen. */}
                  <button
                    type="button"
                    className="bl-paper__toggle"
                    onClick={() => toggleFullscreen(wp.id)}
                    aria-label={
                      (fullscreenId === wp.id || pseudoId === wp.id)
                        ? `Collapse ${wp.title}`
                        : `Expand ${wp.title} to full screen`
                    }
                  >
                    {(fullscreenId === wp.id || pseudoId === wp.id) ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 20v-6H4M20 10h-6V4M14 10l7-7M3 21l7-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    )}
                    <span>{(fullscreenId === wp.id || pseudoId === wp.id) ? "Collapse" : "Expand"}</span>
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
