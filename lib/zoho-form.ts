/* ---------------------------------------------------------------
   The client's Zoho form, described in one place.

   The form is built in the site's own markup and posts to Zoho's
   plain-HTML endpoint. The `name` of every input must match Zoho's
   field link names exactly - that is the whole contract. They were read
   off Zoho's exported HTML for "Socheers.net contact"
   (SoCheers form Test/Socheersnet_contact/index.html):

     Radio                           I am here to...
     Name_First / Name_Last          My name is / I am from
     Email                           My official email ID is
     PhoneNumber_countrycodeval      phone: country code (+91)
     PhoneNumber_countrycode         phone: number, digits only
     MultiLine                       I am looking for...
     Name1_First / Name1_Last,
     Email1, PhoneNumber1_*          the partner branch's copies
     FileUpload                      resume / portfolio
   --------------------------------------------------------------- */

/* Zoho's non-JS submit endpoint. It answers cross-origin without CORS
   headers, which is why the forms post into a hidden iframe rather than
   fetch(): we cannot read the reply, we only need it delivered. */
export const ZOHO_ACTION =
  "https://forms.zohopublic.com/SoCheersOps/form/Socheersnetcontact/formperma/DyOb3xZKXG20uHYmKoRJQOrYHkvQqMCWXY7bD1Rg9Zs/htmlRecords/submit";

/* The radio values, character for character - emoji included. Zoho's
   conditional rules key off these strings. */
export const INTENTS = {
  agency: "Hire an agency 💼",
  job: "Find my next job 📃",
  partner: "Work as partner 🤝",
} as const;

/* Hidden inputs Zoho's export carries. zf_referrer_name gets the page
   URL; the utm_* ones are copied from the page's query string. */
export const ZOHO_HIDDEN = [
  "zf_referrer_name",
  "zf_redirect_url",
  "zc_gad",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/* Zoho's own client-side checks (js/validation.js), as HTML patterns, so
   the browser stops anything Zoho would reject. Patterns are anchored
   by the browser and compiled with the `v` flag, hence the escapes. */
export const EMAIL_PATTERN = String.raw`[\w][\w.+&'\/\-]*@([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,22}`;
export const PHONE_CODE_PATTERN = String.raw`\+[0-9]{1,4}`;
export const PHONE_NUMBER_PATTERN = "[0-9]+";

/* The names of the hidden iframes the forms post into. One each: on
   /contact the page's form and the footer's pop-up can both be mounted,
   and two iframes with one name would swap each other's replies. */
export const ZOHO_TARGET = "zoho-form-sink";
export const ZOHO_TARGET_MODAL = "zoho-form-sink-modal";
