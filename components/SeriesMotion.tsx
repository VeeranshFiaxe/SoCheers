"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";
import { initSeries } from "@/lib/series-motion";

/* Shared engine plus this page's own scroll work, same pairing and same
   teardown order as components/AboutMotion.tsx - both stops run in
   reverse on unmount so StrictMode's double mount cannot stack triggers. */
export default function SeriesMotion() {
  useEffect(() => {
    const stopSite = initSite();
    const stopSeries = initSeries();
    return () => { stopSeries(); stopSite(); };
  }, []);
  return null;
}
