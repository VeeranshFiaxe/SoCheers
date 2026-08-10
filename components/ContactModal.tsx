"use client";

import { useEffect, useState } from "react";
import { IMG } from "@/lib/content";

/* Placeholder contact popup - swaps the old mailto CTA for a modal so the
   ask ("brief us") doesn't bounce straight to an email client. No submit
   wiring yet; it just holds the UI until there's a form endpoint. */
export default function ContactModal() {
  const [open, setOpen] = useState(false);

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
      <button
        type="button"
        className="contact__cta"
        data-magnetic
        data-cursor="Let's go"
        onClick={() => setOpen(true)}
      >
        <span>Let&rsquo;s chat</span>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {open && (
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
              <img src={IMG.team} alt="The SoCheers team" />
              <div className="cmodal__visual-veil" />
              <span className="cmodal__visual-tag">MAKING MORE HAPPEN</span>
            </div>

            <form
              className="cmodal__form"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <span className="tag">LET&rsquo;S TALK</span>
              <h3 className="cmodal__title">Tell us about the brief.</h3>

              <label className="cmodal__field">
                <span>Name</span>
                <input type="text" name="name" placeholder="Your name" required />
              </label>
              <label className="cmodal__field">
                <span>Email</span>
                <input type="email" name="email" placeholder="you@company.com" required />
              </label>
              <label className="cmodal__field">
                <span>Message</span>
                <textarea name="message" placeholder="What are you building?" rows={4} required />
              </label>

              <button type="submit" className="cmodal__submit">
                <span>Send it over</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
