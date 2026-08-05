"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";

/* Boots the GSAP/Lenis engine once the page is in the DOM and tears it
   all down on unmount, so StrictMode's double-mount and Fast Refresh
   don't stack duplicate ScrollTriggers, tickers or listeners. */
export default function SiteMotion() {
  useEffect(() => initSite(), []);
  return null;
}
