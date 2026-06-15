-- chord_osmd ステージは MusicXML 譜面ベース判定を既定とする（明示 false のみ従来タイミング）
UPDATE public.ear_training_stages
SET osmd_targets_from_score = true
WHERE mode = 'chord_osmd'
  AND osmd_targets_from_score IS DISTINCT FROM true;

-- 既存 OSMD チュートリアル script の content.stage にフラグが無い場合のみ true を付与
UPDATE public.ear_training_tutorial_scripts AS t
SET
  script = sub.next_script,
  updated_at = now()
FROM (
  SELECT
    s.id,
    jsonb_set(
      s.script,
      ARRAY['content', key, 'stage', 'osmd_targets_from_score'],
      'true'::jsonb,
      true
    ) AS next_script
  FROM public.ear_training_tutorial_scripts AS s
  CROSS JOIN LATERAL jsonb_object_keys(s.script -> 'content') AS key
  WHERE (s.script -> 'content' -> key -> 'stage' ->> 'mode') = 'chord_osmd'
    AND (s.script -> 'content' -> key -> 'stage' -> 'osmd_targets_from_score') IS NULL
) AS sub
WHERE t.id = sub.id;
