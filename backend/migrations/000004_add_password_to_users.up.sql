-- 000004_add_password_to_users.up.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
