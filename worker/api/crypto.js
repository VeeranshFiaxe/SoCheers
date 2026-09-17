/* ============================================================
   THE ADMIN PANEL'S CRYPTOGRAPHY. Web Crypto only - nothing
   hand-rolled beyond the encodings and the TOTP arithmetic.

   - Passwords: PBKDF2-SHA256, 100,000 rounds (the most Workers
     allows), 16-byte random salt. scripts/admin-create.mjs writes
     the same format from Node, so the two must stay in step.
   - Sessions: 32 random bytes in the cookie, SHA-256 of it in D1.
   - 2FA secrets: AES-256-GCM under ADMIN_ENC_KEY (a Worker secret),
     so the database alone cannot mint codes.
   ============================================================ */

const enc = new TextEncoder();
export const PBKDF2_ROUNDS = 100000;

export const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const unb64url = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
export const randomToken = (n = 32) => b64url(randomBytes(n));

export async function sha256(text) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

/* Compares every byte whatever it finds, so the time taken says
   nothing about how much of a guess was right. */
export function safeEqual(a, b) {
  const x = typeof a === "string" ? enc.encode(a) : a;
  const y = typeof b === "string" ? enc.encode(b) : b;
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function pbkdf2(password, salt, rounds) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: rounds }, key, 256));
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, PBKDF2_ROUNDS);
  return `pbkdf2$${PBKDF2_ROUNDS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, rounds, salt, hash] = String(stored).split("$");
  if (scheme !== "pbkdf2" || !rounds || !salt || !hash) return false;
  const got = await pbkdf2(password, unb64url(salt), Math.min(Number(rounds), PBKDF2_ROUNDS));
  return safeEqual(got, unb64url(hash));
}

/* Run for an email that has no account, so a miss costs the same
   time as a wrong password and the response does not give away
   which addresses exist. */
const DUMMY = "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export const burnPasswordTime = (password) => verifyPassword(password, DUMMY);

/* ---- AES-GCM for secrets at rest ---- */

async function aesKey(env) {
  const raw = env.ADMIN_ENC_KEY ? unb64url(env.ADMIN_ENC_KEY.trim()) : null;
  if (!raw || raw.length !== 32) throw new Error("ADMIN_ENC_KEY must be 32 bytes, base64url");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export const hasEncKey = (env) => {
  try { return !!env.ADMIN_ENC_KEY && unb64url(env.ADMIN_ENC_KEY.trim()).length === 32; } catch { return false; }
};

export async function seal(env, text) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), enc.encode(text));
  return `v1.${b64url(iv)}.${b64url(ct)}`;
}

export async function open(env, sealed) {
  const [v, iv, ct] = String(sealed).split(".");
  if (v !== "v1") throw new Error("bad ciphertext");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64url(iv) }, await aesKey(env), unb64url(ct));
  return new TextDecoder().decode(pt);
}

/* ---- TOTP (RFC 6238: SHA-1, 30s, 6 digits - what every app speaks) ---- */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(bytes) {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function unbase32(s) {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

async function hotp(secret, counter) {
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i -= 1) { msg[i] = c & 255; c = Math.floor(c / 256); }
  const key = await crypto.subtle.importKey("raw", unbase32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = mac[19] & 15;
  const n = ((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3];
  return String(n % 1e6).padStart(6, "0");
}

/* The step the code matched, or -1. One step either side for clock
   drift; the caller refuses any step at or before the last one used. */
export async function checkTotp(secret, code, now = Date.now()) {
  if (!/^\d{6}$/.test(code || "")) return -1;
  const step = Math.floor(now / 30000);
  for (const s of [step, step - 1, step + 1]) {
    if (safeEqual(await hotp(secret, s), code)) return s;
  }
  return -1;
}
