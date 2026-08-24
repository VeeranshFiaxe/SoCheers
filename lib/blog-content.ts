/* Everything the Blog/Whitepaper page says - same one-file-per-route
   convention as lib/about-content.ts and lib/contact-content.ts. There is
   no live blog on socheers.net yet, so this page is built as the resource
   hub it implies: the whitepaper the client already publishes, plus the
   disciplines the team actually writes and thinks about, pulled straight
   from the site's own service list rather than invented post titles. */

export const BLOG_HERO = {
  eyebrow: "Insights & resources",
  lines: ["Things worth ", "reading."],
  lede:
    "White papers, reports, and the occasional rant from people who actually do this for a living.",
} as const;

/* Three segments under one roof. Only "whitepapers" has anything live right
   now - "blogs" and "reports" stay in the bar as dead tabs rather than
   disappearing, so the section already reads as the full resource hub it's
   meant to become. `live:false` is what dims them and turns the click off
   (see components/BlogTabs.tsx); flipping one to true is all it takes to
   open that tab once there's something in it. */
export const TABS = [
  { id: "blogs", label: "Blogs", live: false },
  { id: "whitepapers", label: "White Papers", live: true },
  { id: "reports", label: "Reports", live: false },
] as const;

export type TabId = (typeof TABS)[number]["id"];

/* What the dead tabs say on hover - one line, because it's a tooltip and
   not a panel. */
export const SOON_LABEL = "Coming soon";

/* An array, not a single object, on purpose - the White Papers tab lists
   whatever's live in here. Right now that's one piece; adding the next one
   live is just another entry.

   `pdf` is the whole point of the entry now. The paper used to sit behind
   an email field; the client's call is that it's open to everyone, so the
   paper is embedded straight into the tab - no gate, no capture, nothing
   to submit, and the visitor reads it without leaving the page. The file
   is the one the old site served at socheers.net/parasocial-marketing-
   whitepaper/, carried over as a plain public asset. */
export const WHITEPAPERS = [
  {
    id: "parasocial-marketing",
    tag: "Featured whitepaper",
    title: "The Parasocial Marketing Whitepaper",
    blurb:
      "A close look at the one-sided relationships audiences build with the creators they follow - and what it actually takes for a brand to earn a place inside that bond instead of interrupting it.",
    points: [
      "Why parasocial trust converts differently than reach or impressions",
      "Reading the signals that separate a genuine creator fit from a rented audience",
      "Building influencer partnerships that outlast a single campaign",
    ],
    pdf: "/assets/whitepapers/parasocial-marketing.pdf",
    cta: "Open the paper",
    /* Shown under the embedded reader, so a visitor who wants the file
       itself doesn't have to hunt through the viewer's own chrome. */
    file: "The-Friendship-Illusion-Whitepaper.pdf",
  },
] as const;

/* Pulled from socheers.net's own service list - the actual disciplines the
   team works in, reframed as the topics they write about. */
export const TOPICS = [
  {
    idx: "01",
    name: "Content & Social Marketing",
    copy: "What keeps a feed worth following once the algorithm stops doing the work for you.",
  },
  {
    idx: "02",
    name: "Social Listening & Analysis",
    copy: "Turning real-time conversation into something a brand can actually act on.",
  },
  {
    idx: "03",
    name: "Influencer Marketing",
    copy: "Matching brands with creators whose audience already trusts them - and knowing when not to.",
  },
  {
    idx: "04",
    name: "SoCheers Films",
    copy: "Production notes from the sets, edits and pitches behind the work.",
  },
  {
    idx: "05",
    name: "Digital Campaign & Strategy",
    copy: "The thinking that has to hold before a single asset gets made.",
  },
  {
    idx: "06",
    name: "Digital Media Planning & Buying",
    copy: "Where the budget actually goes, and why the obvious channel isn't always the right one.",
  },
] as const;
