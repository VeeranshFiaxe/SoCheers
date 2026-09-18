/* ============================================================
   ADMIN ACCOUNTS, LOGIN, SESSIONS, 2FA.

   There is no sign-up. The first owner is made from a terminal
   (scripts/admin-create.mjs); after that owners add accounts from
   the panel.

   Session cookie: __Host- prefix (Secure, Path=/, no Domain - so no
   subdomain can set or read it), HttpOnly (no script can read it),
   SameSite=Strict (never sent from another site). Two hours idle,
   twelve hours at most. Every write also needs a same-origin Origin
   and the X-SC-Admin header, which a cross-site form cannot send.
   ============================================================ */
import { json, error, readJson, clientIp, now, HttpError } from "./http.js";
import {
  hashPassword, verifyPassword, burnPasswordTime, randomToken, sha256,
  seal, open, hasEncKey, base32, randomBytes, checkTotp, safeEqual,
} from "./crypto.js";
import { hasMail, sendMail } from "./mail.js";

const COOKIE = "__Host-sc_adm";
const IDLE = 2 * 60 * 60 * 1000;
const ABSOLUTE = 12 * 60 * 60 * 1000;
const WINDOW = 15 * 60 * 1000;
const MAX_EMAIL_FAILS = 5;
const MAX_IP_FAILS = 25;
export const MIN_PASSWORD = 12;

export async function audit(env, request, adminId, action, detail) {
  await env.DB.prepare("INSERT INTO audit_log (at, admin_id, action, detail, ip) VALUES (?, ?, ?, ?, ?)")
    .bind(now(), adminId ?? null, action, detail ? String(detail).slice(0, 500) : null, clientIp(request))
    .run();
}

/* ---- the gate every /api/admin write passes ---- */

export function checkCsrf(request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  const self = new URL(request.url).origin;
  /* under `npm run dev` the page is on localhost:3000 and Next proxies
     to the Worker on :8787 - both are this machine */
  const localDev = isLocal(request) && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
  if (origin !== self && !localDev) throw new HttpError(403, "Cross-origin request refused");
  if (request.headers.get("x-sc-admin") !== "1") throw new HttpError(403, "Missing admin header");
}

const readCookie = (request) => {
  const m = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
};

const setCookie = (token, maxAgeSec) =>
  `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}`;

