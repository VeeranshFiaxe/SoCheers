/* Everything the About page says, in one place - same convention as
   lib/content.ts, kept separate so the home page's copy stays a single
   readable file. */

export const ABOUT_IMG = {
  /* the hero illustration. The text that used to be painted into it has
     been stripped out, so the left half is open canvas and components/
     AboutHero.tsx sets live type over it. */
  opening: "/assets/about/about-hero.webp",
  founderSid: "/assets/about/founder-sid.jpg",
  founderMehul: "/assets/about/founder-mehul.jpg",
  /* The pair in one frame, and what the founders section builds towards.
     Both of them stand cleanly in their own half of it, and in the same
     left-to-right order as FOUNDERS below - which is what lets each half
     of this photo ride in on the portrait of the founder standing in it
     as the two frames come together (see .founders__duo in about.css). */
  foundersDuo: "/assets/about/founders-duo.webp",
  people: "/assets/about/people.jpg",
  /* the pop-art crowd, cropped out of the client's own reference slide */
  crowd: "/assets/about/crowd.jpg",
} as const;

/* The hero copy. The client's own line is back over the film - it was
   stripped out when the opener became "the film and nothing else", and it
   is the one sentence the page cannot open without: everything below it
   (the disciplines, the drivers, the whole "what comes next" thread) is
   an answer to it.

   It sits near the top of the frame rather than in the middle, so the
   film still has its own space underneath and the two corner labels keep
   the floor to themselves. Split in two because the turn takes the accent
   italic and a regex over the prose would break the first time someone
   edits a word - the same convention ABOUT_INTRO uses below.

   `sub` is the discipline line that ran under the headline in the first
   build of this page and is back where it was: the headline is the claim
   and this is what the claim is made of, which is also the thread the
   whole page below follows. Two strings rather than one sentence because
   it sets as two stacked lines - where it breaks is a decision, not a
   wrap. */
export const HERO = {
  eyebrow: "About SoCheers",
  line: "We turn ideas into",
  lineAccent: "impact.",
  sub: ["Strategy. Creativity. Production.", "All working together."],
  cta: "Let's build something great",
} as const;

/* Split where it is set, not at render time: the payoff sentence takes the
   accent and the discipline list does not, and a regex over the prose would
   quietly break the moment someone edits a word. */
/* The words are exactly the two sentences they have always been. What
   changed is which of them is set at which size.

   The panel is built on one band of type running edge to edge with the
   figure standing in front of it, so the middle of the band goes behind
   him and your eye completes it. That needs an opening big enough to
   carry the whole frame and a block of fine print to hang off its
   baseline - and this sentence already had both, run together at one
   size: "We are:" is the claim and the seven job titles after it are the
   evidence. So the band takes the opening, the list becomes the fine
   print, and nothing is rewritten to make it fit.

   `list` and `payoff` are untouched and are what the page hands a screen
   reader. `bandA` / `bandB` / `note` are the same sentence broken where
   the layout breaks it, kept as their own constants rather than sliced
   off `list` at render time by a regex over the colon: where a sentence
   is allowed to come apart is a design decision, and a regex would make
   it look like a parsing rule that any future edit could quietly break.
   The three of them must still read back as `list` - if you edit one,
   edit `list` with it. */
export const ABOUT_INTRO = {
  bandA: "We",
  bandB: "are",
  note: "AI-native strategists, producers, researchers, creatives, filmmakers, animators, and copywriters.",
  list: "We are: AI-native strategists, producers, researchers, creatives, filmmakers, animators, and copywriters.",
  payoff: "One team, many disciplines, all chasing what comes next.",
} as const;

/* Condensed from the client's source bios - roughly two paragraphs each,
   matched in length so the two columns sit level. */
export const FOUNDERS = [
  {
    name: "Siddharth Devnani",
    role: "Co-Founder & Chief Operating Officer",
    img: ABOUT_IMG.founderSid,
    /* this portrait leaves far more headroom above the scalp than Mehul's
       does - a shared object-position put the two heads at noticeably
       different heights, so each photo carries its own crop instead. Both
       values are solved against the same target (the head sitting the
       same fraction down the frame), not eyeballed independently - see
       .founder__photo in about.css for the crop math they assume. */
    imgPos: "center 95%",
    bio: [
      "Siddharth co-founded SoCheers in 2013, convinced that creative ambition only scales when the business under it is built properly. Over a decade, he grew it into one of India's largest independent creative agencies.",
      "His engineering background shaped the Media and Analytics practice and Digital Intelligence and Analytics division. He leads operations, finance, media and tech.",
    ],
  },
  {
    name: "Mehul Gupta",
    role: "Co-Founder & Chief Executive Officer",
    img: ABOUT_IMG.founderMehul,
    imgPos: "center 5%",
    bio: [
      "Mehul co-founded SoCheers on a bet: that brands would need partners who treat digital as the medium itself, not just as an extension of advertising. His people-first leadership is now the culture the whole team runs on.",
      "An MBA in Technology Management from NMIMS, he leads creative and business direction, staying close to every major partnership and pitch.",
    ],
  },
];

