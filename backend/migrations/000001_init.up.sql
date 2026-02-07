-- 000001_init.up.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

INSERT INTO crop_types (name, fao_data) VALUES 
('Wheat', '{"irrigation_cycle": 7, "stages": ["Emergence", "Tillering", "Flowering", "Maturity"]}'),
('Rice', '{"irrigation_cycle": 3, "stages": ["Flooding", "Tillering", "Flowering", "Maturity"]}'),
('Tomato', '{"irrigation_cycle": 4, "stages": ["Seeding", "Vegetative", "Flowering", "Fruiting"]}')
ON CONFLICT (name) DO NOTHING;
