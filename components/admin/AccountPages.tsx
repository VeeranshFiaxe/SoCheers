"use client";

/* Your account (password, two-step sign-in), the team (owners only)
   and the activity log (owners only). */
import QRCode from "qrcode";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { Button, Empty, Field, Input, Modal, Spinner, useConfirm, useToast } from "./ui";

export type Me = { id: number; email: string; name: string; role: "owner" | "editor"; mustChange: boolean; totp: boolean };

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* A strong temporary password for a new account: 18 characters from a
   set with no look-alikes, out of the browser's secure random source. */
export function makePassword() {
  const set = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => set[b % set.length]).join("");
}

export function PasswordForm({ forced, onDone }: { forced?: boolean; onDone: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (next !== again) { setErr("The new passwords don't match."); return; }
    setBusy(true);
    try {
      await api("POST", "/password", { current, next });
      toast("Password changed. Other devices have been signed out.");
      setCurrent(""); setNext(""); setAgain("");
      onDone();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="adm-stack" onSubmit={submit}>
      {forced && <p className="adm-notice">Choose your own password before you carry on.</p>}
      <Field label={forced ? "Temporary password" : "Current password"}>
        <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </Field>
      <Field label="New password" hint="At least 12 characters. A short sentence is easy to remember and hard to guess.">
        <Input type="password" autoComplete="new-password" minLength={12} value={next} onChange={(e) => setNext(e.target.value)} required />
      </Field>
      <Field label="New password again">
        <Input type="password" autoComplete="new-password" minLength={12} value={again} onChange={(e) => setAgain(e.target.value)} required />
      </Field>
      {err && <p className="adm-error" role="alert">{err}</p>}
      <div><Button variant="primary" type="submit" busy={busy}>Change password</Button></div>
    </form>
  );
}

export function Account({ me, twoFactorAvailable, refresh }: { me: Me; twoFactorAvailable: boolean; refresh: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const begin = async () => {
    try {
      const d = await api<{ secret: string; uri: string }>("POST", "/2fa/begin");
      setSetup({ secret: d.secret, qr: await QRCode.toDataURL(d.uri, { margin: 1, width: 220 }) });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const confirmCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("POST", "/2fa/confirm", { code });
      toast("Two-step sign-in is on.");
      setSetup(null); setCode("");
      refresh();
    } catch (ex) {
      toast((ex as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-page">
      <header className="adm-head"><div><h1>Your account</h1><p className="adm-muted">{me.name} · {me.email} · {me.role === "owner" ? "Owner" : "Editor"}</p></div></header>
      <div className="adm-two">
        <section className="adm-card">
          <h2 className="adm-h3">Password</h2>
          <PasswordForm onDone={refresh} />
        </section>
        <section className="adm-card adm-stack">
          <h2 className="adm-h3">Two-step sign-in</h2>
          <p className="adm-muted">Asks for a 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator, 1Password…) as well as your password. Strongly recommended.</p>
          {!twoFactorAvailable ? (
            <p className="adm-notice">Not available yet - the server needs its ADMIN_ENC_KEY secret set.</p>
          ) : me.totp ? (
            <>
              <p className="adm-ok">On.</p>
              {disabling ? (
                <form className="adm-stack" onSubmit={async (e) => {
                  e.preventDefault();
                  try { await api("POST", "/2fa/disable", { password }); toast("Two-step sign-in is off."); setDisabling(false); setPassword(""); refresh(); }
                  catch (ex) { toast((ex as Error).message, "error"); }
                }}>
                  <Field label="Your password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
                  <div className="adm-row"><Button variant="ghost" onClick={() => setDisabling(false)}>Cancel</Button><Button variant="danger" type="submit">Turn off</Button></div>
                </form>
              ) : <div><Button variant="ghost" onClick={() => setDisabling(true)}>Turn off</Button></div>}
            </>
          ) : setup ? (
            <form className="adm-stack" onSubmit={confirmCode}>
              <ol className="adm-steps">
                <li>Open your authenticator app and scan this code.</li>
              </ol>
              <img className="adm-qr" src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} />
              <p className="adm-small adm-muted">Can&rsquo;t scan? Enter this key instead: <code className="adm-code">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code></p>
              <Field label="Then type the 6-digit code it shows">
                <Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required />
              </Field>
              <div className="adm-row"><Button variant="ghost" onClick={() => setSetup(null)}>Cancel</Button><Button variant="primary" type="submit" busy={busy}>Turn on</Button></div>
            </form>
          ) : <div><Button variant="primary" onClick={begin}>Set up two-step sign-in</Button></div>}

          <h2 className="adm-h3 adm-mt">Signed-in devices</h2>
          <p className="adm-muted">Sessions end after 2 hours without use, and after 12 hours at most.</p>
          <div>
            <Button variant="ghost" onClick={async () => {
              if (!(await confirm({ title: "Sign out everywhere?", body: "Every device signed in to this account, including this one, is signed out.", action: "Sign out everywhere" }))) return;
              await api("POST", "/sessions/revoke").catch(() => {});
              window.dispatchEvent(new Event("sc-admin-signed-out"));
            }}>Sign out everywhere</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

type AdminRow = { id: number; email: string; name: string; role: "owner" | "editor"; disabled: number; must_change: number; totp: number; created_at: number };

export function Team({ me }: { me: Me }) {
  const owner = me.role === "owner";
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string; emailed?: boolean } | null>(null);

  const load = useCallback(() => {
    api<{ admins: AdminRow[] }>("GET", "/admins").then((d) => setRows(d.admins)).catch((e) => toast((e as Error).message, "error"));
  }, [toast]);
  useEffect(load, [load]);

  const patch = async (row: AdminRow, body: Record<string, unknown>, done: string) => {
    try { await api("PATCH", `/admins/${row.id}`, body); toast(done); load(); }
    catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div><h1>Team</h1><p className="adm-muted">Who can sign in to this panel. Owners can manage the team; editors can edit content.</p></div>
        {owner && <Button variant="primary" onClick={() => setAdding(true)}>+ Add a person</Button>}
      </header>
      {!rows ? <Spinner /> : (
        <ul className="adm-list">
          {rows.map((r) => (
            <li key={r.id} className="adm-list__row">
              <div className="adm-list__main">
                <strong>{r.name}{r.id === me.id && " (you)"}</strong>
                <span className="adm-muted adm-small">{r.email} · {r.role === "owner" ? "Owner" : "Editor"}{r.totp ? " · 2-step on" : ""}{r.must_change ? " · hasn't signed in yet" : ""}</span>
              </div>
              {r.disabled ? <span className="adm-pill">Blocked</span> : null}
              {owner && r.id !== me.id && (
                <div className="adm-row adm-row--wrap">
                  <Button variant="ghost" onClick={() => patch(r, { role: r.role === "owner" ? "editor" : "owner" }, "Role changed.")}>
                    Make {r.role === "owner" ? "editor" : "owner"}
                  </Button>
                  <Button variant="ghost" onClick={async () => {
                    const password = makePassword();
                    if (!(await confirm({ title: `Reset ${r.name}'s password?`, body: "They are signed out and get a new temporary password to change on first sign-in.", action: "Reset password" }))) return;
                    await patch(r, { password }, "Password reset.");
                    setIssued({ email: r.email, password });
                  }}>Reset password</Button>
                  {r.totp ? <Button variant="ghost" onClick={() => patch(r, { resetTwoFactor: true }, "Two-step sign-in reset.")}>Reset 2-step</Button> : null}
                  <Button variant="ghost" onClick={() => patch(r, { disabled: !r.disabled }, r.disabled ? "Unblocked." : "Blocked and signed out.")}>{r.disabled ? "Unblock" : "Block"}</Button>
                  <Button variant="ghost" onClick={async () => {
                    if (!(await confirm({ title: `Remove ${r.name}?`, body: "Their account is deleted. What they made stays.", action: "Remove", danger: true }))) return;
                    await api("DELETE", `/admins/${r.id}`).then(() => { toast("Removed."); load(); }).catch((e) => toast((e as Error).message, "error"));
                  }}>Remove</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && <AddPerson onClose={() => setAdding(false)} onAdded={(email, password, emailed) => { setAdding(false); setIssued({ email, password, emailed }); load(); }} />}
      {issued && (
        <Modal title="Send them these details" onClose={() => setIssued(null)} small>
          {issued.emailed ? (
            <p className="adm-muted">We emailed <strong>{issued.email}</strong> a link to choose their password. If it doesn&rsquo;t arrive, share the details below privately instead. They&rsquo;re shown only once.</p>
          ) : (
            <p className="adm-muted">Share this privately (not by email in the same message as the link). It is shown only once, and they&rsquo;ll be asked to choose their own password when they sign in.</p>
          )}
          <div className="adm-issued">
            <div><span className="adm-small adm-muted">Sign in at</span><code className="adm-code">{typeof location !== "undefined" ? `${location.origin}/admin` : "/admin"}</code></div>
            <div><span className="adm-small adm-muted">Email</span><code className="adm-code">{issued.email}</code></div>
            <div><span className="adm-small adm-muted">Temporary password</span><code className="adm-code">{issued.password}</code></div>
          </div>
          <div className="adm-row adm-row--end">
            <Button onClick={() => { navigator.clipboard?.writeText(issued.password); toast("Password copied."); }}>Copy password</Button>
            <Button variant="primary" onClick={() => setIssued(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddPerson({ onClose, onAdded }: { onClose: () => void; onAdded: (email: string, password: string, emailed: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "owner">("editor");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Add a person" onClose={onClose} small>
      <form className="adm-stack" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        const password = makePassword();
        try {
          const r = await api<{ emailed?: boolean }>("POST", "/admins", { name, email, role, password });
          onAdded(email.trim().toLowerCase(), password, !!r.emailed);
        }
        catch (ex) { setErr((ex as Error).message); }
        finally { setBusy(false); }
      }}>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required /></Field>
        <Field label="Role">
          <select className="adm-input" value={role} onChange={(e) => setRole(e.target.value as "editor" | "owner")}>
            <option value="editor">Editor - edits content</option>
            <option value="owner">Owner - also manages the team</option>
          </select>
        </Field>
        {err && <p className="adm-error" role="alert">{err}</p>}
        <div className="adm-row adm-row--end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" busy={busy}>Create account</Button>
        </div>
      </form>
    </Modal>
  );
}

const ACTIONS: Record<string, string> = {
  "login.ok": "Signed in", "login.fail": "Failed sign-in", "login.fail.2fa": "Wrong 2-step code", "login.locked": "Sign-in blocked (too many tries)",
  logout: "Signed out", "password.change": "Changed password", "password.fail": "Wrong current password", "2fa.on": "Turned on 2-step",
  "2fa.off": "Turned off 2-step", "sessions.revoke": "Signed out everywhere", "admin.create": "Added a person", "admin.update": "Changed a person",
  "admin.delete": "Removed a person", upload: "Uploaded a file", "upload.delete": "Deleted a file", "upload.rename": "Renamed a file",
  "settings.logoWall": "Saved the logo wall", "settings.awards": "Saved the awards", "settings.insights": "Saved Insights page text", "insights.seed": "Set up Insights",
  "insights.reorder": "Reordered Insights", "password.resetAsked": "Asked for a reset link", "password.reset": "Reset password by email",
  "password.set": "Set first password from email", "template.create": "Saved a template", "template.delete": "Deleted a template",
};

export function Activity() {
  const toast = useToast();
  const [rows, setRows] = useState<{ at: number; action: string; detail: string | null; ip: string; email: string | null }[] | null>(null);
  useEffect(() => {
    api<{ entries: NonNullable<typeof rows> }>("GET", "/audit").then((d) => setRows(d.entries)).catch((e) => toast((e as Error).message, "error"));
  }, [toast]);
  const label = (a: string) => {
    const [thing, verb] = a.split(".");
    const noun = ({ blog: "a blog post", whitepaper: "a white paper", report: "a report" } as Record<string, string>)[thing];
    const did = ({ create: "Created", update: "Edited", delete: "Deleted" } as Record<string, string>)[verb ?? ""];
    return ACTIONS[a] ?? (noun && did ? `${did} ${noun}` : a);
  };
  return (
    <div className="adm-page">
      <header className="adm-head"><div><h1>Activity</h1><p className="adm-muted">The last 200 things done in the panel, including failed sign-ins.</p></div></header>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty>Nothing yet.</Empty> : (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th><th>IP address</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.action.includes("fail") || r.action.includes("locked") ? "is-warn" : ""}>
                  <td>{when.format(r.at)}</td><td>{r.email ?? "-"}</td><td>{label(r.action)}</td><td className="adm-small">{r.detail}</td><td className="adm-small">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
