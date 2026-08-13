"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/motion";

/* Boots the shared engine only - this page has no scroll-scrubbed set
   pieces of its own, just the reveals, magnetic buttons and cursor every
   route already gets from initSite(). */
export default function ContactMotion() {
  useEffect(() => {
    const stop = initSite();
    return () => stop();
  }, []);
  return null;
}
