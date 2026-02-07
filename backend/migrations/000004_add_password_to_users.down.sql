-- 000004_add_password_to_users.down.sql
ALTER TABLE users DROP COLUMN password;
