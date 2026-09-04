/* ============================================================
   THE SERIES TAB - everything it says, in one place.

   Same one-file-per-route convention as lib/about-content.ts and
   lib/blog-content.ts. Nothing in components/Series*.tsx writes copy.

   ---- where this copy comes from ----

   The client's own rewrite, sent as "Final Version - Micro Series": ten
   numbered sections, replacing the fourteen-beat cut that was read
   straight off the deck ("The Continuity Kink", 20 slides). It is
   shorter, it is in their voice, and it is transcribed here WORD FOR
   WORD - including the three lines they sent in capitals, which are the
   chapter markers of the new cut and are set as they were written.

   Nothing on this page is a line somebody wrote to fill a slot: every
   word here is the client's.

   The old fourteen-beat story is not deleted: it is in lib/series-v1.ts
   and still renders at /series-1, which is off the nav. This file
   re-exports it at the foot so those three components did not have to
   change their imports.

   ---- what the pictures are ----

   Two folders, and the difference matters.

   public/assets/series/ is lifted from the client's own deck. It is
   their reference rather than their licence, and it stands in for
   series footage that does not exist yet - the mood of the argument,
   not the work.

   public/assets/work/ is the real thing: campaigns SoCheers actually
   made, the same stills the Work tab runs on. Two sections earn them
   and only those two use them - the credentials section, where the
   claim is "we build campaigns for the shows that taught the world how
   to binge" and the proof is the Netflix and JioHotstar titles, and the
   showcase, which the brief asks for by name ("rapid visual sequence of
   actual SoCheers work"). Everywhere else the deck stills stay, because
   a page arguing for a format should not illustrate every sentence with
   a campaign that is not in that format.

   ---- what is still open with the client ----

   1. RAYMOND. The brief names "prava ip, raymond ip, etc" for the
      showcase. Prava is in the tree (public/assets/work/pinned) and is
      the first card. Raymond is not - it is still a pending tile on the
      Work tab (see WORK_ASSETS in lib/work-content.ts) and there is no
      frame of it anywhere in the repo. So the showcase runs the work
      that exists rather than drawing a grey box with a brand name on
      it; add Raymond to PHONES below the day a vertical cut of it
      lands and it becomes a sixth handset.
   2. THE EPISODE LINKS. REELS at the foot of this file still has no
      live post URLs. Until it does the tiles are not links and the line
      promising that they open Instagram does not render.
   3. SERIES FOOTAGE. There is none in the tree. The two clips on the
      abundance wall are from the About shoot and read as texture at
      tile size; they are the only moving frames on the page.
   ============================================================ */

/* The name of the thing. The decks disagreed - the older one is "The
   Re-Wiring", the newer one "The Continuity Kink" - and the rewrite
   settles it: section 4 names the behaviour "the continuity kink", so
   that is the name, and this is the single place it is spelled. */
export const CONCEPT = {
  title: "The Continuity Kink",
  short: "Continuity Kink",
  alt: "The Rewiring",
} as const;

/* ------------------------------------------------------------------
   SECTION 1 - THE TITLE CARD.

   The client's first section is one sentence and nothing else, which is
   exactly what a cold open is - so it is staged the way a streamer
   stages the first frame of a new series: one plate, held full bleed
   and pushed back, and the line set small and centred in the middle of
   it. Nothing else is on the screen.

   What came off it, and why. The collage - three frames overlapping on
   a twelve-column field - was a poster, and a poster is the thing you
   see BEFORE you press play. The opening frame of an episode is one
   picture. The slate over the title ("A SoCheers Original") and the
   scroll cue went with it for the same reason: a title card that
   labels itself and then asks you to scroll is a web page wearing a
   title card, and the whole point of the beat is the two seconds where
   the screen is only the sentence.

   The highlighter block came off the last word too. It is the page's
   device and it stays on the sections below, where it marks a word
   inside a paragraph; on the opening frame it was a red bar on the one
   screen that is supposed to be quiet.

   The still is the wall's own first frame, so the card and the section
   under it read as one reel rather than as a cover glued onto a page.
   ------------------------------------------------------------------ */
export const HERO = {
  line: "Welcome to the peak content era.",
  /* one plate, full bleed. open-wide.jpg is the widest still in the
     folder and the only one that is a room rather than a face, which is
     what an opening frame has to be - a face at that scale is a
     portrait and the sentence is then a caption on somebody. */
  still: "open-wide.jpg",
} as const;

