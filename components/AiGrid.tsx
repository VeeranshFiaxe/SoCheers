"use client";

import { useMemo, useState } from "react";
import { AI_SEGMENTS, AI_WORK, type SegmentId } from "@/lib/ai-content";

/* ============================================================
   THE WORK GRID - four segments, two orientations, one column flow.

   ---- the tiling ----

   The assets are a mix of vertical and horizontal and the client was
   explicit that both have to sit in the same grid without one of them
   being ruined. Three ways to do that, and only one of them is right
   here:

     - one fixed aspect per tile and cover-crop into it. Cheapest, and it
       throws away the top and bottom of every vertical film - on a page
       about AI video, where the vertical crop *is* the format.
     - a real grid with each tile spanning rows computed from its own
       ratio. Works, needs the ratio in JS and a row-span calculation per
       tile per breakpoint.
     - CSS columns, each tile keeping its own aspect-ratio. The browser
       does the packing, nothing is cropped, no measurement, and it
       reflows on filter change for free.

   The third. The one thing it costs is reading order - columns run down
   rather than across - which for an unordered wall of work is not a
   meaning anyone is relying on.

   ---- the filter ----

   Filtered on `tags`, not on `kind`, even though right now they agree.
   That is on purpose: when this list becomes a Cloudinary fetch (see the
   note over AI_WORK in lib/ai-content.ts) the tags are what comes back
   from the CDN, and an asset that arrives with a tag nobody planned for
   should still show up under All rather than vanish.

   The whole list stays mounted and hidden tiles are marked rather than
   unmounted, so switching segments never re-decodes an image the reader
   has already seen.
   ============================================================ */
export default function AiGrid() {
  const [seg, setSeg] = useState<SegmentId>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: AI_WORK.length };
    for (const a of AI_WORK) for (const t of a.tags) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, []);

  return (
    <section className="ai-work is-light" id="ai-grid">
      <div className="wrap">
        <span className="tag" data-reveal>The work</span>

        <div className="ai-tabs" role="tablist" aria-label="Filter work by type">
          {AI_SEGMENTS.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              className="ai-tab"
              aria-selected={seg === s.id}
              onClick={() => setSeg(s.id)}
              data-cursor={s.label}
            >
              {s.label}
              <sup>{counts[s.id] ?? 0}</sup>
            </button>
          ))}
        </div>

        <div className="ai-grid">
          {AI_WORK.map((a) => {
            const shown = seg === "all" || a.tags.includes(seg);
            return (
              <figure
                key={a.id}
                className={a.pending ? "ai-tile is-pending" : "ai-tile"}
                hidden={!shown}
                /* the asset's own ratio, so nothing is cropped and the
                   column packer knows the real height before load */
                style={{ aspectRatio: `${a.w} / ${a.h}` }}
              >
                <img src={a.thumb} alt={a.title} loading="lazy" />

                {/* Video tiles say so. Not an auto-generated poster frame
                    behind it either - the thumbnail on a video entry is a
                    custom deliverable per film, which is why a missing
                    one is a content bug rather than something the grid
                    papers over. */}
                {a.kind === "video" && (
                  <span className="ai-tile__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                )}

                <figcaption className="ai-tile__cap">
                  <b>{a.brand}</b>
                  <span>{a.title}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
