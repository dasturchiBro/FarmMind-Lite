INSERT INTO crop_types (name, fao_data) VALUES 
('Cotton', '{"irrigation_cycle": 5, "stages": ["Germination", "Seedling", "Squaring", "Boll Development", "Boll Maturation"]}'),
('Carrot', '{"irrigation_cycle": 4, "stages": ["Germination", "Root Expansion"]}'),
('Onion', '{"irrigation_cycle": 3, "stages": ["Establishment", "Bulb Formation"]}')
ON CONFLICT (name) DO NOTHING;
