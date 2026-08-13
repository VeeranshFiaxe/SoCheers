import type { Metadata } from "next";
import { Familjen_Grotesk, DM_Sans, Inter, Caveat, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const display = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const playful = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playful",
  display: "swap",
});

const loaderFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-loader",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

/* Still named "mono"/--font-mono - that variable drives every uppercase,
   letter-spaced label site-wide (nav links, tags, buttons), it just no
   longer points at an actual monospace face. */
const mono = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoCheers. Making more happen.",
  description:
    "SoCheers is an independent, integrated creative agency. Content, campaigns and culture for brands that want to lead, not lag.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`no-js ${display.variable} ${body.variable} ${mono.variable} ${playful.variable} ${loaderFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
