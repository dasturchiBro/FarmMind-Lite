-- 000002_add_email_to_users.up.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
