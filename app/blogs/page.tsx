import type { Metadata } from "next";
import "./blog.css";
import { Nav, Overlays } from "@/components/Chrome";
import BlogMotion from "@/components/BlogMotion";
import BlogTabs from "@/components/BlogTabs";
import { BLOG_HERO, TOPICS } from "@/lib/blog-content";

export const metadata: Metadata = {
  title: "Insights · SoCheers",
  description:
    "Blogs, white papers and reports from the SoCheers team - starting with the Parasocial Marketing whitepaper.",
};

export default function Blog() {
  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/blogs" />

      {/* data-nav-light: cream ground from the first frame, so the fixed
          header has to draw itself in black ink over it - see readGround()
          in lib/motion.ts. */}
      <main id="top" className="bl-page" data-nav-light>
        <section className="bl-hero wrap">
          <span className="tag" data-reveal>{BLOG_HERO.eyebrow}</span>
          <h1 className="bl-hero__title" data-split>
            {BLOG_HERO.lines[0]}
            <em>{BLOG_HERO.lines[1]}</em>
          </h1>
          <p className="bl-hero__lede" data-reveal>{BLOG_HERO.lede}</p>
        </section>

        <BlogTabs />

        <section className="bl-topics">
          <div className="wrap">
            <span className="tag" data-reveal>What we write about</span>

            <div className="bl-topics__grid">
              {TOPICS.map((t) => (
                <article className="bl-topic" key={t.idx} data-reveal>
                  <span className="bl-topic__idx">{t.idx}</span>
                  <span className="bl-topic__name">{t.name}</span>
                  <p>{t.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

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

      <BlogMotion />
    </>
  );
}
