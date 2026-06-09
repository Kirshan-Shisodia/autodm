-- AutoDM Initial Schema - 12 Tables with RLS
-- Created: 2026-06-09
-- Fixed: Table creation order corrected to resolve forward references

-- ============================================================
-- TABLES (dependency-safe order)
-- ============================================================

-- Table 1: users
create table public.users (
  id uuid primary key default auth.uid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'pro', 'platinum')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  dm_quota_monthly int not null default 100,
  dm_quota_used_this_month int not null default 0,
  dm_quota_reset_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_email on public.users(email);
create index idx_users_stripe_customer_id on public.users(stripe_customer_id);

-- Table 2: instagram_accounts
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ig_username text not null,
  ig_business_account_id text unique not null,
  ig_access_token_encrypted text not null,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_instagram_accounts_user_id on public.instagram_accounts(user_id);
create index idx_instagram_accounts_ig_id on public.instagram_accounts(ig_business_account_id);

-- Table 3: templates (moved before automations — automations references this)
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

-- Table 4: short_links (moved before automations/dm_logs — dm_logs references this)
create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  automation_id uuid, -- FK added after automations table is created (see ALTER below)
  original_url text not null,
  short_code text unique not null,
  click_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_short_links_user_id on public.short_links(user_id);
create index idx_short_links_short_code on public.short_links(short_code);

-- Table 5: automations (now safe — templates and short_links already exist)
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('comment', 'dm', 'story_mention')),
  trigger_keyword text,
  message_template_id uuid references public.templates(id) on delete set null,
  custom_message text,
  is_active boolean not null default true,
  daily_limit int not null default 1000,
  rate_limit_per_hour int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_automations_user_id on public.automations(user_id);
create index idx_automations_ig_account_id on public.automations(ig_account_id);
create index idx_automations_is_active on public.automations(is_active);

-- Now that automations exists, add the FK on short_links.automation_id
alter table public.short_links
  add constraint fk_short_links_automation_id
  foreign key (automation_id) references public.automations(id) on delete cascade;

-- Table 6: dm_logs (now safe — automations, instagram_accounts, users, short_links all exist)
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

-- Table 7: dm_queue
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

-- Table 8: link_clicks
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

-- Table 9: leads
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

-- Table 10: webhook_events
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

-- Table 11: stripe_events
create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  user_id uuid references public.users(id),
  processed_at timestamptz not null default now()
);

-- Table 12: referrals
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid references public.users(id) on delete set null,
  referred_email text,
  signup_bonus_credited boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index idx_referrals_referred_user_id on public.referrals(referred_user_id);

-- ============================================================
-- ENABLE RLS
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
-- RLS POLICIES
-- ============================================================

-- Users
create policy "Users can read their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);

-- Instagram Accounts
create policy "Users can view their own IG accounts"
  on public.instagram_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own IG accounts"
  on public.instagram_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own IG accounts"
  on public.instagram_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own IG accounts"
  on public.instagram_accounts for delete
  using (auth.uid() = user_id);

-- Templates
create policy "Users can view their own templates"
  on public.templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.templates for delete
  using (auth.uid() = user_id);

-- Short Links
create policy "Users can view their own short links"
  on public.short_links for select
  using (auth.uid() = user_id);

create policy "Users can insert their own short links"
  on public.short_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own short links"
  on public.short_links for update
  using (auth.uid() = user_id);

create policy "Users can delete their own short links"
  on public.short_links for delete
  using (auth.uid() = user_id);

-- Automations
create policy "Users can view their own automations"
  on public.automations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own automations"
  on public.automations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own automations"
  on public.automations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own automations"
  on public.automations for delete
  using (auth.uid() = user_id);

-- DM Logs
create policy "Users can view their own DM logs"
  on public.dm_logs for select
  using (auth.uid() = user_id);

create policy "Service role can insert DM logs"
  on public.dm_logs for insert
  with check (auth.role() = 'service_role');

-- DM Queue
create policy "Users can view their own DM queue"
  on public.dm_queue for select
  using (
    exists (
      select 1 from public.automations
      where automations.id = dm_queue.automation_id
      and automations.user_id = auth.uid()
    )
  );

create policy "Service role can manage DM queue"
  on public.dm_queue for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update DM queue"
  on public.dm_queue for update
  using (auth.role() = 'service_role');

-- Link Clicks
create policy "Anyone can insert link clicks"
  on public.link_clicks for insert
  with check (true);

create policy "Users can view clicks on their links"
  on public.link_clicks for select
  using (
    exists (
      select 1 from public.short_links
      where short_links.id = link_clicks.short_link_id
      and short_links.user_id = auth.uid()
    )
  );

-- Leads
create policy "Users can view their own leads"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "Service role can insert leads"
  on public.leads for insert
  with check (auth.role() = 'service_role');

create policy "Users can update their own leads"
  on public.leads for update
  using (auth.uid() = user_id);

-- Webhook Events (blocked)
create policy "Disable public access to webhook events"
  on public.webhook_events for all
  using (false);

-- Stripe Events (blocked)
create policy "Disable public access to stripe events"
  on public.stripe_events for all
  using (false);

-- Referrals
create policy "Users can view their own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_user_id);

create policy "Service role can insert referrals"
  on public.referrals for insert
  with check (auth.role() = 'service_role');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_updated_at_instagram_accounts
  before update on public.instagram_accounts
  for each row execute function public.set_updated_at();

create trigger set_updated_at_automations
  before update on public.automations
  for each row execute function public.set_updated_at();

create trigger set_updated_at_templates
  before update on public.templates
  for each row execute function public.set_updated_at();

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();