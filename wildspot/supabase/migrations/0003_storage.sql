-- WildSpot — Storage policies for the `photos` bucket
-- Run this AFTER 0002_rls.sql.
-- Before running: create a PRIVATE bucket named "photos" in the Supabase
-- dashboard (Storage → New bucket, leave Public off).

-- Object paths follow the convention "<owner_uuid>/<filename>".
-- We derive ownership from the path's first segment so policies match what
-- the app uploads.

-- INSERT: caller may upload only under their own uuid prefix.
create policy "photos_insert_own_prefix"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: caller may read their own photos OR a friend's photos.
create policy "photos_select_self_or_friends"
on storage.objects for select
to authenticated
using (
  bucket_id = 'photos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.are_friends(
         auth.uid(),
         ((storage.foldername(name))[1])::uuid
       )
  )
);

-- UPDATE / DELETE: only the owner.
create policy "photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
