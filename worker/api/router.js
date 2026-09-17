/* /api/* - the public content reads and the admin panel's API. */
import { json, error, publicJson, readJson, HttpError } from "./http.js";
import * as auth from "./auth.js";
import * as content from "./content.js";
import * as uploads from "./uploads.js";

const int = (s) => (/^\d{1,10}$/.test(s) ? Number(s) : null);

export async function api(request, env, url) {
  if (!env.DB) return error(503, "The admin database is not set up (see README).");
  const { pathname: p } = url;
  const m = request.method;

  try {
    /* ---- public ---- */
    if (m === "GET" && p === "/api/content/logo-wall") return await content.publicLogoWall(env);
    if (m === "GET" && p === "/api/content/awards") return await content.publicAwards(env);
    if (m === "GET" && p === "/api/content/insights") return publicJson(await content.publicInsights(env));
    if (m === "GET" && p.startsWith("/api/content/posts/")) {
      const post = await content.publicPost(env, p.slice("/api/content/posts/".length));
      return post ? publicJson({ post }) : error(404, "Not found");
    }

    if (!p.startsWith("/api/admin/")) return error(404, "Not found");

    /* ---- admin: everything below passes the cross-site check ---- */
    auth.checkCsrf(request);
    const r = p.slice("/api/admin".length);
    let seg;

    if (m === "POST" && r === "/login") return await auth.login(env, request);
    if (m === "POST" && r === "/logout") return await auth.logout(env, request);
    if (m === "GET" && r === "/me") return await auth.me(env, request);
    if (m === "POST" && r === "/password") return await auth.changePassword(env, request);
    if (m === "POST" && r === "/sessions/revoke") return await auth.signOutEverywhere(env, request);
    if (m === "POST" && r === "/2fa/begin") return await auth.totpBegin(env, request);
    if (m === "POST" && r === "/2fa/confirm") return await auth.totpConfirm(env, request);
    if (m === "POST" && r === "/2fa/disable") return await auth.totpDisable(env, request);

    if (m === "GET" && r === "/admins") return await auth.listAdmins(env, request);
    if (m === "POST" && r === "/admins") return await auth.createAdmin(env, request);
    if ((seg = r.match(/^\/admins\/(\d+)$/))) {
      if (m === "PATCH") return await auth.updateAdmin(env, request, int(seg[1]));
      if (m === "DELETE") return await auth.deleteAdmin(env, request, int(seg[1]));
    }
    if (m === "GET" && r === "/audit") return await auth.auditLog(env, request);

    if (m === "POST" && r === "/uploads") return await uploads.upload(env, request);
    if (m === "GET" && r === "/uploads") return await uploads.listUploads(env, request, url);
    if ((seg = r.match(/^\/uploads\/([a-z0-9]{8,40})$/))) {
      if (m === "PATCH") return await uploads.renameUpload(env, request, seg[1], await readJson(request, 2000));
      if (m === "DELETE") return await uploads.deleteUpload(env, request, seg[1]);
    }

    if (r === "/logo-wall") {
      if (m === "GET") return await content.adminLogoWall(env, request);
      if (m === "PUT") return await content.saveLogoWall(env, request);
    }

    if (r === "/awards") {
      if (m === "GET") return await content.adminAwards(env, request);
      if (m === "PUT") return await content.saveAwards(env, request);
    }

    if (m === "GET" && r === "/insights") return await content.adminInsights(env, request);
    if (m === "PUT" && r === "/insights/settings") return await content.saveInsightsSettings(env, request);
    if (m === "POST" && r === "/insights/seed") return await content.seedInsights(env, request);
    if (m === "POST" && r === "/insights/reorder") return await content.reorderEntries(env, request);
    if (m === "POST" && r === "/entries") return await content.createEntry(env, request);
    if ((seg = r.match(/^\/entries\/(\d+)$/))) {
      const id = int(seg[1]);
      if (m === "GET") return await content.getEntry(env, request, id);
      if (m === "PUT") return await content.updateEntry(env, request, id);
      if (m === "DELETE") return await content.deleteEntry(env, request, id);
    }

    if (r === "/templates") {
      if (m === "GET") return await content.listTemplates(env, request);
      if (m === "POST") return await content.createTemplate(env, request);
    }
    if (m === "DELETE" && (seg = r.match(/^\/templates\/(\d+)$/))) return await content.deleteTemplate(env, request, int(seg[1]));

    return error(404, "Not found");
  } catch (e) {
    if (e instanceof HttpError) return error(e.status, e.message);
    console.error("api", p, e);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}
