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

   ---- what the pictures are ----

   Two folders, and the difference matters.

   public/assets/series/ is lifted from the client's own deck. It is
   their reference rather than their licence, and it stands in for
   series footage that does not exist yet - the mood of the argument,
   not the work.

   Seven files in that folder are NOT off the deck and are named so you
   can tell at a glance - every one of them starts `series-`. They are
   Pexels stills, downloaded and committed to the repo rather than
   linked, because a page that hotlinks a stock host is a page with an
   outage in it. Pexels' licence covers commercial use with no
   attribution, so nothing on the screen has to credit them, but the
   ids are worth keeping: contact-sheet 10311958, filmstrip 32728014,
   media-wall 2977317, screen-wall 9681642, feed-grid 3797928,
   signage-night 4344739, empty-room 696407.

   They exist because the deck folder cannot say four of the things
   this page's copy says. Six of its twelve photographs are the same
   photograph - somebody in a dark room looking at a phone - so there
   was no frame of a sequence, no frame of accumulation, no frame of a
   feed full of brands and no frame of anything being empty. The rule
   they were bought under is the rule the rest of this file follows:
   one picture, one argument, and if an existing still already makes
   the argument it keeps the slot.

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
  /* now series-hero-red.jpg (Unsplash WiCvC9u7OpE): one silhouette in
     the dark in front of a curved wall of red screen pixels. The page's
     red, one viewer and a wall of content - darker and more dystopian
     than the popcorn-and-3D-glasses still it replaces, which stays in
     the tree for the Work tab. */
  still: "series-hero-red.jpg",
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
  label?: string;
  /* one line under the handset - what the episode is, not what it did */
  note?: string;
  /* the live reel. Set = the handset is a link that opens it. */
  href?: string;
  /* a filler handset: no label, no link, dimmed and soft */
  ghost?: boolean;
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
  /* the section's TWO frames are the same shot before and after, and
     the scroll gets from one to the other. Needs `frames` to be a pair,
     in that order, of two pictures that register.

     Only the title card sets it, and only because its still is the one
     on the page that has already happened: the man's face is drawn into
     the phone before the reader has read the line naming the behaviour.
     Under this flag the section is met with the frame before that, and
     he comes apart into the screen as it settles.

     A section without it - and a pair that has lost its second frame,
     and every reader who has asked for reduced motion - gets the
     ordinary poster and the still as it is. See
     components/SeriesPull.tsx for what sits between the two plates and
     app/series/series.css for where it sits. */
  pull?: boolean;
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

   Twelve windows at once, because the line over it is "There is more to
   watch than ever" and one photograph of abundance is not abundance.
   The wall is the pile the rest of the page reaches into - a still that
   has already been a window here reads as a frame being pulled BACK out
   of the pile when a later section spends a whole band on it, which is
   the opposite of a repeat. That only holds while the tile is small and
   the band is the still's ONE big appearance, which is the rule the
   rest of this file is now cut to.

   ---- the three frames that are not on it any more ----

   open-wide.jpg is the title card. It was tile 12, one screen after it
   had been held full bleed under the opening sentence, and it is the
   single most recognisable picture in the folder - a face in 3D glasses
   in a red cinema. A hero plate repeated as a thumbnail immediately
   under itself is not a pile being assembled, it is the same photograph
   twice, and it was the first thing anybody noticed about this run. The
   title card keeps it and the wall does not.

   open-tall.jpg went to section 5 and stays there. It is an empty
   screening room with a blank white screen in it - the only frame in
   the folder that is ABOUT nothing being on yet - and that is worth a
   whole band under "if every piece starts from zero" rather than a
   twelfth of a screen here.

   binge.jpg came off on its own account: it and night-scroll.jpg are
   both a person lying in the dark with a lit phone, shot from roughly
   the same height, and side by side on a wall arguing for variety they
   read as one picture printed twice. One of the two is enough. It is
   still in the tree and still on the Work tab - and night-scroll has
   since followed it off, in the pass noted inside WALL below.

   ---- and the three that took their places ----

   The folder's real problem is that six of its photographs are the same
   photograph: somebody in a dark room looking at a phone. That is fine
   as the page's register and useless as its whole vocabulary, so the
   three new tiles are the three things the section's own copy names
   that nobody had a frame of - "every screen is full" (a stacked wall
   of sets, all of them on), "more to buy, more to follow" (a grid of
   media stacked until it is wallpaper), and the feed itself (a wall of
   stills going out of focus as it runs away from the lens). All three
   are dense by construction, which is what a tile on this wall is for.

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

   The order is worked rather than alphabetical, and it is worked
   against the grid rather than against the list: the tiles run four
   across (three across under 900px - see .st-wall in series.css), so a
   frame's neighbours are the two beside it AND the one four along. The
   rule the order is kept to is that no two windows of the same KIND
   touch on either axis, because a wall of variety that accidentally
   pairs its lookalikes reads as a wall with duplicates on it.

   The three tmtw stills are placed to that rule and not just dropped
   into the slots they were asked for. They are all portraits of a
   person, so they are kept off each other's axes: 3 and 7 share a
   column but are four apart with tile 5 between them on the list and a
   whole row on the screen, 7 and 8 sit beside each other and are a wide
   warm room against a black portrait, and 3 and 8 only ever meet on the
   diagonal, which is not an edge. Nothing of the same kind touches.

   The texture plates are deliberately not in here. A sheet of grain, an
   orange gradient, a torn paper band and a white collage among twelve
   photographs read as windows that had failed to load, which on a wall
   arguing for abundance is the worst possible tile to have at all.
   ------------------------------------------------------------------ */
