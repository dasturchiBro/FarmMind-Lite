-- Add volume_tier to market_prices
ALTER TABLE market_prices 
ADD COLUMN IF NOT EXISTS volume_tier VARCHAR(20) DEFAULT 'retail' CHECK (volume_tier IN ('retail', 'wholesale'));

-- Create index for tiers
CREATE INDEX IF NOT EXISTS idx_market_prices_tier ON market_prices(crop_type_id, region, volume_tier);

-- Add submitted_by and is_active to market_prices
ALTER TABLE market_prices 
ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for active entries
CREATE INDEX IF NOT EXISTS idx_market_prices_active ON market_prices(is_active);
