import ContactModal from "./ContactModal";
import {
  BARS,
  BAR_STROKE,
  MARK,
  PENDANT_VIEWBOX,
  RING,
  ringArc,
} from "@/lib/logo-paths";

/* ============================================================
   THE FOOTER - markup only.

   It is not at the bottom of the page in the usual sense. It is a fixed
   room the size of the viewport sitting *behind* <main>, and the last
   screen of scroll lifts the page off it (see .foot-lift in globals.css
   and initFooter in lib/motion.ts). Nothing here ever moves with the
   scroll: the page moves, this stays.

   What plays out once it is uncovered is the overture in reverse. There
   the mark stood in a dark room and you switched it on; here it comes
   down from the ceiling already alight over a room that is white because
   of it, dies, drops its cord, and turns itself the right way up in the
   dark - and the rest of the footer arrives around it.

   Every state written into the CSS below is the *end* of that: mark
   upright, no cord, black room, copy visible. That is what a script-less
   or reduced-motion visitor gets, and it is what the engine tweens back
   from rather than to.
   ============================================================ */

/* The pendant.

   Same glass-and-moulding treatment as the overture's lamp
   (components/Overture.tsx), on the same geometry, cropped to the ink -
   see PENDANT_VIEWBOX. It hangs upside down, so the three bars of the
   mark's base are what the flex is screwed into, which is the only way
   round a bulb ever comes down from a ceiling.

   As there, the parts carrying `foot__lit` are the only ones that differ
   between alight and dead, so the whole death of the light is one custom
   property being set nine times. */
const RING_INNER = ringArc(MARK.r - 6);
const RING_OUTER = ringArc(MARK.r + 6);

