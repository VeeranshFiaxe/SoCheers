"use client";

import { useEffect, useState } from "react";
import { OVERTURE_REPLAY, shouldRunOverture } from "@/lib/overture";
import { initOverture } from "@/lib/overture-motion";
import { OVERTURE_FINAL, OVERTURE_WALLS } from "@/lib/content";
import {
  BARS,
  BAR_STROKE,
  LAMP_VIEWBOX,
  MARK,
  RING,
  ringArc,
  ropePath,
  WORD,
  WORD_BLOB,
  WORD_O,
  WORD_STROKE,
} from "@/lib/logo-paths";
import SoCheersLockup from "./SoCheersLockup";

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
   The lamp.

   Not a light bulb - *the* light bulb. SoCheers' mark is already one,
   with the brand's disc sitting inside the O, so the sequence puts the
   logo in the middle of a dark room and lights that.

   It stands upright and it stays put. The mark's base is at the bottom,
   the way a bulb standing on a table would be, so hanging it from a flex
   would be the logo upside down - the pull cord hangs from the ceiling
   beside it instead.

   Everything below is the flat geometry from lib/logo-paths.ts given
   mass: the monoline ring becomes glass with a tube of dark moulding
   round it, the base bars are the same moulding, and the disc becomes
   the light. The parts that carry --lit are the only ones that change
   between cold and hot, which is what lets the ignition stutter be a
   single custom property being set eight times. */
const RING_INNER = ringArc(MARK.r - 6);
const RING_OUTER = ringArc(MARK.r + 6);

