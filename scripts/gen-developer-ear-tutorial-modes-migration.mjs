#!/usr/bin/env node
/**
 * developer-full-v1 更新 + アドリブ3モード単体チュートリアル + 開発者コース課題の SQL を stdout に出力。
 * Run: npx tsx scripts/gen-developer-ear-tutorial-modes-migration.mjs > supabase/migrations/20260708130000_developer_course_battle_tutorial_adlib_modes.sql
 */
import { buildEarTrainingDeveloperFullV1Script } from '../src/components/earTraining/tutorial/buildEarTrainingDeveloperFullV1Script.ts';

const NS = 'a0000000-0000-4000-8000-000000000001';

const sqlJson = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;

const buildSingleModeScript = (contentKey, sceneType, sceneExtras) => {
  const full = buildEarTrainingDeveloperFullV1Script();
  const content = full.content[contentKey];
  if (!content) {
    throw new Error(`Missing content key: ${contentKey}`);
  }
  const scene = full.scenes.find((s) => s.type === sceneType);
  if (!scene) {
    throw new Error(`Missing scene type: ${sceneType}`);
  }
  return {
    version: full.version,
    audioTracks: full.audioTracks,
    ui: full.ui,
    content: { [contentKey]: content },
    scenes: [
      {
        type: 'dialogue_only',
        lines: [
          {
            speaker: 'player',
            ja: `開発用・${sceneType} チュートリアルです。`,
            en: `Developer ${sceneType} tutorial.`,
          },
          {
            speaker: 'partner',
            ja: 'クリア必須ではない課題として試せます。',
            en: 'This task is optional (not clear-required).',
          },
        ],
        lineIntervalSeconds: 3,
      },
      { ...scene, ...sceneExtras },
      { type: 'finish' },
    ],
    finish: { showCta: true },
  };
};

const fullScript = buildEarTrainingDeveloperFullV1Script();

const singles = [
  {
    id: 'developer-tutorial-adlib-v1',
    title: 'チュートリアル・アドリブ（単体）',
    titleEn: 'Tutorial adlib (standalone)',
    contentKey: 'tutorial-adlib',
    sceneType: 'adlib',
    lsongKey: 'dev-ear-tutorial-adlib-lsong',
    lsongTitle: 'チュートリアル・アドリブ',
    lsongTitleEn: 'Tutorial adlib',
    orderKey: 1,
  },
  {
    id: 'developer-tutorial-pair-adlib-v1',
    title: 'チュートリアル・ペアアドリブ（単体）',
    titleEn: 'Tutorial phrase-pair adlib (standalone)',
    contentKey: 'tutorial-pair-adlib',
    sceneType: 'phrase_pair_adlib',
    lsongKey: 'dev-ear-tutorial-pair-adlib-lsong',
    lsongTitle: 'チュートリアル・ペアアドリブ',
    lsongTitleEn: 'Tutorial phrase-pair adlib',
    orderKey: 2,
  },
  {
    id: 'developer-tutorial-composite-v1',
    title: 'チュートリアル・複合フレーズ（単体）',
    titleEn: 'Tutorial composite phrase (standalone)',
    contentKey: 'tutorial-composite',
    sceneType: 'composite',
    lsongKey: 'dev-ear-tutorial-composite-lsong',
    lsongTitle: 'チュートリアル・複合フレーズ',
    lsongTitleEn: 'Tutorial composite phrase',
    orderKey: 3,
  },
];

const lessonId = `uuid_generate_v5('${NS}'::uuid, 'developer-ear-training-tutorial-lesson')`;

let sql = `-- developer-full-v1: アドリブ・ペアアドリブ・複合フレーズシーン追加
-- 開発者テストコース: 3モード単体チュートリアル課題（is_clear_required = false）

BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  script = ${sqlJson(fullScript)},
  title = '耳コピチュートリアル（全分岐テスト）',
  title_en = 'Ear training tutorial (full branch test)',
  updated_at = now()
WHERE id = 'developer-full-v1';

`;

for (const s of singles) {
  const script = buildSingleModeScript(s.contentKey, s.sceneType, {});
  sql += `
INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  '${s.id}',
  '${s.title}',
  '${s.titleEn}',
  ${sqlJson(script)}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();
`;
}

sql += `
INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en,
  is_clear_required
) VALUES
`;

const values = singles.map(
  (s, i) => `  (
  uuid_generate_v5('${NS}'::uuid, '${s.lsongKey}'),
  ${lessonId},
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  '${s.id}',
  '{"count": 1, "rank": "S"}'::jsonb,
  (SELECT COALESCE(MAX(order_index), 0) + ${s.orderKey} FROM public.lesson_songs WHERE lesson_id = ${lessonId}),
  '${s.lsongTitle}',
  '${s.lsongTitleEn}',
  false
)`,
);

sql += values.join(',\n');
sql += `
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

COMMIT;
`;

process.stdout.write(sql);
