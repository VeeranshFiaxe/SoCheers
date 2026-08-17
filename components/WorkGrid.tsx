"use client";

import { useMemo, useState } from "react";
import {
  WORK_BROWSE, WORK_CATEGORIES, type CategoryId, type WorkAsset,
} from "@/lib/work-content";

/* ============================================================
   SECTION B - the browse wall.

   The assets arrive as a prop rather than being imported here, because
   where they come from is not this component's business: today it is the
   manifest in lib/work-content.ts, tomorrow it is a Cloudinary tag
   query, and getWorkAssets() in lib/work-data.ts decides which. That
   split is the whole reason the switch is a config change.

   Filtering is on `tags`, which is what the CDN sends. An asset carrying
   a tag nobody planned a filter for still appears under All rather than
   falling out of the site - the failure mode of a tag-driven wall has to
   be "shows up in the wrong place", never "silently missing".

   The tiling is CSS columns with each tile keeping its own aspect ratio,
   same as the AI Work wall - the assets are a mix of orientations and a
   uniform cell would crop the verticals to nothing. The note over that
   decision is in components/AiGrid.tsx and applies here unchanged.

   ---- one thing still outstanding ----

   The client showed a prototype on a call, built two or three months
   back, and asked that this section follow its layout directly. That
   file is not in the repo and was not shared. This is a reasonable
   reading of the brief's own words - filter tabs above a grid of image
   and video tiles - and it should be checked against that prototype
   before anyone calls it done.
   ============================================================ */
export default function WorkGrid({ assets }: { assets: WorkAsset[] }) {
  const [cat, setCat] = useState<CategoryId>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets.length };
    for (const a of assets) for (const t of a.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [assets]);

  return (
    <section className="wk-browse is-light" id="browse">
      <div className="wrap">
        <span className="tag" data-reveal>{WORK_BROWSE.eyebrow}</span>
        <h2 className="wk-browse__title" data-split>{WORK_BROWSE.title}</h2>

        <div className="wk-tabs" role="tablist" aria-label="Filter work by category">
          {WORK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              className="wk-tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              data-cursor={c.label}
            >
              {c.label}
              <sup>{counts[c.id] ?? 0}</sup>
            </button>
          ))}
        </div>

        <div className="wk-grid">
          {assets.map((a) => {
            const shown = cat === "all" || a.tags.includes(cat);
            const inner = (
              <>
                <img src={a.thumb} alt={`${a.brand} - ${a.title}`} loading="lazy" />
                {a.kind === "video" && (
                  <span className="wk-tile__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                )}
                <span className="wk-tile__cap">
                  <b>{a.brand}</b>
                  {a.title && <span>{a.title}</span>}
                </span>
              </>
            );

            /* Only the campaigns that actually have a case page become
               links. A wall where every tile looks clickable and four of
               them are is worse than a wall where the four announce
               themselves. */
            return a.slug ? (
              <a
                className={a.pending ? "wk-tile is-pending" : "wk-tile"}
                key={a.publicId}
                href={`/work/${a.slug}`}
                hidden={!shown}
                style={{ aspectRatio: `${a.w} / ${a.h}` }}
                data-cursor="Open"
              >
                {inner}
              </a>
            ) : (
              <figure
                className={a.pending ? "wk-tile is-pending" : "wk-tile"}
                key={a.publicId}
                hidden={!shown}
                style={{ aspectRatio: `${a.w} / ${a.h}` }}
              >
                {inner}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