/* The <meta> description. Not on the screen anywhere, so it is written
   for a search result rather than lifted off a section - and it is the
   page's own claim, in the client's words, out of sections 7 and 6. */
export const META_DESCRIPTION =
  "We don't make more content. We design reasons to come back. The micro-series: 20-60 second episodes built around one recurring world, from the agency that builds campaigns for the platforms that taught the world how to binge.";

/* ------------------------------------------------------------------
   THE TEXTURE PLATES.

   Two files in public/assets/series/ are not photographs and were never
   meant to be used as frames: kink.jpg is a sheet of film grain and
   streaming.jpg is a warm light leak. Both were once wired up as
   full-bleed stills, which is why two sections rendered as an empty
   grey screen and an empty orange screen.

   They are useful - just as grade, over a composition, not as one.
   Every section lays the grain over itself, and the leak is spent on
   the three after the turn, so the answer looks like a warmer room than
   the problem.
   ------------------------------------------------------------------ */
export const TEXTURE = {
  grain: "kink.jpg",
  leak: "streaming.jpg",
} as const;

/* ------------------------------------------------------------------
   THE STAGES.

   A section's `stage` is how it is built. Seven of them for ten
   sections, which is the change the rewrite forced: the old cut ran one
   staging fourteen times on the theory that repetition was the test,
   and at fourteen screens it was. At ten it is not - three of the new
   sections are not arguments at all (a process, a showreel, a call to
   action) and cannot be a sentence beside four letterbox frames.

   So the FRAME is what repeats now - the graded plate, the scrim, the
   grain, the letterbox gate, the type at one size in one column - and
   what changes inside it is only the picture layer:

     wall     - many windows at once. The abundance section: one
                photograph of abundance is not abundance, twelve windows
                arriving together is.
     strip    - the default. Four letterbox frames cascading down the
                half of the screen the sentence is not in.
     title    - the poster. Bands stacked full width, the sentence at
                reading size high in the frame, and the name of the
                thing set enormous across the middle of them.
     reel     - a row of verticals, phone-shaped, for the section that
                describes what a 20-60 second episode is.
     steps    - the client's "sideblocks display": four numbered blocks,
                each with its own frame.
     showcase - two rows of real work travelling in opposite directions.
                The brief asks for a rapid visual sequence; this is the
                only thing on the page that moves on its own.
     end      - the title card's construction again, closing on the CTA.
                The page opens and closes on the same shape, which is
                the rhyme the last section is claiming.

   Adding a stage means a renderer in components/SeriesTestStory.tsx and
   a block in app/series/series.css, in that order.
   ------------------------------------------------------------------ */
export type Stage =
  | "wall"
  | "strip"
  | "title"
  | "reel"
  | "steps"
  | "showcase"
  | "end";

export type Step = {
  no: string;
  title: string;
  body: string;
  art: string;
};

export type Phone = {
  id: string;
  /* the brand, spelled the way lib/work-content.ts spells it */
  label: string;
  /* one line under the handset - what the episode is, not what it did */
  note: string;
  /* what stands in the screen until the cut lands. A still from the
     piece, held under the placeholder's sweep. */
  poster: string;
  /* the vertical cut, when it exists. Drop the file in and the screen
     stops being a placeholder - nothing else has to change. See
     components/SeriesPhones.tsx. */
  film?: string;
  /* the time on the status bar. Different on each handset because five
     phones reading 9:41 at once is one phone photographed five times. */
  clock: string;
};

