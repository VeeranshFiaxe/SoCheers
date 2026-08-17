"use client";

import { useEffect, useRef } from "react";
import { createAsciiField, type AsciiField } from "@/lib/ascii-field";

/* The symbol field's mount, and nothing else - all of the work is in
   lib/ascii-field.ts, which is plain DOM and knows nothing about React.
   That split is deliberate: the field redraws itself sixty times a second
   while the cursor is inside it, and none of that can be allowed to touch
   React state or the section would re-render at frame rate.

   So this component renders one canvas, hands it over once, and afterwards
   only ever passes three facts down: which photograph is up, whether the
   section is on screen, and whether the reader has asked for less motion. */
export default function StageAscii({
  src,
  active,
  still,
}: {
  src: string;
  active: boolean;
  still: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const field = useRef<AsciiField | null>(null);

  /* The type the field is not allowed to run under: the section's heading
     and its paragraph, and - at the two ends of the line under the frame -
     the caption and the counter. Passed as selectors and measured on the
     other side; see keepOut() in lib/ascii-field.ts for why these four and
     not the rest.

     The caption and the counter are named separately rather than as the
     .stage__meta row that holds them. That row is space-between, so its
     box runs the full width of the stage and clearing it took out one long
     band with the gap between the two ends - most of the clearing - buying
     nothing. Named individually, the field closes back over that gap and
     only the two pieces of type are held out. */
  useEffect(() => {
    if (!ref.current) return;
    const f = createAsciiField(ref.current, [
      ".ab-space__title",
      ".ab-space__copy",
      ".stage__cap",
      ".stage__idx",
    ]);
    field.current = f;
    return () => { f.destroy(); field.current = null; };
  }, []);

  /* Re-measure first, then hand over the picture. The caption changes with
     the frame and the captions are not the same length - "Idhar" against
     "The offsite, all of us" is a difference of about a hundred and forty
     pixels - so a clearing cut for one of them leaves the next sitting
     half out of it. This effect runs after React has committed the new
     caption to the DOM, so the measurement is of the caption that is
     actually up, and the wipe setImage kicks off is what carries the new
     clearing onto the canvas. */
  useEffect(() => {
    field.current?.remeasure();
    field.current?.setImage(src);
  }, [src]);
  useEffect(() => { field.current?.setActive(active); }, [active]);
  useEffect(() => { field.current?.setStill(still); }, [still]);

  return <canvas className="stage__ascii" ref={ref} aria-hidden="true" />;
}
