-- ============================================================
-- Automations list v2 (HALO) — lifecycle status + list metadata
--
-- The list screen shows five lifecycle buckets (Active / Paused /
-- Completed / Draft) where the schema only had the boolean
-- `is_active`. Rather than replace it — the webhook path and the
-- n8n workflows filter on `is_active` — we add a richer `status`
-- and keep the two in lockstep with a trigger.
--
--   status        the source of truth for the UI
--   is_active     derived mirror: true iff status = 'active'
--
-- Also adds the two list columns the screen renders but the schema
-- could not answer: a human `description` (the row's subtitle) and
-- `total_triggers` (fires, incl. sends that were skipped/failed —
-- always >= total_dms_sent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------
alter table public.automations
  add column if not exists status text,
  add column if not exists description text,
  add column if not exists total_triggers int not null default 0;

-- Backfill before the NOT NULL + CHECK land, so existing rows pass.
update public.automations
   set status = case when is_active then 'active' else 'paused' end
 where status is null;

update public.automations
   set total_triggers = total_dms_sent
 where total_triggers = 0
   and total_dms_sent > 0;

-- Deliberately NO column default. A BEFORE INSERT trigger runs before the
-- NOT NULL check, so leaving status NULL on insert is how the trigger learns
-- "the caller didn't specify one" and can derive it from is_active. A column
-- default would erase that signal and silently draft every legacy insert.
alter table public.automations
  alter column status drop default,
  alter column status set not null;

alter table public.automations
  drop constraint if exists automations_status_check;

alter table public.automations
  add constraint automations_status_check
  check (status in ('active', 'paused', 'completed', 'draft'));

comment on column public.automations.status is
  'Lifecycle bucket driving the Automations list tabs. is_active mirrors (status = ''active'') via trg_automations_sync_status.';
comment on column public.automations.description is
  'Short human subtitle shown under the name in the list, e.g. "Reply to price related comments".';
comment on column public.automations.total_triggers is
  'Times the automation fired, including sends that were skipped or failed. Always >= total_dms_sent.';

-- ------------------------------------------------------------
-- 2. Keep status <-> is_active consistent, whichever side writes
-- ------------------------------------------------------------
create or replace function public.sync_automation_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- An explicit status wins. A NULL status means the caller only knows
    -- about is_active (the pre-existing insert path), so derive from it.
    if new.status is null then
      new.status := case when new.is_active then 'active' else 'draft' end;
    else
      new.is_active := (new.status = 'active');
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    new.is_active := (new.status = 'active');
  elsif new.is_active is distinct from old.is_active then
    new.status := case when new.is_active then 'active' else 'paused' end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_automations_sync_status on public.automations;
create trigger trg_automations_sync_status
  before insert or update on public.automations
  for each row execute function public.sync_automation_status();

-- ------------------------------------------------------------
-- 3. Index — the list filters and counts by status constantly
-- ------------------------------------------------------------
create index if not exists idx_automations_status
  on public.automations(user_id, status);
