-- Forge — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Create the profiles table
create table if not exists public.forge_profiles (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  data     jsonb        not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.forge_profiles enable row level security;

-- 3. Each user can only read and write their own row
create policy "Users can read own profile"
  on public.forge_profiles for select
  using (auth.uid() = user_id);

create policy "Users can upsert own profile"
  on public.forge_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.forge_profiles for update
  using (auth.uid() = user_id);
