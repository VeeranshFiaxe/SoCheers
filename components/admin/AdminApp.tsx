"use client";

/* ============================================================
   THE ADMIN PANEL (/admin).

   Sign-in, then a sidebar and one screen at a time. Screens are
   addressed by the part after # (#/insights/blog, #/post/12...) so the
   whole panel is one static page and the server only ever serves data.
   ============================================================ */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "./api";
import { Account, Activity, PasswordForm, Team, type Me } from "./AccountPages";
import AwardsEditor from "./AwardsEditor";
import InsightsAdmin, { type InsightsTab } from "./InsightsAdmin";
import LogoWallEditor from "./LogoWallEditor";
import PaperEditor from "./PaperEditor";
import PostEditor from "./PostEditor";
import { Button, ConfirmProvider, Field, Input, Spinner, ToastProvider } from "./ui";

type Session = { admin: Me; twoFactorAvailable: boolean } | null;

function useHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => setHash(location.hash || "#/insights/blog");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = useCallback((h: string) => { location.hash = h; }, []);
  return { hash, go };
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Panel />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Panel() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSession(await api<NonNullable<Session>>("GET", "/me"));
      setOffline(false);
    } catch (e) {
      if ((e as ApiError).status === 401) setSession(null);
      else { setOffline(true); setSession(null); }
    }
  }, []);

  useEffect(() => {
    refresh();
    const out = () => setSession(null);
    window.addEventListener("sc-admin-signed-out", out);
    return () => window.removeEventListener("sc-admin-signed-out", out);
  }, [refresh]);

  if (session === undefined) return <div className="adm adm-center"><Spinner /></div>;
  if (!session) return <Login onDone={refresh} offline={offline} />;
  if (session.admin.mustChange) {
    return (
      <div className="adm adm-center">
        <div className="adm-login">
          <Brand />
          <h1>Welcome, {session.admin.name}</h1>
          <PasswordForm forced onDone={refresh} />
        </div>
      </div>
    );
  }
  return <Shell session={session} refresh={refresh} />;
}

const Brand = () => (
  <div className="adm-brand"><img src="/icon.svg" alt="" width={28} height={28} /><span>SoCheers <em>Admin</em></span></div>
);

function Login({ onDone, offline }: { onDone: () => void; offline: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [err, setErr] = useState(offline ? "Can't reach the admin server. It only runs on the deployed site or under `wrangler dev`." : "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ ok?: boolean; needCode?: boolean }>("POST", "/login", { email, password, code: needCode ? code : undefined });
      if (r.needCode) { setNeedCode(true); return; }
      setPassword(""); setCode("");
      onDone();
    } catch (ex) {
      setErr((ex as Error).message);
      if ((ex as ApiError).body?.needCode) setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm adm-center">
      <form className="adm-login" onSubmit={submit}>
        <Brand />
        <h1>Sign in</h1>
        {!needCode ? (
          <>
            <Field label="Email">
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </Field>
            <Field label="Password">
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
          </>
        ) : (
          <Field label="6-digit code from your authenticator app">
            <Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </Field>
        )}
        {err && <p className="adm-error" role="alert">{err}</p>}
        <Button variant="primary" type="submit" busy={busy}>{needCode ? "Verify" : "Sign in"}</Button>
        {needCode && <button type="button" className="adm-link adm-small" onClick={() => { setNeedCode(false); setCode(""); setErr(""); }}>Use a different account</button>}
        <p className="adm-muted adm-small">Access is for the SoCheers team only. Every sign-in is logged.</p>
      </form>
    </div>
  );
}

function Shell({ session, refresh }: { session: NonNullable<Session>; refresh: () => void }) {
  const { hash, go } = useHash();
  const [menuOpen, setMenuOpen] = useState(false);
  const me = session.admin;
  const parts = hash.replace(/^#\/?/, "").split("/");
  const owner = me.role === "owner";

  useEffect(() => setMenuOpen(false), [hash]);

  let screen;
  let section = parts[0];
  switch (parts[0]) {
    case "insights":
      screen = <InsightsAdmin key={parts[1]} tab={(["blog", "whitepaper", "report", "page"].includes(parts[1]) ? parts[1] : "blog") as InsightsTab} go={go} />;
      break;
    case "post":
      section = "insights";
      screen = parts[1] === "new"
        ? <PostEditor key={`new-${parts[2]}`} id={null} template={parts[2]} go={go} />
        : <PostEditor key={parts[1]} id={Number(parts[1])} go={go} />;
      break;
    case "paper": {
      section = "insights";
      const type = parts[1] === "report" ? "report" : "whitepaper";
      screen = <PaperEditor key={`${type}-${parts[2]}`} type={type} id={parts[2] === "new" ? null : Number(parts[2])} go={go} />;
      break;
    }
    case "logo-wall": screen = <LogoWallEditor />; break;
    case "awards": screen = <AwardsEditor />; break;
    case "account": screen = <Account me={me} twoFactorAvailable={session.twoFactorAvailable} refresh={refresh} />; break;
    case "team": screen = owner ? <Team me={me} /> : null; break;
    case "activity": screen = owner ? <Activity /> : null; break;
    default: screen = hash ? <InsightsAdmin tab="blog" go={go} /> : <Spinner />;
  }

  const link = (to: string, label: string, id: string) => (
    <a href={to} className={section === id ? "is-on" : ""} aria-current={section === id ? "page" : undefined}>{label}</a>
  );

  return (
    <div className={`adm adm-shell${menuOpen ? " is-menu" : ""}`}>
      <aside className="adm-side">
        <Brand />
        <button type="button" className="adm-side__toggle" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Menu">☰</button>
        <nav className="adm-nav">
          <span className="adm-nav__group">Content</span>
          {link("#/insights/blog", "Insights", "insights")}
          {link("#/logo-wall", "Logo wall", "logo-wall")}
          {link("#/awards", "Awards", "awards")}
          {owner && <span className="adm-nav__group">Admin</span>}
          {owner && link("#/team", "Team", "team")}
          {owner && link("#/activity", "Activity", "activity")}
        </nav>
        <div className="adm-side__foot">
          {!me.totp && session.twoFactorAvailable && <a className="adm-nudge" href="#/account">Turn on two-step sign-in →</a>}
          {link("#/account", me.name, "account")}
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
          <button type="button" className="adm-link" onClick={async () => { await api("POST", "/logout").catch(() => {}); refresh(); }}>Sign out</button>
        </div>
      </aside>
      <main className="adm-main">{screen}</main>
    </div>
  );
}