/* ---- the client's own tmtw stills ----
   Four files dropped into public/assets/series/ named for this section
   ("too much to watch") and numbered. They are the first pictures on
   this wall that were chosen FOR this wall rather than fished out of a
   folder that was shot for something else, and all three usable ones
   are the same kind of picture: a person with the pile happening to
   them, rather than a room with a lot in it.

   tmtw-2.jpg is not among them. It is a blank white 300x158 file - not
   a photograph at all - so it is in the tree, renamed with the others,
   and used nowhere. Tile 1 is the slot it is waiting for; see below.

   Renamed from "tmtw 1.jpg" etc. The spaces work, because a browser
   escapes them, but every path on this page is written by hand in this
   file and a filename that needs escaping is one that eventually gets
   typed wrong. */
const WALL = [
  /* 1 stays. The client marked it "you can replace that also" rather
     than naming it with the other three, and there are only three
     usable tmtw files for four slots, so the optional one is the one
     that keeps its window: peak-content.jpg is a macro of an eye and
     the strongest frame in the folder. It is also the natural home for
     tmtw-2.jpg the day a real picture lands under that name. */
  "peak-content.jpg",
  "episodes.jpg",
  /* 3 - was series-media-wall.jpg, a grid of media stacked to
     wallpaper. It went in as the frame for "more to buy" and it is a
     picture of THINGS; the tmtw stills are pictures of what the things
     do to somebody, which is the half of this section's argument the
     wall had none of. A face with the app icons printed down it, eyes
     rolled back, is the whole sentence in one window. */
  "tmtw-3.jpg",
  "wardrobe.jpg",
  /* 5, 7 and 12 are the three new windows, and they went into the three
     slots the phone-in-the-dark stills held: night-scroll, retention and
     the wall's copy of noise. Six photographs of somebody lit by a phone
     was the one duplicate this wall still had, and a wall arguing for
     abundance cannot be six versions of one picture. The two that are
     not needed anywhere else came off the page; noise.jpg keeps its band
     in section 5, where the sentence is about the scroll itself. */
  "consumer-attached-to-images.jpg",
  "series-screen-wall.jpg",
  /* 7 and 8 - the two the client picked out by position, and the pair
     that has now turned over twice.

     They were pixelated-man-watching-laptop.jpg and chaos.jpg, both
     pulled for the same reason: one is a conceptual portrait of a man
     dissolving into blocks beside a laptop, the other a long exposure
     of somebody holding his head, which at tile size reads as a
     headache. They were replaced with two stock frames of the pile
     itself - a packed supermarket aisle for "more to buy" and a black
     room of raised, lit phones for "more to follow" - and those are
     what came off here.

     The tmtw stills are better than both, and not because the stock was
     wrong: the aisle and the crowd were pictures of ABUNDANCE, and this
     section's last line is "we still keep going back to the same
     things", which is about a person and not a pile. tmtw-1 is a woman
     in a chair with her eyes shut and her whole feed coming apart in
     the air above her; tmtw-4 is a phone strapped over somebody's eyes
     on a cable. Those are the pile arriving at somebody, which is the
     half of the argument the wall was missing.

     series-aisle-full.jpg and series-crowd-phones.jpg stay in the tree,
     unused, as does the pixelated still and chaos.jpg. */
  "tmtw-1.jpg",
  "tmtw-4.jpg",
  "series-feed-grid.jpg",
  "behind-screen.jpg",
  "micro-series.jpg",
  "too-much-to-watch.jpg",
];

