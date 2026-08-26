import { AI_PS } from "@/lib/ai-content";

/* ============================================================
   The postscript.

   Everything that used to stand between the hero and the wall of work -
   the fork, and the Ashok story it opened - is gone. What is left is one
   line, which is also the whole of what this section is allowed to be:
   the page's measure is "under a minute end to end", and a hero followed
   by a second full screen of argument is how that minute gets spent on
   the argument instead of the work.

   No button under it either. The work starts in the next section with
   nothing in between, so a link pointing at it was labelling a scroll
   the reader was already making - and a lone pill under twenty words of
   type read as the end of the page rather than the middle of it.

   So: a rule, a line, and the grid. No portrait, no scrubbed cascade,
   no reserved screen height. The type is the display face at a size
   below the hero's, because the postscript should read as a smaller
   thing said after the big one, not as a second headline competing
   with it.

   Server component - one string, and nothing for a client bundle to do.
   ============================================================ */
export default function AiPs() {
  return (
    <section className="ai-ps" aria-label="Postscript">
      <div className="wrap ai-ps__in">
        <p className="ai-ps__copy" data-split>{AI_PS.copy}</p>
      </div>
    </section>
  );
}
