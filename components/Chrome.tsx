import { NAV_LINKS } from "@/lib/content";
import RollText from "./Roll";
import SoCheersLockup from "./SoCheersLockup";

/* fixed overlays: grain, spotlight, cursor, scroll progress */
export function Overlays() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="cursor" aria-hidden="true">
        <span className="cursor__label" />
      </div>
      <div className="progress" aria-hidden="true">
        <span className="progress__bar" />
      </div>
    </>
  );
}

export function Loader() {
  return (
    <div className="loader" id="loader" aria-hidden="true">
      <div className="loader__inner">
        <SoCheersLockup className="loader__mark" />
        <div className="loader__count">
          <span id="loaderCount">0</span>
          <i>%</i>
        </div>
        <div className="loader__tag">MAKING MORE HAPPEN</div>
      </div>
      <div className="loader__sheet" />
    </div>
  );
}

/* `variant` only rewrites where the links point. On the home page they stay
   bare hashes so Lenis picks them up and scrolls smoothly (it only binds
   a[href^="#"]); on a sub-page the same labels have to leave the page, so
   they become root-relative and the browser handles them normally.

   The mark in the corner is the same flat lockup on every page and on every
   route - the home page used to carry a text wordmark here and lean on the
   overture to fly its own copy of the lockup into the slot, which meant the
   logo was a different object depending on how you arrived. Now the nav owns
   it everywhere; the overture just hands over to it (see .ovt__rig's
   is-done rule in globals.css). */
export function Nav({
  variant = "home",
  active,
}: {
  variant?: "home" | "sub";
  /* the current page's own NAV_LINKS href, e.g. "/about" or "/contact" -
     only sub-pages need this, since the home page's sections aren't
     distinct "current" links to mark. */
  active?: string;
}) {
  const sub = variant === "sub";
  const to = (hash: string) => (sub ? `/${hash}` : hash);

  return (
    <header className="nav" id="nav">
      {/* The mark goes home from everywhere, including from home - no hash,
          on any page. initTopLinks() in lib/motion.ts turns the click into
          a scroll when you are already there. */}
      <a
        href="/"
        className="nav__logo"
        aria-label="SoCheers"
        data-cursor="Home"
      >
        <SoCheersLockup className="nav__logo-mark" />
      </a>
      {/* The row is a pill - one floating capsule of links rather than
          bare labels lying on the page, the same treatment the Series
          page's Film / Stills / Text switcher wears. The label itself is
          a nested span, not the link: [data-roll] clips its own box, so
          the roll has to happen inside the capsule's padding rather than
          across it, or the second copy of the word sits visible in the
          padding below the first. Hover is read off the link so the whole
          padded target rolls, not just the text. */}
      <nav className="nav__links">
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
            <a
              key={l.href}
              href={l.href.startsWith("#") ? to(l.href) : l.href}
              aria-current={active && l.href === active ? "page" : undefined}
            >
              <span className="nav__label" data-roll>
                <RollText>{l.label}</RollText>
              </span>
            </a>
          ),
        )}
      </nav>
      <a href="/contact" className="nav__cta" data-magnetic data-cursor="Say hi">
        <span>Let&rsquo;s chat</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </header>
  );
}
