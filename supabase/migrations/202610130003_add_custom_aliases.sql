begin;

alter table public.links drop constraint links_code_check;
alter table public.links add constraint links_code_check
  check (code ~ '^[A-Za-z0-9_-]{3,32}$');

-- Keep the case-sensitive primary key as the atomic uniqueness boundary.
-- Existing eight-character generated codes remain valid.

commit;
