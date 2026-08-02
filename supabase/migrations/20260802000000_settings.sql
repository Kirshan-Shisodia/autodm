-- ============================================================
-- Settings — workspace, notifications, automation/DM defaults,
-- privacy, team, integrations, API keys and webhook endpoints.
--
-- Every table is per-user (owner = auth.uid()) and one-row-per-user
-- where the section is a singleton preference sheet, so the app can
-- upsert on the primary key without a prior select.
--
-- Idempotent: safe to re-run. Uses `if not exists` throughout and
-- drops policies before recreating them.
-- ============================================================

-- ------------------------------------------------------------
-- Table: workspace_settings  (Settings › General)
-- ------------------------------------------------------------
create table if not exists public.workspace_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  workspace_name text not null default 'My Workspace',
  workspace_timezone text not null default 'Asia/Kolkata',
  workspace_language text not null default 'en-US',
  phone_number text,
  dark_mode boolean not null default false,
  compact_mode boolean not null default false,
  sound_notifications boolean not null default true,
  email_digest boolean not null default true,
  marketing_emails boolean not null default false,
  auto_refresh_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: notification_settings  (Settings › Notifications)
--
-- The three channels are jsonb maps of `key -> { enabled, frequency }`
-- rather than 24 boolean columns: the channel matrix changes far more
-- often than the schema should, and nothing queries an individual key.
-- ------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  email jsonb not null default '{}'::jsonb,
  push jsonb not null default '{}'::jsonb,
  in_app jsonb not null default '{}'::jsonb,
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '08:00',
  quiet_hours_timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: automation_defaults  (Settings › Automation Defaults)
-- Applied to newly created automations; never retroactive.
-- ------------------------------------------------------------
create table if not exists public.automation_defaults (
  user_id uuid primary key references public.users(id) on delete cascade,
  trigger_type text not null default 'new_comment'
    check (trigger_type in ('new_comment', 'new_dm', 'story_reply', 'mention', 'keyword')),
  reply_type text not null default 'send_message'
    check (reply_type in ('send_message', 'reply_comment', 'both', 'no_reply')),
  time_delay_seconds int not null default 3 check (time_delay_seconds between 0 and 3600),
  working_hours_start text not null default '09:00',
  working_hours_end text not null default '21:00',
  timezone text not null default 'Asia/Kolkata',
  require_approval boolean not null default true,
  dm_limit_per_day int not null default 100 check (dm_limit_per_day between 1 and 100000),
  retry_attempts int not null default 3 check (retry_attempts between 0 and 5),
  fallback_message text not null default 'Hey! Thanks for reaching out.',
  label text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: dm_settings  (Settings › DM Settings)
-- ------------------------------------------------------------
create table if not exists public.dm_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  auto_dm_enabled boolean not null default true,
  message_type text not null default 'text'
    check (message_type in ('text', 'media', 'button', 'carousel')),
  template_id uuid references public.templates(id) on delete set null,
  typing_delay_seconds int not null default 3 check (typing_delay_seconds between 0 and 60),
  link_preview boolean not null default true,
  media_support boolean not null default true,
  max_file_size_mb int not null default 10 check (max_file_size_mb in (5, 10, 25, 50)),
  humanize_messages boolean not null default true,
  stop_on_unsubscribe boolean not null default true,
  block_non_followers boolean not null default false,
  fallback_message text not null default 'Hey! Thanks for reaching out.',
  daily_dm_limit_per_user int not null default 3 check (daily_dm_limit_per_user between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: privacy_settings  (Settings › Data & Privacy)
-- ------------------------------------------------------------
create table if not exists public.privacy_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  profile_visibility text not null default 'workspace'
    check (profile_visibility in ('public', 'workspace', 'private')),
  activity_visibility boolean not null default true,
  data_sharing boolean not null default true,
  personalized_recommendations boolean not null default false,
  retention_months int not null default 12 check (retention_months in (3, 6, 12, 24, 36)),
  marketing_communications boolean not null default true,
  data_storage_location text not null default 'ap-south-1'
    check (data_storage_location in ('ap-south-1', 'us-east-1', 'eu-west-1', 'ap-southeast-1')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: api_settings  (Settings › API & Webhooks — the toggles)
-- ------------------------------------------------------------
create table if not exists public.api_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  api_access_enabled boolean not null default true,
  rate_limit_per_min int not null default 1000 check (rate_limit_per_min between 60 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Table: team_members  (Settings › Team Members)
--
-- `member_user_id` is null until the invitee accepts and gets an auth
-- row, which is what separates a pending invitation from a live seat.
-- ------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  member_user_id uuid references public.users(id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'editor', 'viewer')),
  scopes text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('active', 'pending', 'suspended')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, email)
);

create index if not exists idx_team_members_owner on public.team_members(owner_id);
create index if not exists idx_team_members_status on public.team_members(owner_id, status);

-- ------------------------------------------------------------
-- Table: api_keys  (Settings › API & Webhooks)
--
-- Only a SHA-256 hash and the last four characters are stored; the
-- plaintext key is shown once at creation and never persisted.
-- ------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  prefix text not null,
  key_hash text not null unique,
  last4 text not null,
  scope text not null default 'read_only' check (scope in ('full_access', 'read_only')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_keys_user on public.api_keys(user_id);

-- ------------------------------------------------------------
-- Table: webhook_endpoints  (Settings › API & Webhooks)
-- ------------------------------------------------------------
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  url text not null,
  description text,
  events text[] not null default '{}',
  secret text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'failing')),
  last_triggered_at timestamptz,
  last_status_code int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_endpoints_user on public.webhook_endpoints(user_id);

