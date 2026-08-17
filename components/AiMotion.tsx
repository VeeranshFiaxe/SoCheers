"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";

/* The shared engine and nothing else - this page has no scroll-scrubbed
   set pieces of its own, same as components/BlogMotion.tsx. It is meant
   to be read in under a minute, and a minute-long page is not somewhere
   to spend a scroll budget. */
export default function AiMotion() {
  useEffect(() => {
    const stop = initSite();
    return () => stop();
  }, []);
  return null;
}
