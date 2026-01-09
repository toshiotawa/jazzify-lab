-- user_song_statsテーブルにキー別クリア回数を保存するためのkey_clearsカラムを追加
-- key_clearsはJSONBで、キーが-6~+6の移調値、値がクリア回数
-- 例: {"0": 5, "-2": 3, "3": 1}

ALTER TABLE public.user_song_stats
ADD COLUMN IF NOT EXISTS key_clears jsonb DEFAULT '{}'::jsonb NOT NULL;

COMMENT ON COLUMN public.user_song_stats.key_clears IS 'キー（移調）別のクリア回数。キーは-6から+6の移調値（文字列）、値はクリア回数。例: {"0": 5, "-2": 3}';

-- update_song_clear_progress関数を更新してキー別クリア回数も更新する
CREATE OR REPLACE FUNCTION public.update_song_clear_progress(
  _user_id uuid, 
  _song_id uuid, 
  _rank text, 
  _is_b_rank_plus boolean,
  _transpose integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _result json;
  _new_clear_count integer;
  _new_b_rank_plus_count integer;
  _current_key_clears jsonb;
  _key_str text;
BEGIN
  _key_str := _transpose::text;
  
  -- 現在のkey_clearsを取得
  SELECT COALESCE(key_clears, '{}'::jsonb) INTO _current_key_clears
  FROM public.user_song_stats
  WHERE user_id = _user_id AND song_id = _song_id;
  
  IF _current_key_clears IS NULL THEN
    _current_key_clears := '{}'::jsonb;
  END IF;
  
  -- Update user_song_stats for general tracking
  INSERT INTO public.user_song_stats (user_id, song_id, clear_count, best_rank, last_played, b_rank_plus_count, key_clears)
  VALUES (
    _user_id, 
    _song_id, 
    1, 
    _rank, 
    now(), 
    CASE WHEN _is_b_rank_plus THEN 1 ELSE 0 END,
    jsonb_build_object(_key_str, 1)
  )
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_stats.clear_count + 1,
    b_rank_plus_count = CASE 
      WHEN _is_b_rank_plus THEN user_song_stats.b_rank_plus_count + 1 
      ELSE user_song_stats.b_rank_plus_count 
    END,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_stats.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_stats.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_stats.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_stats.best_rank
    END,
    last_played = now(),
    updated_at = now(),
    key_clears = user_song_stats.key_clears || jsonb_build_object(
      _key_str, 
      COALESCE((user_song_stats.key_clears->>_key_str)::integer, 0) + 1
    )
  RETURNING clear_count, b_rank_plus_count INTO _new_clear_count, _new_b_rank_plus_count;

  -- Update user_song_progress for mission system (if needed)
  INSERT INTO public.user_song_progress (user_id, song_id, clear_count, best_rank, last_cleared_at)
  VALUES (_user_id, _song_id, 1, _rank, now())
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_progress.clear_count + 1,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_progress.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_progress.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_progress.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_progress.best_rank
    END,
    last_cleared_at = now();

  -- Return the updated counts
  SELECT json_build_object(
    'clear_count', _new_clear_count,
    'b_rank_plus_count', _new_b_rank_plus_count
  ) INTO _result;

  RETURN _result;
END;
$$;

COMMENT ON FUNCTION public.update_song_clear_progress(uuid, uuid, text, boolean, integer) IS 'Updates both user_song_stats and user_song_progress when a song is cleared, with transpose key tracking';
