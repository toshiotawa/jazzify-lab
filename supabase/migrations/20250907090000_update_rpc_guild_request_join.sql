-- Update rpc_guild_request_join to avoid duplicate pending requests
create or replace function public.rpc_guild_request_join(p_gid uuid)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _req_id uuid;
  _member_count integer;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then raise exception 'Already in a guild'; end if;
  select count(*) into _member_count from public.guild_members where guild_id = p_gid;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;
  -- If already pending, return existing id instead of inserting
  select id into _req_id from public.guild_join_requests
  where guild_id = p_gid and requester_id = _uid and status = 'pending';
  if found then
    return _req_id;
  end if;
  insert into public.guild_join_requests(guild_id, requester_id, status)
  values(p_gid, _uid, 'pending') returning id into _req_id;
  return _req_id;
end;
$$;

