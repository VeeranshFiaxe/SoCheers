import type { Metadata } from "next";
import "./deck.css";
import DeckMotion from "@/components/DeckMotion";
import DeckStory from "@/components/DeckStory";
import { DECK, DECK_CTA } from "@/lib/deck-content";

export const metadata: Metadata = {
  title: `${DECK.title} · The deck · SoCheers`,
  description:
    "The Continuity Kink, slide for slide. The client's own deck - its words, its order, its pictures - staged as a scroll.",
  /* A third view of one tab, sitting beside the other two while a
     direction is picked. Not something anyone should land on from a
     search result until it is the one. */
  robots: { index: false, follow: false },
};

/* ============================================================
   SERIES 3.0 - THE DECK.

   The third pass at the Series tab, and the one that goes the other way
   to both of the first two.

     /series       the deck rewritten for the web. Fourteen beats, seven
                   stagings, fourteen scroll mechanics, sentences cut
                   down to a ninety-second read.
     /series-test  that same rewrite staged flat, to see whether the
                   argument survives without the mechanics.
     /series-deck  this. Not the rewrite at all - the PowerPoint. Twenty
                   slides in their own order, in their own words, on
                   their own pictures, with the site's motion under them
                   instead of a click.

   The point of it is recognition. Somebody who has sat through the deck
   should scroll this and find the slide they remember, in the place they
   remember it, saying what it said. Everything that is site rather than
   deck - the cursor, the letterbox, the grain, the type, the palette -
   is the site's, unchanged, so the page still belongs to socheers.net
   rather than looking like a PDF somebody embedded.

   ---- what is deck and what is site ----

   Deck:  the copy, verbatim including its typos; the slide order; the
          line breaks; which word is set enormous on which slide; the
          orange plate; the pictures; the audience bracketing the first
          and last card.
   Site:  Satoshi at the site's weights, the cream-on-near-black palette,
          the letterbox gate at series-motion's numbers, the grain and
          the leak, the cursor, Lenis, the corner slate, the rail.

   The one place the two negotiate is the orange - see --plate and --hi
   in deck.css.

   ---- deleting it ----

   app/series-deck/, components/DeckStory.tsx, components/DeckMotion.tsx,
   lib/deck-content.ts, lib/deck-motion.ts, the third Series entry in
   NAV_LINKS, and public/assets/series/retention.jpg (this route is the
   only thing that references it). Nothing else in the tree imports any
   of them, and this route imports nothing from the other two beyond one
   copy object - DECK_CTA, which is SERIES_CTA under another name.
   ============================================================ */
export default function SeriesDeck() {
  return (
    <>
      <main id="top" className="dk-page">
        {/* The slide counter. Fixed, hairline, alive only while the deck
            is - and it counts the PDF's slide numbers rather than this
            page's sections, which is why a build pair reads "07-08".
            See rail() in lib/deck-motion.ts. */}
        <aside className="dk-rail" aria-hidden="true">
          <span className="dk-rail__label">SLIDE</span>
          <span className="dk-rail__num" data-dk-num>01</span>
          <span className="dk-rail__track">
            <i data-dk-fill />
          </span>
          <span className="dk-rail__of">/ {DECK.slides}</span>
        </aside>

        <div data-dk-story>
          <DeckStory />
        </div>

        {/* ---- the way out ----
            The deck stops on "we'll build the episodes when you're
            ready" and the next thing that happened was a meeting. A page
            cannot stop there, so the two links the live tab ends on are
            the two this one ends on - read from the Series tab's own
            copy file rather than restated. */}
        <section className="dk-out">
          <div className="wrap">
            <p className="dk-out__copy">{DECK_CTA.copy}</p>
            <div className="dk-out__row">
              <a className="dk-out__go" href={DECK_CTA.primary.href}>
                {DECK_CTA.primary.label}
              </a>
              <a
                className="dk-out__alt"
                href={DECK_CTA.secondary.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Produced with <b>{DECK_CTA.secondary.label}</b>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="dk-foot">
        <div className="wrap dk-foot__in">
          <span>{DECK.title}</span>
          <span>The deck, slide for slide</span>
        </div>
      </footer>

      <DeckMotion />
    </>
  );
}
