import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../work.css";
import "./case.css";
import { Nav, Overlays } from "@/components/Chrome";
import Footer from "@/components/Footer";
import WorkMotion from "@/components/WorkMotion";
import CaseBlocks from "@/components/CaseBlocks";
import CaseNav from "@/components/CaseNav";
import { CASES, caseHeadings, findCase } from "@/lib/work-content";

/* Five known cases, so they prerender. A slug that is not one of them is
   a 404 rather than an empty template - a case page with nothing in it
   is exactly the "visible empty space" the brief rules out, and the way
   to honour that rule for a case that does not exist is not to render
   one. */
export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) return { title: "Work · SoCheers" };
  return {
    title: `${c.brand} · SoCheers`,
    description: c.intro,
  };
}

/* ============================================================
   ONE CASE.

   The same template for every campaign regardless of what exists for it
   - the client's requirement, and the reason the body of the page is a
   block list rather than a set of slots. The reasoning is written out in
   full over CaseBlock in lib/work-content.ts and over the renderer in
   components/CaseBlocks.tsx; the short version is that a case with three
   assets and a case with eight are the same code path, and neither one
   knows what the other has.

   Worth opening /work/odyssey next to /work/netflix-mi when reviewing
   this: the first has copy and two pictures and nothing else, the second
   has the full set. If the thin one reads as finished rather than as
   broken, the template does its job.

   ---- the shape, after the reference ----

   Three parts, in the reference's order:

     the frame      the work at full width, title and categories sitting
                    on it, and the film's one action if there is a film
     the article    a rail on the left carrying Back, the contents of
                    the page and the way to get in touch; the writing
                    and the visuals in a column beside it
     the way on     the other cases, as the same cards the wall uses

   What is deliberately not here is a copy hero over the picture. The
   old head introduced the case in cream type on black *above* the
   first image, which put a page of furniture between arriving and
   seeing the work. The title now sits on the work itself.
   ============================================================ */
export default async function Case({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) notFound();

  return (
    <>
      <Overlays />
      <Nav variant="sub" active="/work" />

      {/* The room under the page. Same three parts the home page needs and
          in the same upside-down order - the footer has to come first so
          it is underneath, and .foot-run is one screen of nothing for the
          page to scroll off through, because a fixed element adds no
          height of its own. The whole sequence is initFooter() in
          lib/motion.ts, which initSite() already runs on this route and
          which returns quietly when the markup is not there - so this is
          markup only, and there is no motion code behind it. */}
      <Footer />

      <main id="top" className="cs-page" data-foot-lift>
        {/* ---- the frame ---- */}
        <header className="cs-hero">
          <div className="cs-hero__frame">
            <img src={c.hero} alt="" />
          </div>
          <span className="cs-hero__scrim" aria-hidden="true" />

          <div className="wrap cs-hero__in">
            <div className="cs-hero__title">
              <span className="cs-hero__brand" data-reveal>{c.brand}</span>
              <h1 className="cs-hero__h" data-split>{c.title}</h1>
              <ul className="cs-hero__tags" data-reveal>
                {c.meta.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>

            {/* The action exists only when there is a film to watch. A
                case without one does not get a disabled button or a
                button that scrolls somewhere vague - it gets no button,
                and the row closes up around the absence. */}
            {c.film && (
              <a className="cs-hero__go" href="#film" data-magnetic data-cursor="Play">
                <span className="cs-hero__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
                Watch the film
              </a>
            )}
          </div>
        </header>

        {/* ---- the article ---- */}
        <div className="cs-article">
          <div className="grid-lines grid-lines--mark" aria-hidden="true"><i /><i /><i /><i /></div>

          <div className="wrap cs-article__in">
            <CaseNav items={caseHeadings(c.blocks)} />

            <article className="cs-body">
              <p className="cs-lede" data-reveal>{c.intro}</p>
              <CaseBlocks blocks={c.blocks} />
            </article>
          </div>
        </div>

        {/* The way on. A case page that ends is a case page somebody
            leaves; the next one along keeps them in the work. Same card
            as the browse wall, because it is the same object - a reader
            who has learned what a work card looks like on /work should
            not have to learn a second one here. */}
        <nav className="cs-next" aria-label="More work">
          <div className="grid-lines grid-lines--mark" aria-hidden="true"><i /><i /><i /><i /></div>

          <div className="wrap">
            <span className="tag" data-reveal>More work</span>
            <div className="cs-next__in">
              {CASES.filter((o) => o.slug !== c.slug).slice(0, 3).map((o) => (
                <a className="cs-next__card" key={o.slug} href={`/work/${o.slug}`} data-cursor={o.brand}>
                  <span className="cs-next__shot">
                    <img src={o.hero} alt="" loading="lazy" />
                  </span>
                  <span className="cs-next__cap">
                    <b>{o.brand}</b>
                    {/* the categories only - meta[0] is the year, and a
                        card that leads with a date reads as an archive */}
                    <span>{o.meta.slice(1).join(" · ")}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </nav>
      </main>
      <div className="foot-run" data-foot-run aria-hidden="true" />

      <WorkMotion />
    </>
  );
}
