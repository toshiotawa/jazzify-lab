-- Restore Chord Run beginner/intermediate courses to the course list.
-- Hide code_run play map blocks (Chord Run moved back from Play tab to Courses).
-- Update assignment copy: goal reach only (no time-limit clear).

BEGIN;

UPDATE public.courses
SET is_visible = true, updated_at = now()
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
);

UPDATE public.lessons
SET
  assignment_description = 'ゴールに到達してください。コード完成でジャンプします。',
  assignment_description_en = 'Reach the goal. Complete each chord to jump.',
  updated_at = now()
WHERE course_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
);

UPDATE public.play_map_blocks
SET is_active = false, updated_at = now()
WHERE mode = 'code_run';

COMMIT;
