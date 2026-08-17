/* ============================================================
   The SoCheers logo, flat - and it is the brand's own artwork, not a
   redrawing of it.

   This used to be built out of primitives in lib/logo-paths.ts: an arc,
   three bars, a circle, and seven letters approximated from ellipses. It
   was close, and close is exactly the problem with a logo - the blob in
   the real mark overhangs the ring rather than sitting inside it, the
   crescent has a bite out of it, and the wordmark's letterforms are not
   any of the shapes a geometric primitive makes.

   So the real file is the source now:

     public/assets/SC Website Revamp/00. SoCheers design book/
       logo 3-07 (1).png

   which is the yellow stacked lockup from the design book, drawn in
   exactly two inks over a transparent ground - #ffcb0c and #231f20.
   scripts/build-logo.py splits those two inks into a pair of alpha
   masks, and the two spans below are those masks painted by CSS: the
   yellow shapes take --logo, the line work takes currentColor. Which is
   the one thing the flat PNG could not do on its own - the site is dark,
   the brand sheet is drawn for white, and the line work has to be able to
   be cream here, near-black over the About page's panels, and the same
   artwork in both places.

   lib/logo-paths.ts is still the geometry the *lit* fixture is built from
   (the overture's lamp, the footer's pendant): those are a physical
   object with glass and metal, and they need shapes, not pixels.
   ============================================================ */
export default function SoCheersLockup({ className }: { className?: string }) {
  return (
    <span
      className={className ? `sc-lockup ${className}` : "sc-lockup"}
      role="img"
      aria-label="SoCheers"
    >
      <span className="sc-lockup__blob" />
      <span className="sc-lockup__ink" />
    </span>
  );
}
