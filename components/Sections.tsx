import { CSSProperties, Fragment } from "react";
import { AWARDS, BUCKETS, CLIENT_ROWS, STATS } from "@/lib/content";
import ParticleLogo from "./ParticleLogo";
import RollText from "./Roll";

export function Who() {
  /* No wall of its own any more: this section slides up *behind* the pinned
     hero (see .who's negative margin in globals.css) and the hero's own last
     frame crumbles off it - components/HeroCrumble.tsx. */
  return (
    <section className="sec who no-border" id="who" data-section data-sec="1">
      <div className="wrap">
        <span className="tag" data-reveal>WHO WE ARE</span>
        <div className="who__grid">
          <div className="who__copy">
            <p className="who__lede" data-split>
              {/* A hard break, not a non-breaking space: the line splitter
                  (SplitText, see initSplits in lib/motion.ts) re-wraps this
                  word by word to measure lines, and an nbsp does not survive
                  that - a <br /> does. The name and the dash close the first
                  line; "an" goes down with what it introduces. */}
              We are <span className="who__brand">SoCheers</span> -{" "}
              <br />
              an independent, integrated creative agency.
            </p>
            <p className="who__pitch" data-split>
              We build brands consumers fall for. We make content people can&apos;t help but{" "}
              <span className="who__share">share.</span>
            </p>
            <div className="who__stats">
              {STATS.map((s) => (
                <div className="stat" key={s.label} data-reveal data-cursor={`${s.count}+`}>
                  <div className="stat__num">
                    <span data-count={s.count}>0</span>
                    <i>+</i>
                  </div>
                  <div className="stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* The mark, held in the air as a few tens of thousands of
              grains - components/ParticleLogo.tsx. It owns its own
              pointer behaviour, so no data-tilt here: the cursor is
              supposed to go *through* it, not lean it. */}
          <div className="who__photo">
            <ParticleLogo />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   3.5 · THE REEL

   Not a section with a video in it. The page stops being a page for a
   couple of screens of scroll and is a film instead, and then it is a
   page again.

   The shape of it, in the order the reader gets it:

     · a small letterboxed film rides up into the page, sitting in the
       page's own margins and reading as a clip on a black card;
     · the scroll locks, and the window opens to the edges of the screen;
     · it holds there, full bleed, for long enough that you have watched
       some of it rather than watched it arrive;
     · it closes back down to the card, the scroll unlocks, and the page
       carries on into WHAT WE DO.

   The whole mechanic is one clip-path. The film is full-bleed and fixed
   at the size of the stage the entire time it is on screen - it never
   resizes, never scales to fit a box - and what changes is how much of
   it you are allowed to see. So the film does not grow into the room:
   the room opens onto the film, which is the difference between a video
   embed and a cut.

   The scroll drives exactly one number - --reel-open on the frame, 0
   shut and 1 full bleed, written by initReel in lib/motion.ts. The clip,
   the bars and the camera's push are all calc()s off it in
   app/globals.css, so the scrub costs no layout read and every actual
   measurement stays in the stylesheet where a breakpoint can re-cut it.

   The lock is ScrollTrigger's pin, not position:sticky, and that is not
   a style preference - sticky does not work on this site at all. body
   carries overflow-x:hidden (app/globals.css), which makes body its own
   scroll container, and a sticky descendant of a scroll container that
   never scrolls simply never sticks. Every other held section here -
   the hero, the About panels - pins through the engine for the same
   reason, so this one does too.

   The video carries no src in the markup: initReel attaches it once the
   page has gone quiet, so the film never competes with the first screen
   for bandwidth, and pauses it the moment the stage is off screen.

   What it does carry is a poster - the film's own title card, a frame
   and a half in, because the first second of it is black and a black
   frame is indistinguishable from a broken one. Whatever the network is
   doing, this section is never an empty box.

   One thing sits on the stage beside the frame, and it is written off
   the same --reel-open the clip is:

     · an invisible button the size of the aperture, which stops and
       starts the film. It draws nothing - the word rides in the site's
       own cursor disc, PAUSE and then PLAY - and it is hidden entirely
       where there is no hover to announce it. */
export function Reel() {
  return (
    <section className="sec reel no-border" data-reel>
      {/* Pinned by initReel, which wraps this in a spacer of its own and
          holds it against the top of the viewport for the length of the
          open, the hold and the close. Nothing here sets that length -
          it is one number in the script. */}
      <div className="reel__stage" data-reel-stage>
        <div className="reel__frame" data-reel-frame>
          <video
            className="reel__film"
            data-reel-film="/media/vibe-video.mp4"
            poster="/media/vibe-video-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {/* No label. There was one here - a tag and a line of copy in the
            page's top margin above the shut letterbox - and the film
            arrives on its own now: the card climbing into the page is
            the announcement, and a sentence introducing a picture that
            is about to fill the screen was the section clearing its
            throat. */}

        {/* The transport.

            No visible control on the picture: the site already draws a
            green disc under the cursor with a word in it, so the film
            gets the same treatment as everything else here and the word
            is PAUSE. data-cursor is swapped on the click, and the
            cursor reads it live (initCursor, lib/motion.ts), so the
            disc says PLAY the moment it has stopped without the reader
            having to leave the frame and come back.

            It is inset to the aperture rather than to the stage - the
            same two vars the clip is cut with - so the hit area is
            whatever you can actually see, and the black margins around
            a shut frame stay dead. */}
        <button
          type="button"
          className="reel__toggle"
          data-reel-toggle
          data-cursor="Pause"
          aria-label="Pause the film"
        >
          <span className="reel__hint" aria-hidden="true">Pause</span>
        </button>
      </div>

      {/* The one thing a screen reader gets: there is a film here, it
          says nothing, you are not missing a sentence. */}
      <p className="sr-only">A short film of SoCheers work and the people who make it.</p>
    </section>
  );
}

export function What() {
  return (
    <section className="sec what" id="what" data-section data-sec="2">
      <div className="wrap">
        <span className="tag" data-reveal>WHAT WE DO</span>
        <h2 className="sec__title" data-split>
          How the work comes together.
        </h2>

        <div className="wcards">
          {BUCKETS.map((b) => (
            <article className="wcard" key={b.idx} data-clip data-tilt data-cursor={b.name}>
              <div className="wcard__img">
                {b.images.map((src, i) => (
                  <img key={src} src={src} alt="" className={i === 0 ? "is-active" : undefined} />
                ))}
              </div>
              <div className="wcard__body">
                <h3 className="wcard__name" data-roll><RollText>{b.name}</RollText></h3>
                <ul className="wcard__list">
                  {b.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </article>
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
   so the further it turns the less it grows. */
const TILTS = [
  { deg: "-2.4deg", pop: 1.11 },
  { deg: "-1.5deg", pop: 1.14 },
  { deg: "-0.8deg", pop: 1.16 },
  { deg: "0.8deg",  pop: 1.16 },
  { deg: "1.5deg",  pop: 1.14 },
  { deg: "2.4deg",  pop: 1.11 },
];

export function Clients() {
  /* The wall is grey type until you point at it, and then the one name
     under the cursor takes a colour - its own, off the design book's
     solids, the same six the awards row further down is struck through
     with. Nothing is coloured at rest, on purpose: thirty brands in six
     colours all at once is a logo sheet, and the point of this row is
     that it reads as a list of names you already recognise. */
  return (
    <section className="sec clients" data-section data-sec="3">
      <div className="wrap">
        <span className="tag" data-reveal>WHO DO WE DO IT WITH</span>
        <h2 className="sec__title" data-split>Brands you like consuming the most.</h2>
      </div>
      <div className="clients__rows">
        {CLIENT_ROWS.map((row, r) => {
          const ink = scatter(row.names, SOLIDS.length, "");
          const lean = scatter(row.names, TILTS.length, "·tilt");
          return (
            <div className="cmarquee" key={r} aria-hidden="true">
              {/* the track is duplicated so the loop can wrap on half its width */}
              <div className="cmarquee__track" data-marquee={row.dir}>
                {[0, 1].map((copy) =>
                  row.names.map((n, i) => (
                    <Fragment key={`${copy}-${i}`}>
                      {/* All three are only ever read by the hover rule
                          below, so this costs three custom properties and
                          no paint at all until the cursor is on the name */}
                      <span
                        style={{
                          "--brand": SOLIDS[ink[i]],
                          "--tilt": TILTS[lean[i]].deg,
                          "--pop": TILTS[lean[i]].pop,
                        } as CSSProperties}
                      >
                        {n}
                      </span>
                      <span className="s">✦</span>
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
     one green star; this is the loudest strip on the page, which is the
     right way round for the section about being noticed.

     Names only. The year used to ride above each one as a small mono
     figure and it is out: the years on file are placeholders, and a
     ticker is read in passing - a date going by at speed is a thing to
     squint at rather than a thing to take in.

     Server component, no state: the movement is the shared marquee
     ticker in lib/motion.ts, same as the clients' rows. */
  return (
    <section className="sec awards" id="awards" data-section data-sec="4">
      <div className="wrap">
        <span className="tag" data-reveal>RECOGNITION</span>
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
          <div className="amarquee__track" data-marquee="left">
            {[0, 1, 2, 3].map((copy) =>
              AWARDS.map((a, i) => (
                <Fragment key={`${copy}-${i}`}>
                  <span
                    className="amarquee__show"
                    style={{ "--swipe": SOLIDS[i % SOLIDS.length] } as CSSProperties}
                  >
                    <b>{a.name}</b>
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
          <li key={a.name}>{a.name}</li>
        ))}
      </ul>
    </section>
  );
}

/* There is no closing CTA section any more. The page ends on AWARDS and
   hands straight over to the footer, and the ask - the line and the
   button - is the first thing waiting under the bulb once the room is
   uncovered. See .foot__ask in components/Footer.tsx. */