function Pendant() {
  return (
    <svg
      className="foot__svg"
      viewBox={PENDANT_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* userSpaceOnUse for the same reason the overture needs it: the
            base bars are horizontal strokes with zero-height bounding
            boxes, and an objectBoundingBox gradient on one of those is
            not painted at all. */}
        <linearGradient
          id="foot-shell"
          gradientUnits="userSpaceOnUse"
          x1="104" y1="80" x2="296" y2="330"
        >
          <stop offset="0" stopColor="#4a4a54" />
          <stop offset="0.3" stopColor="#26262c" />
          <stop offset="0.68" stopColor="#141419" />
          <stop offset="1" stopColor="#2c2c34" />
        </linearGradient>

        <radialGradient id="foot-glass-off" cx="0.36" cy="0.3" r="0.86">
          <stop offset="0" stopColor="#2b2d34" />
          <stop offset="0.55" stopColor="#141519" />
          <stop offset="1" stopColor="#0a0b0e" />
        </radialGradient>

        <radialGradient id="foot-blob-on" cx="0.42" cy="0.36" r="0.78">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="0.28" stopColor="#ffe9a0" />
          <stop offset="0.62" stopColor="#ffcb0c" />
          <stop offset="1" stopColor="#ff9b1a" />
        </radialGradient>
        <radialGradient id="foot-glass-on" cx="0.46" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff4d2" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffce7d" stopOpacity="0.5" />
          <stop offset="0.78" stopColor="#ff9b36" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0.05" />
        </radialGradient>

        <filter id="foot-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="foot-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>

        <clipPath id="foot-clip">
          <circle cx={MARK.cx} cy={MARK.cy} r={MARK.glass} />
        </clipPath>
      </defs>

      {/* the envelope, cold */}
      <circle cx={MARK.cx} cy={MARK.cy} r={MARK.glass} fill="url(#foot-glass-off)" />

      {/* the brand disc inside it, which is both the logo's own crescent
          and the filament */}
      <g clipPath="url(#foot-clip)">
        <circle cx={MARK.blob.cx} cy={MARK.blob.cy} r={MARK.blob.r} fill="#26221a" />
        <circle
          className="foot__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r + 14}
          fill="#ffcf82"
          filter="url(#foot-softer)"
        />
        <circle
          className="foot__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r}
          fill="url(#foot-blob-on)"
          filter="url(#foot-soft)"
        />
        <circle
          className="foot__lit"
          cx={MARK.cx}
          cy={MARK.cy}
          r={MARK.glass}
          fill="url(#foot-glass-on)"
        />
        {/* and the surface of the glass, over everything behind it */}
        <ellipse cx="160" cy="112" rx="5" ry="7.5" fill="#fff" opacity="0.4" transform="rotate(-24 160 112)" />
        <ellipse cx="240" cy="220" rx="16" ry="9" fill="#fff" opacity="0.06" transform="rotate(28 240 220)" />
      </g>

      {/* The disc as the flat logo draws it - under the ring, not over
          it, which is the order in components/SoCheersLockup.tsx and the
          only order in which the mark reads as one drawn object. Paired
          with the `foot__cold` ring below: between them they are the
          site's own logo, and they are the only thing left once the
          glass has gone out. */}
      <circle
        className="foot__cold"
        cx={MARK.blob.cx}
        cy={MARK.blob.cy}
        r={MARK.blob.r}
        fill="#ffcb0c"
        clipPath="url(#foot-clip)"
      />

      {/* the ring and the three bars of the base, in one material,
          because in the logo they are one drawn object */}
      <g fill="none" strokeLinecap="round">
        <path d={RING} stroke="#000" strokeOpacity="0.5" strokeWidth={MARK.stroke + 3} />
        {BARS.map((d) => (
          <path key={`s${d}`} d={d} stroke="#000" strokeOpacity="0.5" strokeWidth={BAR_STROKE + 3} />
        ))}

        <path d={RING} stroke="url(#foot-shell)" strokeWidth={MARK.stroke} />
        {BARS.map((d) => (
          <path key={`b${d}`} d={d} stroke="url(#foot-shell)" strokeWidth={BAR_STROKE} />
        ))}

        <path d={RING_INNER} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" />
        <path d={RING_OUTER} stroke="#000" strokeOpacity="0.35" strokeWidth="2.2" />

        {/* the warm edge the disc throws onto the inside of the ring... */}
        <path className="foot__lit" d={RING_INNER} stroke="#ffd79a" strokeOpacity="0.45" strokeWidth="3" />
        {/* ...and, once the room is dark, the same monoline the site draws
            its logo in everywhere else, so what is left standing at the
            end is the mark rather than a dead prop. `foot__cold` is the
            exact inverse of `foot__lit`, which is why the crossover needs
            no timing of its own. */}
        <path className="foot__cold" d={RING} stroke="currentColor" strokeWidth={MARK.stroke} />
        {BARS.map((d) => (
          <path key={`c${d}`} className="foot__cold" d={d} stroke="currentColor" strokeWidth={BAR_STROKE} />
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------
   The globe.

   Where the work is made, said once and without a map service: a
   monoline wireframe in the same weight as the rest of the site's line
   art, turned so India is the face of it, with the pin on Mumbai. The
   graticule is drawn as ellipses rather than projected properly - at
   this size a real projection buys nothing you can see and costs a
   dependency.

   India is authored in its own 100 x 120 box (roughly 68-97E by 8-35N)
   and dropped onto the sphere by the transform on the group, which is
   also how the pin's position was worked out: 19.08N 72.88E lands just
   inside the west coast at about (33, 60) in that box. */
const INDIA =
  "M30 0C40 3 46 6 52 8C62 10 68 12 74 15C82 15 88 19 92 26" +
  "C88 30 82 31 76 30C72 33 71 39 70 45C75 52 78 60 76 68" +
  "C73 80 68 90 62 99C59 105 57 109 55 111C52 106 49 97 46 90" +
  "C41 79 37 68 34 58C30 52 26 49 21 47C14 46 8 43 6 38" +
  "C8 34 13 33 17 34C15 28 14 22 15 16C19 9 24 3 30 0Z";

/* the pin, in the globe's own coordinates - India's (33, 60) run through
   the same translate/scale the outline gets */
const PIN = { x: -4.3, y: 2 };

function Globe() {
  return (
    <svg
      className="foot__globe-svg"
      viewBox="-112 -112 224 224"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="foot-globe-clip">
          <circle cx="0" cy="0" r="100" />
        </clipPath>
      </defs>

      {/* the sphere */}
      <circle cx="0" cy="0" r="100" fill="rgba(241,236,225,.035)" />

      <g
        clipPath="url(#foot-globe-clip)"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.1"
      >
        {/* meridians - ellipses of falling width, which is what a set of
            evenly spaced great circles looks like from outside */}
        <ellipse cx="0" cy="0" rx="34" ry="100" />
        <ellipse cx="0" cy="0" rx="68" ry="100" />
        <line x1="0" y1="-100" x2="0" y2="100" />
        {/* parallels - flat lines, since the globe is drawn upright */}
        <line x1="-100" y1="0" x2="100" y2="0" strokeOpacity="0.3" />
        {[-64, -34, 34, 64].map((y) => (
          <line key={y} x1={-Math.sqrt(10000 - y * y)} y1={y} x2={Math.sqrt(10000 - y * y)} y2={y} />
        ))}
      </g>

      {/* the landmass, given a fill so it reads as ground rather than as
          one more line of the graticule */}
      <g clipPath="url(#foot-globe-clip)" transform="translate(-34 -52) scale(0.9)">
        <path d={INDIA} fill="rgba(241,236,225,.16)" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.7" strokeLinejoin="round" />
      </g>

      {/* and the rim, over the top of both, so the sphere has an edge */}
      <circle cx="0" cy="0" r="100" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.6" />

      {/* the pin. The ring behind it is animated outward on a loop by
          lib/motion.ts - a location marker that never does anything is
          indistinguishable from a full stop. */}
      <circle className="foot__ping" cx={PIN.x} cy={PIN.y} r="6" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      <circle cx={PIN.x} cy={PIN.y} r="4" fill="var(--accent)" />
      <circle cx={PIN.x} cy={PIN.y} r="10" fill="var(--accent)" opacity="0.16" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const SOCIAL = [
  {
    href: "https://www.instagram.com/thesocheers/",
    label: "SoCheers on Instagram",
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "https://in.linkedin.com/company/socheers",
    label: "SoCheers on LinkedIn",
    path: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    href: "https://www.youtube.com/@ThisIsSoCheers",
    label: "SoCheers on YouTube",
    path: (
      <>
        <path d="M22 8.5a3 3 0 0 0-2.1-2.1C18.1 6 12 6 12 6s-6.1 0-7.9.4A3 3 0 0 0 2 8.5 31 31 0 0 0 1.6 13a31 31 0 0 0 .4 4.5A3 3 0 0 0 4.1 19.6C5.9 20 12 20 12 20s6.1 0 7.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5z" />
        <path d="M10 10.2v5.6l5-2.8-5-2.8z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "https://www.facebook.com/TheSoCheers",
    label: "SoCheers on Facebook",
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5.5" />
        <path d="M14.4 8.4h-1.6a1.8 1.8 0 0 0-1.8 1.8V12h3.3l-.45 3h-2.85v6.9" />
      </>
    ),
  },
  {
    href: "https://x.com/TheSoCheers",
    label: "SoCheers on X",
    path: <path d="M4 4l16 16M20 4L4 20" />,
  },
];

export default function Footer() {
  return (
    <footer className="foot" data-foot>
      {/* The room's own light level. One layer of white over the site's
          black, faded by --lit, so the bulb dying and the room going out
          are the same number rather than two things kept in step. */}
      <span className="foot__day" aria-hidden="true" />
      <span className="foot__bloom" aria-hidden="true" />

      {/* --- the pendant ------------------------------------------------
          pivot = the ceiling rose, which is what the swing turns about
          cord  = scaled down from nothing as the bulb is lowered
          mark  = the bulb, and after the cord lets go, the logo */}
      <div className="foot__pivot" data-foot-pivot aria-hidden="true">
        <span className="foot__cord" data-foot-cord />
        <span className="foot__markpos">
          <span className="foot__mark" data-foot-mark>
            <Pendant />
          </span>
        </span>
      </div>

      {/* --- what arrives around it -------------------------------------
          The two addresses sit on the mark's shoulders, tipped a few
          degrees so they read as curved around it rather than parked
          beside it.

          "fade" rather than the default rise: that tilt is a CSS
          transform, and a rise would be a second author for the same
          property. */}
      <div className="foot__mail foot__mail--l" data-foot-part="fade">
        <a href="mailto:hello@socheers.net" data-magnetic data-cursor="Email">
          <span className="foot__mail-label">Bring us a brief</span>
          <span className="foot__mail-addr">hello@socheers.net</span>
        </a>
      </div>
      <div className="foot__mail foot__mail--r" data-foot-part="fade">
        <a href="mailto:careers@socheers.net" data-magnetic data-cursor="Email">
          <span className="foot__mail-label">Bring us your best work</span>
          <span className="foot__mail-addr">careers@socheers.net</span>
        </a>
      </div>

      {/* --- the ask -----------------------------------------------------
          What used to be the page's closing section, now the first thing
          under the bulb: the room is uncovered, the light dies, the mark
          turns over, and the question is already waiting there. */}
      <div className="foot__ask" data-foot-part>
        <h2 className="foot__ask-title">Brief us. Or&nbsp;just say hi.</h2>
        <ContactModal />
      </div>

      {/* --- the floor of the room -------------------------------------- */}
      <div className="foot__base">
        <div className="foot__where" data-foot-part>
          <span className="foot__globe">
            <Globe />
          </span>
          <span className="foot__place">
            <b>Mumbai, India</b>
            <i>19.0760° N · 72.8777° E</i>
          </span>
        </div>

        <div className="foot__sign" data-foot-part>
          <span className="foot__sign-name">SoCheers</span>
          <span className="foot__sign-line">Making more happen</span>
        </div>

        {/* The accounts came off the ring when the ask took the space
            under the mark - they close the floor row instead, which is
            where a footer's social row usually is anyway. */}
        <div className="foot__ends" data-foot-part>
          <nav className="foot__social" aria-label="SoCheers on social media">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                data-cursor="Follow"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {s.path}
                </svg>
              </a>
            ))}
          </nav>
          <span className="foot__ends-meta">
            <a href="#top" data-cursor="Top">Back to top</a>
            <i>Est. 2013</i>
          </span>
        </div>
      </div>

      <div className="foot__legal" data-foot-part>
        <span>© {new Date().getFullYear()} SoCheers Interactive Pvt. Ltd.</span>
        <span>An independent, integrated creative agency</span>
      </div>
    </footer>
  );
}
