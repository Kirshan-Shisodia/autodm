-- Seed data for testing - AutoDM
-- Run this in Supabase SQL Editor to populate test data

-- Test users (you'll need to create these via auth first)
-- For now, we'll document the UUIDs to use when testing

-- This seed file demonstrates the structure
-- To use: 
-- 1. Create users via Supabase Auth dashboard
-- 2. Copy their UUIDs below
-- 3. Run this file in SQL Editor

-- Example template data (no user_id required for setup)
INSERT INTO public.templates (
  user_id,
  name,
  message_text,
  category,
  use_count
) VALUES
  (gen_random_uuid(), 'Welcome DM', 'Hey! Thanks for following! Check out our latest products: {link}', 'welcome', 0),
  (gen_random_uuid(), 'FAQ Response', 'Great question! We typically respond within 24 hours. DM again if you need urgent help!', 'support', 0),
  (gen_random_uuid(), 'Product Launch', 'NEW PRODUCT ALERT 🚀 We just launched something amazing. Link in bio!', 'announcement', 0),
  (gen_random_uuid(), 'Sale Announcement', 'LIMITED TIME: 50% off everything this week only! Tap {link} to shop now', 'promotion', 0);

-- Example webhook event (for testing webhook functionality)
INSERT INTO public.webhook_events (
  source,
  event_type,
  payload,
  signature_valid,
  processed
) VALUES
  ('meta', 'message', '{"object":"instagram","entry":[{"id":"123","time":1234567890,"messaging":[{"sender":{"id":"456"},"recipient":{"id":"789"},"timestamp":1234567890,"message":{"mid":"msg_id","text":"Hello!"}}]}]'::jsonb, true, false);

-- RLS Policies are already enabled
-- When you create users and authenticate, the RLS policies will automatically:
-- 1. Restrict users to see only their own data
-- 2. Allow service_role to insert/update operational data (dm_logs, leads, etc.)
-- 3. Prevent access to sensitive webhook/stripe data

-- To test RLS after creating two test users:
-- 1. Create alice@test.com and bob@test.com via Supabase Auth
-- 2. Login as alice and insert an automation
-- 3. Login as bob and verify the automation is not visible
-- 4. Check that alice can see her own data but not bob's