export async function currentAdmin(env, request) {
  const token = readCookie(request);
  if (!token || token.length > 100) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT s.token_hash, s.created_at, s.last_seen, a.id, a.email, a.name, a.role, a.must_change,
            a.totp_secret IS NOT NULL AS totp
       FROM sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND a.disabled = 0`,
  ).bind(hash).first();
  if (!row) return null;
  const t = now();
  if (t - row.last_seen > IDLE || t - row.created_at > ABSOLUTE) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  /* sliding idle window, written at most once a minute */
  if (t - row.last_seen > 60000) {
    await env.DB.prepare("UPDATE sessions SET last_seen = ? WHERE token_hash = ?").bind(t, hash).run();
  }
  return {
    id: row.id, email: row.email, name: row.name, role: row.role,
    mustChange: !!row.must_change, totp: !!row.totp, sessionHash: hash,
  };
}

export async function requireAdmin(env, request, { allowMustChange = false, owner = false } = {}) {
  const admin = await currentAdmin(env, request);
  if (!admin) throw new HttpError(401, "Not signed in");
  if (admin.mustChange && !allowMustChange) throw new HttpError(403, "Password change required");
  if (owner && admin.role !== "owner") throw new HttpError(403, "Owners only");
  return admin;
}

/* ---- rate limiting ---- */

async function failures(env, key) {
  const row = await env.DB.prepare("SELECT failures, window_start FROM login_attempts WHERE key = ?").bind(key).first();
  if (!row || now() - row.window_start > WINDOW) return 0;
  return row.failures;
}

async function recordFailure(env, key) {
  const t = now();
  await env.DB.prepare(
    `INSERT INTO login_attempts (key, failures, window_start) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       failures = CASE WHEN ? - window_start > ? THEN 1 ELSE failures + 1 END,
       window_start = CASE WHEN ? - window_start > ? THEN ? ELSE window_start END`,
  ).bind(key, t, t, WINDOW, t, WINDOW, t).run();
}

/* ---- the local guest account ----

   For previewing the panel under `wrangler dev`: ADMIN_GUEST_EMAIL and
   ADMIN_GUEST_PASSWORD come from .env (gitignored, never in the repo).
   Only honoured on localhost, so the same variables set on the live
   Worker open nothing. The account is written on the fly with the
   password hashed like any other. */
const isLocal = (request) => ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);

async function ensureGuest(env, request, email, password) {
  const guestEmail = String(env.ADMIN_GUEST_EMAIL || "").trim().toLowerCase();
  const guestPassword = String(env.ADMIN_GUEST_PASSWORD || "");
  if (!guestEmail || guestPassword.length < 12 || !isLocal(request)) return;
  if (email !== guestEmail || !safeEqual(password, guestPassword)) return;
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE email = ?").bind(guestEmail).first();
  if (row && (await verifyPassword(guestPassword, row.password_hash))) return;
  const t = now();
  await env.DB.prepare(
    `INSERT INTO admins (email, name, role, password_hash, must_change, created_at, updated_at)
     VALUES (?, 'Guest', 'owner', ?, 0, ?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, disabled = 0, must_change = 0, updated_at = excluded.updated_at`,
  ).bind(guestEmail, await hashPassword(guestPassword), t, t).run();
}

/* ---- routes ---- */

export async function login(env, request) {
  const body = await readJson(request, 4000);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  const password = String(body.password || "").slice(0, 512);
  const code = String(body.code || "").replace(/\s/g, "");
  const ip = clientIp(request);

  if ((await failures(env, `ip:${ip}`)) >= MAX_IP_FAILS || (await failures(env, `email:${email}`)) >= MAX_EMAIL_FAILS) {
    await audit(env, request, null, "login.locked", email);
    return error(429, "Too many attempts. Try again in 15 minutes.");
  }

  await ensureGuest(env, request, email, password);
  const admin = await env.DB.prepare("SELECT * FROM admins WHERE email = ? AND disabled = 0").bind(email).first();
  const ok = admin ? await verifyPassword(password, admin.password_hash) : (await burnPasswordTime(password), false);

  if (!ok) {
    await recordFailure(env, `ip:${ip}`);
    await recordFailure(env, `email:${email}`);
    await audit(env, request, admin?.id, "login.fail", email);
    return error(401, "Wrong email or password.");
  }

  if (admin.totp_secret) {
    if (!code) return json({ needCode: true });
    const step = await checkTotp(await open(env, admin.totp_secret), code);
    if (step < 0 || step <= admin.totp_last) {
      await recordFailure(env, `ip:${ip}`);
      await recordFailure(env, `email:${email}`);
      await audit(env, request, admin.id, "login.fail.2fa", email);
      return error(401, "That code did not work.", { needCode: true });
    }
    await env.DB.prepare("UPDATE admins SET totp_last = ? WHERE id = ?").bind(step, admin.id).run();
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE key = ?").bind(`email:${email}`).run();
  const token = randomToken(32);
  const t = now();
  await env.DB.batch([
    /* housekeeping: expired sessions go whenever anyone signs in */
    env.DB.prepare("DELETE FROM sessions WHERE last_seen < ? OR created_at < ?").bind(t - IDLE, t - ABSOLUTE),
    env.DB.prepare(
      "INSERT INTO sessions (token_hash, admin_id, created_at, last_seen, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(await sha256(token), admin.id, t, t, t + ABSOLUTE, ip, (request.headers.get("user-agent") || "").slice(0, 200)),
  ]);
  await audit(env, request, admin.id, "login.ok");
  return json({ ok: true }, 200, { "set-cookie": setCookie(token, ABSOLUTE / 1000) });
}

export async function logout(env, request) {
  const admin = await currentAdmin(env, request);
  if (admin) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(admin.sessionHash).run();
    await audit(env, request, admin.id, "logout");
  }
  return json({ ok: true }, 200, { "set-cookie": setCookie("", 0) });
}

export async function me(env, request) {
  const admin = await currentAdmin(env, request);
  if (!admin) return error(401, "Not signed in");
  const { sessionHash, ...pub } = admin;
  return json({ admin: pub, twoFactorAvailable: hasEncKey(env), mailAvailable: hasMail(env) });
}

export function checkPasswordStrength(pw, email) {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 256) return "That password is too long.";
  if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) return "Don't use your email in the password.";
  if (new Set(pw).size < 6) return "Use more different characters.";
  return null;
}

export async function changePassword(env, request) {
  const admin = await requireAdmin(env, request, { allowMustChange: true });
  const body = await readJson(request, 4000);
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(admin.id).first();
  if (!(await verifyPassword(String(body.current || ""), row.password_hash))) {
    await audit(env, request, admin.id, "password.fail");
    return error(401, "Current password is wrong.");
  }
  const weak = checkPasswordStrength(body.next, admin.email);
  if (weak) return error(400, weak);
  if (body.next === body.current) return error(400, "Pick a new password.");
  await env.DB.batch([
    env.DB.prepare("UPDATE admins SET password_hash = ?, must_change = 0, updated_at = ? WHERE id = ?")
      .bind(await hashPassword(body.next), now(), admin.id),
    /* every other device is signed out */
    env.DB.prepare("DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?").bind(admin.id, admin.sessionHash),
  ]);
  await audit(env, request, admin.id, "password.change");
  await passwordChangedNotice(env, admin);
  return json({ ok: true });
}

/* ---- 2FA ---- */

export async function totpBegin(env, request) {
  const admin = await requireAdmin(env, request);
  if (!hasEncKey(env)) return error(503, "2FA is not configured on the server (ADMIN_ENC_KEY).");
  const secret = base32(randomBytes(20));
  await env.DB.prepare("UPDATE admins SET totp_pending = ? WHERE id = ?").bind(await seal(env, secret), admin.id).run();
  const label = encodeURIComponent(`SoCheers Admin:${admin.email}`);
  return json({ secret, uri: `otpauth://totp/${label}?secret=${secret}&issuer=SoCheers%20Admin&algorithm=SHA1&digits=6&period=30` });
}

export async function totpConfirm(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 1000);
  const row = await env.DB.prepare("SELECT totp_pending FROM admins WHERE id = ?").bind(admin.id).first();
  if (!row?.totp_pending) return error(400, "Start 2FA setup first.");
  const step = await checkTotp(await open(env, row.totp_pending), String(body.code || "").replace(/\s/g, ""));
  if (step < 0) return error(400, "That code did not work. Check your phone's clock.");
  await env.DB.prepare("UPDATE admins SET totp_secret = totp_pending, totp_pending = NULL, totp_last = ?, updated_at = ? WHERE id = ?")
    .bind(step, now(), admin.id).run();
  await audit(env, request, admin.id, "2fa.on");
  return json({ ok: true });
}

