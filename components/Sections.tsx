import { Fragment } from "react";
import { AWARDS, BUCKETS, CLIENT_ROWS, IMG, STATS, TILES } from "@/lib/content";
import PixGrid from "./PixGrid";
import RollText from "./Roll";

export function Who() {
  return (
    <section className="sec who" id="who" data-section data-sec="1">
      <div className="wrap">
        <span className="tag" data-reveal>WHO WE ARE</span>
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__statement" data-split>
              We are SoCheers: an independent, integrated creative agency. We build
              brands, campaigns and culture for the brands that want to{" "}
              <em>lead their categories</em> not chase them.
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

          <div className="who__photo" data-clip data-tilt>
            <img src={IMG.culture} alt="The SoCheers team, off the clock" />
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
        <span className="tag" data-reveal>HOW THE WORK COMES TOGETHER</span>
        <h2 className="sec__title" data-split>
          Content that moves your most critical audiences.
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

export function Work() {
  return (
    <section className="sec work" id="work" data-section data-sec="4">
      <div className="wrap">
        <span className="tag" data-reveal>FEATURED WORK</span>
        <h2 className="sec__title" data-split>Some pieces you might&rsquo;ve come across.</h2>

        <div className="tiles">
          {TILES.map((t) => (
            <a
              href="#contact"
              className="tile"
              key={t.idx}
              data-tile
              data-tilt
              data-cursor="View"
            >
              <div className="tile__img"><img src={t.img} alt={t.name} /></div>
              <PixGrid cols={7} rows={5} className="tile__grid" />
              <div className="tile__meta">
                <span className="tile__idx">{t.idx}</span>
                <span className="tile__name" data-roll><RollText>{t.name}</RollText></span>
                <span className="tile__go">VIEW →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Awards() {
  return (
    <section className="sec awards" id="awards" data-section data-sec="5">
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
    <section className="sec contact" id="contact" data-section data-sec="6">
      <div className="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="contact__inner">
        <span className="tag" data-reveal>LET&rsquo;S TALK</span>
        <h2 className="contact__title" data-split>Brief us. Or&nbsp;just say hi.</h2>
        <a
          href="mailto:hello@socheers.com"
          className="contact__cta"
          data-magnetic
          data-cursor="Let's go"
        >
          <span>Start a project</span>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <div className="contact__foot">
          <span>SOCHEERS · EST. 2013</span>
          <span>MUMBAI · DELHI · BENGALURU</span>
          <span>MAKING MORE HAPPEN</span>
        </div>
      </div>
    </section>
  );
}
