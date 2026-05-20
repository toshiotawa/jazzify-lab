-- developer-full-v1: chord_osmd のデモシーン削除・残りシーンから playMode を除去（自分で弾く OSMD のみ）
UPDATE public.ear_training_tutorial_scripts AS s
SET script = jsonb_set(
  s.script::jsonb,
  '{scenes}',
  (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem->>'type' = 'chord_osmd' THEN elem - 'playMode'
          ELSE elem
        END
        ORDER BY ordinality
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(s.script::jsonb -> 'scenes') WITH ORDINALITY AS t (elem, ordinality)
    WHERE NOT (
      elem->>'type' = 'chord_osmd'
      AND COALESCE(elem->>'playMode', '') = 'demo'
    )
  )
)::json
WHERE s.id = 'developer-full-v1';
