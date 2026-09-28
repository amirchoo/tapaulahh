-- Favourites (private per user) and community reports (login required).

create table public.favourites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type public.content_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.content_type not null,
  target_id uuid not null,
  reason text not null check (length(trim(reason)) > 0),
  details text,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- Reports always start open, from the signed-in user.
create function public.guard_report_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.can_moderate() then
    new.status := 'open';
    new.reporter_id := (select auth.uid());
    new.resolved_by := null;
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger reports_guard_insert
before insert on public.reports
for each row execute function public.guard_report_insert();

-- RLS -----------------------------------------------------------------------

alter table public.favourites enable row level security;
alter table public.reports enable row level security;

create policy "Favourites: own only"
on public.favourites for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Reports: read own, admins read all"
on public.reports for select
to authenticated
using (reporter_id = (select auth.uid()) or public.is_admin());

create policy "Reports: signed-in users report"
on public.reports for insert
to authenticated
with check (reporter_id = (select auth.uid()));

create policy "Reports: admins resolve"
on public.reports for update
to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Reports: admins delete"
on public.reports for delete to authenticated using (public.is_admin());

grant select, insert, delete on public.favourites to authenticated;
grant select, insert, update, delete on public.reports to authenticated;
