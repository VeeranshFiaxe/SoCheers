"use client";

import { usePathname } from "next/navigation";

/* ============================================================
   ONE ACCENT PER PAGE

   Every page leads with the brand's blue - the bright cut on the dark
   ground, the deeper cut on a light one. /series is the exception and
   keeps the streaming red it already blocks its own words in. The whole
   site reads them through the same three tokens (--accent /
   --accent-deep / --accent-ink), so no rule anywhere names a colour.
   This is the one place that decides which triple those tokens point
   at. The groups are kept apart even though they now hold the same
   values, so re-cutting one page's colour stays a change to the
   stylesheet.

   The colours themselves are not here. They are declared in
   app/globals.css as --page-<group>-* groups; this only ever names a
   group, so re-cutting a page's colour is a change to the stylesheet
   and not to a component.

   Why a <style> element rather than a class or a data-attribute on
   <html>: the header, the cursor, the grain and the loader all live in
   app/layout.tsx, outside the route, and all of them are drawn in the
   accent. An effect that wrote a class after hydration would paint all
   of them in the previous page's colour for a frame first. This is a
   client component, but it is server-rendered like any other - the rule
   is in the markup that arrives, so the first paint is already right.
   ============================================================ */

type Group = "home" | "work" | "about" | "ai" | "read" | "chat" | "series";

/* Longest-prefix, the same way the header decides which tab is current
   (components/Nav.tsx) - a case study at /work/nike is still Work, and
   an episode under /series is still something to read. */
const ROUTES: ReadonlyArray<readonly [string, Group]> = [
  ["/work", "work"],
  ["/about", "about"],
  ["/ai-work", "ai"],
  ["/insights", "read"],
  /* /series leads with the streaming red it already blocks its accent
     words in, rather than with the site's blue - see the note over
     --page-series-* in app/globals.css. */
  ["/series", "series"],
  ["/contact", "chat"],
];

function groupFor(pathname: string): Group {
  return (
    ROUTES
      .filter(([href]) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "home"
  );
}

export default function RouteTheme() {
  const g = groupFor(usePathname());
  return (
    <style>{
      `:root{--accent:var(--page-${g}-accent);` +
      `--accent-deep:var(--page-${g}-deep);` +
      `--accent-ink:var(--page-${g}-ink);}`
    }</style>
  );
}
