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
   they become root-relative and the browser handles them normally. */
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
      {sub ? (
        <a href="/" className="nav__logo" aria-label="SoCheers" data-cursor="Home">
          <SoCheersLockup className="nav__logo-mark" />
        </a>
      ) : (
        <span className="nav__logo" aria-hidden="true">
          SOCHEERS
        </span>
      )}
      <nav className="nav__links">
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href.startsWith("#") ? to(l.href) : l.href}
            data-roll
            aria-current={active && l.href === active ? "page" : undefined}
          >
            <RollText>{l.label}</RollText>
          </a>
        ))}
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