/* ------------------------------------------------------------------
   THE WORK, for the two sections that earn it.

   Rooted paths, so they sit in the same arrays as the deck stills
   without the caller having to know which folder a frame came from -
   see ART at the foot of this file.
   ------------------------------------------------------------------ */
const W = (file: string) => `/assets/work/${file}`;

/* The four frames behind the binge claim - and now, for the first
   time, four titles you can actually watch.

   ---- what came off ----

   Bands 1 and 3 were netflix-mi.jpg and netflix-srh.jpg - the Netflix x
   Mumbai Indians and Netflix x Sunrisers key frames. Both are real
   Netflix work and both are IPL: two of the four pieces of evidence
   under "the shows that taught the world how to binge" were cricket
   teams. Two passes after that put ads in the gap instead - a Netflix
   case-study board, then a Tito Films brand-film thumbnail - and an ad
   is not a show either. The sentence names shows, so the strip is
   shows.

   ---- what is there now ----

   series-mandala-murders.jpg and series-breathe.jpg. Both are the
   published landscape thumbnails for series Tito Films worked on - the
   production house credited at the foot of this page (see SERIES_CTA) -
   pulled off the films they list at titofilms.com/films:

     band 1  The World of Mandala Murders, Netflix
     band 3  Breathe: Into The Shadows, Prime Video

   They are thumbnails rather than frames on purpose. A thumbnail is the
   picture somebody chose to represent a show, and it arrives carrying
   the platform mark and the title - which is the difference between a
   picture that looks like television and a piece of evidence. On a
   strip whose whole job is receipts, that is the point.

   This also closes the gap this section has carried since it was
   written. The cues name Netflix, Prime and Hotstar; until now the
   frames could not answer for Prime at all, because public/assets/work
   has no Prime title in it. Band 3 is that answer, and the three cues
   and the three platforms on the strip are finally the same three.

   ---- the letterbox ----

   The thumbnails are 16:9 and the band is 21:9, so they are not cropped
   to fit: a cover crop takes the vertical middle and the vertical
   middle is exactly where the logo and the title are not. Each is set
   at full height in the centre of the band with a blurred, darkened
   copy of itself carrying the width - the same device .st-bg uses to
   stand this section's column in a room, turned inward on one frame.
   The band's own overscan (left:-9%, width:118% on .st-band img) trims
   about 128px a side and the padding is 190px, so nothing of the
   thumbnail is lost to it.

   ---- band 4 ----

   made-in-titan.jpg is the one frame left that is not a show. It is
   SoCheers' own work rather than a production credit, which is the
   argument for keeping it on a strip that is supposed to be evidence of
   what this agency has made - but it is a Titan brand film, and under a
   sentence about shows it is the weakest of the four. It is the next
   band to go if a series still from the work library turns up. */
