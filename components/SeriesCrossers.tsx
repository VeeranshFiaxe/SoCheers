import { CROSSERS, type Pose } from "@/lib/series-content";

/* ============================================================
   THE CROSSERS - the figures that stand between two beats.

   Server component, no state, no measurement. It draws the layer and
   places nothing: crossers() in lib/series-motion.ts finds the seam each
   figure belongs to and writes its `top`, because the beats are sized in
   svh and a seam is only where a viewport says it is.

   ---- why this is a sibling of the beats and not a child of one ----

   `.sbeat` clips its own overflow. It has to: fourteen full-screen
   compositions that can bleed into each other is a page where nothing
   has an edge. The cost of that clip is that no picture on this page can
   ever be in two sections at once, which is exactly why the beats read
   as a stack of separate screens.

   So the figures live outside the beats entirely, in one layer over the
   whole story, and each one is hung on a seam. Half of it stands in the
   section above and half in the section below - one element with a foot
   in two beats, which is the join the rest of the page cannot make.

   ---- the drawing ----

   These are placeholders for cut-out subjects the client is sending, and
   they are drawn as silhouettes rather than as anything trying to look
   photographic: a flat figure in the page's own black with a hairline of
   accent down one edge, the way a body reads when it is standing between
   you and a lit screen.

   The figures are built out of thick round-capped strokes rather than
   traced outlines. That is not a shortcut - a hand-drawn outline of a
   person at this size lands in the valley between "graphic" and
   "photograph" and looks like neither. A stroked armature is legibly a
   diagram of a person, which is what a placeholder should be.

   Swapping one for the real thing is one line in SeriesCrossers: give
   the crosser a `src` and render an <img> where <Figure> is. Nothing
   about the layer, the seam maths or the parallax changes.
   ============================================================ */

/* every limb in every pose, so a figure cannot drift in weight from one
   pose to the next */
const LIMB = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* The standing figure, as a group so the pair can use it twice. Drawn on
   a 120 x 300 field with the feet at 266 - every pose below shares that
   field, so two figures on one seam stand on the same floor. */
function Stand() {
  return (
    <g>
      <circle cx="60" cy="32" r="20" fill="currentColor" />
      <g {...LIMB}>
        {/* the neck. Without it the head sits straight on the shoulder
            capsule and the figure reads as hooded rather than as a
            person - which is the difference between a silhouette and a
            shape somebody will ask you about. */}
        <path d="M60 46V66" strokeWidth="15" />
        <path d="M39 74H81" strokeWidth="22" />
        <path d="M60 80V146" strokeWidth="40" />
        <path d="M52 146H68" strokeWidth="30" />
        <path d="M40 84 32 124 34 152" strokeWidth="14" />
        <path d="M80 84 88 124 86 152" strokeWidth="14" />
        <path d="M52 152 48 208 47 262" strokeWidth="21" />
        <path d="M70 152 74 208 75 262" strokeWidth="21" />
        <path d="M47 266H62" strokeWidth="11" />
        <path d="M75 266H90" strokeWidth="11" />
      </g>
    </g>
  );
}

/* Head down over a phone. The screen is the one part of any figure here
   that is not the silhouette's colour - it is the light the body is a
   silhouette against, and it is the whole reason the page has a beat
   about what happened behind the screen. */
function Phone() {
  return (
    <g>
      <circle cx="54" cy="36" r="19" fill="currentColor" />
      <g {...LIMB}>
        {/* the neck runs forward rather than straight up: the head is
            down over the screen, and that tilt is the whole pose */}
        <path d="M58 50 55 68" strokeWidth="14" />
        <path d="M41 76H83" strokeWidth="22" />
        <path d="M62 82V148" strokeWidth="40" />
        <path d="M54 148H70" strokeWidth="30" />
        <path d="M42 86 36 118 56 128" strokeWidth="13" />
        <path d="M82 86 88 118 70 130" strokeWidth="13" />
        <path d="M54 154 50 208 49 262" strokeWidth="21" />
        <path d="M72 154 76 208 77 262" strokeWidth="21" />
        <path d="M49 266H64" strokeWidth="11" />
        <path d="M77 266H92" strokeWidth="11" />
      </g>
      <rect
        className="s-cross__lit"
        x="55"
        y="108"
        width="17"
        height="27"
        rx="2"
        transform="rotate(-14 63 121)"
      />
    </g>
  );
}

/* Seated, in profile, on nothing - the chair is deliberately not drawn.
   A silhouette on a drawn sofa is a piece of furniture illustration; a
   silhouette sitting in mid-air on a page about watching things reads as
   a person on a couch the reader supplies themselves. */
function Sit() {
  return (
    <g>
      <circle cx="60" cy="50" r="21" fill="currentColor" />
      <g {...LIMB}>
        <path d="M62 66 66 84" strokeWidth="15" />
        <path d="M64 90 74 152" strokeWidth="44" />
        {/* the far leg first, so the near one closes over it and the two
            read as two rather than as one wide one */}
        <path d="M74 166 130 176" strokeWidth="26" />
        <path d="M130 176 134 238" strokeWidth="18" />
        <path d="M76 154 142 160" strokeWidth="32" />
        <path d="M142 160 148 234" strokeWidth="23" />
        <path d="M134 242H162" strokeWidth="12" />
        <path d="M148 240H178" strokeWidth="12" />
        {/* the arm rests along the thigh */}
        <path d="M52 100 48 140 96 152" strokeWidth="14" />
      </g>
    </g>
  );
}

/* Two, one behind and slightly smaller. The offset is horizontal and
   vertical both: two figures on one baseline is a logo, two on different
   ones is two people standing at different distances. */
function Pair() {
  return (
    <g>
      <g transform="translate(74 22) scale(.86)" opacity=".72">
        <Stand />
      </g>
      <Stand />
    </g>
  );
}

/* The field each pose is drawn on. Only the width changes - the floor is
   at 266 in all of them. */
const FIELD: Record<Pose, string> = {
  stand: "0 0 120 300",
  phone: "0 0 120 300",
  sit: "0 0 200 300",
  pair: "0 0 200 300",
};

const POSE = { stand: Stand, phone: Phone, sit: Sit, pair: Pair } as const;

function Figure({ pose }: { pose: Pose }) {
  const Shape = POSE[pose];
  return (
    <svg className="s-cross__svg" viewBox={FIELD[pose]} aria-hidden="true">
      <Shape />
    </svg>
  );
}

export default function SeriesCrossers() {
  return (
    <div className="s-cross" aria-hidden="true">
      {CROSSERS.map((c) => (
        <span
          key={c.id}
          className={`s-cross__fig s-cross__fig--${c.side} s-cross__fig--${c.depth}`}
          data-cross
          data-seam={c.seam}
          data-edge={c.edge}
          data-depth={c.depth}
        >
          {/* the wrapper is placed on the seam and the scroll owns its
              transform; this inner element owns the half-height lift that
              puts the figure's waist on the boundary. Two owners on one
              transform is the jitter bug the motion file is about. */}
          <span className="s-cross__in">
            <Figure pose={c.pose} />
          </span>
        </span>
      ))}
    </div>
  );
}
