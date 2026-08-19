import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import "./globals.css";

/* One face for the whole site. The weight does the talking:
   700 for headings, 500 for accents (the uppercase, letter-spaced
   labels), 400 for body copy.

   Satoshi is self-hosted (app/fonts) rather than pulled off a CDN -
   it is not on Google Fonts, and next/font/local inlines it the same
   way next/font/google would: hashed, preloaded, no layout shift. */
const sans = localFont({
  src: [
    /* the italics are real cuts, not synthesised - the home page's
       pitch, the About lede and the contact heads all lean on them */
    { path: "./fonts/Satoshi-Regular.woff2",    weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Italic.woff2",     weight: "400", style: "italic" },
    { path: "./fonts/Satoshi-Medium.woff2",     weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/Satoshi-Bold.woff2",       weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

/* The exception, and it is spent in exactly two places, both of them
   things the site writes by hand rather than sets in type:

   - the headword in the dictionary entry on the home page
     (.meaning__word) - "SoCheers" is being defined there as a word;
   - the numerals on the About page's drivers (.driver__head i) - an
     index, not a word in the copy.

   No running copy takes this, and no heading does either. The moment a
   sentence is written in it, it stops reading as handwriting on the page
   and starts reading as a second typeface. */
const playful = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playful",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoCheers. Making more happen.",
  description:
    "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`no-js ${sans.variable} ${playful.variable}`}>
      <body>{children}</body>
    </html>
  );
}
