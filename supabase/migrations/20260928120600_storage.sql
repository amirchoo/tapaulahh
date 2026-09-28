-- Storage buckets (VISION §7). Both public-read via their public URLs.
--   pasar-photos:    admins upload.
--   business-photos: signed-in users upload into a folder named after their user id,
--                    e.g. business-photos/<user id>/logo.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pasar-photos', 'pasar-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('business-photos', 'business-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "pasar-photos: admins read"
on storage.objects for select
to authenticated
using (bucket_id = 'pasar-photos' and public.is_admin());

create policy "pasar-photos: admins upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'pasar-photos' and public.is_admin());

create policy "pasar-photos: admins update"
on storage.objects for update
to authenticated
using (bucket_id = 'pasar-photos' and public.is_admin())
with check (bucket_id = 'pasar-photos' and public.is_admin());

create policy "pasar-photos: admins delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'pasar-photos' and public.is_admin());

create policy "business-photos: read own folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'business-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

create policy "business-photos: upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "business-photos: update own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'business-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "business-photos: delete own folder, admins any"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'business-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);
