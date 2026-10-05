-- Plain numbers for the private exact location, so the owner's form can show
-- what they saved (same pattern as pasars.lat/lng). Still owner/admin only (RLS).

alter table public.home_business_locations
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;
