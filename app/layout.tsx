import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

/* One face for the whole site. The weight does the talking:
   700 for headings, 500 for accents (the uppercase, letter-spaced
   labels), 400 for body copy. */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoCheers. Making more happen.",
  description:
    "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`no-js ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
