-- Three wrong passwords in a row lock an account (worker/api/auth.js,
-- login). A locked account is also disabled; an owner unlocks it from
-- Team, or `npm run admin:create` with the same email does it from a
-- terminal.

ALTER TABLE admins ADD COLUMN failed_logins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admins ADD COLUMN locked INTEGER NOT NULL DEFAULT 0;
