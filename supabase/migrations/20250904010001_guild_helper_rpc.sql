-- Helper RPCs used by frontend

-- Get a user's guild id regardless of viewer (for invite controls)
create or replace function public.rpc_get_user_guild_id(p_user_id uuid)
returns uuid
language sql security definer as $$
  select guild_id from public.guild_members where user_id = p_user_id limit 1;
$$;
grant execute on function public.rpc_get_user_guild_id(uuid) to anon, authenticated;

