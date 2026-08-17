import { TREATMENTS, type TreatmentId } from "@/lib/series-content";

/* ============================================================
   The treatment switcher - a review tool, not a feature.

   The client asked to compare directions rather than be handed one, so
   this sits on the page while that decision is open and comes off the
   moment it closes. Three links, no client JS: each one is the same URL
   with a different `t`, which means the client can send a colleague the
   exact direction they are looking at, and it works with the page fully
   server-rendered.

   Deliberately visible rather than hidden behind a key combination: the
   people reviewing this are on a call being walked through it, and a
   secret switcher is one more thing to explain. It is labelled as a
   review control so nobody mistakes it for site furniture.

   ---- when the direction is picked ----
   Delete this component, delete its markup in app/series/page.tsx, and
   set DEFAULT_TREATMENT in lib/series-content.ts to whichever one won.
   The page keeps working with no other change; the losing treatments are
   then dead CSS in series.css under their own [data-treatment] blocks
   and can come out in the same pass.
   ============================================================ */
export default function SeriesSwitch({ active }: { active: TreatmentId }) {
  return (
    <div className="s-switch" role="group" aria-label="Treatment preview">
      <span className="s-switch__label">Treatment</span>

      {TREATMENTS.map((t) => (
        <a
          key={t.id}
          href={`/series?t=${t.id}`}
          className="s-switch__opt"
          aria-current={t.id === active ? "true" : undefined}
          title={t.note}
          data-cursor={t.label}
        >
          {t.label}
        </a>
      ))}

      <span className="s-switch__note">
        {TREATMENTS.find((t) => t.id === active)?.note}
      </span>
    </div>
  );
}
