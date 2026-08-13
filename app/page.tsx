import { Loader, Nav, Overlays } from "@/components/Chrome";
import Hero from "@/components/Hero";
import Overture from "@/components/Overture";
import { Awards, Clients, Contact, What, Who } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";

export default function Home() {
  return (
    <>
      <Overlays />
      <Loader />
      {/* The opening sequence, over the top of all of it. Once per tab and
          never with reduced motion - it decides that itself, and lib/motion.ts
          asks the same question so the two never disagree about who owns the
          screen. */}
      <Overture />
      <Nav />

      <main id="top">
        <Hero />
        <Who />
        <What />
        <Clients />
        <Awards />
        <Contact />
      </main>

      <SiteMotion />
    </>
  );
}
