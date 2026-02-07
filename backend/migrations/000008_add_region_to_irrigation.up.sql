-- 000008_add_region_to_irrigation.up.sql
ALTER TABLE irrigation_schedules ADD COLUMN IF NOT EXISTS region VARCHAR(100);
