# Admin panel

`/admin` — edit the Insights page (blog posts, white papers, reports, page text) and the home page logo wall.

The panel is a static page (`app/admin`). All data goes through the Worker's API (`worker/api`), which stores content in Cloudflare D1 and uploads in the existing R2 bucket.

## One-time setup

```bash
npx wrangler d1 create socheers-admin
```

Paste the printed `database_id` into `wrangler.jsonc` (replace `REPLACE_WITH_D1_DATABASE_ID`), then:

```bash
npm run admin:migrate
npm run admin:key
npx wrangler secret put ADMIN_ENC_KEY
npm run deploy
npm run admin:create
```

`admin:key` prints a random key; paste it when `secret put` asks. It encrypts two-step sign-in secrets. Keep it safe: if it changes, everyone's two-step sign-in has to be set up again.

### Email (optional, via Resend)

Sends "forgot password" links, a welcome link to new people, and a notice when a password changes. Without it, owners hand out temporary passwords by hand.

1. Verify `send.fiaxe.in` in Resend (Domains) and add its DNS records in Cloudflare.
2. Make a Resend API key with sending access.
3. `npx wrangler secret put RESEND_API_KEY` and paste it. For local, add `RESEND_API_KEY=...` to `.env`.
4. `npm run admin:migrate` (and `admin:migrate:local`) for the `password_links` table.

Mail goes out from `notifications@send.fiaxe.in` (worker/api/mail.js); set a `MAIL_FROM` variable to change it.

`admin:create` makes the first owner account. Everyone else is added from the panel (Team).

## Running it locally

`next dev` has no API, so the panel shows "can't reach the server". To use it locally:

```bash
npm run admin:migrate:local
npm run admin:create -- --local
npm run preview:worker
```

Local secrets live in `.env` (gitignored): `ADMIN_ENC_KEY`, and optionally `ADMIN_GUEST_EMAIL` / `ADMIN_GUEST_PASSWORD` for a guest owner account. The guest account only works on localhost.

## Security

- No sign-up page. Accounts are made by an owner, or from the terminal.
- Passwords: PBKDF2-SHA256 (100,000 rounds), 12 characters minimum. New accounts must pick their own password on first sign-in.
- Optional two-step sign-in (authenticator app). Secrets are AES-GCM encrypted with `ADMIN_ENC_KEY`; codes can't be reused.
- Sessions: random token in a `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict` cookie; only its hash is stored. 2 hours idle, 12 hours max. Changing a password signs out other devices.
- Every write checks the request's origin and a custom header (blocks cross-site requests).
- Sign-in is locked for 15 minutes after 5 wrong tries per email (25 per IP).
- Everything saved is rebuilt field by field on the server: text is stored as text, links and picture addresses are checked, unknown fields are dropped. Nothing is ever rendered as raw HTML.
- Uploads are checked by their actual bytes, not their name. SVG is refused. Files get random names.
- `/admin` and `/api/admin` send no-cache, no-framing, no-indexing and a strict Content-Security-Policy.
- Owners see an activity log of every sign-in (including failures) and change.
- Password hashing takes more CPU than the Workers free plan's 10ms per request. If sign-in fails with a CPU-limit error, the account needs the Workers paid plan.