export async function totpDisable(env, request) {
  const admin = await requireAdmin(env, request);
  const body = await readJson(request, 2000);
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(admin.id).first();
  if (!(await verifyPassword(String(body.password || ""), row.password_hash))) return error(401, "Password is wrong.");
  await env.DB.prepare("UPDATE admins SET totp_secret = NULL, totp_pending = NULL, totp_last = 0, updated_at = ? WHERE id = ?")
    .bind(now(), admin.id).run();
  await audit(env, request, admin.id, "2fa.off");
  return json({ ok: true });
}

export async function signOutEverywhere(env, request) {
  const admin = await requireAdmin(env, request, { allowMustChange: true });
  await env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(admin.id).run();
  await audit(env, request, admin.id, "sessions.revoke");
  return json({ ok: true }, 200, { "set-cookie": setCookie("", 0) });
}

/* ---- password links by email ----

   "Forgot password" and the welcome link for a new person. The token
   goes in the link's # part (/admin#/reset/<token>), which browsers never
   send to a server or in a Referer. One use, then gone; asking again
   replaces any older link. Two-step sign-in still applies afterwards. */
const RESET_TTL = 60 * 60 * 1000;
const WELCOME_TTL = 3 * 24 * 60 * 60 * 1000;

/* where the panel lives, as the person clicking the button sees it -
   under `npm run dev` that is the Next port, not the Worker's */
const panelOrigin = (request) => request.headers.get("origin") || new URL(request.url).origin;

