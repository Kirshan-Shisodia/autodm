-- ============================================================
-- AutoDM Initial Schema — 12 Tables, RLS, Triggers, Functions
-- Matches PRD v3.0 Section 6 exactly
-- Dependency-safe table creation order
-- ============================================================
-- IMPORTANT: This DROPS existing tables first. Only run if your
-- tables are empty or you are okay losing existing data.
-- ============================================================

-- ------------------------------------------------------------
-- 0. DROP existing tables (clean slate) — reverse dependency order
-- ------------------------------------------------------------
drop table if exists public.referrals cascade;
drop table if exists public.stripe_events cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.link_clicks cascade;
drop table if exists public.leads cascade;
drop table if exists public.dm_queue cascade;
drop table if exists public.dm_logs cascade;
drop table if exists public.automations cascade;
drop table if exists public.short_links cascade;
drop table if exists public.templates cascade;
drop table if exists public.instagram_accounts cascade;
drop table if exists public.users cascade;

-- ============================================================
-- TABLES (dependency-safe order)
-- ============================================================

-- ------------------------------------------------------------
-- Table 1: users  (PRD 6.3)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'platinum')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  dm_count_month int not null default 0,
  dm_count_month_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  white_label_enabled boolean not null default false,
  referral_code text unique,
  referred_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_stripe_customer on public.users(stripe_customer_id);
create index idx_users_plan on public.users(plan);
create index idx_users_referral_code on public.users(referral_code);

-- ------------------------------------------------------------
-- Table 2: instagram_accounts  (PRD 6.4)
-- ------------------------------------------------------------
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ig_user_id text not null,
  ig_username text not null,
  fb_page_id text not null,
  fb_page_name text,
  access_token_encrypted text not null,
  access_token_iv text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  webhook_subscribed boolean not null default false,
  last_webhook_at timestamptz,
  disconnected_at timestamptz,
  disconnect_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, ig_user_id)
);

create index idx_ig_accounts_user_id on public.instagram_accounts(user_id);
create index idx_ig_accounts_ig_user_id on public.instagram_accounts(ig_user_id);
create index idx_ig_accounts_fb_page_id on public.instagram_accounts(fb_page_id);
create index idx_ig_accounts_active on public.instagram_accounts(is_active) where is_active = true;

-- ------------------------------------------------------------
-- Table 3: templates  (PRD 6.8) — before automations (referenced)
-- ------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  message_text text not null,
  category text,
  use_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_templates_user_id on public.templates(user_id);

-- ------------------------------------------------------------
-- Table 4: short_links  (PRD 6.8) — before automations/dm_logs
-- automation_id FK added after automations is created
-- ------------------------------------------------------------
create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  automation_id uuid,
  original_url text not null,
  short_code text unique not null,
  click_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_short_links_user_id on public.short_links(user_id);
create index idx_short_links_short_code on public.short_links(short_code);

-- ------------------------------------------------------------
-- Table 5: automations  (PRD 6.5)
-- ------------------------------------------------------------
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('post', 'reel', 'story_reply', 'story_mention', 'inbox', 'ad', 'facebook_post')),
  trigger_type text not null check (trigger_type in ('keyword', 'all', 'specific_phrase', 'starts_with')),
  trigger_keywords text[] not null default '{}',
  media_id text,
  media_url text,
  dm_message text not null,
  dm_link text,
  short_link_id uuid references public.short_links(id),
  comment_reply_text text,
  ask_for_email boolean not null default false,
  email_followup_message text,
  follow_required boolean not null default false,
  is_active boolean not null default true,
  total_dms_sent int not null default 0,
  total_clicks int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_automations_ig_account on public.automations(ig_account_id);
create index idx_automations_user on public.automations(user_id);
create index idx_automations_active on public.automations(is_active) where is_active = true;
create index idx_automations_media_id on public.automations(media_id) where media_id is not null;
create index idx_automations_type on public.automations(type);

-- Now add the FK on short_links.automation_id
alter table public.short_links
  add constraint fk_short_links_automation_id
  foreign key (automation_id) references public.automations(id) on delete cascade;

