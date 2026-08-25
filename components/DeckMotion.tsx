"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";
import { initDeck } from "@/lib/deck-motion";

/* Shared engine plus this route's own scroll work, same pairing and same
   teardown order as components/SeriesMotion.tsx and AboutMotion.tsx -
   both stops run in reverse on unmount so StrictMode's double mount
   cannot stack triggers. */
export default function DeckMotion() {
  useEffect(() => {
    const stopSite = initSite();
    const stopDeck = initDeck();
    return () => { stopDeck(); stopSite(); };
  }, []);
  return null;
}
