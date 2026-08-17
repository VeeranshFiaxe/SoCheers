import {
  WORK_ASSETS, WORK_CATEGORIES, type WorkAsset,
} from "./work-content";

/* ============================================================
   WHERE THE BROWSE WALL'S ASSETS COME FROM.

   One function, two sources, and the page does not know which it got.

   The plan the client is already working to: images and video go up to
   Cloudinary, the category is a tag set at upload time, and this site
   reads the tags rather than carrying its own copy of the mapping. That
   way adding a campaign is an upload, not a deploy.

   The account is not stood up yet, so today this returns the manifest in
   lib/work-content.ts, which is deliberately the same shape. When the
   cloud name lands, set it in the environment and the fetch takes over
   with no component change:

     NEXT_PUBLIC_CLOUDINARY_CLOUD=<cloud name>

   ---- the endpoint, and its one prerequisite ----

   `/image/list/<tag>.json` is Cloudinary's keyless list-by-tag. It needs
   "Resource list" turned on under Settings > Security on the account -
   it is off by default, and with it off this returns 401 and every call
   here falls through to the manifest. That is the intended failure: a
   wall of real work is better than an empty page, and an empty page is
   what a thrown error would produce.

   Videos live under a separate delivery type, so a tag has to be asked
   for twice - once as image, once as video - and the results merged.

   ---- why the fallback is silent to the user and loud to us ----

   A missing category on a portfolio page is not worth an error screen,
   so the reader always gets something. But a fetch that quietly degrades
   forever is how a site ends up serving placeholder work six months
   after the CDN went live, so every fallback logs the reason on the
   server.
   ============================================================ */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
export const CLOUDINARY_LIVE = Boolean(CLOUD);

/* Only the fields we actually read. Cloudinary sends a good deal more. */
type CloudResource = {
  public_id: string;
  format: string;
  version: number;
  width?: number;
  height?: number;
  tags?: string[];
  context?: { custom?: Record<string, string> };
};

/* A delivery URL for the tile: scaled to something a grid cell can use,
   auto format and auto quality, and for a video the poster frame rather
   than the file - a wall of autoplaying video is not a wall anyone can
   look at. */
const thumbUrl = (r: CloudResource, kind: "image" | "video") =>
  kind === "video"
    ? `https://res.cloudinary.com/${CLOUD}/video/upload/so_0,w_900,c_limit,f_auto,q_auto/v${r.version}/${r.public_id}.jpg`
    : `https://res.cloudinary.com/${CLOUD}/image/upload/w_900,c_limit,f_auto,q_auto/v${r.version}/${r.public_id}.${r.format}`;

const toAsset = (r: CloudResource, kind: "image" | "video"): WorkAsset => {
  /* Brand and campaign come off Cloudinary's contextual metadata, which
     is where they belong - a filename is not a place to store a brand
     name with a space in it. Both fall back to something readable rather
     than to undefined, because a tile with no label is a tile that looks
     broken. */
  const c = r.context?.custom ?? {};
  return {
    publicId: r.public_id,
    brand: c.brand ?? r.public_id.split("/").pop() ?? "SoCheers",
    title: c.title ?? "",
    kind,
    thumb: thumbUrl(r, kind),
    /* the list response does not always carry dimensions; 3:2 is a
       neutral default that will not blow the column layout apart if it
       is wrong for one tile */
    w: r.width ?? 1500,
    h: r.height ?? 1000,
    tags: r.tags ?? [],
    slug: c.slug,
  };
};

async function listTag(tag: string, kind: "image" | "video"): Promise<WorkAsset[]> {
  const url = `https://res.cloudinary.com/${CLOUD}/${kind}/list/${tag}.json`;
  const res = await fetch(url, {
    /* Re-read every ten minutes. Uploading a campaign should show up
       without a deploy - that is the entire reason for reading tags -
       but not at the cost of a round trip per request. */
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`${kind}/${tag}: ${res.status}`);
  const json = (await res.json()) as { resources?: CloudResource[] };
  return (json.resources ?? []).map((r) => toAsset(r, kind));
}

export async function getWorkAssets(): Promise<WorkAsset[]> {
  if (!CLOUD) return WORK_ASSETS;

  const tags = WORK_CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id);

  /* allSettled, not all: one category with its tag misspelt at upload
     time should cost that category, not the whole wall. */
  const results = await Promise.allSettled(
    tags.flatMap((t) => [listTag(t, "image"), listTag(t, "video")]),
  );

  const assets: WorkAsset[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[work] cloudinary tag fetch failed:", r.reason);
      continue;
    }
    /* An asset tagged into two categories comes back from two calls.
       Deduped on publicId, and the tags are merged rather than the
       second copy dropped - otherwise the asset only filters under
       whichever category happened to be fetched first. */
    for (const a of r.value) {
      const hit = seen.has(a.publicId);
      if (hit) {
        const existing = assets.find((x) => x.publicId === a.publicId);
        if (existing) existing.tags = [...new Set([...existing.tags, ...a.tags])];
        continue;
      }
      seen.add(a.publicId);
      assets.push(a);
    }
  }

  if (!assets.length) {
    console.warn("[work] cloudinary returned nothing - serving the local manifest instead");
    return WORK_ASSETS;
  }
  return assets;
}
