-- Update XP calculation logic to match new level requirements
-- Level 1-10: 2,000 XP per level
-- Level 11-50: 50,000 XP per level  
-- Level 51+: 100,000 XP per level

-- Helper function to calculate required XP for next level
CREATE OR REPLACE FUNCTION public.xp_to_next_level(current_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN current_level <= 10 THEN 2000
    WHEN current_level <= 50 THEN 50000
    ELSE 100000
  END;
$$;

-- Helper function to calculate level from total XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp bigint)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  level_counter integer := 1;
  remaining_xp bigint := total_xp;
  required_xp integer;
BEGIN
  WHILE remaining_xp > 0 LOOP
    required_xp := public.xp_to_next_level(level_counter);
    IF remaining_xp >= required_xp THEN
      remaining_xp := remaining_xp - required_xp;
      level_counter := level_counter + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN level_counter;
END;
$$;

-- Updated add_xp function with new level calculation logic
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
  _current_xp bigint;
  _new_xp bigint;
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
  
  -- Calculate new level using updated logic
  _new_level := public.calculate_level_from_xp(_new_xp);
  
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
GRANT EXECUTE ON FUNCTION public.xp_to_next_level TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.add_xp IS 'Adds XP to a user and maintains XP history. Uses updated level calculation: 1-10: 2k XP, 11-50: 50k XP, 51+: 100k XP per level.';
COMMENT ON FUNCTION public.xp_to_next_level IS 'Returns XP required for next level based on current level.';
COMMENT ON FUNCTION public.calculate_level_from_xp IS 'Calculates player level from total XP using new progression system.';