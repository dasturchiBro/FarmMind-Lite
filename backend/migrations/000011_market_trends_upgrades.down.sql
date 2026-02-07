-- Remove added columns and indexes
DROP INDEX IF EXISTS idx_market_prices_active;
ALTER TABLE market_prices DROP COLUMN IF EXISTS is_active;
ALTER TABLE market_prices DROP COLUMN IF EXISTS submitted_by;
DROP INDEX IF EXISTS idx_market_prices_tier;
ALTER TABLE market_prices DROP COLUMN IF EXISTS volume_tier;
