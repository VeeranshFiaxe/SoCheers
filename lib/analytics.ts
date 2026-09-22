/* The tracking IDs. Paste each one in when it arrives - an empty string
   keeps that service switched off, so nothing loads until it is filled.
   These are public by design (they end up in every page's HTML anyway),
   which is why they live here and not in an env file. */
export const ANALYTICS = {
  /* Google Tag Manager - "GTM-XXXXXXX". Loaded from the document head in
     app/layout.tsx rather than from components/Analytics.tsx, because GTM
     wants to be first in the page. */
  gtm: "GTM-TMPGTX2S",
  /* Google Analytics 4 - "G-XXXXXXXXXX", from Admin > Data streams */
  ga4: "",
  /* Meta (Facebook/Instagram) Pixel - the numeric ID from Events Manager */
  metaPixel: "",
  /* Google Search Console, only if verifying with the HTML-tag method:
     the content="..." value of the tag it gives you. The DNS method
     needs nothing here. */
  googleSiteVerification: "",
};

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

/* A finished enquiry. Sent to both services as their standard "lead"
   event, so it can be marked as a conversion in each without renaming. */
export function trackLead(form: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq; dataLayer?: unknown[] };
  /* GTM reads dataLayer, not gtag - a Custom Event trigger on
     "generate_lead" picks this up */
  w.dataLayer?.push({ event: "generate_lead", form });
  w.gtag?.("event", "generate_lead", { form });
  w.fbq?.("track", "Lead", { content_name: form });
}
