/* Everything the dedicated Contact page says, kept separate from
   lib/content.ts the same way lib/about-content.ts is - one readable file
   per route. Addresses are the client's own, current office listings. */

export const CONTACT_HERO = {
  eyebrow: "Get in touch",
  lines: ["Got a brief?", "Or just want to say hi?"],
} as const;

/* Two URLs per office, because they do two different jobs.

   `embedUrl` is the map drawn inside the card. It is the keyless
   `output=embed` form deliberately - the Maps Embed API proper wants a
   billable API key on the referring domain, and a locator pin on a
   contact page is not worth standing up a key rotation for. Coordinates
   rather than a text query: a query string re-geocodes on Google's side
   every load and can quietly drift to a different Lotus Business Park,
   where a lat/lng lands on the door and stays there.

   `dirUrl` is where "Get directions" goes - a full directions link to the
   office, supplied by the client, so the button hands over to Google with
   the destination already set rather than dropping the visitor on a pin
   to search from. */
export const OFFICES = [
  {
    city: "Mumbai",
    tag: "Headquarters",
    address: "16th Floor, Lotus Business Park, Off New Link Road, Andheri West, Mumbai – 400 053",
    embedUrl:
      "https://www.google.com/maps?q=19.1365201,72.8332081&hl=en&z=15&output=embed",
    dirUrl:
      "https://www.google.com/maps/dir/19.1168512,72.8629248/SoCheers,+16th+Floor,+Lotus+Business+Park,+Off,+New+Link+Rd,+off+New+Link+Road,+Veera+Desai+Industrial+Estate,+Andheri+West,+Mumbai,+Maharashtra+400053/@19.1260471,72.8258738,14z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x3be7b63b41f89c51:0x993c1f6d1ce2e486!2m2!1d72.8332081!2d19.1365201?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D",
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
   invents a field an agency brief form wouldn't have.

   No heading or eyebrow in here any more: the left column of the page
   already says what this is, and repeating it over the fields only pushed
   them down the panel. The fields start at the top of the sheet. */
export const CONTACT_FORM = {
  reasons: [
    "A brief",
    "A partnership",
    "Careers",
    "Press",
    "Something else",
  ],
  submit: "Send it over",
} as const;