async function issueLink(env, adminId, kind) {
  const token = randomToken(32);
  const t = now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM password_links WHERE admin_id = ? OR expires_at < ?").bind(adminId, t),
    env.DB.prepare("INSERT INTO password_links (token_hash, admin_id, kind, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .bind(await sha256(token), adminId, kind, t, t + (kind === "welcome" ? WELCOME_TTL : RESET_TTL)),
  ]);
  return token;
}

export async function forgotPassword(env, request) {
  if (!hasMail(env)) return error(503, "Email isn't set up yet. Ask an owner to reset your password.");
  const body = await readJson(request, 1000);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  const ip = clientIp(request);
  /* counted as tries, so the link can't be used to flood someone's inbox */
  if ((await failures(env, `reset-ip:${ip}`)) >= 10 || (await failures(env, `reset:${email}`)) >= 3) {
    return error(429, "Too many requests. Try again in 15 minutes.");
  }
  await recordFailure(env, `reset-ip:${ip}`);
  await recordFailure(env, `reset:${email}`);
  const admin = await env.DB.prepare("SELECT id, name, email FROM admins WHERE email = ? AND disabled = 0").bind(email).first();
  /* the same answer either way - it must not tell anyone which emails have accounts */
  if (admin) {
    const token = await issueLink(env, admin.id, "reset");
    await sendMail(env, {
      to: admin.email,
      subject: "Reset your SoCheers Admin password",
      lines: [`Hi ${admin.name},`, "Someone asked to reset the password for your SoCheers Admin account. The link below works once, for the next hour."],
      button: { label: "Choose a new password", href: `${panelOrigin(request)}/admin#/reset/${token}` },
    });
    await audit(env, request, admin.id, "password.resetAsked");
  }
  return json({ ok: true });
}

export async function checkLink(env, request) {
  const body = await readJson(request, 1000);
  const row = await linkRow(env, body.token);
  if (!row) return error(400, "This link has expired or was already used. Ask for a new one.");
  return json({ ok: true, kind: row.kind, name: row.name, email: row.email });
}

async function linkRow(env, token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  return env.DB.prepare(
    `SELECT l.token_hash, l.kind, a.id, a.name, a.email FROM password_links l JOIN admins a ON a.id = l.admin_id
      WHERE l.token_hash = ? AND l.expires_at > ? AND a.disabled = 0`,
  ).bind(await sha256(token), now()).first();
}

export async function resetPassword(env, request) {
  const body = await readJson(request, 2000);
  const row = await linkRow(env, body.token);
  if (!row) return error(400, "This link has expired or was already used. Ask for a new one.");
  const weak = checkPasswordStrength(body.password, row.email);
  if (weak) return error(400, weak);
  await env.DB.batch([
    env.DB.prepare("UPDATE admins SET password_hash = ?, must_change = 0, updated_at = ? WHERE id = ?")
      .bind(await hashPassword(body.password), now(), row.id),
    env.DB.prepare("DELETE FROM password_links WHERE admin_id = ?").bind(row.id),
    env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(row.id),
    env.DB.prepare("DELETE FROM login_attempts WHERE key = ?").bind(`email:${row.email}`),
  ]);
  await audit(env, request, row.id, row.kind === "welcome" ? "password.set" : "password.reset");
  await passwordChangedNotice(env, row);
  return json({ ok: true });
}

const passwordChangedNotice = (env, admin) =>
  sendMail(env, {
    to: admin.email,
    subject: "Your SoCheers Admin password was changed",
    lines: [`Hi ${admin.name},`, "The password for your SoCheers Admin account was just changed. If that was you, there's nothing to do.", "If it wasn't, tell an owner on the team straight away so they can block the account."],
  });

/* ---- accounts (owners only) ---- */

export async function listAdmins(env, request) {
  /* everyone signed in can see the team; only owners can change it */
  await requireAdmin(env, request);
  const { results } = await env.DB.prepare(
    "SELECT id, email, name, role, disabled, must_change, totp_secret IS NOT NULL AS totp, created_at FROM admins ORDER BY created_at",
  ).all();
  return json({ admins: results });
}

