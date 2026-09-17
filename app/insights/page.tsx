import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { pageGraph } from "@/lib/schema";
import "./blog.css";
import InsightsPage from "@/components/InsightsPage";

export const metadata: Metadata = pageMeta({
  title: "Insights · SoCheers",
  description:
    "Blogs, white papers and reports from the SoCheers team - starting with the Parasocial Marketing whitepaper.",
  path: "/insights",
});

export default function Blog() {
  return (
    <>
      <JsonLd
        data={pageGraph({
          path: "/insights",
          name: "Insights · SoCheers",
          description:
            "Blogs, white papers and reports from the SoCheers team - starting with the Parasocial Marketing whitepaper.",
          type: "CollectionPage",
          crumbs: [{ name: "Insights", path: "/insights" }],
        })}
      />
      {/* data-nav-light: cream ground from the first frame, so the fixed
          header has to draw itself in black ink over it - see readGround()
          in lib/motion.ts. */}
      <main id="top" className="bl-page" data-nav-light>
        {/* hero, tabs and topics - edited in the admin panel */}
        <InsightsPage />

        <div className="bl-end">
          <a href="/" className="bl-end__back" data-cursor="Home">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <span>Back to home</span>
          </a>
          <a href="/contact" className="nav__cta" data-magnetic data-cursor="Say hi">
            <span>Got a brief? Let&rsquo;s talk</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </main>

    </>
  );
}
