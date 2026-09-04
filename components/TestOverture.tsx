"use client";

import { useEffect, useState } from "react";
import {
  OVERTURE_CUE,
  OVERTURE_DONE,
  OVERTURE_REPLAY,
  overtureCued,
} from "@/lib/overture";
import { initTestOverture } from "@/lib/test-overture-motion";
import { IMG, OVERTURE_WALLS, TEAM_SIZES, TEAM_SRCSET } from "@/lib/content";
import {
  BARS,
  BAR_STROKE,
  LAMP_VIEWBOX,
  LOGO_DISC,
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
   THE OVERTURE, TEST CUT  (/test only - the live one is
   components/Overture.tsx and nothing here touches it)

   Same room, same bulb, same falls. The ending is the difference: the
   last wall is blank plaster with a slide projector standing in front of
   it, the bulb comes back out of the corner and drops into the
   projector's socket, and the hero arrives as a projection - warm-up,
   flicker, grain, 3 · 2 · 1 - instead of as a wall that expands.

   Markup only. All of the motion is in lib/test-overture-motion.ts; the
   look is the OVERTURE block at the end of app/globals.css, plus the
   projector's own sheet in app/test/test.css.

   The whole thing renders on the server exactly as it does on the client,
   carrying `data-idle` - which globals.css reads as "display:none". That
   attribute is what stops the sequence flashing on screen for a frame
   before the effect below has mounted the engine: nothing is ever seen
   mid-build, the effect just takes the attribute off.
   ============================================================ */
/* Only the walls that fall. The one that stays standing is not a picture
   any more - it is blank plaster - so it is written out below rather than
   being the last entry of a list of photographs. */
const WALLS = OVERTURE_WALLS;


/* The width the phone's column starts at. Same number as the --lamp-w
   breakpoint below it in globals.css and as PHONE in lib/motion.ts - the
   room, the mark and the hero it hands to all have to change their minds
   about the screen on the same frame, or the hand-off lands on a picture
   that is fitted one way over a picture that is fitted the other. */
const PHONE = "(max-width:700px)";

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
   mass: the monoline ring becomes a tube of dark moulding, the base bars
   are the same moulding, and the disc - the printed one, wider than the
   ring and overhanging it at the top left the way the lockup draws it -
   becomes the light. Two shapes, which is how many the logo has. The parts that carry --lit are the only ones that change
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

        {/* The disc, cold. Warm rather than the blue-grey this was when it
            was painting a glass envelope: it is the brand's yellow with
            the light off, not a window. Lit from the upper left like
            everything else in the room, and darker at the rim than at the
            centre so it reads as a ball and not as a flat cut-out. */}
        <radialGradient id="ovt-disc-off" cx="0.36" cy="0.3" r="0.86">
          <stop offset="0" stopColor="#2e2a21" />
          <stop offset="0.55" stopColor="#191510" />
          <stop offset="1" stopColor="#0c0a07" />
        </radialGradient>

        {/* Hot: the brand disc, alight. Centred, and it never goes near
            white - an off-centre white core is a rendered incandescent
            filament, and what should be lighting up is the logo's yellow.
            The falloff is a shade of that yellow at either end, so the
            disc stays one flat brand colour with a warm rim. */}
        <radialGradient id="ovt-blob-on" cx="0.5" cy="0.5" r="0.76">
          <stop offset="0" stopColor="#ffd94a" />
          <stop offset="0.6" stopColor="#ffcb0c" />
          <stop offset="1" stopColor="#ffab14" />
        </radialGradient>
        {/* and the soft wash of it over its own face, under the hot core -
            a warm veil now rather than a highlight, for the same reason */}
        <radialGradient id="ovt-disc-wash" cx="0.5" cy="0.5" r="0.72">
          <stop offset="0" stopColor="#ffd76a" stopOpacity="0.3" />
          <stop offset="0.6" stopColor="#ffbe3c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff9b1a" stopOpacity="0.04" />
        </radialGradient>

        <filter id="ovt-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="ovt-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>

        {/* the disc is the envelope now, so nothing the light does is
            allowed out past its own edge */}
        <clipPath id="ovt-clip">
          <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} />
        </clipPath>
      </defs>

      {/* 1 · the disc, and it is the only mass in here.

             There used to be two: a circle of cold glass filling the ring
             exactly, and the brand's disc over the top of it. That was
             fine while the disc was tucked inside the glass and the two
             were near enough concentric - but the disc sits where the
             printed mark puts it now, wider than the ring and up and to
             the left of it, so the pair read as a full ball with a lump
             growing off one side. The logo has two shapes in it, the ring
             and the disc, and so does this: the envelope circle is gone,
             and what is inside the ring beyond the disc is the room, seen
             through glass with nothing behind it to show.

             It is LOGO_DISC, and it is not clipped to the ring: in the
             printed mark the disc breaks out past the ring at the top
             left and the ring's stroke crosses it. That overhang is the
             mark - a disc tucked tidily inside the ring is a different
             logo - and it is what makes this fixture and the flat lockup
             it docks into the same drawing. The ring is painted after
             this, which is the order the artwork has: the line work
             crosses the yellow, never the other way round. */}
      <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} fill="url(#ovt-disc-off)" />

      {/* 2 · and the same disc alight. Everything carrying --lit is
             centred on it rather than on the ring, so the light comes
             from where the logo says it comes from. */}
      <circle
        className="ovt__lit"
        cx={LOGO_DISC.cx}
        cy={LOGO_DISC.cy}
        r={LOGO_DISC.r + 14}
        fill="#ffcf82"
        filter="url(#ovt-softer)"
        opacity="0"
      />
      <circle
        className="ovt__lit"
        cx={LOGO_DISC.cx}
        cy={LOGO_DISC.cy}
        r={LOGO_DISC.r}
        fill="url(#ovt-blob-on)"
        filter="url(#ovt-soft)"
        opacity="0"
      />
      <g clipPath="url(#ovt-clip)">
        <circle
          className="ovt__lit"
          cx={LOGO_DISC.cx}
          cy={LOGO_DISC.cy}
          r={LOGO_DISC.r}
          fill="url(#ovt-disc-wash)"
          opacity="0"
        />
        {/* The two catchlights on its face, and they belong to the dark
            bulb only: on --cold, so they fade out exactly as the light
            comes up. Off, they are what stops the disc reading as a flat
            hole - glass with nothing behind it. Lit, they would be a
            specular pair over a light source, which is the intricate,
            rendered kind of mark this is not. */}
        <ellipse
          className="ovt__cold"
          style={{ "--cold-a": 0.4 } as React.CSSProperties}
          cx="129.4"
          cy="82.9"
          rx="5"
          ry="7.5"
          fill="#fff"
          transform="rotate(-24 129.4 82.9)"
        />
        <ellipse
          className="ovt__cold"
          style={{ "--cold-a": 0.06 } as React.CSSProperties}
          cx="215.3"
          cy="198.9"
          rx="16"
          ry="9"
          fill="#fff"
          transform="rotate(28 215.3 198.9)"
        />
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