-- ------------------------------------------------------------
-- Table 6: dm_logs  (PRD 6.6)
-- ------------------------------------------------------------
create table public.dm_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  recipient_ig_id text not null,
  recipient_username text,
  triggered_by_comment_id text,
  triggered_by_comment_text text,
  message_text text not null,
  meta_message_id text,
  short_link_id uuid references public.short_links(id),
  status text not null check (status in ('sent', 'failed', 'queued', 'duplicate_skipped', 'rate_limit_skipped')),
  error_code text,
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_dm_logs_user_sent_at on public.dm_logs(user_id, sent_at desc);
create index idx_dm_logs_ig_account_sent_at on public.dm_logs(ig_account_id, sent_at desc);
create index idx_dm_logs_automation on public.dm_logs(automation_id, sent_at desc);
create index idx_dm_logs_recipient on public.dm_logs(recipient_ig_id, ig_account_id);
create index idx_dm_logs_status on public.dm_logs(status);

-- ------------------------------------------------------------
-- Table 7: dm_queue  (PRD 6.7)
-- ------------------------------------------------------------
create table public.dm_queue (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  recipient_ig_id text not null,
  message_text text not null,
  triggered_by_comment_id text,
  scheduled_for timestamptz not null default now(),
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  last_error text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'expired')),
  created_at timestamptz not null default now()
);

create index idx_dm_queue_pending on public.dm_queue(scheduled_for, ig_account_id) where status = 'pending';
create index idx_dm_queue_status on public.dm_queue(status);

-- ------------------------------------------------------------
-- Table 8: link_clicks  (PRD 6.8)
-- ------------------------------------------------------------
create table public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  short_link_id uuid not null references public.short_links(id) on delete cascade,
  dm_log_id uuid references public.dm_logs(id) on delete set null,
  ip_address inet,
  user_agent text,
  referer text,
  clicked_at timestamptz not null default now()
);

create index idx_link_clicks_short_link on public.link_clicks(short_link_id, clicked_at desc);

-- ------------------------------------------------------------
-- Table 9: leads  (PRD 6.8)
-- ------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  email text not null,
  ig_username text,
  ig_user_id text,
  source text default 'dm_conversation',
  synced_to_kit boolean not null default false,
  synced_to_flodesk boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index idx_leads_user_email on public.leads(user_id, email);
create index idx_leads_unsynced_kit on public.leads(user_id) where synced_to_kit = false;

-- ------------------------------------------------------------
-- Table 10: webhook_events  (PRD 6.8)
-- ------------------------------------------------------------
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('meta', 'stripe', 'kit', 'flodesk')),
  event_type text,
  payload jsonb not null,
  signature_valid boolean,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now()
);

create index idx_webhook_events_source on public.webhook_events(source, received_at desc);
create index idx_webhook_events_unprocessed on public.webhook_events(processed) where processed = false;

-- ------------------------------------------------------------
-- Table 11: stripe_events  (PRD 6.8)
-- ------------------------------------------------------------
create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  user_id uuid references public.users(id),
  processed_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table 12: referrals  (PRD 6.8)
