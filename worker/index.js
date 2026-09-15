/* ============================================================
   THE CLOUDFLARE WORKER IN FRONT OF THE SITE.

   The pages are static files out of `next build` (out/), and Cloudflare
   serves those on its own. The pictures and films are not in that
   upload: they live in the R2 bucket bound below as MEDIA, uploaded by
   scripts/upload-r2.mjs, because several of the films are over the 25MB
   Cloudflare allows for a single static file.

   The paths did not change. /assets/... and /media/... are still what
   every page asks for; wrangler.jsonc sends just those two prefixes here
   first, and this reads the same key out of R2. Same origin, so the 3D
   models, the canvases and the video all load exactly as they do in dev.
   ============================================================ */

/* A week fresh, a month stale-while-revalidate. The reasoning is in
   next.config.mjs, above headers() - it is the same rule, moved here
   because static-file headers do not apply to what a Worker returns. */
const CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const MEDIA = /^\/(assets|media)\//;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!MEDIA.test(url.pathname)) return env.ASSETS.fetch(request);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const key = decodeURIComponent(url.pathname.slice(1));
    /* Handing R2 the request headers lets it answer Range (a film being
       scrubbed, and Safari will not play a video without it) and
       If-None-Match (a repeat visit past the fresh week) by itself. */
    const obj = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers });
    if (obj === null) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("etag", obj.httpEtag);
    headers.set("cache-control", CACHE);
    headers.set("accept-ranges", "bytes");

    /* A conditional that did not match comes back with no body. */
    if (!("body" in obj)) return new Response(null, { status: 304, headers });

    let status = 200;
    if (request.headers.has("range") && obj.range) {
      const r = obj.range;
      const offset = "suffix" in r ? obj.size - r.suffix : (r.offset ?? 0);
      const length = "suffix" in r ? r.suffix : (r.length ?? obj.size - offset);
      headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
      headers.set("content-length", String(length));
      status = 206;
    } else {
      headers.set("content-length", String(obj.size));
    }

    return new Response(request.method === "HEAD" ? null : obj.body, { status, headers });
  },
};
