-- Bluesy Licks: 開発者テストコースの精密課題（フレーズ1–11 × Slow/等速）を本番コースへ移行
-- 対応: フレーズ N（精密）→ 本番「フレーズ N」、Slow/等速を order_index 1/2 に追加
-- 精密はおまけ課題（is_clear_required=false）。既存の耳コピバトル必須クリアを維持する。

BEGIN;

CREATE TEMP TABLE bl_precision_migrate ON COMMIT DROP AS
SELECT
  ls.id AS lsong_id,
  s.id AS stage_id,
  s.slug AS old_slug,
  (regexp_match(s.slug, '^dev-bl-stage-([0-9]+)-(slow|normal)-precision$'))[1]::int AS phrase_num,
  (regexp_match(s.slug, '^dev-bl-stage-([0-9]+)-(slow|normal)-precision$'))[2] AS tempo,
  prod.id AS prod_lesson_id,
  dev_l.id AS dev_lesson_id
FROM public.lesson_songs ls
JOIN public.ear_training_stages s ON s.id = ls.ear_training_stage_id
JOIN public.lessons dev_l ON dev_l.id = ls.lesson_id
JOIN public.lessons prod
  ON prod.course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks')
 AND prod.order_index = (
   (regexp_match(s.slug, '^dev-bl-stage-([0-9]+)-(slow|normal)-precision$'))[1]::int - 1
 )
WHERE s.slug ~ '^dev-bl-stage-[0-9]+-(slow|normal)-precision$'
  AND dev_l.course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test');

DO $$
DECLARE
  mapped_count integer;
BEGIN
  SELECT COUNT(*) INTO mapped_count FROM bl_precision_migrate;
  IF mapped_count <> 22 THEN
    RAISE EXCEPTION 'Expected 22 Bluesy precision songs to migrate, found %', mapped_count;
  END IF;
END $$;

-- 1) lesson_songs を本番レッスンへ移動
UPDATE public.lesson_songs ls
SET
  lesson_id = m.prod_lesson_id,
  order_index = CASE WHEN m.tempo = 'slow' THEN 1 ELSE 2 END,
  title = CASE WHEN m.tempo = 'slow' THEN 'Slow 精密' ELSE '等速 精密' END,
  title_en = CASE WHEN m.tempo = 'slow' THEN 'Slow Precision' ELSE 'Full tempo Precision' END,
  is_clear_required = false,
  clear_conditions = '{"count":1,"rank":"C"}'::jsonb
FROM bl_precision_migrate m
WHERE ls.id = m.lsong_id;

-- 2) 課題クリア進捗の lesson_id を本番に合わせる
UPDATE public.user_lesson_requirements_progress ulrp
SET
  lesson_id = m.prod_lesson_id,
  updated_at = now()
FROM bl_precision_migrate m
WHERE ulrp.lesson_song_id = m.lsong_id
  AND ulrp.lesson_id IS DISTINCT FROM m.prod_lesson_id;

-- 3) ステージメタ（slug / タイトル / 説明）を本番向けに更新
UPDATE public.ear_training_stages s
SET
  slug = 'bl-stage-' || m.phrase_num::text || '-' || m.tempo || '-precision',
  title = CASE
    WHEN m.tempo = 'slow' THEN 'フレーズ ' || m.phrase_num::text || '（Slow・精密）'
    ELSE 'フレーズ ' || m.phrase_num::text || '（等速・精密）'
  END,
  title_en = CASE
    WHEN m.tempo = 'slow' THEN 'Phrase ' || m.phrase_num::text || ' (Slow · Precision)'
    ELSE 'Phrase ' || m.phrase_num::text || ' (Full tempo · Precision)'
  END,
  description = CASE
    WHEN m.tempo = 'slow' THEN
      'BPM ' || s.bpm::text || '・F メジャー・精密モード（落下ノーツ）。'
    ELSE
      'BPM ' || s.bpm::text || '・F メジャー・精密モード（落下ノーツ）。'
  END,
  description_en = CASE
    WHEN m.tempo = 'slow' THEN
      s.bpm::text || ' BPM F major precision (falling notes).'
    ELSE
      s.bpm::text || ' BPM F major precision (falling notes).'
  END,
  updated_at = now()
FROM bl_precision_migrate m
WHERE s.id = m.stage_id;

UPDATE public.ear_training_phrases p
SET
  title = CASE
    WHEN m.tempo = 'slow' THEN 'フレーズ ' || m.phrase_num::text || '（Slow・精密）'
    ELSE 'フレーズ ' || m.phrase_num::text || '（等速・精密）'
  END,
  title_en = CASE
    WHEN m.tempo = 'slow' THEN 'Phrase ' || m.phrase_num::text || ' (Slow · Precision)'
    ELSE 'Phrase ' || m.phrase_num::text || ' (Full tempo · Precision)'
  END
FROM bl_precision_migrate m
WHERE p.stage_id = m.stage_id;

-- 4) 空になった開発者テストの精密レッスンと進捗を削除
DELETE FROM public.user_lesson_progress ulp
USING bl_precision_migrate m
WHERE ulp.lesson_id = m.dev_lesson_id;

DELETE FROM public.user_lesson_requirements_progress ulrp
USING bl_precision_migrate m
WHERE ulrp.lesson_id = m.dev_lesson_id;

DELETE FROM public.lessons l
USING (SELECT DISTINCT dev_lesson_id FROM bl_precision_migrate) d
WHERE l.id = d.dev_lesson_id
  AND NOT EXISTS (
    SELECT 1 FROM public.lesson_songs ls WHERE ls.lesson_id = l.id
  );

COMMIT;
