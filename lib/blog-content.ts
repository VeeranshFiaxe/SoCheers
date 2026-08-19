/* Everything the Blog/Whitepaper page says - same one-file-per-route
   convention as lib/about-content.ts and lib/contact-content.ts. There is
   no live blog on socheers.net yet, so this page is built as the resource
   hub it implies: the whitepaper the client already publishes, plus the
   disciplines the team actually writes and thinks about, pulled straight
   from the site's own service list rather than invented post titles. */

export const BLOG_HERO = {
  eyebrow: "Insights & resources",
  lines: ["Ideas, ", "decoded."],
  lede:
    "Notes from the team on culture, platforms and the campaigns that move both - starting with the research we've already put our name on.",
} as const;

/* Three segments under one roof. Only "whitepapers" has anything live right
   now - "blogs" and "reports" stay in the UI as empty tabs with a
   placeholder rather than disappearing, so the section reads as the full
   resource hub it's meant to become as soon as there's more than one live
   piece. */
export const TABS = [
  { id: "blogs", label: "Blogs" },
  { id: "whitepapers", label: "White Papers" },
  { id: "reports", label: "Reports" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export const EMPTY_TABS: Record<Exclude<TabId, "whitepapers">, { title: string; copy: string }> = {
  blogs: {
    title: "First post is in the works",
    copy: "Nothing published here yet - the team's writing is starting with the whitepaper below. Blog posts will land in this tab as soon as they're ready.",
  },
  reports: {
    title: "Reports are coming",
    copy: "Longer-form research and campaign reports will live here once the first one's ready to share.",
  },
};

/* An array, not a single object, on purpose - the White Papers tab lists
   whatever's live in here. Right now that's one piece; adding the next one
   live is just another entry.

   `pdf` is the whole point of the entry now. The paper used to sit behind
   an email field; the client's call is that it's open to everyone, so the
   card in the tab is simply a link to the file - no gate, no capture,
   nothing to submit, and clicking a paper opens the paper. The path is a
   plain public asset: drop the file at `public/assets/whitepapers/` under
   the same name and the tab is live. */
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
