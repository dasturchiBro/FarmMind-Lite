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