export type Section = {
  id: string;
  stage: Stage;
  /* a paragraph that runs BEFORE the display line. One section needs it:
     the client's section 3 sets its punch up with a long sentence and
     lands it afterwards, and reordering them so the big type comes first
     would be rewriting their copy with CSS. */
  lead?: string;
  /* the display line, one <h2>, split into the lines it should break on */
  lines: string[];
  /* the second line, set at poster scale under the first. The name on the
     title card, the ask on the end card. */
  mark?: string;
  /* the word inside `lines` or `mark` that takes the highlighter block.
     Matched case-insensitively, first occurrence only. */
  accent?: string;
  /* body paragraphs, in the order the client wrote them */
  copy?: string[];
  /* Phrases out of `copy` to lift. Matched rather than written, so a
     paragraph stays one continuous piece of the client's text and the
     emphasis is a way of setting it - nothing here is moved, cut, or
     repeated, and a string that does not match renders as ordinary body
     copy rather than throwing.

     There are two ways one gets set and the copy decides which, not a
     flag: a phrase that runs to the END of its paragraph takes its own
     line, because there is nothing after it to strand. A phrase inside
     a sentence is marked where it stands, because breaking there would
     leave the rest of the sentence hanging on the next line. See
     Copy() in components/SeriesSections.tsx. */
  emphasis?: string[];
  /* short phrases set as chips rather than run into a paragraph - the
     platform names, the list of things an episode leaves behind. Each
     item is already a complete phrase in the client's copy, so setting
     them apart changes the layout and not a character of the text.

     `cuesLead` is where they sit, and it is not a design choice: the
     client wrote the platform names immediately after the line they
     belong to and the episode's leftovers after the paragraph that sets
     them up, so the two runs of chips sit in different places for the
     same reason - that is the order the words were written in. */
  cues?: string[];
  cuesLead?: boolean;
  frames?: string[];
  warm?: boolean;
  steps?: Step[];
  /* section 9 - the five handsets. The showreel is a phone screen
     because that is the screen these episodes are watched on, so the
     evidence is shown in its own frame rather than as a row of boards.
     See PHONES below. */
  phones?: Phone[];
  cta?: { label: string; href: string };
};

/* ------------------------------------------------------------------
   THE WALL - section 2's twelve windows.

   Every photograph in the series folder, once each, and that is the
   point of the section: the line over it is "There is more to watch
   than ever", so the wall is the whole library rather than a selection
   out of it. It is also what keeps the rest of the page honest - a
   still that has already been a window here reads as a frame being
   pulled BACK out of the pile when a later section spends a whole band
   on it, which is the opposite of a repeat.

   ---- what came off, and what is still missing ----

   Two of the twelve used to be film: culture-christmas.mp4 at 4 and
   culture-traditions.mp4 at 9, both lifted from the About shoot. They
   are the SoCheers team - an office birthday cake and the full-company
   Diwali photograph - and they cannot be on this wall. The section is
   an argument about how much there is to watch; a picture of the people
   making it answers a question nobody asked, and the group shot in
   particular reads as an About page that has wandered into the middle
   of a story.

   Taking them off costs the wall the thing the old note was proud of:
   there is no motion on it any more, and a wall about endless streams
   is now twelve stills. That is the right trade against putting the
   team on it, but it is a trade. Two clips of actual series footage
   dropped back in at 4 and 9 would settle it - far enough apart that
   neither is beside the other, close enough that one is always near the
   eye. See isFilm(): a tile takes an .mp4 without any other change.

   The order is worked rather than alphabetical. The two phone-in-the-
   dark stills sit at 3 and 6 and the three rooms at 4, 8 and 12, so no
   two windows of the same kind are neighbours - a wall of variety that
   accidentally pairs its lookalikes reads as a wall with duplicates on
   it.

   The texture plates are deliberately not in here. A sheet of grain, an
   orange gradient, a torn paper band and a white collage among twelve
   photographs read as windows that had failed to load, which on a wall
   arguing for abundance is the worst possible tile to have at all.
   ------------------------------------------------------------------ */
const WALL = [
  "peak-content.jpg",
  "episodes.jpg",
  "night-scroll.jpg",
  "wardrobe.jpg",
  "chaos.jpg",
  "retention.jpg",
  "behind-screen.jpg",
  "open-tall.jpg",
  "binge.jpg",
  "noise.jpg",
  "micro-series.jpg",
  "open-wide.jpg",
];

/* ------------------------------------------------------------------
   THE WORK, for the two sections that earn it.

   Rooted paths, so they sit in the same arrays as the deck stills
   without the caller having to know which folder a frame came from -
   see ART at the foot of this file.
   ------------------------------------------------------------------ */
const W = (file: string) => `/assets/work/${file}`;

