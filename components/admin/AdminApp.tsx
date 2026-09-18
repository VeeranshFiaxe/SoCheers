"use client";

/* ============================================================
   THE ADMIN PANEL (/admin).

   Sign-in, then a sidebar and one screen at a time. Screens are
   addressed by the part after # (#/insights/blog, #/post/12...) so the
   whole panel is one static page and the server only ever serves data.
   ============================================================ */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "./api";
import { Account, Activity, PasswordForm, Team, TwoFactorSetup, type Me } from "./AccountPages";
import AwardsEditor from "./AwardsEditor";
import InsightsAdmin, { type InsightsTab } from "./InsightsAdmin";
import LogoWallEditor from "./LogoWallEditor";
import PaperEditor from "./PaperEditor";
import PostEditor from "./PostEditor";
import { Button, ConfirmProvider, Field, Input, Spinner, ToastProvider } from "./ui";

type Session = { admin: Me; twoFactorAvailable: boolean; mailAvailable?: boolean } | null;

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
  useTheme();
  const [session, setSession] = useState<Session | undefined>(undefined);
  /* a password link from an email: /admin#/reset/<token> */
  const [resetToken, setResetToken] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const m = location.hash.match(/^#\/reset\/([A-Za-z0-9_-]{20,100})$/);
      setResetToken(m ? m[1] : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
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

  if (resetToken) {
    return <ResetPassword token={resetToken} onDone={() => { history.replaceState(null, "", "/admin"); setResetToken(null); refresh(); }} />;
  }
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
  /* required before the panel opens - the server refuses everything else
     until it's on (requireAdmin, worker/api/auth.js) */
  if (session.twoFactorAvailable && !session.admin.totp) {
    return (
      <div className="adm adm-center">
        <div className="adm-login">
          <Brand />
          <h1>Set up two-step sign-in</h1>
          <p className="adm-muted">Every account needs it. From now on you&rsquo;ll sign in with your password and a code from your phone.</p>
          <TwoFactorSetup onDone={refresh} />
          <button type="button" className="adm-link adm-small" onClick={async () => { await api("POST", "/logout").catch(() => {}); refresh(); }}>Sign out</button>
        </div>
      </div>
    );
  }
  return <Shell session={session} refresh={refresh} />;
}

/* Light or dark panel. Follows the computer's setting until someone picks
   one here; the pick is kept in this browser. Set on <html> so the sign-in
   screen and pop-ups follow it too. */
const THEME_KEY = "sc-admin-theme";
function readTheme(): "light" | "dark" {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage blocked - fall back to the system */ }
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
function useTheme() {
  useEffect(() => {
    document.documentElement.dataset.admTheme = readTheme();
    return () => { delete document.documentElement.dataset.admTheme; };
  }, []);
}
function ThemeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => setTheme(readTheme()), []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="adm-link" onClick={() => {
      document.documentElement.dataset.admTheme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch { /* not kept */ }
      setTheme(next);
    }}>{next === "light" ? "☀ Light mode" : "☾ Dark mode"}</button>
  );
}

const Brand = () => (
  <div className="adm-brand"><img src="/icon.svg" alt="" width={28} height={28} /><span>SoCheers <em>Admin</em></span></div>
);

function Login({ onDone, offline }: { onDone: () => void; offline: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
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

  if (forgot) {
    return (
      <div className="adm adm-center">
        <form className="adm-login" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setErr("");
          try { await api("POST", "/forgot", { email }); setSent(true); }
          catch (ex) { setErr((ex as Error).message); }
          finally { setBusy(false); }
        }}>
          <Brand />
          <h1>Reset your password</h1>
          {sent ? (
            <p className="adm-muted">If <strong>{email}</strong> has an account, a reset link is on its way. It works for one hour. Check your spam folder if it doesn&rsquo;t show up.</p>
          ) : (
            <>
              <p className="adm-muted">Enter your email and we&rsquo;ll send you a link to choose a new password.</p>
              <Field label="Email">
                <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </Field>
              {err && <p className="adm-error" role="alert">{err}</p>}
              <Button variant="primary" type="submit" busy={busy}>Send reset link</Button>
            </>
          )}
          <button type="button" className="adm-link adm-small" onClick={() => { setForgot(false); setSent(false); setErr(""); }}>Back to sign in</button>
        </form>
      </div>
    );
  }

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
        {!needCode && <button type="button" className="adm-link adm-small" onClick={() => { setForgot(true); setErr(""); }}>Forgot password?</button>}
        <p className="adm-muted adm-small">Access is for the SoCheers team only. Every sign-in is logged.</p>
      </form>
    </div>
  );
}

/* Where a password link from an email lands: forgot password, or a new
   person choosing their first one. */
function ResetPassword({ token, onDone }: { token: string; onDone: () => void }) {
  const [info, setInfo] = useState<{ kind: "reset" | "welcome"; name: string; email: string } | null>(null);
  const [bad, setBad] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api<{ kind: "reset" | "welcome"; name: string; email: string }>("POST", "/reset/check", { token })
      .then(setInfo).catch((e) => setBad((e as Error).message));
  }, [token]);

  return (
    <div className="adm adm-center">
      <form className="adm-login" onSubmit={async (e) => {
        e.preventDefault();
        if (pw !== pw2) { setErr("The two passwords don't match."); return; }
        setBusy(true); setErr("");
        try { await api("POST", "/reset", { token, password: pw }); setDone(true); }
        catch (ex) { setErr((ex as Error).message); }
        finally { setBusy(false); }
      }}>
        <Brand />
        {bad ? (
          <>
            <h1>Link not valid</h1>
            <p className="adm-muted">{bad}</p>
            <Button variant="primary" onClick={onDone}>Go to sign in</Button>
          </>
        ) : !info ? <Spinner /> : done ? (
          <>
            <h1>Password saved</h1>
            <p className="adm-muted">Sign in with your email and new password.</p>
            <Button variant="primary" onClick={onDone}>Go to sign in</Button>
          </>
        ) : (
          <>
            <h1>{info.kind === "welcome" ? `Welcome, ${info.name}` : "Choose a new password"}</h1>
            <p className="adm-muted">For {info.email}. At least 12 characters.</p>
            <input type="email" autoComplete="username" value={info.email} readOnly hidden />
            <Field label="New password">
              <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={12} required autoFocus />
            </Field>
            <Field label="Same password again">
              <Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={12} required />
            </Field>
            {err && <p className="adm-error" role="alert">{err}</p>}
            <Button variant="primary" type="submit" busy={busy}>Save password</Button>
          </>
        )}
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
    case "team": screen = <Team me={me} />; break;
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
          <span className="adm-nav__group">Admin</span>
          {link("#/team", "Team", "team")}
          {owner && link("#/activity", "Activity", "activity")}
        </nav>
        <div className="adm-side__foot">
          {link("#/account", me.name, "account")}
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
          <ThemeSwitch />
          <button type="button" className="adm-link" onClick={async () => { await api("POST", "/logout").catch(() => {}); refresh(); }}>Sign out</button>
        </div>
      </aside>
      <main className="adm-main">{screen}</main>
    </div>
  );
}
