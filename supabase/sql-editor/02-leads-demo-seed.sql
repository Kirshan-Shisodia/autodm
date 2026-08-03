-- ============================================================
-- OPTIONAL — demo data. Run 01-leads-crm.sql FIRST.
--
-- Inserts ~240 fake leads so /leads has something to render before
-- the live comment-to-DM webhook has produced anything real. These
-- are fake people with @example.com addresses in your real database;
-- skip this file entirely if you'd rather see the empty state.
--
-- Idempotent: leads carry a unique (user_id, email) index, so
-- re-running updates the same rows instead of duplicating them.
--
-- To remove them later:
--   delete from public.leads where email like '%@example.com';
--
-- Source: supabase/seed/04_leads_demo.sql (generated copy)
-- ============================================================

-- Leads demo seed. Populates /leads with a realistic spread so the tabs,
-- the source breakdown, the tag cloud and the pagination all have something
-- to show without waiting on the live comment→DM webhook.
--
-- Targets the first user that already has a connected account (the FK on
-- ig_account_id is required). Run against your dev database, e.g.:
--   psql "$SUPABASE_DB_URL" -f supabase/seed/04_leads_demo.sql
--
-- Idempotent: leads carry a unique (user_id, email) index, so re-running
-- updates the existing rows rather than duplicating them.

do $$
declare
  v_user     uuid;
  v_account  uuid;
  v_autos    uuid[];
  v_auto     uuid;
  i          int;
  n          int := 240;
  v_status   text;
  v_source   text;
  v_tags     text[];
  v_handle   text;
  v_age      interval;
  first_names text[] := array[
    'Rahul','Priya','Aman','Neha','Vikram','Sneha','Karan','Ananya','Manish',
    'Ritika','Arjun','Divya','Rohan','Isha','Nikhil','Pooja','Siddharth',
    'Meera','Kabir','Tanvi'];
  last_names text[] := array[
    'Sharma','Singh','Verma','Kapoor','Patel','Iyer','Malhotra','Reddy',
    'Gupta','Joshi','Nair','Desai','Rao','Bose','Khanna'];
  niche_tags text[] := array[
    'fitness','skincare','coaching','course','wellness','fashion','nutrition'];
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
    raise notice 'User % needs an active Instagram account before seeding leads.', v_user;
    return;
  end if;

  select coalesce(array_agg(id), '{}') into v_autos
  from public.automations
  where user_id = v_user;

  for i in 1..n loop
    -- Roughly the mix the screen was designed against: half engaged,
    -- a quarter new, 15% converted, the rest archived.
    v_status := case
      when i % 100 < 26 then 'new'
      when i % 100 < 77 then 'engaged'
      when i % 100 < 92 then 'converted'
      else 'archived'
    end;

    v_source := case
      when i % 100 < 41 then 'post_comment'
      when i % 100 < 66 then 'reel_comment'
      when i % 100 < 82 then 'story_reply'
      when i % 100 < 92 then 'story_mention'
      else 'inbox_keyword'
    end;

    -- Tags carry the CONVERSION reading: 'customer' > 'support' >
    -- 'interested' > everything else. Keep that consistent with status
    -- or the derived column contradicts the badge beside it.
    v_tags := case v_status
      when 'converted' then array['customer',
        case when i % 3 = 0 then 'premium' else 'loyal' end]
      when 'engaged'   then case
        when i % 11 = 0 then array['support']
        else array['interested', niche_tags[1 + (i % array_length(niche_tags, 1))]]
      end
      when 'new'       then array['new',
        case when i % 2 = 0 then 'price' else 'discount' end]
      else array['archived']
    end;

    -- New leads are recent by definition; archived ones are stale.
    v_age := case v_status
      when 'new'      then make_interval(mins => (i * 7) % 2880)
      when 'engaged'  then make_interval(hours => (i * 3) % 480)
      when 'converted' then make_interval(hours => (i * 5) % 720)
      else make_interval(days => 30 + (i % 60))
    end;

    v_auto := case
      when array_length(v_autos, 1) is null then null
      else v_autos[1 + (i % array_length(v_autos, 1))]
    end;

    v_handle := lower(
      first_names[1 + (i % array_length(first_names, 1))] || '_' ||
      left(last_names[1 + (i % array_length(last_names, 1))], 3) || '_' || i
    );

    insert into public.leads (
      user_id, ig_account_id, automation_id, email, ig_username, ig_user_id,
      source, status, tags, revenue_amount, created_at, last_activity_at
    )
    values (
      v_user,
      v_account,
      v_auto,
      v_handle || '@example.com',
      v_handle,
      '1789' || lpad(i::text, 8, '0'),
      v_source,
      v_status,
      v_tags,
      case when v_status = 'converted' then 499 + (i % 5) * 500 else 0 end,
      now() - v_age - interval '1 hour',
      now() - v_age
    )
    on conflict (user_id, email) do update
      set status           = excluded.status,
          tags             = excluded.tags,
          source           = excluded.source,
          last_activity_at = excluded.last_activity_at,
          revenue_amount   = excluded.revenue_amount;
  end loop;

  raise notice 'Seeded % leads for user %.', n, v_user;
end $$;

-- Verification — how many demo leads landed, by bucket.
select status, count(*) as leads
from public.leads
where email like '%@example.com'
group by status
order by status;
