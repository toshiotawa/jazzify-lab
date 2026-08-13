-- 耳コピチュートリアルの dialogue_only は speaker が partner/player。
-- jajii/fai のままだとジャ爺の台詞がファイ側に出る。
BEGIN;

UPDATE public.ear_training_tutorial_scripts AS tutorial
SET
  script = jsonb_set(
    tutorial.script,
    '{scenes}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN scene ? 'lines' THEN
            jsonb_set(
              scene,
              '{lines}',
              (
                SELECT jsonb_agg(
                  CASE
                    WHEN line->>'speaker' = 'jajii' THEN jsonb_set(line, '{speaker}', '"partner"'::jsonb)
                    WHEN line->>'speaker' = 'fai' THEN jsonb_set(line, '{speaker}', '"player"'::jsonb)
                    ELSE line
                  END
                )
                FROM jsonb_array_elements(scene->'lines') AS line
              )
            )
          ELSE scene
        END
        ORDER BY ordinality
      )
      FROM jsonb_array_elements(tutorial.script->'scenes') WITH ORDINALITY AS scene(scene, ordinality)
    )
  ),
  updated_at = now()
WHERE tutorial.script::text LIKE '%"speaker": "jajii"%'
   OR tutorial.script::text LIKE '%"speaker": "fai"%';

COMMIT;