/* The four titles behind the binge claim. All wide, all from the
   platforms named in the sentence above them, so the claim and the
   evidence are on one screen.

   The fourth used to be dhurandhar-2.jpg, and it is off the strip: that
   file is a case-study board - a phone render on black with the result
   set beside it in display type - and the other three are frames out of
   the work. A render among stills reads as a slide someone pasted in,
   and it is the one band on the section whose subject is a mockup of a
   screen rather than what was on the screen.

   Its first replacement was netflix-mi-srh.jpg, the key art from the
   same campaign as bands 1 and 3, and it went the same way: three of
   four frames on one campaign is not a credit list, and the key art is
   a red poster among graded stills.

   made-in-titan.jpg is here on its picture rather than its platform. It
   is a letterboxed film still in the same register as special-ops-2,
   which is the only other frame on the strip that looks like it came
   out of something you would watch - and the band is doing that job,
   not naming a title. It is worth being straight about the trade: it is
   a Titan brand film, so the fourth piece of evidence under a sentence
   about "the shows that taught the world how to binge" is not a show.
   See the note in SECTION 6. */
const RECEIPTS = [
  W("pinned/netflix-mi.jpg"),
  W("wall/special-ops-2.jpg"),
  W("pinned/netflix-srh.jpg"),
  W("wall/made-in-titan.jpg"),
];

/* ------------------------------------------------------------------
   THE FIVE HANDSETS - section 9.

   The brief for this section is "a rapid visual sequence of actual
   SoCheers work", and the earlier pass answered it with eighteen boards
   travelling in two directions. The boards were the problem: a landscape
   card is a frame from a campaign film, and every sentence on this page
   before it has been about vertical episodes watched on a phone. So the
   evidence is shown on the screen it is made for - five handsets, each
   holding one piece, running.

   The cuts are not in the tree yet. Until they are, `film` is left off
   and the screen holds the still under the placeholder's sweep, which
   is the truth about the state of it rather than a badge saying so.
   Adding a cut is one line: put the vertical file's path in `film`.

   Five and not six: an odd count has a middle, and the arc these are
   laid on needs one.
   ------------------------------------------------------------------ */
export const PHONES: Phone[] = [
  {
    id: "prava",
    label: "Prava",
    note: "Micro-series IP",
    poster: W("pinned/prava.jpg"),
    clock: "9:41",
  },
  {
    id: "netflix-mi",
    label: "Netflix × MI",
    note: "Episodic, in season",
    poster: W("pinned/netflix-mi.jpg"),
    clock: "10:08",
  },
  {
    id: "special-ops",
    label: "JioHotstar",
    note: "Special Ops 2",
    poster: W("wall/special-ops-2.jpg"),
    clock: "11:23",
  },
  {
    id: "boat",
    label: "boAt × Marvel",
    note: "Character-led drop",
    poster: W("wall/boat.jpg"),
    clock: "7:56",
  },
  {
    id: "croma",
    label: "Croma",
    note: "Long-running format",
    poster: W("wall/croma-dreams.jpg"),
    clock: "8:30",
  },
];

/* ------------------------------------------------------------------
   THE STORY - the client's ten sections, in their order.

   Section 1 is the title card above; these are 2 through 10.

   The two most worked compositions sit at 4 and 10 - the section that
   names the thing and the section that asks for the business. That is
   the same spacing the old cut used for its title cards and for the same
   reason: they are the sections that land something, and they need
   quieter screens between them to read as moments rather than as a
   showreel.
   ------------------------------------------------------------------ */
