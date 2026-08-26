"use client";

import { useEffect, useRef } from "react";
import { AI_HERO, AI_THOUGHTS } from "@/lib/ai-content";

/* ============================================================
   THE HERO'S NOISE - a figure, and everything being shouted at him.

   The client's reference is an illustration: a man standing under a
   swarm of speech bubbles in five languages, none of which he asked
   for. The languages were look-and-feel rather than content (see the
   note over AI_THOUGHTS in lib/ai-content.ts), so what is in the
   bubbles here is what actually gets said to a generator - "again",
   "sharper", "more human", "what if?" - and the picture is the same
   picture: a person with too many ideas arriving at once and no way to
   choose between them. Which is the page's argument, drawn.

   ---- the figure ----

   The client's own artwork: a person whose head is a stack of CRTs,
   every screen showing a piece of what the machine is being asked for.
   It replaced a drawn SVG silhouette that was standing in for the
   reference, and it is the better half of this picture - the bubbles are
   what is being said to him, and the screens are what comes back.

   Deliberately not the About page's 3D torso: that man belongs to that
   page, and a signature set piece stops being one the moment it is on
   two of them.

   He stands towards the right of the hero and the field covers the whole
   section, so the bubbles come out of his head and run to both edges -
   the picture the reference is drawing. The copy sits in the bottom
   left, which is the one corner the fan is composed to leave alone.

   ---- the parallax ----

   One listener, one rAF, two custom properties on the wrapper. Every
   bubble reads the same pair and multiplies them by its own `depth`,
   so twenty elements move at twenty speeds off one write per frame
   rather than twenty style mutations - and none of it is React state,
   which would re-render the field sixty times a second to move it a
   few pixels.

   It is skipped outright without a pointer or under reduced motion:
   the bubbles keep their drift animation (CSS, in ai.css) and lose the
   chase, which is the layer nobody on a phone was getting anyway.
   ============================================================ */
export default function AiThoughts() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* where the cursor is, and where the field has caught up to - the
       gap between them is the only easing this needs */
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
      /* keep running only while there is still a gap worth closing */
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    /* The whole thing is decoration. The headline beside it says what
       the page is; a screen reader reading eighteen loose words over
       the top of that is the noise rather than the point of it. */
    <div className="ai-stage" ref={stage} aria-hidden="true">
      <div className="ai-thoughts">
        {AI_THOUGHTS.map((t, i) => (
          <span
            key={`${t.word}-${i}`}
            className="ai-bubble"
            data-tone={t.tone}
            data-small={t.small ? "" : undefined}
            /* the tail hangs on the inside edge, so every bubble points
               back down at the head rather than off the frame */
            data-tail={t.x < 50 ? "l" : "r"}
            style={
              {
                "--x": `${t.x}%`,
                "--y": `${t.y}%`,
                "--s": t.s,
                "--r": `${t.r}deg`,
                "--d": t.depth,
                /* the drift, offset per bubble so the field never
                   breathes in unison, and the entrance, staggered along
                   the same index */
                "--dur": `${6 + (i % 5) * 1.4}s`,
                "--delay": `${(i % 7) * -1.9}s`,
                "--in": `${0.15 + i * 0.055}s`,
              } as React.CSSProperties
            }
          >
            {t.word}
          </span>
        ))}
      </div>

      <div className="ai-stage__man">
        {/* eager, and no lazy attribute: it is the hero's own picture and
            it is on screen at load, so deferring it only buys a hole in
            the first paint. */}
        <img
          className="ai-figure"
          src={AI_HERO.figure.src}
          alt=""
          width={AI_HERO.figure.w}
          height={AI_HERO.figure.h}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
