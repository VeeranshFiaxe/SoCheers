import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../work.css";
import "./case.css";
import { Nav, Overlays } from "@/components/Chrome";
import WorkMotion from "@/components/WorkMotion";
import CaseBlocks from "@/components/CaseBlocks";
import { CASES, findCase } from "@/lib/work-content";

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

      <main id="top" className="cs-page">
        <header className="cs-head">
          <div className="wrap">
            <a className="cs-back" href="/work" data-cursor="Back">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              All work
            </a>

            <span className="cs-brand" data-reveal>{c.brand}</span>
            <h1 className="cs-title" data-split>{c.title}</h1>

            <ul className="cs-meta" data-reveal>
              {c.meta.map((m) => <li key={m}>{m}</li>)}
            </ul>

            <p className="cs-intro" data-reveal>{c.intro}</p>
          </div>
        </header>

        <article className="cs-body">
          <CaseBlocks blocks={c.blocks} />
        </article>

        {/* The way on. A case page that ends is a case page somebody
            leaves; the next one along keeps them in the work. */}
        <nav className="cs-next" aria-label="More work">
          <div className="wrap cs-next__in">
            {CASES.filter((o) => o.slug !== c.slug).slice(0, 3).map((o) => (
              <a className="cs-next__card" key={o.slug} href={`/work/${o.slug}`} data-cursor={o.brand}>
                <b>{o.brand}</b>
                <span>{o.title}</span>
              </a>
            ))}
          </div>
        </nav>
      </main>

      <WorkMotion />
    </>
  );
}
