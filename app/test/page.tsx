import type { Metadata } from "next";
import "./test.css";
import Footer from "@/components/Footer";
import { Awards, Clients, What, Who } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";
import TestHero from "@/components/TestHero";
import TestOverture from "@/components/TestOverture";

/* ============================================================
   /test - THE FILM CUT

   The home page, with one act of the opening sequence swapped out. It
   exists to be watched and compared against the real thing, so:

     · it is not in the nav, it is not linked from anywhere, and nothing
       on the site points at it. Typing the URL is the only way in;
     · it is noindex, because an unlinked page is still a crawlable one
       the moment it appears in a log or a share;
     · and it plays from black every single time it is loaded, rather
       than once per tab like the live sequence does.

   What changed in this cut, in the order you meet it:

     · the room's last wall goes over like all the others. There is no
       wall left standing, no projector in front of it and no crowd shot
       thrown onto it - the camera simply runs on into the dark and hands
       over (lib/test-overture-motion.ts);
     · what it hands to is a blank screen, which then writes itself:
       "Hi," / "We are" / "SoCheers" types on a line at a time, and then
       the middle line parts - "We" left, "are" right - and the vibe film
       opens out of the gap between them, playing, and keeps playing.
       That is components/TestHero.tsx, and it plays itself: the reader
       has not scrolled yet;
     · one scroll then grows the film from that gap to fill the screen -
       the whole picture scaling with its frame, never cropped - and the
       next hands over to the crowd shot for the dictionary entry, which
       is the live hero's own phase 2 unchanged;
     · and the reel section is gone from below WHO WE ARE, because that
       film has moved up into the hero and playing it twice on one page
       would be the page repeating itself.

   Everything else is the real home page's components, imported rather
   than copied.

   Nothing here modifies the live cut. components/Overture.tsx,
   components/Hero.tsx, lib/overture-motion.ts and the OVERTURE block in
   globals.css are untouched; this route runs components/TestOverture.tsx,
   components/TestHero.tsx and lib/test-overture-motion.ts. The one shared
   file it reaches into is lib/motion.ts, where initHero branches on
   data-hero-test - the pin, the lock, the phase walk and the crumble are
   the same machinery, and only the pictures and the number of resting
   frames differ.
   ============================================================ */

export const metadata: Metadata = {
  title: "Test · film cut",
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
        <TestHero />
        <Who />
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
