import { FOUNDERS } from "@/lib/about-content";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

/* ============================================================
   WHAT A SEARCH ENGINE READS ABOUT THE SITE (JSON-LD).

   Two nodes that describe SoCheers itself - the Organization and the
   WebSite - are emitted once, from app/layout.tsx, on every page. Every
   page then adds its own node through pageGraph() and points back at
   those two by @id rather than repeating them. Google joins @id
   references across the JSON-LD blocks of one page, so a service page's
   `provider: { "@id": ORG_ID }` resolves to the full organisation below.

   URLs here are always the real domain, never the host the page was
   asked on: they name the entity, the way a canonical does. (The worker
   rewrites the share-preview tags; it leaves these alone.)
   ============================================================ */

type Json = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/* the same five profiles the contact page links to */
const SAME_AS = [
  "https://www.instagram.com/thesocheers/",
  "https://in.linkedin.com/company/socheers",
  "https://www.youtube.com/@ThisIsSoCheers",
  "https://www.facebook.com/TheSoCheers",
  "https://x.com/TheSoCheers",
];

/* OFFICES in lib/contact-content.ts, split into the fields schema.org
   wants. The coordinates are the ones that office's map pin uses. */
const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "16th Floor, Lotus Business Park, Off New Link Road, Andheri West",
  addressLocality: "Mumbai",
  addressRegion: "Maharashtra",
  postalCode: "400053",
  addressCountry: "IN",
};

export const SITE_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: abs("/icon-512.png"),
        width: 512,
        height: 512,
      },
      image: abs(OG_IMAGE),
      slogan: "Making more happen.",
      description:
        "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
      foundingDate: "2013",
      founder: FOUNDERS.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role })),
      address: ADDRESS,
      location: {
        "@type": "Place",
        name: "SoCheers Mumbai",
        address: ADDRESS,
        geo: { "@type": "GeoCoordinates", latitude: 19.1365201, longitude: 72.8332081 },
      },
      email: "hello@socheers.net",
      contactPoint: [
        { "@type": "ContactPoint", contactType: "sales", email: "hello@socheers.net", areaServed: "IN" },
        { "@type": "ContactPoint", contactType: "careers", email: "careers@socheers.net" },
      ],
      areaServed: { "@type": "Country", name: "India" },
      knowsAbout: ["Brand strategy", "Digital strategy", "Creative", "Content", "Film production", "Social media marketing"],
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "en-IN",
      publisher: { "@id": ORG_ID },
    },
  ],
};

type Crumb = { name: string; path: string };

/* One page's node, its breadcrumb trail (Home is added in front) and any
   other nodes the page describes, as one @graph. */
export function pageGraph(
  {
    path,
    name,
    description,
    type = "WebPage",
    crumbs,
    extra = {},
  }: {
    path: string;
    name: string;
    description: string;
    type?: string;
    crumbs?: Crumb[];
    extra?: Json;
  },
  ...nodes: Json[]
) {
  const url = abs(path);
  const page: Json = {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    ...extra,
  };
  const graph: Json[] = [page, ...nodes];

  if (crumbs?.length) {
    page.breadcrumb = { "@id": `${url}#breadcrumb` };
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: abs(c.path),
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export { abs as absoluteUrl };
