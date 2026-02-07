-- Database Schema for FarmMind Lite

-- 1. Users table (for marketplace and profiles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crops lookup table (standard data for reminders & info)
CREATE TABLE IF NOT EXISTS crop_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., Wheat, Rice, Tomato
    fao_data JSONB -- Stores irrigation guidelines as a JSON object
);

-- 3. Farmer's planted crops (Irrigation & Reminder Tool)
CREATE TABLE IF NOT EXISTS planted_crops (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    crop_type_id INTEGER REFERENCES crop_types(id),
    planting_date DATE NOT NULL,
    area_hectares DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Market Price Sharing Tool
CREATE TABLE IF NOT EXISTS market_prices (
    id SERIAL PRIMARY KEY,
    crop_type_id INTEGER REFERENCES crop_types(id),
    region VARCHAR(100) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Online Marketplace Listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id),
    crop_type_id INTEGER REFERENCES crop_types(id),
    quantity_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    harvest_ready_date DATE,
    description TEXT,
    image_url VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Crop Data (Example FAO-based)
INSERT INTO crop_types (name, fao_data) VALUES 
('Wheat', '{"irrigation_cycle": 7, "stages": ["Emergence", "Tillering", "Flowering", "Maturity"]}'),
('Rice', '{"irrigation_cycle": 3, "stages": ["Flooding", "Tillering", "Flowering", "Maturity"]}'),
('Tomato', '{"irrigation_cycle": 4, "stages": ["Seeding", "Vegetative", "Flowering", "Fruiting"]}');
