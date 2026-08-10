import { Fragment } from "react";
import { AWARDS, BUCKETS, CLIENT_ROWS, IMG, STATS } from "@/lib/content";
import ContactModal from "./ContactModal";
import RollText from "./Roll";
import SandWall from "./SandWall";
import Splash from "./Splash";

export function Who() {
  return (
    <section className="sec who no-border" id="who" data-section data-sec="1">
      {/* the same crowd shot the hero pin ends on, so the wall opens as
          that photo carrying on past its own bottom edge */}
      <SandWall img={IMG.team} />
      <div className="wrap">
        <span className="tag" data-reveal>WHO WE ARE</span>
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              We are <span className="who__brand">SoCheers</span> - an independent, integrated creative agency.
            </p>
            <p className="who__pitch" data-split>
              We build brands consumers fall for. We make content people can&apos;t help but{" "}
              <span className="who__share">share.</span>
            </p>
            <div className="who__stats">
              {STATS.map((s) => (
                <div className="stat" key={s.label} data-reveal data-cursor={`${s.count}+`}>
                  <div className="stat__num">
                    <span data-count={s.count}>0</span>
                    <i>+</i>
                  </div>
                  <div className="stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="who__photo" data-tilt>
            {/* Chases the pointer harder than the site default: a wider
                reach, a much longer throw and a gentler falloff, so it is
                reacting well before the cursor is on top of it. */}
            <span
              className="who__splash"
              data-splash
              data-splash-reach="1150"
              data-splash-pull="110"
              data-splash-bite="1.35"
              aria-hidden="true"
            >
              <Splash />
            </span>
            <img src={IMG.culture} alt="The SoCheers team, off the clock" data-clip />
          </div>
        </div>
      </div>
    </section>
  );
}

export function What() {
  return (
    <section className="sec what" id="what" data-section data-sec="2">
      <div className="wrap">
        <span className="tag" data-reveal>WHAT WE DO</span>
        <h2 className="sec__title" data-split>
          How the work comes together.
        </h2>

        <div className="wcards">
          {BUCKETS.map((b) => (
            <article className="wcard" key={b.idx} data-clip data-tilt data-cursor={b.name}>
              <div className="wcard__img"><img src={b.img} alt="" /></div>
              <div className="wcard__body">
                <span className="wcard__idx">{b.idx} · Bucket</span>
                <h3 className="wcard__name" data-roll><RollText>{b.name}</RollText></h3>
                <ul className="wcard__list">
                  {b.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Clients() {
  return (
    <section className="sec clients" data-section data-sec="3">
      <div className="wrap">
        <span className="tag" data-reveal>WHO DO WE DO IT WITH</span>
        <h2 className="sec__title" data-split>Brands you like consuming the most.</h2>
      </div>
      <div className="clients__rows">
        {CLIENT_ROWS.map((row, r) => (
          <div className="cmarquee" key={r} aria-hidden="true">
            {/* the track is duplicated so the loop can wrap on half its width */}
            <div className="cmarquee__track" data-marquee={row.dir}>
              {[0, 1].map((copy) =>
                row.names.map((n, i) => (
                  <Fragment key={`${copy}-${i}`}>
                    <span>{n}</span>
                    <span className="s">✦</span>
                  </Fragment>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Awards() {
  return (
    <section className="sec awards" id="awards" data-section data-sec="4">
      <div className="wrap">
        <span className="tag" data-reveal>RECOGNITION</span>
        <h2 className="awards__title" data-split>The room noticed.</h2>
      </div>
      <div className="awards__marquee" aria-hidden="true">
        <div className="awards__track" data-marquee="left">
          {[0, 1].map((copy) =>
            AWARDS.map((a, i) => (
              <Fragment key={`${copy}-${i}`}>
                <span>{a}</span>
                <span className="star">✦</span>
              </Fragment>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="sec contact" id="contact" data-section data-sec="5">
      <div className="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>

      {/* The two mascots that fill what would otherwise be dead space either
          side of the centred copy - bled off their own edge of the section
          rather than framed, so they read as characters leaning in from
          off-screen instead of a pair of product shots. data-tilt gives
          them the same cursor-reactive lean the WHO WE ARE photo has. */}
      <div className="contact__cast contact__cast--left" data-tilt aria-hidden="true">
        <img src={IMG.footerLeft} alt="" data-clip />
      </div>
      <div className="contact__cast contact__cast--right" data-tilt aria-hidden="true">
        <img src={IMG.footerRight} alt="" data-clip />
      </div>

      <div className="contact__inner">
        <h2 className="contact__title" data-split data-wipe="down">Brief us. Or&nbsp;just say hi.</h2>
        <ContactModal />

        <div className="contact__emails">
          <a href="mailto:hello@socheers.net" className="contact__email" data-magnetic data-cursor="Email">
            <span className="contact__email-label">Bring us a brief</span>
            <span className="contact__email-addr">hello@socheers.net</span>
          </a>
          <a href="mailto:careers@socheers.net" className="contact__email" data-magnetic data-cursor="Email">
            <span className="contact__email-label">Bring us your best work</span>
            <span className="contact__email-addr">careers@socheers.net</span>
          </a>
        </div>

        <div className="contact__social" data-reveal>
          <a
            href="https://www.instagram.com/thesocheers/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SoCheers on Instagram"
            data-magnetic
            data-cursor="Follow"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5.5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://in.linkedin.com/company/socheers"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SoCheers on LinkedIn"
            data-magnetic
            data-cursor="Follow"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a
            href="https://www.youtube.com/@ThisIsSoCheers"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SoCheers on YouTube"
            data-magnetic
            data-cursor="Follow"
          >
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 8.5a3 3 0 0 0-2.1-2.1C18.1 6 12 6 12 6s-6.1 0-7.9.4A3 3 0 0 0 2 8.5 31 31 0 0 0 1.6 13a31 31 0 0 0 .4 4.5A3 3 0 0 0 4.1 19.6C5.9 20 12 20 12 20s6.1 0 7.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5z" />
              <path d="M10 10.2v5.6l5-2.8-5-2.8z" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        <div className="contact__foot">
          <span>SOCHEERS · EST. 2013</span>
          <span>MUMBAI · DELHI</span>
          <span>MAKING MORE HAPPEN</span>
        </div>
      </div>
    </section>
  );
}
