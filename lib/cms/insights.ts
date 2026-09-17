"use client";

/* What the Insights page draws: whatever the admin panel has saved, or
   the page as it ships (lib/blog-content.ts) until something has been.

   On the live site the Worker writes the saved content into the page's
   head (#sc-insights, worker/index.js), so this is a read, not a
   request. Arriving by client navigation there is no such tag, so it is
   fetched - with a short timeout, because the page's reveal waits on
   this and must never wait long. */
import { useEffect, useState } from "react";
import { DEFAULT_ENTRIES, DEFAULT_INSIGHTS } from "./defaults";
import type { Entry, InsightsPayload, InsightsSettings, PaperData } from "./types";

export type InsightsView = {
  settings: InsightsSettings;
  entries: Entry[];
  ready: boolean;
};

const BUILT_IN: InsightsView = { settings: DEFAULT_INSIGHTS, entries: DEFAULT_ENTRIES, ready: false };

function resolve(payload: InsightsPayload | null): InsightsView {
  if (!payload) return { ...BUILT_IN, ready: true };
  if (!payload.settings) {
    /* nothing saved yet - but a published post still shows */
    return { settings: DEFAULT_INSIGHTS, entries: [...DEFAULT_ENTRIES, ...payload.entries.filter((e) => e.type === "blog")], ready: true };
  }
  return { settings: payload.settings, entries: payload.entries, ready: true };
}

async function load(): Promise<InsightsPayload | null> {
  const tag = document.getElementById("sc-insights");
  if (tag?.textContent) {
    try { return JSON.parse(tag.textContent); } catch { /* fall through to the request */ }
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2500);
  try {
    const r = await fetch("/api/content/insights", { signal: ac.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function useInsights(): InsightsView {
  const [view, setView] = useState<InsightsView>(BUILT_IN);
  useEffect(() => {
    let live = true;
    load().then((p) => live && setView(resolve(p)));
    return () => { live = false; };
  }, []);
  return view;
}

export type PaperView = {
  id: string;
  tag: string;
  title: string;
  blurb: string;
  points: string[];
  pdf: string;
  pages: string[];
  cta: string;
  file: string;
};

export const toPaper = (e: Entry): PaperView => {
  const d = (e.data ?? {}) as Partial<PaperData>;
  return {
    id: e.slug,
    tag: d.tag ?? "",
    title: e.title,
    blurb: e.excerpt,
    points: d.points ?? [],
    pdf: d.pdf ?? "",
    pages: d.pages ?? [],
    cta: d.cta || "Open",
    file: d.file || "document.pdf",
  };
};
