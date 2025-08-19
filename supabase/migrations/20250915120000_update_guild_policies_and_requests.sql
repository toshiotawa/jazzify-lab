-- Update guild policies and join request handling

-- Allow members to view all members of their guild
DROP POLICY IF EXISTS guild_members_select_visible ON public.guild_members;
CREATE POLICY guild_members_select_visible ON public.guild_members
FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM public.guild_members gm2
    WHERE gm2.guild_id = guild_members.guild_id AND gm2.user_id = auth.uid()
  )
);

-- Allow leader to update guild leader_id freely
DROP POLICY IF EXISTS guilds_update_leader ON public.guilds;
CREATE POLICY guilds_update_leader ON public.guilds
FOR UPDATE USING (auth.uid() = leader_id) WITH CHECK (TRUE);

-- Function to fetch guild info with member count
CREATE OR REPLACE FUNCTION public.rpc_get_guild(p_gid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  leader_id uuid,
  level integer,
  total_xp bigint,
  description text,
  disbanded boolean,
  guild_type text,
  members_count integer
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT g.id, g.name, g.leader_id, g.level, g.total_xp, g.description, g.disbanded, g.guild_type,
         (SELECT COUNT(*) FROM public.guild_members gm WHERE gm.guild_id = g.id) AS members_count
  FROM public.guilds g
  WHERE g.id = p_gid;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_guild(uuid) TO anon, authenticated;

-- Function to cancel a join request by requester
CREATE OR REPLACE FUNCTION public.rpc_guild_cancel_request(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
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
  UPDATE public.guild_join_requests SET status = 'cancelled', updated_at = NOW() WHERE id = p_request_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_guild_cancel_request(uuid) TO anon, authenticated;

-- Trigger to handle join requests when membership changes or guild becomes full
CREATE OR REPLACE FUNCTION public.trg_after_guild_member_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- cancel all pending requests by this user
  UPDATE public.guild_join_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE requester_id = NEW.user_id AND status = 'pending';
  -- if guild is full, cancel remaining requests to this guild
  IF (SELECT COUNT(*) FROM public.guild_members WHERE guild_id = NEW.guild_id) >= 5 THEN
    UPDATE public.guild_join_requests
      SET status = 'cancelled', updated_at = NOW()
      WHERE guild_id = NEW.guild_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_after_guild_member_insert ON public.guild_members;
CREATE TRIGGER trg_after_guild_member_insert
AFTER INSERT ON public.guild_members
FOR EACH ROW EXECUTE FUNCTION public.trg_after_guild_member_insert();
