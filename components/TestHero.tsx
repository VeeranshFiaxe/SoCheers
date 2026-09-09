import { IMG, MEANING, TEAM_SIZES, TEAM_SRCSET } from "@/lib/content";

/* The greeting, and it is written rather than placed: every character
   below is its own element so initHero can snap them on one at a time.
   Three lines, because the sentence is read as three beats - and because
   the middle one is the one that has to come apart. */
const GREETING = "Hi, We are SoCheers";

function typed(word: string, line: number) {
  return word.split("").map((ch, i) => (
    <span className="hero__ch" data-test-ch={line} key={i}>
      {ch}
    </span>
  ));
}

/* ============================================================
   THE HERO, TEST CUT  (/test only - the live one is
   components/Hero.tsx and nothing here touches it)

   What the projector cut used to hand back to was the real hero: the
   SOC▢HEERS artwork with the crowd shot folded up inside its little
   window. This cut has no artwork, no room left standing and nothing
   projected, so the hero has to be the whole opening on its own, and it
   is three frames rather than two:

     write  black, and then the sentence types itself onto it, line by
            line: "Hi," / "We are" / "SoCheers". Nothing else is on the
            screen and nothing has been scrolled - the room handed over
            to a blank page, and this is the page answering
     part   the middle line comes apart. "We" goes left, "are" goes
            right, and the vibe film opens out of the gap between them,
            already playing. It stays playing from here on
     open   one scroll, and the film grows out of that gap to fill the
            screen - edge to edge. The FILM grows, not a window onto it:
            the box and the picture scale together the whole way, so
            nothing is ever uncovered at the end that was hidden at the
            start, and nothing is cropped out of it on the way. This is
            the difference from the reel section on the home page, which
            is a clip-path opening onto a fixed full-bleed film
     hold   one more scroll, and the film hands over to the crowd shot -
            same rectangle, same place - and the dictionary entry writes
            itself over it, exactly as it does on the live site

   and then the third scroll crumbles the whole thing away into WHO WE
   ARE, which is the live behaviour, untouched.

   Markup only. The motion is initHero in lib/motion.ts, which branches
   on data-hero-test; the look is the TEST HERO block in app/test/test.css
   on top of the shared .hero rules in app/globals.css.

   The first two beats are not the reader's - they play themselves, once,
   the moment the overture hands the screen back (OVERTURE_DONE), and the
   scroll is held for the whole of them. Which is why the room ends on
   nothing now: there is no composition left standing at the end of the
   corridor for the camera to arrive on, because the composition is built
   here, in front of you, out of a blank screen.

   The film's rectangle is measured once by initHero and published on
   <html> as --film-w / --film-h. The stage is drawn at those numbers and
   so is the gap the words open to make room for it - one measurement,
   read in both places, rather than a card and a hole kept the same size
   by hand.
   ============================================================ */
