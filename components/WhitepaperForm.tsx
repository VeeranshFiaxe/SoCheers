"use client";

/* Split out from the page purely for the onSubmit handler - the page
   itself stays a server component, and this is the one bit of it that
   needs to be interactive. No submit wiring yet, same as ContactModal. */
export default function WhitepaperForm({
  formLabel,
  cta,
}: {
  formLabel: string;
  cta: string;
}) {
  return (
    <form
      className="bl-paper__form"
      onSubmit={(e) => e.preventDefault()}
    >
      <span className="bl-paper__form-label">{formLabel}</span>
      <div className="bl-paper__form-row">
        <input type="email" name="email" placeholder="you@company.com" required />
      </div>
      <button type="submit" className="bl-paper__submit">
        <span>{cta}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
