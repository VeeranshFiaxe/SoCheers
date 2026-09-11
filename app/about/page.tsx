import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import "./about.css";
import AboutMotion from "@/components/AboutMotion";
import AboutHero from "@/components/AboutHero";
import {
  AboutCrowd, AboutEnd, AboutFounders,
  AboutIntro, AboutPeople, AboutSpace,
} from "@/components/AboutSections";

export const metadata: Metadata = pageMeta({
  title: "About · SoCheers",
  description:
    "One team, many disciplines. The people, the founders and the office behind SoCheers - an independent, integrated creative agency.",
  path: "/about",
});

/* One scrolling page, no sub-tabs. No Loader: it belongs to the home page's
   hero sequence. */
export default function About() {
  return (
    <>
      <main id="top">
        <AboutHero />

        {/* One stack, one colour - and the opener is on it too. The film
            dissolves into this cream at its own foot (.ab-open__veil in
            about.css) rather than handing over through a ramp at the top
            of the first panel, so the page is one off-white from the very
            top and there is no theme switch at any seam on it. */}
        <div className="ab-stack">
          <AboutIntro />
          <AboutFounders />
          <AboutPeople />
          <AboutSpace />
          <AboutCrowd />
          <AboutEnd />
        </div>
      </main>

      <AboutMotion />
    </>
  );
}
