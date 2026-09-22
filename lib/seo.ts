import type { Metadata } from "next";

/* ============================================================
   WHAT A LINK LOOKS LIKE OUTSIDE THE SITE.

   One helper so every route hands LinkedIn, WhatsApp, X and search
   engines the same set of tags: title, description, canonical, Open
   Graph and the large Twitter card. Next merges metadata shallowly, so
   a page that sets its own title without its own openGraph would share
   the home page's title in every preview - which is why each page calls
   this rather than leaning on the layout.

   Relative paths resolve against metadataBase in app/layout.tsx.
   ============================================================ */

export const SITE_URL = "https://socheers.in";
export const SITE_NAME = "SoCheers";

/* 1200x630, cut from public/assets/socheers-frame-n-T4ylIx.jpg */
export const OG_IMAGE = "/og-v3.jpg";

export function pageMeta({
  title,
  description,
  path,
  image = OG_IMAGE,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title,
      description,
      /* the size lets WhatsApp and Facebook draw the large card on the
         first share, before they have downloaded the image */
      images: [
        image === OG_IMAGE
          ? { url: image, width: 1200, height: 630, alt: title }
          : { url: image, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
