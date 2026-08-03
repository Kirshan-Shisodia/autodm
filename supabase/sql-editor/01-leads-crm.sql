-- ============================================================
-- PASTE THIS WHOLE FILE INTO THE SUPABASE SQL EDITOR AND RUN IT.
--
-- Project: hgyxichoaoxkjvkzonme
-- Source:  supabase/migrations/20260802130000_leads_crm.sql
--          (generated copy — edit the migration, not this file)
--
-- What it does: adds status / tags / last_activity_at to public.leads,
-- gives `source` a canonical vocabulary, and installs two triggers.
-- Additive only. No table is dropped and no row is deleted.
--
-- Safe to run twice: every step is `if not exists`, `drop ... if exists`
-- then recreate, or a backfill guarded by `where ... is null`.
--
-- The whole thing runs in one transaction. If any statement fails,
-- nothing is applied and your schema is exactly as it was.
-- ============================================================

begin;

-- ============================================================
-- Leads screen (HALO) — lifecycle status, tags, activity clock
--
-- `public.leads` was a mailing-list row: an email, an optional
-- handle, and two "did we sync it yet" booleans. The Leads screen
-- is a small CRM — it buckets people by where they are in the
-- funnel, labels them, and sorts by when they were last seen.
-- Three columns the schema could not answer:
--
--   status            the funnel bucket driving the tabs
--   tags              free labels, rendered as chips + Top Tags
--   last_activity_at  the sort key and the "2 minutes ago" cell
--
-- `source` also gets a canonical vocabulary. It was free text
-- defaulting to 'dm_conversation', which cannot distinguish a post
-- comment from a story mention — the SOURCE column and the
-- "Leads by Source" card both need that distinction, and the
-- automation that created the lead already knows it. A BEFORE
-- INSERT trigger derives it, mirroring apply_lead_revenue.
--
-- Deliberately NOT added: a "conversion" column. The screen's
-- CONVERSION cell (New / Interested / Customer / Support) is a
-- reading of the tags, not an independent fact — storing it would
-- create two things to keep in step and one of them would drift.
-- It is derived in lib/leads/model.ts.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------
alter table public.leads
  add column if not exists status text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists last_activity_at timestamptz;

-- Backfill before NOT NULL + CHECK land, so existing rows pass.
-- A legacy lead that reached an email-list sync got further than one
-- that did not, so it starts as 'engaged' rather than 'new'.
update public.leads
   set status = case
     when revenue_amount > 0 then 'converted'
     when synced_to_kit or synced_to_flodesk then 'engaged'
     else 'new'
   end
 where status is null;

update public.leads
   set last_activity_at = created_at
 where last_activity_at is null;

-- No column default on status, for the same reason as automations.status:
-- the BEFORE INSERT trigger needs NULL to mean "the caller didn't say".
alter table public.leads
  alter column status set not null,
  alter column last_activity_at set not null,
  alter column last_activity_at set default now();

alter table public.leads
  drop constraint if exists leads_status_check;
alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'engaged', 'converted', 'archived'));

-- `source` was unconstrained free text, so a legacy row can hold anything.
-- Map what we recognise, park the rest on 'dm_conversation', and only then
-- add the constraint — otherwise one stray value fails the whole migration.
update public.leads l
   set source = case a.type
     when 'post'          then 'post_comment'
     when 'reel'          then 'reel_comment'
     when 'story_reply'   then 'story_reply'
     when 'story_mention' then 'story_mention'
     when 'inbox'         then 'inbox_keyword'
     when 'ad'            then 'ad'
     when 'facebook_post' then 'facebook_post'
     else 'dm_conversation'
   end
  from public.automations a
 where a.id = l.automation_id
   and (l.source is null or l.source = 'dm_conversation');

update public.leads
   set source = 'dm_conversation'
 where source is null
    or source not in (
      'post_comment', 'reel_comment', 'story_reply', 'story_mention',
      'inbox_keyword', 'ad', 'facebook_post', 'dm_conversation', 'manual'
    );

alter table public.leads
  drop constraint if exists leads_source_check;
alter table public.leads
  add constraint leads_source_check
  check (source in (
    'post_comment',
    'reel_comment',
    'story_reply',
    'story_mention',
    'inbox_keyword',
    'ad',
    'facebook_post',
    'dm_conversation',
    'manual'
  ));

