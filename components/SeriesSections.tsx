import {
  ART,
  SECTIONS,
  TEXTURE,
  isFilm,
  type Card,
  type Section,
  type Step,
} from "@/lib/series-content";

/* ============================================================
   SERIES - the nine sections, staged.

   The renderer for /series. It reads SECTIONS out of
   lib/series-content.ts and writes not one word of copy.

   ---- what this replaced ----

   The route used to be the flat pass: one staging - a sentence in one
   half of the screen, four letterbox frames cascading down the other -
   repeated for all fourteen beats of the deck cut, with three small
   cycles (side, drift, step) keeping consecutive screens from looking
   identical. The question it was built to answer was whether the
   argument survives without fourteen bespoke scroll mechanics carrying
   it. It did, and that is why this route is the tab.

   The client's rewrite changes what the answer is worth. Fourteen
   arguments in a row can all be staged the same way because they are
   all the same kind of thing: a sentence about the reader. Ten sections
   cannot - three of them are not arguments at all. Section 8 is a
   process, section 9 is a showreel, section 10 is a button. A process
   set as "sentence left, four frames right" is a sentence with the
   process missing.

   So the repetition moved down a layer. What is identical on every
   screen now is the FRAME:

       0  .st-bg      the section's own first picture, blown up and
                      pushed right back, so the composition hangs in a
                      room rather than in a void
       1  the picture layer - the only thing that changes
       2  .st-scrim   ground for the type
       3  .st-grain   the grade, and .st-leak after the turn
       4  .st-gate    the letterbox, parked at its hairline
       5  the type, at one size, in one column
       6  .st-beat__slate  the mono chip burned into the corner

   Seven picture layers across nine sections, and the two that repeat -
   the strip three times, the poster twice - repeat on purpose: the
   strip is the page's resting state and the poster is what the page
   does when it names something, which it does twice, at the start of
   the argument and at the end of it.

   ---- what still does not move ----

   No scroll mechanics. initSeries() is not mounted on this route and
   nothing here carries [data-split] or [data-reveal]. Two things do
   move, both in CSS and both for a reason the copy asks for: the title
   card's entrance (see app/series/series.css) and the showcase, where
   the brief's own words are "rapid visual sequence" and a still grid of
   eighteen campaigns is not one. Both stop under
   prefers-reduced-motion.

   SiteMotion is still mounted by the page, and has to be - it owns the
   cursor, the spotlight, the progress bar and the Lenis scroll, which
   belong to the whole site rather than to this route.
   ============================================================ */

/* ---------- the atoms ---------------------------------------------- */

/* One frame. A film if the file is one, a still if it is not, so an
   array can mix the two and no caller has to branch.

   The films here carry their own autoplay rather than waiting for
   JavaScript to attach a source the way /series-1 does - there is no
   JavaScript on this route to attach one. Muted, inline and looping is
   the combination every browser will start unprompted, and preload is
   off so a reader who never reaches the wall never pays for it. */
function Frame({ file }: { file: string }) {
  if (isFilm(file)) {
    return (
      <video
        src={ART(file)}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
    );
  }
  return <img src={ART(file)} alt="" loading="lazy" decoding="async" />;
}

/* ------------------------------------------------------------------
   THE HIGHLIGHTED WORD.

   A block behind one word - "kink." in the continuity kink., "come
   back." in We design reasons to come back. The word is not chosen
   here: `accent` is on the section in lib/series-content.ts.

   Matching is case-insensitive and first-occurrence only, because a
   heading is one line of type and not a document. Anything that does
   not match renders as plain text rather than throwing - a section
   whose copy is edited out from under its accent should lose a
   highlight, not the sentence.
   ------------------------------------------------------------------ */
