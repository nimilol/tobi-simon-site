-- ============================================================
-- Tobi Simon site — database setup
--
-- Safe to run more than once. Every statement checks before it
-- acts, so re-running changes nothing and loses nothing.
--
-- Supabase → SQL Editor → New query → paste → Run
-- ============================================================

-- One row holds the whole site's content as JSON.
-- Simple on purpose: one read, one write, nothing to join.
create table if not exists public.site_content (
  id         int primary key default 1,
  payload    jsonb not null,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Start it off empty so the first save has something to update.
insert into public.site_content (id, payload)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Turn on row-level security. Nothing is allowed until we say so.
alter table public.site_content enable row level security;

-- ANYONE (including visitors who never log in) may READ.
-- This is what lets the public page show the stats.
drop policy if exists "public can read" on public.site_content;
create policy "public can read"
  on public.site_content for select
  to anon, authenticated
  using (true);

-- Only a SIGNED-IN user may WRITE.
--
-- NOTE: this trusts EVERY logged-in account, not one specific person.
-- That is safe only while exactly one account exists and public
-- sign-ups are disabled. In Phase 3 we replace this with a rule
-- naming Tobi's account directly, which does not depend on a setting
-- staying switched off.
drop policy if exists "owner can write" on public.site_content;
create policy "owner can write"
  on public.site_content for all
  to authenticated
  using (true)
  with check (true);

-- Keep updated_at honest.
--
-- 'set search_path' pins where this function looks up names, so it
-- cannot be redirected from outside. Without it, Supabase Advisors
-- raises "Function Search Path Mutable".
-- now() still resolves: pg_catalog is always searched first.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ============================================================
-- VERIFY (optional) — run these to see the lock is on:
--
--   select tablename, rowsecurity
--   from pg_tables where tablename = 'site_content';
--   -- rowsecurity should be true
--
--   select policyname, cmd
--   from pg_policies where tablename = 'site_content';
--   -- should return two rows
--
-- ============================================================
-- NEXT (Phase 3):
--   1. Authentication → Users → Add user
--      Create ONE account. Save the password somewhere permanent.
--   2. Authentication → Sign In / Providers → Email
--      Turn OFF "Allow new users to sign up".
--   3. Come back and tighten the write policy to that one account.
-- ============================================================

-- ============================================================
-- MEDIA STORAGE — "My Story" photos and "My Voice" videos,
-- uploaded from admin.html. Safe to run more than once.
--
-- The bucket is PUBLIC (readable by anyone with the URL) because
-- that's what lets the public page display them without a signed
-- URL. Nothing sensitive belongs in this bucket.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)  -- 50MB per file
on conflict (id) do update
  set public = true, file_size_limit = 52428800;

-- RLS is already on for storage.objects by default in every Supabase
-- project, and the table is owned by supabase_storage_admin — a
-- regular project user (even via the SQL Editor) can't ALTER it, so
-- there's no line to run here. We only add the policies below.

-- ANYONE may read files in the media bucket — this is what lets
-- visitors see the photos and videos on the public page.
drop policy if exists "public can view media" on storage.objects;
create policy "public can view media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

-- Only a SIGNED-IN user may upload or delete. Same trust model as
-- the write policy above: safe while exactly one account exists
-- and public sign-ups stay disabled.
drop policy if exists "owner can upload media" on storage.objects;
create policy "owner can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "owner can update media" on storage.objects;
create policy "owner can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

drop policy if exists "owner can delete media" on storage.objects;
create policy "owner can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');

-- ============================================================
-- VERIFY (optional):
--
--   select id, public, file_size_limit from storage.buckets where id = 'media';
--
--   select policyname, cmd from pg_policies
--   where tablename = 'objects' and schemaname = 'storage';
--   -- should include the four policies created above
-- ============================================================

-- ============================================================
-- VISITOR STATS — anonymous, no cookies, no IP, no personal data.
-- Safe to run more than once.
--
-- Each event is one row. The site writes them; only you can read them.
--   visit         one per page load
--   leave         written on exit, carries seconds spent
--   contact_click the "Email management" button was clicked
--   talk_click    the floating "Let's talk" button was clicked
-- ============================================================

create table if not exists public.site_events (
  id         bigint generated always as identity primary key,
  kind       text        not null check (kind in ('visit','leave','contact_click','talk_click')),
  session_id text        not null,
  seconds    int,
  created_at timestamptz not null default now()
);

create index if not exists site_events_kind_idx on public.site_events (kind);

alter table public.site_events enable row level security;

-- Visitors may ONLY append events. They cannot read, edit or delete
-- them, so the analytics are never exposed to the public page.
drop policy if exists "anyone can log an event" on public.site_events;
create policy "anyone can log an event"
  on public.site_events for insert
  to anon, authenticated
  with check (true);

-- Only a signed-in owner may read the raw rows.
drop policy if exists "owner can read events" on public.site_events;
create policy "owner can read events"
  on public.site_events for select
  to authenticated
  using (true);

-- The dashboard calls this instead of downloading rows: Postgres does
-- the counting and returns four numbers.
--
-- security definer so it can aggregate regardless of the caller's row
-- visibility; execute is granted to authenticated ONLY, below, so the
-- public page still cannot read the totals.
create or replace function public.get_site_stats()
returns table (
  total_visits    bigint,
  unique_visitors bigint,
  contact_clicks  bigint,
  talk_clicks     bigint,
  avg_seconds     int
)
language sql
security definer
set search_path = ''
as $$
  select
    count(*) filter (where kind = 'visit'),
    count(distinct session_id) filter (where kind = 'visit'),
    count(*) filter (where kind = 'contact_click'),
    count(*) filter (where kind = 'talk_click'),
    -- ignore absurd durations: a tab left open overnight is not a visit
    coalesce(avg(seconds) filter (where kind = 'leave' and seconds between 1 and 3600), 0)::int
  from public.site_events;
$$;

revoke all on function public.get_site_stats() from public, anon;
grant execute on function public.get_site_stats() to authenticated;

-- ============================================================
-- VERIFY (optional):
--
--   select policyname, cmd from pg_policies where tablename = 'site_events';
--   -- should return two rows: insert (anon) and select (authenticated)
--
--   select * from public.get_site_stats();
--   -- run while signed in; returns a single row of totals
-- ============================================================
