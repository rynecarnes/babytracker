-- ============================================================
-- BabyTracker — Initial Schema
-- Run this in Supabase SQL Editor or via `supabase db reset`
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. FEEDINGS
-- ============================================================
create table public.feedings (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  created_at   timestamptz not null default now()
);

-- Index for fast lookups by user + time
create index idx_feedings_user_started on public.feedings(user_id, started_at desc);

-- Row-Level Security
alter table public.feedings enable row level security;

create policy "Users can manage own feedings"
  on public.feedings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. FEEDING SEGMENTS
-- ============================================================
create table public.feeding_segments (
  id          uuid        primary key default gen_random_uuid(),
  feeding_id  uuid        not null references public.feedings(id) on delete cascade,
  breast      text        not null check (breast in ('left', 'right')),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

-- Index for fast segment lookups per feeding
create index idx_feeding_segments_feeding on public.feeding_segments(feeding_id, started_at asc);

-- Row-Level Security — inherit from parent feeding via join
alter table public.feeding_segments enable row level security;

create policy "Users can manage own feeding segments"
  on public.feeding_segments
  for all
  using (
    exists (
      select 1 from public.feedings f
      where f.id = feeding_segments.feeding_id
        and f.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.feedings f
      where f.id = feeding_segments.feeding_id
        and f.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. DIAPER CHANGES
-- ============================================================
create table public.diaper_changes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  changed_at  timestamptz not null default now(),
  type        text        not null check (type in ('pee', 'poop', 'both')),
  created_at  timestamptz not null default now()
);

-- Index for daily queries
create index idx_diaper_changes_user_changed on public.diaper_changes(user_id, changed_at desc);

-- Row-Level Security
alter table public.diaper_changes enable row level security;

create policy "Users can manage own diaper changes"
  on public.diaper_changes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. Enable Realtime
-- ============================================================
alter publication supabase_realtime add table public.feedings;
alter publication supabase_realtime add table public.feeding_segments;
alter publication supabase_realtime add table public.diaper_changes;

-- ============================================================
-- 5. GRANTS
-- ============================================================
grant all privileges on table public.feedings to authenticated, service_role;
grant all privileges on table public.feeding_segments to authenticated, service_role;
grant all privileges on table public.diaper_changes to authenticated, service_role;
