"use client";

/* The admin panel's small parts: fields, buttons, dialogs, toasts, and
   the picture picker every editor shares. Styled in app/admin/admin.css. */
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from "react";
import { api, upload, type Upload } from "./api";

/* ---- toasts ---- */

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`adm-toast is-${t.tone}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---- confirm ---- */

type ConfirmOpts = { title: string; body?: string; action?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {state && (
        <Modal title={state.title} onClose={() => close(false)} small>
          {state.body && <p className="adm-muted">{state.body}</p>}
          <div className="adm-row adm-row--end">
            <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button variant={state.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
              {state.action ?? "Confirm"}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ---- controls ---- */

export function Button({
  variant = "default", busy, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" | "danger"; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      className={`adm-btn is-${variant}${busy ? " is-busy" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="adm-field">
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && <span className="adm-field__hint">{hint}</span>}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`adm-input ${p.className ?? ""}`} />;

export function TextArea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...p} className={`adm-input adm-textarea ${p.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-toggle__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Modal({ title, children, onClose, small, wide }: { title: string; children: ReactNode; onClose: () => void; small?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input:not([hidden]), textarea, select, button:not(.adm-icon)")?.focus();
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="adm-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`adm-modal__box${small ? " is-small" : ""}${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="adm-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal__body">{children}</div>
      </div>
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="adm-empty">{children}</div>;

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div className="adm-spinner" role="status" aria-label={label}><span /></div>;
}

/* ---- file drop ---- */

export function DropZone({ accept, onFiles, children, multiple }: { accept: string; onFiles: (f: File[]) => void; children: ReactNode; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`adm-drop${over ? " is-over" : ""}`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault(); setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); e.target.value = ""; }}
      />
      {children}
    </div>
  );
}

/* ---- pictures ---- */

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

export function useUploads(kind: Upload["kind"]) {
  const [items, setItems] = useState<Upload[] | null>(null);
  const reload = useCallback(() => {
    api<{ uploads: Upload[] }>("GET", `/uploads?kind=${kind}`).then((d) => setItems(d.uploads)).catch(() => setItems([]));
  }, [kind]);
  useEffect(reload, [reload]);
  return { items, reload };
}

export function ImageLibrary({ onPick, onClose }: { onPick: (u: Upload) => void; onClose: () => void }) {
  const { items, reload } = useUploads("image");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const add = async (files: File[]) => {
    setBusy(true);
    try {
      let last: Upload | null = null;
      for (const f of files) last = await upload(f, "image");
      reload();
      if (last && files.length === 1) onPick(last);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  const shown = (items ?? []).filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title="Pictures" onClose={onClose} wide>
      <DropZone accept={IMAGE_ACCEPT} onFiles={add} multiple>
        {busy ? <Spinner label="Uploading" /> : <><strong>Upload pictures</strong><span>Drop files here or click. PNG, JPG, WebP, GIF or AVIF, up to 10MB.</span></>}
      </DropZone>
      <Input placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} className="adm-mt" />
      {items === null ? <Spinner /> : shown.length === 0 ? <Empty>No pictures yet.</Empty> : (
        <div className="adm-library">
          {shown.map((u) => (
            <button key={u.id} type="button" className="adm-library__item" onClick={() => onPick(u)} title={u.name}>
              <img src={u.url} alt="" loading="lazy" />
              <span>{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function ImageField({
  label, value, onChange, alt, onAlt, hint,
}: { label: string; value: string; onChange: (src: string, u?: Upload) => void; alt?: string; onAlt?: (v: string) => void; hint?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="adm-field">
      <span className="adm-field__label">{label}</span>
      <div className="adm-imagefield">
        <button type="button" className="adm-imagefield__preview" onClick={() => setOpen(true)} aria-label={value ? "Change picture" : "Choose picture"}>
          {value ? <img src={value} alt="" /> : <span>+ Add picture</span>}
        </button>
        <div className="adm-imagefield__side">
          <div className="adm-row">
            <Button onClick={() => setOpen(true)}>{value ? "Change" : "Choose"}</Button>
            {value && <Button variant="ghost" onClick={() => onChange("")}>Remove</Button>}
          </div>
          {onAlt && (
            <Input placeholder="Describe the picture (for screen readers and search)" value={alt ?? ""} onChange={(e) => onAlt(e.target.value)} maxLength={300} />
          )}
          {hint && <span className="adm-field__hint">{hint}</span>}
        </div>
      </div>
      {open && <ImageLibrary onClose={() => setOpen(false)} onPick={(u) => { onChange(u.url, u); setOpen(false); }} />}
    </div>
  );
}

/* Warn before leaving with unsaved work. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}
