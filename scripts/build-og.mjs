/* ============================================================
   The share preview - public/og-v2.jpg, 1200x630.

   What WhatsApp, LinkedIn, Slack and the rest draw for any page that does
   not set its own (OG_IMAGE in lib/seo.ts). Baked from what the site is
   now rather than a screenshot of it: the lockup, painted from the same
   two masks components/SoCheersLockup.tsx paints (cream line work, yellow
   disc), beside a frame of the film the home page opens into.

   The old file was the retired hero - the SOC▢HEERS artwork with the crowd
   photo in its window - and is replaced wholesale.

   Run: node scripts/build-og.mjs
   ============================================================ */
import sharp from "sharp";

const W = 1200;
const H = 630;
const BG = "#0b0b0c";
const CREAM = "#f1ece1";
const YELLOW = "#ffcb0c";

/* a mask painted in one ink: solid colour, the mask's alpha */
async function paint(mask, color, size) {
  const alpha = await sharp(mask).resize(size).extractChannel("alpha").toBuffer();
  const { width, height } = await sharp(alpha).metadata();
  return sharp({ create: { width, height, channels: 3, background: color } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

const LOGO = 340;                             // lockup width
const ink = await paint("public/assets/logo/lockup-ink.png", CREAM, LOGO);
const blob = await paint("public/assets/logo/lockup-blob.png", YELLOW, LOGO);
const logoH = Math.round((875 / 900) * LOGO);

/* the film, in a rounded window */
const FW = 620;
const FH = Math.round((FW * 9) / 16);
const R = 22;
const film = await sharp("public/media/vibe-video-poster.jpg")
  .resize(FW, FH, { fit: "cover" })
  .composite([{
    input: Buffer.from(`<svg width="${FW}" height="${FH}"><rect width="${FW}" height="${FH}" rx="${R}" ry="${R}"/></svg>`),
    blend: "dest-in",
  }])
  .png()
  .toBuffer();

/* a soft warm light behind the mark, the way the overture lights it */
const glow = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="0.24" cy="0.5" r="0.42">
      <stop offset="0" stop-color="${YELLOW}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${YELLOW}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`);

const PAD = 70;
const logoLeft = PAD + 20;
const logoTop = Math.round((H - logoH) / 2);
const filmLeft = W - PAD - FW;
const filmTop = Math.round((H - FH) / 2);

await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: glow, left: 0, top: 0 },
    { input: blob, left: logoLeft, top: logoTop },
    { input: ink, left: logoLeft, top: logoTop },
    { input: film, left: filmLeft, top: filmTop },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("public/og-v2.jpg");

console.log("public/og-v2.jpg");
