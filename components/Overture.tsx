"use client";

import { useEffect, useState } from "react";
import { OVERTURE_REPLAY, shouldRunOverture } from "@/lib/overture";
import { initOverture } from "@/lib/overture-motion";
import { OVERTURE_FINAL, OVERTURE_WALLS } from "@/lib/content";

/* ============================================================
   THE OVERTURE - markup only. All of the motion is in
   lib/overture-motion.ts; all of the look is in the OVERTURE block
   at the end of app/globals.css.

   The whole thing renders on the server exactly as it does on the client,
   carrying `data-idle` - which globals.css reads as "display:none". That
   attribute is the no-JS and reduced-motion escape hatch *and* it is what
   stops the sequence flashing on screen for a frame before the effect below
   has decided whether to run it: nothing is ever mounted mid-flight, the
   effect just takes the attribute off when the answer is yes.
   ============================================================ */

/* The room, in depth order. The last entry is the hero artwork itself and is
   marked as such - it is the one wall that stays standing, and the sequence
   ends by walking the camera into it until it is pixel-for-pixel the real
   hero underneath (see finale() in lib/overture-motion.ts). */
const WALLS = [
  ...OVERTURE_WALLS.map((w) => ({ ...w, final: false })),
  { img: OVERTURE_FINAL, label: "SoCheers", final: true },
];

/* ------------------------------------------------------------------
   The filament.

   A coil is the one part of a bulb you cannot fake with a smooth curve -
   it is what the eye uses to decide whether it is looking at a light bulb
   or at a drawing of one. So it is wound properly: a spine that sags under
   its own weight between the two support wires, with the winding laid
   *across* the spine's own tangent rather than across x, which is what
   keeps the turns square to the wire as it curves instead of splaying out
   at the ends. Generated rather than drawn so the turn count is a number
   we can tune, and deterministic so it renders identically on the server. */
