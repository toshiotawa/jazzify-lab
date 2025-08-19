-- Avoid recursion in guild_members SELECT policy by using a SECURITY DEFINER helper

-- 1) Helper function: check membership without triggering RLS recursion
create or replace function public.fn_is_member_of_guild(p_guild_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.guild_members
    where guild_id = p_guild_id
      and user_id = p_user_id
  );
$$;

-- Ensure callable by API roles used by PostgREST
grant execute on function public.fn_is_member_of_guild(uuid, uuid) to anon, authenticated;

-- 2) Replace SELECT policy to use the helper (no self-reference in policy body)
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  public.fn_is_member_of_guild(guild_id, auth.uid())
);