-- Update guild members select policy to allow all members to view
DROP POLICY IF EXISTS guild_members_select_visible ON public.guild_members;
CREATE POLICY guild_members_select_visible ON public.guild_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guild_members gm
    WHERE gm.guild_id = public.guild_members.guild_id
      AND gm.user_id = auth.uid()
  )
);

-- Function to count guild members ignoring RLS
CREATE OR REPLACE FUNCTION public.rpc_guild_members_count(p_guild_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.guild_members WHERE guild_id = p_guild_id;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_guild_members_count(uuid) TO anon, authenticated;

-- Function to cancel join request by requester
CREATE OR REPLACE FUNCTION public.rpc_guild_cancel_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  SELECT * INTO _row FROM public.guild_join_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;
  IF _row.requester_id <> _uid THEN
    RAISE EXCEPTION 'Only requester can cancel';
  END IF;
  UPDATE public.guild_join_requests SET status = 'cancelled', updated_at = now() WHERE id = p_request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_guild_cancel_request(uuid) TO anon, authenticated;

-- Function for leader to transfer leadership and leave guild
CREATE OR REPLACE FUNCTION public.rpc_guild_transfer_and_leave(p_guild_id uuid, p_new_leader_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  UPDATE public.guilds SET leader_id = p_new_leader_id WHERE id = p_guild_id AND leader_id = _uid;
  UPDATE public.guild_members SET role = 'leader' WHERE guild_id = p_guild_id AND user_id = p_new_leader_id;
  DELETE FROM public.guild_members WHERE guild_id = p_guild_id AND user_id = _uid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_guild_transfer_and_leave(uuid, uuid) TO anon, authenticated;

-- Trigger to cancel join requests when a user joins a guild and when guild becomes full
CREATE OR REPLACE FUNCTION public.trg_after_guild_member_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- cancel user's other join requests
  UPDATE public.guild_join_requests
    SET status = 'cancelled', updated_at = now()
    WHERE requester_id = NEW.user_id AND status = 'pending';

  -- cancel guild's join requests if guild is full
  IF (SELECT count(*) FROM public.guild_members WHERE guild_id = NEW.guild_id) >= 5 THEN
    UPDATE public.guild_join_requests
      SET status = 'cancelled', updated_at = now()
      WHERE guild_id = NEW.guild_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_after_guild_member_insert ON public.guild_members;
CREATE TRIGGER trg_after_guild_member_insert
AFTER INSERT ON public.guild_members
FOR EACH ROW EXECUTE FUNCTION public.trg_after_guild_member_insert();
