/* ============================================================
   MAKES AN ADMIN ACCOUNT FROM THE TERMINAL.

   The panel has no sign-up page, on purpose. The first owner is made
   here; after that, owners add people from the panel itself.

     npm run admin:create                 (live database)
     npm run admin:create -- --local      (the copy `wrangler dev` uses)

   The password is typed without being echoed and never leaves this
   machine: only its PBKDF2 hash is sent to the database, in the same
   format worker/api/crypto.js checks.
   ============================================================ */
import { spawnSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";

const LOCAL = process.argv.includes("--local");
const ROUNDS = 100000;

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sql = (s) => `'${String(s).replace(/'/g, "''")}'`;

const email = (await ask("Email: ")).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That is not an email address.");
const name = (await ask("Name: ")).trim() || email.split("@")[0];
const role = (await ask("Role - owner or editor [owner]: ")).trim() === "editor" ? "editor" : "owner";
const password = await ask("Password (12+ characters): ", true);
if (password.length < 12) throw new Error("Use at least 12 characters.");
if ((await ask("Password again: ", true)) !== password) throw new Error("The passwords don't match.");

const salt = randomBytes(16);
const hash = pbkdf2Sync(password.normalize("NFKC"), salt, ROUNDS, 32, "sha256");
const stored = `pbkdf2$${ROUNDS}$${b64url(salt)}$${b64url(hash)}`;
const t = Date.now();

const dir = mkdtempSync(path.join(tmpdir(), "sc-admin-"));
const file = path.join(dir, "create.sql");
writeFileSync(file,
  `INSERT INTO admins (email, name, role, password_hash, must_change, created_at, updated_at)
   VALUES (${sql(email)}, ${sql(name)}, ${sql(role)}, ${sql(stored)}, 0, ${t}, ${t})
   ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role,
     name = excluded.name, disabled = 0, updated_at = excluded.updated_at;
   DELETE FROM sessions WHERE admin_id = (SELECT id FROM admins WHERE email = ${sql(email)});`);

const wrangler = path.join("node_modules", "wrangler", "bin", "wrangler.js");
const res = spawnSync(process.execPath, [wrangler, "d1", "execute", "socheers-admin", LOCAL ? "--local" : "--remote", "--file", file], {
  stdio: "inherit",
});
unlinkSync(file);
if (res.status !== 0) process.exit(res.status ?? 1);
console.log(`\n${role} account ready for ${email}. Sign in at /admin.`);
