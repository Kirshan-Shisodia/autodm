-- Dashboard demo seed (Dashboard spec §9).
-- Populates a realistic state so /dashboard renders fully WITHOUT the live
-- comment→DM webhook: ~20 dm_logs (a few in the last few minutes for the live
-- feed), a monthly DM counter, and a couple of link clicks this month.
--
-- Targets the first user that already has a connected account + an automation
-- (those FKs are required on dm_logs). Run against your dev database, e.g.:
--   psql "$SUPABASE_DB_URL" -f supabase/seed/02_dashboard_demo.sql
--
-- To watch realtime: after seeding, INSERT one more dm_logs row from the SQL
-- editor and it should appear at the top of the feed without a refresh.

do $$
declare
  v_user        uuid;
  v_account     uuid;
  v_automation  uuid;
  v_short_link  uuid;
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

  select id into v_automation
  from public.automations
  where user_id = v_user
  order by created_at limit 1;

  if v_account is null or v_automation is null then
    raise notice 'User % needs at least one active account and one automation before seeding dm_logs.', v_user;
    return;
  end if;

  -- Monthly counter (the same value the DMs card reads) + a clean billing state.
  update public.users
  set dm_count_month = 842,
      subscription_status = coalesce(subscription_status, 'active')
  where id = v_user;

  -- 20 sends: the first 4 are seconds/minutes old (the live feed), the rest
  -- spread back across the month.
  for i in 1..20 loop
    insert into public.dm_logs (
      automation_id, ig_account_id, user_id,
      recipient_ig_id, recipient_username, message_text, status, sent_at
    )
    values (
      v_automation, v_account, v_user,
      'igid_' || i,
      usernames[1 + (i % array_length(usernames, 1))],
      'Here is the link you asked for!',
      'sent',
      case
        when i <= 4 then now() - (i * interval '90 seconds')
        else now() - (i * interval '7 hours')
      end
    );
  end loop;

  -- A short link with two clicks this month for the Link clicks card.
  select id into v_short_link
  from public.short_links where user_id = v_user limit 1;

  if v_short_link is null then
    insert into public.short_links (user_id, original_url, short_code)
    values (v_user, 'https://example.com/offer', 'demo' || floor(random() * 100000)::text)
    returning id into v_short_link;
  end if;

  insert into public.link_clicks (short_link_id, clicked_at)
  values
    (v_short_link, now() - interval '2 days'),
    (v_short_link, now() - interval '5 hours');

  raise notice 'Seeded dashboard demo data for user %.', v_user;
end $$;