export default function TestHero() {
  return (
    <section className="hero hero--test" data-hero data-hero-test data-sec="0">
      <div className="hero__pin" data-hero-pin>
        {/* The sentence, and it is the whole composition - there is no
            artwork on this cut, so the type carries the screen on its own
            and the film sits inside it rather than under it.

            Three lines of one voice at one size, stacked and centred: it
            is a single sentence being written, not a heading with a
            caption. The middle line is a three-column grid - "We", a
            spacer, "are" - so that when the spacer opens the two words
            leave the centre at exactly the same rate. Centring a flex row
            instead would have opened the gap around the row's own middle,
            which is off-centre by half the difference between the two
            words, and the film would have sat beside its own hole.

            The spacer's width and the row's height are --film-w and
            --film-h, published by initHero off the same measurement it
            seats the stage with, so the gap the words open IS the film's
            rectangle rather than a guess at it. --split walks 0 to 1 and
            carries both.

            Read out as one line, since a screen reader has no use for
            three boxes and eighteen letter spans. */}
        <div className="hero__intro" data-test-intro>
          <span className="sr-only">{GREETING}</span>

          <div className="hero__lines" data-test-lines aria-hidden="true">
            <span className="hero__line">
              {typed("Hi,", 1)}
              <i className="hero__caret" data-test-caret={1} />
            </span>

            <span className="hero__line hero__line--split">
              <span className="hero__side hero__side--l">{typed("We", 2)}</span>
              {/* the sea itself: nothing in it, and it is the reason the
                  two words are where they are */}
              <span className="hero__gap" aria-hidden="true" />
              <span className="hero__side hero__side--r">
                {typed("are", 2)}
                <i className="hero__caret" data-test-caret={2} />
              </span>
            </span>

            <span className="hero__line">
              {typed("SoCheers", 3)}
              <i className="hero__caret" data-test-caret={3} />
            </span>
          </div>
        </div>

        {/* Flat black behind the film. It is already the page's ground at
            rest, so this only earns its keep once the film is full size
            and letterboxed - see .hero__backdrop in globals.css. */}
        <div className="hero__backdrop" data-hero-backdrop aria-hidden="true" />

        {/* The box the film lives in. Sized and moved entirely from JS
            (initHero), small at rest and screen-filling at `open`; its
            aspect is the film's own at both ends, so everything inside it
            is width:100%/height:100% and scales with it rather than being
            cropped by it. */}
        <div className="hero__stage" data-hero-stage>
          {/* No src in the markup, same arrangement as the home page's
              reel: 12MB of film must not be fetched on a page whose first
              two acts are a dark room. initHero attaches it once the
              overture has handed the screen back, and pauses it whenever
              the hero is not the screen. */}
          <video
            className="hero__film"
            data-test-film="/media/vibe-video.mp4"
            poster="/media/vibe-video-poster.jpg"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* The crowd, underneath the definition. Starts invisible and
              cross-fades in as the entry begins writing, so the film is
              what you watch and the photograph is what you read on. Same
              file and same set the live hero draws, at the same rectangle
              - the aspect matches the film's, so the swap does not move
              a single edge. */}
          <img
            className="hero__stage-img hero__stage-img--test"
            data-stage-img
            src={IMG.team}
            srcSet={TEAM_SRCSET}
            sizes={TEAM_SIZES}
            alt="The SoCheers team"
          />

          <div className="hero__stage-vignette" data-stage-vignette aria-hidden="true" />
        </div>

        {/* The dictionary entry, unchanged from the live hero: same words,
            same typesetting, same order, written by the same phase of the
            same timeline. */}
        <div className="meaning" data-meaning>
          <div className="meaning__veil" data-meaning-veil aria-hidden="true" />

          <div className="meaning__inner">
            <div className="meaning__head">
              <h2 className="meaning__word" data-meaning-word>
                {/* The split spans are decorative (typed in letter by letter,
                    see [data-meaning-char] in lib/motion.ts) - the real word
                    lives in this visually-hidden copy. */}
                <span className="sr-only">{MEANING.word}</span>
                <span aria-hidden="true">
                  {MEANING.word.split("").map((ch, i) => (
                    <span className="mword__ch" data-meaning-char key={i}>{ch}</span>
                  ))}
                  <span className="mword__caret" data-meaning-caret><i /></span>
                </span>
              </h2>
              <button
                type="button"
                className="meaning__say"
                data-meaning-say
                data-cursor="Say it"
                aria-label={`Hear ${MEANING.word} pronounced`}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z" />
                  <path className="meaning__wave meaning__wave--1" d="M15.2 9.4a3.6 3.6 0 0 1 0 5.2" />
                  <path className="meaning__wave meaning__wave--2" d="M17.9 6.9a7.2 7.2 0 0 1 0 10.2" />
                </svg>
              </button>
            </div>

            <p className="meaning__phon" data-meaning-meta>{MEANING.phonetic}</p>
            <p className="meaning__pos" data-meaning-meta><em>{MEANING.pos}</em></p>
            <span className="meaning__rule" data-meaning-rule aria-hidden="true" />

            <ol className="meaning__senses">
              {MEANING.senses.map((s, i) => (
                <li className="meaning__sense" key={s} data-meaning-sense>
                  <span className="meaning__num">{i + 1}</span>
                  <span className="meaning__text">{s}</span>
                </li>
              ))}
            </ol>

            <p className="meaning__note" data-meaning-note>{MEANING.note}</p>
          </div>
        </div>

        <div className="hero__scroll" data-hero-cue>
          <span>SCROLL</span>
          <span className="hero__scroll-line" />
        </div>
      </div>
    </section>
  );
}
