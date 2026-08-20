"use client";

import { useEffect, useState } from "react";
import { CASE_NAV } from "@/lib/work-content";

/* ============================================================
   THE RAIL BESIDE A CASE.

   Back, the contents of the page, and the one action. It rides along
   the article on a wide screen and collapses out of the way on a
   narrow one - see case.css.

   The contents list is built from the case's own copy headings by the
   page and handed here as { id, label }. It is not written per case:
   an anchor list kept by hand goes stale the first time somebody
   reorders the blocks, and a contents entry pointing at nothing is a
   dead link that looks like a broken page.

   ---- why the highlight is an observer and not a scroll handler ----

   Marking the section a reader is in means knowing which headings are
   above the fold, which a scroll listener can only answer by measuring
   every heading on every frame. The observer is told once where the
   headings are and reports only when one crosses; the line it crosses
   is the top third of the screen rather than the very top, because a
   heading level with the top edge is a heading the reader has already
   passed.

   The list is walked backwards on each report: the current section is
   the last heading that has gone above the line, and with several
   crossing at once - a fast scroll, or an anchor jump - taking the
   last one is what stops the highlight flickering back up the list.
   ============================================================ */
export type CaseNavItem = { id: string; label: string };

export default function CaseNav({ items }: { items: CaseNavItem[] }) {
  const [here, setHere] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;
    const nodes = items
      .map((it) => document.getElementById(it.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const pick = () => {
      const line = window.innerHeight * 0.34;
      let current = nodes[0];
      for (const n of nodes) {
        if (n.getBoundingClientRect().top <= line) current = n;
      }
      setHere(current.id);
    };

    const io = new IntersectionObserver(pick, {
      rootMargin: "-34% 0px -66% 0px",
      threshold: 0,
    });
    nodes.forEach((n) => io.observe(n));
    pick();
    return () => io.disconnect();
  }, [items]);

  return (
    <aside className="cs-rail" aria-label="Case navigation">
      <div className="cs-rail__in">
        <a className="cs-back" href="/work" data-cursor="Back">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
          {CASE_NAV.back}
        </a>

        {/* A case with one heading does not need a contents list, and a
            list of one is furniture. Below two it simply is not there -
            the same absence rule the block list follows. */}
        {items.length > 1 && (
          <nav className="cs-toc">
            <h2 className="cs-toc__h">{CASE_NAV.contents}</h2>
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    className="cs-toc__link"
                    aria-current={here === it.id ? "true" : undefined}
                    data-cursor={it.label}
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <a className="cs-rail__cta" href="/contact" data-magnetic data-cursor="Say hi">
          {CASE_NAV.cta}
        </a>
      </div>
    </aside>
  );
}
