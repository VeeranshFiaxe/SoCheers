"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS } from "@/lib/analytics";

/* Google Analytics and the Meta Pixel, each loaded only when its ID is
   set in lib/analytics.ts. Never on /admin - staff visits would pollute
   the numbers, and the admin has no business sending data out.

   Page changes inside the site are client-side, so no new document loads.
   GA4 counts those on its own (enhanced measurement listens to the
   history API); the Pixel does not, so it is told here. */
export default function Analytics() {
  const path = usePathname() || "/";
  const off = path.startsWith("/admin");
  const first = useRef(true);

  useEffect(() => {
    if (off || !ANALYTICS.metaPixel) return;
    /* the init snippet already sent the landing page's view */
    if (first.current) { first.current = false; return; }
    (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "PageView");
  }, [path, off]);

  if (off) return null;
  const { ga4, metaPixel } = ANALYTICS;

  return (
    <>
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}');`}
          </Script>
        </>
      )}
      {metaPixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
