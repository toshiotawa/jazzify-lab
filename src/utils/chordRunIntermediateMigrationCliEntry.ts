import {
  CHORD_RUN_INTERMEDIATE_BGM_OVERRIDE,
  CHORD_RUN_INTERMEDIATE_QUESTS,
  buildChordRunIntermediateDbProgression,
  resolveChordRunIntermediateRunMapId,
} from './chordRunIntermediateProgressions';

const NS = 'a0000000-0000-4000-8000-000000000001';

const escapeSqlString = (value: string): string => value.replace(/'/g, "''");

const sqlJson = (value: unknown): string => `'${escapeSqlString(JSON.stringify(value))}'::jsonb`;

const stageRows = CHORD_RUN_INTERMEDIATE_QUESTS.map((quest) => {
  const progression = buildChordRunIntermediateDbProgression(quest.chordNames);
  const runMapId = resolveChordRunIntermediateRunMapId(quest.stageNumber);
  return `    ('basic', ${quest.stageNumber}, 'progression', 'code_run', 'コードラン: ${escapeSqlString(quest.titleJa)}', 'Chord Run: ${escapeSqlString(quest.titleEn)}', 'normal', '', '${escapeSqlString(quest.blockName)}', '${escapeSqlString(quest.blockNameEn)}', NULL, '', '', '${quest.blockKey}', ${sqlJson(progression)}, '${runMapId}')`;
});

const lessonRows = CHORD_RUN_INTERMEDIATE_QUESTS.map((quest) =>
  `    ('${quest.lessonKey}', ${quest.orderIndex}, ${quest.blockNumber}, '${escapeSqlString(quest.blockName)}', '${escapeSqlString(quest.blockNameEn)}', 'Chord Run: ${escapeSqlString(quest.titleJa)}', 'Chord Run: ${escapeSqlString(quest.titleEn)}', ${quest.stageNumber})`,
);

const lessonSongRows = CHORD_RUN_INTERMEDIATE_QUESTS.map((quest) =>
  `    ('${quest.lessonKey}', 'Chord Run: ${escapeSqlString(quest.titleJa)}', 'Chord Run: ${escapeSqlString(quest.titleEn)}', ${quest.stageNumber})`,
);

const sql = `-- 目的別コース: 横スクロールコードラン:中級（Chord Run: Intermediate）
-- 4ブロック × progression 型 Code Run、36 クエスト（stage 140〜175）
-- ヴォイシング: survivalProgressionVoicings ヘルパー（自動生成）
BEGIN;

INSERT INTO public.courses (
  id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  audience,
  is_tutorial,
  is_visible,
  difficulty_tier,
  is_developer_only,
  is_main_course
)
SELECT
  uuid_generate_v5('${NS}'::uuid, 'course-chord-run-intermediate'),
  '横スクロールコードラン:中級',
  'Chord Run: Intermediate',
  '横スクロールアクションでジャズのヴォイシングを学習しましょう。',
  'Learn jazz voicings through side-scrolling action.',
  true,
  0,
  'both',
  false,
  true,
  'intermediate',
  false,
  false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only,
  audience = EXCLUDED.audience,
  is_visible = EXCLUDED.is_visible,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_developer_only = EXCLUDED.is_developer_only,
  is_main_course = EXCLUDED.is_main_course,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category,
  stage_number,
  stage_type,
  play_mode,
  name,
  name_en,
  difficulty,
  chord_suffix,
  chord_display_name,
  chord_display_name_en,
  root_pattern,
  root_pattern_name,
  root_pattern_name_en,
  block_key,
  is_mixed_stage,
  mixed_group_key,
  chord_progression,
  lesson_only,
  run_map_id,
  run_time_limit_sec,
  run_dialogue_script,
  production_staff_hint_mode,
  production_keyboard_hint_mode
)
SELECT
  v.map_category,
  v.stage_number,
  v.stage_type,
  v.play_mode,
  v.name,
  v.name_en,
  v.difficulty,
  v.chord_suffix,
  v.chord_display_name,
  v.chord_display_name_en,
  v.root_pattern,
  v.root_pattern_name,
  v.root_pattern_name_en,
  v.block_key,
  false,
  NULL,
  v.chord_progression,
  true,
  v.run_map_id,
  110,
  NULL,
  'fade_15s',
  'fade_15s'
FROM (
  VALUES
${stageRows.join(',\n')}
) AS v(
  map_category,
  stage_number,
  stage_type,
  play_mode,
  name,
  name_en,
  difficulty,
  chord_suffix,
  chord_display_name,
  chord_display_name_en,
  root_pattern,
  root_pattern_name,
  root_pattern_name_en,
  block_key,
  chord_progression,
  run_map_id
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description,
  assignment_description_en
)
SELECT
  uuid_generate_v5('${NS}'::uuid, 'cri-lesson-' || v.lesson_key),
  uuid_generate_v5('${NS}'::uuid, 'course-chord-run-intermediate'),
  v.title,
  v.title_en,
  '',
  '',
  true,
  v.order_index,
  v.block_number,
  v.block_name,
  v.block_name_en,
  '[]'::jsonb,
  '制限時間以内にゴールしてください。コード完成でジャンプします。',
  'Reach the goal before the time limit. Complete each chord to jump.'
FROM (
  VALUES
${lessonRows.join(',\n')}
) AS v(lesson_key, order_index, block_number, block_name, block_name_en, title, title_en, stage_number)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  order_index,
  clear_conditions,
  is_fantasy,
  fantasy_stage_id,
  is_survival,
  survival_stage_number,
  survival_map_category,
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en,
  survival_lesson_overrides
)
SELECT
  uuid_generate_v5('${NS}'::uuid, 'cri-lsong-' || v.lesson_key),
  uuid_generate_v5('${NS}'::uuid, 'cri-lesson-' || v.lesson_key),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  true,
  v.stage_number,
  'basic',
  false,
  NULL,
  v.title,
  v.title_en,
  ${sqlJson(CHORD_RUN_INTERMEDIATE_BGM_OVERRIDE)}
FROM (
  VALUES
${lessonSongRows.join(',\n')}
) AS v(lesson_key, title, title_en, stage_number)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides;

COMMIT;
`;

process.stdout.write(sql);
