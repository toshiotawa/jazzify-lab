BEGIN;

-- demo_play シーン末尾の endHoldBeats を台本 JSON から除去（ランタイムでも無視済み）。
UPDATE public.survival_tutorial_scripts
SET
  script = jsonb_set(
    script::jsonb,
    '{scenes}',
    (
      SELECT coalesce(
        jsonb_agg(
          CASE
            WHEN scene->>'type' = 'demo_play' THEN scene - 'endHoldBeats'
            ELSE scene
          END
        ),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(script::jsonb->'scenes') AS scene
    ),
    true
  ),
  updated_at = now()
WHERE script::text LIKE '%"endHoldBeats"%';

COMMIT;
