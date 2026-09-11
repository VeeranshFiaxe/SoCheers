"use client";

import { useRef, useState } from "react";
import ContactBulb from "./ContactBulb";
import { CONTACT_FORM } from "@/lib/contact-content";

/* /test only: the contact page's own form design, posting to the
   "SoCheers Test" Zoho form's plain-HTML endpoint (field names read off
   SoCheers form Test/index.html). Same hidden-iframe trick as
   ContactForm.tsx - the browser does the POST, the iframe's load is the
   signal it landed. */
const ACTION =
  "https://forms.zohopublic.in/veeranshfi1/form/SoCheersTest/formperma/2c93XV9YrsZYLy_dUjJC2kvMmPdKmyqJow7uF5QXUCE/htmlRecords/submit";
const TARGET = "zoho-test-sink";

export default function ZohoForm() {
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const awaiting = useRef(false);

  if (sentTo !== null) {
    return (
      <div className="ctf__done" role="status" aria-live="polite">
        <ContactBulb className="ctf__bulb" />
        <span className="tag ctf__done-tag">Brief received</span>
        <h2 className="ctf__done-title">
          {sentTo ? `Thanks, ${sentTo}.` : "Thank you."}
          <em>Now let&rsquo;s make more happen.</em>
        </h2>
        <p className="ctf__done-note">
          That just landed with the team. One of us will pick it up from here.
        </p>
      </div>
    );
  }

  return (
    <>
      <iframe
        name={TARGET}
        title="Form submission"
        aria-hidden="true"
        tabIndex={-1}
        className="ctf__sink"
        onLoad={() => {
          if (!awaiting.current) return;
          awaiting.current = false;
          const first =
            formRef.current?.querySelector<HTMLInputElement>('input[name="Name_First"]')?.value ?? "";
          setSending(false);
          setSentTo(first);
        }}
      />

      <form
        ref={formRef}
        className="ctf"
        action={ACTION}
        method="post"
        encType="multipart/form-data"
        acceptCharset="UTF-8"
        target={TARGET}
        onSubmit={(e) => {
          /* One visible name box, split into Zoho's First/Last before the
             browser sends. */
          const f = e.currentTarget;
          const parts = (f.elements.namedItem("fullname") as HTMLInputElement).value.trim().split(/\s+/);
          (f.elements.namedItem("Name_First") as HTMLInputElement).value = parts[0] ?? "";
          (f.elements.namedItem("Name_Last") as HTMLInputElement).value = parts.slice(1).join(" ");
          (f.elements.namedItem("zf_referrer_name") as HTMLInputElement).value = window.location.href;
          awaiting.current = true;
          setSending(true);
        }}
      >
        <input type="hidden" name="zf_referrer_name" defaultValue="" />
        <input type="hidden" name="zf_redirect_url" defaultValue="" />
        <input type="hidden" name="zc_gad" defaultValue="" />
        <input type="hidden" name="Name_First" defaultValue="" />
        <input type="hidden" name="Name_Last" defaultValue="" />

        <div className="ctf__row">
          <label className="ctf__field">
            <span>My name is</span>
            <input type="text" name="fullname" placeholder="First Last" autoComplete="name" maxLength={255} required />
          </label>
          <label className="ctf__field">
            <span>I am from</span>
            <input type="text" name="SingleLine" placeholder="Brand or Org" autoComplete="organization" maxLength={255} required />
          </label>
        </div>

        <div className="ctf__row">
          <label className="ctf__field">
            <span>My official email ID is</span>
            <input type="email" name="Email" placeholder="myname@companyname.com" autoComplete="email" maxLength={255} required />
          </label>
          <label className="ctf__field">
            <span>I&rsquo;d like a call back on</span>
            <input type="tel" name="PhoneNumber_countrycode" placeholder="+91 98765 43210" autoComplete="tel" maxLength={20} required />
          </label>
        </div>

        <label className="ctf__field">
          <span>I am looking for</span>
          <textarea
            name="MultiLine"
            placeholder="What aspects of advertising would you like to explore with SoCheers? Do share a bit about yourself or your organization."
            rows={5}
            required
          />
        </label>

        <button type="submit" className="ctf__submit" disabled={sending}>
          <span>{sending ? "Sending…" : CONTACT_FORM.submit}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </>
  );
}
