import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TrainingProgressionEntry } from '@/game/training/trainingTypes';
import {
  TENSION_RESOLVE_BGM_URL,
  TENSION_RESOLVE_UUID_NS,
  buildTensionResolveTrainingSpecs,
  type TensionResolveTrainingSpec,
} from '@/game/training/tensionResolveVoicings';

const sharedConfig = {
  shuffle_units: true,
  score_per_voicing: true,
  play_root_on_first_correct: true,
};

const progressionEntryToJson = (
  entry: TrainingProgressionEntry & { voicingSlots?: readonly (readonly string[])[] },
): Record<string, unknown> => ({
  name: entry.name,
  voicing: [...entry.voicing],
  voicing_names: [...entry.voicingNames],
  ...(entry.voicingStaves != null ? { voicing_staves: [...entry.voicingStaves] } : {}),
  key_fifths: entry.keyFifths,
  ...(entry.voicingSlots != null ? { voicing_slots: entry.voicingSlots.map((slot) => [...slot]) } : {}),
});

const trainingSpecConfigJson = (spec: TensionResolveTrainingSpec): Record<string, unknown> => ({
  progression: spec.progression.map((entry) => progressionEntryToJson(
    entry as TrainingProgressionEntry & { voicingSlots?: readonly (readonly string[])[] },
  )),
  unit_size: spec.unitSize,
  ...sharedConfig,
});

const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const sqlJson = (value: unknown): string => `${sqlString(JSON.stringify(value))}::jsonb`;

export const buildTensionResolveMigrationSql = (): string => {
  const specs = buildTensionResolveTrainingSpecs();
  const categoryId = `uuid_generate_v5('${TENSION_RESOLVE_UUID_NS}'::uuid, 'training-category-tension_resolve')`;
  const categoryDescriptionJa =
    'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。'
    + '\n1ヴォイシング完成で攻撃。最初の1音正解でルート音が鳴ります。'
    + '\nIn C固定（移調楽器の影響なし）。コード進行は調号付き。';
  const categoryDescriptionEn =
    'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.'
    + '\nComplete each voicing to attack. The root sounds on your first correct note in each voicing.'
    + '\nConcert pitch (In C). Progressions use key signatures.';

  const trainingValues = specs.map((spec) => {
    const config = trainingSpecConfigJson(spec);
    return `  (
    uuid_generate_v5('${TENSION_RESOLVE_UUID_NS}'::uuid, 'training-${spec.slug}'),
    ${categoryId},
    ${sqlString(spec.slug)},
    ${sqlString(spec.titleJa)},
    ${sqlString(spec.titleEn)},
    ${spec.sortOrder},
    'progression',
    'grand_concert',
    ${spec.useKeySignature},
    true,
    ${sqlString(TENSION_RESOLVE_BGM_URL)},
    ${sqlJson(config)},
    true
  )`;
  }).join(',\n');

  const goalSpecs = [
    { slug: 'goal-tension-resolve-beginner', titleJa: 'テンションリゾルブ ビギナー', titleEn: 'Tension Resolve Beginner', sortOrder: 37, level: 'beginner' },
    { slug: 'goal-tension-resolve-trainer', titleJa: 'テンションリゾルブ トレーナー', titleEn: 'Tension Resolve Trainer', sortOrder: 38, level: 'intermediate' },
    { slug: 'goal-tension-resolve-master', titleJa: 'テンションリゾルブ マスター', titleEn: 'Tension Resolve Master', sortOrder: 39, level: 'advanced' },
  ];

  const goalValues = goalSpecs.map((goal) => `  (
    uuid_generate_v5('${TENSION_RESOLVE_UUID_NS}'::uuid, 'training-goal-${goal.slug}'),
    ${sqlString(goal.slug)},
    ${sqlString(goal.titleJa)},
    ${sqlString(goal.titleEn)},
    ${sqlString(categoryDescriptionJa)},
    ${sqlString(categoryDescriptionEn)},
    ${goal.sortOrder},
    true,
    'piano',
    ${sqlString(goal.level)}
  )`).join(',\n');

  return `-- Training: tension resolve voicings
BEGIN;

INSERT INTO public.training_categories (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_free
) VALUES (
  ${categoryId},
  'tension_resolve',
  'テンションリゾルブ',
  'Tension Resolve',
  ${sqlString(categoryDescriptionJa)},
  ${sqlString(categoryDescriptionEn)},
  15,
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
    ('goal-tension-resolve-beginner', 'C'),
    ('goal-tension-resolve-trainer', 'B'),
    ('goal-tension-resolve-master', 'A')
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
  'training_tension_resolve_b_' || v.rank::text,
  'training_tension_resolve',
  v.rank,
  'テンションリゾルブ ' || v.label_ja,
  'Tension Resolve ' || v.label_en,
  'training_category_rank',
  v.threshold,
  'テンションリゾルブの全課題を' || v.label_ja || '以上でクリア',
  'Clear all Tension Resolve trainings at ' || v.label_en || ' or better',
  '/achivement/achievement_monster_33.png',
  200 + 15 * 3 + v.rank,
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

export const writeTensionResolveMigrationFile = (): void => {
  writeFileSync(
    join(process.cwd(), 'supabase/migrations/20261002120000_training_tension_resolve.sql'),
    `${buildTensionResolveMigrationSql()}\n`,
  );
};
