import AboutBulbs from "./AboutBulbs";
import AboutMan from "./AboutMan";
import AboutSplash from "./AboutSplash";
import AboutStage from "./AboutStage";
import {
  ABOUT_IMG, ABOUT_INTRO, BELIEF, DRIVERS,
  FOUNDERS, SPACE_COPY, SPACE_SHOTS, WHY_WE_EXIST,
} from "@/lib/about-content";

/* 1 · the opener lives in components/AboutHero.tsx - it carries enough
   markup and motion of its own to be worth its own file. */

/* 2 · the intro line, with a figure standing either side of it.

   The disciplines run as one long list on purpose - the point is the
   sprawl - and the payoff sentence is the part that gets the accent.

   The copy is down the middle of the page now, not ranged left with the
   artwork beside it. It was one column of text against one tall portrait,
   which left the row lopsided at every width: the text ran short, the
   figure ran tall, and no vertical alignment made the two read as one
   thing. Centred and set on a measure that lands in four or five lines,
   the copy is the axis of the section - and the space it used to leave
   empty on one side is now a figure on each, watching the cursor from
   both edges of the page.

   Each side carries three layers, stacked back to front: the burst
   behind, the figure itself, and its share of the bulbs over the top.
   data-splash and data-clip are the home page's own hooks, so the bursts
   get the same cursor pull and mist-in the WHO WE ARE splash has - the
   gesture is different, the behaviour is the site's.

   The middle layer used to be a flat cutout of the team. It is now the
   3D figure in AboutMan.tsx, which answers the cursor itself - so the
   cursor-led lean the box used to carry (data-tilt) has come off it.
   That lean is a CSS rotation of the whole plane, and running it under a
   head that is already turning in 3D read as the photograph tipping
   rather than the man moving. The figure does its own leaning now.

   The two are angled in towards the copy (`turn`) and started at
   different points in their idle sweep (`phase`), so they read as two
   people either side of a sentence rather than as one asset mirrored. */
export function AboutIntro() {
  return (
    <section className="ab-panel ab-intro" data-sec="1">
      <div className="wrap ab-intro__grid">
        <div className="ab-intro__visual ab-intro__visual--l">
          <span className="ab-intro__splash" data-splash aria-hidden="true">
            <AboutSplash uid="ab-l" />
          </span>
          <AboutMan turn={0.2} />
          <AboutBulbs pick={[0, 1, 2, 6]} />
        </div>

        <div className="ab-intro__copy">
          {/* The headline that used to open this section now opens the
              people section instead - it is a claim about the company, and
              it lands harder over the group shot than over a list of job
              titles. What is left here is the list and its payoff, which
              were always the pair.

              Two separate split roots, not one paragraph with a nested
              inline payoff: SplitText clones a nested display:block tag
              onto every visual line it wraps to, so a margin set on the
              old inline <em> was duplicating itself between the green
              text's own wrapped lines, not just before them. */}
          <p className="ab-intro__line" data-split>{ABOUT_INTRO.list}</p>
          <p className="ab-intro__line ab-intro__payoff" data-split>
            <em>{ABOUT_INTRO.payoff}</em>
          </p>
        </div>

        <div className="ab-intro__visual ab-intro__visual--r">
          <span className="ab-intro__splash" data-splash aria-hidden="true">
            <AboutSplash uid="ab-r" />
          </span>
          <AboutMan turn={-0.2} phase={2.1} />
          <AboutBulbs pick={[3, 4, 5, 7]} />
        </div>
      </div>

      {/* The hand-off from black to cream, and the whole of it - there is
          no card arriving over this section and no pin under it, just this
          band at the foot of the panel (see .ab-bridge in about.css).

          A warm ramp with two layers of noise over it: the paper arrives
          as grain eating into the dark, and the dark leaves as finer grain
          dying out on the paper. Purely decorative and entirely static -
          no canvas, no script, nothing repainting after first paint. */}
      <span className="ab-bridge" aria-hidden="true">
        <i className="ab-bridge__a" />
        <i className="ab-bridge__b" />
      </span>
    </section>
  );
}

