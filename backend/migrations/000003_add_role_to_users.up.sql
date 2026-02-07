-- 000003_add_role_to_users.up.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'farmer';
