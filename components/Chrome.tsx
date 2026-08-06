import { NAV_LINKS, RAIL } from "@/lib/content";
import RollText from "./Roll";

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
        <div className="loader__word">SO<i>CHEERS</i></div>
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

export function Rail() {
  return (
    <aside className="rail" aria-hidden="true">
      {RAIL.map((label, i) => (
        <span
          key={label}
          className={i === 0 ? "rail__item is-active" : "rail__item"}
          data-rail={i}
        >
          <i>{String(i + 1).padStart(2, "0")}</i>
          <em>{label}</em>
        </span>
      ))}
    </aside>
  );
}

export function Nav() {
  return (
    <header className="nav" id="nav">
      <a href="#top" className="nav__logo" data-cursor="Top" data-magnetic>
        SOCHEERS
      </a>
      <nav className="nav__links">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} data-roll>
            <RollText>{l.label}</RollText>
          </a>
        ))}
      </nav>
      <a href="#contact" className="nav__cta" data-magnetic data-cursor="Say hi">
        <span>Start a project</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </header>
  );
}
