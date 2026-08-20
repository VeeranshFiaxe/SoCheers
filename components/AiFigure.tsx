/* ============================================================
   THE FIGURE - the man under the noise.

   Drawn here rather than dropped in as a file, and deliberately not the
   About page's 3D torso: that man is that page's, and a signature set
   piece stops being one the second it turns up twice. This is closer to
   the reference anyway, which is flat, graphic and lit from behind - a
   head-and-shoulders silhouette tipped back, eyes up, mouth slightly
   open, everything else left to the bubbles.

   Why SVG and not an image: it is about 2KB, it scales to a full-bleed
   background on any screen without a second export, it takes the page's
   own palette through CSS variables rather than baking hexes into a
   PNG, and it costs no request. There is nothing photographic being
   asked of it - at this size and this far behind eighteen speech
   bubbles, the figure is a shape and a pair of eyes.

   The geometry: 420x520 with the figure standing on the bottom edge, so
   the art can be anchored bottom-centre and cropped from the top by
   whatever height the hero has. Everything is one flat fill plus a rim
   on the left, which is the whole lighting model.
   ============================================================ */
export default function AiFigure() {
  return (
    <svg
      className="ai-figure"
      viewBox="0 0 420 520"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* the bloom behind the head - the reference's figure is standing
            in front of whatever is shouting at him, and this is the only
            thing saying so */}
        <radialGradient id="ai-fig-glow" cx="50%" cy="42%" r="52%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".22" />
          <stop offset="55%" stopColor="var(--accent)" stopOpacity=".06" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ai-fig-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20202a" />
          <stop offset="70%" stopColor="#101014" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>

        {/* the eyes are the one lit thing in the drawing, so they get a
            real blur rather than a second ellipse pretending to be one */}
        <filter id="ai-fig-eyes" x="-120%" y="-300%" width="340%" height="700%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <circle cx="210" cy="250" r="212" fill="url(#ai-fig-glow)" />

      {/* Painted back to front, and the order is doing real work: the hair
          and the ears are laid down first so the head crops them, and the
          shoulders go on after the neck so the neck ends inside them
          rather than on a visible edge. */}
      <g stroke="rgba(241,236,225,.16)" strokeWidth="1.5">
        <g transform="rotate(-7 210 250)">
          {/* hair, sitting proud of the skull rather than drawn on it */}
          <path d="M126 244c-6-84 30-128 84-128s90 44 84 128c-6-56-36-84-84-84s-78 28-84 84z" fill="#191920" />
          <ellipse cx="142" cy="256" rx="8" ry="15" fill="#141419" />
          <ellipse cx="278" cy="256" rx="8" ry="15" fill="#141419" />
        </g>

        <path d="M176 302h68l6 96c-24 13-56 13-80 0z" fill="#101015" />
        <path d="M-4 520c8-74 60-118 146-136h136c86 18 138 62 146 136z" fill="url(#ai-fig-body)" />

        <g transform="rotate(-7 210 250)">
          {/* the head, rolled back seven degrees: the chin comes up, the
              crown goes away from the viewer, the eyeline rides high and
              the underside of the nose comes into view - which is the
              whole tell that somebody is looking up */}
          <path
            d="M140 250c-4-68 24-116 70-116s74 48 70 116c-3 48-26 88-70 96-44-8-67-48-70-96z"
            fill="url(#ai-fig-body)"
          />
        </g>
      </g>

      <g transform="rotate(-7 210 250)">
        <g filter="url(#ai-fig-eyes)" fill="var(--accent)" opacity=".85">
          <ellipse cx="182" cy="230" rx="14" ry="9" />
          <ellipse cx="238" cy="230" rx="14" ry="9" />
        </g>
        <g fill="var(--cream)">
          <ellipse cx="182" cy="230" rx="11" ry="6" />
          <ellipse cx="238" cy="230" rx="11" ry="6" />
        </g>

        <g fill="rgba(0,0,0,.5)">
          <ellipse cx="199" cy="272" rx="5" ry="3.4" />
          <ellipse cx="221" cy="272" rx="5" ry="3.4" />
        </g>

        {/* open, slightly. He is not enjoying this. */}
        <ellipse cx="210" cy="300" rx="13" ry="8" fill="rgba(0,0,0,.62)" />
      </g>

      {/* the collar, which is the one line that turns a torso into a
          person wearing something */}
      <path
        d="M150 388c18 26 40 39 60 39s42-13 60-39"
        fill="none"
        stroke="rgba(241,236,225,.14)"
        strokeWidth="1.5"
      />

      {/* the rim: one stroke down the left of the silhouette, which is
          what separates a dark figure from a dark page without needing a
          background behind him */}
      <g fill="none" stroke="var(--accent)" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round">
        <path d="M-4 520c8-74 60-118 146-136" />
        <path d="M127 258c-6-86 31-142 83-142" transform="rotate(-7 210 250)" />
      </g>
    </svg>
  );
}
