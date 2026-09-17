"use client";

/* A white paper or a report: the card copy beside the reader, and the
   PDF behind it. */
import { useEffect, useState } from "react";
import type { Entry, PaperData } from "@/lib/cms/types";
import { api, slugify, upload } from "./api";
import { renderPdfPages } from "./pdfPages";
import { Button, DropZone, Field, Input, Spinner, TextArea, Toggle, useConfirm, useToast, useUnsavedWarning } from "./ui";

const LABEL = { whitepaper: "White paper", report: "Report" } as const;

const blank = (type: "whitepaper" | "report"): Entry => ({
  type, slug: "", title: "", excerpt: "", cover: "", cover_alt: "", author: "", tags: [], status: "draft",
  data: { tag: type === "report" ? "Featured report" : "Featured whitepaper", points: [""], pdf: "", file: "", cta: type === "report" ? "Open the report" : "Open the paper", pages: [] },
});

export default function PaperEditor({ type, id, go }: { type: "whitepaper" | "report"; id: number | null; go: (hash: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [entry, setEntry] = useState<Entry | null>(id === null ? blank(type) : null);
  const [savedId, setSavedId] = useState<number | null>(id);
  const [updatedAt, setUpdatedAt] = useState<number | undefined>();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  useUnsavedWarning(dirty || !!pdfProgress);
  const back = `#/insights/${type}`;

  useEffect(() => {
    if (id === null) return;
    api<{ entry: Entry }>("GET", `/entries/${id}`)
      .then((d) => { setEntry(d.entry); setUpdatedAt(d.entry.updated_at); })
      .catch((e) => toast((e as Error).message, "error"));
  }, [id, toast]);

  if (!entry) return <Spinner />;
  const d = entry.data as PaperData;
  const patch = (p: Partial<Entry>) => { setEntry({ ...entry, ...p }); setDirty(true); };
  const patchData = (p: Partial<PaperData>) => { setEntry({ ...entry, data: { ...d, ...p } }); setDirty(true); };

  const onPdf = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      setPdfProgress("Uploading the PDF…");
      const up = await upload(file, "pdf", file.name.replace(/\.pdf$/i, ""));
      setPdfProgress("Reading pages…");
      const pages = await renderPdfPages(file, (done, total) => setPdfProgress(`Making page pictures - ${done} of ${total}`));
      setEntry((cur) => cur && { ...cur, data: { ...(cur.data as PaperData), pdf: up.url, pages, file: (cur.data as PaperData).file || file.name } });
      setDirty(true);
      toast(`PDF ready - ${pages.length} pages.`);
    } catch (e) {
      toast((e as Error).message || "Couldn't read that PDF.", "error");
    } finally {
      setPdfProgress(null);
    }
  };

  const save = async () => {
    if (!entry.title.trim()) { toast("Add a title first.", "error"); return; }
    const body = { ...entry, slug: entry.slug || slugify(entry.title), data: { ...d, points: d.points.filter((p) => p.trim()) }, updatedAt };
    setBusy(true);
    try {
      if (savedId) {
        const r = await api<{ updatedAt: number }>("PUT", `/entries/${savedId}`, body);
        setUpdatedAt(r.updatedAt);
      } else {
        const r = await api<{ id: number; updatedAt: number }>("POST", "/entries", body);
        setSavedId(r.id);
        setUpdatedAt(r.updatedAt);
        window.history.replaceState(null, "", `#/paper/${type}/${r.id}`);
      }
      setEntry(body);
      setDirty(false);
      toast("Saved.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!savedId) { go(back); return; }
    if (!(await confirm({ title: `Delete this ${LABEL[type].toLowerCase()}?`, body: "It comes off the Insights page straight away.", action: "Delete", danger: true }))) return;
    await api("DELETE", `/entries/${savedId}`).then(() => { setDirty(false); toast("Deleted."); go(back); }).catch((e) => toast((e as Error).message, "error"));
  };

  return (
    <div className="adm-page">
      <div className="pe-bar">
        <button type="button" className="adm-back" onClick={async () => {
          if (dirty && !(await confirm({ title: "Leave without saving?", action: "Leave", danger: true }))) return;
          setDirty(false); go(back);
        }}>← {LABEL[type]}s</button>
        <span className="pe-bar__spacer" />
        <Toggle checked={entry.status === "published"} onChange={(v) => patch({ status: v ? "published" : "draft" })} label="Show on the site" />
        <Button variant="primary" onClick={save} busy={busy} disabled={!!pdfProgress}>Save</Button>
      </div>

      <div className="adm-two">
        <div className="adm-card adm-stack">
          <Field label="Label above the title"><Input value={d.tag} maxLength={60} onChange={(e) => patchData({ tag: e.target.value })} /></Field>
          <Field label="Title">
            <Input value={entry.title} maxLength={200} onChange={(e) => patch(savedId ? { title: e.target.value } : { title: e.target.value, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Summary"><TextArea rows={4} value={entry.excerpt} maxLength={1000} onChange={(e) => patch({ excerpt: e.target.value })} /></Field>
          <div className="adm-field">
            <span className="adm-field__label">Key points</span>
            {d.points.map((p, i) => (
              <div className="adm-row" key={i}>
                <Input value={p} maxLength={300} onChange={(e) => patchData({ points: d.points.map((x, j) => (j === i ? e.target.value : x)) })} />
                <Button variant="ghost" disabled={i === 0} onClick={() => { const a = [...d.points]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; patchData({ points: a }); }} aria-label="Move up">↑</Button>
                <Button variant="ghost" onClick={() => patchData({ points: d.points.filter((_, j) => j !== i) })} aria-label="Remove">×</Button>
              </div>
            ))}
            {d.points.length < 12 && <Button variant="ghost" onClick={() => patchData({ points: [...d.points, ""] })}>+ Add point</Button>}
          </div>
          <Field label="Button text"><Input value={d.cta} maxLength={60} onChange={(e) => patchData({ cta: e.target.value })} /></Field>
          <Field label="Internal name" hint="Used for the page picture folder and to tell entries apart. Letters, numbers and dashes.">
            <Input value={entry.slug} maxLength={80} onChange={(e) => patch({ slug: slugify(e.target.value) })} />
          </Field>
        </div>

        <div className="adm-card adm-stack">
          <div className="adm-field">
            <span className="adm-field__label">The PDF</span>
            <DropZone accept="application/pdf" onFiles={onPdf}>
              {pdfProgress ? <><Spinner label={pdfProgress} /><span>{pdfProgress}</span></> : (
                <><strong>{d.pdf ? "Replace the PDF" : "Upload the PDF"}</strong><span>Drop it here or click. Up to 80MB. Its pages are turned into pictures for the reader.</span></>
              )}
            </DropZone>
            {d.pdf && <a className="adm-link adm-small" href={d.pdf} target="_blank" rel="noopener">Open current PDF ↗</a>}
          </div>
          <Field label="Download file name"><Input value={d.file} maxLength={160} onChange={(e) => patchData({ file: e.target.value })} placeholder="Report-name.pdf" /></Field>
          <div className="adm-field">
            <span className="adm-field__label">Reader pages ({d.pages.length})</span>
            {d.pages.length ? (
              <div className="adm-pages">
                {d.pages.slice(0, 12).map((src, i) => <img key={i} src={src} alt={`Page ${i + 1}`} loading="lazy" />)}
                {d.pages.length > 12 && <span className="adm-muted adm-small">+{d.pages.length - 12} more</span>}
              </div>
            ) : <span className="adm-muted adm-small">Upload a PDF to make these.</span>}
          </div>
          <div className="adm-danger-zone"><Button variant="danger" onClick={del}>{savedId ? "Delete" : "Discard"}</Button></div>
        </div>
      </div>
    </div>
  );
}
