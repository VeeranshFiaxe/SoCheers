import Link from "next/link";
import { CSSProperties, Fragment } from "react";
import { AWARDS, BRAND_MARK, BUCKETS, CLIENT_ROWS, STATS } from "@/lib/content";
import ParticleLogo from "./ParticleLogo";
import RollText from "./Roll";

/* A reel frame, as the card draws it: the small cut scripts/build-art.mjs
   writes to /assets/cards. The service pages keep the full-size files. */
const cardCut = (src: string) => src.replace(/^\/assets\/(?:home|services)\//, "/assets/cards/");

export function Who() {
  /* No wall of its own any more: this section slides up *behind* the pinned
     hero (see .who's negative margin in globals.css) and the hero's own last
     frame dissolves off it - see dissolve() in lib/motion.ts. */
  return (
    <section className="sec who no-border" id="who" data-section data-sec="1">
      <div className="wrap">
        {/* Three columns, the way the mock reads it: the claim on the
            left, the mark in the middle, the pitch on the right, and the
            counts as their own centred row under all three.

            No label over the claim. "WHO WE ARE" used to ride above it in
            small accent mono - the last of the four section tags on this
            page - and it was the heading saying the sentence under it in
            fewer words. The claim does not need to be introduced. */}
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              An independent, integrated creative agency.
            </p>
          </div>

          {/* The mark, held in the air as a few tens of thousands of
              grains - components/ParticleLogo.tsx. It owns its own
              pointer behaviour, so no data-tilt here: the cursor is
              supposed to go *through* it, not lean it. */}
          <div className="who__photo">
            <ParticleLogo />
          </div>

          <div className="who__say">
            <p className="who__pitch" data-split>
              We build brands consumers fall for. We make content people can&apos;t help but{" "}
              <span className="who__share">share.</span>
            </p>
          </div>
        </div>

        <div className="who__stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label} data-reveal>
              <div className="stat__num">
                {/* No data-count-hue: the count runs up white and stays
                    white - the colour only arrives on hover. */}
                <span data-count={s.count}>0</span>
                <i>+</i>
              </div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function What() {
  return (
    <section className="sec what" id="what" data-section data-sec="2">
      <div className="wrap">
        <h2 className="sec__title" data-split>
          How the work comes together.
        </h2>

        <div className="wcards">
          {BUCKETS.map((b) => (
            /* The whole card, not a "read more" tucked in a corner: the
               name, the picture and the list are all about the same one
               thing, so the target is the thing. No data-cursor - the
               card's own name is already set at 38px in the middle of it,
               and the disc was printing it a second time under the
               pointer. */
            <Link
              className="wcard"
              key={b.idx}
              href={`/services/${b.slug}`}
              prefetch
              data-clip
              data-tilt
            >
              {/* Ten frames a card, four cards, and exactly four of the
                  forty are ever on screen at once - the rest are the reel
                  the cycle flips through on hover. All of them are lazy,
                  the one showing included: the cards are screens below a
                  pinned hero, and an eager <img> is one React preloads in
                  the document head, ahead of the opening sequence's own
                  pictures. Each is the card's small cut (cardCut above),
                  not the file the service page draws. */}
              <div className="wcard__img">
                {b.images.map((src, i) => (
                  <img
                    key={src}
                    src={cardCut(src)}
                    alt=""
                    className={i === 0 ? "is-active" : undefined}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="wcard__body">
                <h3 className="wcard__name" data-roll><RollText>{b.name}</RollText></h3>
                <ul className="wcard__list">
                  {/* data-frame is the line's own picture, as a position in
                      the stack of <img>s above - the cycle in
                      initWCardCycle() (lib/motion.ts) parks on it while the
                      pointer is on the line. An item whose image somehow
                      isn't in its bucket's reel indexes to -1, which that
                      code reads as "no frame of its own" and leaves the
                      reel running rather than blanking the card. */}
                  {b.items.map((it) => (
                    <li key={it.label} data-frame={b.images.indexOf(it.img)}>{it.label}</li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   The design book's six solids (SoCheers Colors.jpg, and the tokens at the
   top of globals.css), in the order they are printed there. Two rows on
   this page are coloured out of it, and they use it differently.

   The awards ticker runs it straight: there are six shows, so one pass of
   the row is one pass of the palette and every show keeps its own colour
   on every repeat.

   The client wall cannot do that. It is thirty-odd names across three
   rows, so walking the palette in order would print a six-name rainbow
   twice per row and read as a pattern rather than as thirty brands. */
const SOLIDS = [
  "var(--leaf)",
  "var(--sky)",
  "var(--tangerine)",
  "var(--logo)",
  "var(--purple)",
  "var(--pink)",
];

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

export function Clients() {
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
     shows up as a word rather than as a gap. */
  return (
    <section className="sec clients" data-section data-sec="3">
      <div className="wrap">
        <h2 className="sec__title" data-split>Who do we do it with.</h2>
      </div>
      <div className="clients__rows">
        {CLIENT_ROWS.map((row, r) => {
          const ink = scatter(row.names, SOLIDS.length, "");
          const lean = scatter(row.names, TILTS.length, "·tilt");
          const star = scatter(row.names, SOLIDS.length, "·star");
          return (
            <div className="cmarquee" key={r} aria-hidden="true">
              {/* the track is duplicated so the loop can wrap on half its width */}
              {/* a notch off the shared 30 - see the note over initMarquees
                  in lib/motion.ts for what the number actually means */}
              <div className="cmarquee__track" data-marquee={row.dir} data-marquee-base="34">
                {[0, 1].map((copy) =>
                  row.names.map((n, i) => (
                    <Fragment key={`${copy}-${i}`}>
                      {/* All three are only ever read by the hover rule
                          below, so this costs three custom properties and
                          no paint at all until the cursor is on the name */}
                      {/* The three custom properties are the same either
                          way - the mark colours and leans on hover
                          exactly as the word does, so a drawn name and a
                          typed one behave identically in the row. The
                          mark carries no text node: it is a masked box,
                          and the name rides along in data-name so the
                          markup still says which brand it is. */}
                      {BRAND_MARK[n] ? (
                        <span
                          className="bmark"
                          data-name={n}
                          style={{
                            "--brand": SOLIDS[ink[i]],
                            "--tilt": TILTS[lean[i]].deg,
                            "--pop": TILTS[lean[i]].pop,
                            "--mark": `url(/assets/clients/${BRAND_MARK[n].slug}.webp)`,
                            "--ar": BRAND_MARK[n].ar,
                            "--k": BRAND_MARK[n].k ?? 1,
                          } as CSSProperties}
                        />
                      ) : (
                        <span
                          style={{
                            "--brand": SOLIDS[ink[i]],
                            "--tilt": TILTS[lean[i]].deg,
                            "--pop": TILTS[lean[i]].pop,
                          } as CSSProperties}
                        >
                          {n}
                        </span>
                      )}
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


export function Awards() {
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

     Server component, no state: the movement is the shared marquee
     ticker in lib/motion.ts, same as the clients' rows. */
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
              AWARDS.map((a, i) => (
                <Fragment key={`${copy}-${i}`}>
                  <span
                    className="amarquee__show"
                    style={{ "--swipe": SOLIDS[i % SOLIDS.length] } as CSSProperties}
                  >
                    <b>{a.name}</b>
                    {/* What was actually won there, under the name of the
                        body that gave it - the show alone says we were in
                        the room, not what for. It arrives with the swipe
                        on hover and is absolutely positioned so it costs
                        the track no width: the ticker wraps on half of
                        that width (initMarquees, lib/motion.ts) and a line
                        that changed it on hover would move the whole row.

                        PLACEHOLDER copy - AWARDS[].category in
                        lib/content.ts. Swap each one for the real
                        citation. */}
                    <i className="amarquee__cat">{a.category}</i>
                  </span>
                  {/* the dot takes the *next* name's colour, so it reads as
                      the hinge between two shows rather than as a full stop
                      on the one behind it */}
                  <span
                    className="amarquee__dot"
                    style={{ "--swipe": SOLIDS[(i + 1) % SOLIDS.length] } as CSSProperties}
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
        {AWARDS.map((a) => (
          <li key={a.name}>{a.name} - {a.category}</li>
        ))}
      </ul>
    </section>
  );
}

/* There is no closing CTA section any more. The page ends on AWARDS and
   hands straight over to the footer, and the ask - the line and the
   button - is the first thing waiting under the bulb once the room is
   uncovered. See .foot__ask in components/Footer.tsx. */
