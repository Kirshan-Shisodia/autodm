-- Automations list demo seed (Automations List spec §10).
-- Gives /automations something to render WITHOUT the live comment→DM webhook:
-- a few automations with mixed active/type/name, plus dm_logs dated *today* for
-- one of them (so "DMs today" shows a non-zero count) and others dated earlier.
--
-- Targets the first user that already has a connected Instagram account. Run
-- against your dev database, e.g.:
--   psql "$SUPABASE_DB_URL" -f supabase/seed/03_automations_demo.sql

do $$
declare
  v_user        uuid;
  v_account     uuid;
  v_auto_reel   uuid;
  v_auto_guide  uuid;
  v_auto_wait   uuid;
  i             int;
  usernames     text[] := array['ana','raj','mia','leo','sam','noor','kai','zoe'];
begin
  select id into v_user from public.users order by created_at limit 1;
  if v_user is null then
    raise notice 'No users found — sign up first.';
    return;
  end if;

  select id into v_account
  from public.instagram_accounts
  where user_id = v_user and is_active
  order by created_at limit 1;

  if v_account is null then
    raise notice 'User % needs at least one active Instagram account first.', v_user;
    return;
  end if;

  -- Three automations: an active reel, a paused post, and an active post.
  -- Names are the user-facing strings the list shows verbatim.
  insert into public.automations
    (user_id, ig_account_id, name, type, trigger_type, trigger_keywords, dm_message, is_active, created_at)
  values
    (v_user, v_account, 'LINK → DM on Reel', 'reel', 'keyword', array['LINK'],
     'Here is the link you asked for! {LINK}', true,  now() - interval '2 days')
  returning id into v_auto_reel;

  insert into public.automations
    (user_id, ig_account_id, name, type, trigger_type, trigger_keywords, dm_message, is_active, created_at)
  values
    (v_user, v_account, 'SAVE → guide', 'post', 'keyword', array['SAVE'],
     'Thanks! Sending the guide your way. {LINK}', false, now() - interval '7 days')
  returning id into v_auto_guide;

  insert into public.automations
    (user_id, ig_account_id, name, type, trigger_type, trigger_keywords, dm_message, is_active, created_at)
  values
    (v_user, v_account, 'YES → waitlist', 'post', 'keyword', array['YES'],
     'You are on the waitlist 🎉 {LINK}', true, now() - interval '10 days')
  returning id into v_auto_wait;

  -- "DMs today": several sends today for the reel automation, a couple today for
  -- the waitlist one, and some older sends that must NOT count toward today.
  for i in 1..7 loop
    insert into public.dm_logs
      (automation_id, ig_account_id, user_id, recipient_ig_id, recipient_username, message_text, status, sent_at)
    values
      (v_auto_reel, v_account, v_user, 'igid_reel_' || i,
       usernames[1 + (i % array_length(usernames, 1))],
       'Here is the link you asked for!', 'sent',
       date_trunc('day', now()) + (i * interval '47 minutes'));
  end loop;

  for i in 1..2 loop
    insert into public.dm_logs
      (automation_id, ig_account_id, user_id, recipient_ig_id, recipient_username, message_text, status, sent_at)
    values
      (v_auto_wait, v_account, v_user, 'igid_wait_' || i,
       usernames[1 + (i % array_length(usernames, 1))],
       'You are on the waitlist 🎉', 'sent',
       date_trunc('day', now()) + (i * interval '2 hours'));
  end loop;

  -- Older sends for the reel automation — yesterday and before (DMs today = 0
  -- contribution). Confirms the day window filters correctly.
  for i in 1..5 loop
    insert into public.dm_logs
      (automation_id, ig_account_id, user_id, recipient_ig_id, recipient_username, message_text, status, sent_at)
    values
      (v_auto_reel, v_account, v_user, 'igid_old_' || i,
       usernames[1 + (i % array_length(usernames, 1))],
       'Here is the link you asked for!', 'sent',
       now() - (i * interval '30 hours'));
  end loop;

  raise notice 'Seeded automations list demo for user %.', v_user;
end $$;
