create extension if not exists "pgcrypto";

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  sequence_order integer not null unique check (sequence_order > 0),
  qr_secret text not null unique,
  title text not null,
  clue_text text not null,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone_number text,
  current_step integer not null default 1 check (current_step > 0),
  is_completed boolean not null default false,
  voucher_code text unique,
  is_redeemed boolean not null default false,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.scan_logs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints(id),
  scanned_step integer not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Player'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index players_current_step_idx on public.players(current_step);
create index scan_logs_player_id_idx on public.scan_logs(player_id);
create index checkpoints_qr_secret_idx on public.checkpoints(qr_secret);

alter table public.players enable row level security;
alter table public.scan_logs enable row level security;
alter table public.checkpoints enable row level security;

create policy "Players can view their own profile" on public.players for select to authenticated using ((select auth.uid()) = id);
create policy "Players can create their own profile" on public.players for insert to authenticated with check ((select auth.uid()) = id);
create policy "Players can view their own scan history" on public.scan_logs for select to authenticated using ((select auth.uid()) = player_id);

create or replace function public.get_current_quest()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare player_record public.players; checkpoint_record public.checkpoints;
begin
  select * into player_record from public.players where id = auth.uid();
  if not found then return jsonb_build_object('success', false, 'error_code', 'PLAYER_NOT_FOUND'); end if;
  select * into checkpoint_record from public.checkpoints where sequence_order = player_record.current_step;
  if not found then
    return jsonb_build_object('success', false, 'error_code', 'NO_ACTIVE_CLUE', 'message', 'No checkpoint is configured for your current mission step.');
  end if;
  return jsonb_build_object('success', true, 'completed', player_record.is_completed, 'current_step', player_record.current_step, 'title', checkpoint_record.title, 'clue_text', checkpoint_record.clue_text);
end;
$$;

create or replace function public.process_qr_scan(p_qr_secret text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare player_record public.players; checkpoint_record public.checkpoints; total_steps integer; voucher text;
begin
  select * into player_record from public.players where id = auth.uid() for update;
  if not found then return jsonb_build_object('success', false, 'error_code', 'PLAYER_NOT_FOUND'); end if;
  if player_record.is_completed then return jsonb_build_object('success', true, 'completed', true, 'voucher_code', player_record.voucher_code); end if;
  select * into checkpoint_record from public.checkpoints where qr_secret = p_qr_secret;
  if not found then return jsonb_build_object('success', false, 'error_code', 'INVALID_QR'); end if;
  if checkpoint_record.sequence_order <> player_record.current_step then return jsonb_build_object('success', false, 'error_code', 'OUT_OF_SEQUENCE', 'expected_step', player_record.current_step); end if;
  insert into public.scan_logs (player_id, checkpoint_id, scanned_step) values (auth.uid(), checkpoint_record.id, player_record.current_step);
  select count(*) into total_steps from public.checkpoints;
  if player_record.current_step >= total_steps then
    voucher := 'NL-' || upper(substr(md5(random()::text), 1, 8));
    update public.players set is_completed = true, voucher_code = voucher where id = auth.uid();
    return jsonb_build_object('success', true, 'completed', true, 'voucher_code', voucher);
  end if;
  update public.players set current_step = current_step + 1 where id = auth.uid();
  return jsonb_build_object('success', true, 'completed', false, 'current_step', player_record.current_step + 1);
end;
$$;

revoke all on function public.get_current_quest() from public;
revoke all on function public.process_qr_scan(text) from public;
grant execute on function public.get_current_quest() to authenticated;
grant execute on function public.process_qr_scan(text) to authenticated;
