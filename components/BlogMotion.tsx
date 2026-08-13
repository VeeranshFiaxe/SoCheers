"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";

/* Same shared engine as every other route - reveals, magnetic buttons,
   the cursor. This page has no scroll-scrubbed set pieces of its own. */
export default function BlogMotion() {
  useEffect(() => {
    const stop = initSite();
    return () => stop();
  }, []);
  return null;
}