/* 3 · the two of them, arriving as one.

   The section opens on the two of them apart, one portrait each - and
   puts them together as you keep scrolling: the two frames travel in to
   meet in the middle, each one dissolving into its half of the pair shot
   as it arrives, and the write-ups slide in from the sides to flank the
   frame they now share. Which founder is which half is not a decision the
   code makes - they are standing in that order in the photograph (see
   ABOUT_IMG.foundersDuo).

   The halves are two full copies of the same image, each clipped to its
   own side, rather than one image in a joining frame: a clip-path travels
   with the element it is on, so a half stays exactly the half it started
   as no matter how far it is moved, and neither copy ever has to be
   re-cropped mid-flight. All of the timing is in lib/about-motion.ts. */
export function AboutFounders() {
  return (
    <section className="ab-panel ab-founders is-light" id="founders" data-sec="2">
      <div className="wrap">
        <span className="tag" data-reveal>BUILT BY TWO</span>

        <div className="founders" data-founders>
          {/* data-tilt puts it on the same cursor-led lean the WHAT WE DO
              cards have (initTilt in lib/motion.ts): ticker-driven, eased,
              and the push towards the reader is what does the zoom. */}
          <div className="founders__duo" data-founders-duo data-tilt aria-hidden="true">
            {(["l", "r"] as const).map((side) => (
              <span
                className={`founders__half founders__half--${side}`}
                data-founders-half={side}
                key={side}
              >
                <img src={ABOUT_IMG.foundersDuo} alt="" />
              </span>
            ))}

            {/* The same photograph a third time, whole, laid over the two
                halves and invisible until the join has landed. The halves
                exist so the arrival can be two x tweens; once they have
                met there is nothing left for a seam to do but show, and
                anything that lifts the picture - the hover's scale and
                lean - would be the thing to show it. So the hover fades
                this on top and it is that single element that moves. Same
                src as the halves, so it is the same decoded image and not
                a second download. */}
            <img className="founders__whole" src={ABOUT_IMG.foundersDuo} alt="" />
          </div>

          {FOUNDERS.map((f, i) => (
            <article
              className={`founder founder--${i === 0 ? "left" : "right"}`}
              key={f.name}
            >
              {/* No data-clip: the shared engine's image reveal writes its
                  own autoAlpha/y/scale on that hook, and this photo is
                  driven start to finish by the split timeline instead -
                  two authors on one transform is one too many. */}
              <div className="founder__photo" data-founder-photo>
                <img src={f.img} alt={f.name} style={{ objectPosition: f.imgPos }} />
              </div>

              {/* Always on screen now, not hidden until hover - it slides
                  in from its own outer edge as the section scrolls into
                  view (see the founder write-ups block in
                  lib/about-motion.ts). Split into an outer positioning
                  wrapper and an inner reveal card on purpose: GSAP's
                  scroll-scrubbed x/autoAlpha tween on the inner element
                  would otherwise fight the outer's own translateY(-50%)
                  centring transform. */}
              <div className="founder__reveal">
                <div className="founder__revealIn">
                  <h2 className="founder__name">{f.name}</h2>
                  <p className="founder__role">{f.role}</p>
                  {f.bio.map((p, j) => (
                    <p className="founder__bio" key={j}>{p}</p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4 · who we are, answered.

   The section used to be a tag, two grey paragraphs and a photo beside
   them - true, and completely flat. It carries the page's claim about
   itself now, so it is built like one: the headline that opened the intro
   lands here at full size with its second clause in the accent italic the
   site uses for its own voice, the group shot runs large and uncut down
   the middle of the page, and the two statements sit under numbered
   hairlines rather than floating as loose body copy.

   The numerals are indices, not labels - the "Why we exist" heading was
   dropped on purpose and is not coming back. They are the same device the
   drivers below use, which is what ties the two sections together. */
export function AboutPeople() {
  return (
    <section className="ab-panel ab-people is-light" data-sec="3">
      <div className="wrap ab-people__body">
        {/* The claim across the top, and under it one row: statement,
            photograph, statement.

            The statements stood beside the claim for a version, which put
            them next to the wrong thing - a heading two lines long left
            them floating in the middle of a lot of white, and it squeezed
            the claim itself into a narrow measure to make room. Beside the
            picture they have something the height of a paragraph to stand
            against, and the claim gets the width to set in two lines
            instead of four.

            The label is the client's full line again. It had been cut back
            to "If you ask our people", which is half a sentence - it is
            the question the section answers, so it asks all of it. */}
        <header className="ab-people__head">
          <span className="tag" data-reveal>If you ask our people, who we are?</span>

          {/* the em stays inline - a nested block tag gets cloned onto every
              line SplitText wraps to, which is why it carries colour and
              style but never a margin */}
          <h2 className="ab-people__title" data-split>
            An agency that leads, <em>for those who lead.</em>
          </h2>
        </header>

        {/* The numerals are indices, not labels - the same device the
            drivers further down use, which is what makes these read as
            part of one argument rather than as loose body copy. Written
            out rather than mapped over an array, because the two are no
            longer a list: one stands on each side of the photograph.

            DOM order is the reading order of the row - left statement,
            picture, right statement - so the markup and the layout agree
            and nothing has to be re-sequenced for a screen reader. */}
        <p className="ab-people__note ab-people__note--l" data-reveal>
          <i className="ab-people__idx">01</i>
          {WHY_WE_EXIST}
        </p>

        {/* Cropped at the top and nowhere else. The source is a 4:5
            photograph of the entire company standing on a staircase
            (public/assets/about/people.jpg), and shown whole it makes this
            row deeper than a screen. Every earlier window - a 21:9 band, a
            4:3 column - was cutting into the front of the group to save
            that height, which is the one part of the picture worth
            keeping. This one takes it all off the top instead: the frame
            is 5:4 and the picture sits at the foot of it, so what goes is
            ceiling and back rows and what stays is everyone in front.
            See .ab-people__shot in about.css for the numbers.

            The old scroll pan is still gone, and stays gone: it worked by
            running the image wider than its window and sliding it
            sideways, which on a crop aimed this precisely would simply
            slide the group back out of frame. It arrives on the page's own
            image reveal (data-clip) instead. */}
        <figure className="ab-people__shot" data-clip>
          <img src={ABOUT_IMG.people} alt="The SoCheers team together" />
          <figcaption className="ab-people__cap" data-reveal>
            <span>The team, in one frame</span>
            <span>Mumbai · Est. 2013</span>
          </figcaption>
        </figure>

        <p className="ab-people__note ab-people__note--r" data-reveal>
          <i className="ab-people__idx">02</i>
          {BELIEF}
        </p>
      </div>
    </section>
  );
}

/* 5 · nothing special happens at this join. Every section past the opener
   carries the same off-white (see .ab-panel in about.css) and scrolls into
   the next one plainly - the old pixel veil was solving a hard
   black-to-white cut that no longer happens here. */
export function AboutDrives() {
  return (
    <section className="ab-panel ab-drives is-light" data-sec="4">
      <div className="wrap ab-drives__inner">
        {/* The question, and nothing under it. There was a hand-drawn
            stroke ruled beneath this for a while; the three cards below
            are already the section's flourish, and a second one directly
            above them was the page talking over itself. */}
        <h2 className="ab-drives__title" data-split>What drives us?</h2>

        <div className="drivers">
          {DRIVERS.map((d) => (
            <article className="driver" key={d.idx} data-reveal>
              <span className="driver__head">
                <i>{d.idx}.</i> {d.name}
              </span>
              <p>{d.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="ab-drives__art" data-ab-crowd aria-hidden="true">
        <img src={ABOUT_IMG.crowd} alt="" />
      </div>
    </section>
  );
}

/* 6 · the office - ten frames, shown one at a time.

   This was a mosaic of eight photos in eight different shapes. It put the
   whole floor on screen at once, which is both more than the section was
   asked to reveal and less than any single photograph deserved - at
   mosaic size no shot is big enough to be worth looking at.

   It is one fixed frame now with a rail of thumbnails under it (see
   components/AboutStage.tsx, which owns the state and so is the only
   client component on this page). All four rooms are named in the
   captions: the signs are legible in the source shots, and the whole
   point of SPACE_COPY above is the four names, so hedging on them was
   throwing away the joke. */
export function AboutSpace() {
  return (
    <section className="ab-panel ab-space is-light" data-sec="5">
      <div className="wrap">
        <h2 className="ab-space__title" data-split>The space.</h2>
        <p className="ab-space__copy" data-reveal>{SPACE_COPY}</p>

        <AboutStage shots={SPACE_SHOTS} />
      </div>
    </section>
  );
}

/* a way onward, so the page does not dead-end on the grid. Stays on the
   white the office grid finished on - the stack has arrived, and dropping
   back to black for one footer strip would undo the whole walk. */
export function AboutEnd() {
  return (
    <div className="ab-end is-light">
      <a href="/" className="ab-end__back" data-cursor="Home">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        <span>Back to home</span>
      </a>
      <a href="/#contact" className="nav__cta" data-magnetic data-cursor="Say hi">
        <span>Start a project</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}
