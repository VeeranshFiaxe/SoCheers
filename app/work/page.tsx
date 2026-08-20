import type { Metadata } from "next";
import "./work.css";
import { Nav, Overlays } from "@/components/Chrome";
import Footer from "@/components/Footer";
import WorkMotion from "@/components/WorkMotion";
import WorkPinned from "@/components/WorkPinned";
import WorkGrid from "@/components/WorkGrid";
import { getWorkAssets } from "@/lib/work-data";

export const metadata: Metadata = {
  title: "Work · SoCheers",
  description:
    "Campaigns, films and content from SoCheers - the five we'd lead with, and the rest by category.",
};

/* ============================================================
   WORK.

   Two sections, in the brief's own order: the pinned rail at the top,
   the full category browse under it.

   ---- what this page is not ----

   There is no separate Cases tab. The client was specific: the pinned
   rail lives inside Work and is not its own nav item. Individual cases
   are /work/[slug], reached from a tile.

   ---- the assets ----

   getWorkAssets() is the seam between this page and where the work
   actually lives. Right now it hands back the local manifest; with a
   cloud name in the environment it reads Cloudinary tags instead, and
   nothing on this page changes. See lib/work-data.ts.

   Async because of that call, which also means this route revalidates on
   the fetch's own schedule once the CDN is live rather than being baked
   at build time.
   ============================================================ */
export default async function Work() {
  const assets = await getWorkAssets();

  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/work" />

      {/* The room under the page. Same three parts the home page needs and
          in the same upside-down order - the footer has to come first so
          it is underneath, and .foot-run is one screen of nothing for the
          page to scroll off through, because a fixed element adds no
          height of its own. The whole sequence is initFooter() in
          lib/motion.ts, which initSite() already runs on this route and
          which returns quietly when the markup is not there - so this is
          markup only, and there is no motion code behind it. */}
      <Footer />

      <main id="top" className="wk-page" data-foot-lift>
        {/* The work opens the page. There is no copy hero over this: the
            stage fills the first screen and everything it has to say is
            written on the frame - see components/WorkPinned.tsx. */}
        <WorkPinned />
        <WorkGrid assets={assets} />
      </main>
      <div className="foot-run" data-foot-run aria-hidden="true" />

      <WorkMotion />
    </>
  );
}
