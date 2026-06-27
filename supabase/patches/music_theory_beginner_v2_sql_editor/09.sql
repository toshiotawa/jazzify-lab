INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-034'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-034'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-11'),
  '完全5度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-035'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（黒鍵）',
  'P5 up (黒鍵)',
  '',
  '',
  35,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-035'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-035'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-12'),
  '完全5度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-036'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（CDE）',
  'M6 up (CDE)',
  '',
  '',
  36,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-036'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-036'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-13'),
  '長6度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-037'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（FGAB）',
  'M6 up (FGAB)',
  '',
  '',
  37,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-037'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-037'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-14'),
  '長6度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-038'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（黒鍵）',
  'M6 up (黒鍵)',
  '',
  '',
  38,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-038'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-038'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-15'),
  '長6度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-039'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（CDE）',
  'M7 up (CDE)',
  '',
  '',
  39,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-039'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-039'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-16'),
  '長7度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-040'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（FGAB）',
  'M7 up (FGAB)',
  '',
  '',
  40,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-040'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-040'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-17'),
  '長7度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-041'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（黒鍵）',
  'M7 up (黒鍵)',
  '',
  '',
  41,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-041'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-041'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-18'),
  '長7度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-042'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（CDE）',
  'M2 down (CDE)',
  '',
  '',
  42,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-042'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-042'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-01'),
  '長2度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-043'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（FGAB）',
  'M2 down (FGAB)',
  '',
  '',
  43,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-043'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-043'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-02'),
  '長2度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-044'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（黒鍵）',
  'M2 down (黒鍵)',
  '',
  '',
  44,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-044'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-044'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-03'),
  '長2度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-045'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度下（CDE）',
  'M3 down (CDE)',
  '',
  '',
  45,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-045'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-045'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-04'),
  '長3度下（CDE）'
);
