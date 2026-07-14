-- MQ Block1: 20260830210000 のクリア消去で不整合になった
-- 「過去に Q2 / 2-1 をクリア済み」の進捗を復元する。
--
-- 根拠:
-- - Q2: trim マイグレーションが completed=true を false に戻した行
--   （updated_at が 2026-07-13 19:09:56 JST 付近）および Q3 完走済みだが Q2 未完了の行
-- - 2-1: 当時 Q2 完了には課題クリアが必要だったため、上記ユーザーの 2-1 完了を復元
-- 適用済み（MCP apply_migration: mq_b1_restore_q2_clears_after_trim）

WITH
q2_lesson AS (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson') AS id
),
q3_lesson AS (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson') AS id
),
q2_song AS (
  SELECT
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-1-lsong') AS lesson_song_id,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson') AS lesson_id
),
restore_users AS (
  SELECT
    q2.user_id,
    coalesce(
      q3.completion_date,
      q3.unlock_date,
      q2.unlock_date,
      now()
    ) AS restored_at
  FROM public.user_lesson_progress q2
  CROSS JOIN q2_lesson
  CROSS JOIN q3_lesson
  LEFT JOIN public.user_lesson_progress q3
    ON q3.user_id = q2.user_id
   AND q3.lesson_id = q3_lesson.id
  WHERE q2.lesson_id = q2_lesson.id
    AND q2.completed = false
    AND (
      -- trim 時に completed=true → false へ落とされた指紋
      (q2.updated_at AT TIME ZONE 'Asia/Tokyo')
        BETWEEN TIMESTAMP '2026-07-13 19:09:50'
            AND TIMESTAMP '2026-07-13 19:10:10'
      -- Q3 完走は過去の Q2 クリアを前提
      OR coalesce(q3.completed, false)
    )
),
restore_q2 AS (
  UPDATE public.user_lesson_progress ulp
  SET
    completed = true,
    completion_date = ru.restored_at,
    is_unlocked = true,
    updated_at = now()
  FROM restore_users ru
  CROSS JOIN q2_lesson
  WHERE ulp.user_id = ru.user_id
    AND ulp.lesson_id = q2_lesson.id
    AND ulp.completed = false
  RETURNING ulp.user_id
),
restore_21 AS (
  INSERT INTO public.user_lesson_requirements_progress (
    user_id,
    lesson_id,
    lesson_song_id,
    clear_count,
    clear_dates,
    best_rank,
    last_cleared_at,
    is_completed,
    created_at,
    updated_at,
    daily_progress
  )
  SELECT
    ru.user_id,
    qs.lesson_id,
    qs.lesson_song_id,
    1,
    ARRAY[(ru.restored_at AT TIME ZONE 'Asia/Tokyo')::date],
    'S',
    ru.restored_at,
    true,
    ru.restored_at,
    now(),
    '{}'::jsonb
  FROM restore_users ru
  CROSS JOIN q2_song qs
  ON CONFLICT (user_id, lesson_id, lesson_song_id) WHERE (lesson_song_id IS NOT NULL)
  DO UPDATE SET
    is_completed = true,
    clear_count = greatest(
      public.user_lesson_requirements_progress.clear_count,
      1
    ),
    last_cleared_at = coalesce(
      public.user_lesson_requirements_progress.last_cleared_at,
      excluded.last_cleared_at
    ),
    best_rank = coalesce(
      public.user_lesson_requirements_progress.best_rank,
      excluded.best_rank
    ),
    updated_at = now()
  RETURNING user_id
)
SELECT
  (SELECT count(*) FROM restore_q2) AS q2_restored,
  (SELECT count(*) FROM restore_21) AS assignment_21_restored;
