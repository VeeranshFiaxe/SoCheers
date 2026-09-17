import Link from "@/components/IntentLink";
import { BUCKETS, STATS } from "@/lib/content";
export { default as Clients } from "./Clients";
export { default as Awards } from "./Awards";
import ParticleLogo from "./ParticleLogo";
import WhoBackdrop from "./WhoBackdrop";
import RollText from "./Roll";

/* A reel frame, as the card draws it: the small cut scripts/build-art.mjs
   writes to /assets/cards. The service pages keep the full-size files. */
const cardCut = (src: string) => src.replace(/^\/assets\/(?:home|services)\//, "/assets/cards/");

export function Who() {
  /* No wall of its own any more: this section slides up *behind* the pinned
     hero (see .who's negative margin in globals.css) and the hero's own last
     frame dissolves off it - see dissolve() in lib/motion.ts. */
  return (
    <section className="sec who no-border" id="who" data-section data-sec="1">
      {/* The hero's photo, blurred, on the same rectangle - so the dissolve
          reads as the type lifting off and the picture going soft. */}
      <WhoBackdrop />

      <div className="wrap">
        {/* Three columns, the way the mock reads it: the claim on the
            left, the mark in the middle, the pitch on the right, and the
            counts as their own centred row under all three.

            No label over the claim. "WHO WE ARE" used to ride above it in
            small accent mono - the last of the four section tags on this
            page - and it was the heading saying the sentence under it in
            fewer words. The claim does not need to be introduced. */}
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              An independent, integrated creative agency.
            </p>
          </div>

          {/* The mark, held in the air as a few tens of thousands of
              grains - components/ParticleLogo.tsx. It owns its own
              pointer behaviour, so no data-tilt here: the cursor is
              supposed to go *through* it, not lean it. */}
          <div className="who__photo">
            {/* thicker than stock so it holds up over the photo - the
                count still scales per device in budget(), lib/particle-logo.ts */}
            <ParticleLogo density={1.4} size={1.225} alpha={1.175} />
          </div>

          <div className="who__say">
            <p className="who__pitch" data-split>
              We build brands consumers fall for. We make content people can&apos;t help but{" "}
              <span className="who__share">share.</span>
            </p>
          </div>
        </div>

        <div className="who__stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label} data-reveal>
              <div className="stat__num">
                {/* No data-count-hue: the count runs up in the accent
                    (.stat__num in globals.css) and stays there. */}
                <span data-count={s.count}>0</span>
                <i>+</i>
              </div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function What() {
  return (
    <section className="sec what" id="what" data-section data-sec="2">
      <div className="wrap">
        <h2 className="sec__title" data-split>
          How the work comes together.
        </h2>

        <div className="wcards">
          {BUCKETS.map((b) => (
            /* The whole card, not a "read more" tucked in a corner: the
               name, the picture and the list are all about the same one
               thing, so the target is the thing. No data-cursor - the
               card's own name is already set at 38px in the middle of it,
               and the disc was printing it a second time under the
               pointer. */
            <Link
              className="wcard"
              key={b.idx}
              href={`/services/${b.slug}`}
              data-clip
              data-tilt
            >
              {/* Ten frames a card, four cards, and exactly four of the
                  forty are ever on screen at once - the rest are the reel
                  the cycle flips through on hover. All of them are lazy,
                  the one showing included: the cards are screens below a
                  pinned hero, and an eager <img> is one React preloads in
                  the document head, ahead of the opening sequence's own
                  pictures. Each is the card's small cut (cardCut above),
                  not the file the service page draws. */}
              <div className="wcard__img">
                {b.images.map((src, i) => (
                  <img
                    key={src}
                    src={cardCut(src)}
                    alt=""
                    className={i === 0 ? "is-active" : undefined}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="wcard__body">
                <h3 className="wcard__name" data-roll><RollText>{b.name}</RollText></h3>
                <ul className="wcard__list">
                  {/* data-frame is the line's own picture, as a position in
                      the stack of <img>s above - the cycle in
                      initWCardCycle() (lib/motion.ts) parks on it while the
                      pointer is on the line. An item whose image somehow
                      isn't in its bucket's reel indexes to -1, which that
                      code reads as "no frame of its own" and leaves the
                      reel running rather than blanking the card. */}
                  {b.items.map((it) => (
                    <li key={it.label} data-frame={b.images.indexOf(it.img)}>{it.label}</li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* There is no closing CTA section any more. The page ends on AWARDS and
   hands straight over to the footer, and the ask - the line and the
   button - is the first thing waiting under the bulb once the room is
   uncovered. See .foot__ask in components/Footer.tsx. */
