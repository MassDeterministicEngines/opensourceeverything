-- WildSpot — Row-Level Security
-- Run this AFTER 0001_init.sql.
--
-- Visibility rule: a row about user X is visible to caller C if
--   C = X  OR  are_friends(C, X).
-- Writes: only the row's owner can write it. Friendship updates have an extra
-- rule: only the addressee can flip pending → accepted/blocked.

alter table public.profiles    enable row level security;
alter table public.friendships enable row level security;
alter table public.spots       enable row level security;
alter table public.moments     enable row level security;
alter table public.captures    enable row level security;

-- ---------- profiles ----------
-- See yourself, your friends, OR anyone you have a pending friendship with
-- (so the addressee can see who's asking).
create policy "profiles_select_self_friends_or_pending"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.are_friends(auth.uid(), id)
  or exists (
    select 1 from public.friendships f
    where f.status = 'pending'
      and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id)
        or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))
  )
);

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- INSERT happens via the on_auth_user_created trigger (security definer).

-- ---------- friendships ----------
create policy "friendships_select_involved"
on public.friendships for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "friendships_insert_self_as_requester"
on public.friendships for insert
to authenticated
with check (
  requester_id = auth.uid()
  and addressee_id <> auth.uid()
  and status = 'pending'
);

create policy "friendships_update_addressee_only"
on public.friendships for update
to authenticated
using (addressee_id = auth.uid())
with check (addressee_id = auth.uid() and status in ('accepted','blocked'));

create policy "friendships_delete_either_party"
on public.friendships for delete
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---------- spots ----------
create policy "spots_select_self_or_friends"
on public.spots for select
to authenticated
using (
  creator_id = auth.uid()
  or public.are_friends(auth.uid(), creator_id)
);

create policy "spots_insert_self"
on public.spots for insert
to authenticated
with check (creator_id = auth.uid());

create policy "spots_update_self"
on public.spots for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "spots_delete_self"
on public.spots for delete
to authenticated
using (creator_id = auth.uid());

-- ---------- moments ----------
create policy "moments_select_self_or_friends"
on public.moments for select
to authenticated
using (
  author_id = auth.uid()
  or public.are_friends(auth.uid(), author_id)
);

create policy "moments_insert_self"
on public.moments for insert
to authenticated
with check (author_id = auth.uid());

create policy "moments_update_self"
on public.moments for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "moments_delete_self"
on public.moments for delete
to authenticated
using (author_id = auth.uid());

-- ---------- captures ----------
create policy "captures_select_self_or_friends"
on public.captures for select
to authenticated
using (
  user_id = auth.uid()
  or public.are_friends(auth.uid(), user_id)
);

create policy "captures_insert_self"
on public.captures for insert
to authenticated
with check (user_id = auth.uid());

create policy "captures_delete_self"
on public.captures for delete
to authenticated
using (user_id = auth.uid());

-- Leaderboard view inherits RLS from underlying tables.
grant select on public.leaderboard to authenticated;
