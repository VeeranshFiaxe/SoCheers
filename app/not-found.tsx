import type { Metadata } from "next";
import NotFound from "@/components/NotFound";
import SiteMotion from "@/components/SiteMotion";
import "./not-found.css";

/* ============================================================
   THE 404

   A static export writes this to out/404.html, and Cloudflare serves that
   file with a 404 status for any path it has nothing for
   (not_found_handling in wrangler.jsonc) - so this is what a typo, a dead
   link or an old URL lands on, with the header still above it.

   Not indexed: a search result for "page not found" is nobody's idea of
   a good result.
   ============================================================ */
export const metadata: Metadata = {
  title: "Lights out · SoCheers",
  description: "This page doesn't exist. The rest of SoCheers does.",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <>
      {/* No opening here. A dead link is not a front door: the loader,
          the room and the walls are for arriving at the site, not for
          arriving at nothing. Run inline, during parsing, so the loader
          is gone before the first paint and every engine that asks
          shouldRunOverture() (lib/overture.ts) is told no. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "var d=document.documentElement;d.classList.add('sc-quiet','sc-seen');d.classList.remove('sc-intro')",
        }}
      />
      <NotFound />
      {/* the shared engine: the cursor, the spotlight and the header's
          hand-off with the overture all live in initSite() */}
      <SiteMotion />
    </>
  );
}
