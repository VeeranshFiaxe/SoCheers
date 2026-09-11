import "./hero.css";
import { preload } from "react-dom";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Awards, Clients, What, Who } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";
import { OVERTURE_WALLS } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "SoCheers. Making more happen.",
  description:
    "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
  path: "/",
});

export default function Home() {
  /* The overture's first wall is this page's largest paint, and its src is
     only attached by script once the loader lets go (boot() in
     lib/overture-motion.ts). Named in the head as well, so the bytes are
     already here by then rather than requested at that moment. */
  preload(OVERTURE_WALLS[0].img, { as: "image", fetchPriority: "high" });

  return (
    <>
      {/* The footer is behind the page, not below it: it is a fixed room
          the height of the viewport that <main> is sitting on top of, and
          the last screen of scroll lifts the page off it. Which means the
          order here is upside down from how it reads - the footer has to
          come first so it is under everything - and that the document
          needs one screen of nothing after <main> to scroll through
          (.foot-run), because nothing about a fixed element adds height. */}
      <Footer />

      {/* No reel section below WHO WE ARE: the vibe film opens inside the
          hero now (components/Hero.tsx), and playing it twice on one page
          would be the page repeating itself. */}
      <main id="top" data-foot-lift>
        <Hero />
        <Who />
        <What />
        <Clients />
        <Awards />
      </main>
      {/* Carries #contact, which used to be the closing section's id. The
          ask lives in the footer now, and the footer is fixed - anchoring
          to a fixed element would resolve to wherever the page already is
          - so the anchor goes on the one thing that *is* in the document
          at that point: the screen of scroll that uncovers the room. */}
      <div className="foot-run" id="contact" data-foot-run aria-hidden="true" />

      <SiteMotion />
    </>
  );
}
