alter table public.players add column if not exists email text;

update public.players
set email = auth_users.email
from auth.users as auth_users
where auth_users.id = players.id
  and players.email is null;

-- Keep legacy/orphaned player rows valid; Auth users created after this migration
-- always receive their email from the trigger below.
update public.players
set email = 'unknown-' || id::text || '@invalid.local'
where email is null;

-- Anonymous Auth users do not have an email address.
alter table public.players alter column email drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Anonymous player')
  )
  on conflict (id) do update set email = coalesce(excluded.email, public.players.email);
  return new;
end;
$$;
