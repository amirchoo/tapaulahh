-- Vendor categories, vendors (stalls at a pasar) and stall claims.

create table public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ms text not null,
  name_en text not null,
  -- Lucide icon name, e.g. 'flame'.
  icon text,
  sort_order integer not null default 0
);

-- Starting list. Reference data, not sample data; admins can edit it later.
insert into public.vendor_categories (slug, name_ms, name_en, icon, sort_order) values
  ('nasi-lauk', 'Nasi & lauk', 'Rice & dishes', 'soup', 10),
  ('mee', 'Mee & bihun', 'Noodles', 'utensils', 20),
  ('bakar-panggang', 'Bakar & panggang', 'Grilled', 'flame', 30),
  ('goreng', 'Goreng-goreng', 'Fried snacks', 'drumstick', 40),
  ('kuih', 'Kuih-muih', 'Kuih & cakes', 'cake-slice', 50),
  ('pencuci-mulut', 'Pencuci mulut', 'Desserts', 'ice-cream-cone', 60),
  ('minuman', 'Air & minuman', 'Drinks', 'cup-soda', 70),
  ('buah', 'Buah-buahan', 'Fruit', 'apple', 80),
  ('barang-basah', 'Barang basah', 'Fresh produce', 'carrot', 90),
  ('pakaian', 'Pakaian & aksesori', 'Clothing & accessories', 'shirt', 100),
  ('barangan-rumah', 'Barangan rumah', 'Household goods', 'shopping-bag', 110),
  ('lain-lain', 'Lain-lain', 'Others', 'ellipsis', 999);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  pasar_id uuid not null references public.pasars (id) on delete cascade,
  -- URL part: /pasar/<pasar slug>/<vendor slug>. Unique within a pasar.
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  category_id uuid references public.vendor_categories (id) on delete set null,
  description text,
  price_range text,
  photos text[] not null default '{}',
  -- Stall position inside the pasar. Unused in Phase 1.
  position extensions.geography(Point, 4326),
  -- Days this stall is usually there, 0 = Sunday … 6 = Saturday.
  usual_days smallint[] not null default '{}' check (usual_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  owner_id uuid references public.profiles (id) on delete set null,
  status public.vendor_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pasar_id, slug)
);

create index vendors_pasar_idx on public.vendors (pasar_id);
create index vendors_owner_idx on public.vendors (owner_id);
create index vendors_status_idx on public.vendors (status);
create index vendors_name_trgm_idx on public.vendors using gin (name extensions.gin_trgm_ops);

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

-- Non-moderators: new stalls start pending and belong to their creator;
-- owners can't change status, ownership or which pasar the stall is in.
create function public.guard_vendor_write()
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
    return new;
  end if;

  if new.status is distinct from old.status
    or new.owner_id is distinct from old.owner_id
    or new.pasar_id is distinct from old.pasar_id then
    raise exception 'Only admins can change a stall''s status, owner or pasar'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger vendors_guard_write
before insert or update on public.vendors
for each row execute function public.guard_vendor_write();

create table public.vendor_claims (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message text,
  status public.claim_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One open claim per user per stall.
create unique index vendor_claims_one_pending_idx
on public.vendor_claims (vendor_id, user_id)
where status = 'pending';

create trigger vendor_claims_set_updated_at
before update on public.vendor_claims
for each row execute function public.set_updated_at();

-- Claims always start pending, for the requesting user.
create function public.guard_vendor_claim_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.can_moderate() then
    new.status := 'pending';
    new.user_id := (select auth.uid());
  end if;
  return new;
end;
$$;

create trigger vendor_claims_guard_insert
before insert on public.vendor_claims
for each row execute function public.guard_vendor_claim_insert();

-- Approving a claim hands the stall to the claimant.
create function public.apply_approved_vendor_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.vendors set owner_id = new.user_id where id = new.vendor_id;
  end if;
  return new;
end;
$$;

create trigger vendor_claims_apply_approval
after update on public.vendor_claims
for each row execute function public.apply_approved_vendor_claim();

-- RLS -----------------------------------------------------------------------

alter table public.vendor_categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_claims enable row level security;

create policy "Vendor categories: anyone reads"
on public.vendor_categories for select to anon, authenticated using (true);

create policy "Vendor categories: admins insert"
on public.vendor_categories for insert to authenticated with check (public.is_admin());

create policy "Vendor categories: admins update"
on public.vendor_categories for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Vendor categories: admins delete"
on public.vendor_categories for delete to authenticated using (public.is_admin());

create policy "Vendors: anyone reads active stalls at active pasars; owners and admins read theirs"
on public.vendors for select
to anon, authenticated
using (
  (
    status = 'active'
    and exists (select 1 from public.pasars p where p.id = pasar_id and p.status = 'active')
  )
  or owner_id = (select auth.uid())
  or public.is_admin()
);

create policy "Vendors: signed-in users register stalls"
on public.vendors for insert
to authenticated
with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "Vendors: owners and admins update"
on public.vendors for update
to authenticated
using (owner_id = (select auth.uid()) or public.is_admin())
with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "Vendors: admins delete"
on public.vendors for delete to authenticated using (public.is_admin());

create policy "Claims: read own, admins read all"
on public.vendor_claims for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "Claims: signed-in users claim"
on public.vendor_claims for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Claims: admins decide"
on public.vendor_claims for update
to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Claims: withdraw own pending, admins delete"
on public.vendor_claims for delete
to authenticated
using ((user_id = (select auth.uid()) and status = 'pending') or public.is_admin());

grant select on public.vendor_categories, public.vendors to anon, authenticated;
grant insert, update, delete on public.vendor_categories, public.vendors to authenticated;
grant select, insert, update, delete on public.vendor_claims to authenticated;
