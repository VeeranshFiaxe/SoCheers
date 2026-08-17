import { Fragment } from "react";
import { AWARDS, BUCKETS, CLIENT_ROWS, STATS } from "@/lib/content";
import ParticleLogo from "./ParticleLogo";
import RollText from "./Roll";

export function Who() {
  /* No wall of its own any more: this section slides up *behind* the pinned
     hero (see .who's negative margin in globals.css) and the hero's own last
     frame crumbles off it - components/HeroCrumble.tsx. */
  return (
    <section className="sec who no-border" id="who" data-section data-sec="1">
      <div className="wrap">
        <span className="tag" data-reveal>WHO WE ARE</span>
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              {/* A hard break, not a non-breaking space: the line splitter
                  (SplitText, see initSplits in lib/motion.ts) re-wraps this
                  word by word to measure lines, and an nbsp does not survive
                  that - a <br /> does. The name and the dash close the first
                  line; "an" goes down with what it introduces. */}
              We are <span className="who__brand">SoCheers</span> -{" "}
              <br />
              an independent, integrated creative agency.
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

          {/* The mark, held in the air as a few tens of thousands of
              grains - components/ParticleLogo.tsx. It owns its own
              pointer behaviour, so no data-tilt here: the cursor is
              supposed to go *through* it, not lean it. */}
          <div className="who__photo">
            <ParticleLogo />
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
              <div className="wcard__img">
                {b.images.map((src, i) => (
                  <img key={src} src={src} alt="" className={i === 0 ? "is-active" : undefined} />
                ))}
              </div>
              <div className="wcard__body">
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
  /* One row, going past. This spent a while as a catalogue - an index on
     the left, a still on the right - and the trouble with a catalogue is
     that it asks to be worked through. Six shows is a fact about us, not
     a body of work to browse.

     What keeps it from reading as a fourth row of the client wall three
     sections up is that it is not typed like one: the names are set
     bigger and in caps, and every name is struck through with a purple
     marker swipe (#97509f, off the design book's own solids) that fills
     the whole name when you point at it. The wall above is grey type and
     one green star; this is the loudest strip on the page, which is the
     right way round for the section about being noticed.

     Names only. The year used to ride above each one as a small mono
     figure and it is out: the years on file are placeholders, and a
     ticker is read in passing - a date going by at speed is a thing to
     squint at rather than a thing to take in.

     Server component, no state: the movement is the shared marquee
     ticker in lib/motion.ts, same as the clients' rows. */
  return (
    <section className="sec awards" id="awards" data-section data-sec="4">
      <div className="wrap">
        <span className="tag" data-reveal>RECOGNITION</span>
        <h2 className="awards__title" data-split>EVERY WIN COUNTS</h2>
      </div>

      {/* The row is decoration as far as a screen reader is concerned -
          duplicated and moving. The list below carries the same six
          shows once, in order, off screen.

          Four passes of the six, not two. The ticker in lib/motion.ts
          wraps on half the track's width, so the track has to be at
          least two screens wide or the tail runs out mid-viewport and
          the whole strip appears to stop and jump back. Six names is
          about one screen; twelve is not, whatever the window. */}
      <div className="awards__rows" aria-hidden="true">
        <div className="amarquee">
          <div className="amarquee__track" data-marquee="left">
            {[0, 1, 2, 3].map((copy) =>
              AWARDS.map((a, i) => (
                <Fragment key={`${copy}-${i}`}>
                  <span className="amarquee__show">
                    <b>{a.name}</b>
                  </span>
                  <span className="amarquee__dot" />
                </Fragment>
              )),
            )}
          </div>
        </div>
      </div>

      {/* the same six, once and in order, for anything that cannot read a
          moving row - carrying what the row carries and no more */}
      <ul className="sr-only">
        {AWARDS.map((a) => (
          <li key={a.name}>{a.name}</li>
        ))}
      </ul>
    </section>
  );
}

/* There is no closing CTA section any more. The page ends on AWARDS and
   hands straight over to the footer, and the ask - the line and the
   button - is the first thing waiting under the bulb once the room is
   uncovered. See .foot__ask in components/Footer.tsx. */