function Lamp() {
  return (
    <svg
      className="ovt__svg"
      viewBox={LAMP_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* The dark moulding of the mark, as a tube: lit from the upper
            left like everything else in the room, with a dark core.

            userSpaceOnUse, not the default: the three base bars are
            horizontal strokes, so their bounding boxes have zero height,
            and an objectBoundingBox gradient on a zero-height box is not
            rendered at all - the bars would simply vanish. Running it in
            the mark's own coordinates also means one light direction
            across the ring and the base rather than one per shape. */}
        <linearGradient
          id="ovt-shell"
          gradientUnits="userSpaceOnUse"
          x1="104" y1="80" x2="296" y2="330"
        >
          <stop offset="0" stopColor="#4a4a54" />
          <stop offset="0.3" stopColor="#26262c" />
          <stop offset="0.68" stopColor="#141419" />
          <stop offset="1" stopColor="#2c2c34" />
        </linearGradient>

        {/* Cold glass: almost nothing but the room reflected in it. The
            centre is darker than the rim - you are looking through it into
            an unlit envelope. */}
        <radialGradient id="ovt-glass-off" cx="0.36" cy="0.3" r="0.86">
          <stop offset="0" stopColor="#2b2d34" />
          <stop offset="0.55" stopColor="#141519" />
          <stop offset="1" stopColor="#0a0b0e" />
        </radialGradient>

        {/* Hot: the brand disc, incandescent. Centred on the disc rather
            than on the bulb, which is what makes the light read as coming
            from a specific thing inside the glass and not as a fill. */}
        <radialGradient id="ovt-blob-on" cx="0.42" cy="0.36" r="0.78">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="0.28" stopColor="#ffe9a0" />
          <stop offset="0.62" stopColor="#ffcb0c" />
          <stop offset="1" stopColor="#ff9b1a" />
        </radialGradient>
        {/* and what that disc throws against the inside of the envelope */}
        <radialGradient id="ovt-glass-on" cx="0.46" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff4d2" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffce7d" stopOpacity="0.5" />
          <stop offset="0.78" stopColor="#ff9b36" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0.05" />
        </radialGradient>

        <filter id="ovt-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="ovt-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>

        {/* nothing the light does is allowed out through the glass */}
        <clipPath id="ovt-clip">
          <circle cx={MARK.cx} cy={MARK.cy} r={MARK.glass} />
        </clipPath>
      </defs>

      {/* 1 · the envelope, cold */}
      <circle cx={MARK.cx} cy={MARK.cy} r={MARK.glass} fill="url(#ovt-glass-off)" />

      {/* 2 · the disc inside it - the logo's own crescent, and the light
             source. Cold it is a warm-grey shape you can only just find;
             hot it is the whole reason the room is visible. */}
      <g clipPath="url(#ovt-clip)">
        <circle cx={MARK.blob.cx} cy={MARK.blob.cy} r={MARK.blob.r} fill="#26221a" />
        <circle
          className="ovt__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r + 14}
          fill="#ffcf82"
          filter="url(#ovt-softer)"
          opacity="0"
        />
        <circle
          className="ovt__lit"
          cx={MARK.blob.cx}
          cy={MARK.blob.cy}
          r={MARK.blob.r}
          fill="url(#ovt-blob-on)"
          filter="url(#ovt-soft)"
          opacity="0"
        />
        <circle
          className="ovt__lit"
          cx={MARK.cx}
          cy={MARK.cy}
          r={MARK.glass}
          fill="url(#ovt-glass-on)"
          opacity="0"
        />
        {/* the glass surface, over everything inside it */}
        <ellipse cx="160" cy="112" rx="5" ry="7.5" fill="#fff" opacity="0.4" transform="rotate(-24 160 112)" />
        <ellipse cx="240" cy="220" rx="16" ry="9" fill="#fff" opacity="0.06" transform="rotate(28 240 220)" />
      </g>

      {/* 3 · the mark itself - the ring and the three bars of the base, in
             one material, because in the logo they are one drawn object.
             Shadow, tube, highlight: three passes at three radii, which is
             the cheapest honest way to give a monoline stroke a
             cross-section. */}
      <g fill="none" strokeLinecap="round">
        <path d={RING} stroke="#000" strokeOpacity="0.5" strokeWidth={MARK.stroke + 3} />
        {BARS.map((d) => (
          <path key={`s${d}`} d={d} stroke="#000" strokeOpacity="0.5" strokeWidth={BAR_STROKE + 3} />
        ))}

        <path d={RING} stroke="url(#ovt-shell)" strokeWidth={MARK.stroke} />
        {BARS.map((d) => (
          <path key={`b${d}`} d={d} stroke="url(#ovt-shell)" strokeWidth={BAR_STROKE} />
        ))}

        <path d={RING_INNER} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" />
        <path d={RING_OUTER} stroke="#000" strokeOpacity="0.35" strokeWidth="2.2" />
        {BARS.map((d) => (
          <path
            key={`h${d}`}
            d={d}
            stroke="#fff"
            strokeOpacity="0.13"
            strokeWidth="1.8"
            transform="translate(0 -5)"
          />
        ))}

        {/* and the warm edge the disc throws onto the inside of the ring
            once it is alight */}
        <path
          className="ovt__lit"
          d={RING_INNER}
          stroke="#ffd79a"
          strokeOpacity="0.45"
          strokeWidth="3"
          opacity="0"
        />
      </g>

      {/* 4 · the wordmark, twice over, the second copy on --lit: charcoal
             in a dark room, cream once the bulb catches, and nothing in
             between to tween. The name arrives on the same frame as the
             light. */}
      <circle cx={WORD_BLOB.cx} cy={WORD_BLOB.cy} r={WORD_BLOB.r} fill="#26221a" />
      <circle
        className="ovt__lit"
        cx={WORD_BLOB.cx}
        cy={WORD_BLOB.cy}
        r={WORD_BLOB.r}
        fill="#ffcb0c"
        opacity="0"
      />
      <g
        fill="none"
        stroke="#26262b"
        strokeWidth={WORD_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={WORD_O.cx} cy={WORD_O.cy} r={WORD_O.r} />
        {WORD.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g
        className="ovt__lit"
        fill="none"
        stroke="#f6efe0"
        strokeWidth={WORD_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0"
      >
        <circle cx={WORD_O.cx} cy={WORD_O.cy} r={WORD_O.r} />
        {WORD.map((d) => (
          <path key={`l${d}`} d={d} />
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------
   The pull rope.

   The only control in the room: a cord down from the ceiling, off to one
   side of the mark, ending in a turned wooden knob. It is dragged rather
   than clicked - the engine springs it back on release and fires the
   light the instant it is pulled past the click point, which is what a
   real chain switch does.

   This SVG is measured in screen pixels: initOverture gives it a viewBox
   matching its own client box, so the path below is regenerated against
   whatever height the CSS has given it. The values written out here are
   the rest pose at the server-rendered default, which is only ever seen
   for the frame before the engine measures. */
const ROPE_BOX = { w: 220, h: 460 };
const ROPE_REST = ropePath(0, 0, ROPE_BOX.h - 52, ROPE_BOX.w);

function Rope() {
  return (
    <svg
      className="ovt__rope-svg"
      data-ovt-rope-svg
      viewBox={`0 0 ${ROPE_BOX.w} ${ROPE_BOX.h}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ovt-knob" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2f2416" />
          <stop offset="0.3" stopColor="#8a6a3c" />
          <stop offset="0.52" stopColor="#c49a5c" />
          <stop offset="0.78" stopColor="#5a462a" />
          <stop offset="1" stopColor="#241b10" />
        </linearGradient>
      </defs>

      {/* a hand-sized target along the whole length of it */}
      <path
        data-ovt-rope-hit
        d={ROPE_REST}
        fill="none"
        stroke="transparent"
        strokeWidth="44"
        strokeLinecap="round"
        pointerEvents="stroke"
      />
      {/* The cord: a dark bed, the cord itself, and the twist laid over
          the top. Three flat strokes rather than a gradient, because at
          rest this path is perfectly vertical and a bounding-box gradient
          on a zero-width box is not rendered - and rather than a texture,
          because at this width a real braid is just noise. The beat of
          the dashes going down it is what tells rope from wire. */}
      <path data-ovt-rope-bed className="ovt__rope-bed" d={ROPE_REST} fill="none" />
      <path data-ovt-rope className="ovt__rope" d={ROPE_REST} fill="none" />
      <path data-ovt-rope-twist className="ovt__rope-twist" d={ROPE_REST} fill="none" />

      <g data-ovt-bead className="ovt__bead" pointerEvents="all">
        <circle cx="0" cy="-9" r="4.6" fill="none" stroke="#8a795d" strokeWidth="2.4" />
        <path
          d="M-9.5 -1c0-5.4 4.2-8.6 9.5-8.6s9.5 3.2 9.5 8.6c0 12-4.2 21.5-9.5 21.5S-9.5 11-9.5 -1Z"
          fill="url(#ovt-knob)"
          stroke="#000"
          strokeOpacity="0.45"
        />
        <ellipse cx="-3.2" cy="4" rx="2.4" ry="7.5" fill="#fff" opacity="0.15" />
        {/* the tuft on the end, so it is a rope and not a plumb line */}
        <path
          d="M-4 20l-2 9M0 20.5v9.5M4 20l2 9"
          stroke="#7b6a4e"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default function Overture() {
  /* Re-running initOverture is how the replay works: the docked mark fires
     OVERTURE_REPLAY, this bumps, the effect tears the old run down and
     builds a clean one. */
  const [run, setRun] = useState(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-overture]");
    if (!root) return;

    const replay = () => setRun((n) => n + 1);
    document.addEventListener(OVERTURE_REPLAY, replay);

    /* First mount only: reduced motion, or a tab that has already seen the
       show. Either way the mark still has to end up docked in the corner -
       it is the site's logo now, not just a one-time flourish - so this
       is not a reason to skip the engine entirely, only a reason to ask it
       to jump straight to the end state with nothing animated. */
    const instant = run === 0 && !shouldRunOverture();

    root.removeAttribute("data-idle");
    const teardown = initOverture(root, { instant });

    return () => {
      document.removeEventListener(OVERTURE_REPLAY, replay);
      teardown();
    };
  }, [run]);

  return (
    /* Not aria-hidden as a whole: it covers the page while it runs, so the
       two things you can do to it - pull the rope, skip out - have to be
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

      {/* --- the logo, standing in the middle of the room -------------- */}
      {/* rig  = the whole fixture, and at the end where it docks
          sway = the small settle it does when the rope is pulled
          lamp = the few degrees it turns toward your cursor
          One transform each, so none of the three ever has to know about
          the other two. */}
      <div className="ovt__rig" data-ovt-rig>
        <div className="ovt__sway" data-ovt-sway>
          {/* Out of the tab order while it is a lamp - the rope is the
              labelled control for the same action, and two stops for one
              thing is worse than one. The engine puts it back in, with a
              new label, once it has docked and become the replay. */}
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

          {/* Where the mark ends up. It stops flickering, and in the same
              breath the 3D fixture crosses over into this - the same
              lockup the loading beat would have shown, at the size and
              in the corner a logo actually lives (see dock() in
              lib/overture-motion.ts). Sits over the lamp and starts
              invisible; the two never have to be seen at once. */}
          <span className="ovt__dock" data-ovt-dock aria-hidden="true">
            <SoCheersLockup className="ovt__dock-mark" />
          </span>
        </div>
      </div>

      {/* --- the rope ----------------------------------------------------- */}
      <button
        type="button"
        className="ovt__pull"
        data-ovt-pull
        data-cursor="Pull"
        aria-label="Pull the rope to turn the light on"
      >
        <Rope />
      </button>

      {/* the nudge, if you leave it hanging there long enough */}
      <span className="ovt__guide" data-ovt-guide aria-hidden="true">
        <i />
        Pull the rope
      </span>

      <button type="button" className="ovt__skip" data-ovt-skip data-cursor="Skip">
        Skip intro
      </button>
    </div>
  );
}
