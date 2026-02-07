INSERT INTO crop_types (name, fao_data) VALUES 
('Maize', '{"irrigation_cycle": 5, "stages": ["Germination", "Vegetative", "Tasseling", "Maturity"]}'),
('Potato', '{"irrigation_cycle": 4, "stages": ["Sprouting", "Vegetative", "Tuber Initiation", "Maturation"]}')
ON CONFLICT (name) DO NOTHING;
