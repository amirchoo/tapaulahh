-- Peniaga Kecil moderation: admins can leave a note when rejecting, and owners
-- can send a rejected business back for review (rejected → pending).

alter table public.home_businesses add column review_note text;

comment on column public.home_businesses.review_note is
  'Why an admin rejected the business. Shown to its owner; cleared when they resubmit.';

create or replace function public.guard_home_business_write()
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
    new.review_note := null;
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'Only admins can change a shop''s owner' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    -- The one change an owner may make: resubmit after a rejection.
    if old.status = 'rejected' and new.status = 'pending' then
      new.review_note := null;
    else
      raise exception 'Only admins can change a shop''s status' using errcode = '42501';
    end if;
  else
    new.review_note := old.review_note;
  end if;

  new.public_location := old.public_location;
  return new;
end;
$$;
