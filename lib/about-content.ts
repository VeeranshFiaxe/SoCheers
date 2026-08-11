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

export const ROOMS = ["Idhar", "Udhar", "Jidhar", "Kidhar"];

export const SPACE_COPY =
  "Imagine the meeting rooms named Idhar, Udhar, Jidhar, Kidhar. Because when someone asks “Where are you?” you can say “Idhar” and still be in a room called Udhar.";

/* PLACEHOLDER grid. Photos are the client's phone shots of the rooms; the
   room-to-photo mapping is unconfirmed (only the Jidhar sign is legible at
   this resolution) so no tile claims a room by name. */
export const SPACE_SHOTS = [
  "/assets/about/space-02.jpg",
  "/assets/about/space-03.jpg",
  "/assets/about/space-04.jpg",
  "/assets/about/space-05.jpg",
  "/assets/about/space-06.jpg",
  "/assets/about/space-07.jpg",
  "/assets/about/space-08.jpg",
  "/assets/about/space-09.jpg",
];
