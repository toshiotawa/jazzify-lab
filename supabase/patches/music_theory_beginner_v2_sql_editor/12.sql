INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-069'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（12調すべて）',
  'Natural minor (12調すべて)',
  '',
  '',
  69,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-069'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-069'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-05'),
  'ナチュラルマイナー（12調すべて）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-070'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（CDE）その1',
  'Major 7th (CDE) · Part 1',
  '',
  '',
  70,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-070'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-070'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-01'),
  'メジャーセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-071'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（CDE）その2',
  'Major 7th (CDE) · Part 2',
  '',
  '',
  71,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-071'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-071'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-02'),
  'メジャーセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-072'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（FGAB）その1',
  'Major 7th (FGAB) · Part 1',
  '',
  '',
  72,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-072'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-072'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-03'),
  'メジャーセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-073'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（FGAB）その2',
  'Major 7th (FGAB) · Part 2',
  '',
  '',
  73,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-073'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-073'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-04'),
  'メジャーセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-074'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（黒鍵）その1',
  'Major 7th (黒鍵) · Part 1',
  '',
  '',
  74,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-074'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-074'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-05'),
  'メジャーセブンス（黒鍵）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-075'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（黒鍵）その2',
  'Major 7th (黒鍵) · Part 2',
  '',
  '',
  75,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-075'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-075'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-06'),
  'メジャーセブンス（黒鍵）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-076'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（全ルート）その1',
  'Major 7th (全ルート) · Part 1',
  '',
  '',
  76,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-076'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-076'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-07'),
  'メジャーセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-077'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（全ルート）その2',
  'Major 7th (全ルート) · Part 2',
  '',
  '',
  77,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-077'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-077'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-08'),
  'メジャーセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-078'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（CDE）その1',
  'Minor 7th (CDE) · Part 1',
  '',
  '',
  78,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-078'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-078'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-01'),
  'マイナーセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-079'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（CDE）その2',
  'Minor 7th (CDE) · Part 2',
  '',
  '',
  79,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-079'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-079'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-02'),
  'マイナーセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-080'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（FGAB）その1',
  'Minor 7th (FGAB) · Part 1',
  '',
  '',
  80,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);
