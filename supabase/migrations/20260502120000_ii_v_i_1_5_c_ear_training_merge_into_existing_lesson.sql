BEGIN;

-- 既に適用済みの環境向け: 誤って追加された単独レッスンを除去し、lsn-c-1-5 に耳コピ課題を統合する。
-- （20260501090000 修正後の新規DBでは本マイグレーションはほぼ no-op）

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS assignment_description_en text;

DELETE FROM public.lesson_songs
WHERE lesson_id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid
   OR id = '573f6350-d425-57bc-b66d-95381c5a6079'::uuid;

DELETE FROM public.lessons WHERE id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid;

UPDATE public.lessons SET
  description =
    '実習: (1) リンク先のファンタジーステージをクリア（ランクC以上・1回）。(2) 耳コピバトルステージを1回クリア（ランクB以上）してください。',
  description_en =
    'Practice: (1) Clear the linked Fantasy stage once (rank C or better). (2) Clear the ear-copy battle stage once (rank B or better).',
  assignment_description = '制限時間内にステージクリアを目指してください。',
  assignment_description_en = 'Aim to clear the stage within the time limit.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5');

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_ear_training, ear_training_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-1-5-ear'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5'),
  null,
  1,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  '課題（耳コピバトル）',
  'Assignment (ear-copy battle)'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
  fantasy_stage_id = EXCLUDED.fantasy_stage_id,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
