-- Menu items for pasar stalls: food (or goods) with a photo, description and price.
-- Like catalog_items for Kedai Rumah. Admins manage them now; stall owners
-- (claimed stalls, Part 7) can manage their own.

create table public.vendor_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  -- Optional: some stalls price by size or weight ("ikut saiz").
  price_rm numeric(8, 2) check (price_rm >= 0),
  -- Public URL in the pasar-photos bucket (vendors/<vendor id>/items/<item id>/…).
  photo_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendor_items_vendor_idx on public.vendor_items (vendor_id, sort_order);
create index vendor_items_name_trgm_idx on public.vendor_items using gin (name extensions.gin_trgm_ops);

create trigger vendor_items_set_updated_at
before update on public.vendor_items
for each row execute function public.set_updated_at();

-- True when the current user owns the stall (claimed) or is an admin.
-- security definer so it can look at vendors without tripping vendors' RLS.
create function public.can_edit_vendor(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.vendors
    where id = p_vendor_id and owner_id = (select auth.uid())
  );
$$;

-- RLS -----------------------------------------------------------------------

alter table public.vendor_items enable row level security;

create policy "Vendor items: anyone reads items of visible stalls; owners and admins read theirs"
on public.vendor_items for select
to anon, authenticated
using (
  exists (
    select 1 from public.vendors v
    join public.pasars p on p.id = v.pasar_id
    where v.id = vendor_id and v.status = 'active' and p.status = 'active'
  )
  or public.can_edit_vendor(vendor_id)
);

create policy "Vendor items: owners and admins insert"
on public.vendor_items for insert
to authenticated
with check (public.can_edit_vendor(vendor_id));

create policy "Vendor items: owners and admins update"
on public.vendor_items for update
to authenticated
using (public.can_edit_vendor(vendor_id))
with check (public.can_edit_vendor(vendor_id));

create policy "Vendor items: owners and admins delete"
on public.vendor_items for delete
to authenticated
using (public.can_edit_vendor(vendor_id));

grant select on public.vendor_items to anon, authenticated;
grant insert, update, delete on public.vendor_items to authenticated;

-- Search: a stall now also matches by what's on its menu ("apam balik").
create or replace function public.search_all(query text)
returns table (
  kind public.content_type,
  id uuid,
  slug text,
  name text,
  -- Area for pasars and shops; the pasar's name for stalls.
  context text,
  -- The pasar's slug for stalls (their URL is /pasar/<parent_slug>/<slug>).
  parent_slug text,
  score real
)
language sql
stable
set search_path = ''
as $$
  with q as (
    select lower(trim(query)) as t
  ),
  results as (
    select
      'pasar'::public.content_type as kind,
      p.id,
      p.slug,
      p.name,
      p.district as context,
      null::text as parent_slug,
      greatest(
        extensions.similarity(lower(p.name), q.t),
        extensions.similarity(lower(p.district), q.t),
        case when strpos(lower(p.name || ' ' || p.district || ' ' || coalesce(p.address, '')), q.t) > 0 then 0.9 else 0 end
      ) as score
    from public.pasars p, q
    where p.status = 'active'

    union all

    select
      'vendor',
      v.id,
      v.slug,
      v.name,
      p.name,
      p.slug,
      greatest(
        extensions.similarity(lower(v.name), q.t),
        case when strpos(
          lower(v.name || ' ' || coalesce(v.description, '') || ' ' || coalesce(c.name_ms, '') || ' ' || coalesce(c.name_en, '')),
          q.t
        ) > 0 then 0.8 else 0 end,
        case when exists (
          select 1 from public.vendor_items i
          where i.vendor_id = v.id and i.is_available
            and strpos(lower(i.name || ' ' || coalesce(i.description, '')), q.t) > 0
        ) then 0.75 else 0 end
      )
    from public.vendors v
    join public.pasars p on p.id = v.pasar_id
    left join public.vendor_categories c on c.id = v.category_id
    cross join q
    where v.status = 'active' and p.status = 'active'

    union all

    select
      'business',
      b.id,
      b.slug,
      b.name,
      b.district,
      null,
      greatest(
        extensions.similarity(lower(b.name), q.t),
        case when strpos(lower(b.name || ' ' || coalesce(b.description, '') || ' ' || b.district), q.t) > 0 then 0.8 else 0 end,
        case when exists (
          select 1 from public.catalog_items i
          where i.business_id = b.id and i.is_available and strpos(lower(i.name), q.t) > 0
        ) then 0.7 else 0 end
      )
    from public.home_businesses b, q
    where b.status = 'approved'
  )
  select r.kind, r.id, r.slug, r.name, r.context, r.parent_slug, r.score::real
  from results r, q
  where length(q.t) >= 2 and r.score >= 0.3
  order by r.score desc, r.name
  limit 30;
$$;
