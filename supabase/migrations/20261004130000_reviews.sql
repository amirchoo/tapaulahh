-- Community reviews: 1–5 stars + optional comment on a pasar or a stall.
-- Signed-in users post (visible at once); one per person per target; they can
-- edit or delete it. Admins can hide any review.

create type public.review_status as enum ('visible', 'hidden');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type public.content_type not null,
  target_id uuid not null,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (length(body) <= 1000),
  status public.review_status not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

create index reviews_target_idx on public.reviews (target_type, target_id, status, updated_at desc);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Non-moderators: reviews are theirs, start visible, and must be about
-- something the public can see. They can't change who, what, or the status.
create function public.guard_review_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.can_moderate() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := (select auth.uid());
    new.status := 'visible';
    if not (
      (new.target_type = 'pasar' and exists (
        select 1 from public.pasars where id = new.target_id and status = 'active'))
      or (new.target_type = 'vendor' and exists (
        select 1 from public.vendors v join public.pasars p on p.id = v.pasar_id
        where v.id = new.target_id and v.status = 'active' and p.status = 'active'))
      or (new.target_type = 'business' and exists (
        select 1 from public.home_businesses where id = new.target_id and status = 'approved'))
    ) then
      raise exception 'Nothing to review here' using errcode = '23503';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.target_type is distinct from old.target_type
    or new.target_id is distinct from old.target_id
    or new.status is distinct from old.status then
    raise exception 'Only admins can change that' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger reviews_guard_write
before insert or update on public.reviews
for each row execute function public.guard_review_write();

-- Reviews point at pasars/stalls/shops without a foreign key, so remove them
-- when the thing they're about is deleted.
create function public.delete_reviews_of_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.reviews
  where target_type = tg_argv[0]::public.content_type and target_id = old.id;
  return old;
end;
$$;

revoke execute on function public.delete_reviews_of_target() from public, anon, authenticated;

create trigger pasars_delete_reviews after delete on public.pasars
for each row execute function public.delete_reviews_of_target('pasar');
create trigger vendors_delete_reviews after delete on public.vendors
for each row execute function public.delete_reviews_of_target('vendor');
create trigger home_businesses_delete_reviews after delete on public.home_businesses
for each row execute function public.delete_reviews_of_target('business');

-- RLS -----------------------------------------------------------------------

alter table public.reviews enable row level security;

create policy "Reviews: anyone reads visible ones; authors and admins read theirs"
on public.reviews for select
to anon, authenticated
using (status = 'visible' or user_id = (select auth.uid()) or public.is_admin());

create policy "Reviews: signed-in users post their own"
on public.reviews for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Reviews: authors edit theirs, admins any"
on public.reviews for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "Reviews: authors delete theirs, admins any"
on public.reviews for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

-- Public list with each author's name and photo. Profiles stay private
-- (their RLS only shows your own), so this returns just those two fields.
create function public.reviews_for(p_target_type public.content_type, p_target_id uuid)
returns table (
  id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_avatar text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.rating, r.body, r.created_at, r.updated_at, p.display_name, p.avatar_url
  from public.reviews r
  join public.profiles p on p.id = r.user_id
  where r.target_type = p_target_type and r.target_id = p_target_id and r.status = 'visible'
  order by r.updated_at desc
  limit 200;
$$;

grant execute on function public.reviews_for(public.content_type, uuid) to anon, authenticated;
