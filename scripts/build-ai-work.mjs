/* ============================================================
   AI WORK - the wall, built from the delivery folder.

   The client's AI work arrives as three folders of raw exports
   ("05. AI work/CGI videos", "/Mixed Videos", "/STATICS") - every file
   named the way it left someone's timeline, most of them prefixed
   "Copy of", several of them the same asset saved four times. That is a
   delivery, not a content model, so this script turns it into one:

     · duplicates are collapsed by content, not by filename - the (1)
       (2) (3) (4) variants really are byte-identical
     · stills are re-encoded to webp at a size a grid tile can use. The
       originals run to 6MB PNGs; the tiles are ~600px wide
     · every asset carries its own real pixel ratio, because the grid
       packs columns and needs the height before the image lands
     · films are left where they are and referenced in place. They are
       1.3GB between them and copying that into a second folder buys
       nothing - and when Cloudinary is stood up (see lib/ai-content.ts)
       these paths are the one thing that changes.

   Video dimensions are read out of the MP4 itself - the tkhd box, plus
   its display matrix, so a 9:16 film shot as a rotated 16:9 track still
   reports as vertical. No ffmpeg, no dependency, a couple of hundred
   bytes read per file rather than the 87MB the biggest one weighs.

   Run:  node scripts/build-ai-work.mjs
   Out:  public/assets/ai/*.webp  and  lib/ai-work-data.ts
   ============================================================ */
import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = path.join(ROOT, "public/assets/SC Website Revamp/05. AI work");
const OUT_DIR = path.join(ROOT, "public/assets/ai");
const OUT_TS = path.join(ROOT, "lib/ai-work-data.ts");

const FOLDERS = [
  { dir: "CGI videos", kind: "cgi" },
  { dir: "Mixed Videos", kind: "video" },
  { dir: "STATICS", kind: null }, // by extension: stills are static, films are video
];

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VID = new Set([".mp4", ".mov", ".webm"]);

/* ---------------------------------------------------------------- naming */

/* Everything the export pipeline left on the end of a filename and none
   of it is a title: version stamps, aspect ratios, "Copy of", the
   trailing counter Windows adds to a second download. */
const NOISE =
  /\b(copy|final|revised|packaged|hd|4k|main|new|latest|edit|export|render|v\d+|ver\d+|noprice\s?\d+x\d+|\d+x\d+|artboard|slide \d+|with endslate)\b/gi;

