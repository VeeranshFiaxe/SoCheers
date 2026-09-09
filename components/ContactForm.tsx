"use client";

import { useRef, useState } from "react";
import ContactBulb from "./ContactBulb";
import { CONTACT_FORM } from "@/lib/contact-content";
import { INTENTS, ZOHO_ACTION, ZOHO_HIDDEN, ZOHO_TARGET } from "@/lib/zoho-form";

/* The dedicated page's own form, and now a live one: it posts to the
   client's Zoho form (see lib/zoho-form.ts) rather than handing straight
   over to the thank-you.

   It is the site's own markup, not Zoho's embed - the panel is beige and
   white and set in the page's type, and an iframe of Zoho's own card
   could not be made to be either. What it borrows from Zoho is the field
   names and the branching, which have to match or a submission lands in
   the wrong column.

   The branching is Zoho's, mirrored here:
     - Hire an agency   -> Name / Email / Phone / brief
     - Work as partner  -> the second set of the same fields, plus a deck
     - Find my next job -> no fields at all. Zoho hides every input on
       this branch and shows a note pointing at the careers site, so
       there is nothing to submit and no submit button. */
type Intent = keyof typeof INTENTS;

const INTENT_COPY: { key: Intent; label: string }[] = [
  { key: "agency", label: "Hire an agency" },
  { key: "partner", label: "Work as a partner" },
  { key: "job", label: "Find my next job" },
];

export default function ContactForm() {
  const [intent, setIntent] = useState<Intent>("agency");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  /* The hidden iframe fires `load` once when it is first attached, well
     before anything is sent. Only a load that follows our own submit is
     the reply we are waiting for. */
  const awaiting = useRef(false);

  /* The whole point of the send: the mark comes up out of the panel and
     switches on, which is the same gesture the overture opens the site
     with, and then says the line it exists to say. Everything moving is
     CSS on .ctf__done (see app/contact/contact.css). */
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

  const partner = intent === "partner";

  return (
    <>
      {/* Where Zoho's reply lands. We cannot read it - the endpoint sends
          no CORS headers - so the load event is the whole signal: the
          POST completed. */}
      <iframe
        name={ZOHO_TARGET}
        title="Form submission"
        aria-hidden="true"
        tabIndex={-1}
        className="ctf__sink"
        onLoad={() => {
          if (!awaiting.current) return;
          awaiting.current = false;
          const first =
            formRef.current
              ?.querySelector<HTMLInputElement>('input[name$="_First"]')
              ?.value.trim()
              .split(/\s+/)[0] ?? "";
          setSending(false);
          setSentTo(first);
        }}
      />

      <form
        ref={formRef}
        className="ctf"
        action={ZOHO_ACTION}
        method="post"
        encType="multipart/form-data"
        target={ZOHO_TARGET}
        /* No preventDefault: the browser does the POST itself, into the
           iframe above. All this does is mark that a reply is now ours
           to act on and put the button into its sending state. */
        onSubmit={() => {
          awaiting.current = true;
          setSending(true);
        }}
      >
        {Object.entries(ZOHO_HIDDEN).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} readOnly />
        ))}
        <input type="hidden" name="Radio" value={INTENTS[intent]} readOnly />

        <fieldset className="ctf__intent">
          <legend className="ctf__intent-legend">I am here to</legend>
          <div className="ctf__intent-row">
            {INTENT_COPY.map((o) => (
              <label
                key={o.key}
                className="ctf__intent-opt"
                data-on={intent === o.key ? "" : undefined}
              >
                <input
                  type="radio"
                  name="intent"
                  value={o.key}
                  checked={intent === o.key}
                  onChange={() => setIntent(o.key)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {intent === "job" ? (
          /* Zoho's own copy for this branch, less the middle line: the two
             location pages it linked to (join-the-cheersquad-mumbai and
             -bengaluru) do not exist any more, so the whole item went with
             them rather than leaving two dead links in the panel.

             Set as two labelled rows rather than a bulleted list - it is
             two routes to the same place, and a list of two with a marker
             beside each read as a form with no fields in it. There is
             deliberately no submit: on this branch Zoho collects nothing. */
          <div className="ctf__note">
            <p className="ctf__note-lead">
              Since you are interested in working at SoCheers, here is how we do
              most of our hiring.
            </p>

            <a
              className="ctf__note-row"
              href="https://socheers.net/careers/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ctf__note-label">Open roles</span>
              <span className="ctf__note-value">SoCheers.net &gt; Careers</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>

            <a className="ctf__note-row" href="mailto:careers@socheers.net">
              <span className="ctf__note-label">Our recruitment team</span>
              <span className="ctf__note-value">careers@socheers.net</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        ) : (
          <>
            {/* Two parallel sets of the same fields, because that is how the
                Zoho form is built - `Name`/`Email`/`PhoneNumber` belong to
                the agency branch and `Name1`/`Email1`/`PhoneNumber1` to the
                partner one, and Zoho drops whichever set does not match the
                radio. Only the live set is rendered, so the other never
                posts an empty value over a mandatory field. */}
            <div className="ctf__row">
              <label className="ctf__field">
                <span>My name is</span>
                <input
                  type="text"
                  name={partner ? "Name1_First" : "Name_First"}
                  placeholder="First Last"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="ctf__field">
                <span>I am from</span>
                <input
                  type="text"
                  name={partner ? "Name1_Last" : "Name_Last"}
                  placeholder="Brand or Org"
                  autoComplete="organization"
                  required
                />
              </label>
            </div>

            <div className="ctf__row">
              <label className="ctf__field">
                <span>My official email ID is</span>
                <input
                  type="email"
                  name={partner ? "Email1" : "Email"}
                  placeholder="myname@companyname.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="ctf__field">
                <span>I&rsquo;d like a call back on</span>
                <input
                  type="tel"
                  name={partner ? "PhoneNumber1" : "PhoneNumber"}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  required
                />
              </label>
            </div>

            {partner ? (
              /* The partner branch's one extra ask. Zoho takes a single PDF
                 up to 5 MB; the accept and the size check are here so a
                 file that will be rejected is caught before the round trip
                 rather than after it. */
              <label className="ctf__field ctf__file">
                <span>Upload resume or portfolio (up to 5 MB, PDF)</span>
                <input
                  type="file"
                  name="FileUpload"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const f = input.files?.[0];
                    if (f && f.size > 5 * 1024 * 1024) {
                      input.value = "";
                      setFileName("");
                      input.setCustomValidity("That file is over 5 MB.");
                      input.reportValidity();
                      return;
                    }
                    input.setCustomValidity("");
                    setFileName(f ? f.name : "");
                  }}
                />
                <span className="ctf__file-face" aria-hidden="true">
                  {fileName || "Choose a PDF"}
                </span>
              </label>
            ) : (
              <label className="ctf__field">
                <span>I am looking for</span>
                <textarea
                  name="MultiLine"
                  placeholder="What aspects of advertising would you like to explore with SoCheers? Do share a bit about yourself or your organization."
                  rows={5}
                  required
                />
              </label>
            )}

            <button type="submit" className="ctf__submit" disabled={sending}>
              <span>{sending ? "Sending…" : CONTACT_FORM.submit}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}
      </form>
    </>
  );
}