const RECEIPTS = [
  "series-mandala-murders.jpg",
  W("wall/special-ops-2.jpg"),
  "series-breathe.jpg",
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
/* The three IPs sit in the middle and open their reels; the two outer
   handsets are unlabelled filler until more IPs land. */
export const PHONES: Phone[] = [
  {
    id: "filler-l",
    ghost: true,
    poster: W("wall/special-ops-2.jpg"),
    clock: "7:56",
  },
  {
    id: "prava",
    label: "Prava",
    note: "Micro-series IP",
    poster: W("pinned/prava.jpg"),
    href: "https://www.instagram.com/reel/DaiGcRnICTO/",
    clock: "9:41",
  },
  {
    id: "pantaloons",
    label: "Pantaloons",
    note: "Micro-series IP",
    poster: W("pinned/pantaloons-eoss.jpg"),
    href: "https://www.instagram.com/reel/DcnvyEdz6Tt/",
    clock: "10:08",
  },
  {
    id: "socheers",
    label: "SoCheers",
    note: "Micro-series IP",
    poster: "/assets/art/series-films.webp",
    href: "https://www.instagram.com/reel/DaKr2hWtFdk/",
    clock: "11:23",
  },
  {
    id: "filler-r",
    ghost: true,
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

       ---- the frames: one room, four times in a night ----

       This is the one section whose display line is about a SHAPE
       rather than about a feeling: "the brain isn't looking for another
       surprise, it's looking for what comes next". Four stills of four
       different people watching four different things is the exact
       opposite of that - it is four surprises - and that is what the
       section had, first as four unrelated photographs and then as a
       contact sheet standing in for the idea of a sequence.

       The four bands are now the sequence itself. Same bedroom, same
       bed, same window, four points in one night: lying down with the
       city still awake, propped up with the food that arrived since,
       sat on the edge of the bed at 04:30, and still there when the
       window has gone gold at 08:14. Nothing in the frame changes
       except how far the night has got - the clock, the litter, the sky
       - which is the argument the sentence under it is making: the
       reason to look at any one of these is the one after it.

       They are cut from the single stacked file the client supplied
       (what comes next.png) into night-01 through night-04, in that
       order, because the order IS the content here. Band 1 is also the
       plate - groundOf() in components/SeriesSections.tsx blows the
       first frame up and pushes it back - so the screen hangs inside
       the room the strip is about.

       What came off: the contact sheet and the film strip, which were
       standing in for a sequence the page did not have and now does,
       and episodes.jpg and behind-screen.jpg, which keep their windows
       on the wall in section 2. */
    id: "next",
    stage: "strip",
    lead:
      "You'll sit through twelve episodes of a world you barely know, the same blinkit order you'll place in less than 10 seconds, you'll follow someone cleaning their house and giving you an ASMR and watch someone else's baby growing up on the internet, not because you're bored, but because they built something that continues.",
    lines: ["The brain isn't looking for another surprise.", "It's looking for what comes next."],
    accent: "what comes next.",
    frames: ["night-01.jpg", "night-02.jpg", "night-03.jpg", "night-04.jpg"],
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
    /* chaos.jpg leads, and nothing new was bought to put here.

       The section names a behaviour and the behaviour is recognising
       something you have already seen: a face you knew, a joke you
       remembered, six hours you had already spent. There is exactly one
       photograph in the folder where a thing appears more than once
       inside its own frame - chaos.jpg, a man shot as a long exposure,
       so his head is in three places at the same time - and it had been
       spent as the second band of section 5, where the argument is
       about brands and the picture was doing nothing. It is the whole
       idea of this section in one still, so it is the first band here,
       which is both the widest column and the plate the section hangs
       in front of.

       retention.jpg came off to make room. It is a lit phone at a
       profile against black - a good frame, and one of six in this
       folder of somebody looking at a phone in the dark, which is the
       run this pass thinned out. It is off the page.

       chaos.jpg led this stage for that reason until the stage came
       down to a single frame - see the note on `frames` below.

       Section 3, this section and section 5 now share no still with
       each other, and the only overlap any of them has with the wall is
       a thumbnail. */
    /* One frame, not three. This is the screen that names the thing,
       and a name is a single image: three panels beside each other are
       three things to look at under a line that is about one. The one
       kept is the face being pulled into the light of the phone it is
       holding, which is the behaviour the section is naming rather than
       an illustration of it.

       chaos.jpg, screens-reach.jpg, wardrobe.jpg and micro-series.jpg
       all came off this stage. The last two keep their windows on the
       wall in section 2; the first two are off the page.

       The file is the widened copy of the still, not the still itself:
       a portrait photograph in a landscape frame runs out of picture at
       the sides long before the frame does, so its edge columns are
       carried out to meet it. See the note on the single band in
       app/series/series.css. */
    /* TWO frames, and the only pair on the page: the same man in the
       same room with the same phone in the same place, once with an
       ordinary face and once with the face already drawn into the
       screen. The deck sent the second. The first is what the section
       is met with, because a picture of the argument already finished
       is spent before the line naming it has been read.

       They register - both are 2.39:1 and the phone is at the same
       39.8% across both of them - which is what the layer between them
       is built on. See `pull` below and components/SeriesPull.tsx.

       The start plate is committed as a JPEG rather than as the PNG it
       arrived as. It is a night interior, the page lays film grain over
       everything anyway, and the PNG was 1.3MB against 113KB for the
       same picture - eleven times the weight of the frame it is
       crossing to. */
    frames: [
      "person-sucked-into-phone-wide-start.jpg",
      "person-sucked-into-phone-wide.jpg",
    ],
    pull: true,
  },
  {
    /* SECTION 5. The client's first capitalised line, and the turn from
       what the audience does to what brands do about it. Staged as the
       plain strip, and the four bands are read down rather than across:
       the copy runs from a full feed to an empty one and the pictures
       go with it. See the note on `frames`. */
    id: "job",
    stage: "strip",
    lines: ["And that changes the job of content."],
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
    /* Four bands that fall the way the paragraphs do, and this is the
       only section on the page where the order of the strip is carrying
       an argument rather than keeping lookalikes apart.

       1. series-signage-night.jpg. "The feed is full of brands trying
          to win the next three seconds" - a street at night under
          nothing but signs, every one of them lit, none of them looked
          at. It is also the plate, so the section opens standing in the
          pile it is describing. The old first band was noise.jpg, a
          person in bed with a phone, which is the AUDIENCE - the wrong
          half of the sentence, and the sixth picture of it on the page.
       2. noise.jpg, kept, one place down. "Another trend, another
          static, another Reel that starts and ends before you've had
          time to care" is what that scroll is, and it belongs under the
          feed rather than as the thing that introduces it.
       3. series-empty-room.jpg. One chair, one lamp, a bare floor and
          nothing else in the frame. This is the band that sits with
          "if every piece starts from zero" - the sentence the client
          set as the turn of the whole section - and the folder had
          nothing that was about emptiness on purpose. A room stripped
          back to one object is a blank slate that is still a place,
          which is what starting again actually looks like.
       4. open-tall.jpg, kept last, and now the only place it appears.
          An empty screening room with the screen still blank, under
          "a damn slow way to retain people on the internet" - the
          paragraph's last sentence with the lights left on.

       chaos.jpg has gone to section 4, where a man in three places at
       once is the point rather than decoration, and peak-content.jpg is
       off this strip and back to being the wall's first window - a
       macro of an eye read as a fifth thing to look at here and as the
       page's strongest frame everywhere else. */
    /* ---- and now the client's own four ----

       cjc-1 through cjc-4, named for this section ("changes job of
       content"). Four files for four bands, which is the first time
       this strip has not been assembled out of whatever the folder
       happened to have. They are also a different KIND of picture to
       everything above them - two are illustration and one is a
       collage, against a page that is otherwise photographs - and that
       is not a problem here: this is the section where the argument
       turns from what the audience does to what brands do about it, and
       a change of medium under the turn reads as a change of subject.

       This section no longer runs the shared cascade of four letterbox
       bands. It is a 2x2 field - see the SECTION 5 block at the foot of
       app/series/series.css for why, which is arithmetic rather than
       taste: portraits in a 21:9 window were showing a fifth of
       themselves while leaving 150px of the column empty beside them.

       The order is worked against that grid, and it is worked twice
       over - once for the copy and once for the field.

       For the copy: the paragraphs run from a full feed to an empty
       one, and reading order in a 2x2 is still 1, 2, 3, 4.

       1. cjc-4, top left. "The feed is full of brands trying to win
          the next three seconds" - a Times Square wall of billboards
          stacked to the sky, every surface sold, and a pavement full
          of people underneath with not one of them looking up. It is
          also the plate (groundOf takes frame 1), so the section is
          stood inside the thing it is describing, and it holds up
          blown up because the density is the whole picture. It
          replaced an AI street whose signage was garbled non-Latin
          type - unreadable text on the page's first frame of the
          section reads as an error rather than as noise.
       2. cjc-1, top right. "Another trend, another static, another
          Reel that starts and ends before you've had time to care" -
          a phone taped to the side of a head as a headphone and an
          obsolete handset in the other hand. Two devices, neither of
          them working, both still being used.
       3. cjc-3, bottom left. "But if every piece starts from zero, the
          audience has to start from zero too" - a collage whose
          fragments have nothing to do with each other: a sixties
          street, two planets, a giant photographer over the top of it.
          Nothing in it continues from anything else in it, which is
          what a feed of unrelated pieces looks like from inside.
       4. cjc-2, bottom right. "And that's a damn slow way to retain
          people on the internet" - a street where every sign is
          shouting a different slogan: FOCUS, BELIEVE, DREAM BIG, NO
          LIMITS, KEEP GOING. All of that noise, and not one of them
          has anyone's attention.

       For the field: cjc-4 and cjc-2 are both dense, busy streets and
       cjc-1 and cjc-3 are the quiet ones, so the two streets are put
       on the diagonal - top left and bottom right - rather than in the
       same row or the same column. Nothing of the same weight touches
       on an edge, which is the same rule the wall in section 2 is laid
       out to.

       What came off: series-signage-night.jpg, noise.jpg,
       series-empty-room.jpg and open-tall.jpg. The first and third were
       stock bought for this strip; all four stay in the tree. */
    /* ---- replaced again, for relevance ----

       The cjc set read as mood rather than as the sentences. Each tile
       is now the paragraph it sits beside, graded dark and a little
       dystopian to match the rest of the page, and no two of them are
       a person on a phone (Unsplash):

       1. job-1-feed  - a street at night buried under lit billboards.
                        The feed full of brands.
       2. job-2-reel  - a wall of CRTs, half of them glitching. Another
                        trend, another static, another Reel.
       3. job-3-zero  - one figure on a platform floating in the dark.
                        Starting from zero.
       4. job-4-slow  - a black and white corridor, everyone walking
                        away. The slow way to retain anyone.

       The cjc files stay in the tree. */
    frames: ["job-1-feed.jpg", "job-2-reel.jpg", "job-3-zero.jpg", "job-4-slow.jpg"],
  },
  {
    /* SECTION 6 - THE RECEIPTS, and the first section that gets real
       work in its frames. The sentence names the platforms; the four
       bands are the titles.

       The cues name Netflix, Prime and Hotstar, and as of the current
       RECEIPTS the frames answer for all three: Mandala Murders on
       Netflix, Special Ops 2 on JioHotstar, Breathe: Into The Shadows
       on Prime Video. The standing gap this note used to carry - no
       Prime title anywhere in public/assets/work - is closed by going
       to the production credit for it rather than to the work library.
       Band 4 is the one frame that is still not a show; see RECEIPTS.

       The platform names are set as chips rather than run into the
       sentence. They are three one-word sentences in the client's copy
       and they read as a credit list, which is what they are. */
    id: "receipts",
    stage: "strip",
    lines: ["We build campaigns for the shows", "that taught the world how to binge."],
    cues: ["Netflix.", "Prime.", "Hotstar."],
    cuesLead: true,
    /* Three paragraphs in the client's copy, set as two. "So we tried
       it. It worked." is the answer to the question the sentence before
       it asks, and standing alone two lines down it read as an orphan
       rather than as a landing - a five-word paragraph with a full
       paragraph's air over it. It is joined to the line it answers, so
       the wondering and the result sit on the same line and finish at
       the same edge. Same move, and the same rule, as SECTION 5 above:
       no word is changed, cut or reordered; one paragraph break is. */
    copy: [
      "We know what makes someone press \"Next Episode\" because we've spent years building that exact moment.",
      "Then we started wondering why brands don't design for the same itch. So we tried it. It worked.",
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
      /* was mokai-2.jpg, which is a static plate and read as an empty frame */
      "format-ep-3.jpg",
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
    lines: ["Then we make the thing."],
    steps: [
      {
        no: "01",
        title: "BRAND",
        body: "You bring the brief, ambition and territory you want to own.",
        /* WebP cuts of assets/series/*.png, made by scripts/build-art.mjs -
           re-run it after replacing a PNG */
        art: "/assets/art/series-brand.webp",
      },
      {
        no: "02",
        title: "STRATEGY",
        body: "We find the world and build the narrative.",
        art: "/assets/art/series-strategy.webp",
      },
      {
        no: "03",
        title: "FILMS",
        body: "We turn that spine into episodes, characters, visual language and production.",
        art: "/assets/art/series-films.webp",
      },
      {
        no: "04",
        title: "TOGETHER",
        body: "We make, release, learn, build on what lands and keep the story moving.",
        art: "/assets/art/series-together.webp",
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
    lines: ["And this is what it can look like."],
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
    mark: "Now, let's make yours ?",
    /* no accent. The last screen is one frame and one centred block, and
       a highlighter block on the button is a second thing to look at on
       a card whose whole job is the one thing to press. */
    /* The client's own end frame, and it retires open-wide.jpg from this
       slot.

       The old note above claimed the page opening and closing on the
       same composition was a rhyme the reader was meant to feel. It was
       not: it was the same photograph twice, the single most
       recognisable picture in the folder, and the second showing read
       as the page having run out rather than as a callback. That is the
       exact charge this file already levels at the wall in section 2
       for repeating a hero plate as a thumbnail, so it holds here too.

       ending.jpg is a red velvet curtain under a spotlight with a pair
       of red slippers left on the floor at the hem. It is the only
       picture in the folder that is about a thing having FINISHED, and
       the two objects in it do the section's two jobs at once: the
       curtain is the end of the show, and the slippers are somebody
       having been here and gone - which is what "you made it to the
       end" is describing. The construction still rhymes with the title
       card (one frame, one centred block, the same scrim), so the shape
       of the bookend survives without the picture being a repeat.

       It is a 1200x1500 portrait in a full-bleed landscape frame, so it
       is cropped hard and it does NOT take the 2x blow-up the title
       card's single band uses - see #section-yours in series.css. */
    /* REPLACED: the curtain read as a theatre prop, not as the end of
       anything. series-end-exit.jpg (Unsplash qR7XWhuTag0) is a red EXIT
       sign alone in the dark with two red eyes watching over it - the
       way out, in the page's own grade. ending.jpg stays in the tree. */
    frames: ["series-end-exit.jpg"],
    cta: { label: "Now, let's make yours ?", href: "/contact" },
  },
];

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

/* ------------------------------------------------------------------
   THE FOOT CREDIT.

   Two passes on this. It read "In collaboration with Tito Films", then
   "In collaboration with 8 production houses, including Tito Films" -
   both of them credits, and a credit is a fact about who made the work
   rather than a reason to press anything. The client's line is the
   third pass and it is a different kind of sentence: it stops crediting
   and starts inviting. "Watch some of our production work" tells a
   reader what is on the other side of the click, which is the only
   thing the foot of this page had never said.

   `lead` is the client's copy and is set exactly as they wrote it. The
   separator is punctuation rather than a word, so their sentence stays
   whole and the name still reads as the destination rather than as the
   tail of the sentence - see .st-foot__credit in series.css.

   The count is gone with the old line. It was never confirmed (the
   other seven houses are written down nowhere in this repo) and this
   sentence does not need it.
   ------------------------------------------------------------------ */
export const FOOT_CREDIT = {
  lead: "Watch some of our production work",
  joiner: "·",
} as const;

/* A frame is either a file in public/assets/series/ or an already-rooted
   path (the films above), so both can sit in the same array without the
   caller having to know which is which. */
export const ART = (file: string) =>
  file.startsWith("/") || file.startsWith("http") ? file : `/assets/series/${file}`;

export const isFilm = (file: string) => file.endsWith(".mp4") || file.endsWith(".webm");