const clean = (base) => {
  let s = base;
  while (/^copy of /i.test(s)) s = s.replace(/^copy of /i, "");
  s = s.replace(/\(\d+\)/g, " "); // the (1) (2) (3) duplicates
  s = s.replace(/[_-]+/g, " ");
  s = s.replace(/^\d+[.\s]+/, ""); // leading "01. " / "7. "
  s = s.replace(NOISE, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* Words the filename spells the way a timeline spells them. The left
   side is matched case-insensitively against a whole word. */
const WORDS = {
  ai: "AI",
  bg: "BG",
  ts: "TS",
  kv: "KV",
  yt: "YT",
  bts: "BTS",
  got: "GOT",
  em5: "EM5",
  fc: "FC",
  "3d": "3D",
  linkedin: "LinkedIn",
  sibblings: "Siblings",
  barel: "Barrel",
  aiworld: "AI World",
  spiderpunk: "Spider-Punk",
};

const PHRASES = [
  [/\bmothers day\b/i, "Mother's Day"],
  [/\blion s paw\b/i, "Lion's Paw"],
  [/\bt rex\b/i, "T-Rex"],
  [/\bmumbai fc\b/i, "Mumbai City FC"],
  [/\bpost\b/i, " "],           // "Mothers-day_-post_5" is a slot, not a title
  [/\breel ?video \d+/i, "Reel"],
];

const titleCase = (s) => {
  let t = s
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      const hit = WORDS[w.toLowerCase()];
      if (hit) return hit;
      return /^[A-Z0-9]{2,}$/.test(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  for (const [re, to] of PHRASES) t = t.replace(re, to);
  /* a bare index left on the end is the export's counter - kept, because
     three Mother's Day stills have to be told apart, but set as one */
  t = t.replace(/\s+/g, " ").trim().replace(/\s(\d)$/, " 0$1");
  return t;
};

/* The handful the filename genuinely could not answer - "5.jpg",
   "AI (1).jpg", two WhatsApp exports - named off the artwork itself
   rather than left as a number in a caption. id, then title and brand. */
const NAMED = {
  "5": ["Welcome the Royal", "Monarch"],
  "1-3": ["80 Years of Happy Memories", "Havmor"],
  "ai-1": ["Noodles in the Wild", "Yippee"],
  "ai-2-2": ["Noodle Valley", "Yippee"],
  "ai-2": ["Waffle on the Moon", "The Belgian Waffle Co."],
  "ai-jpg2": ["Moonrise Waffle", "The Belgian Waffle Co."],
  "whatsapp-image-2025-05-06-at-1-06-20-pm": ["Met Gala, in bulbs", ""],
  "whatsapp-image-2025-05-06-at-12-47-38-pm": ["Met Gala, in namkeen", ""],
};

/* The brands that are actually named in the filenames. Anything not on
   this list gets no brand line rather than a guessed one - a wall of
   work that misattributes a film is worse than one that stays quiet. */
const BRANDS = [
  ["bajaj", "Bajaj"],
  ["havmor", "Havmor"],
  ["yippee", "Yippee"],
  ["swiggy", "Swiggy"],
  ["bingo", "Bingo"],
  ["motul", "Motul"],
  ["coke", "Coca-Cola"],
  ["toilex", "Toilex"],
  ["mhb", "MHB"],
  ["aghori", "Aghori"],
  ["spiderpunk", "Spider-Punk"],
  ["samurai", "Samurai"],
  ["352stone", "352 Stone"],
  ["london dry", "London Dry"],
  ["mumbai fc", "Mumbai City FC"],
  ["turbo spin mop", "Amazon"],
  ["jhs", "JHS"],
  ["bsa", "BSA"],
];

const brandFor = (raw) => {
  const hay = raw.toLowerCase();
  for (const [needle, name] of BRANDS) if (hay.includes(needle)) return name;
  return "";
};

/* ---------------------------------------------------------------- mp4 */

/* Walk the top-level boxes for `moov`, read only that box, then walk it
   for the first tkhd carrying a non-zero size. */
function mp4Size(file) {
  const fd = fs.openSync(file, "r");
  try {
    const total = fs.fstatSync(fd).size;
    const head = Buffer.alloc(16);
    let off = 0;
    while (off + 8 <= total) {
      if (fs.readSync(fd, head, 0, 16, off) < 8) break;
      let size = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      let hdr = 8;
      if (size === 1) {
        size = Number(head.readBigUInt64BE(8));
        hdr = 16;
      }
      if (size === 0) size = total - off;
      if (size < hdr) break;
      if (type === "moov") {
        const box = Buffer.alloc(size - hdr);
        fs.readSync(fd, box, 0, box.length, off + hdr);
        return tkhd(box);
      }
      off += size;
    }
  } catch {
    /* a file we cannot read is a file we skip */
  } finally {
    fs.closeSync(fd);
  }
  return null;
}

function tkhd(buf) {
  let off = 0;
  while (off + 8 <= buf.length) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    let hdr = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(off + 8));
      hdr = 16;
    }
    if (size === 0) size = buf.length - off;
    if (size < hdr) return null;

    if (type === "trak" || type === "mdia") {
      const inner = tkhd(buf.subarray(off + hdr, off + size));
      if (inner) return inner;
    }
    if (type === "tkhd") {
      const b = buf.subarray(off + hdr, off + size);
      const version = b[0];
      let p = 4 + (version === 1 ? 32 : 20) + 16;
      const fx = (i) => b.readInt32BE(p + i * 4) / 65536;
      const a = fx(0);
      const bb = fx(1);
      const c = fx(3);
      const d = fx(4);
      p += 36;
      let w = b.readUInt32BE(p) / 65536;
      let h = b.readUInt32BE(p + 4) / 65536;
      if (w && h) {
        /* a rotated track reports its pre-rotation size */
        const rotated = Math.abs(a) < 0.01 && Math.abs(d) < 0.01 && (bb || c);
        if (rotated) [w, h] = [h, w];
        return { w: Math.round(w), h: Math.round(h) };
      }
    }
    off += size;
  }
  return null;
}

/* ---------------------------------------------------------------- dedupe */

/* Head, tail and size. A full hash of 1.8GB to find that four copies of
   the same 40MB film are the same film is work nobody needs done. */
function fingerprint(file) {
  const { size } = fs.statSync(file);
  const fd = fs.openSync(file, "r");
  const n = Math.min(size, 262144);
  const head = Buffer.alloc(n);
  const tail = Buffer.alloc(n);
  fs.readSync(fd, head, 0, n, 0);
  fs.readSync(fd, tail, 0, n, Math.max(0, size - n));
  fs.closeSync(fd);
  return createHash("sha1").update(String(size)).update(head).update(tail).digest("hex");
}

