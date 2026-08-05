import { Loader, Nav, Overlays, Rail } from "@/components/Chrome";
import Hero from "@/components/Hero";
import { Awards, Clients, Contact, What, Who, Work } from "@/components/Sections";
import SiteMotion from "@/components/SiteMotion";

export default function Home() {
  return (
    <>
      <Overlays />
      <Loader />
      <Rail />
      <Nav />

      <main id="top">
        <Hero />
        <Who />
        <What />
        <Clients />
        <Work />
        <Awards />
        <Contact />
      </main>

      <SiteMotion />
    </>
  );
}
