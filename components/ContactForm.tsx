"use client";

import { CONTACT_FORM } from "@/lib/contact-content";

/* The dedicated page's own form - not the footer pop-up reused, a proper
   inline one with the room a full page gives it. Same three-field core as
   the pop-up (name, email, message) plus what a real brief intake asks for
   beyond that. No submit wiring yet, same as the pop-up and the whitepaper
   form. */
export default function ContactForm() {
  return (
    <form className="ctf" onSubmit={(e) => e.preventDefault()}>
      <span className="tag">{CONTACT_FORM.tag}</span>
      <h2 className="ctf__title">{CONTACT_FORM.title}</h2>

      <div className="ctf__row">
        <label className="ctf__field">
          <span>Name</span>
          <input type="text" name="name" placeholder="Your name" required />
        </label>
        <label className="ctf__field">
          <span>Email</span>
          <input type="email" name="email" placeholder="you@company.com" required />
        </label>
      </div>

      <div className="ctf__row">
        <label className="ctf__field">
          <span>Company</span>
          <input type="text" name="company" placeholder="Where you work" />
        </label>
        <label className="ctf__field">
          <span>Phone</span>
          <input type="tel" name="phone" placeholder="Optional" />
        </label>
      </div>

      <div className="ctf__row">
        <label className="ctf__field">
          <span>What's this about?</span>
          <select name="reason" defaultValue={CONTACT_FORM.reasons[0]}>
            {CONTACT_FORM.reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="ctf__field">
          <span>Where are you based?</span>
          <input type="text" name="location" placeholder="City, country" />
        </label>
      </div>

      <label className="ctf__field">
        <span>Message</span>
        <textarea name="message" placeholder="Brief us." rows={5} required />
      </label>

      <button type="submit" className="ctf__submit">
        <span>{CONTACT_FORM.submit}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
