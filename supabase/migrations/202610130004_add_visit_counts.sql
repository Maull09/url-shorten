begin;

alter table public.links
  add column visit_count bigint not null default 0 check (visit_count >= 0);

-- Users may create links, but cannot choose or modify their visit counters.
revoke insert on public.links from authenticated;
grant insert (code, target_url, owner_id, created_at) on public.links to authenticated;
grant update (visit_count) on public.links to service_role;

create function public.record_link_visit(link_code text, expected_target_url text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with updated as (
    update public.links
    set visit_count = visit_count + 1
    where code = link_code and target_url = expected_target_url
    returning code
  )
  select exists (select 1 from updated);
$$;

revoke all on function public.record_link_visit(text, text) from public, anon, authenticated;
grant execute on function public.record_link_visit(text, text) to service_role;

create function public.get_owned_visit_total()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(visit_count), 0)::bigint
  from public.links
  where owner_id = (select auth.uid());
$$;

revoke all on function public.get_owned_visit_total() from public, anon;
grant execute on function public.get_owned_visit_total() to authenticated;

commit;
