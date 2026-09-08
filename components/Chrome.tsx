/* The fixed overlays that sit over every page: spotlight, cursor,
   scroll progress. Rendered once in app/layout.tsx.

   The header moved out to components/Nav.tsx and the door to
   components/Loader.tsx - both need client hooks now (the current route,
   and the asset preload behind the count) and this file is otherwise
   markup the server can hand over as-is. */
export function Overlays() {
  return (
    <>
      <div className="spotlight" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      {/* A dot and a ring, and nothing written in either. The dot used to
          open into a labelled disc over anything carrying data-cursor -
          "Say hi", "Light it", "Play" - which is a caption chasing the
          pointer around a site whose own controls already say what they
          are. Gone; the attribute stays, because [data-cursor] is still
          what takes the native arrow off those elements (globals.css). */}
      <div className="cursor" aria-hidden="true" />
      <div className="progress" aria-hidden="true">
        <span className="progress__bar" />
      </div>
    </>
  );
}
