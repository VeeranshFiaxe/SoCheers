import { IMG, MEANING } from "@/lib/content";
import HeroCrumble from "./HeroCrumble";
import PixGrid from "./PixGrid";

/* The artwork is the hero. Its own inner window expands to full screen into
   the team photo, and then - still in the same pin - the name gets defined
   over that photo (lib/motion.ts). */
export default function Hero() {
  return (
    <section className="hero" data-hero data-sec="0">
      <div className="hero__pin" data-hero-pin>
        {/* the SOC▢HEERS artwork, full bleed */}
        <div className="hero__frame" data-frame>
          <img src={IMG.frame} alt="SoCheers" data-frame-img />
          <span className="hero__greet">Hi! We Are</span>
        </div>

        {/* Flat black, sitting behind the contained stage. The stage never
            grows past the photo's own resolution - it stays letterboxed -
            and this fills the margin around it instead of stretching the
            photo edge to edge. */}
        <div className="hero__backdrop" data-hero-backdrop aria-hidden="true" />

        {/* The artwork's own window, lifted out so it can grow. At rest it is
            pixel-identical to the artwork behind it; it cross-fades to the
            black-and-white team photo on the way to full screen (contained,
            not full-bleed - see hero__backdrop above for the margin). */}
        <div className="hero__stage" data-hero-stage>
          <img
            className="hero__stage-img"
            src={IMG.team}
            alt="The SoCheers team"
            data-stage-img
          />
          {/* The same photo, tinted blue to match the artwork's window at
              rest - one continuous image instead of a second layer cross-
              fading in, so growing into the full photo never jumps. Fades
              out as the stage expands (motion.ts). */}
          <div className="hero__stage-tint" data-stage-tint aria-hidden="true" />
          <PixGrid cols={22} rows={8} />

          {/* Hidden while the window is still small and growing; motion.ts
              fades it in only once the stage has finished expanding, so the
              small square never gets it - just a light bleed at the screen's
              own edges once the photo is full size. */}
          <div className="hero__stage-vignette" data-stage-vignette aria-hidden="true" />
        </div>

        {/* The same frame again, as grains. Hidden until the last phase of the
            pin, when it takes over from the two layers above and falls away
            bottom-first to uncover WHO WE ARE. */}
        <HeroCrumble />

        {/* The dictionary entry, set over the photo once it is full screen.
            Same pin, so the crowd shot you just watched arrive is the page
            this gets written onto. */}
        <div className="meaning" data-meaning>
          <div className="meaning__veil" data-meaning-veil aria-hidden="true" />

          <span className="meaning__side" data-meaning-side aria-hidden="true">
            MAKING MORE HAPPEN
          </span>

          <div className="meaning__inner">
            <div className="meaning__head">
              <h2 className="meaning__word" data-meaning-word>
                {/* The split spans are decorative (typed in letter by letter,
                    see [data-meaning-char] in lib/motion.ts) - the real word
                    lives in this visually-hidden copy, same pattern as
                    [data-split] elsewhere (see .sr-only in globals.css). */}
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
