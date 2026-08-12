import {
  BARS,
  BAR_STROKE,
  LOCKUP_VIEWBOX,
  MARK,
  RING,
  WORD,
  WORD_BLOB,
  WORD_O,
  WORD_STROKE,
} from "@/lib/logo-paths";

/* ============================================================
   The SoCheers logo, flat.

   This is the loading screen's mark and nothing else - no lighting, no
   depth, no state. It is the same geometry the overture's lamp is built
   from (lib/logo-paths.ts), so the logo you watch count up to 100 is
   literally the object that then drops in on a cord and gets switched on.
   ============================================================ */
export default function SoCheersLockup({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={LOCKUP_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SoCheers"
    >
      {/* the disc inside the bulb - the one piece of colour in the mark */}
      <circle
        className="sc-mark__blob"
        cx={MARK.blob.cx}
        cy={MARK.blob.cy}
        r={MARK.blob.r}
      />
      <g
        className="sc-mark__line"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={RING} strokeWidth={MARK.stroke} />
        {BARS.map((d) => (
          <path key={d} d={d} strokeWidth={BAR_STROKE} />
        ))}
      </g>

      {/* the wordmark, with the small o carrying the disc a second time */}
      <circle
        className="sc-mark__blob"
        cx={WORD_BLOB.cx}
        cy={WORD_BLOB.cy}
        r={WORD_BLOB.r}
      />
      <g
        className="sc-mark__line"
        fill="none"
        stroke="currentColor"
        strokeWidth={WORD_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={WORD_O.cx} cy={WORD_O.cy} r={WORD_O.r} />
        {WORD.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
