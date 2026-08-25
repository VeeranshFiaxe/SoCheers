/* ============================================================
   WHAT KIND OF VIDEO IS THIS.

   Work pieces arrive as one of three things and never consistently:
   a file somebody uploaded, a YouTube link off the brand's channel, or
   a Vimeo link off the edit house's. The case template should not care,
   and whoever writes the content sheet should not have to know which
   component to reach for - they paste the URL they were given into
   `src` and this works out the rest.

   ---- why the hosted ones are not iframes until they are clicked ----

   A YouTube iframe is somewhere north of half a megabyte of player and
   a set of cookies, per embed, on load. A case page with a film and
   four cutdowns would spend more on players than on the entire rest of
   the site. So the page renders a poster and a play button - the thing
   a reader sees either way - and the iframe is built on the click that
   was always going to be needed. It also means no third-party cookie is
   set for a reader who never presses play, which is the polite default
   and, for the .in domains, the legally simpler one.

   The poster comes off YouTube's own still (i.ytimg.com, no player, no
   cookie). Vimeo has no keyless equivalent, so a Vimeo block wants a
   `poster` set by hand; without one it falls back to the case hero,
   which the renderer passes in.
   ============================================================ */

export type ParsedVideo =
  | { kind: "file"; src: string; poster?: string }
  | { kind: "youtube"; id: string; src: string; poster: string }
  | { kind: "vimeo"; id: string; src: string; poster?: string };

/* Every YouTube shape anyone actually pastes: watch links with the id in
   the query, youtu.be shorts, /embed/, /shorts/, /live/. The id itself is
   the fixed eleven characters. */
const YT =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{6,})/;

export function parseVideo(src: string, poster?: string): ParsedVideo {
  const yt = src.match(YT);
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      id,
      /* The privacy-preserving host, and the flags that stop the player
         being a channel page: no related videos from other channels at
         the end, no branding watermark, and our own play click starts
         it, so autoplay is on for the frame the reader just asked for. */
      src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      poster: poster ?? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    };
  }

  const v = src.match(VIMEO);
  if (v) {
    return {
      kind: "vimeo",
      id: v[1],
      src: `https://player.vimeo.com/video/${v[1]}?autoplay=1&title=0&byline=0&portrait=0`,
      poster,
    };
  }

  return { kind: "file", src, poster };
}

/* The named frames, as the numbers a stylesheet wants. Kept here rather
   than in CSS because the reel and the single film both need them and
   neither should be the one that owns the definition. */
export const RATIO: Record<string, string> = {
  wide: "16 / 9",
  tall: "9 / 16",
  square: "1 / 1",
  "four-five": "4 / 5",
};
