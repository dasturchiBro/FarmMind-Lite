ALTER TABLE marketplace_listings
DROP COLUMN IF EXISTS image_url,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;
