/* ============================================================
   THE THREE SERVICE PAGES

   What the home page's WHAT WE DO cards open onto. Each card is a link
   now (see What() in components/Sections.tsx) and this is what is behind
   it - one page per discipline, at /services/<slug>.

   The brief for these pages was "keep them simple; don't write long,
   obvious copy", and the structure below is that brief rather than a
   template that happens to be short. Every block earns its place twice,
   once for a reader and once for a machine:

     lede        one sentence saying what the discipline is here. A
                 reader gets the claim; a model quoting the page gets a
                 definition it can lift whole.
     capability  the same list the card already shows, with one line each
                 saying what the work actually is. The labels alone are a
                 menu; the lines are what makes them answerable.
     faq         three questions, asked the way somebody would type them.
                 This is the GEO half of the job: generative engines
                 answer questions, and a page that has already asked and
                 answered its own is the page they quote. Kept to three -
                 a wall of them is padding, and padding is what the brief
                 said not to write.

   Nothing here is decoration. There is no hero image, no pull quote and
   no second CTA: the home page is where this agency performs, and these
   are the pages that say plainly what it does.

   The name, the slug and the capability labels are NOT duplicated here.
   They live in BUCKETS (lib/content.ts), which is what the card renders
   from, so the card and the page cannot drift apart - this file only
   adds what the page needs on top. `capabilities` is keyed by the label
   BUCKETS already uses; a label with no line here still renders, just
   without one, and a line here whose label has been renamed in BUCKETS
   simply goes unused rather than breaking the build.
   ============================================================ */

export type ServiceCopy = {
  /** the h1. Not the same words as the nav label - that is the name. */
  headline: string;
  /** one sentence. The definition a search or a model can quote. */
  lede: string;
  /** <title> and <meta name="description"> */
  metaTitle: string;
  metaDescription: string;
  /** one line per BUCKETS item label */
  capabilities: Record<string, string>;
  faq: { q: string; a: string }[];
};

export const SERVICE_COPY: Record<string, ServiceCopy> = {
  strategy: {
    headline: "Strategy",
    lede:
      "Strategy at SoCheers is the work that happens before anything is made: deciding what a brand is for, who it is talking to, and which platforms are worth showing up on.",
    metaTitle: "Brand & Digital Strategy · SoCheers",
    metaDescription:
      "Brand positioning, digital strategy, content planning, consumer insights and media planning from SoCheers - an independent, integrated creative agency in Mumbai.",
    capabilities: {
      "Brand Positioning":
        "What the brand stands for, said in a way the rest of the work can be built on.",
      "Digital Strategy":
        "Which platforms a brand belongs on, what it does on each, and why.",
      "Content Planning":
        "A calendar with a reason behind it - formats, frequency and the arc they add up to.",
      "Insights & Journey Mapping":
        "Where the audience already is, and what they run into on the way to buying.",
      "Communications Planning":
        "One message, split across channels without being flattened by any of them.",
      "Media Planning":
        "Where the budget goes, against what the work is actually trying to move.",
    },
    faq: [
      {
        q: "What does a strategy engagement with SoCheers include?",
        a: "Positioning, audience and journey mapping, a platform and content plan, and media planning. Scope is set per brand.",
      },
      {
        q: "Do you take on strategy without creative or production?",
        a: "Yes. Most briefs use all three, but strategy runs on its own too.",
      },
      {
        q: "Which categories have you done this for?",
        a: "BFSI, FMCG, fashion, beauty, entertainment, lifestyle and B2B - about thirty categories in twelve years.",
      },
    ],
  },

  creative: {
    headline: "Creative",
    lede:
      "Creative at SoCheers is the idea and everything that carries it: campaigns, content, words, identity and the day-to-day work that keeps a brand present between campaigns.",
    metaTitle: "Creative & Content Development · SoCheers",
    metaDescription:
      "Integrated campaigns, content development, copywriting, branding and tactical execution from SoCheers - an independent, integrated creative agency in Mumbai.",
    capabilities: {
      "Integrated Campaigns":
        "One idea built to hold up across film, social, print and everything after.",
      "Creative & Content Development":
        "The formats and the franchises - what gets made, week after week.",
      Copywriting:
        "Lines, scripts, captions and long copy, in the brand's own voice rather than the category's.",
      "Branding & Merchandising":
        "Identity, packaging and the physical things a brand puts in a hand.",
      "Tactical Execution":
        "The fast work - moments, reactions and launches that will not wait for a cycle.",
      "Art Direction & Design":
        "The look of the work - illustration, layout and visual style that make an idea recognisable at a glance.",
    },
    faq: [
      {
        q: "What does an integrated campaign mean here?",
        a: "One idea, cut for every place it lives - film, social, influencer, retail, outdoor - not a TVC with add-ons.",
      },
      {
        q: "Do you work on retainers or on projects?",
        a: "Both. Campaigns are projects; content and tactical work run on retainer.",
      },
      {
        q: "Who does the writing?",
        a: "Our in-house team - the same people who develop the idea.",
      },
    ],
  },

  production: {
    headline: "Production",
    lede:
      "Production at SoCheers is an in-house studio: film, stills, sound and motion made under one roof, on the same brief the strategy and the idea came from.",
    metaTitle: "Film, Content & Post Production · SoCheers",
    metaDescription:
      "TVC and DVC, digital and social production, photography, audio, motion and 3D from SoCheers - an independent, integrated creative agency in Mumbai.",
    capabilities: {
      "TVC & DVC": "Films for television and for the feed, shot to the same standard.",
      "Digital Production": "Everything a campaign needs once it leaves the edit.",
      "Social Content": "Volume without the drop in craft - shot in blocks, cut for each platform.",
      Photography: "Product, portrait and campaign stills, in studio or on location.",
      "Audio & Mixing": "Score, voice, sound design and the final mix.",
      "Motion + 3D": "Animation, CG and the work that cannot be filmed.",
    },
    faq: [
      {
        q: "Is production in-house or outsourced?",
        a: "In-house. Direction, shoot, edit, sound and motion are all our own teams.",
      },
      {
        q: "Can you produce work you did not write?",
        a: "Yes. We regularly shoot external scripts and boards.",
      },
      {
        q: "Where do you shoot?",
        a: "Mumbai, and on location wherever the work needs to be.",
      },
    ],
  },
};

/* The line under the capability list, once, for all three pages: what
   these pages are actually for is getting a reader to the next one, and
   the honest next step is the other two disciplines or a conversation. */
export const SERVICE_ASK = "Got a brief that needs more than one of these?";
