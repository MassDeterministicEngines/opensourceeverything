-- WildSpot — Schema
-- Run this first in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null check (length(username) between 3 and 24),
  display_name  text,
  avatar_url    text,
  share_code    text unique not null,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
-- The username + share_code are seeded; the user can edit username later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_share    text;
begin
  -- Username from signup metadata; fallback to a stub the user can change.
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    'spotter_' || substr(replace(new.id::text, '-', ''), 1, 6)
  );

  -- 8-char share code (e.g. "K7W-PINE"). Retry on collision.
  loop
    v_share := upper(
      regexp_replace(
        encode(gen_random_bytes(6), 'base64'),
        '[^A-Z0-9]', '', 'g'
      )
    );
    v_share := substr(v_share, 1, 8);
    exit when length(v_share) = 8 and not exists (
      select 1 from public.profiles where share_code = v_share
    );
  end loop;
  v_share := substr(v_share, 1, 3) || '-' || substr(v_share, 4, 5);

  insert into public.profiles (id, username, share_code)
  values (new.id, v_username, v_share);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- friendships ----------
create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null check (status in ('pending','accepted','blocked')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id)
);

-- Enforce one friendship row per pair regardless of direction.
create unique index friendships_pair_uniq on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);
create index friendships_addressee_idx on public.friendships(addressee_id);
create index friendships_requester_idx on public.friendships(requester_id);

-- Helper used by every visibility policy. SECURITY DEFINER so RLS on friendships
-- doesn't block the lookup.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a)
      )
  );
$$;

-- ---------- spots ----------
create table public.spots (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles(id) on delete cascade,
  name          text not null check (length(name) between 1 and 80),
  type          text not null check (type in ('trail','mountain','cave','national_park','nature_reserve','other')),
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  description   text,
  created_at    timestamptz not null default now()
);
create index spots_creator_idx on public.spots(creator_id);
create index spots_geo_idx on public.spots(lat, lng);

-- ---------- moments (photos with optional spot attachment) ----------
create table public.moments (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  spot_id       uuid references public.spots(id) on delete set null,
  photo_path    text not null,
  caption       text,
  lat           double precision,
  lng           double precision,
  taken_at      timestamptz,
  created_at    timestamptz not null default now()
);
create index moments_author_idx on public.moments(author_id);
create index moments_spot_idx on public.moments(spot_id);

-- ---------- captures (proximity check-ins, drive the leaderboard) ----------
create table public.captures (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  spot_id       uuid not null references public.spots(id) on delete cascade,
  captured_at   timestamptz not null default now(),
  lat           double precision not null,
  lng           double precision not null,
  unique (user_id, spot_id)
);
create index captures_user_idx on public.captures(user_id);
create index captures_spot_idx on public.captures(spot_id);

-- Server-side anti-spoof: reject captures whose claimed location is more than
-- 200m from the spot itself. Looser than the client's 100m gate to allow GPS jitter.
create or replace function public.reject_far_captures()
returns trigger
language plpgsql
as $$
declare
  v_spot_lat double precision;
  v_spot_lng double precision;
  v_dist_m   double precision;
begin
  select lat, lng into v_spot_lat, v_spot_lng from public.spots where id = new.spot_id;
  if v_spot_lat is null then
    raise exception 'spot not found';
  end if;

  -- Haversine, in meters.
  v_dist_m := 2 * 6371000 * asin(sqrt(
      sin(radians((new.lat - v_spot_lat) / 2)) ^ 2
    + cos(radians(v_spot_lat)) * cos(radians(new.lat))
    * sin(radians((new.lng - v_spot_lng) / 2)) ^ 2
  ));

  if v_dist_m > 200 then
    raise exception 'capture too far from spot (% m)', round(v_dist_m);
  end if;

  return new;
end;
$$;

drop trigger if exists captures_proximity_check on public.captures;
create trigger captures_proximity_check
  before insert on public.captures
  for each row execute function public.reject_far_captures();

-- ---------- leaderboard view ----------
-- Total captures per user, all-time and current month. RLS is applied via the
-- underlying captures/profiles tables, so callers only see themselves + friends.
create or replace view public.leaderboard as
select
  c.user_id,
  p.username,
  p.display_name,
  count(*) filter (where c.captured_at >= date_trunc('month', now())) as captures_month,
  count(*) as captures_all_time
from public.captures c
join public.profiles p on p.id = c.user_id
group by c.user_id, p.username, p.display_name;