export const BELIEF =
  "We believe growth comes from staying curious, embracing discomfort, and surrounding ourselves with people who push us to think bigger, including the brands we partner with.";

export const WHY_WE_EXIST =
  "SoCheers exists to shape the future of brands by creating work that delivers long-term value, where creativity and strategy come together to solve real business problems.";

export const DRIVERS = [
  {
    idx: "01",
    name: "Curiosity",
    copy: "We ask questions. We explore possibilities. We never stop learning.",
  },
  {
    idx: "02",
    name: "Transparency",
    copy: "No sugarcoating, no corporate jargon. No hidden agendas, just straight-up, clear conversations.",
  },
  {
    idx: "03",
    name: "Collaboration",
    copy: "Ideas are meant to be shared. The best work happens when people come together, challenge each other, and build on what's possible.",
  },
];

export const SPACE_COPY =
  "Imagine the meeting rooms named Idhar, Udhar, Jidhar, Kidhar. Because when someone asks “Where are you?” you can say “Idhar” and still be in a room called Idhar.";

/* The office, ten frames, one at a time (see components/AboutStage.tsx -
   a single cinematic frame with a rail of thumbnails under it, rather
   than the mosaic this used to be).

   All four rooms turn out to be nameable after all: the signs are legible
   in these shots - Jidhar's blue hexagons and yellow door, Kidhar's red
   interior behind fluted glass, Idhar's teal-and-yellow tile beside the
   red cabinets, Udhar's teal hexagons - so each frame says which room it
   is instead of hedging. That is the whole point of the copy above it;
   naming them is what makes the joke land.

   Rooms and people alternate down the list and no room sits next to
   itself, because the rail shows every thumbnail at once and a run of
   near-identical doorways in it reads as a mistake.

   PLACEHOLDERS. Every one of these is a portrait phone shot standing in
   until the real horizontal photography arrives - which is what `pos` is
   doing all this work for: a 16:9 band cut out of a 9:16 frame lands on
   the ceiling unless it is told the sign is a third of the way down. When
   the landscape originals land, swap `src` and delete the `pos` on that
   row; nothing else has to change. */
export type SpaceShot = {
  src: string;
  alt: string;
  /* the mono line under the frame - short, and naming the room where
     there is a room to name */
  cap: string;
  pos?: string;
};

export const SPACE_SHOTS: SpaceShot[] = [
  { src: "/assets/about/space-02.jpg", alt: "The Jidhar meeting room at SoCheers, seen through its glass front", cap: "Jidhar", pos: "center 36%" },
  { src: "/assets/about/people-offsite.webp", alt: "The whole of SoCheers on its twelfth-birthday offsite", cap: "The offsite, all of us" },
  { src: "/assets/about/space-05.jpg", alt: "The Kidhar meeting room at SoCheers, behind fluted glass", cap: "Kidhar", pos: "center 34%" },
  { src: "/assets/about/people-run.webp", alt: "The SoCheers team after a morning run, medals up", cap: "The morning run" },
  { src: "/assets/about/space-07.jpg", alt: "The Idhar meeting room at SoCheers, hexagon tile beside the door", cap: "Idhar", pos: "center 32%" },
  { src: "/assets/about/people-cake.webp", alt: "A birthday in the SoCheers kitchen", cap: "A birthday, in the kitchen" },
  { src: "/assets/about/space-09.jpg", alt: "The Udhar meeting room at SoCheers, teal hexagons through the door", cap: "Udhar", pos: "center 30%" },
  { src: "/assets/about/people-khaugalli.webp", alt: "Khaugalli day at the SoCheers office", cap: "Khaugalli day", pos: "center 42%" },
  { src: "/assets/about/space-01.jpg", alt: "The floor outside Jidhar, desks either side", cap: "Jidhar, from the floor", pos: "center 38%" },
  { src: "/assets/about/space-08.jpg", alt: "The doorway into Udhar at SoCheers", cap: "Udhar, the way in", pos: "center 30%" },
];