export const SECTIONS: Section[] = [
  {
    /* SECTION 2. Staged as the wall because the line is literally about
       abundance, and because the last sentence of it - the one about
       going back to the same things - is the hinge the whole page turns
       on. It reads as that standing alone under a screen full of windows
       and does not when it is buried in the paragraph above it. */
    id: "more",
    stage: "wall",
    lines: ["There is more to watch than ever."],
    copy: [
      "More to scroll. More to buy. More to follow. Every screen is full. Every feed keeps going.",
      "And somehow, we still keep going back to the same things.",
    ],
    frames: WALL,
  },
  {
    /* SECTION 3. The one section that runs its paragraph FIRST: the
       client's copy sets the behaviour up at length and then lands two
       short sentences on it, and those two sentences are the display
       line. See `lead` on the Section type.

       The four frames are as close as the deck stills get to the four
       things the sentence lists: a lit phone in the dark, a screen being
       watched, a run of episodes, a room behind a screen. */
    id: "next",
    stage: "strip",
    lead:
      "You'll sit through twelve episodes of a world you barely know, the same blinkit order you'll place in less than 10 seconds, you'll follow someone cleaning their house and giving you an ASMR and watch someone else's baby growing up on the internet, not because you're bored, but because they built something that continues.",
    lines: ["The brain isn't looking for another surprise.", "It's looking for what comes next."],
    accent: "what comes next.",
    frames: ["night-scroll.jpg", "binge.jpg", "episodes.jpg", "behind-screen.jpg"],
  },
  {
    /* SECTION 4 - THE TITLE CARD, and the moment the page is built
       around. Three bands full width, the setup line at reading size
       high in the frame, and the name of the thing set enormous across
       the middle of them with the block on its last word.

       Three bands, not five: a band is as wide as the column and as tall
       as its share of one screen, so every frame added crops every frame
       already there - see the note on `frames` below for which three
       survive that crop and which one did not. */
    id: "kink",
    stage: "title",
    lines: ["There's a name we've given to this behaviour."],
    mark: "the continuity kink.",
    accent: "kink.",
    copy: [
      "It's the itch you get when something knows it will continue. We started liking things that already had a little history.",
      "A face we knew. A joke we remembered. A show we'd already spent six hours with. You didn't need the introduction. You already knew the world and You keep watching because there is more to know.",
    ],
    emphasis: ["You keep watching because there is more to know."],
    /* Was peak-content.jpg on top - the eye, in extreme close-up. It is
       the strongest still in the folder and the worst possible one for
       this stage: a band is as wide as the screen and a third as tall,
       and a face shot that tight cropped to that shape is not a face,
       it is a red wash with nothing in it. The tallest band is the one
       the reader looks at first, so it went to a frame that survives a
       wide crop. All three do - an interior that reads across its whole
       width, a phone in the dark, the format's own still.

       binge.jpg and night-scroll.jpg were two of these three and both
       were also two of section 3's four, one screen earlier. Two frames
       repeating across consecutive sections is the thing that made this
       run feel like it was shot with four photographs; they stay on
       section 3, where the copy names what is in them, and this stage
       takes wardrobe and retention instead. Sections 3, 4 and 5 now
       share no still with each other at all. */
    frames: ["wardrobe.jpg", "retention.jpg", "micro-series.jpg"],
  },
  {
    /* SECTION 5. The client's first capitalised line, and the turn from
       what the audience does to what brands do about it. Staged as the
       plain strip and framed with the noise stills - the pile the
       paragraph is describing. */
    id: "job",
    stage: "strip",
    lines: ["AND THAT CHANGES THE JOB OF CONTENT."],
    /* Five paragraphs in the client's copy, set as four. "Nothing wrong
       with any of that." is the concession ON the pile the sentence
       before it describes, not a beat of its own - standing alone it
       read as a third short line in a stack of short lines. It is joined
       to the sentence it answers. No word is changed, cut or reordered;
       one paragraph break is. */
    copy: [
      "The feed is full of brands trying to win the next three seconds.",
      "Another trend, another static, another Reel that starts and ends before you've had time to care. Nothing wrong with any of that.",
      "But if every piece starts from zero, the audience has to start from zero too.",
      "And that's a damn slow way to retain people on the internet.",
    ],
    /* the condition and its cost are one sentence and one mark - the
       whole paragraph lifts onto its own line */
    emphasis: ["But if every piece starts from zero, the audience has to start from zero too."],
    /* micro-series.jpg was the fourth and it has gone to section 4,
       which is where the format's own still belongs - this section is
       the pile, not the answer to it. open-tall.jpg takes the slot: an
       empty screening room under "a damn slow way to retain people" is
       the paragraph's last sentence with the lights left on. */
    frames: ["noise.jpg", "chaos.jpg", "peak-content.jpg", "open-tall.jpg"],
  },
  {
    /* SECTION 6 - THE RECEIPTS, and the first section that gets real
       work in its frames. The sentence names the platforms; the four
       bands are the titles.

       Standing gap: the cues name Netflix, Prime and Hotstar, and the
       four frames are two Netflix, one JioHotstar and one Titan brand
       film, because RECEIPTS is fishing in a library that has no Prime
       title and exactly one Hotstar still in it. A wide frame from a
       Prime show is the missing asset and it replaces the fourth band
       outright; a second Hotstar one would earn the third.

       The platform names are set as chips rather than run into the
       sentence. They are three one-word sentences in the client's copy
       and they read as a credit list, which is what they are. */
    id: "receipts",
    stage: "strip",
    lines: ["We build campaigns for the shows", "that taught the world how to binge."],
    cues: ["Netflix.", "Prime.", "Hotstar."],
    cuesLead: true,
    copy: [
      "We know what makes someone press \"Next Episode\" because we've spent years building that exact moment.",
      "Then we started wondering why brands don't design for the same itch.",
      "So we tried it. It worked.",
    ],
    frames: RECEIPTS,
  },
  {
    /* SECTION 7 - the format, and the first warm screen. Everything
       before this is graded cold; the leak sits over this section and
       the two after it, so the answer looks like a different room to the
       problem.

       Staged as the reel because the copy defines an episode by its
       length and its shape, and a row of phone-shaped verticals is that
       definition without a word of explanation. The five things an
       episode leaves behind are chips under the paragraph - five
       complete phrases in the client's copy, set as five. */
    id: "format",
    stage: "reel",
    warm: true,
    lines: ["We don't make more content.", "We design reasons to come back."],
    accent: "come back.",
    copy: [
      "The format is called micro-series. A series of 20-60 second episodes, built around one recurring world, format or story. Every episode has something worth watching and every episode leaves something behind.",
    ],
    /* both inside the sentence rather than at the end of it, so both are
       marked where they stand: the format's own definition, and the
       promise made about every episode of it */
    emphasis: ["20-60 second episodes", "Every episode has something worth watching"],
    cues: ["A question.", "A clue.", "A character.", "A running joke.", "A reason to return."],
    frames: [
      "mokai-1.jpg",
      "reel-1.jpg",
      "mokai-2.jpg",
      "reel-2.jpg",
      "mokai-3.jpg",
      "reel-3.jpg",
      "mokai-1.jpg",
      "reel-2.jpg",
    ],
  },
  {
    /* SECTION 8 - the client's "sideblocks display", verbatim: four
       numbered blocks, a title and a line each. The only section on the
       page that is a diagram rather than a picture with a sentence on
       it, so it is the only one whose frames are small and equal - four
       stills the same size in a row is a process; four different sizes
       is a collage, and a collage does not read as steps.

       The four stills are the client's own, dropped into
       public/assets/series/ named for the step each one belongs to.
       They replace three borrowed from the home page's service buckets
       (a cow, a red hat in a black crowd, a camera-head) and the about
       page's crowd - all four of which were pictures of something else
       standing in for a step. These are the work itself: the Krafton
       film for BRAND, the crew reading pages in a car park for
       STRATEGY, the operator on the camera for FILMS, the floor mid-
       take for TOGETHER. A process block illustrated with the process
       is the one section on the page where stock was doing real damage.

       They are also a different shape to what they replaced - three
       portrait, one landscape, against a card that was 4:3. The card is
       square now and each still carries its own focal point in
       series.css; see the note there. */
    id: "process",
    stage: "steps",
    warm: true,
    lines: ["THEN WE MAKE THE THING."],
    steps: [
      {
        no: "01",
        title: "BRAND",
        body: "You bring the brief, ambition and territory you want to own.",
        art: "/assets/series/Brand.png",
      },
      {
        no: "02",
        title: "STRATEGY",
        body: "We find the world and build the narrative.",
        art: "/assets/series/Strategy.png",
      },
      {
        no: "03",
        title: "FILMS",
        body: "We turn that spine into episodes, characters, visual language and production.",
        art: "/assets/series/Films.png",
      },
      {
        no: "04",
        title: "TOGETHER",
        body: "We make, release, learn, build on what lands and keep the story moving.",
        art: "/assets/series/Together.png",
      },
    ],
  },
  {
    /* SECTION 9 - the showreel the brief asks for by name, held on five
       handsets. Everything the page has argued up to here is about
       vertical episodes watched on a phone, so the proof is shown on
       one rather than as a row of landscape boards.

       No sentence over the pictures and no scrim across the middle: this
       section IS the work, and type laid over it would be the one place
       on the page where the work is a background. The line sits above
       the handsets instead. See PHONES above and
       components/SeriesPhones.tsx. */
    id: "proof",
    stage: "showcase",
    warm: true,
    lines: ["AND THIS IS WHAT IT CAN LOOK LIKE."],
    phones: PHONES,
  },
  {
    /* SECTION 10 - THE END CARD. The same construction as the title
       card and deliberately so: the page opened on a composition and
       closes on one, and the reader is meant to feel the rhyme - which
       is what the sentence is claiming.

       The client's last line is a question with a button's job, so it is
       the button. It goes to /contact rather than opening a mail client,
       same as every other ask on the site. */
    id: "yours",
    stage: "end",
    lines: ["You made it to the end and hence the concept seems to be right."],
    mark: "NOW, LET'S MAKE YOURS ?",
    /* no accent. The last screen is one frame and one centred block, and
       a highlighter block on the button is a second thing to look at on
       a card whose whole job is the one thing to press. */
    frames: ["open-wide.jpg"],
    cta: { label: "NOW, LET'S MAKE YOURS ?", href: "/contact" },
  },
];

