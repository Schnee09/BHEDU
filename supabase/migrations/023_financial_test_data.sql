-- Financial System Test Data
-- Run this AFTER running the 022_financial_system.sql migration
-- This file only inserts payment methods for now
-- Other test data should be created through the UI or manually with proper IDs

-- Step 1: Insert Payment Methods
INSERT INTO payment_methods (name, type, description, is_active) VALUES
  ('Cash', 'cash', 'Cash payment at office', true),
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer', true),
  ('Mobile Money', 'mobile_money', 'M-Pesa or similar mobile payment', true),
  ('Credit Card', 'card', 'Credit or debit card payment', true),
  ('Online Payment', 'online', 'Online payment gateway', true)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Verify payment methods were created
SELECT 
  'Payment Methods Created' as status,
  COUNT(*) as count
FROM payment_methods
WHERE is_active = true;
