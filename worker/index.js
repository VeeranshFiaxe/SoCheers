/* ============================================================
   THE CLOUDFLARE WORKER IN FRONT OF THE SITE.

   The pages are static files out of `next build` (out/), and Cloudflare
   serves those on its own. Two kinds of request need a hand first
   (wrangler.jsonc routes everything but /_next here):

   - The pictures and films. They are not in that upload: they live in
     the R2 bucket bound below as MEDIA, uploaded by
     scripts/upload-r2.mjs, because several of the films are over the
     25MB Cloudflare allows for a single static file. The paths did not
     change - /assets/... and /media/... are what every page asks for,
     and this reads the same key out of R2. Same origin, so the 3D
     models, the canvases and the video all load as they do in dev.

   - A page's data. Next's router asks for it as /about?_rsc=..., which
     on a Next server is the same URL with a different answer. A static
     export writes that answer to about.txt instead, and nothing on a
     static host knows to look there - so those requests were getting
     the HTML page back. Netlify runs a Next server, which is why only
     this deploy did it.
   ============================================================ */

/* A week fresh, a month stale-while-revalidate. The reasoning is in
   next.config.mjs, above headers() - it is the same rule, moved here
   because static-file headers do not apply to what a Worker returns. */
import { api } from "./api/router.js";
import { hardenAdmin } from "./api/http.js";
import { publicInsights, publicPost } from "./api/content.js";

const CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const MEDIA = /^\/(assets|media)\//;

/* A blog post's address. One level under /insights, no dot (so none of
   Next's own files under out/insights/ can match). */
const POST = /^\/insights\/([a-z0-9-]{1,80})\/?$/;

export default {
  async fetch(request, env) {
    if (env.CRAWLERS === "on") return route(request, env);
    return closed(await route(request, env));
  },
};

/* Staging: keep every crawler out, search and AI alike (the CRAWLERS var
   in wrangler.jsonc). robots.txt says no to all, the sitemap and any
   llms.txt are gone, and every response says noindex in case a bot
   ignores robots.txt. */
const BOT_FILES = /^\/(sitemap\.xml|llms(-full)?\.txt|ai\.txt)$/;
const NO_BOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai";

async function route(request, env) {
  const url = new URL(request.url);
  if (env.CRAWLERS !== "on") {
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (BOT_FILES.test(url.pathname)) return new Response("Not found", { status: 404 });
  }
  return serve(request, env, url);
}

