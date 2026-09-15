/* ============================================================
   COPIES public/assets AND public/media INTO THE R2 BUCKET.

   The live site reads every picture and film from R2 (worker/index.js),
   so a new or changed file under those folders is not live until this
   has run. A normal code deploy does not need it.

     npx wrangler login            (once per machine)
     npm run media                 (uploads what changed)
     npm run media -- --all        (uploads everything again)

   "What changed" is a hash of each file, kept in .r2-manifest.json on
   this machine (gitignored). On a machine without that file the first
   run uploads everything, which is harmless, just slow.

   Files removed from public/ are not removed from the bucket. They cost
   pennies and nothing links to them; delete by hand in the dashboard if
   it matters.
   ============================================================ */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const BUCKET = "socheers-media";
const ROOTS = ["public/assets", "public/media"];
const MANIFEST = ".r2-manifest.json";
const PARALLEL = 6;
const ALL = process.argv.includes("--all");

const TYPES = {
  ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
  ".json": "application/json", ".vtt": "text/vtt", ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2", ".ktx2": "image/ktx2",
};

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const files = ROOTS.filter(existsSync).flatMap(walk);
const done = !ALL && existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

const todo = [];
for (const file of files) {
  const key = path.relative("public", file).split(path.sep).join("/");
  const hash = createHash("md5").update(readFileSync(file)).digest("hex");
  if (done[key] !== hash) todo.push({ file, key, hash });
}

const totalMb = todo.reduce((n, t) => n + statSync(t.file).size, 0) / 1024 / 1024;
console.log(`${files.length} files, ${todo.length} to upload (${totalMb.toFixed(1)}MB)`);

const wrangler = path.join("node_modules", "wrangler", "bin", "wrangler.js");
const put = ({ file, key }) =>
  new Promise((resolve) => {
    const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const child = spawn(process.execPath, [
      wrangler, "r2", "object", "put", `${BUCKET}/${key}`,
      "--file", file, "--content-type", type, "--remote",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ ok: code === 0, err }));
  });

let n = 0;
let failed = 0;
const save = () => writeFileSync(MANIFEST, JSON.stringify(done, null, 1));

async function worker() {
  while (todo.length) {
    const t = todo.shift();
    const { ok, err } = await put(t);
    n++;
    if (ok) {
      done[t.key] = t.hash;
      console.log(`[${n}] ${t.key}`);
    } else {
      failed++;
      console.error(`[${n}] FAILED ${t.key}\n${err.trim()}`);
    }
    /* saved as it goes, so a run cut off halfway picks up where it was */
    if (n % 20 === 0) save();
  }
}

await Promise.all(Array.from({ length: PARALLEL }, worker));
save();
if (failed) {
  console.error(`${failed} failed - run it again to retry just those.`);
  process.exit(1);
}
console.log("done");
