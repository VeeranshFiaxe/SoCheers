import type { Metadata } from "next";
import "./contact.css";
import { Nav, Overlays } from "@/components/Chrome";
import ContactMotion from "@/components/ContactMotion";
import ContactForm from "@/components/ContactForm";
import { IMG } from "@/lib/content";
import { CONTACT_HERO, CONTACT_LINKS, OFFICES } from "@/lib/contact-content";

export const metadata: Metadata = {
  title: "Contact · SoCheers",
  description:
    "Got a brief, a partnership, or just want to say hi? Here's every way to reach SoCheers.",
};

/* The nav's "Let's chat" used to just pop the footer's modal - now it lands
   here first, a proper front door with its own full-size form (see
   components/ContactForm.tsx). The pop-up itself (components/ContactModal.tsx)
   stays exactly what it was: the small, fast version behind the footer's
   own "Let's chat" trigger, team photo included. */
export default function Contact() {
  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/contact" />

      <main id="top">
        <section className="ct-hero">
          <div className="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="wrap">
            <span className="tag" data-reveal>{CONTACT_HERO.eyebrow}</span>
            <h1 className="ct-hero__title" data-split>
              {CONTACT_HERO.lines[0]}
              <em>{CONTACT_HERO.lines[1]}</em>
            </h1>
            <p className="ct-hero__lede" data-reveal>{CONTACT_HERO.lede}</p>
          </div>
        </section>

        <section className="ct-form sec">
          <div className="wrap ct-form__grid">
            <aside className="ct-visual" data-reveal>
              <div className="ct-visual__photo" data-tilt>
                <img src={IMG.team} alt="The SoCheers team" data-clip />
                <div className="ct-visual__veil" />
                <span className="ct-visual__tag">MAKING MORE HAPPEN</span>
              </div>

              <div className="ct-visual__direct">
                <span className="ct-visual__label">Prefer to skip the form?</span>
                <a href="mailto:hello@socheers.net" className="ct-visual__email" data-magnetic data-cursor="Email">
                  <span>Bring us a brief</span>
                  <b>hello@socheers.net</b>
                </a>
                <a href="mailto:careers@socheers.net" className="ct-visual__email" data-magnetic data-cursor="Email">
                  <span>Bring us your best work</span>
                  <b>careers@socheers.net</b>
                </a>
                <a href={CONTACT_LINKS.careers} target="_blank" rel="noopener noreferrer" className="ct-visual__email" data-magnetic data-cursor="Careers">
                  <span>See open roles</span>
                  <b>Careers</b>
                </a>

                <div className="contact__social ct-visual__social">
                  <a
                    href="https://www.instagram.com/thesocheers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SoCheers on Instagram"
                    data-magnetic
                    data-cursor="Follow"
                  >
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5.5" />
                      <circle cx="12" cy="12" r="4.2" />
                      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                  <a
                    href="https://in.linkedin.com/company/socheers"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SoCheers on LinkedIn"
                    data-magnetic
                    data-cursor="Follow"
                  >
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@ThisIsSoCheers"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SoCheers on YouTube"
                    data-magnetic
                    data-cursor="Follow"
                  >
                    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 8.5a3 3 0 0 0-2.1-2.1C18.1 6 12 6 12 6s-6.1 0-7.9.4A3 3 0 0 0 2 8.5 31 31 0 0 0 1.6 13a31 31 0 0 0 .4 4.5A3 3 0 0 0 4.1 19.6C5.9 20 12 20 12 20s6.1 0 7.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5z" />
                      <path d="M10 10.2v5.6l5-2.8-5-2.8z" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/TheSoCheers"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SoCheers on Facebook"
                    data-magnetic
                    data-cursor="Follow"
                  >
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5.5" />
                      <path d="M14.4 8.4h-1.6a1.8 1.8 0 0 0-1.8 1.8V12h3.3l-.45 3h-2.85v6.9" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/TheSoCheers"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SoCheers on X"
                    data-magnetic
                    data-cursor="Follow"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4l16 16M20 4L4 20" />
                    </svg>
                  </a>
                </div>
              </div>
            </aside>

            <div className="ctf__panel" data-reveal>
              <ContactForm />
            </div>
          </div>
        </section>

        <section className="ct-offices sec">
          <div className="wrap">
            <span className="tag" data-reveal>Where to find us</span>

            <div className="ct-offices__grid">
              {OFFICES.map((o) => (
                <a
                  key={o.city}
                  className="ct-office"
                  href={o.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-magnetic
                  data-cursor="Directions"
                >
                  <span className="ct-office__tag">{o.tag}</span>
                  <span className="ct-office__city">{o.city}</span>
                  <p className="ct-office__addr">{o.address}</p>
                  <span className="ct-office__link">
                    Get directions
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="ct-end">
          <a href="/" className="ct-end__back" data-cursor="Home">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <span>Back to home</span>
          </a>
          <a href="/blogs" className="nav__cta" data-magnetic data-cursor="Read">
            <span>Read the blog</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </main>

      <ContactMotion />
    </>
  );
}
