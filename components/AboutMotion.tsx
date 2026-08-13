"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";
import { initAbout } from "@/lib/about-motion";

/* Boots the shared engine plus the About-only scroll work. initSite() is
   reused wholesale - every one of its blocks guards on an empty selection,
   so the home page's hero, loader and dictionary entry simply do not
   run here, and this page still gets Lenis, the cursor, the split reveals
   and the marquees for free.

   Both teardowns run on unmount, in reverse order of setup, so StrictMode's
   double-mount and Fast Refresh cannot stack duplicate ScrollTriggers. */
export default function AboutMotion() {
  useEffect(() => {
    const stopSite = initSite();
    const stopAbout = initAbout();
    return () => { stopAbout(); stopSite(); };
  }, []);
  return null;
}
