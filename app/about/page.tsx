import type { Metadata } from "next";
import "./about.css";
import { Nav, Overlays } from "@/components/Chrome";
import AboutMotion from "@/components/AboutMotion";
import AboutHero from "@/components/AboutHero";
import {
  AboutDrives, AboutEnd, AboutFounders, AboutIntro,
  AboutPeople, AboutSpace,
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
      <Overlays />
      <Nav variant="sub" active="/about" />

      <main id="top">
        <AboutHero />

        {/* Everything past the opener is a card in one stack: each panel
            rides up over the one before it on a rounded top edge, and each
            sits a shade lighter, so the page walks from black to white as
            one continuous move rather than switching theme at a seam. */}
        <div className="ab-stack">
          <AboutIntro />
          <AboutFounders />
          <AboutPeople />
          <AboutDrives />
          <AboutSpace />
          <AboutEnd />
        </div>
      </main>

      <AboutMotion />
    </>
  );
}
