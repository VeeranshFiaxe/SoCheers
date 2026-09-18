"use client";

/* The awards strip on the home page ("Every win counts."): each show,
   what was won there, and the colour of the marker swipe through it. */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AwardsRow } from "@/components/Awards";
import SitePreview from "./SitePreview";
import { AWARD_COLOURS, DEFAULT_AWARDS, awardColour } from "@/lib/cms/defaults";
import type { AwardColour, AwardItem, AwardsData } from "@/lib/cms/types";
import { api, uid } from "./api";
import { Button, Spinner, useConfirm, useToast, useUnsavedWarning } from "./ui";

const isCustom = (c: AwardColour) => c.startsWith("#");

export default function AwardsEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<AwardItem[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedWarning(dirty);

  const load = useCallback(() => {
    api<{ awards: AwardsData | null; updatedAt: number | null }>("GET", "/awards")
      .then((d) => { setItems((d.awards ?? DEFAULT_AWARDS).items); setUpdatedAt(d.updatedAt); setDirty(false); })
      .catch((e) => toast((e as Error).message, "error"));
  }, [toast]);
  useEffect(load, [load]);

  if (!items) return <Spinner />;

  const set = (next: AwardItem[]) => { setItems(next); setDirty(true); };
  const put = (i: number, p: Partial<AwardItem>) => set(items.map((a, j) => (j === i ? { ...a, ...p } : a)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  const save = async () => {
    if (items.some((a) => !a.name.trim())) { toast("Every award needs a name.", "error"); return; }
    setBusy(true);
    try {
      const r = await api<{ updatedAt: number }>("PUT", "/awards", { awards: { items }, updatedAt });
      setUpdatedAt(r.updatedAt);
      setDirty(false);
      toast("Saved - the home page shows the new awards.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Awards</h1>
          <p className="adm-muted">The moving strip at the bottom of the <a className="adm-link" href="/#awards" target="_blank" rel="noopener">home page ↗</a>. The award shows on hover.</p>
        </div>
        <div className="adm-row">
          <Button variant="ghost" onClick={async () => {
            if (await confirm({ title: "Start again from the original awards?", body: "Nothing changes on the site until you save.", action: "Reset" })) set(DEFAULT_AWARDS.items);
          }}>Reset to original</Button>
          <Button onClick={() => setPreviewing(true)}>Preview</Button>
          {dirty && <Button variant="ghost" onClick={load}>Discard changes</Button>}
          <Button variant="primary" onClick={save} busy={busy} disabled={!dirty}>Save</Button>
        </div>
      </header>

      {previewing && (
        <SitePreview title="Every win counts." className="awards" onClose={() => setPreviewing(false)}>
          <AwardsRow items={items} />
        </SitePreview>
      )}

      <div className="aw-preview" aria-label="Preview">
        {/* Each dot leads the show it points at, so a wrapped line starts
            with its dot; the row is pulled left by one dot + gap and the
            box clips it, so no line shows a leading dot. */}
        <div className="aw-preview__row">
          {items.map((a) => (
            <span key={a.id} className="aw-preview__item">
              <span className="amarquee__dot" style={{ "--swipe": awardColour(a.color) } as CSSProperties} />
              <span className="amarquee__show" style={{ "--swipe": awardColour(a.color) } as CSSProperties}>
                <b>{a.name || "Award name"}</b>
                <i className="amarquee__cat">{a.category}</i>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="adm-card aw-table">
        <div className="aw-row aw-row--head adm-small adm-muted">
          <span />
          <span>Given by</span>
          <span>Award won</span>
          <span>Strip colour</span>
          <span />
        </div>
        {items.map((a, i) => (
          <div className="aw-row" key={a.id}>
            <span className="aw-swatch" style={{ background: awardColour(a.color) }} aria-hidden="true" />
            <input className="adm-input" value={a.name} maxLength={80} placeholder="e.g. The Drum Global" aria-label="Given by"
              onChange={(e) => put(i, { name: e.target.value })} />
            <input className="adm-input" value={a.category} maxLength={120} placeholder="e.g. Social and influencer" aria-label="Award won"
              onChange={(e) => put(i, { category: e.target.value })} />
            <div className="adm-row">
              <select
                className="adm-input"
                aria-label="Strip colour"
                value={isCustom(a.color) ? "custom" : a.color}
                onChange={(e) => put(i, { color: e.target.value === "custom" ? AWARD_COLOURS.find((c) => c.id === a.color)?.hex as AwardColour ?? "#97509f" : e.target.value as AwardColour })}
              >
                {AWARD_COLOURS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="custom">Custom colour…</option>
              </select>
              {isCustom(a.color) && (
                <input type="color" className="aw-picker" value={a.color} aria-label="Custom colour"
                  onChange={(e) => put(i, { color: e.target.value as AwardColour })} />
              )}
            </div>
            <div className="adm-row aw-tools">
              <Button variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</Button>
              <Button variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</Button>
              <Button variant="ghost" disabled={items.length === 1} onClick={() => set(items.filter((_, j) => j !== i))} aria-label={`Remove ${a.name}`}>×</Button>
            </div>
          </div>
        ))}
        {items.length < 40 && (
          <div>
            <Button onClick={() => set([...items, { id: uid(), name: "", category: "", color: AWARD_COLOURS[items.length % 6].id }])}>+ Add an award</Button>
          </div>
        )}
      </div>
    </div>
  );
}
