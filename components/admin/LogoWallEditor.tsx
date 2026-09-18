"use client";

/* The client wall on the home page ("Who do we do it with."): its rows,
   and each name on them - a logo picture, or the name typed in a chosen
   font. */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { BUILT_IN_FONTS, DEFAULT_WALL, fontFamily, loadFonts } from "@/lib/cms/defaults";
import type { FontFile, LogoWall, WallItem, WallRow } from "@/lib/cms/types";
import { ClientRows } from "@/components/Clients";
import SitePreview from "./SitePreview";
import { api, uid, upload, type Upload } from "./api";
import { Button, DropZone, Field, IMAGE_ACCEPT, ImageLibrary, Input, Modal, Spinner, Toggle, useConfirm, useToast, useUnsavedWarning, useUploads } from "./ui";

const DRAG = "application/x-sc-wall-item";

export default function LogoWallEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const [wall, setWall] = useState<LogoWall | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [editing, setEditing] = useState<{ row: number; index: number | null } | null>(null);
  const fonts = useUploads("font");
  useUnsavedWarning(dirty);

  const allFonts: FontFile[] = [...BUILT_IN_FONTS, ...(fonts.items ?? []).map((f) => ({ id: f.id, name: f.name, url: f.url }))];
  useEffect(() => { if (fonts.items) loadFonts(fonts.items.map((f) => ({ id: f.id, name: f.name, url: f.url }))); }, [fonts.items]);

  const load = useCallback(() => {
    api<{ wall: LogoWall | null; updatedAt: number | null }>("GET", "/logo-wall")
      .then((d) => { setWall(d.wall ?? DEFAULT_WALL); setUpdatedAt(d.updatedAt); setDirty(false); })
      .catch((e) => toast((e as Error).message, "error"));
  }, [toast]);
  useEffect(load, [load]);

  if (!wall) return <Spinner />;

  const setRows = (rows: WallRow[]) => { setWall({ rows }); setDirty(true); };
  const setRow = (i: number, p: Partial<WallRow>) => setRows(wall.rows.map((r, j) => (j === i ? { ...r, ...p } : r)));

  const save = async () => {
    setBusy(true);
    try {
      const r = await api<{ updatedAt: number }>("PUT", "/logo-wall", { wall, updatedAt });
      setUpdatedAt(r.updatedAt);
      setDirty(false);
      toast("Saved - the home page shows the new wall.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!(await confirm({ title: "Start again from the original wall?", body: "Replaces the rows here with the wall the site shipped with. Nothing changes on the site until you save.", action: "Reset" }))) return;
    setRows(DEFAULT_WALL.rows);
  };

  const moveItem = (from: { row: number; index: number }, to: { row: number; index: number }) => {
    const rows = wall.rows.map((r) => ({ ...r, items: [...r.items] }));
    const [item] = rows[from.row].items.splice(from.index, 1);
    let at = to.index;
    if (from.row === to.row && from.index < to.index) at -= 1;
    rows[to.row].items.splice(at, 0, item);
    setRows(rows);
  };

  const saveItem = (item: WallItem) => {
    if (!editing) return;
    const rows = wall.rows.map((r) => ({ ...r, items: [...r.items] }));
    if (editing.index === null) rows[editing.row].items.push(item);
    else rows[editing.row].items[editing.index] = item;
    setRows(rows);
    setEditing(null);
  };

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <h1>Logo wall</h1>
          <p className="adm-muted">The moving rows of client names on the <a className="adm-link" href="/#who" target="_blank" rel="noopener">home page ↗</a>. Drag names to reorder them or move them between rows.</p>
        </div>
        <div className="adm-row">
          <Button variant="ghost" onClick={reset}>Reset to original</Button>
          <Button onClick={() => setPreviewing(true)}>Preview</Button>
          {dirty && <Button variant="ghost" onClick={load}>Discard changes</Button>}
          <Button variant="primary" onClick={save} busy={busy} disabled={!dirty}>Save</Button>
        </div>
      </header>

      {previewing && (
        <SitePreview title="Who do we do it with." className="clients" onClose={() => setPreviewing(false)}>
          <ClientRows wall={wall} />
        </SitePreview>
      )}

      {wall.rows.map((row, r) => (
        <section key={r} className="adm-card lw-row">
          <div className="lw-row__head">
            <h2 className="adm-h3">Row {r + 1} <span className="adm-muted adm-small">· {row.items.length} names</span></h2>
            <div className="adm-seg" role="radiogroup" aria-label="Direction">
              <button type="button" className={row.dir === "left" ? "is-on" : ""} onClick={() => setRow(r, { dir: "left" })}>← Moves left</button>
              <button type="button" className={row.dir === "right" ? "is-on" : ""} onClick={() => setRow(r, { dir: "right" })}>Moves right →</button>
            </div>
            <label className="lw-speed">
              <span className="adm-small adm-muted">Speed</span>
              {/* the number is seconds per pass, so slower is bigger - the slider runs the friendly way round */}
              <input type="range" min={8} max={120} value={128 - row.speed} onChange={(e) => setRow(r, { speed: 128 - Number(e.target.value) })} />
            </label>
            <div className="adm-row">
              <Button variant="ghost" disabled={r === 0} onClick={() => { const a = [...wall.rows]; [a[r - 1], a[r]] = [a[r], a[r - 1]]; setRows(a); }} aria-label="Move row up">↑</Button>
              <Button variant="ghost" disabled={r === wall.rows.length - 1} onClick={() => { const a = [...wall.rows]; [a[r + 1], a[r]] = [a[r], a[r + 1]]; setRows(a); }} aria-label="Move row down">↓</Button>
              <Button variant="ghost" onClick={async () => {
                if (row.items.length && !(await confirm({ title: `Remove row ${r + 1}?`, body: `Its ${row.items.length} names go too.`, action: "Remove row", danger: true }))) return;
                setRows(wall.rows.filter((_, j) => j !== r));
              }}>Remove row</Button>
            </div>
          </div>

          <div className="lw-preview" aria-label="Preview">
            <div className="cmarquee__track lw-preview__track">
              {row.items.map((it) => <Preview key={it.id} item={it} />)}
            </div>
          </div>

          <div
            className="lw-items"
            onDragOver={(e) => { if (e.dataTransfer.types.includes(DRAG)) e.preventDefault(); }}
            onDrop={(e) => {
              const raw = e.dataTransfer.getData(DRAG);
              if (!raw || (e.target as HTMLElement).closest(".lw-item")) return;
              moveItem(JSON.parse(raw), { row: r, index: row.items.length });
            }}
          >
            {row.items.map((it, i) => (
              <div
                key={it.id}
                className="lw-item"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData(DRAG, JSON.stringify({ row: r, index: i })); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { if (e.dataTransfer.types.includes(DRAG)) { e.preventDefault(); e.currentTarget.classList.add("is-over"); } }}
                onDragLeave={(e) => e.currentTarget.classList.remove("is-over")}
                onDrop={(e) => {
                  e.currentTarget.classList.remove("is-over");
                  const raw = e.dataTransfer.getData(DRAG);
                  if (raw) { e.preventDefault(); moveItem(JSON.parse(raw), { row: r, index: i }); }
                }}
              >
                <span className="adm-grip" aria-hidden="true">⋮⋮</span>
                <button type="button" className="lw-item__main" onClick={() => setEditing({ row: r, index: i })}>
                  {it.kind === "mark" ? <img src={it.src} alt="" /> : <span className="lw-item__aa" style={{ fontFamily: fontFamily(it.font) }}>Aa</span>}
                  <span>{it.name}</span>
                </button>
                <button type="button" className="adm-icon" aria-label={`Remove ${it.name}`} onClick={() => setRow(r, { items: row.items.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
            <button type="button" className="lw-add" onClick={() => setEditing({ row: r, index: null })}>+ Add a name</button>
          </div>
        </section>
      ))}

      {wall.rows.length < 8 && (
        <Button onClick={() => setRows([...wall.rows, { dir: wall.rows.length % 2 ? "right" : "left", speed: 34, items: [] }])}>+ Add a row</Button>
      )}

      {editing && (
        <ItemEditor
          initial={editing.index === null ? null : wall.rows[editing.row].items[editing.index]}
          fonts={allFonts}
          onFontsChanged={fonts.reload}
          onClose={() => setEditing(null)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function Preview({ item }: { item: WallItem }) {
  if (item.kind === "mark" && item.display === "image") {
    return (
      <span className="bmark bmark--img" style={{ "--ar": item.ar, "--k": item.k } as CSSProperties}>
        <img src={item.src} alt={item.name} />
      </span>
    );
  }
  if (item.kind === "mark") {
    return <span className="bmark" title={item.name} style={{ "--mark": `url(${item.src})`, "--ar": item.ar, "--k": item.k } as CSSProperties} />;
  }
  return (
    <span style={{
      fontFamily: fontFamily(item.font), fontWeight: item.weight, fontStyle: item.italic ? "italic" : undefined,
      textTransform: item.upper ? "uppercase" : undefined, fontSize: `calc(var(--bw-size) * ${item.k})`,
    }}>
      {item.name}
    </span>
  );
}

function ItemEditor({
  initial, fonts, onFontsChanged, onClose, onSave,
}: { initial: WallItem | null; fonts: FontFile[]; onFontsChanged: () => void; onClose: () => void; onSave: (i: WallItem) => void }) {
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<WallItem["kind"]>(initial?.kind ?? "mark");
  const [k, setK] = useState(initial?.k ?? 1);
  const [src, setSrc] = useState(initial?.kind === "mark" ? initial.src : "");
  const [ar, setAr] = useState(initial?.kind === "mark" ? initial.ar : 3);
  const [display, setDisplay] = useState<"mask" | "image">(initial?.kind === "mark" ? initial.display : "mask");
  const [font, setFont] = useState(initial?.kind === "text" ? initial.font : "");
  const [weight, setWeight] = useState<400 | 500 | 700 | 900>(initial?.kind === "text" ? initial.weight : 700);
  const [italic, setItalic] = useState(initial?.kind === "text" ? initial.italic : false);
  const [upper, setUpper] = useState(initial?.kind === "text" ? initial.upper : false);
  const [library, setLibrary] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = (u: Upload) => {
    setSrc(u.url);
    if (u.width && u.height) setAr(Math.round((u.width / u.height) * 100) / 100);
    else {
      const img = new Image();
      img.onload = () => setAr(Math.round((img.naturalWidth / img.naturalHeight) * 100) / 100);
      img.src = u.url;
    }
    if (!name) setName(u.name.replace(/[-_]/g, " "));
    setLibrary(false);
  };

  const uploadImage = async (files: File[]) => {
    if (!files[0]) return;
    setBusy(true);
    try { pick(await upload(files[0], "image", files[0].name.replace(/\.\w+$/, ""))); }
    catch (e) { toast((e as Error).message, "error"); }
    finally { setBusy(false); }
  };

  const uploadFont = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const up = await upload(f, "font", f.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
      loadFonts([{ id: up.id, name: up.name, url: up.url }]);
      onFontsChanged();
      setFont(up.id);
      toast(`Font “${up.name}” added.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const item: WallItem | null = !name.trim() ? null : kind === "mark"
    ? (src ? { id: initial?.id ?? uid(), name: name.trim(), kind, src, ar, k, display } : null)
    : { id: initial?.id ?? uid(), name: name.trim(), kind, k, font, weight, italic, upper };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : "Add a name to the wall"} onClose={onClose} wide>
      <div className="lw-editor">
        <div className="adm-stack">
          <Field label="Client name" hint={kind === "mark" ? "Not shown - used for screen readers and to find it here." : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Netflix" />
          </Field>
          <div className="adm-seg adm-seg--full" role="radiogroup">
            <button type="button" className={kind === "mark" ? "is-on" : ""} onClick={() => setKind("mark")}>Logo picture</button>
            <button type="button" className={kind === "text" ? "is-on" : ""} onClick={() => setKind("text")}>Typed name</button>
          </div>

          {kind === "mark" ? (
            <>
              <DropZone accept={IMAGE_ACCEPT} onFiles={uploadImage}>
                {busy ? <Spinner label="Uploading" /> : src ? (
                  <img className="lw-editor__logo" src={src} alt="" />
                ) : (
                  <><strong>Upload the official logo</strong><span>PNG or WebP with a see-through background works best.</span></>
                )}
              </DropZone>
              <div className="adm-row">
                <Button variant="ghost" onClick={() => setLibrary(true)}>Choose from uploaded pictures</Button>
                {src && <Button variant="ghost" onClick={() => setSrc("")}>Remove</Button>}
              </div>
              <Field label="How it shows">
                <div className="adm-seg adm-seg--full" role="radiogroup">
                  <button type="button" className={display === "mask" ? "is-on" : ""} onClick={() => setDisplay("mask")}>Grey, colours on hover</button>
                  <button type="button" className={display === "image" ? "is-on" : ""} onClick={() => setDisplay("image")}>Logo&rsquo;s own colours</button>
                </div>
              </Field>
              {display === "mask" && (
                <p className="adm-muted adm-small">This uses the logo&rsquo;s shape only, like the rest of the wall - so the picture needs a see-through background. A logo on a solid box shows as a solid block.</p>
              )}
            </>
          ) : (
            <>
              <Field label="Font">
                <select className="adm-input" value={font} onChange={(e) => setFont(e.target.value)}>
                  {fonts.map((f) => <option key={f.id || "site"} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
              <DropZone accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" onFiles={uploadFont}>
                {busy ? <Spinner label="Uploading" /> : <><strong>Upload a font</strong><span>WOFF2, WOFF, TTF or OTF. Only upload fonts you have a web licence for.</span></>}
              </DropZone>
              <div className="adm-row adm-row--wrap">
                <Field label="Weight">
                  <select className="adm-input" value={weight} onChange={(e) => setWeight(Number(e.target.value) as 400 | 500 | 700 | 900)}>
                    <option value={400}>Regular</option>
                    <option value={500}>Medium</option>
                    <option value={700}>Bold</option>
                    <option value={900}>Black</option>
                  </select>
                </Field>
                <Toggle checked={italic} onChange={setItalic} label="Italic" />
                <Toggle checked={upper} onChange={setUpper} label="Capitals" />
              </div>
            </>
          )}

          <Field label={`Size - ${Math.round(k * 100)}%`} hint="Balance it against the names around it.">
            <input type="range" min={30} max={250} value={Math.round(k * 100)} onChange={(e) => setK(Number(e.target.value) / 100)} />
          </Field>
        </div>

        <div className="lw-editor__preview">
          <span className="adm-small adm-muted">Preview - point at it to see the hover</span>
          <div className="cmarquee__track lw-preview__track" style={{ "--brand": "var(--sky)", "--tilt": "-1.5deg", "--pop": 1.22 } as CSSProperties}>
            <span className="s" aria-hidden="true">✦</span>
            {item ? <Preview item={item} /> : <span className="adm-muted">{kind === "mark" ? "Add a logo" : "Type a name"}</span>}
            <span className="s" aria-hidden="true">✦</span>
          </div>
        </div>
      </div>
      <div className="adm-row adm-row--end adm-mt">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!item} onClick={() => item && onSave(item)}>{initial ? "Update" : "Add to row"}</Button>
      </div>
      {library && <ImageLibrary onClose={() => setLibrary(false)} onPick={pick} />}
    </Modal>
  );
}
