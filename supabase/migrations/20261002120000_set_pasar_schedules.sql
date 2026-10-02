-- Replace a pasar's weekly schedule in one go (admin pasar form).
-- security invoker: the caller's RLS applies, so only admins can change anything.

create function public.set_pasar_schedules(p_pasar_id uuid, p_schedules jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.pasar_schedules where pasar_id = p_pasar_id;

  insert into public.pasar_schedules (pasar_id, day_of_week, start_time, end_time)
  select p_pasar_id, s.day_of_week, s.start_time, s.end_time
  from jsonb_to_recordset(p_schedules) as s (day_of_week smallint, start_time time, end_time time);
end;
$$;

comment on function public.set_pasar_schedules is
  'p_schedules: [{"day_of_week": 1, "start_time": "17:00", "end_time": "22:00"}, …]';

revoke execute on function public.set_pasar_schedules(uuid, jsonb) from public, anon;
grant execute on function public.set_pasar_schedules(uuid, jsonb) to authenticated;
