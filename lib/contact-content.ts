/* Everything the dedicated Contact page says, kept separate from
   lib/content.ts the same way lib/about-content.ts is - one readable file
   per route. Addresses are the client's own, current office listings. */

export const CONTACT_HERO = {
  eyebrow: "Get in touch",
  lines: ["Got a brief?", "Or just want to say hi?"],
} as const;

export const OFFICES = [
  {
    city: "Mumbai",
    tag: "Headquarters",
    address: "16th Floor, Lotus Business Park, Off New Link Road, Andheri West, Mumbai – 400 053",
    mapUrl: "https://maps.app.goo.gl/5EPq4HZERxfU54q68",
  },
] as const;

export const CONTACT_LINKS = {
  careers: "https://socheers.thetalentpool.co.in",
} as const;

/* The full page's form, expanded from the footer pop-up's bare three
   fields into something that actually fills a dedicated page - same core
   ask (who, how to reach you, what's the brief), just given the room a
   proper brief intake usually gets. The live site's own contact form
   renders client-side and isn't reachable from a plain fetch, so this is
   the generic version the client OK'd building in that case: nothing here
   invents a field an agency brief form wouldn't have. */
export const CONTACT_FORM = {
  tag: "Start a brief",
  title: "Tell us what you're building.",
  reasons: [
    "A brief",
    "A partnership",
    "Careers",
    "Press",
    "Something else",
  ],
  submit: "Send it over",
} as const;
