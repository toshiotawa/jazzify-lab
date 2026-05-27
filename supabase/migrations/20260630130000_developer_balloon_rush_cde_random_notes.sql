-- 開発者用テストコース「風船ラッシュ」: 出題を中央C付近の C / D / E 単音ランダムに変更
-- Web/iOS とも random + chord_suffix `_note` + root_pattern `cde` → C_note, D_note, E_note

UPDATE public.balloon_rush_stages
SET
  title = '風船ラッシュ C D E',
  title_en = 'Balloon Rush C D E',
  description = '10秒ごとに風船が消えます。C・D・E（中央C付近）の単音をランダム出題。B列で〇個割ってクリア。',
  description_en = 'Balloons expire every 10s. Random single notes C, D, E (around middle C). Pop ○ with melee (B slot) to clear.',
  stage_type = 'random',
  chord_suffix = '_note',
  root_pattern = 'cde',
  allowed_chords = NULL,
  chord_progression = NULL
WHERE slug = 'balloon-rush-dm7-01';

UPDATE public.lessons
SET
  title = '風船ラッシュ（テスト / C D E）',
  title_en = 'Balloon Rush (test / C D E)',
  description = '90秒以内に風船を20個割るテストステージ balloon-rush-dm7-01（C・D・E 単音ランダム、B列のみ）。',
  description_en = 'Test stage balloon-rush-dm7-01 — pop 20 balloons in 90s (random C/D/E single notes, slot B melee only).'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'developer-balloon-rush-lab-lesson'
);

UPDATE public.lesson_songs
SET
  title = '風船ラッシュ C D E',
  title_en = 'Balloon Rush C D E'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'developer-balloon-rush-lab-lsong'
);
