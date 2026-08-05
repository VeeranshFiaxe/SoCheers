/* Roll-over label. The static build cloned these spans in JS from the
   element's text; in React they're just markup. Put `data-roll` on the
   parent element (as the original markup did) and drop this inside it -
   the resulting DOM is identical to what the old app.js built. */
export default function RollText({ children }: { children: string }) {
  return (
    <span className="roll__in">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
