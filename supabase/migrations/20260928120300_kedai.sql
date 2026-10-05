-- Kedai Rumah: home businesses, their private location, and catalog items.
-- Privacy (VISION §4.3): the exact location lives in home_business_locations,
-- readable only by the owner and admins. The public table only gets a fuzzed point.

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ms text not null,
  name_en text not null,
  icon text,
  sort_order integer not null default 0
);

-- Starting list. Reference data, not sample data; admins can edit it later.
insert into public.business_categories (slug, name_ms, name_en, icon, sort_order) values
  ('kek-pastri', 'Kek & pastri', 'Cakes & pastries', 'cake', 10),
  ('lauk-katering', 'Lauk & katering', 'Home-cooked meals & catering', 'cooking-pot', 20),
  ('sejuk-beku', 'Makanan sejuk beku', 'Frozen food', 'snowflake', 30),
  ('kuih-snek', 'Kuih & snek', 'Kuih & snacks', 'cookie', 40),
  ('minuman', 'Minuman', 'Drinks', 'cup-soda', 50),
  ('kerepek-kering', 'Kerepek & makanan kering', 'Chips & dry goods', 'package', 60),
  ('kraf-tangan', 'Kraf tangan', 'Handicrafts', 'scissors', 70),
  ('pakaian', 'Pakaian', 'Clothing', 'shirt', 80),
  ('kecantikan', 'Kecantikan & penjagaan diri', 'Beauty & personal care', 'sparkles', 90),
  ('lain-lain', 'Lain-lain', 'Others', 'ellipsis', 999);

create table public.home_businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category_id uuid references public.business_categories (id) on delete set null,
  description text,
  district text not null,
  state text not null default 'Selangor',
  -- Fuzzed ~300 to 600 m from the real spot. Set by trigger, never by clients.
  public_location extensions.geography(Point, 4326),
  public_lat double precision generated always as (extensions.st_y(public_location::extensions.geometry)) stored,
  public_lng double precision generated always as (extensions.st_x(public_location::extensions.geometry)) stored,
  -- Digits only, with country code, e.g. 60123456789 (used for wa.me links).
  whatsapp text check (whatsapp ~ '^[0-9]{8,15}$'),
  -- Handle without the @.
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  delivery_notes text,
  hours text,
  logo_url text,
  status public.business_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_businesses_owner_idx on public.home_businesses (owner_id);
create index home_businesses_status_idx on public.home_businesses (status);
create index home_businesses_public_location_idx on public.home_businesses using gist (public_location);
create index home_businesses_name_trgm_idx on public.home_businesses using gin (name extensions.gin_trgm_ops);

create trigger home_businesses_set_updated_at
before update on public.home_businesses
for each row execute function public.set_updated_at();

-- Non-moderators: new shops start pending, belong to their creator, and can't
-- set status, owner or the public location themselves.
create function public.guard_home_business_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.can_moderate() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.owner_id := (select auth.uid());
    new.public_location := null;
    return new;
  end if;

  if new.status is distinct from old.status or new.owner_id is distinct from old.owner_id then
    raise exception 'Only admins can change a shop''s status or owner' using errcode = '42501';
  end if;
  new.public_location := old.public_location;
  return new;
end;
$$;

create trigger home_businesses_guard_write
before insert or update on public.home_businesses
for each row execute function public.guard_home_business_write();

-- Exact location: owner and admins only. Never exposed publicly.
create table public.home_business_locations (
  business_id uuid primary key references public.home_businesses (id) on delete cascade,
  address text,
  location extensions.geography(Point, 4326) not null,
  updated_at timestamptz not null default now()
);

create trigger home_business_locations_set_updated_at
before update on public.home_business_locations
for each row execute function public.set_updated_at();

-- Moves a point 300 to 600 m in a direction fixed per business, so saving the
-- same location again gives the same fuzzed point (no averaging to the real one).
create function public.fuzz_location(point extensions.geography, seed uuid)
returns extensions.geography
language sql
immutable
set search_path = ''
as $$
  select extensions.st_project(
    point,
    300 + (abs(hashtext(seed::text || ':distance')) % 300),
    radians(abs(hashtext(seed::text || ':bearing')) % 360)
  )::extensions.geography;
$$;

-- security definer: runs as the table owner so the guard above lets the
-- computed public_location through.
create function public.sync_public_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.home_businesses set public_location = null where id = old.business_id;
    return old;
  end if;
  update public.home_businesses
  set public_location = public.fuzz_location(new.location, new.business_id)
  where id = new.business_id;
  return new;
end;
$$;

revoke execute on function public.sync_public_location() from public, anon, authenticated;

create trigger home_business_locations_sync_public
after insert or update of location or delete on public.home_business_locations
for each row execute function public.sync_public_location();

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.home_businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  price_rm numeric(10, 2) check (price_rm >= 0),
  photo_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_items_business_idx on public.catalog_items (business_id, sort_order);
create index catalog_items_name_trgm_idx on public.catalog_items using gin (name extensions.gin_trgm_ops);

create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

-- RLS -----------------------------------------------------------------------

alter table public.business_categories enable row level security;
alter table public.home_businesses enable row level security;
alter table public.home_business_locations enable row level security;
alter table public.catalog_items enable row level security;

create policy "Business categories: anyone reads"
on public.business_categories for select to anon, authenticated using (true);

create policy "Business categories: admins insert"
on public.business_categories for insert to authenticated with check (public.is_admin());

create policy "Business categories: admins update"
on public.business_categories for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Business categories: admins delete"
on public.business_categories for delete to authenticated using (public.is_admin());

create policy "Businesses: anyone reads approved; owners and admins read theirs"
on public.home_businesses for select
to anon, authenticated
using (status = 'approved' or owner_id = (select auth.uid()) or public.is_admin());

create policy "Businesses: signed-in users register"
on public.home_businesses for insert
to authenticated
with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "Businesses: owners and admins update"
on public.home_businesses for update
to authenticated
using (owner_id = (select auth.uid()) or public.is_admin())
with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "Businesses: owners and admins delete"
on public.home_businesses for delete
to authenticated
using (owner_id = (select auth.uid()) or public.is_admin());

-- Shared check for the private location and catalog tables.
create function public.owns_business(business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.home_businesses
    where id = business and owner_id = (select auth.uid())
  );
$$;

create policy "Business locations: owners and admins only"
on public.home_business_locations for all
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

create policy "Catalog: readable when the shop is approved, or by owners and admins"
on public.catalog_items for select
to anon, authenticated
using (
  exists (select 1 from public.home_businesses b where b.id = business_id and b.status = 'approved')
  or public.owns_business(business_id)
  or public.is_admin()
);

create policy "Catalog: owners and admins insert"
on public.catalog_items for insert
to authenticated
with check (public.owns_business(business_id) or public.is_admin());

create policy "Catalog: owners and admins update"
on public.catalog_items for update
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

create policy "Catalog: owners and admins delete"
on public.catalog_items for delete
to authenticated
using (public.owns_business(business_id) or public.is_admin());

grant select on public.business_categories, public.home_businesses, public.catalog_items to anon, authenticated;
grant insert, update, delete on public.business_categories, public.home_businesses, public.catalog_items to authenticated;
grant select, insert, update, delete on public.home_business_locations to authenticated;
revoke all on public.home_business_locations from anon;
