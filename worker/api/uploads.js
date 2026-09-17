/* ============================================================
   FILE UPLOADS - pictures, fonts and PDFs, into R2.

   The browser's word for what a file is counts for nothing: the
   type is read off the file's own first bytes, and only the formats
   below get in. SVG is refused on purpose - an SVG is a document
   that can carry script. Files get a random name, so an upload can
   never overwrite a site asset or another upload.
   ============================================================ */
import { json, error, now, HttpError } from "./http.js";
import { requireAdmin, audit } from "./auth.js";
import { b64url, randomBytes } from "./crypto.js";

const MB = 1024 * 1024;
const LIMITS = { image: 10 * MB, font: 4 * MB, pdf: 80 * MB };

const ascii = (bytes, from, to) => String.fromCharCode(...bytes.slice(from, to));

function sniff(bytes) {
  if (bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG") return { kind: "image", ext: "png", type: "image/png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", ext: "jpg", type: "image/jpeg" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return { kind: "image", ext: "webp", type: "image/webp" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { kind: "image", ext: "gif", type: "image/gif" };
  if (ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) return { kind: "image", ext: "avif", type: "image/avif" };
  if (ascii(bytes, 0, 4) === "wOF2") return { kind: "font", ext: "woff2", type: "font/woff2" };
  if (ascii(bytes, 0, 4) === "wOFF") return { kind: "font", ext: "woff", type: "font/woff" };
  if (ascii(bytes, 0, 4) === "OTTO") return { kind: "font", ext: "otf", type: "font/otf" };
  if ((bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0) || ascii(bytes, 0, 4) === "true") {
    return { kind: "font", ext: "ttf", type: "font/ttf" };
  }
  if (ascii(bytes, 0, 5) === "%PDF-") return { kind: "pdf", ext: "pdf", type: "application/pdf" };
  return null;
}

export async function upload(env, request) {
  const admin = await requireAdmin(env, request);
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > LIMITS.pdf + MB) return error(413, "That file is too large.");

  let form;
  try { form = await request.formData(); } catch { return error(400, "Expected a file upload."); }
  const file = form.get("file");
  const want = String(form.get("kind") || "");
  if (!file || typeof file === "string") return error(400, "No file received.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const found = sniff(bytes.slice(0, 16));
  if (!found) return error(415, "Use PNG, JPG, WebP, GIF or AVIF for pictures, WOFF2/WOFF/TTF/OTF for fonts, or PDF.");
  if (want && want !== found.kind) return error(415, `That file is not a${want === "image" ? "n image" : ` ${want}`}.`);
  if (bytes.length > LIMITS[found.kind]) return error(413, `Keep ${found.kind}s under ${LIMITS[found.kind] / MB}MB.`);

  const width = Math.min(20000, Math.max(0, Number(form.get("width")) || 0)) || null;
  const height = Math.min(20000, Math.max(0, Number(form.get("height")) || 0)) || null;
  const name = String(form.get("name") || file.name || "file").replace(/[^\w .()'&!-]/g, "").trim().slice(0, 80) || "file";

  const fileId = b64url(randomBytes(15)).replace(/[-_]/g, "x").toLowerCase();
  const key = `media/u/${fileId}.${found.ext}`;
  await env.MEDIA.put(key, bytes, {
    httpMetadata: {
      contentType: found.type,
      contentDisposition: found.kind === "pdf" ? `inline; filename="${name.replace(/"/g, "")}.pdf"` : undefined,
    },
  });
  const url = `/${key}`;
  await env.DB.prepare(
    `INSERT INTO uploads (id, kind, r2_key, url, name, content_type, size, width, height, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(fileId, found.kind, key, url, name, found.type, bytes.length, width, height, now(), admin.id).run();
  await audit(env, request, admin.id, "upload", `${found.kind} ${name} ${url}`);
  return json({ id: fileId, kind: found.kind, url, name, width, height, size: bytes.length });
}

export async function listUploads(env, request, url) {
  await requireAdmin(env, request);
  const kind = url.searchParams.get("kind");
  if (!["image", "font", "pdf"].includes(kind)) throw new HttpError(400, "kind must be image, font or pdf");
  const { results } = await env.DB.prepare(
    "SELECT id, kind, url, name, size, width, height, created_at FROM uploads WHERE kind = ? ORDER BY created_at DESC LIMIT 300",
  ).bind(kind).all();
  return json({ uploads: results });
}

export async function renameUpload(env, request, fileId, body) {
  const admin = await requireAdmin(env, request);
  const name = String(body.name || "").replace(/[^\w .()'&!-]/g, "").trim().slice(0, 80);
  if (!name) return error(400, "Enter a name.");
  await env.DB.prepare("UPDATE uploads SET name = ? WHERE id = ?").bind(name, fileId).run();
  await audit(env, request, admin.id, "upload.rename", `${fileId} ${name}`);
  return json({ ok: true });
}

export async function deleteUpload(env, request, fileId) {
  const admin = await requireAdmin(env, request);
  const row = await env.DB.prepare("SELECT r2_key, name FROM uploads WHERE id = ?").bind(fileId).first();
  if (!row) return error(404, "No such file.");
  await env.MEDIA.delete(row.r2_key);
  await env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(fileId).run();
  await audit(env, request, admin.id, "upload.delete", `${row.name} ${row.r2_key}`);
  return json({ ok: true });
}

/* Public: the uploaded fonts, so the client wall can load them. */
export async function publicFonts(env) {
  const { results } = await env.DB.prepare("SELECT id, name, url, content_type FROM uploads WHERE kind = 'font' ORDER BY name").all();
  return results;
}
