-- セルフペース: ヴォイシング quote のみ。シーン dialogue の固定セリフ・timedLines を除去。
UPDATE public.ear_training_tutorial_scripts
SET script = jsonb_set(
  script,
  '{scenes}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'type' = 'chord_voicing_self_paced' THEN
          jsonb_set(
            elem,
            '{dialogue}',
            COALESCE(elem->'dialogue', '{}'::jsonb)
              - 'onSceneStart'
              - 'onLoopSuccess'
              - 'timedLines'
          )
        ELSE elem
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements(script->'scenes') WITH ORDINALITY AS t(elem, ord)
  )
)
WHERE id = 'developer-full-v1';
