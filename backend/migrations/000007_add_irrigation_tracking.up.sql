-- 000007_add_irrigation_tracking.up.sql

CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    planting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irrigation_steps (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES irrigation_schedules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    stage VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
