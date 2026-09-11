"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { leaveWall, takeWallY } from "@/lib/work-return";
import { jumpTo } from "@/lib/motion";
import Link from "next/link";
import { pic } from "@/lib/images";
import {
  WORK_BROWSE, WORK_CATEGORIES, catLabel, orderWall, type CategoryId, type WorkAsset,
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
/* ---- the filter survives leaving the page ----

   A reader picks FMCG, opens a case, comes back - and used to find the
   wall reset to All, because the choice lived in this component's state
   and the component is thrown away with the page. So it lives outside
   it: in memory for the life of the tab, and in sessionStorage so a full
   reload keeps it too.

   Read through useSyncExternalStore rather than set in an effect. Coming
   back from a case is a client-side navigation, and this way the wall's
   very first render is already filtered - which is also what lets the
   browser put the reader back at the scroll position they left, since
   the tiles above it are the same tiles. On a fresh load the server has
   no storage to read, so the page arrives on All and switches straight
   after hydration.

   The in-memory copy is not a nicety: where storage is blocked (private
   modes, strict settings) it is the only copy, and without it the tabs
   would do nothing at all. */
const CAT_KEY = "sc-work-cat";
let picked: CategoryId | null = null;
const listeners = new Set<() => void>();

const isCat = (v: unknown): v is CategoryId => WORK_CATEGORIES.some((c) => c.id === v);

const readCat = (): CategoryId => {
  if (picked) return picked;
  try {
    const v = sessionStorage.getItem(CAT_KEY);
    if (isCat(v)) return (picked = v);
  } catch {}
  return "all";
};

const pickCat = (id: CategoryId) => {
  picked = id;
  try { sessionStorage.setItem(CAT_KEY, id); } catch {}
  listeners.forEach((fn) => fn());
};

const onCat = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export default function WorkGrid({ assets }: { assets: WorkAsset[] }) {
  const cat = useSyncExternalStore(onCat, readCat, () => "all" as CategoryId);
  const setCat = pickCat;

  /* Back from a case's "All work": put the reader where they left the
     wall. Two frames late on purpose - WorkMotion's initSite() scrolls
     every page to the top as it boots, in an effect that runs in this
     same commit, and this has to land after it. The filter above is
     already restored by the first render, so the tiles the saved
     position was measured against are the tiles on the page. See
     lib/work-return.ts. */
  useEffect(() => {
    const y = takeWallY();
    if (y === null) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => jumpTo(y));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets.length };
    for (const a of assets) for (const t of a.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [assets]);

  /* Filtered here rather than by hiding tiles, so the count under the
     tabs and the tiles on the wall can never disagree - they are the
     same array read twice. */
  const shown = useMemo(() => {
    /* mixed categories up top, not grouped - see WALL_ORDER */
    const ordered = orderWall(assets);
    return cat === "all" ? ordered : ordered.filter((a) => a.tags.includes(cat));
  }, [assets, cat]);

  return (
    <section className="wk-browse" id="browse">
      <div className="grid-lines grid-lines--mark" aria-hidden="true"><i /><i /><i /><i /></div>

      <div className="wrap">
        {/* One small label over the tabs, at the client's request - the
            site's own .tag eyebrow, not a title, so the tabs are still
            the first real thing under the stage. */}
        <h2 className="tag wk-browse__h" data-reveal>{WORK_BROWSE.heading}</h2>

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
                  <img
                    {...pic(a.thumb)}
                    sizes="(max-width: 760px) 100vw, 50vw"
                    alt={`${a.brand} - ${a.title}`}
                    loading="lazy"
                  />
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
                onClick={leaveWall}
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
