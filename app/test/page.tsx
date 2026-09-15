import "../hero.css";
import "./test.css";
import { preload } from "react-dom";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ParticleLogo from "@/components/ParticleLogo";
import { Awards, Clients, What } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";
import { OVERTURE_WALLS, STATS } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import WhoBackdrop from "./WhoBackdrop";

export const metadata = pageMeta({
  title: "SoCheers. Making more happen.",
  description:
    "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
  path: "/test",
  noindex: true,
});

/* WHO WE ARE, trial cut. Same words and same engine hooks as the live
   one (components/Sections.tsx) - only the look differs, and all of that
   is in ./test.css under .who--test. */
function TestWho() {
  return (
    <section className="sec who who--test no-border" id="who" data-section data-sec="1">
      {/* The hero's photo, blurred, on the same rectangle - ./WhoBackdrop.tsx */}
      <WhoBackdrop />

      <div className="wrap">
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              An independent, integrated creative agency.
            </p>
          </div>

          <div className="who__photo">
            <ParticleLogo />
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

export default function TestHome() {
  preload(OVERTURE_WALLS[0].img, { as: "image", fetchPriority: "high" });

  return (
    <>
      <Footer />

      <main id="top" data-foot-lift>
        <Hero />
        <TestWho />
        <What />
        <Clients />
        <Awards />
      </main>
      <div className="foot-run" id="contact" data-foot-run aria-hidden="true" />

      <SiteMotion />
    </>
  );
}
