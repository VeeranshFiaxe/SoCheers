/* ============================================================
   WHAT THE PANEL EDITS: the client wall, and the Insights page -
   its frame (hero, tabs, topics) and every entry listed on it.

   Until something is saved, the public endpoints answer null and the
   site keeps drawing what is in lib/content.ts and lib/blog-content.ts.
   ============================================================ */
import { json, error, publicJson, readJson, now } from "./http.js";
import { requireAdmin, audit } from "./auth.js";
import * as v from "./validate.js";
import { publicFonts } from "./uploads.js";

const getSetting = async (env, key) => {
  const row = await env.DB.prepare("SELECT value, updated_at FROM settings WHERE key = ?").bind(key).first();
  return row ? { value: JSON.parse(row.value), updatedAt: row.updated_at } : null;
};

async function putSetting(env, request, admin, key, value, expected) {
  const current = await env.DB.prepare("SELECT updated_at FROM settings WHERE key = ?").bind(key).first();
  /* someone else saved since this editor loaded - don't silently undo their work */
  if (current && expected && current.updated_at !== expected) {
    return error(409, "Someone else saved this in the meantime. Reload to see their changes.");
  }
  const t = now();
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(key, JSON.stringify(value), t, admin.id).run();
  await audit(env, request, admin.id, `settings.${key}`);
  return json({ ok: true, updatedAt: t });
}

/* ---- client wall ---- */

export async function publicLogoWall(env) {
  const [wall, fonts] = await Promise.all([getSetting(env, "logoWall"), publicFonts(env)]);
  return publicJson({ wall: wall?.value ?? null, fonts });
}

export async function adminLogoWall(env, request) {
  await requireAdmin(env, request);
  const wall = await getSetting(env, "logoWall");
  return json({ wall: wall?.value ?? null, updatedAt: wall?.updatedAt ?? null });
}

export async function saveLogoWall(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 400_000);
  return putSetting(env, request, admin, "logoWall", v.logoWall(body.wall), body.updatedAt);
}

/* ---- awards strip ---- */

export async function publicAwards(env) {
  const awards = await getSetting(env, "awards");
  return publicJson({ awards: awards?.value ?? null });
}

export async function adminAwards(env, request) {
  await requireAdmin(env, request);
  const awards = await getSetting(env, "awards");
  return json({ awards: awards?.value ?? null, updatedAt: awards?.updatedAt ?? null });
}

export async function saveAwards(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 50_000);
  return putSetting(env, request, admin, "awards", v.awards(body.awards), body.updatedAt);
}

/* ---- insights ---- */

const parseEntry = (row, full) => {
  const data = JSON.parse(row.data || "{}");
  const out = {
    id: row.id, type: row.type, slug: row.slug, title: row.title, excerpt: row.excerpt,
    cover: row.cover, cover_alt: row.cover_alt, author: row.author, tags: JSON.parse(row.tags || "[]"),
    status: row.status, position: row.position, published_at: row.published_at, updated_at: row.updated_at,
  };
  if (row.type !== "blog") out.data = data;
  else if (full) out.data = data;
  return out;
};

export async function publicInsights(env) {
  const [settings, { results }] = await Promise.all([
    getSetting(env, "insights"),
    env.DB.prepare(
      "SELECT * FROM posts WHERE status = 'published' ORDER BY position ASC, published_at DESC",
    ).all(),
  ]);
  return {
    settings: settings?.value ?? null,
    seeded: !!(await env.DB.prepare("SELECT 1 FROM settings WHERE key = 'insightsSeeded'").first()),
    entries: results.map((r) => parseEntry(r, false)),
  };
}

export async function publicPost(env, slug) {
  if (!v.SLUG.test(slug)) return null;
  const row = await env.DB.prepare("SELECT * FROM posts WHERE slug = ? AND type = 'blog' AND status = 'published'").bind(slug).first();
  return row ? parseEntry(row, true) : null;
}

export async function adminInsights(env, request) {
  await requireAdmin(env, request);
  const [settings, seeded, { results }] = await Promise.all([
    getSetting(env, "insights"),
    env.DB.prepare("SELECT 1 FROM settings WHERE key = 'insightsSeeded'").first(),
    env.DB.prepare("SELECT * FROM posts ORDER BY type, position ASC, updated_at DESC").all(),
  ]);
  return json({
    settings: settings?.value ?? null,
    settingsUpdatedAt: settings?.updatedAt ?? null,
    seeded: !!seeded,
    entries: results.map((r) => parseEntry(r, false)),
  });
}

export async function saveInsightsSettings(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 100_000);
  return putSetting(env, request, admin, "insights", v.insightsSettings(body.settings), body.updatedAt);
}

/* The first time the panel opens Insights, it hands over what the page
   ships with (the frame and the two papers) so editing starts from the
   live page rather than from nothing. Runs once. */
