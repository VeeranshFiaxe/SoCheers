import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import "../blog.css";
import "./post.css";
import BlogPost from "@/components/BlogPost";

/* The one page every blog post is served from. /insights/<slug> is
   answered with this file by the Worker (worker/index.js, blogPost()),
   which writes the post's own title, description and share image over
   the placeholders below and takes the noindex off. Opened directly, as
   /insights/post, it is an empty shell - hence noindex here. */
export const metadata: Metadata = pageMeta({
  title: "Insights · SoCheers",
  description: "Writing from the SoCheers team.",
  path: "/insights",
  noindex: true,
});

export default function PostPage() {
  return (
    <main id="top" className="bl-page bp-page" data-nav-light>
      <BlogPost />

      <div className="bl-end">
        <a href="/insights" className="bl-end__back" data-cursor="Insights">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span>More insights</span>
        </a>
        <a href="/contact" className="nav__cta" data-magnetic data-cursor="Say hi">
          <span>Got a brief? Let&rsquo;s talk</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </main>
  );
}
