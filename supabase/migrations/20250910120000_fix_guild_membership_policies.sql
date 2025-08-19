-- Fix guild policies and join request handling
alter table public.guilds add column if not exists disbanded boolean not null default false;

drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds for update
  using (auth.uid() = leader_id)
  with check (true);

drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = auth.uid()
  or exists(select 1 from public.guilds g where g.id = guild_members.guild_id and g.leader_id = auth.uid())
  or exists(select 1 from public.guild_members gm where gm.guild_id = guild_members.guild_id and gm.user_id = auth.uid())
);

create or replace function public.rpc_guild_cancel_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select * into _row from public.guild_join_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
  if _row.requester_id <> _uid then raise exception 'Only requester can cancel'; end if;
  update public.guild_join_requests set status = 'cancelled', updated_at = now() where id = p_request_id;
end;
$$;

grant execute on function public.rpc_guild_cancel_request(uuid) to anon, authenticated;

create or replace function public.trg_after_guild_member_insert()
returns trigger
language plpgsql security definer as $$
declare
  _count int;
begin
  update public.guild_join_requests
     set status = 'cancelled', updated_at = now()
   where requester_id = NEW.user_id
     and status = 'pending'
     and guild_id <> NEW.guild_id;

  select count(*) into _count from public.guild_members where guild_id = NEW.guild_id;
  if _count >= 5 then
    update public.guild_join_requests
       set status = 'cancelled', updated_at = now()
     where guild_id = NEW.guild_id and status = 'pending';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_after_guild_member_insert on public.guild_members;
create trigger trg_after_guild_member_insert
after insert on public.guild_members
for each row execute procedure public.trg_after_guild_member_insert();