export async function seedInsights(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 200_000);
  const done = await env.DB.prepare("SELECT 1 FROM settings WHERE key = 'insightsSeeded'").first();
  if (done) return json({ ok: true, skipped: true });
  const t = now();
  const stmts = [
    env.DB.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at, updated_by) VALUES ('insights', ?, ?, ?)")
      .bind(JSON.stringify(v.insightsSettings(body.settings)), t, admin.id),
    env.DB.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at, updated_by) VALUES ('insightsSeeded', 'true', ?, ?)").bind(t, admin.id),
  ];
  (Array.isArray(body.entries) ? body.entries : []).slice(0, 20).forEach((raw, i) => {
    const e = v.entry(raw);
    stmts.push(env.DB.prepare(
      `INSERT OR IGNORE INTO posts (type, slug, title, excerpt, cover, cover_alt, author, tags, data, position, status, published_at, created_at, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(e.type, e.slug, e.title, e.excerpt, e.cover, e.cover_alt, e.author, e.tags, e.data, i, e.status, e.status === "published" ? t : null, t, t, admin.id));
  });
  await env.DB.batch(stmts);
  await audit(env, request, admin.id, "insights.seed");
  return json({ ok: true });
}

export async function getEntry(env, request, id) {
  await requireAdmin(env, request);
  const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
  return row ? json({ entry: parseEntry(row, true) }) : error(404, "Not found");
}

export async function createEntry(env, request) {
  const admin = await requireAdmin(env, request);
  const e = v.entry(await readJson(request, 2_000_000));
  const t = now();
  const last = await env.DB.prepare("SELECT MAX(position) AS p FROM posts WHERE type = ?").bind(e.type).first();
  try {
    const res = await env.DB.prepare(
      `INSERT INTO posts (type, slug, title, excerpt, cover, cover_alt, author, tags, data, position, status, published_at, created_at, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, updated_at`,
    ).bind(e.type, e.slug, e.title, e.excerpt, e.cover, e.cover_alt, e.author, e.tags, e.data, (last?.p ?? -1) + 1,
      e.status, e.status === "published" ? t : null, t, t, admin.id).first();
    await audit(env, request, admin.id, `${e.type}.create`, e.slug);
    return json({ id: res.id, updatedAt: res.updated_at });
  } catch {
    return error(409, "That URL name is already used by another entry.");
  }
}

export async function updateEntry(env, request, id) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 2_000_000);
  const current = await env.DB.prepare("SELECT updated_at, published_at, status FROM posts WHERE id = ?").bind(id).first();
  if (!current) return error(404, "Not found");
  if (body.updatedAt && body.updatedAt !== current.updated_at) {
    return error(409, "Someone else saved this in the meantime. Reload to see their changes.");
  }
  const e = v.entry(body);
  const t = now();
  const publishedAt = e.status === "published" ? (current.published_at ?? t) : current.published_at;
  try {
    await env.DB.prepare(
      `UPDATE posts SET type = ?, slug = ?, title = ?, excerpt = ?, cover = ?, cover_alt = ?, author = ?, tags = ?, data = ?,
              status = ?, published_at = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
    ).bind(e.type, e.slug, e.title, e.excerpt, e.cover, e.cover_alt, e.author, e.tags, e.data, e.status, publishedAt, t, admin.id, id).run();
  } catch {
    return error(409, "That URL name is already used by another entry.");
  }
  await audit(env, request, admin.id, `${e.type}.update`, `${e.slug} ${current.status}->${e.status}`);
  return json({ ok: true, updatedAt: t });
}

export async function deleteEntry(env, request, id) {
  const admin = await requireAdmin(env, request);
  const row = await env.DB.prepare("SELECT type, slug FROM posts WHERE id = ?").bind(id).first();
  if (!row) return error(404, "Not found");
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  await audit(env, request, admin.id, `${row.type}.delete`, row.slug);
  return json({ ok: true });
}

export async function reorderEntries(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 50_000);
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Number.isInteger).slice(0, 500);
  if (!ids.length) return json({ ok: true });
  await env.DB.batch(ids.map((pid, i) => env.DB.prepare("UPDATE posts SET position = ? WHERE id = ?").bind(i, pid)));
  await audit(env, request, admin.id, "insights.reorder");
  return json({ ok: true });
}

/* ---- saved layouts ---- */

export async function listTemplates(env, request) {
  await requireAdmin(env, request);
  const { results } = await env.DB.prepare("SELECT id, name, blocks, created_at FROM templates ORDER BY name").all();
  return json({ templates: results.map((r) => ({ ...r, blocks: JSON.parse(r.blocks) })) });
}

export async function createTemplate(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 2_000_000);
  const name = String(body.name || "").trim().slice(0, 80);
  if (!name) return error(400, "Name the template.");
  await env.DB.prepare("INSERT INTO templates (name, blocks, created_at, created_by) VALUES (?, ?, ?, ?)")
    .bind(name, JSON.stringify(v.blocks(body.blocks)), now(), admin.id).run();
  await audit(env, request, admin.id, "template.create", name);
  return json({ ok: true });
}

export async function deleteTemplate(env, request, id) {
  const admin = await requireAdmin(env, request);
  await env.DB.prepare("DELETE FROM templates WHERE id = ?").bind(id).run();
  await audit(env, request, admin.id, "template.delete", String(id));
  return json({ ok: true });
}
