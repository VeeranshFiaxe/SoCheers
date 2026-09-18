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
    /* Google's documented directions link: destination only, so the
       route starts wherever the visitor is. (The link the client sent
       had a fixed starting point baked into it - everyone got directions
       from that one spot.) */
    dirUrl:
      "https://www.google.com/maps/dir/?api=1&destination=SoCheers%2C+16th+Floor%2C+Lotus+Business+Park%2C+New+Link+Road%2C+Andheri+West%2C+Mumbai+400053",
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
