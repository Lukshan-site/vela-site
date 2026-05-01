-- Run this in the Supabase SQL Editor (Project → SQL → New query → paste → run).
-- Idempotent enough that re-running is safe for the create-if-not-exists portions.

-- =========================
-- Tables
-- =========================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text,
  avatar_url   text,
  is_admin     boolean default false,
  created_at   timestamptz default now()
);

create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  drive_file_id text not null,
  title         text not null,
  description   text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now()
);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

create table if not exists public.likes (
  user_id    uuid references public.profiles(id) on delete cascade,
  video_id   uuid references public.videos(id)   on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, video_id)
);

create table if not exists public.favorites (
  user_id    uuid references public.profiles(id) on delete cascade,
  video_id   uuid references public.videos(id)   on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, video_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid references public.videos(id)   on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz default now()
);
create index if not exists comments_video_idx on public.comments (video_id, created_at desc);

-- =========================
-- Auto-create profile on signup
-- =========================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    split_part(new.email, '@', 1)
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================
-- Row Level Security
-- =========================

alter table public.profiles  enable row level security;
alter table public.videos    enable row level security;
alter table public.likes     enable row level security;
alter table public.favorites enable row level security;
alter table public.comments  enable row level security;

-- profiles
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- videos: anyone reads; only admins write
drop policy if exists "videos read"   on public.videos;
drop policy if exists "videos insert" on public.videos;
drop policy if exists "videos update" on public.videos;
drop policy if exists "videos delete" on public.videos;
create policy "videos read"   on public.videos for select using (true);
create policy "videos insert" on public.videos for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "videos update" on public.videos for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "videos delete" on public.videos for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- likes
drop policy if exists "likes read"   on public.likes;
drop policy if exists "likes insert" on public.likes;
drop policy if exists "likes delete" on public.likes;
create policy "likes read"   on public.likes for select using (true);
create policy "likes insert" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes delete" on public.likes for delete using (auth.uid() = user_id);

-- favorites
drop policy if exists "favorites read"   on public.favorites;
drop policy if exists "favorites insert" on public.favorites;
drop policy if exists "favorites delete" on public.favorites;
create policy "favorites read"   on public.favorites for select using (true);
create policy "favorites insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites delete" on public.favorites for delete using (auth.uid() = user_id);

-- comments
drop policy if exists "comments read"   on public.comments;
drop policy if exists "comments insert" on public.comments;
drop policy if exists "comments delete" on public.comments;
create policy "comments read"   on public.comments for select using (true);
create policy "comments insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments delete" on public.comments for delete using (auth.uid() = user_id);
