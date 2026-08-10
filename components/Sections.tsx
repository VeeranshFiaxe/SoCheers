import { Fragment } from "react";
import { AWARDS, BUCKETS, CLIENT_ROWS, IMG, STATS } from "@/lib/content";
import ContactModal from "./ContactModal";
import RollText from "./Roll";
import Splash from "./Splash";

export function Who() {
  return (
    <section className="sec who" id="who" data-section data-sec="1">
      <div className="wrap">
        <span className="tag" data-reveal>WHO WE ARE</span>
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__statement" data-split>
              We are SoCheers - an independent, integrated creative agency. We <em>build brands consumers fall for</em>. We make content people can&apos;t help but share.
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
            <span className="who__splash" data-splash aria-hidden="true">
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
      <div className="contact__inner">
        <h2 className="contact__title" data-split data-wipe="down">Brief us. Or&nbsp;just say hi.</h2>
        <ContactModal />
        <div className="contact__foot">
          <span>SOCHEERS · EST. 2013</span>
          <span>MUMBAI · DELHI</span>
          <span>MAKING MORE HAPPEN</span>
        </div>
      </div>
    </section>
  );
}
