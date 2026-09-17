"use client";

import { CSSProperties, Fragment, useEffect, useState } from "react";
import { DEFAULT_WALL, fontFamily, loadFonts } from "@/lib/cms/defaults";
import type { LogoWall, WallItem } from "@/lib/cms/types";
import { SOLIDS } from "@/lib/solids";


/* Which solid a brand hovers into.

   Scattered, but not random: this is server-rendered and then hydrated,
   and Math.random() would deal one hand on the server and a different one
   in the browser. So the colour is a function of the name itself - which
   also means the same brand gets the same ink wherever it appears, and
   that matters here because Schweppes and ITC are each on two of the
   three rows. A name that changed colour between rows would read as two
   different clients.

   djb2, xor variant, sign stripped. Any cheap avalanche would do; the
   only requirement is that names sitting next to each other in the source
   list do not land on numbers sitting next to each other. */
function hash(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i += 1) h = ((h * 33) ^ name.charCodeAt(i)) >>> 0;
  return h;
}

/* One row's worth of draws, with the two collisions a hash cannot see
   fixed up afterwards.

   Six of anything over ten or twelve names means repeats are certain, and
   fine. What is not fine is two of them touching - that reads as a
   mistake rather than as a palette - so a name that draws its neighbour's
   number is nudged one along. The same is done across the seam: the track
   is printed twice so the loop can wrap on half its width (see Clients
   below), which puts the last name of a pass hard against the first name
   of the next one.

   `salt` is what lets one row be dealt twice without the second deal
   being a copy of the first. Colour and tilt are drawn independently, so
   the yellow names are not also the ones leaning the same way. */
function scatter(names: string[], count: number, salt: string): number[] {
  const picked: number[] = [];
  names.forEach((n, i) => {
    let k = hash(n + salt) % count;
    if (i > 0 && k === picked[i - 1]) k = (k + 1) % count;
    picked.push(k);
  });

  const last = picked.length - 1;
  if (last > 0 && picked[last] === picked[0]) {
    picked[last] = (picked[last] + 1) % count;
    /* and do not re-create the collision the loop just spent its time
       avoiding on the way past */
    if (picked[last] === picked[last - 1]) {
      picked[last] = (picked[last] + 1) % count;
    }
  }
  return picked;
}

/* How far a name leans when you point at it, and which way.

   It used to be one value for the whole wall - every name kicked two
   degrees anticlockwise - which made the row feel like one object
   responding rather than thirty separate names. Both directions now, and
   three amounts each.

   The ceiling is deliberately low. These are set in bold display type at
   up to 31px and they are the client list: a name has to stay a name
   while it is moving, so nothing here goes past two and a half degrees.
   The scale carries most of the pop; the angle is what stops it reading
   as a stamp.

   Paired with a scale rather than left alone, and the pairing is not an
   accident: the two hardest leans are the smallest lifts. A name that
   both jumps and turns the furthest is the one that stops being readable,
   so the further it turns the less it grows.

   The lifts are a notch up from where they started - the pop was reading
   as the name settling rather than as the name being picked out. The
   angles are not: they were already at the ceiling described above, and
   raising both is what turns a hover into a stamp. Rest size is untouched
   either way; all of this is on the hover transform only. */
const TILTS = [
  { deg: "-2.4deg", pop: 1.19 },
  { deg: "-1.5deg", pop: 1.22 },
  { deg: "-0.8deg", pop: 1.25 },
  { deg: "0.8deg",  pop: 1.25 },
  { deg: "1.5deg",  pop: 1.22 },
  { deg: "2.4deg",  pop: 1.19 },
];

