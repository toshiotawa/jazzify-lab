-- サバイバルランキング取得RPC（難易度×キャラクター別）
CREATE OR REPLACE FUNCTION rpc_get_survival_ranking(
  p_difficulty text,
  p_character_id uuid DEFAULT NULL,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  nickname text,
  avatar_url text,
  level int,
  rank text,
  twitter_handle text,
  selected_title text,
  character_id uuid,
  character_name text,
  character_avatar_url text,
  survival_time_seconds numeric,
  final_level integer,
  enemies_defeated integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id,
    p.nickname,
    p.avatar_url,
    p.level,
    p.rank::text,
    p.twitter_handle,
    p.selected_title,
    s.character_id,
    c.name AS character_name,
    c.avatar_url AS character_avatar_url,
    s.survival_time_seconds,
    s.final_level,
    s.enemies_defeated
  FROM survival_high_scores s
  JOIN profiles p ON p.id = s.user_id
  LEFT JOIN survival_characters c ON c.id = s.character_id
  WHERE s.difficulty = p_difficulty
    AND s.survival_time_seconds > 0
    AND p.nickname IS NOT NULL
    AND p.nickname != '退会ユーザー'
    AND p.email NOT LIKE '%@deleted.local'
    AND (p_character_id IS NULL OR s.character_id = p_character_id)
  ORDER BY s.survival_time_seconds DESC, s.final_level DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ユーザーのサバイバルランキング順位取得RPC
CREATE OR REPLACE FUNCTION rpc_get_user_survival_rank(
  p_difficulty text,
  p_character_id uuid DEFAULT NULL,
  target_user_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  user_rank integer;
BEGIN
  SELECT r.rn INTO user_rank
  FROM (
    SELECT
      s.user_id,
      ROW_NUMBER() OVER (ORDER BY s.survival_time_seconds DESC, s.final_level DESC) AS rn
    FROM survival_high_scores s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.difficulty = p_difficulty
      AND s.survival_time_seconds > 0
      AND p.nickname IS NOT NULL
      AND p.nickname != '退会ユーザー'
      AND p.email NOT LIKE '%@deleted.local'
      AND (p_character_id IS NULL OR s.character_id = p_character_id)
  ) r
  WHERE r.user_id = target_user_id;

  RETURN user_rank;
END;
$$ LANGUAGE plpgsql STABLE;
