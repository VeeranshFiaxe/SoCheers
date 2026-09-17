"use client";

import { useEffect, useMemo } from "react";
import BlogTabs from "@/components/BlogTabs";
import { toPaper, useInsights } from "@/lib/cms/insights";
import { initSite } from "@/lib/motion";

/* The Insights page's content: hero, tabs, topics. The frame around it
   stays in app/insights/page.tsx; everything in here is edited in the
   admin panel (/admin, Insights).

   The reveal (initSite - what components/BlogMotion.tsx did here) waits
   until the saved content is in: it splits the hero into words, and
   splitting the built-in copy only to swap it a frame later would leave
   the hero half one and half the other. [data-split] is hidden until the
   reveal runs, so the wait shows as nothing at all. */
export default function InsightsPage() {
  const { settings, entries, ready } = useInsights();

  useEffect(() => {
    if (!ready) return;
    const stop = initSite();
    return () => stop();
  }, [ready]);

  const live = entries.filter((e) => e.status === "published");
  const whitepapers = live.filter((e) => e.type === "whitepaper").map(toPaper);
  const reports = live.filter((e) => e.type === "report").map(toPaper);
  const blogs = live
    .filter((e) => e.type === "blog")
    .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0));
  const { hero, topics } = settings;

  /* A tab switched on in the panel still reads "coming soon" until it has
     something live in it - an open tab onto an empty panel is the thing
     the dimmed tabs exist to avoid. */
  const counts = { blogs: blogs.length, whitepapers: whitepapers.length, reports: reports.length };
  const tabSettings = useMemo(
    () => ({ ...settings, tabs: settings.tabs
        .map((t) => ({ ...t, live: t.live && counts[t.id] > 0 }))
        /* open tabs first, closed ones after - order otherwise kept */
        .sort((x, y) => Number(y.live) - Number(x.live)) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, counts.blogs, counts.whitepapers, counts.reports],
  );

  return (
    <>
      <section className="bl-hero wrap">
        <div className="bl-hero__copy">
          <span className="tag" data-reveal>{hero.eyebrow}</span>
          <h1 className="bl-hero__title" data-split>
            {hero.line1}
            <em>{hero.line2}</em>
          </h1>
          <p className="bl-hero__lede" data-reveal>{hero.lede}</p>
        </div>

        {/* The reading visual is parked, not deleted - uncomment to bring it
            back and the hero returns to two columns on its own (blog.css
            keys the grid off whether this element is present).

            A transparent-background cutout, so it sits straight on the
            cream ground with no frame or card around it - the artwork's
            own edge is the edge. Decorative next to the h1 it illustrates,
            hence the empty alt.

        <div className="bl-hero__visual" data-reveal>
          <img
            src="/assets/art/blog-reading.webp"
            alt=""
            width={1536}
            height={1024}
            loading="eager"
            decoding="async"
          />
        </div>
        */}
      </section>

      <BlogTabs settings={tabSettings} whitepapers={whitepapers} reports={reports} blogs={blogs} />

      {topics.length > 0 && (
        <section className="bl-topics">
          <div className="wrap">
            <span className="tag" data-reveal>{settings.topicsTag}</span>

            <div className="bl-topics__grid">
              {topics.map((t, i) => (
                <article className="bl-topic" key={i} data-reveal>
                  <span className="bl-topic__idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="bl-topic__name">{t.name}</span>
                  <p>{t.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
