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