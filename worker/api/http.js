/* Response helpers and the headers every admin response carries. */

/* The admin shell is a Next page, so its inline boot scripts need
   'unsafe-inline'. Everything else is locked to this origin: no third
   party script, no framing, no form posting elsewhere. */
export const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: blob:",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function hardenAdmin(headers) {
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Security-Policy", ADMIN_CSP);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return headers;
}

export function json(data, status = 200, extra = {}) {
  const headers = hardenAdmin(new Headers({ "content-type": "application/json; charset=utf-8", ...extra }));
  return new Response(JSON.stringify(data), { status, headers });
}

export const error = (status, message, extra) => json({ error: message, ...extra }, status);

/* Public content: readable by the site. Never served from a cache
   without asking first - an unpublished post or a changed wall has to
   disappear on the next load, not a few minutes later. */
export function publicJson(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function readJson(request, limit = 1_000_000) {
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) {
    throw new HttpError(415, "Expected JSON");
  }
  const text = await request.text();
  if (text.length > limit) throw new HttpError(413, "Too large");
  try { return JSON.parse(text); } catch { throw new HttpError(400, "Malformed JSON"); }
}

export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "local";
export const now = () => Date.now();
