/* Everything the About page says, in one place - same convention as
   lib/content.ts, kept separate so the home page's copy stays a single
   readable file. */

export const ABOUT_IMG = {
  /* the hero illustration. The text that used to be painted into it has
     been stripped out, so the left half is open canvas and components/
     AboutHero.tsx sets live type over it. */
  opening: "/assets/about/about-hero.webp",
  /* the team-at-work cutout that sits beside the intro line */
  visual: "/assets/about/abt%20vis.png",
  founderSid: "/assets/about/founder-sid.jpg",
  founderMehul: "/assets/about/founder-mehul.jpg",
  /* The pair in one frame, and the first thing the founders section shows.
     Both of them stand cleanly in their own half of it, and in the same
     left-to-right order as FOUNDERS below - which is what lets the section
     tear this photo down the middle and hand each half to the founder
     standing in it (see .founders__duo in about.css). */
  foundersDuo: "/assets/about/founders-duo.webp",
  people: "/assets/about/people.jpg",
  /* the pop-art crowd, cropped out of the client's own reference slide */
  crowd: "/assets/about/crowd.jpg",
} as const;

/* The hero copy. This is the client's own line - it was painted into the
   first version of the hero artwork - so it moves across as live type
   rather than something invented to fill the space. Broken into lines here
   because each one is masked and lifted separately in the entrance. */
export const HERO = {
  eyebrow: "About SoCheers",
  lines: ["We turn", "ideas into"],
  accent: "impact.",
  sub: ["Strategy. Creativity.", "All working together."],
  cta: "Let's build something great",
} as const;

/* Split where it is set, not at render time: the payoff sentence takes the
   accent and the discipline list does not, and a regex over the prose would
   quietly break the moment someone edits a word. */
export const ABOUT_INTRO = {
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
  "Imagine the meeting rooms named Idhar, Udhar, Jidhar, Kidhar. Because when someone asks “Where are you?” you can say “Idhar” and still be in a room called Udhar.";

/* The office, in eight frames: one of each of the four meeting rooms, and
   four of the people who book them. The room shots used to be all eight
   tiles, which meant the same doorway three or four times over - the four
   kept here are one per room, chosen for the shot rather than the sign
   (the client's phone shots of the same door are near-duplicates of each
   other). No tile claims a room by name: only the Jidhar sign is legible
   at this resolution and a caption guessing at the other three would be
   worse than none.

   `pos` is the object-position a tile needs when the mosaic hands it a
   slot of the wrong shape - a wide band cut out of a phone-portrait shot
   lands on the ceiling unless it is told where the subject is. The order
   here is the grid-area order a..h in about.css, so the aspect of each
   photo is matched to the slot it falls into and rooms and people
   alternate around the mosaic rather than clumping. */
export const SPACE_SHOTS: { src: string; alt: string; pos?: string }[] = [
  { src: "/assets/about/people-run.webp", alt: "The SoCheers team after a morning run, medals up" },
  { src: "/assets/about/space-04.jpg", alt: "A SoCheers meeting room, seen from the floor outside" },
  { src: "/assets/about/space-05.jpg", alt: "A SoCheers meeting room behind fluted glass" },
  { src: "/assets/about/people-cake.webp", alt: "A birthday in the SoCheers kitchen" },
  { src: "/assets/about/people-offsite.webp", alt: "The whole of SoCheers on its twelfth-birthday offsite" },
  { src: "/assets/about/space-07.jpg", alt: "A SoCheers meeting room, hexagon tiles behind the door", pos: "center 34%" },
  { src: "/assets/about/people-khaugalli.webp", alt: "Khaugalli day at the SoCheers office", pos: "center 42%" },
  { src: "/assets/about/space-09.jpg", alt: "A SoCheers meeting room at the end of the floor" },
];
