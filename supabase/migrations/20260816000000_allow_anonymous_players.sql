alter table public.players
alter column email drop not null;

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
  on conflict (id) do update
    set email = coalesce(excluded.email, public.players.email);

  return new;
end;
$$;
