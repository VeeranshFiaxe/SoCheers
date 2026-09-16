/* ============================================================
   The share preview - public/og-v3.jpg, 1200x630.

   What WhatsApp, LinkedIn, Slack and the rest draw for any page that does
   not set its own (OG_IMAGE in lib/seo.ts). It is the first thing the
   site does: a dark room and the mark, lit - the overture's bulb with its
   pull cord beside it - and the wordmark under it.

   The bulb is drawn from the same geometry the overture's lamp is built
   from (lib/logo-paths.ts, copied as numbers - this runs as plain node).
   The wordmark is cut out of the design book's own lockup masks
   (public/assets/logo), the same ones components/SoCheersLockup.tsx paints.

   The filename carries a version on purpose: share previews are cached
   by URL, so a new picture at an old address keeps showing the old one.

   Run: node scripts/build-og.mjs
   ============================================================ */
import sharp from "sharp";

const W = 1200;
const H = 630;
const OUT = "public/og-v3.jpg";
const BG = "#0b0b0c";
const CREAM = "#f1ece1";
const YELLOW = "#ffcb0c";

/* ---- lib/logo-paths.ts, in numbers ---- */
const MARK = { cx: 200, cy: 176, r: 88, gap: 32.5 };
const DISC = { cx: 172.4, cy: 151.7, r: 85.7 };
const STROKE = 16.5;
const BARS = ["M163.5 275H236.5", "M169.6 298H230.4", "M175.1 320H224.9"];
function ringArc(r) {
  const a = (MARK.gap * Math.PI) / 180;
  const dx = r * Math.sin(a);
  const y = (MARK.cy + r * Math.cos(a)).toFixed(2);
  return `M${(MARK.cx - dx).toFixed(2)} ${y}A${r} ${r} 0 1 1 ${(MARK.cx + dx).toFixed(2)} ${y}`;
}

/* the bulb, in its 400-unit space, scaled and placed on the card */
const S = 1.22;
const BULB_TOP = 104;                        // card px of the disc's top
const ox = W / 2 - 200 * S;
const oy = BULB_TOP - (DISC.cy - DISC.r) * S;
const at = (x, y) => [ox + x * S, oy + y * S];
const [gx, gy] = at(DISC.cx + 12, DISC.cy + 10);   // centre of the light

/* the cord hangs from the top edge, right of the ring */
const [cordX] = at(MARK.cx + MARK.r + 70, 0);
const [, cordEnd] = at(0, MARK.cy + 40);

const scene = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="room" gradientUnits="userSpaceOnUse" cx="${gx}" cy="${gy}" r="720">
      <stop offset="0" stop-color="${YELLOW}" stop-opacity="0.30"/>
      <stop offset="0.28" stop-color="${YELLOW}" stop-opacity="0.09"/>
      <stop offset="0.7" stop-color="${YELLOW}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="disc" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe066"/>
      <stop offset="0.6" stop-color="${YELLOW}"/>
      <stop offset="1" stop-color="#f5b800"/>
    </radialGradient>
    <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="46"/>
    </filter>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#room)"/>
  <rect y="${H * 0.55}" width="${W}" height="${H * 0.45}" fill="url(#floor)"/>

  <!-- the cord -->
  <line x1="${cordX}" y1="0" x2="${cordX}" y2="${cordEnd}" stroke="#6d5d43" stroke-width="3"
        stroke-dasharray="7 5"/>
  <path transform="translate(${cordX} ${cordEnd})"
        d="M-9.5 -1c0-5.4 4.2-8.6 9.5-8.6s9.5 3.2 9.5 8.6c0 12-4.2 21.5-9.5 21.5S-9.5 11-9.5 -1Z"
        fill="#9a7b48"/>

  <!-- the light -->
  <circle cx="${gx}" cy="${gy}" r="${DISC.r * S * 1.15}" fill="${YELLOW}" opacity="0.55" filter="url(#bloom)"/>

  <g transform="translate(${ox} ${oy}) scale(${S})">
    <circle cx="${DISC.cx}" cy="${DISC.cy}" r="${DISC.r}" fill="url(#disc)"/>
    <path d="${ringArc(MARK.r)}" fill="none" stroke="${CREAM}" stroke-width="${STROKE}" stroke-linecap="round"/>
    ${BARS.map((d) => `<path d="${d}" stroke="${CREAM}" stroke-width="${STROKE}" stroke-linecap="round"/>`).join("")}
  </g>
</svg>`;

/* ---- the wordmark, cut from the lockup masks (rows 744-874 of 900) ---- */
const CROP = { left: 0, top: 736, width: 900, height: 139 };
const WORD_W = 300;
async function paint(mask, color) {
  const alpha = await sharp(mask).extract(CROP).resize(WORD_W).extractChannel("alpha").toBuffer();
  const { width, height } = await sharp(alpha).metadata();
  const buf = await sharp({ create: { width, height, channels: 3, background: color } })
    .joinChannel(alpha).png().toBuffer();
  return { buf, height };
}
const ink = await paint("public/assets/logo/lockup-ink.png", CREAM);
const blob = await paint("public/assets/logo/lockup-blob.png", YELLOW);

const [, barsBottom] = at(0, 330);
const wordTop = Math.round(barsBottom + 42);
const wordLeft = Math.round((W - WORD_W) / 2);

await sharp(Buffer.from(scene))
  .composite([
    { input: blob.buf, left: wordLeft, top: wordTop },
    { input: ink.buf, left: wordLeft, top: wordTop },
  ])
  .flatten({ background: BG })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT);

console.log(OUT);
