import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Awards, Clients, Reel, What, Who } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";

export default function Home() {
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

      <main id="top" data-foot-lift>
        <Hero />
        <Who />
        <Reel />
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
