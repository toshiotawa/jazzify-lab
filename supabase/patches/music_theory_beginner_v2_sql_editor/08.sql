INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-023'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（全ルート）その2',
  'Major/Minor mix (全ルート) · Part 2',
  '',
  '',
  23,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-023'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-023'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-08'),
  'メジャー/マイナー混合（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-024'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（CDE）',
  'M2 up (CDE)',
  '',
  '',
  24,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-024'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-024'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-01'),
  '長2度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-025'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（FGAB）',
  'M2 up (FGAB)',
  '',
  '',
  25,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-025'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-025'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-02'),
  '長2度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-026'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（黒鍵）',
  'M2 up (黒鍵)',
  '',
  '',
  26,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-026'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-026'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-03'),
  '長2度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-027'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（CDE）',
  'M3 up (CDE)',
  '',
  '',
  27,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-027'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-027'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-04'),
  '長3度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-028'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（FGAB）',
  'M3 up (FGAB)',
  '',
  '',
  28,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-028'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-028'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-05'),
  '長3度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-029'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（黒鍵）',
  'M3 up (黒鍵)',
  '',
  '',
  29,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-029'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-029'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-06'),
  '長3度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-030'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（CDE）',
  'P4 up (CDE)',
  '',
  '',
  30,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-030'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-030'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-07'),
  '完全4度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-031'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（FGAB）',
  'P4 up (FGAB)',
  '',
  '',
  31,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-031'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-031'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-08'),
  '完全4度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-032'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（黒鍵）',
  'P4 up (黒鍵)',
  '',
  '',
  32,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-032'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-032'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-09'),
  '完全4度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-033'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（CDE）',
  'P5 up (CDE)',
  '',
  '',
  33,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-033'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-033'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-10'),
  '完全5度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-034'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（FGAB）',
  'P5 up (FGAB)',
  '',
  '',
  34,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);
