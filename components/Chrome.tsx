/* The fixed overlays that sit over every page: grain, spotlight, cursor,
   scroll progress. Rendered once in app/layout.tsx.

   The header moved out to components/Nav.tsx and the door to
   components/Loader.tsx - both need client hooks now (the current route,
   and the asset preload behind the count) and this file is otherwise
   markup the server can hand over as-is. */
export function Overlays() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="cursor" aria-hidden="true">
        <span className="cursor__label" />
      </div>
      <div className="progress" aria-hidden="true">
        <span className="progress__bar" />
      </div>
    </>
  );
}
