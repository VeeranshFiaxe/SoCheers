"use client";

import { CSSProperties, Fragment, useEffect, useState } from "react";
import { DEFAULT_AWARDS, awardColour } from "@/lib/cms/defaults";

export default function Awards() {
  /* One row, going past. This spent a while as a catalogue - an index on
     the left, a still on the right - and the trouble with a catalogue is
     that it asks to be worked through. Six shows is a fact about us, not
     a body of work to browse.

     What keeps it from reading as a fourth row of the client wall three
     sections up is that it is not typed like one: the names are set
     bigger and in caps, and every name is struck through with a purple
     marker swipe (#97509f, off the design book's own solids) that fills
     the whole name when you point at it. The wall above is grey type and
     one coloured star; this is the loudest strip on the page, which is the
     right way round for the section about being noticed.

     Names at rest, and the citation on hover. The year used to ride
     above each one as a small mono figure and it is out: a ticker is read
     in passing, and a date going by at speed is a thing to squint at
     rather than a thing to take in. The category is the opposite case -
     it is only ever read standing still, on the one show the pointer has
     stopped on, so it waits for that.

     The movement is the shared marquee ticker in lib/motion.ts, same as
     the clients' rows. The shows, what was won at each and the colour of
     each swipe are the admin panel's (/admin, Awards): the page is built
     with the list as it ships (DEFAULT_AWARDS) and swaps in whatever has
     been saved once it arrives - the section is the last on the page, so
     nobody sees the swap. */
  const [items, setItems] = useState(DEFAULT_AWARDS.items);
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/content/awards", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.awards?.items?.length) setItems(d.awards.items); })
      .catch(() => { /* no API, or offline - keep the built-in list */ });
    return () => ac.abort();
  }, []);

  return (
    <section className="sec awards" id="awards" data-section data-sec="4">
      <div className="wrap">
        <h2 className="sec__title" data-split>Every win counts.</h2>
      </div>

      {/* The row is decoration as far as a screen reader is concerned -
          duplicated and moving. The list below carries the same six
          shows once, in order, off screen.

          Four passes of the six, not two. The ticker in lib/motion.ts
          wraps on half the track's width, so the track has to be at
          least two screens wide or the tail runs out mid-viewport and
          the whole strip appears to stop and jump back. Six names is
          about one screen; twelve is not, whatever the window. */}
      <div className="awards__rows" aria-hidden="true">
        <div className="amarquee">
          {/* Slower than the client wall's 34, and by more than the gap
              between the numbers looks: this track's half is the wider of
              the two, so the same base buys it more speed. See initMarquees
              in lib/motion.ts.

              Which is why this number moves whenever the type does. It
              was 42, then 60 when the names went up half again, and it is
              44 now that they have come back down to clamp(28px,4vw,56px)
              (.amarquee__show b in globals.css): a narrower track covered
              in the same seconds is a faster row, so holding the base
              would have handed the size reduction back as speed. Re-time
              this alongside any further change to the size. */}
          <div className="amarquee__track" data-marquee="left" data-marquee-base="44">
            {[0, 1, 2, 3].map((copy) =>
              items.map((a, i) => (
                <Fragment key={`${copy}-${a.id}`}>
                  <span
                    className="amarquee__show"
                    style={{ "--swipe": awardColour(a.color) } as CSSProperties}
                  >
                    <b>{a.name}</b>
                    {/* What was actually won there, under the name of the
                        body that gave it - the show alone says we were in
                        the room, not what for. It arrives with the swipe
                        on hover and is absolutely positioned so it costs
                        the track no width: the ticker wraps on half of
                        that width (initMarquees, lib/motion.ts) and a line
                        that changed it on hover would move the whole row.

                        Edited in the admin panel. */}
                    <i className="amarquee__cat">{a.category}</i>
                  </span>
                  {/* the dot takes the *next* name's colour, so it reads as
                      the hinge between two shows rather than as a full stop
                      on the one behind it */}
                  <span
                    className="amarquee__dot"
                    style={{ "--swipe": awardColour(items[(i + 1) % items.length].color) } as CSSProperties}
                  />
                </Fragment>
              )),
            )}
          </div>
        </div>
      </div>

      {/* the same six, once and in order, for anything that cannot read a
          moving row - carrying what the row carries and no more */}
      <ul className="sr-only">
        {items.map((a) => (
          <li key={a.id}>{a.name} - {a.category}</li>
        ))}
      </ul>
    </section>
  );
}
