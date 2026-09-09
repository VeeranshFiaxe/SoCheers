/* ============================================================
   The favicon pack, baked from the same geometry as app/icon.svg.

   app/icon.svg is the real icon and it is theme-aware: one file whose
   line ink flips from the brand's near-black to cream under
   prefers-color-scheme: dark. Everything this script writes exists for
   the places that cannot do that:

     app/favicon.ico          Safari and old Edge, which never load an
                              SVG favicon at all. Light ink, because a tab
                              strip is light far more often than not, and
                              the yellow disc carries the mark even where
                              the line work goes quiet.
     app/apple-icon.png       the home screen, and public/icon-192|512.png
     public/icon-192|512.png  the manifest that points at them. An icon
                              there sits on the user's wallpaper rather
                              than on a tab strip, and iOS flattens
                              transparency onto white, so all three are
                              drawn on the site's own near-black with the
                              cream ink - which is the site, and reads on
                              any wallpaper either way.

   The two under app/ are Next's file conventions, so the <link> tags for
   them are emitted and hashed by the framework; nothing in app/layout.tsx
   has to name them.

   Run: node scripts/build-favicons.mjs
   ============================================================ */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const YELLOW = "#ffcb0c";
const INK_LIGHT = "#231f20"; /* the brand sheet's line ink */
const INK_DARK = "#f1ece1";  /* the site's cream */
const BG = "#0b0b0c";        /* the site's ground */

/* The mark's box, squared on the ink: see the note in app/icon.svg */
const BOX = "50 55.6 283 283";

/* Padded a further 12% for the home-screen icons, so the rounded mask
   iOS and Android apply to them cannot crop the ring */
const BOX_PADDED = "33 38.6 317 317";

function mark({ ink, bg = null, box = BOX }) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">` +
      (bg ? `<rect x="-1000" y="-1000" width="3000" height="3000" fill="${bg}"/>` : "") +
      `<circle cx="172.4" cy="151.7" r="85.7" fill="${YELLOW}"/>` +
      `<g fill="none" stroke="${ink}" stroke-width="16.5" stroke-linecap="round">` +
      `<path d="M152.72 250.22A88 88 0 1 1 247.28 250.22"/>` +
      `<path d="M163.5 275H236.5"/>` +
      `<path d="M169.6 298H230.4"/>` +
      `<path d="M175.1 320H224.9"/>` +
      `</g></svg>`
  );
}

const png = (svg, size) =>
  sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/* An .ico is a 6-byte header, one 16-byte directory entry per size, and
   then the payloads - which since Vista may be whole PNG files, so the
   buffers sharp just made go in untouched. */
function ico(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2); /* 1 = icon */
  head.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const dir = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); /* 0 means 256 */
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); /* truecolour */
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([head, ...dir, ...images.map((i) => i.data)]);
}

const light = mark({ ink: INK_LIGHT });
const onDark = mark({ ink: INK_DARK, bg: BG, box: BOX_PADDED });

const sizes = [16, 32, 48];
const icoImages = await Promise.all(
  sizes.map(async (size) => ({ size, data: await png(light, size) }))
);
await writeFile("app/favicon.ico", ico(icoImages));

await writeFile("app/apple-icon.png", await png(onDark, 180));
await writeFile("public/icon-192.png", await png(onDark, 192));
await writeFile("public/icon-512.png", await png(onDark, 512));

console.log("app/favicon.ico (16/32/48), app/apple-icon.png, public/icon-192.png, public/icon-512.png");
