import { BUCKETS } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import { CONCEPT, META_DESCRIPTION } from "@/lib/series-content";
import { SERVICE_COPY } from "@/lib/services-content";
import { CASES } from "@/lib/work-content";

/* written to a file at build time - the site is a static export. The
   worker 404s it while CRAWLERS is "off" (wrangler.jsonc). */
export const dynamic = "force-static";

const link = (name: string, path: string, note: string) => `- [${name}](${SITE_URL}${path}): ${note}`;

export function GET() {
  const body = [
    "# SoCheers",
    "",
    "> SoCheers is an independent, integrated creative agency in Mumbai. Content, campaigns and culture for brands that want to lead, not lag.",
    "",
    "## Pages",
    "",
    link("Home", "/", "What SoCheers does, the work it leads with and how to start a brief."),
    link("About", "/about", "One team, many disciplines. The people, the founders and the office behind SoCheers."),
    link("Work", "/work", "Campaigns, films and content - the five we'd lead with, and the rest by category."),
    link("AI Work", "/ai-work", "Films, statics and CGI made with AI, and why the strategy in front of the tool still decides."),
    link(`Series: ${CONCEPT.title}`, "/series", META_DESCRIPTION),
    link("Insights", "/insights", "Blogs, white papers and reports from the SoCheers team."),
    link("Contact", "/contact", "Every way to reach SoCheers with a brief, a partnership or a hello."),
    "",
    "## Services",
    "",
    ...BUCKETS.filter((b) => SERVICE_COPY[b.slug]).map((b) =>
      link(b.name, `/services/${b.slug}`, SERVICE_COPY[b.slug].metaDescription),
    ),
    "",
    "## Case studies",
    "",
    ...CASES.filter((c) => !c.pending).map((c) =>
      link(`${c.brand}: ${c.short ?? c.title}`, `/work/${c.slug}`, c.description ?? c.intro),
    ),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
