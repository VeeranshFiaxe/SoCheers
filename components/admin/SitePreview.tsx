"use client";

/* Full-screen preview of one home page section, drawn with the page's own
   components and the editor's unsaved state, so the rows move and hover
   exactly as they will once saved. */
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function SitePreview({ title, className, onClose, children }: { title: string; className: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return createPortal(
    <div className="adm adm-sitepreview" role="dialog" aria-modal="true" aria-label="Preview">
      <div className="adm-sitepreview__bar">
        <span className="adm-small">Preview · not saved yet</span>
        <button type="button" className="adm-btn" onClick={onClose}>Close preview</button>
      </div>
      <section className={`sec ${className}`}>
        <div className="wrap">
          <h2 className="sec__title">{title}</h2>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
