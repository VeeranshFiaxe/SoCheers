import type { Metadata } from "next";
import NotFound from "@/components/NotFound";
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
  return <NotFound />;
}
