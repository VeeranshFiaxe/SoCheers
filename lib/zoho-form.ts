/* ---------------------------------------------------------------
   The client's Zoho form, described in one place.

   The live Zoho page is a JS app - it renders its own fields, runs its
   own conditional rules and posts over AJAX, so it cannot be dropped
   into this site without dragging Zoho's whole stylesheet in with it.
   An <iframe> would keep the styling out but bring a white Zoho card
   onto a beige page, and nothing on our side can reach inside it.

   So the form is rebuilt here in the site's own markup and posts to
   Zoho's plain-HTML endpoint instead. What matters is that the `name`
   of every input below matches the field's link name in Zoho exactly -
   that is the whole contract. They were read off the live form:
   https://ops.socheers.net/SoCheersOps/form/Socheersnetcontact/formperma/55uqUE58GteqHVyRpTDJl1JCLfHZwSIeI0M51aegLyg
   --------------------------------------------------------------- */

const FORM_PERMA =
  "https://ops.socheers.net/SoCheersOps/form/Socheersnetcontact/formperma/55uqUE58GteqHVyRpTDJl1JCLfHZwSIeI0M51aegLyg";

/* Zoho's non-JS submit endpoint. It answers a POST only (a GET bounces
   to /showerror), and it answers cross-origin without CORS headers -
   which is why the form posts into a hidden iframe rather than fetch():
   we cannot read the reply, we only need it delivered. */
export const ZOHO_ACTION = `${FORM_PERMA}/htmlRecords/submit`;

/* The radio at the top of the Zoho form. The values are matched
   character for character - emoji included - against the conditional
   rules on Zoho's side (/liverules), which decide which fields are
   mandatory and which get dropped. Changing a string here silently
   changes which branch a submission lands in. */
export const INTENTS = {
  agency: "Hire an agency 💼",
  job: "Find my next job 📃",
  partner: "Work as partner 🤝",
} as const;

/* Four hidden text fields Zoho marks mandatory and prefills on its own
   page. They are the ops team's routing columns, not anything a visitor
   answers, so they ride along as hidden inputs with Zoho's own defaults. */
export const ZOHO_HIDDEN = {
  SingleLine: "<To be updated>",
  SingleLine1: "Website Drop",
  SingleLine2: "To be contacted",
  SingleLine3: "Inbound",
} as const;

/* The names of the hidden iframes the forms post into. One each, not one
   shared: on /contact the page's own form and the footer's pop-up can both
   be mounted at the same time, and two iframes answering to the same name
   means one form's reply arrives in the other's frame. */
export const ZOHO_TARGET = "zoho-form-sink";
export const ZOHO_TARGET_MODAL = "zoho-form-sink-modal";