-- ------------------------------------------------------------
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid references public.users(id) on delete set null,
  referred_email text,
  commission_earned_cents int not null default 0,
  commission_paid boolean not null default false,
  signup_bonus_credited boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index idx_referrals_referred_user_id on public.referrals(referred_user_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY  (PRD 6.10.1)
-- ============================================================
alter table public.users enable row level security;
alter table public.instagram_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.dm_logs enable row level security;
alter table public.dm_queue enable row level security;
alter table public.short_links enable row level security;
alter table public.link_clicks enable row level security;
alter table public.leads enable row level security;
alter table public.templates enable row level security;
alter table public.webhook_events enable row level security;
alter table public.stripe_events enable row level security;
alter table public.referrals enable row level security;

-- ============================================================
-- RLS POLICIES  (PRD 6.10.2)
-- ============================================================

-- USERS
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- INSTAGRAM_ACCOUNTS
create policy "Users view own IG accounts" on public.instagram_accounts
  for select using (auth.uid() = user_id);
create policy "Users insert own IG accounts" on public.instagram_accounts
  for insert with check (auth.uid() = user_id);
create policy "Users update own IG accounts" on public.instagram_accounts
  for update using (auth.uid() = user_id);
create policy "Users delete own IG accounts" on public.instagram_accounts
  for delete using (auth.uid() = user_id);

-- TEMPLATES
create policy "Users view own templates" on public.templates
  for select using (auth.uid() = user_id);
create policy "Users insert own templates" on public.templates
  for insert with check (auth.uid() = user_id);
create policy "Users update own templates" on public.templates
  for update using (auth.uid() = user_id);
create policy "Users delete own templates" on public.templates
  for delete using (auth.uid() = user_id);

-- SHORT_LINKS
create policy "Users view own short links" on public.short_links
  for select using (auth.uid() = user_id);
create policy "Users insert own short links" on public.short_links
  for insert with check (auth.uid() = user_id);
create policy "Users update own short links" on public.short_links
  for update using (auth.uid() = user_id);
create policy "Users delete own short links" on public.short_links
  for delete using (auth.uid() = user_id);

-- AUTOMATIONS
create policy "Users view own automations" on public.automations
  for select using (auth.uid() = user_id);
create policy "Users insert own automations" on public.automations
  for insert with check (auth.uid() = user_id);
create policy "Users update own automations" on public.automations
  for update using (auth.uid() = user_id);
create policy "Users delete own automations" on public.automations
  for delete using (auth.uid() = user_id);

-- DM_LOGS (read-only for users; n8n service_role bypasses RLS)
create policy "Users view own dm logs" on public.dm_logs
  for select using (auth.uid() = user_id);

-- DM_QUEUE
create policy "Users view own dm queue" on public.dm_queue
  for select using (
    exists (
      select 1 from public.automations
      where automations.id = dm_queue.automation_id
      and automations.user_id = auth.uid()
    )
  );

-- LINK_CLICKS
create policy "Anyone can insert link clicks" on public.link_clicks
  for insert with check (true);
create policy "Users view clicks on own links" on public.link_clicks
  for select using (
    exists (
      select 1 from public.short_links
      where short_links.id = link_clicks.short_link_id
      and short_links.user_id = auth.uid()
    )
  );

-- LEADS
create policy "Users view own leads" on public.leads
  for select using (auth.uid() = user_id);
create policy "Users update own leads" on public.leads
  for update using (auth.uid() = user_id);

-- REFERRALS
create policy "Users view own referrals" on public.referrals
  for select using (auth.uid() = referrer_user_id);

-- WEBHOOK_EVENTS and STRIPE_EVENTS — no user policies (n8n service_role only)
create policy "Block public webhook events" on public.webhook_events
  for all using (false);
create policy "Block public stripe events" on public.stripe_events
  for all using (false);

-- ============================================================
-- FUNCTIONS & TRIGGERS  (PRD 6.9 + Appendix B)
-- ============================================================

-- 1. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_ig_accounts_updated_at before update on public.instagram_accounts
  for each row execute function public.set_updated_at();
create trigger trg_automations_updated_at before update on public.automations
  for each row execute function public.set_updated_at();
create trigger trg_templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();

-- 2. Auto-create public.users row when a Supabase auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, referral_code)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    substring(md5(random()::text) from 1 for 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Atomically increment a user's monthly DM count
create or replace function public.increment_dm_count(user_uuid uuid)
returns void as $$
  update public.users
  set dm_count_month = dm_count_month + 1
  where id = user_uuid;
$$ language sql;

-- 4. Monthly DM counter reset
create or replace function public.reset_monthly_dm_counts()
returns void as $$
begin
  update public.users
  set dm_count_month = 0,
      dm_count_month_reset_at = date_trunc('month', now()) + interval '1 month'
  where dm_count_month_reset_at <= now();
end;
$$ language plpgsql;

-- 5. Auto-prune old webhook events
create or replace function public.prune_old_webhook_events()
returns void as $$
begin
  delete from public.webhook_events
  where received_at < now() - interval '30 days'
    and processed = true;
end;
$$ language plpgsql;

-- ============================================================
-- DONE — verify 12 tables in Table Editor, each with RLS shield
-- ============================================================