function closed(res) {
  const headers = new Headers(res.headers);
  headers.set("X-Robots-Tag", NO_BOTS);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function serve(request, env, url) {
  if (url.pathname.startsWith("/api/")) return api(request, env, url);
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return admin(request, env, url);
  if (MEDIA.test(url.pathname)) return media(request, env, url);
  if (url.searchParams.has("_rsc")) return flight(request, env, url);
  /* HEAD too: link checkers and some crawlers ask that first, and a
     post answered 404 to it looks dead to them */
  const read = request.method === "GET" || request.method === "HEAD";
  const post = read && url.pathname.match(POST);
  if (post && post[1] !== "post") return secure(await blogPost(request, env, url, post[1]));
  if (read && url.pathname === "/insights") return secure(linkPreview(await insights(request, env), url));
  if (request.method === "GET" && url.pathname === "/sitemap.xml") return sitemap(request, env);
  return secure(linkPreview(await env.ASSETS.fetch(request), url));
}

/* The baseline every public page goes out with. Static-file headers
   (public/_headers) do not reach what a Worker returns, so they are set
   here. SAMEORIGIN rather than DENY: nothing frames the site today, but
   the site framing itself should stay possible. */
function secure(res) {
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
  const headers = new Headers(res.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/* ---- the admin panel ----

   One static page (app/admin), whatever is after /admin/. The page is
   public markup with nothing in it - every piece of data comes from
   /api/admin, which checks the session. The headers lock the page down:
   no framing, no caching, no indexing, no third-party script. */
async function admin(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const shell = new URL("/admin", url);
  const res = await env.ASSETS.fetch(new Request(shell, request));
  const headers = hardenAdmin(new Headers(res.headers));
  return new Response(res.body, { status: res.status, headers });
}

/* JSON for a <script type="application/json">: nothing in it can close
   the tag or start a new one. */
const inlineJson = (data) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16));

const appendToHead = (res, html) =>
  new HTMLRewriter().on("head", { element(el) { el.append(html, { html: true }); } }).transform(res);

/* The Insights page, with what the panel has saved handed over in the
   document so the page does not wait on a second request for it. If
   anything here fails the page still goes out, drawing its built-in copy. */
async function insights(request, env) {
  const res = await env.ASSETS.fetch(request);
  if (!env.DB || !res.ok) return res;
  try {
    const data = await publicInsights(env);
    const posts = data.entries.filter((e) => e.type === "blog");
    const list = posts.length
      ? `<script type="application/ld+json">${inlineJson({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: posts.map((e, i) => ({
            "@type": "ListItem", position: i + 1, url: `${BUILT_ORIGIN}/insights/${e.slug}`, name: e.title,
          })),
        })}</script>`
      : "";
    return appendToHead(res, `${list}<script id="sc-insights" type="application/json">${inlineJson(data)}</script>`);
  } catch (e) {
    console.error("insights inject", e);
    return res;
  }
}

/* A blog post: the one static shell (app/insights/post), with this post's
   title, description and share image written into its head and the post
   itself handed over as JSON for components/BlogPost.tsx to draw. */
async function blogPost(request, env, url, slug) {
  let post = null;
  try { post = env.DB ? await publicPost(env, slug) : null; } catch (e) { console.error("post", e); }
  if (!post) return env.ASSETS.fetch(new Request(new URL("/__no-such-post__", url), request));

  const shell = await env.ASSETS.fetch(new Request(new URL("/insights/post", url), request));
  const title = `${post.data?.seoTitle || post.title} · SoCheers`;
  const description = post.data?.seoDescription || post.excerpt || "";
  const canonical = `${BUILT_ORIGIN}/insights/${post.slug}`;
  const image = post.cover ? new URL(post.cover, BUILT_ORIGIN).href : null;
  const attr = (value) => ({ element(el) { el.setAttribute("content", value); } });

  let rw = new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', attr(description))
    .on('meta[property="og:title"]', attr(title))
    .on('meta[property="og:description"]', attr(description))
    .on('meta[property="og:url"]', attr(canonical))
    .on('meta[property="og:type"]', attr("article"))
    .on('meta[name="twitter:title"]', attr(title))
    .on('meta[name="twitter:description"]', attr(description))
    .on('link[rel="canonical"]', { element(el) { el.setAttribute("href", canonical); } })
    .on('meta[name="robots"]', { element(el) { el.remove(); } });
  if (image) {
    rw = rw.on('meta[property="og:image"]', attr(image)).on('meta[name="twitter:image"]', attr(image))
      .on('meta[property="og:image:width"]', { element(el) { el.remove(); } })
      .on('meta[property="og:image:height"]', { element(el) { el.remove(); } });
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const iso = (t) => (t ? new Date(t).toISOString() : null);
  const meta = [
    iso(post.published_at) && `<meta property="article:published_time" content="${iso(post.published_at)}">`,
    iso(post.updated_at) && `<meta property="article:modified_time" content="${iso(post.updated_at)}">`,
    post.author && `<meta property="article:author" content="${esc(post.author)}">`,
    ...(post.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}">`),
  ].filter(Boolean).join("");
  const res = appendToHead(
    rw.transform(shell),
    `${meta}<script type="application/ld+json">${inlineJson(postSchema(post, canonical, image, description))}</script>` +
      `<script id="sc-post" type="application/json">${inlineJson(post)}</script>`,
  );
  const headers = new Headers(res.headers);
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return linkPreview(new Response(res.body, { status: 200, headers }), url);
}

/* What a search engine reads about a post (JSON-LD): the article, with its
   text as plain words so crawlers that don't run the page's script still
   get the content, and the breadcrumb back to Insights. Points at the
   Organization and WebSite nodes the layout already emits (lib/schema.ts). */
const runs = (rich) => (rich || []).map((r) => r.t).join("");
function postText(blocks) {
  return (blocks || []).map((b) => {
    if (b.type === "ul" || b.type === "ol") return b.items.map(runs).join(" ");
    if (b.type === "cols") return `${runs(b.left)} ${runs(b.right)}`;
    if (b.text) return runs(b.text);
    return "";
  }).filter(Boolean).join("\n\n");
}
function postSchema(post, url, cover, description) {
  const blocks = post.data?.blocks || [];
  const body = postText(blocks);
  const images = [cover, ...blocks.flatMap((b) => (b.type === "gallery" ? b.images : b.src ? [b] : []))
    .map((i) => (typeof i === "string" ? i : i.src && new URL(i.src, BUILT_ORIGIN).href))].filter(Boolean);
  const iso = (t) => (t ? new Date(t).toISOString() : undefined);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        headline: post.title.slice(0, 110),
        description,
        image: images.length ? [...new Set(images)] : undefined,
        datePublished: iso(post.published_at),
        dateModified: iso(post.updated_at || post.published_at),
        author: post.author ? { "@type": "Person", name: post.author } : { "@id": `${BUILT_ORIGIN}/#organization` },
        publisher: { "@id": `${BUILT_ORIGIN}/#organization` },
        isPartOf: { "@id": `${BUILT_ORIGIN}/#website` },
        keywords: post.tags?.length ? post.tags.join(", ") : undefined,
        articleBody: body || undefined,
        wordCount: body ? body.split(/\s+/).filter(Boolean).length : undefined,
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BUILT_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Insights", item: `${BUILT_ORIGIN}/insights` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

/* The built sitemap, plus every published post. */
async function sitemap(request, env) {
  const res = await env.ASSETS.fetch(request);
  if (!env.DB || !res.ok) return res;
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, updated_at FROM posts WHERE type = 'blog' AND status = 'published'",
    ).all();
    const extra = results.map((r) =>
      `<url><loc>${BUILT_ORIGIN}/insights/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod><priority>0.6</priority></url>`,
    ).join("");
    const xml = (await res.text()).replace("</urlset>", `${extra}</urlset>`);
    return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
  } catch (e) {
    console.error("sitemap", e);
    return env.ASSETS.fetch(request);
  }
}

/* The share preview. The build bakes https://socheers.net into og:image,
   og:url and twitter:image (metadataBase in app/layout.tsx), and until
   the domain points here that host is the old site - so WhatsApp,
   LinkedIn and the rest fetched an image that is not there and fell back
   to a bare link. Swapped to whatever host the page was asked on, so the
   preview works on socheers.in today and on socheers.net once it
   moves.
   The canonical is left alone: that one should name the real domain. */
const BUILT_ORIGIN = "https://socheers.net";

function linkPreview(res, url) {
  if (url.origin === BUILT_ORIGIN) return res;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
  const swap = {
    element(el) {
      const v = el.getAttribute("content");
      if (v && v.startsWith(BUILT_ORIGIN)) el.setAttribute("content", url.origin + v.slice(BUILT_ORIGIN.length));
    },
  };
  return new HTMLRewriter()
    .on('meta[property="og:image"]', swap)
    .on('meta[property="og:url"]', swap)
    .on('meta[name="twitter:image"]', swap)
    .transform(res);
}

/* /about?_rsc=... -> /about.txt, / -> /index.txt. A path that already
   names a file (about.txt, about/__next._tree.txt - the router asks for
   both kinds) is left alone. If there is no .txt the HTML goes back as
   before, which Next treats as "load this page normally". */
async function flight(request, env, url) {
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return withoutImageHints(await env.ASSETS.fetch(request));

  const file = new URL(url);
  file.pathname = url.pathname === "/" ? "/index.txt" : `${url.pathname.replace(/\/$/, "")}.txt`;
  const res = await env.ASSETS.fetch(new Request(file, request));
  if (!res.ok) return env.ASSETS.fetch(request);

  const headers = new Headers(res.headers);
  headers.set("content-type", "text/x-component");
  headers.set("vary", "RSC, Next-Router-State-Tree, Next-Router-Prefetch");
  return withoutImageHints(new Response(res.body, { status: res.status, headers }));
}

/* A page's data carries preload hints for that page's pictures (the
   ':HL[..., "image"]' rows), and the router acts on them the moment the
   data arrives - which for a prefetch is while you are still on another
   page. The nav prefetches every tab, so the home page was downloading
   About's and Series' photographs (well over a megabyte) during its own
   opening. The rows are dropped here; the pictures still load the normal
   way when the page they belong to is actually shown. A hint row has no
   id and nothing refers to it, so removing one changes nothing else. */
const IMAGE_HINT = /^:HL\["[^"\n]*","image"[^\n]*(?:\n|$)/gm;

async function withoutImageHints(res) {
  if (res.status !== 200) return res;
  const text = await res.text();
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(text.replace(IMAGE_HINT, ""), { status: 200, headers });
}

async function media(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  let key;
  try { key = decodeURIComponent(url.pathname.slice(1)); } catch { return new Response("Not found", { status: 404 }); }

  /* A byte range: every film on the site is fetched this way (scrubbing,
     and Safari will not play a video without it). Worked out here from
     the object's size rather than read back off R2's own answer, which
     is what sent "bytes NaN-NaN" and left every video unplayable. */
  const asked = request.headers.get("range");
  if (asked) {
    const head = await env.MEDIA.head(key);
    if (head === null) return new Response("Not found", { status: 404 });
    const r = parseRange(asked, head.size);
    if (r === "unsatisfiable") {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${head.size}` } });
    }
    if (r) {
      const obj = await env.MEDIA.get(key, { range: r });
      if (obj === null) return new Response("Not found", { status: 404 });
      const headers = mediaHeaders(obj);
      headers.set("content-range", `bytes ${r.offset}-${r.offset + r.length - 1}/${head.size}`);
      headers.set("content-length", String(r.length));
      return new Response(request.method === "HEAD" ? null : obj.body, { status: 206, headers });
    }
    /* a range this does not handle (several at once) gets the whole file */
  }

  /* Handing R2 the request headers lets it answer If-None-Match (a
     repeat visit past the fresh week) by itself. */
  const obj = await env.MEDIA.get(key, { onlyIf: request.headers });
  if (obj === null) return new Response("Not found", { status: 404 });
  const headers = mediaHeaders(obj);
  /* a conditional that matched comes back with no body */
  if (!("body" in obj)) return new Response(null, { status: 304, headers });
  headers.set("content-length", String(obj.size));
  return new Response(request.method === "HEAD" ? null : obj.body, { status: 200, headers });
}

function mediaHeaders(obj) {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", CACHE);
  headers.set("accept-ranges", "bytes");
  /* the stored type is the one the upload was checked as - never guessed */
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

/* "bytes=0-", "bytes=100-199", "bytes=-500" -> { offset, length }.
   null for anything else, "unsatisfiable" for a range past the end. */
export function parseRange(value, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start;
  let end;
  if (m[1] === "") {
    const n = Number(m[2]);
    if (n === 0) return "unsatisfiable";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { offset: start, length: end - start + 1 };
}
