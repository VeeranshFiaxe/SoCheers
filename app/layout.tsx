import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";

/* One face for the whole site. The weight does the talking:
   700 for headings, 500 for accents (the uppercase, letter-spaced
   labels), 400 for body copy. */
const sans = Inter({
  subsets: ["latin"],
  /* the italic is real, not synthesised - the home page's pitch, the
     About lede and the contact heads all lean on it */
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

/* The one exception, and it is a single element: the headword in the
   dictionary entry on the home page (.meaning__word). "SoCheers" is being
   defined there as a word, so it is the one place the site writes by hand
   rather than sets in type. Nothing else may take this. */
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
