INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-092'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（全ルート）その1',
  'Dominant 7th (全ルート) · Part 1',
  '',
  '',
  92,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-092'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-092'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-07'),
  'ドミナントセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-093'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（全ルート）その2',
  'Dominant 7th (全ルート) · Part 2',
  '',
  '',
  93,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-093'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-093'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-08'),
  'ドミナントセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-094'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（CDE）その1',
  'Half-diminished (CDE) · Part 1',
  '',
  '',
  94,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-094'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-094'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-01'),
  'ハーフディミニッシュ（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-095'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（CDE）その2',
  'Half-diminished (CDE) · Part 2',
  '',
  '',
  95,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-095'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-095'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-02'),
  'ハーフディミニッシュ（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-096'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（FGAB）その1',
  'Half-diminished (FGAB) · Part 1',
  '',
  '',
  96,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-096'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-096'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-03'),
  'ハーフディミニッシュ（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-097'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（FGAB）その2',
  'Half-diminished (FGAB) · Part 2',
  '',
  '',
  97,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-097'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-097'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-04'),
  'ハーフディミニッシュ（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-098'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その1',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  98,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-098'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-098'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-05'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-099'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その2',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  99,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-099'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-099'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-06'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-100'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（全ルート）その1',
  'Half-diminished (全ルート) · Part 1',
  '',
  '',
  100,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-100'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-100'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-07'),
  'ハーフディミニッシュ（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-101'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（全ルート）その2',
  'Half-diminished (全ルート) · Part 2',
  '',
  '',
  101,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-101'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-101'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-08'),
  'ハーフディミニッシュ（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-102'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（CDE）・シングル',
  'Four-part basics (CDE) · Single',
  '',
  '',
  102,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-102'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-102'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-01'),
  '基本4和音まとめ（CDE）・シングル'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-103'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（CDE）その2',
  'Four-part basics (CDE) · Part 2',
  '',
  '',
  103,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);
