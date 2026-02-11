-- FarmMind Lite: Schema Sync Script
-- This script ensures the database schema is always up-to-date with migrations 1-9.

-- 1. Initial Tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safety: Ensure core columns exist even if table was created by another process
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(100);

CREATE TABLE IF NOT EXISTS crop_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    fao_data JSONB
);

CREATE TABLE IF NOT EXISTS planted_crops (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    crop_type_id INTEGER REFERENCES crop_types(id),
    planting_date DATE NOT NULL,
    area_hectares DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_prices (
    id SERIAL PRIMARY KEY,
    crop_type_id INTEGER REFERENCES crop_types(id),
    region VARCHAR(100) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id),
    crop_type_id INTEGER REFERENCES crop_types(id),
    quantity_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    harvest_ready_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Column Additions (Idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'farmer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 3. Irrigation Tracking
CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    planting_date DATE NOT NULL,
    region VARCHAR(100), -- From migration 8
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irrigation_steps (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES irrigation_schedules (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    stage VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 4. Initial Data
INSERT INTO crop_types (name, fao_data) VALUES 
('Wheat', '{"irrigation_cycle": 7, "stages": ["Emergence", "Tillering", "Flowering", "Maturity"]}'),
('Rice', '{"irrigation_cycle": 3, "stages": ["Flooding", "Tillering", "Flowering", "Maturity"]}'),
('Tomato', '{"irrigation_cycle": 4, "stages": ["Seeding", "Vegetative", "Flowering", "Fruiting"]}'),
('Maize', '{"irrigation_cycle": 5, "stages": ["Germination", "Vegetative", "Tasseling", "Maturity"]}'),
('Potato', '{"irrigation_cycle": 4, "stages": ["Sprouting", "Vegetative", "Tuber Initiation", "Maturation"]}'),
('Cotton', '{"irrigation_cycle": 5, "stages": ["Germination", "Seedling", "Squaring", "Boll Development", "Boll Maturation"]}'),
('Carrot', '{"irrigation_cycle": 4, "stages": ["Germination", "Root Expansion"]}'),
('Onion', '{"irrigation_cycle": 3, "stages": ["Establishment", "Bulb Formation"]}')
ON CONFLICT (name) DO NOTHING;

-- 5. Marketplace Enhancements
CREATE TABLE IF NOT EXISTS seller_reviews (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS demand_requests (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crop_type_id INTEGER REFERENCES crop_types(id) ON DELETE CASCADE,
    quantity_kg DECIMAL(10, 2) NOT NULL,
    max_price_per_kg DECIMAL(10, 2),
    needed_by DATE,
    region VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listing_images (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- 6. Market Trends Polishing (Migration 11)
ALTER TABLE market_prices 
ADD COLUMN IF NOT EXISTS volume_tier VARCHAR(20) DEFAULT 'retail',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_market_prices_tier ON market_prices(crop_type_id, region, volume_tier);
CREATE INDEX IF NOT EXISTS idx_market_prices_active ON market_prices(is_active);

-- 000012_add_user_events
CREATE TABLE IF NOT EXISTS user_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add More Vegetables and Fruits (Migration 13)
INSERT INTO crop_types (name, fao_data) VALUES 
('Cucumber', '{"category": "Vegetables"}'),
('Bell Pepper', '{"category": "Vegetables"}'),
('Eggplant', '{"category": "Vegetables"}'),
('Garlic', '{"category": "Vegetables"}'),
('Pumpkin', '{"category": "Vegetables"}'),
('Cabbage', '{"category": "Vegetables"}'),
('Beetroot', '{"category": "Vegetables"}'),
('Apple', '{"category": "Fruits"}'),
('Grape', '{"category": "Fruits"}'),
('Peach', '{"category": "Fruits"}'),
('Cherry', '{"category": "Fruits"}'),
('Apricot', '{"category": "Fruits"}'),
('Melon', '{"category": "Fruits"}'),
('Watermelon', '{"category": "Fruits"}')
ON CONFLICT (name) DO NOTHING;
