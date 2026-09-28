-- Foundation: extensions, enums, shared helpers, profiles.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('user', 'admin');
create type public.pasar_status as enum ('active', 'inactive');
create type public.vendor_status as enum ('pending', 'active', 'inactive');
create type public.claim_status as enum ('pending', 'approved', 'rejected');
create type public.business_status as enum ('pending', 'approved', 'rejected');
create type public.content_type as enum ('pasar', 'vendor', 'business');
create type public.report_status as enum ('open', 'resolved');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing profile for each auth user. role = admin unlocks moderation.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- True when the current request comes from an admin user.
-- security definer so it can read profiles without tripping profiles' own RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- True for admins and for trusted server roles (service_role, SQL editor,
-- migrations). Must stay security invoker: it checks the *caller's* role.
create function public.can_moderate()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

-- Create a profile when someone signs up (Google or magic link).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Users can edit their own name and avatar, but only moderators change roles.
create function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.can_moderate() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
before update on public.profiles
for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

create policy "Profiles: read own, admins read all"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy "Profiles: update own, admins update all"
on public.profiles for update
to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

grant select, update on public.profiles to authenticated;
