begin;

create table public.links (
  code text primary key check (code ~ '^[A-Za-z0-9]{8}$'),
  target_url text not null check (
    char_length(target_url) <= 2048
    and target_url ~ '^https?://'
  ),
  created_at timestamptz not null default now()
);

alter table public.links enable row level security;

-- All reads/writes go through the application's server routes.
revoke all on table public.links from public, anon, authenticated;
grant select, insert on table public.links to service_role;

commit;
