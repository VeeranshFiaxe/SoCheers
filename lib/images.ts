import WIDTHS from "./work-images.json";

/* ============================================================
   WHICH FILE A PICTURE IS ACTUALLY SERVED AS.

   scripts/build-variants.mjs writes, beside every JPG under
   public/assets/work/, a WebP at the same width and one 800 wide, and
   records the JPG's width in work-images.json. Components keep naming
   the JPG and spread what this returns onto the <img>:

     <img {...pic(a.thumb)} sizes="(max-width: 760px) 100vw, 50vw" />

   `sizes` stays at the call site because only the layout knows how wide
   the picture is drawn. A picture that is not in the list - a
   placeholder, a YouTube still, anything outside the Work tab - comes
   back exactly as it was passed in.
   ============================================================ */
const W = WIDTHS as Record<string, number>;
const SMALL = 800;

const webp = (src: string) => src.replace(/\.jpe?g$/i, ".webp");

export type Pic = { src: string; srcSet?: string };

/* `larger` is a second, bigger cut of the same picture - a case board's
   2400 - offered to the screens that can use it. */
export function pic(src: string, larger?: { src: string }): Pic {
  const w = W[src];
  if (!w) return { src };
  const set: string[] = [];
  if (w > SMALL) set.push(`${src.replace(/\.jpe?g$/i, `-${SMALL}.webp`)} ${SMALL}w`);
  set.push(`${webp(src)} ${w}w`);
  const lw = larger && W[larger.src];
  if (larger && lw) set.push(`${webp(larger.src)} ${lw}w`);
  return { src: webp(src), srcSet: set.length > 1 ? set.join(", ") : undefined };
}