/* ------------------------------------------------------------------
   THE FIRST PASS, re-exported.

   /series-1 is the fourteen-beat cut, off the nav and noindexed, and it
   reads its story from lib/series-v1.ts now. These names are passed
   through here so components/SeriesStory.tsx, SeriesCrossers.tsx and
   lib/series-motion.ts did not have to be touched by a copy rewrite that
   has nothing to do with them.

   Nothing on /series imports any of it.
   ------------------------------------------------------------------ */
export {
  BEATS,
  CROSSERS,
  PLATE_STRIP,
  type Beat,
  type Shot,
  type Crosser,
  type Pose,
} from "@/lib/series-v1";
/* ------------------------------------------------------------------
   THE FEED - component two.

   Thumbnails that link out, and deliberately not Instagram's own embed.
   The official embed is a third-party iframe plus embed.js per post: on a
   rail of eight that is eight iframes, eight scripts and a tracker on a
   page whose entire argument is that it holds attention for ninety
   seconds. A thumbnail and an <a> is the same content, one image, and it
   keeps the page's own scroll.

   ---- what changed here ----

   Every tile used to carry a brand name reading "PENDING - Amul" and a
   black "PLACEHOLDER" badge in its corner, and the section promised that
   each frame opens the post on Instagram while every href was "#". Three
   different ways of showing a reader the page is not finished.

   So: `href` is optional now. A tile without one is not a link, carries
   no badge, and says nothing it cannot do - it is a frame with an
   episode number on it, which is true. The line under the heading that
   promises the link only renders once at least one tile has a real URL.

   Adding the client's list is one line per tile: put the post URL in
   `href` and the still from that post in `thumb`. Nothing else has to
   change; the tiles become links, the promise appears under the heading,
   and `title` is there for the episode's own name when they send them.
   ------------------------------------------------------------------ */
