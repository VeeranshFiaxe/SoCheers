/* Email, through Resend (resend.com). Needs the RESEND_API_KEY secret;
   without it nothing is sent and the panel falls back to handing out
   temporary passwords by hand. The sender is MAIL_FROM if set, else the
   address below - its domain has to be verified in Resend. */
const FROM = "SoCheers Admin <notifications@send.fiaxe.in>";

export const hasMail = (env) => !!env.RESEND_API_KEY;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* plain, one column, readable in any mail app */
function layout(lines, button) {
  const body = lines.map((l) => `<p style="margin:0 0 16px">${esc(l)}</p>`).join("");
  const cta = button
    ? `<p style="margin:24px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#0e7ea8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${esc(button.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#666">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(button.href)}</span></p>`
    : "";
  return `<div style="font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#111;max-width:520px;margin:0 auto;padding:24px">
    <p style="margin:0 0 24px;font-weight:700">SoCheers Admin</p>${body}${cta}
    <p style="margin:32px 0 0;font-size:12px;color:#888">You got this because of an account on the SoCheers admin panel. If this wasn't you, you can ignore it.</p></div>`;
}

export async function sendMail(env, { to, subject, lines, button }) {
  if (!hasMail(env)) return false;
  const text = [...lines, button ? `${button.label}: ${button.href}` : ""].filter(Boolean).join("\n\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM || FROM, to: [to], subject, html: layout(lines, button), text }),
    });
    if (!res.ok) console.error("mail", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("mail", e);
    return false;
  }
}
