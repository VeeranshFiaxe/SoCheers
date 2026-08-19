"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { EMPTY_TABS, TABS, WHITEPAPERS, type TabId } from "@/lib/blog-content";

/* The three-way split the client asked for: Blogs / White Papers / Reports
   under one section instead of a page that's only ever called "Blogs".
   Only White Papers has anything live, so it's the tab that opens by
   default - Blogs and Reports are real tabs with a placeholder rather than
   being hidden, so the section already reads as the full hub it's meant to
   grow into. */
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
              aria-selected={active === t.id}
              className={active === t.id ? "bl-tabs__btn is-active" : "bl-tabs__btn"}
              ref={(el) => {
                if (el) btnRefs.current.set(t.id, el);
                else btnRefs.current.delete(t.id);
              }}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {active === "whitepapers" ? (
          <div className="bl-tabs__panel bl-paper__list">
            {/* Each paper is one card and the whole card is the link: no
                email field in front of it and nothing embedded behind it -
                the client's call is that these are open to every visitor,
                so clicking a paper just opens the paper. New tab, because
                the visitor is in the middle of the hub and shouldn't lose
                their place to a PDF viewer. */}
            {WHITEPAPERS.map((wp) => (
              <a
                className="bl-paper__card"
                key={wp.id}
                href={wp.pdf}
                target="_blank"
                rel="noopener"
                data-cursor="Open"
              >
                <span className="tag">{wp.tag}</span>
                <h2 className="bl-paper__title">{wp.title}</h2>
                <p className="bl-paper__blurb">{wp.blurb}</p>
                <ul className="bl-paper__points">
                  {wp.points.map((p) => <li key={p}>{p}</li>)}
                </ul>

                <span className="bl-paper__open">
                  <span>{wp.cta}</span>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="bl-tabs__panel">
            <div className="bl-empty">
              <span className="tag">Coming soon</span>
              <h2 className="bl-empty__title">{EMPTY_TABS[active].title}</h2>
              <p className="bl-empty__copy">{EMPTY_TABS[active].copy}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