export type Reel = {
  id: string;
  ep: string;
  thumb: string;
  href?: string;
  title?: string;
};

export const REELS: Reel[] = [
  { id: "r1", ep: "EP 01", thumb: "reel-1.jpg" },
  { id: "r2", ep: "EP 02", thumb: "reel-2.jpg" },
  { id: "r3", ep: "EP 03", thumb: "reel-3.jpg" },
  { id: "r4", ep: "EP 04", thumb: "mokai-1.jpg" },
  { id: "r5", ep: "EP 05", thumb: "mokai-2.jpg" },
  { id: "r6", ep: "EP 06", thumb: "mokai-3.jpg" },
  { id: "r7", ep: "EP 07", thumb: "reel-2.jpg" },
  { id: "r8", ep: "EP 08", thumb: "reel-3.jpg" },
];

export const FEED = {
  tag: "Straight from the feed",
  title: "Every episode, where it actually lives.",
  /* only rendered once REELS carries a real href - see SeriesFeed.tsx */
  note: "Each frame opens the post on Instagram.",
} as const;

/* Two ways out and no third: talk to us, or go and look at the production
   house. Tito Films sits at the foot of the page by the client's own
   instruction. */
export const SERIES_CTA = {
  lines: ["We'll build the episodes", "when you're ready."],
  copy:
    "If we can hold your attention over a concept for ninety seconds, imagine what a season does for your brand.",
  primary: { label: "Talk to us", href: "/contact" },
  /* Confirmed by the client. Points at the house's own site rather than
     the Instagram account it used to link to (@thisistheonefilms, which
     never matched the name anyway). */
  secondary: { label: "Tito Films", href: "https://www.titofilms.com/" },
} as const;

/* A frame is either a file in public/assets/series/ or an already-rooted
   path (the films above), so both can sit in the same array without the
   caller having to know which is which. */
export const ART = (file: string) =>
  file.startsWith("/") || file.startsWith("http") ? file : `/assets/series/${file}`;

export const isFilm = (file: string) => file.endsWith(".mp4") || file.endsWith(".webm");
