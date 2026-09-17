-- The admin panel's database (Cloudflare D1, bound as DB in wrangler.jsonc).
--
--   npm run admin:migrate          (live database)
--   npm run admin:migrate:local    (the copy `wrangler dev` uses)

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  password_hash TEXT NOT NULL,
  must_change   INTEGER NOT NULL DEFAULT 0,
  totp_secret   TEXT,            -- AES-GCM ciphertext, never the plain secret
  totp_pending  TEXT,            -- same, while 2FA is being set up
  totp_last     INTEGER NOT NULL DEFAULT 0,  -- last time step used, stops replay
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Only a SHA-256 of the session token is stored. A leaked table
-- cannot be turned back into a working cookie.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ip         TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS sessions_admin ON sessions(admin_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  key          TEXT PRIMARY KEY,   -- "ip:1.2.3.4" or "email:a@b.c"
  failures     INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  at       INTEGER NOT NULL,
  admin_id INTEGER,
  action   TEXT NOT NULL,
  detail   TEXT,
  ip       TEXT
);
CREATE INDEX IF NOT EXISTS audit_at ON audit_log(at);

-- Small documents the site reads whole: the logo wall, the Insights
-- page's hero, tabs and topics.
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS uploads (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('image', 'font', 'pdf')),
  r2_key       TEXT NOT NULL,
  url          TEXT NOT NULL,
  name         TEXT NOT NULL,   -- display name (the font family, for fonts)
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  width        INTEGER,
  height       INTEGER,
  created_at   INTEGER NOT NULL,
  created_by   INTEGER
);
CREATE INDEX IF NOT EXISTS uploads_kind ON uploads(kind, created_at);

-- Everything listed on /insights: blog posts, white papers, reports.
-- `data` carries what only one type has (a post's blocks, a paper's
-- PDF and page images) as JSON.
CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL CHECK (type IN ('blog', 'whitepaper', 'report')),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  cover        TEXT NOT NULL DEFAULT '',
  cover_alt    TEXT NOT NULL DEFAULT '',
  author       TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '[]',
  data         TEXT NOT NULL DEFAULT '{}',
  position     INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  published_at INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  updated_by   INTEGER
);
CREATE INDEX IF NOT EXISTS posts_live ON posts(type, status, position, published_at);

-- Layouts saved from the editor. The premade ones ship in code
-- (lib/blog-templates.ts) so they cannot be deleted by accident.
CREATE TABLE IF NOT EXISTS templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  blocks     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by INTEGER
);
