"use client";

import { useEffect, useState } from "react";
import { PHONE_CODE_PATTERN, PHONE_NUMBER_PATTERN, ZOHO_HIDDEN } from "@/lib/zoho-form";

/* Zoho's hidden inputs, filled once on mount: the page URL as the
   referrer, and any utm_* values from the query string. */
export function ZohoHidden() {
  const [vals, setVals] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v: Record<string, string> = {
      zf_referrer_name: window.location.href.slice(0, 1800),
    };
    for (const n of ZOHO_HIDDEN) {
      const x = q.get(n);
      if (n.startsWith("utm_") && x) v[n] = x;
    }
    setVals(v);
  }, []);

  return (
    <>
      {ZOHO_HIDDEN.map((n) => (
        <input key={n} type="hidden" name={n} value={vals[n] ?? ""} readOnly />
      ))}
    </>
  );
}

/* Zoho's phone field is two inputs: `<prefix>_countrycodeval` (+ and 1-4
   digits) and `<prefix>_countrycode` (digits only). Anything else typed
   is dropped as it is typed, so spaces or dashes never reach Zoho. */
export function ZohoPhone({ prefix }: { prefix: "PhoneNumber" | "PhoneNumber1" }) {
  return (
    <div className="zphone">
      <input
        type="text"
        name={`${prefix}_countrycodeval`}
        defaultValue="+91"
        inputMode="tel"
        autoComplete="tel-country-code"
        aria-label="Country code"
        maxLength={5}
        pattern={PHONE_CODE_PATTERN}
        required
        onInput={(e) => {
          const el = e.currentTarget;
          const d = el.value.replace(/\D/g, "").slice(0, 4);
          el.value = "+" + d;
        }}
      />
      <input
        type="tel"
        name={`${prefix}_countrycode`}
        placeholder="9876543210"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-label="Phone number"
        maxLength={20}
        pattern={PHONE_NUMBER_PATTERN}
        required
        onInput={(e) => {
          const el = e.currentTarget;
          el.value = el.value.replace(/\D/g, "");
        }}
      />
    </div>
  );
}
