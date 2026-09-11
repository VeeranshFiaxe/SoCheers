import { phoneCut } from "@/lib/video";

/* ============================================================
   THE TWO CUTS OF A FILM, AS <source>s.

   Every film scripts/build-film.mjs makes has a phone cut beside it.
   The full cut is offered to screens 768 and wider and the phone cut to
   everything else, so a phone never downloads the big one.

   The order is the fallback. A browser that ignores `media` on a video
   source takes the first one it can play - the full cut - which is what
   every browser got before the phone cut existed, so an old browser is
   no worse off.
   ============================================================ */
export default function FilmSources({ src }: { src: string }) {
  const phone = phoneCut(src);
  if (!phone) return <source src={src} type="video/mp4" />;
  return (
    <>
      <source src={src} type="video/mp4" media="(min-width: 768px)" />
      <source src={phone} type="video/mp4" />
    </>
  );
}
