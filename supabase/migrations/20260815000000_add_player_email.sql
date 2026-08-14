alter table public.players add column if not exists email text;

update public.players
set email = auth_users.email
from auth.users as auth_users
where auth_users.id = players.id
  and players.email is null;

alter table public.players alter column email set not null;

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
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Player')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
