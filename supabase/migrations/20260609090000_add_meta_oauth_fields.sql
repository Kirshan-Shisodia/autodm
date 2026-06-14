-- Reconcile instagram_accounts to the canonical Phase A schema.
--
-- The initial_schema migration already defines the canonical columns
-- (ig_user_id, access_token_encrypted, access_token_iv, webhook_subscribed, …).
-- An earlier draft of this migration added a stray `ig_access_token_iv` column
-- that duplicated `access_token_iv`. Drop it so already-applied databases
-- converge on the canonical shape. On a fresh database these are safe no-ops.

alter table public.instagram_accounts
  drop column if exists ig_access_token_iv,
  drop column if exists ig_access_token_encrypted,
  drop column if exists ig_business_account_id,
  drop column if exists connected_at,
  drop column if exists last_sync_at;

-- Ensure the canonical columns exist (idempotent — already created by
-- initial_schema, but guard against partially-migrated databases).
alter table public.instagram_accounts
  add column if not exists ig_user_id text,
  add column if not exists access_token_encrypted text,
  add column if not exists access_token_iv text,
  add column if not exists fb_page_id text,
  add column if not exists fb_page_name text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists scopes text[] not null default '{}',
  add column if not exists webhook_subscribed boolean not null default false,
  add column if not exists last_webhook_at timestamptz,
  add column if not exists disconnected_at timestamptz,
  add column if not exists disconnect_reason text;

create index if not exists idx_instagram_accounts_fb_page_id
  on public.instagram_accounts(fb_page_id);
