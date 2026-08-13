-- Fブルース サバイバル（2音・3音）: BGM をコードランと同じドラムループへ

UPDATE public.lesson_songs
SET survival_lesson_overrides = COALESCE(survival_lesson_overrides, '{}'::jsonb)
  || '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
WHERE is_survival = true
  AND survival_map_category = 'lesson'
  AND survival_stage_number IN (1302, 1312);
