import { IMG, MEANING, TEAM_SIZES, TEAM_SRCSET } from "@/lib/content";

/* The greeting. Written rather than placed - but written the way a
   typewriter writes, which is not one letter fading in after another.

   What was here before was a span per character, snapped or risen on in
   a stagger. Both read as a reveal effect rather than as typing: at this
   size the letters are a hundred pixels tall, so sixteen separate paint
   events are sixteen separate events, and nothing about them is a hand
   moving along a line.

   So the characters are not addressed individually at all any more. Each
   run of text is a box with `overflow:hidden` whose width is grown from
   zero (initHero, lib/motion.ts) on a steps() ease with one step per
   character - so a glyph is either fully there or not there, and they
   arrive left to right at a fixed rate, which is what typing is.

   And no cursor. There was one riding the end of each run, which is the
   textbook way to sell this - but with every run shut at zero width the
   four of them collapse into a stack of little white bars in the middle
   of an otherwise empty screen, sitting there through the beat before
   the first letter. Whatever it says about typewriters, what it looks
   like is four dots of nothing. The shutter reads as typing on its own.

   Two runs, because the sentence is one line and the picture opens in
   the middle of it. */
const GREETING = "We are SoCheers";

/* ============================================================
   THE HERO, TEST CUT  (/test only - the live one is
   components/Hero.tsx and nothing here touches it)

   What the projector cut used to hand back to was the real hero: the
   SOC▢HEERS artwork with the crowd shot folded up inside its little
   window. This cut has no artwork, no room left standing and nothing
   projected, so the hero has to be the whole opening on its own, and it
   is three frames rather than two:

     write  black, and then the sentence types itself onto it:
            "We are SoCheers", one line, uncovered left to right a
            character at a time. Nothing else is on the screen and
            nothing has been scrolled - the room's last wall has gone
            over, its thud has landed, and after a beat of black this is
            the page answering it
     part   the line comes apart in the middle. "We are" goes left,
            "SoCheers" goes right, and the vibe film opens out of the gap
            between them, already playing. It stays playing from here on
     open   and then, on its own, the film grows out of that gap to fill
            the screen - edge to edge. No scroll: the reader has not
            touched anything yet and this beat finishes the thought the
            other two started. The FILM grows, not a window onto it:
            the box and the picture scale together the whole way, so
            nothing is ever uncovered at the end that was hidden at the
            start, and nothing is cropped out of it on the way. This is
            the difference from the reel section on the home page, which
            is a clip-path opening onto a fixed full-bleed film
     hold   the first scroll, and the film hands over to the crowd shot -
            same rectangle, same place - and the dictionary entry writes
            itself over it, exactly as it does on the live site

   and then the second scroll crumbles the whole thing away into WHO WE
   ARE, which is the live behaviour, untouched.

   Markup only. The motion is initHero in lib/motion.ts, which branches
   on data-hero-test; the look is the TEST HERO block in app/test/test.css
   on top of the shared .hero rules in app/globals.css.

   The first three beats are not the reader's - they play themselves,
   once, the moment the overture hands the screen back (OVERTURE_DONE),
   and the scroll is held for the whole of them. Which is why the room ends on
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
            {/* One line, and the film opens inside it. "We are" is
                right-aligned in its column, "SoCheers" left-aligned in
                the other, and the empty column between them is what the
                picture grows out of.

                The grid is 1fr auto 1fr, so the two outer columns are
                always the same width and the middle one therefore stays
                dead centre of the screen whatever is in it - which is
                where initHero puts the film, without ever measuring this
                line. A centred flex row would have opened the hole
                around the row's own middle instead, and the middle of
                "We are ... SoCheers" is not the middle of the screen. */}
            <span className="hero__line hero__line--split">
              <span className="hero__side hero__side--l">
                <span className="hero__type" data-test-type={1}>We are</span>
              </span>
              {/* the sea itself: nothing in it, and it is the reason the
                  two halves of the line are where they are */}
              <span className="hero__gap" aria-hidden="true" />
              <span className="hero__side hero__side--r">
                <span className="hero__type" data-test-type={2}>SoCheers</span>
              </span>
            </span>

            {/* The caret, and it is on screen before anything else is.

                The room hands over on black, and for a fifth of a second
                that black is all there is - which reads as a dead frame
                unless something in it says the page is about to be
                written. A cursor blinking on an empty screen is that
                something: it is the oldest "type is coming" signal there
                is, and it turns the pause into an intake of breath.

                A sibling of the row rather than a child of it, because
                the row wears the typing clip - a caret inside it would be
                cut off by the very edge it is meant to be riding. It is
                placed and moved from initHero (lib/motion.ts), which is
                where the sweep's own clock lives. */}
            <span className="hero__caret" data-test-caret aria-hidden="true" />
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
