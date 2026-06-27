INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-080'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-080'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-03'),
  'マイナーセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-081'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（FGAB）その2',
  'Minor 7th (FGAB) · Part 2',
  '',
  '',
  81,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-081'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-081'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-04'),
  'マイナーセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-082'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その1',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  82,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-082'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-082'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-05'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-083'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その2',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  83,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-083'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-083'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-06'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-084'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（全ルート）その1',
  'Minor 7th (全ルート) · Part 1',
  '',
  '',
  84,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-084'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-084'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-07'),
  'マイナーセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-085'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（全ルート）その2',
  'Minor 7th (全ルート) · Part 2',
  '',
  '',
  85,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-085'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-085'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-08'),
  'マイナーセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-086'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（CDE）その1',
  'Dominant 7th (CDE) · Part 1',
  '',
  '',
  86,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-086'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-086'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-01'),
  'ドミナントセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-087'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（CDE）その2',
  'Dominant 7th (CDE) · Part 2',
  '',
  '',
  87,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-087'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-087'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-02'),
  'ドミナントセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-088'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（FGAB）その1',
  'Dominant 7th (FGAB) · Part 1',
  '',
  '',
  88,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-088'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-088'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-03'),
  'ドミナントセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-089'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（FGAB）その2',
  'Dominant 7th (FGAB) · Part 2',
  '',
  '',
  89,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-089'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-089'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-04'),
  'ドミナントセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-090'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（黒鍵）その1',
  'Dominant 7th (黒鍵) · Part 1',
  '',
  '',
  90,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-090'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-090'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-05'),
  'ドミナントセブンス（黒鍵）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-091'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（黒鍵）その2',
  'Dominant 7th (黒鍵) · Part 2',
  '',
  '',
  91,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-091'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-091'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-06'),
  'ドミナントセブンス（黒鍵）その2'
);