function Hi({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.toLowerCase().indexOf(accent.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="st-hi">{text.slice(at, at + accent.length)}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

/* ------------------------------------------------------------------
   THE LIFTED PHRASE.

   A phrase inside a paragraph, set louder than the paragraph around it.
   Matched out of the client's text rather than stored beside it, so the
   copy in lib/series-content.ts stays one continuous string and nothing
   here can drift out of step with it - a lifted phrase is not moved,
   not cut, and not repeated.

   ---- the two treatments, and why the copy picks ----

   A phrase that runs to the END of its paragraph takes its own line, at
   display weight with the accent rule beside it. That is the strongest
   setting on the page and it is only available there, because a line
   break is only free when there is nothing after it to strand.

   A phrase inside a sentence is marked where it stands - same face and
   colour, underscored in the accent, no break. Breaking there would
   leave the back half of the sentence starting a line on its own, which
   reads as a paragraph that has come apart rather than as emphasis.

   So neither is a flag anybody sets. Where the words sit in the
   sentence is the whole decision.
   ------------------------------------------------------------------ */
type Hit = { at: number; len: number; tail: boolean };

function hits(text: string, phrases: string[] | undefined): Hit[] {
  if (!phrases?.length) return [];
  const end = text.trimEnd().length;
  const found: Hit[] = [];
  for (const phrase of phrases) {
    const at = text.indexOf(phrase);
    /* a phrase nobody can find is a copy edit that moved out from under
       it - it should cost the page a highlight, not a paragraph */
    if (at < 0) continue;
    found.push({ at, len: phrase.length, tail: at + phrase.length >= end });
  }
  /* in reading order, and overlapping matches are dropped rather than
     nested - two marks over the same words is not emphasis twice, it is
     broken markup */
  found.sort((x, y) => x.at - y.at);
  return found.filter((h, i) => i === 0 || h.at >= found[i - 1].at + found[i - 1].len);
}

function Copy({ text, emphasis }: { text: string; emphasis?: string[] }) {
  const found = hits(text, emphasis);
  if (!found.length) return <p className="st-beat__copy">{text}</p>;

  const out: React.ReactNode[] = [];
  let cut = 0;
  found.forEach((h, i) => {
    if (h.at > cut) out.push(text.slice(cut, h.at));
    out.push(
      <b className={h.tail ? "st-lift" : "st-mark"} key={i}>
        {text.slice(h.at, h.at + h.len)}
      </b>,
    );
    cut = h.at + h.len;
  });
  if (cut < text.length) out.push(text.slice(cut));

  return <p className="st-beat__copy">{out}</p>;
}

/* The chips. Both runs of them - the three platforms on section 6, the
   five things an episode leaves behind on section 7 - are complete short
   phrases in the client's copy, so setting them apart as chips changes
   the layout and not a character of the text. */
function Cues({ items }: { items: string[] }) {
  return (
    <ul className="st-cues">
      {items.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

/* ---------- the picture layers ------------------------------------- */

/* THE STRIP. The page's resting state: four letterbox frames stepped
   off each other down the half of the screen the sentence is not in.
   Sized off their own height with the width taken from a 21:9 ratio, so
   they are recognisable frames at any viewport rather than an 11:1 band
   of somebody's forearm. */
function Strip({ frames }: { frames: string[] }) {
  return (
    <div className="st-strip">
      {frames.map((f, i) => (
        <span className="st-band" key={`${f}-${i}`}>
          <Frame file={f} />
        </span>
      ))}
    </div>
  );
}

/* THE WALL. Twelve windows at once, because one photograph of
   abundance is not abundance. Deliberately not a neat grid of twelve
   equal squares - the tiles run at three different heights off a
   four-column field, which is what a feed looks like and what a
   contact sheet does not. */
function Wall({ frames }: { frames: string[] }) {
  return (
    <div className="st-wall">
      {frames.map((f, i) => (
        <span className="st-tile" key={`${f}-${i}`}>
          <Frame file={f} />
        </span>
      ))}
    </div>
  );
}

/* THE POSTER. Bands stacked full width, uneven, with the type set
   inside them rather than beside them - the film-poster reference the
   direction was given as. Used by the two sections that name
   something. */
function Poster({ frames }: { frames: string[] }) {
  return (
    <div className="st-poster">
      {frames.map((f, i) => (
        <span className="st-poster__band" key={`${f}-${i}`}>
          <Frame file={f} />
        </span>
      ))}
    </div>
  );
}

/* THE REEL. A row of verticals along the foot of the screen, phone
   shaped, because the section above them is defining what a 20-60
   second episode is and a widescreen crop of one would be the wrong
   three quarters to throw away. */
function Reel({ frames }: { frames: string[] }) {
  return (
    <div className="st-reelrow">
      {frames.map((f, i) => (
        <span className="st-vert" key={`${f}-${i}`}>
          <Frame file={f} />
          <b className="st-vert__ep">{String(i + 1).padStart(2, "0")}</b>
        </span>
      ))}
    </div>
  );
}

/* THE SIDEBLOCKS. The client's own word for section 8, and the one
   place on the page where the pictures are small, equal and in a row -
   four frames at four sizes is a collage, and a collage does not read
   as an order of operations. */
function Steps({ items }: { items: Step[] }) {
  return (
    <ol className="st-steps">
      {items.map((s) => (
        <li className="st-step" key={s.no}>
          <span className="st-step__art">
            <img src={ART(s.art)} alt="" loading="lazy" decoding="async" />
          </span>
          <b className="st-step__no">{s.no}</b>
          <h3 className="st-step__title">{s.title}</h3>
          <p className="st-step__body">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/* THE SHOWCASE. Two rows of real campaigns travelling in opposite
   directions - the brief's "rapid visual sequence of actual SoCheers
   work".

   Each row's cards are rendered TWICE. That is the whole mechanic: the
   track is translated by exactly half its own width and the second copy
   has arrived where the first one started, so the loop has no seam and
   no JavaScript. Duplicating in the markup rather than in CSS is what
   makes that exact - a track sized off its own content cannot drift out
   of step with the distance it travels.

   The second copy is hidden from the accessibility tree; the row itself
   is a list of pictures with brand names on them, and a reader on a
   screen reader should hear each brand once. */
function Run({ cards }: { cards: Card[] }) {
  const half = Math.ceil(cards.length / 2);
  const rows: [Card[], Card[]] = [cards.slice(0, half), cards.slice(half)];

  return (
    <div className="st-run">
      {rows.map((row, r) => (
        <div className="st-run__row" data-dir={r === 0 ? "fwd" : "back"} key={r}>
          <div className="st-run__track">
            {[0, 1].map((copy) =>
              row.map((c) => (
                <span
                  className="st-card"
                  key={`${copy}-${c.src}-${c.label}`}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  <img src={c.src} alt="" loading="lazy" decoding="async" />
                  <i className="st-card__label">{c.label}</i>
                </span>
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* the picture layer for a section, and the plate behind it. Kept in one
   place so a stage is a single line in the section below and adding one
   is a case here rather than an edit inside the loop. */
function Stage({ section }: { section: Section }) {
  const frames = section.frames ?? [];
  switch (section.stage) {
    case "wall":
      return <Wall frames={frames} />;
    case "title":
    case "end":
      return <Poster frames={frames} />;
    case "reel":
      return <Reel frames={frames} />;
    case "steps":
    case "showcase":
      /* both of these carry their pictures in the reading column rather
         than behind it - the steps because they are a diagram and the
         showcase because it is the work, and work laid behind a scrim
         is a background. The plate is all the stage has. */
      return null;
    default:
      return <Strip frames={frames} />;
  }
}

/* The picture the plate is blown up from. Every section has one, but
   not every section keeps it in `frames`. */
const groundOf = (s: Section) =>
  s.frames?.[0] ?? s.steps?.[0]?.art ?? s.showcase?.[0]?.src ?? "peak-content.jpg";

/* ---------- the page ----------------------------------------------- */

export default function SeriesSections() {
  /* the strip is the only stage with a side to be on, and it runs three
     times. Counted separately from the section index so the three of
     them alternate with each other rather than with whatever stage
     happens to sit between them - two strips four screens apart on the
     same side read as a mistake, and the count is what stops that. */
  let strips = 0;

  return (
    <div className="st-story">
      {SECTIONS.map((s, i) => {
        const isStrip = s.stage === "strip";
        const side = isStrip && strips++ % 2 === 1 ? "left" : "right";

        /* the highlight lands on whichever of the two carries the word,
           and only on one of them. On the title and end cards the
           sentence sets the thing up and the accent is in the mark
           below it; everywhere else it is in the line. Highlighting
           both would be the same word blocked twice on one screen. */
        const line = s.lines.join(" ");
        const inLine = Boolean(
          s.accent && line.toLowerCase().includes(s.accent.toLowerCase()),
        );

        return (
          <section
            className="st-beat"
            id={`section-${s.id}`}
            key={s.id}
            data-stage={s.stage}
            data-side={side}
            data-warm={s.warm ? "" : undefined}
          >
            <div className="st-beat__stage">
              <img
                className="st-fill st-bg"
                src={ART(groundOf(s))}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />

              <Stage section={s} />

              <span className="st-scrim" aria-hidden="true" />

              {/* the grade. kink.jpg is film grain - what makes stills
                  from different shoots read as one picture - and
                  streaming.jpg is a warm leak, spent only on the three
                  sections after the turn. */}
              <img
                className="st-grain"
                src={ART(TEXTURE.grain)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              {s.warm && (
                <img
                  className="st-leak"
                  src={ART(TEXTURE.leak)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
              )}

              {/* the letterbox, parked at the hairline the live page
                  rests it at. Nothing opens or shuts it here. */}
              <span className="st-gate st-gate--t" aria-hidden="true" />
              <span className="st-gate st-gate--b" aria-hidden="true" />
            </div>

            <div className="wrap st-beat__type">
              <div className="st-beat__words">
                {/* section 3 only - the paragraph that runs before the
                    line, because that is the order it was written in */}
                {s.lead && <p className="st-beat__lead">{s.lead}</p>}

                <h2 className="st-beat__line">
                  <Hi text={line} accent={inLine ? s.accent : undefined} />
                </h2>

                {/* The poster-scale second line. On the end card it is
                    the client's last sentence, which is a question with
                    a button's job - so there it is wrapped in the link
                    rather than restated under it as a second control.
                    One set of words, one thing to press. */}
                {s.mark &&
                  (s.cta ? (
                    <a className="st-beat__mark st-beat__mark--cta" href={s.cta.href}>
                      <Hi text={s.mark} accent={inLine ? undefined : s.accent} />
                      <i aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="st-beat__mark">
                      <Hi text={s.mark} accent={inLine ? undefined : s.accent} />
                    </p>
                  ))}

                {/* the chips, above or below the body copy depending on
                    where the client put them - see `cuesLead` on the
                    Section type */}
                {s.cues && s.cuesLead && <Cues items={s.cues} />}

                {/* wrapped, because two stages need the body copy to be
                    one block they can place - the title card sets it as
                    a column beside the name rather than under it, and a
                    run of loose <p>s cannot be put in a grid area. */}
                {s.copy && (
                  <div className="st-beat__body">
                    {s.copy.map((p) => (
                      <Copy key={p.slice(0, 40)} text={p} emphasis={s.emphasis} />
                    ))}
                  </div>
                )}

                {s.cues && !s.cuesLead && <Cues items={s.cues} />}

                {s.steps && <Steps items={s.steps} />}
              </div>
            </div>

            {/* full bleed, outside the reading column: the rows are
                wider than the page and are meant to run off both
                edges. */}
            {s.showcase && <Run cards={s.showcase} />}

            {s.slate && (
              <span className="st-beat__slate" aria-hidden="true">
                {/* the client's own numbering. Section 1 is the title
                    card at the head of the route, so these start at 2. */}
                <b>{String(i + 2).padStart(2, "0")}</b>
                {s.slate}
              </span>
            )}
          </section>
        );
      })}
    </div>
  );
}
