begin;

alter table public.links
  add column owner_id uuid references auth.users(id) on delete cascade;

create index links_owner_created_at_idx
  on public.links (owner_id, created_at desc, code desc);

grant select, insert, delete on public.links to authenticated;

create policy "Owners read their links" on public.links
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners create their links" on public.links
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners delete their links" on public.links
  for delete to authenticated
  using (owner_id = (select auth.uid()));

commit;
