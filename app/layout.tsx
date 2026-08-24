import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import "./globals.css";
import { Overlays } from "@/components/Chrome";
import Loader from "@/components/Loader";
import Nav from "@/components/Nav";
import Overture from "@/components/Overture";

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
    /* suppressHydrationWarning, and only for this one element's own
       attributes - it does not travel down the tree.

       The script in <head> below deliberately writes to this element's
       class list before React gets here: that is the whole point of it,
       the door has to be decided before the first paint rather than after
       hydration. So the class the server sent and the class the client
       finds are different by design, and React has no way to know that.
       Nothing else on <html> is React's to manage either - lib/motion.ts
       takes 'no-js' off and the overture bridge puts 'is-overture' on. */
    <html
      lang="en"
      className={`no-js ${sans.variable} ${playful.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The door, decided before anything paints.

            The loader is markup in <body> and it covers the screen, so
            "should it run?" cannot wait for hydration - on every visit
            that is not the first one, a React effect hiding it would be a
            full screen of black first and an answer second. This is the
            same question lib/overture.ts asks (shouldRunOverture), asked
            synchronously in the document head, and the stylesheet reads
            the class it leaves behind.

            The key is spelled out rather than imported because this runs
            before any module does. It is SEEN in lib/overture.ts - if one
            moves, both move. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('sc-overture-seen')==='1'||" +
              "matchMedia('(prefers-reduced-motion: reduce)').matches)" +
              "document.documentElement.classList.add('sc-seen')}catch(e){}",
          }}
        />
        {/* and if there is no script at all, there is no one to open it */}
        <noscript>
          <style>{".loader{display:none}"}</style>
        </noscript>
      </head>
      <body>
        {/* The shell, and it is outside the route on purpose.

            Everything below survives a navigation: the header keeps its
            identity so the green indicator can travel between tabs rather
            than repaint on each page (components/Nav.tsx), the cursor and
            the grain do not blink, and the bulb is mounted everywhere -
            which is what makes it the switch on every page and not just
            on the front one.

            Order is load-bearing. The overture has to come before .nav in
            the document: globals.css hides the header's own mark while the
            sequence is playing through a plain sibling combinator, and
            dockTarget() in lib/overture-motion.ts measures that mark to
            know where to fly the lamp. */}
        <Overlays />
        <Loader />
        <Overture />
        <Nav />
        {children}
      </body>
    </html>
  );
}
