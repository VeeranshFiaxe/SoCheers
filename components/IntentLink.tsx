"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, FocusEvent, PointerEvent, TouchEvent } from "react";

/* ============================================================
   A LINK THAT FETCHES THE NEXT PAGE WHEN YOU GO FOR IT.

   Next's own <Link> fetches a page's data the moment the link scrolls into
   view. On a site of six tabs in a fixed header, that is every page of the
   site being downloaded while the first one is still opening - and a
   page's data is not small here: the stylesheet is inlined into it
   (experimental.inlineCss, next.config.mjs), so each one is about 20KB
   compressed. On a phone that was most of a second of the opening spent on
   pages nobody had asked for yet.

   So the fetch waits for the first sign that somebody actually means to
   go: the pointer arriving, a finger landing, or the link taking focus.
   That is between a tenth and a half a second of warning on a tap, longer
   on a hover, and the files themselves come off Cloudflare's edge - which
   is the same head start the viewport fetch was giving, without spending
   it on the five tabs that are not clicked.

   Used everywhere in place of next/link: the import is swapped, the tag
   name is not, so JSX reads the same as it always did. Any `prefetch` prop
   is deliberately dropped on the floor - this component is the site's one
   answer to that question.
   ============================================================ */

type Props = ComponentProps<typeof Link>;

export default function IntentLink({ href, prefetch: _ignored, ...rest }: Props) {
  const router = useRouter();

  /* Same page, different anchor (/#contact, /#what): there is nothing to
     fetch - the router has it already - and handing a hash to prefetch()
     only makes it ask for the same page under a different key. */
  const warm = () => {
    const to = typeof href === "string" ? href : href?.pathname;
    if (!to || to.startsWith("#")) return;
    const path = to.split("#")[0];
    if (path) router.prefetch(path);
  };

  const enter = (e: PointerEvent<HTMLAnchorElement>) => {
    warm();
    rest.onPointerEnter?.(e);
  };
  const touch = (e: TouchEvent<HTMLAnchorElement>) => {
    warm();
    rest.onTouchStart?.(e);
  };
  const focus = (e: FocusEvent<HTMLAnchorElement>) => {
    warm();
    rest.onFocus?.(e);
  };

  return (
    <Link
      href={href}
      prefetch={false}
      {...rest}
      onPointerEnter={enter}
      onTouchStart={touch}
      onFocus={focus}
    />
  );
}
