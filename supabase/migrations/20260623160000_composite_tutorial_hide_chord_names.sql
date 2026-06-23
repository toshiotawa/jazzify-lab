-- 複合フレーズチュートリアル: 譜面上のコードネームを非表示
BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,tutorial-composite,stage,hide_chord_names_in_battle}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
WHERE id IN ('developer-full-v1', 'developer-tutorial-composite-v1')
  AND script->'content' ? 'tutorial-composite';

COMMIT;
