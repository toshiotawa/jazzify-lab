-- 開発者テスト: MQ 1-1 6音パリィ音名ステージを通常バトル（与ダメ／被ダメあり）へ調整
BEGIN;

UPDATE public.ear_training_stages
SET
  title = 'MQ 1-1 6音同時押し（パリィ音名）',
  title_en = 'MQ 1-1 six-note parry labels',
  description = 'メインクエスト 1-1 譜面の各発音を C–A の 6 音同時押しに変更。パリィ円内の音名ラベル（横並び）表示確認用の通常バトル。',
  description_en = 'MQ 1-1 sheet with each attack turned into a six-note C–A chord. Normal battle stage to verify horizontal note-name labels inside parry circles.',
  enemy_hp = 80,
  per_correct_note_damage = 2,
  good_completion_damage = 12,
  great_completion_damage = 18,
  perfect_completion_damage = 24,
  miss_damage = 3,
  fail_damage = 10,
  perfect_max_misses = 0,
  great_max_misses = 2,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-stage');

UPDATE public.lessons
SET
  description = 'メインクエスト 1-1 OSMD を 6 音同時押し化した通常バトル。パリィ円の音名（C D E F G A・横並び）と与ダメージ／被ダメージを確認する。',
  description_en = 'Normal MQ 1-1 OSMD battle with six-note simultaneous attacks. Verify horizontal note-name labels (C D E F G A) and deal/take damage.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-lesson');

COMMIT;
