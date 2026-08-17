import { ASHOK } from "@/lib/ai-content";

/* ============================================================
   The Ashok story.

   Server component - it is six paragraphs and a heading, and there is
   nothing on this page for a client bundle to do.

   Set as a numbered column rather than as a full-bleed set piece. The
   restraint is the point: the page's argument is that everyone's output
   looks the same because everyone reached for the same generator, and a
   story making that case should not itself arrive as six screens of
   drifting stock footage. It reads like something a person wrote.

   It ends by handing the reader back to the work - the brief calls that
   out specifically, and the alternative is a reader who took the funny
   door and is now at the bottom of a page with nothing under them.
   ============================================================ */
export default function AiStory() {
  return (
    <section className="ai-story is-light" aria-labelledby="ashok-title">
      <div className="wrap ai-story__in">
        <span className="tag" data-reveal>A short story</span>

        <h2 className="ai-story__title" id="ashok-title" data-split>
          {ASHOK.title}
        </h2>

        <div className="ai-story__beats">
          {ASHOK.beats.map((b) => (
            <p className="ai-beat" data-reveal key={b.n}>
              <i className="ai-beat__n">{b.n}</i>
              {b.copy}
            </p>
          ))}
        </div>

        <div className="ai-story__out" data-reveal>
          <span className="ai-story__outline">{ASHOK.out.line}</span>
          <a className="ai-story__go" href="#ai-grid" data-magnetic data-cursor="The work">
            {ASHOK.out.label}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