comment on column public.leads.status is
  'Funnel bucket driving the Leads tabs: new -> engaged -> converted, or archived. Set by the UI; defaulted to ''new'' on insert by trg_leads_classify.';
comment on column public.leads.tags is
  'Free-form labels shown as chips on the row and aggregated into the Top Tags card. Lowercased and de-duplicated by trg_leads_classify.';
comment on column public.leads.last_activity_at is
  'Last time this person did something we saw. Sort key for the list and the source of the "2 minutes ago" cell. Defaults to created_at on insert.';
comment on column public.leads.source is
  'Where the lead came from. Derived from automations.type at insert time when the caller does not set it — see trg_leads_classify.';

-- ------------------------------------------------------------
-- 2. Defaults derived from the automation that produced the lead
--
-- The webhook path inserts a lead knowing only the automation id.
-- Rather than teach every caller the source vocabulary, the row
-- learns it from its automation, exactly as revenue_amount does.
-- ------------------------------------------------------------
-- Invoker rights, deliberately. If a caller somehow references an automation
-- it cannot see, RLS hides the row, the lookup returns NULL, and the source
-- falls back to 'dm_conversation'. SECURITY DEFINER would instead turn this
-- trigger into an oracle for other tenants' automation types.
create or replace function public.classify_lead()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_type text;
begin
  if new.status is null then
    new.status := 'new';
  end if;

  if new.last_activity_at is null then
    new.last_activity_at := coalesce(new.created_at, now());
  end if;

  -- 'dm_conversation' is the old column default, so it reads as "unset"
  -- for any caller that hasn't been updated to pass a real source.
  if new.automation_id is not null
     and (new.source is null or new.source = 'dm_conversation') then
    select type into v_type
      from public.automations
     where id = new.automation_id;

    new.source := case v_type
      when 'post'           then 'post_comment'
      when 'reel'           then 'reel_comment'
      when 'story_reply'    then 'story_reply'
      when 'story_mention'  then 'story_mention'
      when 'inbox'          then 'inbox_keyword'
      when 'ad'             then 'ad'
      when 'facebook_post'  then 'facebook_post'
      else coalesce(new.source, 'dm_conversation')
    end;
  end if;

  new.source := coalesce(new.source, 'dm_conversation');

  -- Tags are a display vocabulary; 'Interested' and 'interested' must not
  -- become two chips in the Top Tags card.
  if new.tags is not null then
    select coalesce(array_agg(distinct lower(btrim(t))), '{}')
      into new.tags
      from unnest(new.tags) as t
     where btrim(t) <> '';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_leads_classify on public.leads;
create trigger trg_leads_classify
  before insert on public.leads
  for each row execute function public.classify_lead();

-- Same normalisation on the way through an update, so a tag typed into the
-- row menu can't slip past the insert-time cleanup.
create or replace function public.normalise_lead_tags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tags is distinct from old.tags and new.tags is not null then
    select coalesce(array_agg(distinct lower(btrim(t))), '{}')
      into new.tags
      from unnest(new.tags) as t
     where btrim(t) <> '';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_normalise_tags on public.leads;
create trigger trg_leads_normalise_tags
  before update on public.leads
  for each row execute function public.normalise_lead_tags();

-- ------------------------------------------------------------
-- 3. Indexes — the list pages by activity within a status bucket,
--    and the Top Tags card unnests the array.
-- ------------------------------------------------------------
create index if not exists idx_leads_user_activity
  on public.leads(user_id, last_activity_at desc);

create index if not exists idx_leads_user_status
  on public.leads(user_id, status, last_activity_at desc);

create index if not exists idx_leads_tags
  on public.leads using gin(tags);

-- ------------------------------------------------------------
-- 4. RLS — select and update policies already exist. The row menu
--    can archive but never delete, so no delete policy is added:
--    a lead is evidence of a conversation that happened.
-- ------------------------------------------------------------

commit;

-- ------------------------------------------------------------
-- Verification. This runs after the commit and should return
-- three rows: status, tags, last_activity_at. If it returns
-- nothing, the migration did not apply.
-- ------------------------------------------------------------
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'leads'
  and column_name in ('status', 'tags', 'last_activity_at')
order by column_name;