function coilPath(turns = 21) {
  const X0 = 86;
  const SPAN = 48;   // left support to right support
  const Y0 = 140;
  const SAG = 40;
  const A = 5.2;     // radius of the winding
  const pts: string[] = [];
  const n = turns * 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = X0 + SPAN * t;
    const y = Y0 + SAG * Math.sin(Math.PI * t);
    // the spine's tangent, so the winding stays perpendicular to the wire
    const dx = SPAN;
    const dy = SAG * Math.PI * Math.cos(Math.PI * t);
    const len = Math.hypot(dx, dy) || 1;
    const s = (i % 2 ? 1 : -1) * A;
    pts.push(`${(x - (dy / len) * s).toFixed(2)} ${(y + (dx / len) * s).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
}

const COIL = coilPath();

/* The envelope. A19 proportions - widest a little above the middle, the
   shoulder tucking back into a narrow neck - because a circle on a stick
   reads as a cartoon and this has to read as an object. */
const GLASS =
  "M86 50C86 84 34 96 34 152C34 200 68 240 110 240C152 240 186 200 186 152C186 96 134 84 134 50Z";

function Lamp() {
  return (
    <svg
      className="ovt__svg"
      viewBox="0 0 220 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* The cap is a cylinder, so its shading runs across it, not down:
            dark at both edges where it turns away, with a narrow hot band
            just off-centre where the light catches the metal. */}
        <linearGradient id="ovt-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b1b1e" />
          <stop offset="0.16" stopColor="#4a4741" />
          <stop offset="0.36" stopColor="#a9a294" />
          <stop offset="0.5" stopColor="#7d776c" />
          <stop offset="0.74" stopColor="#3e3c39" />
          <stop offset="1" stopColor="#141416" />
        </linearGradient>
        <linearGradient id="ovt-cord" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0e0e10" />
          <stop offset="0.42" stopColor="#4b4740" />
          <stop offset="1" stopColor="#0b0b0c" />
        </linearGradient>

        {/* Cold glass: almost nothing but the room reflected in it. The
            centre is darker than the rim - you are looking through it into
            an unlit envelope, so the edges (where the glass is thickest and
            catches grazing light) are the brightest part of it. */}
        <radialGradient id="ovt-glass-off" cx="0.38" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#2a2c33" />
          <stop offset="0.55" stopColor="#141519" />
          <stop offset="1" stopColor="#0a0b0e" />
        </radialGradient>

        {/* Hot glass: the filament's light caught in the envelope. Centred
            on the coil, not on the bulb, which is what makes the glow read
            as coming from inside a specific point rather than as a fill. */}
        <radialGradient id="ovt-glass-on" cx="0.5" cy="0.53" r="0.62">
          <stop offset="0" stopColor="#fff4d2" stopOpacity="0.95" />
          <stop offset="0.32" stopColor="#ffce7d" stopOpacity="0.6" />
          <stop offset="0.7" stopColor="#ff9b36" stopOpacity="0.24" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0.06" />
        </radialGradient>

        {/* The rim: light grazing along the curve of the glass, brightest
            where the surface turns hardest away from you. */}
        <linearGradient id="ovt-rim" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.24" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.78" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
        </linearGradient>

        <linearGradient id="ovt-spec" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="ovt-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="ovt-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="11" />
        </filter>

        <clipPath id="ovt-clip">
          <path d={GLASS} />
        </clipPath>
      </defs>

      {/* 1 · flex, cap, collar. Drawn before the glass so the neck of the
             envelope overlaps the collar rather than butting up to it. */}
      <rect x="107" y="-2" width="6" height="10" fill="url(#ovt-cord)" />
      <path
        d="M92 4h36l-3 12H95Z"
        fill="url(#ovt-cap)"
        stroke="#000"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <rect x="84" y="15" width="52" height="34" rx="3" fill="url(#ovt-cap)" />
      {/* threads: the give-away that it is a screw base and not a tube */}
      <g stroke="#000" strokeOpacity="0.42" strokeWidth="1.6" fill="none">
        <path d="M84 21h52M84 28h52M84 35h52M84 42h52" />
      </g>
      <g stroke="#fff" strokeOpacity="0.13" strokeWidth="1" fill="none">
        <path d="M84 19.5h52M84 26.5h52M84 33.5h52M84 40.5h52" />
      </g>
      {/* the ceramic collar the glass is seated into */}
      <rect x="82" y="46" width="56" height="10" rx="4" fill="#26241f" />
      <rect x="82" y="46" width="56" height="4" rx="2" fill="#3b3830" />

      {/* 2 · the envelope, cold */}
      <path d={GLASS} fill="url(#ovt-glass-off)" />

      {/* 3 · the works inside it. Clipped to the glass so nothing a
             filament does can ever poke out through the envelope. */}
      <g clipPath="url(#ovt-clip)">
        {/* stem and press */}
        <path d="M104 44h12v58l-6 8-6-8Z" fill="#1c1d21" opacity="0.9" />
        <path d="M107 44h6v56h-6Z" fill="#33353c" opacity="0.55" />
        {/* support wires out to the coil */}
        <path
          d="M110 100 86 140M110 100l24 40"
          stroke="#5a5c63"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* the coil, three times over: a wide bloom, a tight bloom and the
            wire itself. Only the first two carry --lit, so cold it is just
            grey tungsten and hot it is a light source with a halo. */}
        <path
          className="ovt__lit"
          d={COIL}
          stroke="#ffcf82"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          filter="url(#ovt-softer)"
          opacity="0"
        />
        <path
          className="ovt__lit"
          d={COIL}
          stroke="#fff1c9"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          filter="url(#ovt-soft)"
          opacity="0"
        />
        <path
          className="ovt__wire"
          d={COIL}
          stroke="#6c6e75"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* the light the coil throws against the inside of the envelope */}
        <path className="ovt__lit" d={GLASS} fill="url(#ovt-glass-on)" opacity="0" />
      </g>

      {/* 4 · the glass surface itself, over the works: rim, specular,
             and the small hard catchlight that sells it as glass rather
             than as a translucent shape. */}
      <path d={GLASS} fill="none" stroke="url(#ovt-rim)" strokeWidth="2.4" />
      <ellipse
        cx="66"
        cy="132"
        rx="11"
        ry="30"
        fill="url(#ovt-spec)"
        transform="rotate(-20 66 132)"
      />
      <ellipse cx="72" cy="106" rx="4.6" ry="7" fill="#fff" opacity="0.5" transform="rotate(-24 72 106)" />
      <ellipse cx="146" cy="186" rx="14" ry="8" fill="#fff" opacity="0.06" transform="rotate(28 146 186)" />
    </svg>
  );
}

/* The switch. A plate on a wall you cannot see yet, which is the whole
   reason it carries its own faint light: in a pitch-black room it is the
   only thing telling you the sequence is waiting on you. */
function Switch() {
  return (
    <svg viewBox="0 0 96 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ovt-plate" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#2a2b2f" />
          <stop offset="0.5" stopColor="#1b1c1f" />
          <stop offset="1" stopColor="#101113" />
        </linearGradient>
        <linearGradient id="ovt-rocker" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c3d42" />
          <stop offset="0.46" stopColor="#26272b" />
          <stop offset="1" stopColor="#17181a" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="94" height="138" rx="9" fill="url(#ovt-plate)" />
      <rect x="1.5" y="1.5" width="93" height="137" rx="8.5" fill="none" stroke="#fff" strokeOpacity="0.09" />
      <circle cx="48" cy="12" r="2" fill="#000" opacity="0.5" />
      <circle cx="48" cy="128" r="2" fill="#000" opacity="0.5" />
      {/* the well the rocker sits in */}
      <rect x="24" y="26" width="48" height="88" rx="6" fill="#0a0a0b" />
      <g data-rocker style={{ transformOrigin: "48px 70px" }}>
        <rect x="26" y="28" width="44" height="84" rx="5" fill="url(#ovt-rocker)" />
        <rect x="26.5" y="28.5" width="43" height="83" rx="4.5" fill="none" stroke="#fff" strokeOpacity="0.12" />
        <path d="M40 62h16" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* the pilot: the one lit thing in the room until you press it */}
      <circle className="ovt__pilot" cx="48" cy="120" r="3" />
    </svg>
  );
}

export default function Overture() {
  /* Re-running initOverture is how the replay works: the docked bulb fires
     OVERTURE_REPLAY, this bumps, the effect tears the old run down and
     builds a clean one. */
  const [run, setRun] = useState(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-overture]");
    if (!root) return;

    const replay = () => setRun((n) => n + 1);
    document.addEventListener(OVERTURE_REPLAY, replay);

    /* First mount only: reduced motion, or a tab that has already seen it,
       and the whole thing stays behind data-idle and never costs anything. */
    if (run === 0 && !shouldRunOverture()) {
      return () => document.removeEventListener(OVERTURE_REPLAY, replay);
    }

    root.removeAttribute("data-idle");
    const teardown = initOverture(root);

    return () => {
      document.removeEventListener(OVERTURE_REPLAY, replay);
      teardown();
    };
  }, [run]);

  return (
    /* Not aria-hidden as a whole: it covers the page while it runs, so the
       two things you can do to it - flip the switch, skip out - have to be
       real, labelled, focusable controls. Everything else in here is
       scenery and says so individually. */
    <div className="overture" data-overture data-idle>
      {/* --- the room ------------------------------------------------- */}
      <div className="ovt__stage" data-ovt-stage aria-hidden="true">
        <div className="ovt__dolly" data-ovt-dolly>
          {WALLS.map((w, i) => (
            <div className="ovt__wall" data-ovt-wall key={w.img + i}>
              <div className="ovt__slab" data-ovt-slab data-final={w.final || undefined}>
                <img className="ovt__face" src={w.img} alt="" />
                {/* the sliver of edge you see as the slab tips toward you -
                    a flat panel with no thickness reads as a projected
                    image, and this is the cheapest way to give it mass */}
                <span className="ovt__edge" />
                <span className="ovt__shade" />
                <span className="ovt__label">{w.label}</span>
              </div>
            </div>
          ))}
        </div>
        <span className="ovt__dust" data-ovt-dust />
      </div>

      <span className="ovt__vignette" data-ovt-vignette aria-hidden="true" />
      <span className="ovt__flash" data-ovt-flash aria-hidden="true" />

      {/* --- the bulb -------------------------------------------------- */}
      {/* three nested wrappers, one transform each: the rig is where it
          hangs (and where it docks at the end), the sway is the pendulum,
          the lamp is the turn it does toward your cursor. Stacking them
          means none of the three ever has to know about the other two. */}
      <div className="ovt__rig" data-ovt-rig>
        <div className="ovt__sway" data-ovt-sway>
          <i className="ovt__cord" data-ovt-cord aria-hidden="true" />
          {/* Out of the tab order while it is a lamp - the switch below is
              the labelled control for the same action, and two stops for
              one thing is worse than one. The engine puts it back in, with
              a new label, once it has docked and become the replay. */}
          <button
            type="button"
            className="ovt__lamp"
            data-ovt-lamp
            tabIndex={-1}
            data-cursor="Light it"
            aria-label="Turn the light on"
          >
            <Lamp />
            <span className="ovt__bloom" aria-hidden="true" />
          </button>
          <span className="ovt__glow" aria-hidden="true" />
        </div>
      </div>

      {/* --- the switch ------------------------------------------------ */}
      <button
        type="button"
        className="ovt__switch"
        data-ovt-switch
        data-cursor="Flip it"
        aria-label="Turn the light on"
      >
        <Switch />
        <span className="ovt__hint" data-ovt-hint>Turn it on</span>
      </button>

      {/* --- the loading screen ---------------------------------------- */}
      {/* Deliberately the same design as the site's own loader in
          components/Chrome.tsx: this one replaces it while the overture is
          running (lib/motion.ts hides that one), and the two have to be
          indistinguishable or the swap would show. */}
      <div className="loader ovt__loader" data-ovt-loader>
        <div className="loader__inner" data-ovt-loader-inner>
          <div className="loader__word">SO<i>CHEERS</i></div>
          <div className="loader__count">
            <span data-ovt-count>0</span>
            <i>%</i>
          </div>
          <div className="loader__tag">MAKING MORE HAPPEN</div>
        </div>
      </div>

      <button type="button" className="ovt__skip" data-ovt-skip data-cursor="Skip">
        Skip intro
      </button>
    </div>
  );
}
