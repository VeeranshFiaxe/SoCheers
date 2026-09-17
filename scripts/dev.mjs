/* `npm run dev`: Next on :3000, and the Cloudflare Worker on :8787 for
   the admin API (/admin). next.config.mjs proxies /api to the Worker.
   The Worker's local database is created on first run. */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const bin = (name) => path.join("node_modules", name === "next" ? "next/dist/bin/next" : "wrangler/bin/wrangler.js");

/* wrangler wants the static folder to exist, even though dev only uses its API */
if (!existsSync("out")) mkdirSync("out");

spawnSync(process.execPath, [bin("wrangler"), "d1", "migrations", "apply", "socheers-admin", "--local"], { stdio: "inherit" });

const run = (args) => spawn(process.execPath, args, { stdio: "inherit" });
const children = [
  run([bin("wrangler"), "dev", "--local", "--port", "8787", "--local-upstream", "localhost:8787"]),
  run([bin("next"), "dev", ...process.argv.slice(2)]),
];
const stop = () => { children.forEach((c) => c.kill()); process.exit(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((c) => c.on("exit", stop));
