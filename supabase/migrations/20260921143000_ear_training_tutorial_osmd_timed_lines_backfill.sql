-- chord_osmd チュートリアルシーンで timedLines 欠落を空配列で埋める（Web 再生直前 TypeError 再発防止）
BEGIN;

UPDATE public.ear_training_tutorial_scripts AS t
SET script = jsonb_set(
  t.script,
  '{scenes}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN scene->>'type' = 'chord_osmd' AND NOT (scene ? 'timedLines')
        THEN scene || '{"timedLines":[]}'::jsonb
        ELSE scene
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(t.script->'scenes') WITH ORDINALITY AS scene(scene, ordinality)
  )
),
updated_at = now()
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(t.script->'scenes') AS scene
  WHERE scene->>'type' = 'chord_osmd' AND NOT (scene ? 'timedLines')
);

COMMIT;
