"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { NAV_LINKS } from "@/lib/content";
import { OVERTURE_REPLAY } from "@/lib/overture";
import RollText from "./Roll";
import SoCheersLockup from "./SoCheersLockup";

/* ============================================================
   THE HEADER

   Rendered once, in app/layout.tsx, and never again: it is outside the
   route now, so moving between pages does not tear it down and rebuild it.
   That is what lets the green indicator below actually travel - it is the
   same element before and after the navigation, so the browser has an
   old position and a new one to interpolate between rather than two
   unrelated first paints.
   ============================================================ */

/* Which row item the current URL belongs to. A case study (/work/nike) is
   still Work as far as the header is concerned, so this is longest-prefix
   rather than equality - with "/" spelled out, since every path starts
   with it. */
function activeHref(pathname: string): string | null {
  if (pathname === "/") return "/";
  return (
    NAV_LINKS
      .filter((l) => l.href !== "/" && !l.soon)
      .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
  );
}

export default function Nav() {
  const pathname = usePathname();
  const active = activeHref(pathname);

  const links = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  /* the first measure is a placement, not a move: there is no previous
     tab to slide from on a cold load, and a pill flying in from x:0 is an
     animation of nothing */
  const placed = useRef(false);

  const measure = useCallback((animate: boolean) => {
    const row = links.current;
    const el = pill.current;
    if (!row || !el) return;

    const target = row.querySelector<HTMLElement>("[data-nav-current]");
    /* /contact lives in the CTA, not in the row - there is no tab to fill,
       so the indicator steps off rather than parking on a stale one */
    if (!target) { el.style.opacity = "0"; return; }

    /* offsetLeft/offsetTop, not getBoundingClientRect: the row is
       transform-centred on the hero's window (translate(-50%,-50%) plus
       --hero-cx), so a viewport rect would have to have that transform
       divided back out of it. The pill's offsetParent *is* the row. */
    const write = () => {
      el.style.opacity = "1";
      el.style.width = `${target.offsetWidth}px`;
      el.style.height = `${target.offsetHeight}px`;
      el.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    };

    if (animate) { write(); return; }
    const prev = el.style.transition;
    el.style.transition = "none";
    write();
    void el.offsetWidth;               // flush, or the "none" is coalesced away
    el.style.transition = prev;
  }, []);

  /* useEffect, not useLayoutEffect: this is server-rendered too, and the
     pill starts at opacity 0 - a frame before it is placed is a frame of
     nothing, which is cheaper than a hydration warning. */
  useEffect(() => {
    measure(placed.current);
    placed.current = true;
  }, [active, measure]);

  /* The row is uppercase letter-spaced Satoshi in a fixed-width capsule:
     when the face lands the labels change width, and a pill measured
     against the fallback would sit a few pixels wide of the tab it is
     under. Same for a resize, which moves --hero-cx. */
  useEffect(() => {
    const again = () => measure(false);
    window.addEventListener("resize", again);
    document.fonts?.ready.then(again).catch(() => {});
    return () => window.removeEventListener("resize", again);
  }, [measure]);

  /* The bulb is the switch, everywhere. It used to be a second link home
     sitting next to the one in the row; the row's Home tab is the way home
     now, and the mark does the only thing the mark has ever done. */
  const relight = () => {
    document.dispatchEvent(new CustomEvent(OVERTURE_REPLAY));
  };

  return (
    <header className="nav" id="nav">
      <button
        type="button"
        className="nav__logo"
        onClick={relight}
        data-cursor="Light it"
        aria-label="Play the opening sequence"
      >
        <SoCheersLockup className="nav__logo-mark" />
      </button>

      {/* The row is a pill - one floating capsule of links rather than
          bare labels lying on the page, the same treatment the Series
          page's Film / Stills / Text switcher wears. The label itself is
          a nested span, not the link: [data-roll] clips its own box, so
          the roll has to happen inside the capsule's padding rather than
          across it, or the second copy of the word sits visible in the
          padding below the first. Hover is read off the link so the whole
          padded target rolls, not just the text. */}
      <nav className="nav__links" ref={links}>
        {/* the green, as one object that moves rather than a fill that
            switches tabs. Behind the labels, and measured in JS because
            the width it has to take is the width of a word. */}
        <span className="nav__pill" ref={pill} aria-hidden="true" />
        {NAV_LINKS.map((l) =>
          l.soon ? (
            /* no href at all rather than href="#": an empty hash is a link
               to the top of the page dressed up as a link to a section */
            <span key={l.href} className="nav__soon">
              <span className="nav__label" data-roll>
                <RollText>{l.label}</RollText>
              </span>
            </span>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              prefetch
              aria-current={l.href === active ? "page" : undefined}
              data-nav-current={l.href === active ? "" : undefined}
            >
              <span className="nav__label" data-roll>
                <RollText>{l.label}</RollText>
              </span>
            </Link>
          ),
        )}
      </nav>

      <Link href="/contact" prefetch className="nav__cta" data-magnetic data-cursor="Say hi">
        <span>Let&rsquo;s chat</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </header>
  );
}
