-- One-time links sent by email (worker/api/mail.js): "forgot password"
-- and the welcome link a new person uses to pick their password. Only a
-- SHA-256 of the token is stored, like sessions.

CREATE TABLE IF NOT EXISTS password_links (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('reset', 'welcome')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS password_links_admin ON password_links(admin_id);
