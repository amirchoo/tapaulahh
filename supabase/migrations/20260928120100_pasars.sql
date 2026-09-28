-- Pasars and their weekly schedules. Admin-managed; public can read active ones.

create table public.pasars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  description text,
  location extensions.geography(Point, 4326) not null,
  -- Generated so the API returns plain numbers instead of PostGIS binary.
  lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored,
  boundary extensions.geography(Polygon, 4326),
  address text,
  district text not null,
  state text not null default 'Selangor',
  parking_notes text,
  photos text[] not null default '{}',
  status public.pasar_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.pasars.slug is 'URL part: /pasar/<slug>. Lowercase words joined by hyphens.';

create index pasars_location_idx on public.pasars using gist (location);
create index pasars_status_idx on public.pasars (status);
create index pasars_name_trgm_idx on public.pasars using gin (name extensions.gin_trgm_ops);

create trigger pasars_set_updated_at
before update on public.pasars
for each row execute function public.set_updated_at();

create table public.pasar_schedules (
  id uuid primary key default gen_random_uuid(),
  pasar_id uuid not null references public.pasars (id) on delete cascade,
  -- 0 = Sunday … 6 = Saturday (same as JavaScript's Date#getDay).
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  -- An end at or before the start means the pasar runs past midnight.
  end_time time not null check (end_time <> start_time),
  unique (pasar_id, day_of_week, start_time)
);

create index pasar_schedules_day_idx on public.pasar_schedules (day_of_week);

-- RLS -----------------------------------------------------------------------

alter table public.pasars enable row level security;
alter table public.pasar_schedules enable row level security;

create policy "Pasars: anyone reads active, admins read all"
on public.pasars for select
to anon, authenticated
using (status = 'active' or public.is_admin());

create policy "Pasars: admins insert"
on public.pasars for insert to authenticated with check (public.is_admin());

create policy "Pasars: admins update"
on public.pasars for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Pasars: admins delete"
on public.pasars for delete to authenticated using (public.is_admin());

create policy "Schedules: readable when their pasar is"
on public.pasar_schedules for select
to anon, authenticated
using (
  exists (
    select 1 from public.pasars p
    where p.id = pasar_id and (p.status = 'active' or public.is_admin())
  )
);

create policy "Schedules: admins insert"
on public.pasar_schedules for insert to authenticated with check (public.is_admin());

create policy "Schedules: admins update"
on public.pasar_schedules for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Schedules: admins delete"
on public.pasar_schedules for delete to authenticated using (public.is_admin());

grant select on public.pasars, public.pasar_schedules to anon, authenticated;
grant insert, update, delete on public.pasars, public.pasar_schedules to authenticated;