/* ---------------------------------------------------------------- build */

fs.mkdirSync(OUT_DIR, { recursive: true });

const MAX_EDGE = 1400;
const seen = new Map();
const out = [];
const usedSlugs = new Set();
let files = 0;

for (const { dir, kind } of FOLDERS) {
  const abs = path.join(SRC, dir);
  if (!fs.existsSync(abs)) {
    console.warn(`missing: ${dir}`);
    continue;
  }

  for (const name of fs.readdirSync(abs).sort()) {
    const file = path.join(abs, name);
    if (!fs.statSync(file).isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    const isImg = IMG.has(ext);
    const isVid = VID.has(ext);
    if (!isImg && !isVid) continue;
    files++;

    const fp = fingerprint(file);
    if (seen.has(fp)) continue;
    seen.set(fp, name);

    const raw = path.basename(name, ext);
    const pretty = clean(raw) || "Untitled";
    const base = slugify(pretty) || slugify(raw);
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
    usedSlugs.add(slug);

    const named = NAMED[slug];
    const cased = titleCase(pretty);
    /* a title that came out as a bare counter is not a title. The tile
       says what kind of thing it is either way, so it says that. */
    const untitled = /^\d+$/.test(cased) || cased.length < 3;
    const asset = {
      id: slug,
      kind: isVid ? kind ?? "video" : "static",
      title: named ? named[0] : untitled ? (isVid ? "Untitled film" : "Untitled still") : cased,
      brand: named ? named[1] : brandFor(raw),
    };

    if (isImg) {
      const src = sharp(file, { failOn: "none" });
      const meta = await src.metadata();
      const w = meta.width ?? 1200;
      const h = meta.height ?? 1200;
      const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      const outName = `${slug}.webp`;
      await src
        .rotate()
        .resize({ width: Math.round(w * scale), height: Math.round(h * scale), fit: "inside" })
        .webp({ quality: 78, effort: 5 })
        .toFile(path.join(OUT_DIR, outName));
      out.push({ ...asset, w, h, src: `/assets/ai/${outName}` });
      process.stdout.write(`· ${outName} ${w}x${h}\n`);
    } else {
      const dim = mp4Size(file) ?? { w: 1920, h: 1080 };
      const url =
        "/assets/" +
        ["SC Website Revamp", "05. AI work", dir, name].map(encodeURIComponent).join("/");
      /* a poster only exists if somebody put one there - see the note in
         components/AiGrid.tsx about why a film without one is a card
         rather than a frame grab */
      const poster = path.join(OUT_DIR, `${slug}-poster.webp`);
      out.push({
        ...asset,
        w: dim.w,
        h: dim.h,
        src: url,
        poster: fs.existsSync(poster) ? `/assets/ai/${slug}-poster.webp` : undefined,
      });
      process.stdout.write(`· ${name} -> ${dim.w}x${dim.h}\n`);
    }
  }
}

/* Shuffle the three kinds through each other deterministically, so the
   wall opens as a mix rather than as a block of stills followed by a
   block of films - and so the CSS columns are not packing one aspect
   ratio at a time. */
const buckets = { static: [], video: [], cgi: [] };
for (const a of out) buckets[a.kind].push(a);
const order = [];
const keys = ["static", "video", "cgi"];
while (keys.some((k) => buckets[k].length)) {
  for (const k of keys) {
    const next = buckets[k].shift();
    if (next) order.push(next);
  }
}

const ts = `/* GENERATED by scripts/build-ai-work.mjs - do not edit by hand.
   Re-run it after anything lands in or leaves
   public/assets/SC Website Revamp/05. AI work.

   ${order.length} assets, from ${files} files on disk - the rest were
   byte-identical duplicates of something already here. Stills are
   re-encoded webp in /assets/ai; films are referenced where they were
   delivered. See lib/ai-content.ts for the shape and what the grid does
   with the tags. */
import type { AiAsset } from "./ai-content";

export const AI_WORK: AiAsset[] = ${JSON.stringify(
  order.map((a) => ({
    id: a.id,
    kind: a.kind,
    title: a.title,
    brand: a.brand,
    src: a.src,
    ...(a.poster ? { poster: a.poster } : {}),
    w: a.w,
    h: a.h,
    tags: [a.kind],
  })),
  null,
  2,
)};
`;

await fsp.writeFile(OUT_TS, ts, "utf8");
console.log(`\n${order.length} assets (from ${files} files) -> lib/ai-work-data.ts`);
