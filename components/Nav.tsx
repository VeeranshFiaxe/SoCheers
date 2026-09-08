"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/lib/content";
import { OVERTURE_REPLAY } from "@/lib/overture";
import SoCheersLockup from "./SoCheersLockup";

/* ============================================================
   THE HEADER

   Rendered once, in app/layout.tsx, and never again: it is outside the
   route now, so moving between pages does not tear it down and rebuild it.
   That is what lets the indicator below actually travel - it is the
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

  /* ---- the phone's way around ----

     The capsule of links is hidden under 860px and always was: eight tabs
     of letter-spaced uppercase do not fit across a phone, and squeezing
     them until they do is how you get a row nobody can hit. What was
     missing is what took its place, which was nothing - so on a phone the
     header offered the logo (which replays the overture) and one CTA, and
     every other page on the site was unreachable.

     This is that missing half: the same links, out of the capsule and
     into a sheet, at a size a thumb can actually land on. */
  const [open, setOpen] = useState(false);

  /* Closed by arriving somewhere. The header is outside the route
     (app/layout.tsx) so it survives the navigation - without this the
     sheet would still be sitting over the page the reader just asked
     for. */
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    /* Same lock the contact dialog uses (components/ContactModal.tsx).
       Lenis drives the window scroll, and a window that cannot scroll is
       a Lenis that cannot either, so one line covers both. */
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

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
          page's Film / Stills / Text switcher wears.

          The labels used to roll: each one was two stacked copies of the
          word in a clipped box (components/Roll.tsx) and hovering flipped
          the top one out and the accent-coloured one up. It is out. Eight
          tabs sitting a couple of pixels apart means a pointer crossing
          the row sets off eight of those in a second, and a header that
          is flapping is a header you cannot read - which is the one thing
          it has to be. The hover is the colour now, and nothing else
          moves; the pill under the current tab is still the only travel
          in here. */}
      <nav className="nav__links" ref={links}>
        {/* the accent, as one object that moves rather than a fill that
            switches tabs. Behind the labels, and measured in JS because
            the width it has to take is the width of a word. */}
        <span className="nav__pill" ref={pill} aria-hidden="true" />
        {NAV_LINKS.map((l) =>
          l.soon ? (
            /* no href at all rather than href="#": an empty hash is a link
               to the top of the page dressed up as a link to a section */
            <span key={l.href} className="nav__soon">
              <span className="nav__label">{l.label}</span>
            </span>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              prefetch
              aria-current={l.href === active ? "page" : undefined}
              data-nav-current={l.href === active ? "" : undefined}
            >
              <span className="nav__label">{l.label}</span>
            </Link>
          ),
        )}
      </nav>

      <Link href="/contact" prefetch className="nav__cta" data-cursor="Say hi">
        <span>Let&rsquo;s chat</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>

      {/* The switch. It wears the same island the capsule and the CTA do,
          so the header reads as one set of controls at every width, and
          the two bars become the cross by rotating rather than by
          swapping icons - the button is the same object open or shut,
          which is the whole reason it can be one control. */}
      <button
        type="button"
        className="nav__menu"
        aria-expanded={open}
        aria-controls="nav-sheet"
        aria-label={open ? "Close menu" : "Menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav__menu-bars" aria-hidden="true"><i /><i /></span>
      </button>

      {/* Rendered always rather than mounted on open, and hidden with
          visibility rather than display: the sheet slides, and there is
          nothing to slide from if it did not exist a frame ago. inert
          keeps it off the tab order and out of the accessibility tree
          while it is shut, which display:none was doing for free. */}
      <div className="nav__sheet" id="nav-sheet" data-open={open ? "" : undefined} inert={!open}>
        <nav className="nav__sheet-links" aria-label="Pages">
          {NAV_LINKS.map((l) =>
            l.soon ? (
              <span key={l.href} className="nav__sheet-soon">
                {l.label}
                <em>Soon</em>
              </span>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                aria-current={l.href === active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ),
          )}
        </nav>

        {/* The one thing the header keeps at every width is also the last
            thing in here, spelled out rather than abbreviated to a pill:
            in a sheet there is room to say what it is. */}
        <Link href="/contact" prefetch className="nav__sheet-cta" onClick={() => setOpen(false)}>
          <span>Let&rsquo;s chat</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <a className="nav__sheet-mail" href="mailto:hello@socheers.net">hello@socheers.net</a>
      </div>
    </header>
  );
}
