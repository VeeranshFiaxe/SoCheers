import { Fragment } from "react";
import AboutBulbs from "./AboutBulbs";
import AboutSplash from "./AboutSplash";
import PixGrid from "./PixGrid";
import {
  ABOUT_IMG, ABOUT_INTRO, ABOUT_TICKER, BELIEF, DRIVERS,
  FOUNDERS, ROOMS, SPACE_COPY, SPACE_SHOTS, WHY_WE_EXIST,
} from "@/lib/about-content";

/* 1 · the opener lives in components/AboutHero.tsx - it carries enough
   markup and motion of its own to be worth its own file. */

/* 2 · the intro line, with the team artwork alongside it. The disciplines
   run as one long list on purpose - the point is the sprawl - and the payoff
   sentence is the part that gets the accent.

   The visual carries three separate things, stacked back to front: the burst
   behind, the cutout itself, and the bulbs over the top. data-splash and
   data-clip are the home page's own hooks, so the burst gets the same
   cursor pull and mist-in the WHO WE ARE splash has - the gesture is
   different, the behaviour is the site's. */
export function AboutIntro() {
  return (
    <section className="ab-intro" data-sec="1">
      <div className="wrap ab-intro__grid">
        <p className="ab-intro__line" data-split>
          {ABOUT_INTRO.list} <em>{ABOUT_INTRO.payoff}</em>
        </p>

        <div className="ab-intro__visual" data-tilt>
          <span className="ab-intro__splash" data-splash aria-hidden="true">
            <AboutSplash />
          </span>
          <img
            className="ab-intro__art"
            src={ABOUT_IMG.visual}
            alt="The SoCheers team at work"
            data-clip
          />
          <AboutBulbs />
        </div>
      </div>
    </section>
  );
}

/* 3 · both founders in one frame, side by side - not two full-screen
   takeovers. The ticker underneath closes the section off. */
export function AboutFounders() {
  return (
    <section className="ab-founders" id="founders" data-sec="2">
      <div className="wrap">
        <span className="tag" data-reveal>BUILT BY TWO</span>

        <div className="founders">
          {FOUNDERS.map((f) => (
            <article className="founder" key={f.name}>
              <div className="founder__photo" data-clip>
                <img src={f.img} alt={f.name} style={{ objectPosition: f.imgPos }} />
              </div>
              <div className="founder__body">
                <span className="founder__idx" data-reveal>{f.idx}</span>
                <h2 className="founder__name" data-reveal>{f.name}</h2>
                <p className="founder__role" data-reveal>{f.role}</p>
                {f.bio.map((p, i) => (
                  <p className="founder__bio" key={i} data-reveal>{p}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* PLACEHOLDER content - decorative strip, copy still to be decided */}
      <div className="ab-ticker" aria-hidden="true">
        <div className="ab-ticker__track" data-marquee="left">
          {[0, 1].map((copy) =>
            ABOUT_TICKER.map((t, i) => (
              <Fragment key={`${copy}-${i}`}>
                <span>{t}</span>
                <span className="s">✦</span>
              </Fragment>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

/* 4 · the group shot, run through a film gate. The strip pans as you scroll
   and the perforations crawl with it, so the frame reads as a moving reel
   rather than a photo with a border drawn on it. */
export function AboutPeople() {
  return (
    <section className="ab-people" data-sec="3">
      <div className="wrap">
        <span className="tag" data-reveal>IF YOU ASK OUR PEOPLE, WHO WE ARE?</span>

        <div className="ab-people__top">
          <h2 className="ab-people__title" data-split>
            An agency that leads, for those who lead.
          </h2>

          <div className="filmstrip" data-film>
            <span className="filmstrip__perf" aria-hidden="true" />
            <div className="filmstrip__win">
              <img src={ABOUT_IMG.people} alt="The SoCheers team together" data-film-img />
            </div>
            <span className="filmstrip__perf" aria-hidden="true" />
          </div>
        </div>

        <div className="ab-people__blocks">
          <div className="pblock" data-reveal>
            <p>{BELIEF}</p>
          </div>
          <div className="pblock pblock--why" data-reveal>
            <span className="pblock__label">WHY WE EXIST?</span>
            <p>{WHY_WE_EXIST}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 5 · the one light section. The top join is a pixel veil: black tiles sit
   over the white and fall away on scroll, so the light section punches
   through rather than fades in. The bottom still soft-bleeds back to black
   under the crowd. */
export function AboutDrives() {
  return (
    <section className="ab-drives is-light" data-sec="4">
      <div className="ab-drives__veil" data-ab-pixveil aria-hidden="true">
        <PixGrid cols={24} rows={12} className="ab-drives__pix" />
      </div>

      <div className="wrap ab-drives__inner">
        <h2 className="ab-drives__title" data-split>What drives us?</h2>

        <div className="drivers">
          {DRIVERS.map((d) => (
            <article className="driver" key={d.idx} data-reveal>
              <span className="driver__head">
                <i>{d.idx}.</i> {d.name}
              </span>
              <p>{d.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="ab-drives__art" data-ab-crowd aria-hidden="true">
        <img src={ABOUT_IMG.crowd} alt="" />
      </div>
    </section>
  );
}

/* 6 · the office. PLACEHOLDER grid - these are the client's phone shots and
   the room-to-photo mapping is unconfirmed, so the four names run as their
   own line and no tile claims one. */
export function AboutSpace() {
  return (
    <section className="ab-space" data-sec="5">
      <div className="ab-space__veil" data-ab-pixveil aria-hidden="true">
        <PixGrid cols={24} rows={10} className="ab-space__pix" />
      </div>

      <div className="wrap">
        <h2 className="ab-space__title" data-split>The space.</h2>
        <p className="ab-space__copy" data-reveal>{SPACE_COPY}</p>

        <ul className="rooms" data-reveal>
          {ROOMS.map((r) => (
            <li className="rooms__item" key={r}>{r}</li>
          ))}
        </ul>

        <div className="spacegrid">
          {SPACE_SHOTS.map((s, i) => (
            <figure className="spacegrid__tile" key={s} data-clip>
              <div className="spacegrid__inner">
                <img src={s} alt={`SoCheers office, frame ${i + 1}`} />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* a way onward, so the page does not dead-end on the grid */
export function AboutEnd() {
  return (
    <div className="ab-end">
      <a href="/" className="ab-end__back" data-cursor="Home">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        <span>Back to home</span>
      </a>
      <a href="/#contact" className="nav__cta" data-magnetic data-cursor="Say hi">
        <span>Start a project</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}