-- ------------------------------------------------------------
-- Table: integrations  (Settings › Integrations)
-- ------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'error')),
  account_label text,
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists idx_integrations_user on public.integrations(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.workspace_settings    enable row level security;
alter table public.notification_settings enable row level security;
alter table public.automation_defaults   enable row level security;
alter table public.dm_settings           enable row level security;
alter table public.privacy_settings      enable row level security;
alter table public.api_settings          enable row level security;
alter table public.team_members          enable row level security;
alter table public.api_keys              enable row level security;
alter table public.webhook_endpoints     enable row level security;
alter table public.integrations          enable row level security;

-- Singleton preference sheets: full CRUD on your own row.
do $$
declare
  t text;
begin
  foreach t in array array[
    'workspace_settings',
    'notification_settings',
    'automation_defaults',
    'dm_settings',
    'privacy_settings',
    'api_settings'
  ]
  loop
    execute format('drop policy if exists "Users manage own %1$s" on public.%1$I', t);
    execute format(
      'create policy "Users manage own %1$s" on public.%1$I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end
$$;

-- Owned collections: full CRUD on rows you own.
do $$
declare
  t text;
begin
  foreach t in array array['api_keys', 'webhook_endpoints', 'integrations']
  loop
    execute format('drop policy if exists "Users manage own %1$s" on public.%1$I', t);
    execute format(
      'create policy "Users manage own %1$s" on public.%1$I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end
$$;

-- TEAM_MEMBERS — the owner manages the roster; a member can read the
-- roster of the workspace they belong to, but cannot change it.
drop policy if exists "Owners manage own team" on public.team_members;
create policy "Owners manage own team" on public.team_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Members view their team" on public.team_members;
create policy "Members view their team" on public.team_members
  for select using (
    auth.uid() = member_user_id
    or exists (
      select 1 from public.team_members self
      where self.owner_id = team_members.owner_id
        and self.member_user_id = auth.uid()
        and self.status = 'active'
    )
  );

-- ============================================================
-- TRIGGERS — reuse the shared set_updated_at() from the initial schema
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'workspace_settings',
    'notification_settings',
    'automation_defaults',
    'dm_settings',
    'privacy_settings',
    'api_settings',
    'team_members',
    'api_keys',
    'webhook_endpoints',
    'integrations'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I
         for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end
$$;

-- ============================================================
-- BACKFILL — seat the workspace owner in their own roster so the
-- Team Members list is never empty for an existing account.
-- ============================================================
insert into public.team_members (owner_id, member_user_id, email, full_name, role, scopes, status, joined_at, created_at)
select u.id, u.id, u.email, u.full_name, 'owner', array['all'], 'active', u.created_at, u.created_at
from public.users u
on conflict (owner_id, email) do nothing;
