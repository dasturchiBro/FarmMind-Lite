-- 000003_add_role_to_users.down.sql
ALTER TABLE users DROP COLUMN role;
