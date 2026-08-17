import type { Metadata } from "next";
import "./work.css";
import { Nav, Overlays } from "@/components/Chrome";
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

      <main id="top" className="wk-page">
        {/* The work opens the page. There is no copy hero over this: the
            stage fills the first screen and everything it has to say is
            written on the frame - see components/WorkPinned.tsx. */}
        <WorkPinned />
        <WorkGrid assets={assets} />
      </main>

      <WorkMotion />
    </>
  );
}
