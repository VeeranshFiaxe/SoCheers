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
const CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const MEDIA = /^\/(assets|media)\//;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (MEDIA.test(url.pathname)) return media(request, env, url);
    if (url.searchParams.has("_rsc")) return flight(request, env, url);
    return linkPreview(await env.ASSETS.fetch(request), url);
  },
};

/* The share preview. The build bakes https://socheers.net into og:image,
   og:url and twitter:image (metadataBase in app/layout.tsx), and until
   the domain points here that host is the old site - so WhatsApp,
   LinkedIn and the rest fetched an image that is not there and fell back
   to a bare link. Swapped to whatever host the page was asked on, so the
   preview works on socheers.fiaxe.in today and on socheers.net once it
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
  const key = decodeURIComponent(url.pathname.slice(1));

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
