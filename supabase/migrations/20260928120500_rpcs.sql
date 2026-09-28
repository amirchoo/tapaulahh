-- RPCs. Both are security invoker, so RLS decides what each caller sees.

-- Pasars within radius_m of a point, nearest first, optionally only those
-- running on a given day (0 = Sunday … 6 = Saturday).
create function public.pasars_near(
  lat double precision,
  lng double precision,
  radius_m double precision default 20000,
  day_of_week smallint default null
)
returns table (
  id uuid,
  slug text,
  name text,
  district text,
  address text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  schedules jsonb
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography as point
  )
  select
    p.id,
    p.slug,
    p.name,
    p.district,
    p.address,
    p.lat,
    p.lng,
    extensions.st_distance(p.location, origin.point) as distance_m,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'day_of_week', s.day_of_week,
            'start_time', to_char(s.start_time, 'HH24:MI'),
            'end_time', to_char(s.end_time, 'HH24:MI')
          )
          order by s.day_of_week, s.start_time
        )
        from public.pasar_schedules s
        where s.pasar_id = p.id
      ),
      '[]'::jsonb
    ) as schedules
  from public.pasars p, origin
  where p.status = 'active'
    and extensions.st_dwithin(p.location, origin.point, radius_m)
    and (
      pasars_near.day_of_week is null
      or exists (
        select 1 from public.pasar_schedules s
        where s.pasar_id = p.id and s.day_of_week = pasars_near.day_of_week
      )
    )
  order by distance_m
  limit 200;
$$;

-- One search box across pasars, stalls and home businesses.
-- Matches by substring or fuzzy similarity (typos like "apam balek").
create function public.search_all(query text)
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
        ) > 0 then 0.8 else 0 end
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

grant execute on function public.pasars_near(double precision, double precision, double precision, smallint) to anon, authenticated;
grant execute on function public.search_all(text) to anon, authenticated;
