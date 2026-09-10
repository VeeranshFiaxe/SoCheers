import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./services.css";
import SiteMotion from "@/components/SiteMotion";
import { BUCKETS } from "@/lib/content";
import { SERVICE_ASK, SERVICE_COPY } from "@/lib/services-content";

/* ============================================================
   ONE SERVICE, EXPANDED

   The home page's WHAT WE DO cards each open onto one of these. Three
   pages, one file: they are the same page with different words and
   different pictures in it, and three near-identical files is three
   places for them to drift apart.

   It is built out of the site's own parts rather than out of new ones.
   The sections are `.sec` - the same rhythm and the same hairline rule
   between them that the home page's sections carry - the headings are
   `.sec__title`, the copy sits in `.wrap`, and the reveals are the shared
   [data-split] / [data-reveal] the rest of the site is written with. The
   stylesheet next door only adds what is genuinely new here, which is the
   plates.

   THE PICTURES ARE THE ONES WE ALREADY HAVE. Every bucket in
   lib/content.ts carries a reel of images sorted by discipline, and every
   capability inside it already names one of them (`img` on each item) -
   that pairing is what the home card's hover cycle parks on. This page
   spends the same set standing still: the cover leads the hero, and each
   capability is a plate with its own frame behind it. Nothing new was
   commissioned and nothing is decorative - the picture under a line is
   the picture that line already owned.

   They are almost all 9:16. That is not a problem to be cropped around,
   it is the page's proportion: the plates are portrait, the hero's visual
   is portrait, and the grid is built for tall frames rather than fighting
   them into letterboxes.

   Deliberately still plain in what it SAYS. No pinned sequence, no
   marquee, no set piece - a reader who clicked "Strategy" asked a direct
   question. So has a search engine, and so has whatever model is being
   asked "what does SoCheers do": the JSON-LD below, the question-shaped
   headings and the one-line definition at the top are the same answer
   served three ways.
   ============================================================ */

/* Static at build time - there are three of these and the list is a
   constant, so nothing about them needs a request to resolve. */
export function generateStaticParams() {
  return BUCKETS.map((b) => ({ service: b.slug }));
}

type Params = { params: Promise<{ service: string }> };

function find(slug: string) {
  const bucket = BUCKETS.find((b) => b.slug === slug);
  const copy = SERVICE_COPY[slug];
  return bucket && copy ? { bucket, copy } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service } = await params;
  const found = find(service);
  if (!found) return {};
  return {
    title: found.copy.metaTitle,
    description: found.copy.metaDescription,
    alternates: { canonical: `/services/${service}` },
  };
}

export default async function ServicePage({ params }: Params) {
  const { service } = await params;
  const found = find(service);
  if (!found) notFound();
  const { bucket, copy } = found;

  /* The other two, for the row at the foot of the page. A service page
     that dead-ends is a page a reader leaves the site from. */
  const others = BUCKETS.filter((b) => b.slug !== bucket.slug);

  /* What a machine reads instead of the markup.

     Service, not WebPage: the entity here is the offering, and naming
     its provider is what ties all three pages to one organisation rather
     than to three unrelated documents. The FAQ is emitted from the same
     array the page renders, so the two cannot disagree - which is the
     only version of this that is worth having, since a page whose
     structured data says something its copy does not is worse than a
     page with none. */
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `${copy.headline} - SoCheers`,
        serviceType: copy.headline,
        description: copy.lede,
        provider: {
          "@type": "Organization",
          name: "SoCheers",
          url: "https://socheers.net",
          description:
            "An independent, integrated creative agency in Mumbai, India.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Mumbai",
            addressCountry: "IN",
          },
        },
        areaServed: { "@type": "Country", name: "India" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: copy.headline,
          itemListElement: bucket.items.map((it) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: it.label },
          })),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <main id="top" className="sv-page">
        {/* ---- the top ------------------------------------------------
            The bucket's cover fills the whole hero, full bleed, with the
            copy set over it. Decorative: the sentence carries the meaning. */}
        <section className="sec sv-top no-border">
          <div className="sv-top__bg" aria-hidden="true">
            <img src={bucket.img} alt="" fetchPriority="high" decoding="async" />
          </div>
          <div className="wrap">
            <Link className="sv-back" href="/#what" prefetch>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              <span>What we do</span>
            </Link>

            <div className="sv-hero">
              <div className="sv-hero__copy">
                <h1 className="sv-hero__title" data-split>{copy.headline}</h1>
                {/* The one sentence the whole page is a footnote to. Set as
                    running copy rather than as a heading, because it is a
                    definition and it is meant to be quotable whole. */}
                <p className="sv-hero__lede" data-reveal>{copy.lede}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- what that covers --------------------------------------- */}
        <section className="sec sv-caps">
          <div className="wrap">
            <h2 className="sec__title" data-split>What that covers.</h2>

            <div className="sv-plates">
              {bucket.items.map((it) => (
                <article className="sv-plate" key={it.label} data-reveal>
                  {/* the frame this line already owns - see the header
                      note, and `items` in lib/content.ts */}
                  <div className="sv-plate__img">
                    <img src={it.img} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="sv-plate__body">
                    <h3 className="sv-plate__name">{it.label}</h3>
                    {/* keyed off the label BUCKETS already uses - a
                        capability with no line written for it yet still
                        gets its plate */}
                    {copy.capabilities[it.label] ? (
                      <p className="sv-plate__copy">{copy.capabilities[it.label]}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---- the way on ---------------------------------------------
            The other two disciplines, each on its own cover, and the ask.
            No heading over it: the two names are the heading. */}
        <section className="sec sv-next">
          <div className="wrap">
            <div className="sv-next__grid">
              {others.map((o) => (
                <Link className="sv-next__card" key={o.slug} href={`/services/${o.slug}`} prefetch>
                  <div className="sv-next__img">
                    <img src={o.img} alt="" loading="lazy" decoding="async" />
                  </div>
                  <span className="sv-next__name">{o.name}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>

            <div className="sv-ask" data-reveal>
              <p className="sv-ask__line">{SERVICE_ASK}</p>
              <Link href="/contact" prefetch className="nav__cta" data-cursor="Say hi">
                <span>Let&rsquo;s chat</span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ---- the questions ------------------------------------------
            Last on the page, closed by default. <details> keeps every
            answer in the DOM, so crawlers still read it. */}
        <section className="sec sv-faq">
          <div className="wrap">
            <h2 className="sec__title" data-split>Questions we get asked.</h2>
            <div className="sv-faq__list">
              {copy.faq.map((f) => (
                <details className="sv-q" key={f.q} data-reveal>
                  <summary className="sv-q__q">
                    <span>{f.q}</span>
                    <svg className="sv-q__arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="sv-q__a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* The shared engine, for the reveals and the cursor - the same one
          the home page boots. Nothing on this page pins or scrubs. */}
      <SiteMotion />
    </>
  );
}
