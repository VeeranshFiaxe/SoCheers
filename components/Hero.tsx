import { DECK, IMG } from "@/lib/content";
import PixGrid from "./PixGrid";

/* The artwork is the hero. Its own inner window expands to full screen,
   then the deck stacks on top - all in one pinned sequence (lib/motion.ts). */
export default function Hero() {
  return (
    <section className="hero" data-hero data-sec="0">
      <div className="hero__pin" data-hero-pin>
        {/* the SOC▢HEERS artwork, full bleed */}
        <div className="hero__frame" data-frame>
          <img src={IMG.frame} alt="SoCheers" data-frame-img />
        </div>

        {/* The artwork's own window, lifted out so it can grow. At rest it is
            pixel-identical to the artwork behind it; it cross-fades to the
            black-and-white team photo on the way to full screen. */}
        <div className="hero__stage" data-hero-stage>
          <img
            className="hero__stage-crop"
            src={IMG.frame}
            alt=""
            aria-hidden="true"
            data-stage-crop
          />
          <img
            className="hero__stage-img"
            src={IMG.team}
            alt="The SoCheers team"
            data-stage-img
          />
          <PixGrid cols={22} rows={8} />
        </div>

        {/* images that stack on top once it's full screen */}
        <div className="hero__deck" data-deck>
          {DECK.map((card) => (
            <article className="scard" key={card.idx} data-scard data-tilt>
              <div className="scard__img">
                <img src={card.src} alt="" />
              </div>
              <div className="scard__meta">
                <span>{card.idx}</span>
                <em>{card.label}</em>
              </div>
            </article>
          ))}
        </div>

        <span className="hero__count" data-hero-count>
          <b data-deck-num>01</b> / 0{DECK.length + 1}
        </span>

        <div className="hero__scroll" data-hero-cue>
          <span>SCROLL</span>
          <span className="hero__scroll-line" />
        </div>
      </div>
    </section>
  );
}
