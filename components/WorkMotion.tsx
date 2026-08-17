"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";

/* The shared engine only. The pinned rail owns its own state and the
   browse wall is a filter - neither is scroll-driven, so there is no
   page-specific timeline here the way there is on Series. */
export default function WorkMotion() {
  useEffect(() => {
    const stop = initSite();
    return () => stop();
  }, []);
  return null;
}
