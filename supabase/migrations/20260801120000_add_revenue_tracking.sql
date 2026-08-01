-- ============================================================
-- Revenue tracking (Dashboard v2)
--
-- The dashboard's "Revenue Earned" KPI had no data source: nothing
-- in the schema carried a money value. This adds the smallest model
-- that answers it honestly.
--
--   leads.revenue_amount           money attributed to one lead
--   automations.revenue_per_conversion  what a lead from this
--                                  automation is worth (config)
--   automations.total_revenue      denormalised counter, mirroring
--                                  the existing total_dms_sent /
--                                  total_clicks pattern
--
-- Attribution is deliberately per-lead rather than per-click: a lead
-- row is the only place the product knows a human actually converted,
-- and it carries a timestamp, so revenue can be bucketed into the same
-- daily series as every other metric on the page.
--
-- Amounts are numeric(12,2) in the account's single currency (INR).
-- No currency column until the product actually sells in more than one.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------
alter table public.leads
  add column if not exists revenue_amount numeric(12,2) not null default 0;

alter table public.automations
  add column if not exists revenue_per_conversion numeric(12,2) not null default 0,
  add column if not exists total_revenue numeric(12,2) not null default 0;

comment on column public.leads.revenue_amount is
  'Money attributed to this lead, in the account currency. Defaults from automations.revenue_per_conversion at insert time when the caller does not set it.';
comment on column public.automations.revenue_per_conversion is
  'What one lead from this automation is worth. 0 means "not a revenue automation" and leaves revenue_amount at 0.';
comment on column public.automations.total_revenue is
  'Denormalised lifetime revenue, kept in step with leads.revenue_amount by trg_leads_revenue. Mirrors total_dms_sent / total_clicks.';

alter table public.leads
  drop constraint if exists leads_revenue_amount_check;
alter table public.leads
  add constraint leads_revenue_amount_check check (revenue_amount >= 0);

alter table public.automations
  drop constraint if exists automations_revenue_per_conversion_check;
alter table public.automations
  add constraint automations_revenue_per_conversion_check
  check (revenue_per_conversion >= 0);

-- ------------------------------------------------------------
-- 2. Default a lead's value from its automation, then keep the
--    automation's counter in step. INSERT/UPDATE/DELETE are all
--    handled so the counter can't drift from the rows it sums.
-- ------------------------------------------------------------
create or replace function public.apply_lead_revenue()
returns trigger
language plpgsql
as $$
declare
  configured numeric(12,2);
begin
  -- A caller that passes an explicit amount wins. 0 means "not set" here,
  -- which is the same thing as "worth nothing" and so is safe to overwrite
  -- from config.
  if tg_op = 'INSERT' and new.revenue_amount = 0 and new.automation_id is not null then
    select a.revenue_per_conversion into configured
      from public.automations a
     where a.id = new.automation_id;
    if configured is not null then
      new.revenue_amount := configured;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_automation_revenue()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.automation_id is not null then
    update public.automations
       set total_revenue = greatest(0, total_revenue - old.revenue_amount)
     where id = old.automation_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.automation_id is not null then
    update public.automations
       set total_revenue = total_revenue + new.revenue_amount
     where id = new.automation_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_leads_apply_revenue on public.leads;
create trigger trg_leads_apply_revenue
  before insert on public.leads
  for each row execute function public.apply_lead_revenue();

drop trigger if exists trg_leads_sync_revenue on public.leads;
create trigger trg_leads_sync_revenue
  after insert or update or delete on public.leads
  for each row execute function public.sync_automation_revenue();

-- ------------------------------------------------------------
-- 3. Backfill the counter from rows that already exist
-- ------------------------------------------------------------
update public.automations a
   set total_revenue = coalesce(s.sum_revenue, 0)
  from (
    select automation_id, sum(revenue_amount) as sum_revenue
      from public.leads
     where automation_id is not null
     group by automation_id
  ) s
 where s.automation_id = a.id;

-- ------------------------------------------------------------
-- 4. Index — every dashboard/analytics query walks leads by user
--    over a time window, and there was no index for that shape.
-- ------------------------------------------------------------
create index if not exists idx_leads_user_created
  on public.leads(user_id, created_at desc);
