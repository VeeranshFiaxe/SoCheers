import { BARS, BAR_STROKE, MARK, PENDANT_VIEWBOX, RING, ringArc } from "@/lib/logo-paths";

/* The mark, standing up, wired to light.

   Same reading the overture and the footer's pendant take - the logo is
   already a bulb - but stripped to what a small in-page moment needs:
   no shell gradients, no fixture, just the monoline mark with a warm
   envelope behind the glass that can be switched on. Everything that
   only exists when it is alight carries `ctb__lit`, so the whole switch
   is one class on the wrapper (see .ctf__done in app/contact/contact.css)
   rather than a state per part. Off is the resting state, which is what
   reduced motion and a script-less render both get. */
const RING_INNER = ringArc(MARK.r - 6);

export default function ContactBulb({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={PENDANT_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="ctb-blob" cx="0.42" cy="0.36" r="0.78">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="0.28" stopColor="#ffe9a0" />
          <stop offset="0.62" stopColor="#ffcb0c" />
          <stop offset="1" stopColor="#ff9b1a" />
        </radialGradient>
        <radialGradient id="ctb-glass" cx="0.46" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff4d2" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffce7d" stopOpacity="0.5" />
          <stop offset="0.78" stopColor="#ff9b36" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0.05" />
        </radialGradient>
        <filter id="ctb-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="ctb-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id="ctb-clip">
          <circle cx={MARK.cx} cy={MARK.cy} r={MARK.glass} />
        </clipPath>
      </defs>

      {/* the light itself, kept inside the glass */}
      <g clipPath="url(#ctb-clip)">
        <circle
          className="ctb__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r + 14}
          fill="#ffcf82"
          filter="url(#ctb-softer)"
        />
        <circle
          className="ctb__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r}
          fill="url(#ctb-blob)"
          filter="url(#ctb-soft)"
        />
        <circle className="ctb__lit" cx={MARK.cx} cy={MARK.cy} r={MARK.glass} fill="url(#ctb-glass)" />
      </g>

      {/* the flat logo's own disc, under the ring the way the lockup
          draws it - the one part that is there whether or not the light
          is on, because it is the brand's yellow before it is a filament */}
      <circle
        className="ctb__disc"
        cx={MARK.blob.cx}
        cy={MARK.blob.cy}
        r={MARK.blob.r}
        fill="#ffcb0c"
        clipPath="url(#ctb-clip)"
      />

      <g fill="none" strokeLinecap="round">
        <path className="ctb__lit" d={RING_INNER} stroke="#ffd79a" strokeOpacity="0.5" strokeWidth="3" />
        <path d={RING} stroke="currentColor" strokeWidth={MARK.stroke} />
        {BARS.map((d) => (
          <path key={d} d={d} stroke="currentColor" strokeWidth={BAR_STROKE} />
        ))}
      </g>
    </svg>
  );
}