export default function Clients() {
  /* The wall is grey type until you point at it, and then the one name
     under the cursor takes a colour - its own, off the design book's
     solids, the same six the awards row further down is struck through
     with. Nothing is coloured at rest, on purpose: thirty brands in six
     colours all at once is a logo sheet, and the point of this row is
     that it reads as a list of names you already recognise.

     The stars between them are the exception, and they are the palette's
     only outing at rest on this row. They were all one colour, which made
     the separator read as a rule the row was printed with; dealt out of
     the same six solids they read as punctuation instead. They get their
     own deal - a third salt - so a star is not the colour of either name
     it sits between.

     What the row is not is one typeface. Where there is artwork for a
     brand the name is drawn in its OWN letterforms, masked out of the
     row's grey so it still colours on hover like the text beside it -
     see BRAND_MARK in lib/content.ts for why a mask and not an image,
     and why not a lookalike font.

     Most of the row is drawn; six names are not, and deliberately.
     Audi, ITC, IndusInd, Zurich Kotak, Universal Pictures and Belgian
     Waffle have no entry in BRAND_MARK (lib/content.ts) because their
     marks do not survive being cut to one cap height - too fine, too
     wide, or too locked to a device - so they fall through to the text
     fallback and are set in the row's own bold sans instead. A typed
     name colours and leans exactly as a drawn one does, so the row does
     not read as having holes in it.

     Which is also the fallback's other job: the day somebody adds a
     client to CLIENT_ROWS before the mark for it has been cut, that name
     shows up as a word rather than as a gap.

     The rows themselves are the admin panel's now (/admin, Logo wall).
     The page is built with the wall as it ships - DEFAULT_WALL, off
     CLIENT_ROWS and BRAND_MARK - and swaps in whatever the panel has
     saved once that arrives. The section is well below the fold, so
     nobody sees the swap. */
  const [wall, setWall] = useState<LogoWall>(DEFAULT_WALL);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/content/logo-wall", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.fonts)) loadFonts(data.fonts);
        if (data.wall?.rows?.length) setWall(data.wall);
      })
      .catch(() => { /* no API (next dev) or offline - keep the built-in wall */ });
    return () => ac.abort();
  }, []);

  return (
    <section className="sec clients" data-section data-sec="3">
      <div className="wrap">
        <h2 className="sec__title" data-split>Who do we do it with.</h2>
      </div>
      <div className="clients__rows">
        {wall.rows.map((row, r) => {
          const names = row.items.map((it) => it.name);
          const ink = scatter(names, SOLIDS.length, "");
          const lean = scatter(names, TILTS.length, "·tilt");
          const star = scatter(names, SOLIDS.length, "·star");
          return (
            <div className="cmarquee" key={r} aria-hidden="true">
              {/* the track is duplicated so the loop can wrap on half its width */}
              {/* see the note over initMarquees in lib/motion.ts for what
                  the speed number actually means */}
              <div
                className="cmarquee__track"
                data-marquee={row.dir}
                data-marquee-base={row.speed}
                style={{ "--marquee-dur": `${row.speed}s` } as CSSProperties}
              >
                {[0, 1].map((copy) =>
                  row.items.map((it, i) => (
                    <Fragment key={`${copy}-${it.id}`}>
                      <WallName
                        item={it}
                        hover={{
                          "--brand": SOLIDS[ink[i]],
                          "--tilt": TILTS[lean[i]].deg,
                          "--pop": TILTS[lean[i]].pop,
                        }}
                      />
                      <span className="s" style={{ "--star": SOLIDS[star[i]] } as CSSProperties}>✦</span>
                    </Fragment>
                  )),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* One name on the wall. The three hover properties are the same for all
   three kinds, so a drawn name, a picture and a typed one colour and lean
   identically in the row.

   - mark, mask: the wordmark as a CSS mask - the row's grey at rest, its
     own solid on hover (see .bmark in globals.css).
   - mark, image: the uploaded picture as it is, for a logo whose colours
     are the point. It fades up from grey on hover instead.
   - text: the name typed, in the site's face or one uploaded in the panel. */
function WallName({ item, hover }: { item: WallItem; hover: Record<string, string | number> }) {
  if (item.kind === "mark" && item.display === "image") {
    return (
      <span
        className="bmark bmark--img"
        data-name={item.name}
        style={{ ...hover, "--ar": item.ar, "--k": item.k } as CSSProperties}
      >
        <img src={item.src} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }
  if (item.kind === "mark") {
    return (
      <span
        className="bmark"
        data-name={item.name}
        style={{ ...hover, "--mark": `url(${item.src})`, "--ar": item.ar, "--k": item.k } as CSSProperties}
      />
    );
  }
  return (
    <span
      style={{
        ...hover,
        fontFamily: fontFamily(item.font),
        fontWeight: item.weight,
        fontStyle: item.italic ? "italic" : undefined,
        textTransform: item.upper ? "uppercase" : undefined,
        fontSize: item.k !== 1 ? `calc(var(--bw-size) * ${item.k})` : undefined,
      } as CSSProperties}
    >
      {item.name}
    </span>
  );
}
