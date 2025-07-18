-- Create add_xp function for XP management
-- This function handles XP addition and maintains XP history

CREATE OR REPLACE FUNCTION public.add_xp(
  _user_id uuid,
  _gained_xp integer,
  _reason text DEFAULT 'unknown',
  _song_id uuid DEFAULT NULL,
  _mission_multiplier numeric DEFAULT 1.0
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_xp integer;
  _new_xp integer;
  _current_level integer;
  _new_level integer;
  _result json;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO _current_xp, _current_level
  FROM public.profiles
  WHERE id = _user_id;
  
  -- If user doesn't exist, return error
  IF _current_xp IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Calculate new XP
  _new_xp := _current_xp + _gained_xp;
  
  -- Calculate new level (assuming 1000 XP per level)
  _new_level := floor(_new_xp / 1000.0) + 1;
  
  -- Update user's XP and level
  UPDATE public.profiles
  SET 
    xp = _new_xp,
    level = _new_level,
    updated_at = now()
  WHERE id = _user_id;
  
  -- Insert XP history record
  INSERT INTO public.xp_history (
    user_id,
    gained_xp,
    reason,
    song_id,
    mission_multiplier,
    created_at
  ) VALUES (
    _user_id,
    _gained_xp,
    _reason,
    _song_id,
    _mission_multiplier,
    now()
  );
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'previous_xp', _current_xp,
    'gained_xp', _gained_xp,
    'new_xp', _new_xp,
    'previous_level', _current_level,
    'new_level', _new_level,
    'level_up', _new_level > _current_level
  ) INTO _result;
  
  RETURN _result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_xp TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.add_xp IS 'Adds XP to a user and maintains XP history. Returns JSON with XP change details.';