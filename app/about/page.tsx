import type { Metadata } from "next";
import "./about.css";
import AboutMotion from "@/components/AboutMotion";
import AboutHero from "@/components/AboutHero";
import {
  AboutCrowd, AboutDrives, AboutEnd, AboutFounders,
  AboutIntro, AboutPeople, AboutSpace,
} from "@/components/AboutSections";

export const metadata: Metadata = {
  title: "About · SoCheers",
  description:
    "One team, many disciplines. The people, the founders and the office behind SoCheers - an independent, integrated creative agency.",
};

/* One scrolling page, no sub-tabs. No Loader: it belongs to the home page's
   hero sequence. */
export default function About() {
  return (
    <>
      <main id="top">
        <AboutHero />

        {/* One stack, one colour. The film hands over to the cream at the
            top of the first panel (see .ab-bridge in about.css) and the
            page stays on it all the way down, so there is no theme switch
            at any seam below the opener. */}
        <div className="ab-stack">
          <AboutIntro />
          <AboutFounders />
          <AboutPeople />
          <AboutDrives />
          <AboutSpace />
          <AboutCrowd />
          <AboutEnd />
        </div>
      </main>

      <AboutMotion />
    </>
  );
}
