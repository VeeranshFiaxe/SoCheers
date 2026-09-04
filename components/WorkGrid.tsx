"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  WORK_BROWSE, WORK_CATEGORIES, catLabel, type CategoryId, type WorkAsset,
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

   ---- the ground, and why it stopped being cream ----

   This section used to be a light panel, and the page went from a black
   photographic stage to a cream wall the moment anyone scrolled. That
   break is the thing the client objected to and they are right about
   it: the stage above is a picture, the wall below is pictures, and
   dropping a sheet of paper between them turns one page of work into
   two unrelated ones. Black all the way down, and the tiles are the
   only light on the page.

   ---- the ground it sits on ----

   The section carries the same four vertical hairlines the AI Work and
   Contact heroes already use (.grid-lines, globals.css). A wall of
   pictures on flat black has nothing holding it together between the
   tiles, and the lines give the gaps a reason to be the width they are.
   They are the site's own token, --line, not the reference's - the
   texture is borrowed, the colour is not.

   ---- the tiling ----

   Two wide cards to a row, each a landscape frame with the brand and
   its categories sitting on the bottom of the picture, per the
   reference. This replaced a masonry column layout, and the trade is
   real and worth stating: a uniform 16:9 cell crops a portrait asset
   hard. It is the right trade here anyway - a wall of ragged columns
   reads as a contact sheet, and these are campaigns that each deserve
   to be looked at one at a time. Assets shot vertical want a crop
   chosen at upload; `c_fill,g_auto` on the Cloudinary thumb URL is
   where that goes when the CDN lands.
   ============================================================ */
export default function WorkGrid({ assets }: { assets: WorkAsset[] }) {
  const [cat, setCat] = useState<CategoryId>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets.length };
    for (const a of assets) for (const t of a.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [assets]);

  /* Filtered here rather than by hiding tiles, so the count under the
     tabs and the tiles on the wall can never disagree - they are the
     same array read twice. */
  const shown = useMemo(
    () => (cat === "all" ? assets : assets.filter((a) => a.tags.includes(cat))),
    [assets, cat],
  );

  return (
    <section className="wk-browse" id="browse">
      <div className="grid-lines grid-lines--mark" aria-hidden="true"><i /><i /><i /><i /></div>

      <div className="wrap">
        {/* No eyebrow and no heading over the wall. The client asked for
            the copy block gone, and the page is better for it: the
            stage above has already said what this page is, and a second
            title under it introduced the same work twice before the
            reader could touch a filter. The tabs are now the first
            thing under the stage, which is what they are for - they are
            a control, and a control the reader reaches immediately is
            worth more than a sentence about the control. */}
        <div className="wk-filter">
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
              </button>
            ))}
          </div>

          {/* The count is not drawn any more - the client does not want
              a number on the tabs or under them, and they are right that
              "23" next to a filter is a fact about the database rather
              than about the work.

              It stays as a live region because it is still the only
              feedback a screen reader gets that pressing a tab did
              anything at all: the tiles change silently, and without
              this a filter is a button that appears to do nothing. */}
          <p className="wk-count sr-only" aria-live="polite">
            {WORK_BROWSE.count(shown.length)}
          </p>
        </div>

        <div className="wk-grid">
          {shown.map((a) => {
            const inner = (
              <>
                <span className="wk-tile__shot">
                  <img src={a.thumb} alt={`${a.brand} - ${a.title}`} loading="lazy" />
                </span>

                <span className="wk-tile__cap">
                  <b>{a.brand}</b>
                  <span className="wk-tile__cats">
                    {a.tags.map((t) => (
                      <span key={t}>{catLabel(t)}</span>
                    ))}
                  </span>
                </span>

                {a.kind === "video" && (
                  <span className="wk-tile__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                )}
              </>
            );

            /* Only the campaigns that actually have a case page become
               links, and the corner arrow goes with the link rather than
               being drawn on every card. A wall where every tile looks
               clickable and four of them are is worse than a wall where
               the four announce themselves. */
            return a.slug ? (
              <Link
                className={a.pending ? "wk-tile is-pending" : "wk-tile"}
                key={a.publicId}
                href={`/work/${a.slug}`}
                prefetch
                data-cursor="Open"
              >
                {inner}
                <span className="wk-tile__go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M9 6h9v9" /></svg>
                </span>
              </Link>
            ) : (
              <figure
                className={a.pending ? "wk-tile is-pending" : "wk-tile"}
                key={a.publicId}
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
