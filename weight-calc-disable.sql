-- Emergency script to disable weight calculation logs and stop system hang
-- This is a temporary fix to prevent infinite weight calculation loops

-- Create flag to disable weight calculations
CREATE TABLE IF NOT EXISTS system_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  flag_value BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert weight calculation disable flag
INSERT INTO system_flags (flag_name, flag_value) 
VALUES ('disable_weight_calculation', TRUE)
ON CONFLICT (flag_name) 
DO UPDATE SET flag_value = TRUE, updated_at = CURRENT_TIMESTAMP;

-- Update all orders with zero weight to prevent recalculation
UPDATE order_management 
SET total_weight = '0.000', weight_unit = 'kg' 
WHERE total_weight IS NULL OR total_weight = '';

-- Log the emergency fix
INSERT INTO system_flags (flag_name, flag_value) 
VALUES ('weight_calc_emergency_fix_applied', TRUE)
ON CONFLICT (flag_name) 
DO UPDATE SET flag_value = TRUE, updated_at = CURRENT_TIMESTAMP;