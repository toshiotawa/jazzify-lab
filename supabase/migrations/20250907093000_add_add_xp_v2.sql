-- Add server-side XP addition function v2
-- Computes gained XP from provided base and multipliers, updates profiles, and writes full xp_history

create or replace function public.add_xp_v2(
  _user_id uuid,
  _base_xp integer,
  _speed_multiplier numeric,
  _rank_multiplier numeric,
  _transpose_multiplier numeric,
  _membership_multiplier numeric,
  _mission_multiplier numeric default 1.0,
  _season_multiplier numeric default null,
  _reason text default 'unknown',
  _song_id uuid default null
) returns json
language plpgsql
security definer
as $$
declare
  _current_xp bigint;
  _current_level integer;
  _profile_season_multiplier numeric;
  _gained integer;
  _new_xp bigint;
  _new_level integer;
  _result json;
begin
  -- Fetch current profile state
  select xp, level, next_season_xp_multiplier
    into _current_xp, _current_level, _profile_season_multiplier
  from public.profiles
  where id = _user_id;

  if _current_xp is null then
    return json_build_object('error', 'User not found');
  end if;

  if _season_multiplier is null then
    _season_multiplier := coalesce(_profile_season_multiplier, 1.0);
  end if;

  -- Calculate gained XP (server authoritative)
  _gained := round(
    _base_xp
    * _speed_multiplier
    * _rank_multiplier
    * _transpose_multiplier
    * _membership_multiplier
    * coalesce(_mission_multiplier, 1.0)
    * coalesce(_season_multiplier, 1.0)
  );

  _new_xp := _current_xp + _gained;
  _new_level := public.calculate_level_from_xp(_new_xp);

  -- Update profile
  update public.profiles
     set xp = _new_xp,
         level = _new_level,
         updated_at = now()
   where id = _user_id;

  -- Insert history (full columns)
  insert into public.xp_history (
    user_id,
    song_id,
    gained_xp,
    base_xp,
    speed_multiplier,
    rank_multiplier,
    transpose_multiplier,
    membership_multiplier,
    mission_multiplier,
    reason,
    created_at
  ) values (
    _user_id,
    _song_id,
    _gained,
    _base_xp,
    _speed_multiplier,
    _rank_multiplier,
    _transpose_multiplier,
    _membership_multiplier,
    coalesce(_mission_multiplier, 1.0),
    _reason,
    now()
  );

  -- Return summary
  select json_build_object(
    'success', true,
    'previous_xp', _current_xp,
    'gained_xp', _gained,
    'new_xp', _new_xp,
    'previous_level', _current_level,
    'new_level', _new_level,
    'level_up', _new_level > _current_level
  ) into _result;

  return _result;
end;
$$;

grant execute on function public.add_xp_v2(uuid, integer, numeric, numeric, numeric, numeric, numeric, numeric, text, uuid) to authenticated;

