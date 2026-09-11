import type { MetadataRoute } from "next";
import { BUCKETS } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import { CASES } from "@/lib/work-content";

/* Every public route. Pending cases stay out until their copy lands -
   they are noindexed too (app/work/[slug]/page.tsx). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/work", "/ai-work", "/series", "/insights", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, priority: p === "" ? 1 : 0.8 })),
    ...BUCKETS.map((b) => ({ url: `${SITE_URL}/services/${b.slug}`, priority: 0.7 })),
    ...CASES.filter((c) => !c.pending).map((c) => ({ url: `${SITE_URL}/work/${c.slug}`, priority: 0.6 })),
  ];
}
