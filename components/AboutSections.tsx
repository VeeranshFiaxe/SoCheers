import AboutBulbs from "./AboutBulbs";
import AboutSplash from "./AboutSplash";
import {
  ABOUT_IMG, ABOUT_INTRO, BELIEF, DRIVERS,
  FOUNDERS, SPACE_COPY, SPACE_SHOTS, WHY_WE_EXIST,
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
    <section className="ab-panel ab-intro" data-sec="1" data-panel>
      <div className="wrap ab-intro__grid">
        <div className="ab-intro__copy">
          <h2 className="ab-intro__title" data-split>
            An agency that leads, for those who lead.
          </h2>
          {/* Two separate split roots, not one paragraph with a nested
              inline payoff: SplitText clones a nested display:block tag
              onto every visual line it wraps to, so a margin set on the
              old inline <em> was duplicating itself between the green
              text's own wrapped lines, not just before them. */}
          <p className="ab-intro__line" data-split>{ABOUT_INTRO.list}</p>
          <p className="ab-intro__line ab-intro__payoff" data-split>
            <em>{ABOUT_INTRO.payoff}</em>
          </p>
        </div>

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
    <section className="ab-panel ab-founders is-light" id="founders" data-sec="2" data-panel>
      <div className="wrap">
        <span className="tag" data-reveal>BUILT BY TWO</span>

        <div className="founders">
          {FOUNDERS.map((f, i) => (
            <article
              className={`founder founder--${i === 0 ? "left" : "right"}`}
              key={f.name}
            >
              <div className="founder__photo" data-clip>
                <img src={f.img} alt={f.name} style={{ objectPosition: f.imgPos }} />
              </div>

              {/* Always on screen now, not hidden until hover - it slides
                  in from its own outer edge as the section scrolls into
                  view (see the founder write-ups block in
                  lib/about-motion.ts). Split into an outer positioning
                  wrapper and an inner reveal card on purpose: GSAP's
                  scroll-scrubbed x/autoAlpha tween on the inner element
                  would otherwise fight the outer's own translateY(-50%)
                  centring transform. */}
              <div className="founder__reveal">
                <div className="founder__revealIn">
                  <h2 className="founder__name">{f.name}</h2>
                  <p className="founder__role">{f.role}</p>
                  {f.bio.map((p, j) => (
                    <p className="founder__bio" key={j}>{p}</p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4 · the group shot, panning across its own crop window as you scroll -
   see [data-film] in lib/about-motion.ts. The copy is the section's main
   statement now: no more "Why we exist" label, just the two sentences it
   was labelling, each its own paragraph. */
export function AboutPeople() {
  return (
    <section className="ab-panel ab-people is-light" data-sec="3" data-panel>
      <div className="wrap">
        <span className="tag" data-reveal>IF YOU ASK OUR PEOPLE, WHO WE ARE?</span>

        <div className="ab-people__top">
          <div className="ab-people__copy">
            <p className="ab-people__note" data-reveal>{WHY_WE_EXIST}</p>
            <p className="ab-people__note" data-reveal>{BELIEF}</p>
          </div>

          <div className="filmstrip__win" data-film>
            <img src={ABOUT_IMG.people} alt="The SoCheers team together" data-film-img />
          </div>
        </div>
      </div>
    </section>
  );
}

/* 5 · where the page turns light. Nothing special happens at this join any
   more: every section is a panel in the stack (see .ab-panel in about.css),
   each one a shade lighter than the last, and this is simply the step where
   the ramp crosses over to cream. The old pixel veil was solving a hard
   black-to-white cut that the stack no longer makes. */
export function AboutDrives() {
  return (
    <section className="ab-panel ab-drives is-light" data-sec="4" data-panel>
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
    <section className="ab-panel ab-space is-light" data-sec="5" data-panel>
      <div className="wrap">
        <h2 className="ab-space__title" data-split>The space.</h2>
        <p className="ab-space__copy" data-reveal>{SPACE_COPY}</p>

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

/* a way onward, so the page does not dead-end on the grid. Stays on the
   white the office grid finished on - the stack has arrived, and dropping
   back to black for one footer strip would undo the whole walk. */
export function AboutEnd() {
  return (
    <div className="ab-end is-light">
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
