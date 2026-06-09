-- Seed templates for all new users (run during onboarding)
-- This SQL is safe to run multiple times (uses ON CONFLICT DO NOTHING where needed)

INSERT INTO public.templates (
  user_id,
  name,
  message_text,
  category,
  use_count,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'Welcome Message',
  'Hey! Thanks for following! 🙌 We appreciate the love. Check out what we''re all about in our bio.',
  'welcome',
  0,
  now(),
  now()
), (
  auth.uid(),
  'Product Question',
  'Great question! We''re here to help. Feel free to reach out anytime - we usually reply within a few hours.',
  'support',
  0,
  now(),
  now()
), (
  auth.uid(),
  'Limited Time Offer',
  '⏰ LIMITED TIME ONLY: Get 50% off everything this week! {link}',
  'promotion',
  0,
  now(),
  now()
);