export default function TestOverture() {
  /* Re-running initOverture is how the replay works: the docked mark fires
     OVERTURE_REPLAY, this bumps, the effect tears the old run down and
     builds a clean one. */
  const [run, setRun] = useState(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-overture]');
    if (!root) return;

    const replay = () => setRun((n) => n + 1);
    document.addEventListener(OVERTURE_REPLAY, replay);

    /* No "already seen" gate on this route. /test exists to be watched,
       and it is watched from the top every time it is loaded. */
    /* If the opening sequence cannot be built, the page must not be left
       standing behind it. It takes the screen by dispatching its own start
       event, and lib/motion.ts answers that by stopping the scroll and
       parking the page at the top - so a throw anywhere after that point
       and before the hand-off leaves a reader looking at a dark room they
       cannot leave, on a site that is otherwise fine. Put the curtain back
       up and say the sequence is over: the hero underneath is a complete
       page on its own, and losing the intro is not the same as losing the
       site. */
    let teardown = () => {};
    const build = () => {
      try {
        root.removeAttribute('data-idle');
        teardown = initTestOverture(root);
      } catch (err) {
        console.error('[socheers] overture failed to build', err);
        root.setAttribute('data-idle', '');
        document.dispatchEvent(new CustomEvent(OVERTURE_DONE));
        teardown = () => {};
      }
    };

    /* The first run does not start here, it starts when the loader says so
       (components/Loader.tsx): the count is the wall images being fetched,
       and building the room before they land is what used to make the
       first fall stutter. A replay has no such wait - the assets are in
       cache by definition, and the cue has long since fired. */
    if (run > 0 || overtureCued()) {
      build();
    } else {
      document.addEventListener(OVERTURE_CUE, build, { once: true });
    }

    return () => {
      document.removeEventListener(OVERTURE_REPLAY, replay);
      document.removeEventListener(OVERTURE_CUE, build);
      teardown();
    };
  }, [run]);

  return (
    /* Not aria-hidden as a whole: it covers the page while it runs, so the
       two things you can do to it - pull the rope, skip out - have to be
       real, labelled, focusable controls. Everything else in here is
       scenery and says so individually. */
    <div className="overture overture--test" data-overture data-idle>
      {/* --- the room ------------------------------------------------- */}
      <div className="ovt__stage" data-ovt-stage aria-hidden="true">
        <div className="ovt__dolly" data-ovt-dolly>
          {WALLS.map((w, i) => (
            <div className="ovt__wall" data-ovt-wall key={w.img + i}>
              <div
                className="ovt__slab"
                data-ovt-slab
                /* Only read inside the phone's media query in globals.css,
                   so a wall with no mpos - and every wall on a wide screen
                   - falls back to a plain centre crop. */
                style={w.mpos ? ({ "--mpos": w.mpos } as React.CSSProperties) : undefined}
              >
                {/* <picture>, not a src the engine swaps after the fact:
                    the browser has to choose before it fetches, or a phone
                    pays for the landscape original and then downloads the
                    portrait one on top of it. boot() in
                    lib/overture-motion.ts preloads off `currentSrc`, so it
                    follows whichever this resolves to without being told. */}
                {/* No src and no srcset in the markup. The room is in the
                    layout, so it is on every page, and on every page but
                    the first of a tab the sequence does not run at all -
                    but a src is a fetch whether the element is
                    display:none or not, and this room is 1.3MB of
                    pictures. boot() in lib/overture-motion.ts attaches
                    them, which is a place that is only ever reached on a
                    run that is actually going to be watched. Same
                    arrangement as the home page's reel and its
                    data-reel-film. */}
                <picture>
                  {/* encodeURI, and it is not optional: srcset is a
                      comma-separated list whose entries are "url
                      descriptor", so the first space in a path ends the
                      URL and what follows is read as a descriptor. Every
                      asset in this run lives under "SC Website Revamp",
                      which means an unencoded value here parses as the
                      candidate "/assets/SC" with a descriptor of
                      "Website" - unknown, so the whole candidate is
                      dropped and the phone silently falls back to the
                      landscape original this exists to replace. The img
                      has no such rule and is left alone. */}
                  {w.m && <source media={PHONE} data-ovt-src={encodeURI(w.m)} />}
                  <img className="ovt__face" data-ovt-src={w.img} alt="" />
                </picture>
                {/* the sliver of edge you see as the slab tips toward you -
                    a flat panel with no thickness reads as a projected
                    image, and this is the cheapest way to give it mass */}
                <span className="ovt__edge" />
                <span className="ovt__shade" />
                <span className="ovt__label">{w.label}</span>
              </div>
            </div>
          ))}

          {/* --- the wall that stays up, and what stands in front of it ---

              Blank plaster, and a projector on the floor pointed at it.
              No picture, no caption, no brand name: the only thing in the
              frame with any intent in it is a machine that is switched
              off, and that is meant to be read in the beat the camera
              holds before the bulb comes back.

              The slab is still a viewport-sized plane at the end of the
              stack, so the camera arriving still puts it at translateZ(0)
              with an identity transform - and .ovt__screen inside it is
              cut to exactly the rectangle the hero's own expanded photo
              lands on (containedBox in lib/motion.ts: the crowd shot's
              aspect, at 94% of the viewport). So the thing being
              projected and the thing underneath are the same rectangle in
              the same place, and the hand-off is still geometry. */}
          <div className="ovt__wall" data-ovt-wall>
            <div className="ovt__slab" data-ovt-slab data-final data-blank>
              <span className="ovt__plaster" aria-hidden="true" />

              {/* the lit rectangle - where the beam actually lands, and
                  therefore the only part of the wall that is a screen */}
              <span className="ovt__screen" data-ovt-screen aria-hidden="true">
                <span className="ovt__wash" data-ovt-wash />

                {/* The gate: what is *in* the projection, and the one
                    thing that shakes. It has to settle back to an
                    identity transform before the hand-off. */}
                <span className="ovt__gate" data-ovt-gate>
                  {/* The crowd, not the artwork. This is what the hero
                      used to travel to on the first scroll; the projector
                      shows it directly instead, so the wordmark-and-then-
                      it-expands beat is gone. Same file and same set the
                      hero itself draws (IMG.team / TEAM_SRCSET in
                      lib/content.ts), so it is already in cache and the
                      cross-fade at the end is one picture, not two. */}
                  <img
                    className="ovt__face"
                    data-ovt-src={IMG.team}
                    data-ovt-srcset={TEAM_SRCSET}
                    sizes={TEAM_SIZES}
                    alt=""
                  />
                  <span className="ovt__count" data-ovt-count>
                    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                      <circle cx="50" cy="50" r="46" />
                      <circle cx="50" cy="50" r="46" data-ovt-count-arc />
                      <path d="M50 4v92M4 50h92" />
                    </svg>
                    <i data-ovt-count-n />
                  </span>
                </span>

                <span className="ovt__grain" data-ovt-grain />
                {/* the soft edge of the gate - a projected rectangle does
                    not have a printed border, it has a falloff */}
                <span className="ovt__gate-edge" />
              </span>

              <span className="ovt__shade" />
            </div>

            {/* The machine, on the floor in front of the wall and off to
                one side of it, so it is not standing in the middle of its
                own picture. Inside the same wall element and pushed
                forward in Z, so it keeps its distance from the plaster on
                its own as the camera moves - an object in the room rather
                than an overlay drawn on top of it.

                Drawn as one SVG rather than as a stack of boxes: a
                projector is all curves and tapers - a barrel, a hood, two
                reels, a cast base - and none of those are a div. */}
            <div className="ovt__proj" data-ovt-proj aria-hidden="true">
              <svg
                className="ovt__proj-svg"
                viewBox="0 0 340 300"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
              >
                <defs>
                  {/* one light direction for the whole machine, from the
                      upper left, same as everything else in the room */}
                  <linearGradient id="tp-shell" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0" stopColor="#5b5a66" />
                    <stop offset="0.34" stopColor="#33323c" />
                    <stop offset="0.78" stopColor="#1a1a20" />
                    <stop offset="1" stopColor="#101015" />
                  </linearGradient>
                  <linearGradient id="tp-deck" x1="0" y1="0" x2="0.2" y2="1">
                    <stop offset="0" stopColor="#6d6c78" />
                    <stop offset="1" stopColor="#3a3944" />
                  </linearGradient>
                  <linearGradient id="tp-barrel" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#4a4954" />
                    <stop offset="0.45" stopColor="#26252d" />
                    <stop offset="1" stopColor="#14141a" />
                  </linearGradient>
                  <radialGradient id="tp-hot" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#fff6d8" />
                    <stop offset="0.45" stopColor="#ffcf4e" />
                    <stop offset="1" stopColor="#ff9d18" stopOpacity="0" />
                  </radialGradient>
                  <filter id="tp-soft" x="-70%" y="-70%" width="240%" height="240%">
                    <feGaussianBlur stdDeviation="9" />
                  </filter>
                </defs>

                {/* Depth order, back to front, and it is the only thing
                    in here saying which end of the machine is nearer the
                    wall: the spill first, then the lens (which points
                    away from us), then the reels standing in front of it,
                    then the housing, which covers the bottom of both. */}

                {/* the lamp getting out. Drawn behind everything so the
                    housing reads as a silhouette with a fire in it. */}
                <ellipse
                  className="ovt__proj-fire"
                  cx="252" cy="118" rx="76" ry="54"
                  fill="url(#tp-hot)" filter="url(#tp-soft)"
                />

                {/* The lens. It points away from us, so all there is of it
                    is the barrel coming out of the far side of the
                    housing and, once there is a bulb in the machine, the
                    ring of light on the front element. */}
                <g className="ovt__proj-lens">
                  <ellipse className="ovt__lens-glow" cx="284" cy="140" rx="28" ry="23" />
                  <path
                    className="ovt__lens-barrel"
                    d="M214 176l58-42c6-4 14-3 18 3l6 9c4 6 2 14-4 18l-58 42Z"
                  />
                  <ellipse
                    className="ovt__lens-face" data-ovt-lens
                    cx="284" cy="140" rx="15" ry="12"
                    transform="rotate(-36 284 140)"
                  />
                </g>

                {/* --- the reels, on their arms above the deck --- */}
                <g className="ovt__proj-arms">
                  <path d="M104 172V92M218 172v-68" />
                </g>
                <g className="ovt__reel" data-ovt-reel="104 92">
                  <circle className="ovt__reel-rim" cx="104" cy="92" r="52" />
                  <circle className="ovt__reel-film" cx="104" cy="92" r="40" />
                  <g className="ovt__reel-spokes">
                    <path d="M104 40v104M59 66l90 52M59 118l90-52" />
                  </g>
                  <circle className="ovt__reel-hub" cx="104" cy="92" r="9" />
                </g>
                <g className="ovt__reel" data-ovt-reel="218 104">
                  <circle className="ovt__reel-rim" cx="218" cy="104" r="40" />
                  <circle className="ovt__reel-film" cx="218" cy="104" r="29" />
                  <g className="ovt__reel-spokes">
                    <path d="M218 64v80M183.4 84l69.2 40M183.4 124l69.2-40" />
                  </g>
                  <circle className="ovt__reel-hub" cx="218" cy="104" r="7" />
                </g>

                {/* --- the housing: the deck receding away from us, and
                        the back of it, which is the face we are looking
                        at --- */}
                <path className="ovt__proj-deck" d="M70 168h200l22 20H48Z" />
                <path
                  className="ovt__proj-shell"
                  d="M48 188h244v54a14 14 0 0 1-14 14H62a14 14 0 0 1-14-14Z"
                />
                {/* the lamp-house cowl, standing on the deck over the
                    socket - the one part of the machine the bulb's light
                    has to get out of before it reaches the lens */}
                <path className="ovt__proj-cowl" d="M128 170l14-24h56l14 24Z" />

                {/* the vents, and the light that gets out of them */}
                <g className="ovt__proj-vents">
                  <path d="M74 208h82M74 220h82M74 232h82" />
                </g>
                {/* two controls, because a machine has controls */}
                <circle className="ovt__proj-knob" cx="240" cy="212" r="14" />
                <circle className="ovt__proj-knob" cx="240" cy="240" r="8" />

                {/* --- the socket, open in the mouth of the cowl, waiting.
                        Cold it is a hole with a rim, which is the one
                        detail that has to be legible in the hold before
                        anything happens: it is the question the bulb is
                        the answer to. --- */}
                <g className="ovt__proj-socket" data-ovt-socket>
                  <ellipse className="ovt__socket-well" cx="170" cy="150" rx="29" ry="11" />
                  <ellipse className="ovt__socket-fire" cx="170" cy="148" rx="21" ry="8" />
                  <ellipse className="ovt__socket-rim" cx="170" cy="150" rx="29" ry="11" />
                </g>

                {/* --- the base it stands on --- */}
                <path className="ovt__proj-foot" d="M92 256h30l7 22H85ZM218 256h30l7 22h-44Z" />
                <ellipse className="ovt__proj-base" cx="170" cy="280" rx="114" ry="12" />
              </svg>
              {/* the pool of light it throws on the floor around itself */}
              <span className="ovt__proj-pool" />
            </div>
          </div>
        </div>

        {/* the light in the air between the lens and the wall. A flat
            shape, but the engine measures the lens and the wall and cuts
            it to fit them, so it starts and ends where the beam does. */}
        <span className="ovt__beam" data-ovt-beam aria-hidden="true" />

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
