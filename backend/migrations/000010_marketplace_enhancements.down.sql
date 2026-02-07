ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS contact_count;
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS view_count;
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS tags;
DROP TABLE IF EXISTS listing_images;
DROP TABLE IF EXISTS demand_requests;
DROP TABLE IF EXISTS saved_listings;
DROP TABLE IF EXISTS seller_reviews;
