"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IMG, TEAM_SIZES, TEAM_SRCSET } from "@/lib/content";
import { EMAIL_PATTERN, INTENTS, ZOHO_ACTION, ZOHO_TARGET_MODAL } from "@/lib/zoho-form";
import { ZohoHidden, ZohoPhone } from "./ZohoFields";

/* The footer's contact popup - the small, fast version of the front door
   at /contact. It posts to the same Zoho form the full page does (see
   lib/zoho-form.ts), on the "hire an agency" branch: the pop-up is the
   thing under a "brief us" headline, so a brief is the only thing it is
   ever collecting. Anyone after the other two branches gets the whole
   form on /contact. */
export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  /* The sink iframe fires `load` on attach, before anything is sent -
     only a load that follows our own submit is the reply. */
  const awaiting = useRef(false);
  /* The trigger lives in the footer's `.foot__ask`, which is a
     [data-foot-part] - GSAP keeps a transform on it (see initFooter in
     lib/motion.ts), and a transformed ancestor is what `position:fixed`
     resolves against. Rendered in place the dialog was therefore centred
     on that block rather than on the viewport, which is why it sat far
     down the screen. Portalling it to <body> puts it back on the
     viewport, wherever the trigger happens to be. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* No magnet. This button used to chase the pointer around its own
          box on an elastic ease - and it is the last thing on the page,
          sitting under a headline, so what the reader met at the end of
          the scroll was a control that would not hold still to be
          clicked. The fill still rises through it on hover
          (.contact__cta::before, app/globals.css), which is the response;
          the button stays where it is put. */}
      <button
        type="button"
        className="contact__cta"
        data-cursor="Let's go"
        onClick={() => setOpen(true)}
      >
        <span>Let&rsquo;s chat</span>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <div
          className="cmodal"
          role="dialog"
          aria-modal="true"
          aria-label="Start a project"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="cmodal__box">
            <button
              type="button"
              className="cmodal__close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>

            <div className="cmodal__visual">
              <img
                src={IMG.team}
                srcSet={TEAM_SRCSET}
                sizes={TEAM_SIZES}
                alt="The SoCheers team"
                loading="lazy"
                decoding="async"
              />
              <div className="cmodal__visual-veil" />
              <span className="cmodal__visual-tag">MAKING MORE HAPPEN</span>
            </div>

            {/* Where Zoho's reply lands. The endpoint sends no CORS
                headers, so the load event is the whole signal: the POST
                went through. */}
            <iframe
              name={ZOHO_TARGET_MODAL}
              title="Form submission"
              aria-hidden="true"
              tabIndex={-1}
              className="ctf__sink"
              onLoad={() => {
                if (!awaiting.current) return;
                awaiting.current = false;
                setSending(false);
                setSent(true);
              }}
            />

            {sent ? (
              <div className="cmodal__form cmodal__done" role="status" aria-live="polite">
                <h3 className="cmodal__title">Thank you.</h3>
                <p className="cmodal__done-note">
                  That just landed with the team. One of us will pick it up from here.
                </p>
              </div>
            ) : (
              <form
                className="cmodal__form"
                action={ZOHO_ACTION}
                method="post"
                encType="multipart/form-data"
                acceptCharset="UTF-8"
                target={ZOHO_TARGET_MODAL}
                /* No preventDefault - the browser posts it into the iframe
                   above and the modal stays open to say so. */
                onSubmit={() => {
                  awaiting.current = true;
                  setSending(true);
                }}
              >
                <h3 className="cmodal__title">Let&rsquo;s talk.</h3>

                <ZohoHidden />
                <input type="hidden" name="Radio" value={INTENTS.agency} readOnly />

                <label className="cmodal__field">
                  <span>Name</span>
                  <input type="text" name="Name_First" placeholder="First Last" autoComplete="name" required />
                </label>
                <label className="cmodal__field">
                  <span>Company</span>
                  <input type="text" name="Name_Last" placeholder="Brand or Org" autoComplete="organization" required />
                </label>
                <label className="cmodal__field">
                  <span>Email</span>
                  <input type="email" name="Email" placeholder="myname@companyname.com" autoComplete="email" pattern={EMAIL_PATTERN} maxLength={255} required />
                </label>
                <label className="cmodal__field">
                  <span>Phone</span>
                  <ZohoPhone prefix="PhoneNumber" />
                </label>
                <label className="cmodal__field">
                  <span>Message</span>
                  <textarea name="MultiLine" placeholder="Brief us." rows={3} required />
                </label>

                <button type="submit" className="cmodal__submit" disabled={sending}>
                  <span>{sending ? "Sending…" : "Send it over"}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
