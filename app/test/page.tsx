import type { Metadata } from "next";
import "./test.css";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Awards, Clients, Reel, What, Who } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";
import TestOverture from "@/components/TestOverture";

/* ============================================================
   /test - THE PROJECTOR CUT

   The home page, with one act of the opening sequence swapped out. It
   exists to be watched and compared against the real thing, so:

     · it is not in the nav, it is not linked from anywhere, and nothing
       on the site points at it. Typing the URL is the only way in;
     · it is noindex, because an unlinked page is still a crawlable one
       the moment it appears in a log or a share;
     · and it plays from black every single time it is loaded, rather
       than once per tab like the live sequence does.

   Everything below the sequence is the real home page's components,
   imported rather than copied: the point of the experiment is the
   hand-off into that hero, so it has to be that hero.

   Nothing here modifies the live cut. components/Overture.tsx,
   lib/overture-motion.ts and the OVERTURE block in globals.css are
   untouched; this route runs components/TestOverture.tsx and
   lib/test-overture-motion.ts, which are copies with the ending replaced.
   ============================================================ */

export const metadata: Metadata = {
  title: "Test · projector cut",
  robots: { index: false, follow: false },
};

export default function TestPage() {
  return (
    <>
      {/* Two gates have to be opened before anything mounts, and both of
          them are the same fact: the live site plays its opening once per
          tab and remembers that it has. A test route that inherits that
          is a test route that shows you the sequence once and then never
          again until you open a new window.

          It is an inline script rather than an effect because the answer
          is needed before hydration: app/layout.tsx's own head script has
          already read that key and stamped `sc-seen` on <html> (which is
          what hides the loader), and lib/motion.ts reads it again,
          synchronously, the moment components/SiteMotion.tsx mounts. By
          the time a React effect could clear it, both of those have
          already decided. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{sessionStorage.removeItem('sc-overture-seen');" +
            "document.documentElement.classList.remove('sc-seen')}catch(e){}",
        }}
      />

      {/* Same arrangement as the home page: the footer is a fixed room
          behind the page rather than a block below it, so it has to come
          first, and the page needs one screen of nothing after <main> to
          lift off it. See the note in app/page.tsx. */}
      <Footer />

      <main id="top" data-foot-lift>
        <Hero />
        <Who />
        <Reel />
        <What />
        <Clients />
        <Awards />
      </main>
      <div className="foot-run" id="contact" data-foot-run aria-hidden="true" />

      <TestOverture />
      <SiteMotion />
    </>
  );
}
