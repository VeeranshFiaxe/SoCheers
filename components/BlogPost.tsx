"use client";

import { useEffect, useState } from "react";
import { Blocks } from "@/components/cms/Blocks";
import "@/components/cms/blocks.css";
import type { BlogData, Entry } from "@/lib/cms/types";
import { initSite } from "@/lib/motion";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

/* One blog post. Every post is served from the same static page
   (app/insights/post); the Worker hands this post over in the head as
   #sc-post along with its title and share tags. Without that tag (next
   dev, or a client-side arrival) the post is fetched by the slug in the
   address. */
export default function BlogPost() {
  const [post, setPost] = useState<Entry | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const tag = document.getElementById("sc-post");
    if (tag?.textContent) {
      try {
        const p = JSON.parse(tag.textContent);
        setPost(p);
        /* Next puts the shell's own title back on hydration */
        document.title = `${p.data?.seoTitle || p.title} · SoCheers`;
        return;
      } catch { /* fetch instead */ }
    }
    const slug = location.pathname.replace(/\/$/, "").split("/").pop() ?? "";
    if (!/^[a-z0-9-]{1,80}$/.test(slug) || slug === "post") { setMissing(true); return; }
    fetch(`/api/content/posts/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setPost(d.post); document.title = `${d.post.title} · SoCheers`; })
      .catch(() => setMissing(true));
  }, []);

  const ready = !!post || missing;
  useEffect(() => {
    if (!ready) return;
    const stop = initSite();
    return () => stop();
  }, [ready]);

  if (missing) {
    return (
      <section className="bp-head wrap">
        <h1 className="bp-title">This post isn&rsquo;t here.</h1>
        <p className="bp-excerpt">It may have been moved or unpublished.</p>
        <a className="bl-paper__open" href="/insights">Back to Insights</a>
      </section>
    );
  }
  if (!post) return <div className="bp-wait" aria-busy="true" />;

  const data = post.data as BlogData | undefined;
  return (
    <article className="bp">
      <header className="bp-head wrap">
        <a className="bp-back" href="/insights">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span>Insights</span>
        </a>
        {post.tags.length > 0 && <span className="tag">{post.tags.join(" · ")}</span>}
        <h1 className="bp-title">{post.title}</h1>
        {post.excerpt && <p className="bp-excerpt">{post.excerpt}</p>}
        <p className="bp-meta">
          {post.author && <span>{post.author}</span>}
          {post.published_at && (
            <time dateTime={new Date(post.published_at).toISOString()}>{dateFmt.format(post.published_at)}</time>
          )}
        </p>
      </header>
      {post.cover && (
        <figure className="bp-cover wrap">
          <img src={post.cover} alt={post.cover_alt} decoding="async" />
        </figure>
      )}
      <div className="bp-body wrap">
        <Blocks blocks={data?.blocks ?? []} />
      </div>
    </article>
  );
}
