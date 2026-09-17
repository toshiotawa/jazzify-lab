import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TrainingProgressionEntry } from '@/game/training/trainingTypes';
import {
  SIX_NOTE_SCALE_BGM_URL,
  SIX_NOTE_SCALE_UUID_NS,
  buildSixNoteScaleTrainingSpecs,
  type SixNoteScaleTrainingSpec,
} from '@/game/training/sixNoteScalePatterns';

const sharedConfig = {
  shuffle_units: true,
  ordered: true,
  play_root_on_first_correct: true,
};

const progressionEntryToJson = (entry: TrainingProgressionEntry): Record<string, unknown> => ({
  name: entry.name,
  voicing: [...entry.voicing],
  voicing_names: [...entry.voicingNames],
  key_fifths: entry.keyFifths,
});

const trainingSpecConfigJson = (spec: SixNoteScaleTrainingSpec): Record<string, unknown> => ({
  progression: spec.progression.map((entry) => progressionEntryToJson(entry)),
  unit_size: spec.unitSize,
  ...sharedConfig,
});

const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const sqlJson = (value: unknown): string => `${sqlString(JSON.stringify(value))}::jsonb`;

export const buildSixNoteScaleMigrationSql = (): string => {
  const specs = buildSixNoteScaleTrainingSpecs();
  const categoryId = `uuid_generate_v5('${SIX_NOTE_SCALE_UUID_NS}'::uuid, 'training-category-six_note_scale')`;
  const categoryDescriptionJa =
    '6音スケールの読み取り練習です。調号付き。最初の1音正解で元コードの低音（ルート）が鳴ります。'
    + '\nコード進行は1周で次のキーへ移ります。最低音は下加線1本までの自動配置です。';
  const categoryDescriptionEn =
    'Practice reading six-note scales with key signatures.'
    + '\nThe original chord bass sounds on your first correct note.'
    + '\nProgressions advance to the next key after one pass. Notes auto-place within one ledger line below the staff.';

  const trainingValues = specs.map((spec) => {
    const config = trainingSpecConfigJson(spec);
    return `  (
    uuid_generate_v5('${SIX_NOTE_SCALE_UUID_NS}'::uuid, 'training-${spec.slug}'),
    ${categoryId},
    ${sqlString(spec.slug)},
    ${sqlString(spec.titleJa)},
    ${sqlString(spec.titleEn)},
    ${spec.sortOrder},
    'scale',
    'instrument',
    true,
    true,
    ${sqlString(SIX_NOTE_SCALE_BGM_URL)},
    ${sqlJson(config)},
    true
  )`;
  }).join(',\n');

  const goalSpecs = [
    {
      slug: 'goal-six-note-scale-beginner',
      titleJa: '6音スケール ビギナー',
      titleEn: 'Six-Note Scales Beginner',
      sortOrder: 40,
      level: 'beginner',
      targetRank: 'D',
    },
    {
      slug: 'goal-six-note-scale-trainer',
      titleJa: '6音スケール トレーニー',
      titleEn: 'Six-Note Scales Trainee',
      sortOrder: 41,
      level: 'intermediate',
      targetRank: 'C',
    },
    {
      slug: 'goal-six-note-scale-master',
      titleJa: '6音スケール マスター',
      titleEn: 'Six-Note Scales Master',
      sortOrder: 42,
      level: 'advanced',
      targetRank: 'B',
    },
  ];

  const goalValues = goalSpecs.map((goal) => `  (
    uuid_generate_v5('${SIX_NOTE_SCALE_UUID_NS}'::uuid, 'training-goal-${goal.slug}'),
    ${sqlString(goal.slug)},
    ${sqlString(goal.titleJa)},
    ${sqlString(goal.titleEn)},
    ${sqlString(categoryDescriptionJa)},
    ${sqlString(categoryDescriptionEn)},
    ${goal.sortOrder},
    true,
    'all',
    ${sqlString(goal.level)}
  )`).join(',\n');

  const goalItemRanks = goalSpecs.map((goal) => `    ('${goal.slug}', '${goal.targetRank}')`).join(',\n');

  return `-- Training: six-note scale category
BEGIN;

INSERT INTO public.training_categories (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_free
) VALUES (
  ${categoryId},
  'six_note_scale',
  '6音スケール',
  'Six-Note Scales',
  ${sqlString(categoryDescriptionJa)},
  ${sqlString(categoryDescriptionEn)},
  16,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  updated_at = now();

INSERT INTO public.trainings (
  id, category_id, slug, title_ja, title_en, sort_order, kind,
  clef_mode, use_key_signature, play_root_on_correct, bgm_url, config, is_active
) VALUES
${trainingValues}
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  use_key_signature = EXCLUDED.use_key_signature,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.training_goal_sets (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_active,
  target_instrument, target_level
) VALUES
${goalValues}
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  target_instrument = EXCLUDED.target_instrument,
  target_level = EXCLUDED.target_level,
  updated_at = now();

INSERT INTO public.training_goal_set_items (goal_set_id, training_id, target_rank, sort_order)
SELECT
  gs.id,
  t.id,
  v.target_rank,
  t.sort_order
FROM (
  VALUES
${goalItemRanks}
) AS v(goal_slug, target_rank)
JOIN public.training_goal_sets AS gs ON gs.slug = v.goal_slug
JOIN public.trainings AS t ON t.category_id = ${categoryId}
WHERE t.is_active IS NOT FALSE
  AND COALESCE(t.lesson_only, false) IS NOT TRUE
ON CONFLICT (goal_set_id, training_id) DO UPDATE SET
  target_rank = EXCLUDED.target_rank,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order, is_active)
SELECT
  'training_six_note_scale_b_' || v.rank::text,
  'training_six_note_scale',
  v.rank,
  '6音スケール ' || v.label_ja,
  'Six-Note Scales ' || v.label_en,
  'training_category_rank',
  v.threshold,
  '6音スケールの全課題を' || v.label_ja || '以上でクリア',
  'Clear all Six-Note Scales trainings at ' || v.label_en || ' or better',
  '/achivement/achievement_monster_33.png',
  200 + 16 * 3 + v.rank,
  true
FROM (
  VALUES
    (1, 2, 'B以上', 'B+'),
    (2, 3, 'A以上', 'A+'),
    (3, 4, 'S以上', 'S+')
) AS v(rank, threshold, label_ja, label_en)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  updated_at = now();

COMMIT;
`;
};

export const writeSixNoteScaleMigrationFile = (): void => {
  writeFileSync(
    join(process.cwd(), 'supabase/migrations/20261004120000_training_six_note_scale.sql'),
    `${buildSixNoteScaleMigrationSql()}\n`,
  );
};
