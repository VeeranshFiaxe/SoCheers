import type { Metadata } from "next";
import "./contact.css";
import { Nav, Overlays } from "@/components/Chrome";
import ContactMotion from "@/components/ContactMotion";
import ContactForm from "@/components/ContactForm";
/* CONTACT_LINKS is no longer read here - the careers link went with the
   "prefer to skip the form?" card this page used to carry. The export is
   left in lib/contact-content.ts as the one place that URL is written
   down, for whatever picks it up next. */
import { CONTACT_HERO, OFFICES } from "@/lib/contact-content";

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

      {/* Light throughout, the same way /blogs is - see .ct-page in
          contact.css. This page used to be the site's dark theme with a
          dark form panel on it, which made it the one page you arrived at
          from the nav that looked like a different site to the Insights
          page beside it in that nav. */}
      <main id="top" className="ct-page" data-nav-light>
        <section className="ct-hero">
          <div className="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="wrap ct-hero__grid">
            <div className="ct-hero__copy">
              <span className="tag" data-reveal>{CONTACT_HERO.eyebrow}</span>
              <h1 className="ct-hero__title" data-split>
                {CONTACT_HERO.lines[0]}
                <em>{CONTACT_HERO.lines[1]}</em>
              </h1>

              {/* The "prefer to skip the form?" card is gone - the two
                  mailto addresses, the careers link and the label above
                  them. It was a second front door standing next to the
                  first one and it argued with the form for the same
                  visitor. What is left of it is the social row, which is
                  not another way to send a brief and is the only place
                  these links appear on this page. */}
              <div className="ct-direct" data-reveal>
                <div className="contact__social ct-direct__social">
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

              {/* Offices used to be their own section below the fold, which
                  left dead space on both sides - they live in the hero's
                  left column now, under the social row.

                  The card is a <div> rather than the <a> it used to be.
                  It carries a map and a button now, and an anchor cannot
                  hold either: an iframe inside a link swallows the click
                  it is nested in, and a link inside a link is not markup
                  a browser has a defined answer for. So the card holds
                  the content and "Get directions" is the one thing in it
                  that is clickable.

                  The card's own height is unchanged - see .ct-office__map
                  in contact.css. The map takes over the stretch the
                  address block used to absorb, so it fills space this box
                  was already holding empty rather than making it taller. */}
              <div className="ct-offices" data-reveal>
                {OFFICES.map((o) => (
                  <div className="ct-office" key={o.city}>
                    <span className="ct-office__tag">{o.tag}</span>
                    <span className="ct-office__city">{o.city}</span>
                    <p className="ct-office__addr">{o.address}</p>

                    {/* Inert on purpose (pointer-events are off in CSS):
                        a live Google embed takes the wheel as a zoom the
                        moment the cursor crosses it, which on a page
                        running Lenis means the scroll simply stops. It is
                        a locator - the button under it is the way out to
                        the real thing. */}
                    <div className="ct-office__map">
                      <iframe
                        src={o.embedUrl}
                        title={`Map of the SoCheers office in ${o.city}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    </div>

                    <a
                      className="ct-office__link"
                      href={o.dirUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-magnetic
                      data-cursor="Directions"
                    >
                      Get directions
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* The form column carries a filler under the panel that grows
                to whatever height the left-hand stack ends up at - without
                it the corner under the form and beside the office card is
                the dead space this layout kept leaving. */}
            <div className="ct-hero__form">
              <div className="ctf__panel" data-reveal>
                <ContactForm />
              </div>

              <div className="ct-tip" data-reveal>
                <span className="ct-tip__label">Before you hit send</span>
                <p className="ct-tip__copy">
                  The briefs we answer fastest tell us three things: what you want
                  to move, by when, and roughly what you have to spend on it. A
                  rough answer to each beats a blank.
                </p>
              </div>
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
        </div>
      </main>

      <ContactMotion />
    </>
  );
}