export async function createAdmin(env, request) {
  const owner = await requireAdmin(env, request, { owner: true });
  const body = await readJson(request, 4000);
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 80);
  const role = body.role === "owner" ? "owner" : "editor";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return error(400, "Enter a valid email.");
  if (!name) return error(400, "Enter a name.");
  const weak = checkPasswordStrength(body.password, email);
  if (weak) return error(400, weak);
  const t = now();
  try {
    await env.DB.prepare(
      "INSERT INTO admins (email, name, role, password_hash, must_change, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
    ).bind(email, name, role, await hashPassword(body.password), t, t).run();
  } catch {
    return error(409, "An account with that email already exists.");
  }
  await audit(env, request, owner.id, "admin.create", `${email} (${role})`);
  let emailed = false;
  if (hasMail(env)) {
    const added = await env.DB.prepare("SELECT id FROM admins WHERE email = ?").bind(email).first();
    const token = await issueLink(env, added.id, "welcome");
    emailed = await sendMail(env, {
      to: email,
      subject: "You've been added to SoCheers Admin",
      lines: [`Hi ${name},`, `${owner.name} added you to the SoCheers admin panel as ${role === "owner" ? "an owner" : "an editor"}. Choose your password to get in. The link works once, for the next 3 days.`],
      button: { label: "Choose your password", href: `${panelOrigin(request)}/admin#/reset/${token}` },
    });
  }
  return json({ ok: true, emailed });
}

export async function updateAdmin(env, request, id) {
  const owner = await requireAdmin(env, request, { owner: true });
  const body = await readJson(request, 4000);
  const target = await env.DB.prepare("SELECT * FROM admins WHERE id = ?").bind(id).first();
  if (!target) return error(404, "No such account.");
  if (target.id === owner.id && (body.disabled || body.role === "editor")) {
    return error(400, "You can't demote or disable your own account.");
  }
  const t = now();
  const stmts = [];
  if (body.role === "owner" || body.role === "editor") {
    stmts.push(env.DB.prepare("UPDATE admins SET role = ?, updated_at = ? WHERE id = ?").bind(body.role, t, id));
  }
  if (typeof body.disabled === "boolean") {
    stmts.push(env.DB.prepare("UPDATE admins SET disabled = ?, updated_at = ? WHERE id = ?").bind(body.disabled ? 1 : 0, t, id));
    if (body.disabled) stmts.push(env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(id));
  }
  if (body.password) {
    const weak = checkPasswordStrength(body.password, target.email);
    if (weak) return error(400, weak);
    stmts.push(env.DB.prepare("UPDATE admins SET password_hash = ?, must_change = 1, updated_at = ? WHERE id = ?")
      .bind(await hashPassword(body.password), t, id));
    stmts.push(env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(id));
  }
  if (body.resetTwoFactor) {
    stmts.push(env.DB.prepare("UPDATE admins SET totp_secret = NULL, totp_pending = NULL, totp_last = 0 WHERE id = ?").bind(id));
  }
  if (stmts.length) await env.DB.batch(stmts);
  const owners = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'owner' AND disabled = 0").first();
  if (owners.n === 0) {
    /* never leave the panel without an owner */
    await env.DB.prepare("UPDATE admins SET role = 'owner', disabled = 0 WHERE id = ?").bind(owner.id).run();
  }
  await audit(env, request, owner.id, "admin.update", `${target.email} ${JSON.stringify({ ...body, password: body.password ? "***" : undefined })}`);
  return json({ ok: true });
}

export async function deleteAdmin(env, request, id) {
  const owner = await requireAdmin(env, request, { owner: true });
  if (id === owner.id) return error(400, "You can't delete your own account.");
  const target = await env.DB.prepare("SELECT email FROM admins WHERE id = ?").bind(id).first();
  if (!target) return error(404, "No such account.");
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE admin_id = ?").bind(id),
    env.DB.prepare("DELETE FROM admins WHERE id = ?").bind(id),
  ]);
  await audit(env, request, owner.id, "admin.delete", target.email);
  return json({ ok: true });
}

export async function auditLog(env, request) {
  await requireAdmin(env, request, { owner: true });
  const { results } = await env.DB.prepare(
    `SELECT l.at, l.action, l.detail, l.ip, a.email FROM audit_log l
       LEFT JOIN admins a ON a.id = l.admin_id ORDER BY l.id DESC LIMIT 200`,
  ).all();
  return json({ entries: results });
}
