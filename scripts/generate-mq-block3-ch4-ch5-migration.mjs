/**
 * メインクエスト Ch4（左手コンピング）+ Ch5（Jazzify Blues）のマイグレーション SQL を生成する。
 *
 * Usage:
 *   node scripts/generate-mq-block3-ch4-ch5-migration.mjs
 *
 * 事前:
 *   node scripts/prepare-mq-b3-b4-assets.mjs
 *   node scripts/upload-sozai-main-quest-block3-r2.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'supabase', 'migrations', '20260729233000_mq_block3_ch4_ch5.sql');

const NS = 'a0000000-0000-4000-8000-000000000003';
const MAIN_COURSE_ID = 'a0000000-0000-0000-0000-000000000001';
const CDN = 'https://jazzify-cdn.com/sozai';
const ASSET_V = '202607292330';
const DRUM = `${CDN}/Cblues_24bars_100BPM_Drum.mp3`;

const BPM = 100;
const BEATS = 4;
const MEASURE_SEC = (60 / BPM) * BEATS;

const uuid = (key) => `uuid_generate_v5('${NS}'::uuid, '${key}')`;
const sqlJson = (obj) => JSON.stringify(obj).replace(/'/g, "''");
const asset = (name) => `${CDN}/${name}?v=${ASSET_V}`;

/** @param {number} n */
const combatFromTargets = (n) => {
  const miss = Math.max(1, Math.round(100 / (0.3 * n)));
  return {
    player_hp: 100,
    enemy_hp: n,
    per_correct_note_damage: 1,
    good_completion_damage: 0,
    great_completion_damage: 0,
    perfect_completion_damage: 0,
    miss_damage: miss,
    fail_damage: Math.max(miss + 1, Math.round(miss * 1.5)),
    max_loops_per_phrase: 2,
  };
};

const earTutorialUi = {
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideLobby: true,
  hideMidiToggle: true,
  hidePhraseIntroQuota: true,
  showExitButton: true,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: true,
};

const survivalTutorialUi = {
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideMidiToggle: true,
  showExitButton: true,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: true,
};

/** @type {readonly {
 *   key: string;
 *   slug: string;
 *   title: string;
 *   titleEn: string;
 *   description: string;
 *   descriptionEn: string;
 *   mode: 'chord_osmd' | 'chord_precision';
 *   base: string;
 *   xmlSuffix: 'guide-voice4-cue' | 'precision' | null;
 *   mp3Base: string;
 *   measures: number;
 *   targets: number;
 *   loopSec?: number;
 * }[]} */
const STAGES = [
  // Ch4 Q1
  { key: 'mq-b3-4-1-2', slug: 'mq-b3-4-1-2-osmd', title: 'パターン1（1頭3ウラ）', titleEn: 'Pattern 1 (beat 1 + and-of-3)', description: '左手コンピング：1頭と3ウラ。', descriptionEn: 'LH comping: beat 1 and the and-of-3.', mode: 'chord_osmd', base: 'mq-b3-4-1-2', xmlSuffix: null, mp3Base: 'mq-b3-4-1-2', measures: 25, targets: 96 },
  { key: 'mq-b3-4-1-3', slug: 'mq-b3-4-1-3-osmd', title: 'パターン2（1ウラ3ウラ）', titleEn: 'Pattern 2 (and-of-1 + and-of-3)', description: '左手コンピング：1ウラと3ウラ。', descriptionEn: 'LH comping: and-of-1 and and-of-3.', mode: 'chord_osmd', base: 'mq-b3-4-1-3', xmlSuffix: null, mp3Base: 'mq-b3-4-1-3', measures: 25, targets: 96 },
  { key: 'mq-b3-4-1-4', slug: 'mq-b3-4-1-4-osmd', title: 'パターン3（4ウラ2ウラ）', titleEn: 'Pattern 3 (and-of-4 + and-of-2)', description: '左手コンピング：4ウラと2ウラ。', descriptionEn: 'LH comping: and-of-4 and and-of-2.', mode: 'chord_osmd', base: 'mq-b3-4-1-4', xmlSuffix: null, mp3Base: 'mq-b3-4-1-4', measures: 26, targets: 98 },
  // Ch4 Q2
  { key: 'mq-b3-4-2-2', slug: 'mq-b3-4-2-2-osmd', title: '両手パターン1（1頭のみ）', titleEn: 'Two-hand pattern 1 (beat 1 only)', description: '右手と一緒に。コールアンドレスポンス（クリア必須ではない）。', descriptionEn: 'With RH. Call-and-response (optional clear).', mode: 'chord_osmd', base: 'mq-b3-4-2-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b3-4-2-2', measures: 25, targets: 92 },
  { key: 'mq-b3-4-2-2-prec', slug: 'mq-b3-4-2-2-precision', title: '両手パターン1・精密', titleEn: 'Two-hand pattern 1 · Precision', description: '精密モード（Voice4 cue は非ターゲット）。クリア必須ではない。', descriptionEn: 'Precision mode (Voice4 cue is non-target). Optional clear.', mode: 'chord_precision', base: 'mq-b3-4-2-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b3-4-2-2', measures: 25, targets: 92 },
  { key: 'mq-b3-4-2-4', slug: 'mq-b3-4-2-4-osmd', title: '両手パターン2（1頭3ウラ）', titleEn: 'Two-hand pattern 2 (beat 1 + and-of-3)', description: '右手と一緒に。コールアンドレスポンス（クリア必須ではない）。', descriptionEn: 'With RH. Call-and-response (optional clear).', mode: 'chord_osmd', base: 'mq-b3-4-2-4', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b3-4-2-4', measures: 25, targets: 132 },
  { key: 'mq-b3-4-2-4-prec', slug: 'mq-b3-4-2-4-precision', title: '両手パターン2・精密', titleEn: 'Two-hand pattern 2 · Precision', description: '精密モード（Voice4 cue は非ターゲット）。クリア必須ではない。', descriptionEn: 'Precision mode (Voice4 cue is non-target). Optional clear.', mode: 'chord_precision', base: 'mq-b3-4-2-4', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b3-4-2-4', measures: 25, targets: 132 },
  // Ch5 Q2/Q3 production (Q1 is tutorial-only)
  { key: 'mq-b4-5-2-2', slug: 'mq-b4-5-2-2-osmd', title: 'テーマ＋左手（1頭のみ）', titleEn: 'Theme + LH (beat 1 only)', description: 'テーマを弾きながら左手（クリア必須ではない）。', descriptionEn: 'Play the theme with LH (optional clear).', mode: 'chord_osmd', base: 'mq-b4-5-2-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b4-5-2-2', measures: 25, targets: 140 },
  { key: 'mq-b4-5-2-3', slug: 'mq-b4-5-2-3-precision', title: 'テーマ＋左手（1頭）・精密', titleEn: 'Theme + LH (beat 1) · Precision', description: '5-2-2 の精密モード。クリア必須ではない。', descriptionEn: 'Precision version of 5-2-2. Optional clear.', mode: 'chord_precision', base: 'mq-b4-5-2-2', xmlSuffix: 'precision', mp3Base: 'mq-b4-5-2-2', measures: 25, targets: 140 },
  { key: 'mq-b4-5-2-4', slug: 'mq-b4-5-2-4-osmd', title: 'テーマ＋左手（1頭3ウラ）', titleEn: 'Theme + LH (beat 1 + and-of-3)', description: 'テーマを弾きながら左手（クリア必須ではない）。', descriptionEn: 'Play the theme with LH (optional clear).', mode: 'chord_osmd', base: 'mq-b4-5-2-4', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b4-5-2-4', measures: 25, targets: 180 },
  { key: 'mq-b4-5-2-5', slug: 'mq-b4-5-2-5-precision', title: 'テーマ＋左手（1頭3ウラ）・精密', titleEn: 'Theme + LH (1+and-of-3) · Precision', description: '5-2-4 の精密モード。クリア必須ではない。', descriptionEn: 'Precision version of 5-2-4. Optional clear.', mode: 'chord_precision', base: 'mq-b4-5-2-4', xmlSuffix: 'precision', mp3Base: 'mq-b4-5-2-4', measures: 25, targets: 180 },
  { key: 'mq-b4-5-3-2', slug: 'mq-b4-5-3-2-osmd', title: 'まとめ・片手', titleEn: 'Summary · One hand', description: 'テーマ→アドリブ→テーマ。右手だけで通す。', descriptionEn: 'Theme–ad-lib–theme. One hand through.', mode: 'chord_osmd', base: 'mq-b4-5-3-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b4-5-3-2', measures: 37, targets: 124 },
  { key: 'mq-b4-5-3-3', slug: 'mq-b4-5-3-3-osmd', title: 'まとめ・両手', titleEn: 'Summary · Two hands', description: '両手で通す（クリア必須ではない）。', descriptionEn: 'Two hands through (optional clear).', mode: 'chord_osmd', base: 'mq-b4-5-3-3', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b4-5-3-3', measures: 37, targets: 260 },
  { key: 'mq-b4-5-3-3-prec', slug: 'mq-b4-5-3-3-precision', title: 'まとめ・両手・精密', titleEn: 'Summary · Two hands · Precision', description: '両手の精密モード（クリア必須ではない）。', descriptionEn: 'Two-hand precision (optional clear).', mode: 'chord_precision', base: 'mq-b4-5-3-3', xmlSuffix: 'precision', mp3Base: 'mq-b4-5-3-3', measures: 37, targets: 260 },
];

/** @param {(typeof STAGES)[number]} s */
function buildStageSql(s) {
  const loopSec = Number((s.measures * MEASURE_SEC).toFixed(3));
  const combat = s.mode === 'chord_precision'
    ? {
        player_hp: 100,
        enemy_hp: 1,
        per_correct_note_damage: 0,
        good_completion_damage: 0,
        great_completion_damage: 0,
        perfect_completion_damage: 0,
        miss_damage: 0,
        fail_damage: 0,
        max_loops_per_phrase: 2,
      }
    : combatFromTargets(s.targets);
  const xmlUrl = s.xmlSuffix
    ? asset(`${s.base}-${s.xmlSuffix}.musicxml`)
    : asset(`${s.base}.musicxml`);
  const audioUrl = asset(`${s.mp3Base}.mp3`);

  return `
DELETE FROM public.ear_training_phrases WHERE stage_id = ${uuid(`${s.key}-stage`)};
DELETE FROM public.ear_training_stages WHERE id = ${uuid(`${s.key}-stage`)};

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing
) VALUES (
  ${uuid(`${s.key}-stage`)},
  '${s.slug}',
  '${s.title.replace(/'/g, "''")}',
  '${s.titleEn.replace(/'/g, "''")}',
  '${s.description.replace(/'/g, "''")}',
  '${s.descriptionEn.replace(/'/g, "''")}',
  ${BPM}, 0, ${BEATS}, 4, ${s.measures}, ${combat.max_loops_per_phrase},
  0, 600, ${combat.player_hp}, ${combat.enemy_hp},
  ${combat.per_correct_note_damage}, ${combat.good_completion_damage}, ${combat.great_completion_damage}, ${combat.perfect_completion_damage},
  ${combat.miss_damage}, ${combat.fail_damage}, 4, 8,
  'blue_club', true, false, '${s.mode}',
  ${s.mode === 'chord_precision' ? 'false' : 'true'}, true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  ${uuid(`${s.key}-phrase`)},
  ${uuid(`${s.key}-stage`)},
  0,
  '${s.title.replace(/'/g, "''")}',
  '${s.titleEn.replace(/'/g, "''")}',
  '${xmlUrl}',
  '${audioUrl}',
  ${loopSec},
  ${loopSec},
  0,
  0
);`;
}

function insertEarTutorial(id, title, titleEn, script) {
  return `
INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  '${id}',
  '${title.replace(/'/g, "''")}',
  '${titleEn.replace(/'/g, "''")}',
  '${sqlJson(script)}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();`;
}

function insertSurvivalTutorial(id, title, titleEn, script) {
  return `
INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  '${id}',
  '${title.replace(/'/g, "''")}',
  '${titleEn.replace(/'/g, "''")}',
  '${sqlJson(script)}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();`;
}

const ch4Q1Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'ここからは左手のコンピングじゃ。リズムでコードを支える力を鍛えるぞ。', en: 'From here we build LH comping — the rhythm that holds the harmony.' },
        { speaker: 'fai', ja: '右手だけじゃなくて、左手のパターンを覚えるんだね。', en: 'So I learn left-hand patterns, not just the right hand.' },
        { speaker: 'jajii', ja: '今日は3つ。まず「1頭と3ウラ」。次に「1ウラと3ウラ」。最後は「4ウラと2ウラ」じゃ。', en: 'Three patterns today: beat 1 + and-of-3, then and-of-1 + and-of-3, then and-of-4 + and-of-2.' },
        { speaker: 'fai', ja: 'コードも少し変わるって聞いたよ。', en: 'I heard the chords shift a little too.' },
        { speaker: 'jajii', ja: 'うむ。形は同じでも、響きが変わると左手の仕事が生きてくる。まずは1つずつ体に入れよう。', en: 'Aye. Same shapes, new colors — that is when the left hand starts to speak. One pattern at a time.' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch4Q2Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: '左手が少し動けるようになったのう。次は右手のパターンと一緒に弾いてみるぞ。', en: 'Your left hand is waking up. Next, play it with a right-hand pattern.' },
        { speaker: 'fai', ja: '両手…難しそう。', en: 'Both hands… that sounds hard.' },
        { speaker: 'jajii', ja: 'コールアンドレスポンスじゃ。聴いて、返して。完璧じゃなくても大丈夫。', en: 'It is call and response — listen, then answer. It does not have to be perfect.' },
        { speaker: 'jajii', ja: 'このクエストの演奏課題はクリア必須ではない。ある程度練習したら、難しかったら先に進んでよいぞ。', en: 'These performance tasks are optional. Practice a bit, and if it feels too hard, move on.' },
        { speaker: 'fai', ja: 'じゃあ、まずは様子を見ながらやってみる！', en: 'Okay — I will try, and see how it feels!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch5Q1Tutorial = {
  version: 1,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: earTutorialUi,
  content: {
    'mq-b4-5-1-1-osmd': {
      stage: {
        slug: 'mq-b4-5-1-1-osmd',
        title: 'Jazzify Blues テーマ（右手）',
        title_en: 'Jazzify Blues theme (RH)',
        bpm: BPM,
        key_fifths: 0,
        beats_per_measure: BEATS,
        beat_type: 4,
        loop_measures: 25,
        max_loops_per_phrase: 2,
        count_in_beats: 0,
        time_limit_sec: 600,
        player_hp: 100,
        enemy_hp: 10000,
        per_correct_note_damage: 10,
        good_completion_damage: 30,
        miss_damage: 0,
        fail_damage: 0,
        background_theme: 'blue_club',
        mode: 'chord_osmd',
        show_keyboard_hints_in_battle: true,
        osmd_targets_from_score: true,
        is_swing: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'Jazzify Blues テーマ',
          title_en: 'Jazzify Blues theme',
          music_xml_url: asset('mq-b4-5-1-1-guide-voice4-cue.musicxml'),
          audio_url: asset('mq-b4-5-1-1.mp3'),
          loop_duration_sec: 25 * MEASURE_SEC,
          audio_duration_sec: 25 * MEASURE_SEC,
          note_count: 0,
          key_fifths: 0,
        },
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'ここからは Jazzify Blues じゃ。お前のテーマを、右手だけで確かめるぞ。', en: 'Now comes Jazzify Blues. We check your theme with the right hand alone.' },
        { speaker: 'player', ja: 'テーマ…曲の顔みたいなメロディだよね。', en: 'The theme — like the face of the tune.' },
        { speaker: 'partner', ja: 'そうじゃ。まずは譜面どおりに、右手でメロディを通してみるのじゃ。', en: 'Aye. First, walk the melody from the score with your right hand.' },
        { speaker: 'player', ja: 'よし、テーマ練習いってみよう！', en: 'Alright — theme practice, here I go!' },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: 'mq-b4-5-1-1-osmd',
      requiredLoops: 1,
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'よいぞ。テーマが口をついて出るようになれば、次は左手も足せる。', en: 'Good. Once the theme is on your tongue, we can add the left hand.' },
        { speaker: 'player', ja: '次は両手だね。楽しみ！', en: 'Next is both hands. I am ready!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch5Q2Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'テーマが右手で弾けるようになった。次はテーマを弾きながら、左手も入れるぞ。', en: 'You can play the theme in the right hand. Next, keep the theme and add the left hand.' },
        { speaker: 'fai', ja: '左手のパターン、前の章でやったやつ？', en: 'The left-hand patterns from the last chapter?' },
        { speaker: 'jajii', ja: 'うむ。まずは「1頭のみ」、次に「1頭と3ウラ」。難しかったら飛ばしてよい、おまけ課題じゃ。', en: 'Aye. First beat-1 only, then beat 1 + and-of-3. Skip if needed — these are optional.' },
        { speaker: 'fai', ja: 'テーマを守りながら左手…やってみる！', en: 'Hold the theme, add the left hand… I will try!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch5Q3IntroDialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'まとめじゃ。Jazzify Blues は「テーマ → アドリブ → テーマ」で一曲になる。', en: 'Summary time. Jazzify Blues becomes one tune: theme, then ad-lib, then theme.' },
        { speaker: 'fai', ja: '最初と最後がテーマで、真ん中が自由なんだね。', en: 'Theme at the start and end, freedom in the middle.' },
        { speaker: 'jajii', ja: 'そうじゃ。まずは片手で通す。余裕があれば両手、さらに精密にも挑戦してみるのじゃ。', en: 'Aye. First one hand. If you have room, try two hands — and precision after that.' },
        { speaker: 'fai', ja: '通しで弾くの、ちょっと緊張する…でもいこう！', en: 'Playing it through is a little scary… but let us go!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch5Q3OutroDialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'ようやった。Cブルースの土台と、Jazzify Blues のテーマが体に入ってきたのう。', en: 'Well done. The C blues foundation and the Jazzify Blues theme are settling in.' },
        { speaker: 'fai', ja: '左手のリズムも、少しずつ馴染んできた気がする。', en: 'The left-hand rhythms are starting to feel familiar too.' },
        { speaker: 'jajii', ja: '次のチャプターは Fブルースへの挑戦じゃ。キーが変わると景色も変わる。楽しみにしておれ。', en: 'Next chapter: take on the F blues. A new key, a new landscape. Look forward to it.' },
        { speaker: 'fai', ja: 'Fブルース…いってみよう！', en: 'F blues… I am in!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

/** @param {string} lessonKey @param {number} order @param {object} row */
function lessonSongRow(lessonKey, order, row) {
  const clearReq = row.clearRequired !== false;
  return `  (
    ${uuid(row.id)}, ${uuid(lessonKey)}, NULL, ${order},
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    ${row.earStage ? `true, ${uuid(`${row.earStage}-stage`)}` : 'false, NULL'},
    ${row.earTutorial ? `true, '${row.earTutorial}'` : 'false, NULL'},
    ${row.survivalTutorial ? `true, '${row.survivalTutorial}'` : 'false, NULL'},
    false, NULL, NULL, NULL, NULL, NULL,
    '${row.title.replace(/'/g, "''")}', '${row.titleEn.replace(/'/g, "''")}',
    ${clearReq}
  )`;
}

const sql = `-- メインクエスト Ch4（左手コンピング）+ Ch5（Jazzify Blues）
-- 生成: node scripts/generate-mq-block3-ch4-ch5-migration.mjs
-- 事前: node scripts/prepare-mq-b3-b4-assets.mjs && node scripts/upload-sozai-main-quest-block3-r2.mjs
-- 注意: mq-b3-4-2-4.mp3 が 4-1-4 と同一だった場合は音源差し替え後に再アップロードすること
BEGIN;

${insertSurvivalTutorial('mq-b3-q1-dialogue-v1', 'MQ Ch4 Q1: 左手パターン紹介', 'MQ Ch4 Q1: LH pattern intro', ch4Q1Dialogue)}
${insertSurvivalTutorial('mq-b3-q2-dialogue-v1', 'MQ Ch4 Q2: 両手導入', 'MQ Ch4 Q2: Two-hand intro', ch4Q2Dialogue)}
${insertEarTutorial('mq-b4-q1-osmd-v1', 'MQ Ch5 Q1: Jazzify Blues テーマ', 'MQ Ch5 Q1: Jazzify Blues theme', ch5Q1Tutorial)}
${insertSurvivalTutorial('mq-b4-q2-dialogue-v1', 'MQ Ch5 Q2: テーマ＋左手', 'MQ Ch5 Q2: Theme + LH', ch5Q2Dialogue)}
${insertSurvivalTutorial('mq-b4-q3-intro-v1', 'MQ Ch5 Q3: まとめ導入', 'MQ Ch5 Q3: Summary intro', ch5Q3IntroDialogue)}
${insertSurvivalTutorial('mq-b4-q3-outro-v1', 'MQ Ch5 Q3: Fブルース展望', 'MQ Ch5 Q3: F blues outlook', ch5Q3OutroDialogue)}

${STAGES.map(buildStageSql).join('\n')}

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
  (
    ${uuid('mq-b3-q1-lesson')}, '${MAIN_COURSE_ID}'::uuid,
    'クエスト1：左手のパターン', 'Quest 1: Left-hand patterns',
    '左手コンピングの3リズムを覚える。', 'Learn three LH comping rhythms.',
    false, 0, 4,
    'Cブルース 左手コンピングのリズム', 'C Blues: LH Comping Rhythms',
    '左手でコードを支えるリズムを身につける。', 'Build rhythms that support the chords with the left hand.',
    '[]'::jsonb,
    '3つの左手パターンを練習しましょう。', 'Practice the three left-hand patterns.',
    false
  ),
  (
    ${uuid('mq-b3-q2-lesson')}, '${MAIN_COURSE_ID}'::uuid,
    'クエスト2：右手パターンと一緒に演奏', 'Quest 2: Play with a right-hand pattern',
    '左手と右手を合わせてコールアンドレスポンス。クリア必須ではない。', 'Combine hands in call-and-response. Clearing is optional.',
    false, 1, 4,
    'Cブルース 左手コンピングのリズム', 'C Blues: LH Comping Rhythms',
    '左手でコードを支えるリズムを身につける。', 'Build rhythms that support the chords with the left hand.',
    '[]'::jsonb,
    '両手の練習はおまけ課題です。難しかったら先へ進んでよいです。', 'Two-hand practice is optional. Move on if it is too hard.',
    false
  ),
  (
    ${uuid('mq-b4-q1-lesson')}, '${MAIN_COURSE_ID}'::uuid,
    'クエスト1：テーマを右手だけで練習', 'Quest 1: Practice the theme with RH only',
    'Jazzify Blues のテーマを右手で通す。', 'Play the Jazzify Blues theme with the right hand.',
    false, 0, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    'テーマを右手だけで練習しましょう。', 'Practice the theme with the right hand only.',
    false
  ),
  (
    ${uuid('mq-b4-q2-lesson')}, '${MAIN_COURSE_ID}'::uuid,
    'クエスト2：テーマを弾きながら左手も入れる', 'Quest 2: Theme with left hand',
    'テーマに左手パターンを重ねる。クリア必須ではない。', 'Layer LH patterns under the theme. Clearing is optional.',
    false, 1, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    '両手課題はおまけです。', 'Two-hand tasks are optional.',
    false
  ),
  (
    ${uuid('mq-b4-q3-lesson')}, '${MAIN_COURSE_ID}'::uuid,
    'クエスト3：まとめ', 'Quest 3: Summary',
    'テーマ→アドリブ→テーマで通す。両手はおまけ。', 'Play theme–ad-lib–theme. Two hands are optional.',
    false, 2, 5,
    'Jazzify Blues', 'Jazzify Blues',
    'テーマと左手コンピングを組み合わせて一曲にする。', 'Combine theme and LH comping into one tune.',
    '[]'::jsonb,
    '片手で通し、余裕があれば両手・精密へ。', 'Clear one-hand; try two hands and precision if ready.',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  manual_completion_disabled = EXCLUDED.manual_completion_disabled,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id,
  is_ear_training_tutorial, ear_training_tutorial_script_id,
  is_survival_tutorial, survival_tutorial_script_id,
  is_balloon_rush, balloon_rush_stage_id,
  survival_lesson_overrides, survival_random_chords,
  override_production_staff_hint_mode, override_production_keyboard_hint_mode,
  title, title_en, is_clear_required
) VALUES
${[
  lessonSongRow('mq-b3-q1-lesson', 0, { id: 'mq-b3-q1-0-lsong', survivalTutorial: 'mq-b3-q1-dialogue-v1', title: '1-0. 左手パターンの紹介', titleEn: '1-0. LH pattern intro' }),
  lessonSongRow('mq-b3-q1-lesson', 1, { id: 'mq-b3-q1-1-lsong', earStage: 'mq-b3-4-1-2', title: '1-1. パターン1（1頭3ウラ）', titleEn: '1-1. Pattern 1 (1 + and-of-3)' }),
  lessonSongRow('mq-b3-q1-lesson', 2, { id: 'mq-b3-q1-2-lsong', earStage: 'mq-b3-4-1-3', title: '1-2. パターン2（1ウラ3ウラ）', titleEn: '1-2. Pattern 2 (and-of-1 + and-of-3)' }),
  lessonSongRow('mq-b3-q1-lesson', 3, { id: 'mq-b3-q1-3-lsong', earStage: 'mq-b3-4-1-4', title: '1-3. パターン3（4ウラ2ウラ）', titleEn: '1-3. Pattern 3 (and-of-4 + and-of-2)' }),
  lessonSongRow('mq-b3-q2-lesson', 0, { id: 'mq-b3-q2-0-lsong', survivalTutorial: 'mq-b3-q2-dialogue-v1', title: '2-0. 右手と一緒に弾く準備', titleEn: '2-0. Prep for RH + LH' }),
  lessonSongRow('mq-b3-q2-lesson', 1, { id: 'mq-b3-q2-1-lsong', earStage: 'mq-b3-4-2-2', title: '2-1. 両手パターン1（1頭のみ）', titleEn: '2-1. Two-hand pattern 1', clearRequired: false }),
  lessonSongRow('mq-b3-q2-lesson', 2, { id: 'mq-b3-q2-2-lsong', earStage: 'mq-b3-4-2-2-prec', title: '2-2. 両手パターン1・精密', titleEn: '2-2. Two-hand pattern 1 · Precision', clearRequired: false }),
  lessonSongRow('mq-b3-q2-lesson', 3, { id: 'mq-b3-q2-3-lsong', earStage: 'mq-b3-4-2-4', title: '2-3. 両手パターン2（1頭3ウラ）', titleEn: '2-3. Two-hand pattern 2', clearRequired: false }),
  lessonSongRow('mq-b3-q2-lesson', 4, { id: 'mq-b3-q2-4-lsong', earStage: 'mq-b3-4-2-4-prec', title: '2-4. 両手パターン2・精密', titleEn: '2-4. Two-hand pattern 2 · Precision', clearRequired: false }),
  lessonSongRow('mq-b4-q1-lesson', 0, { id: 'mq-b4-q1-0-lsong', earTutorial: 'mq-b4-q1-osmd-v1', title: '1-1. テーマを右手だけで練習', titleEn: '1-1. Theme RH only' }),
  lessonSongRow('mq-b4-q2-lesson', 0, { id: 'mq-b4-q2-0-lsong', survivalTutorial: 'mq-b4-q2-dialogue-v1', title: '2-0. 左手を入れる準備', titleEn: '2-0. Prep to add LH' }),
  lessonSongRow('mq-b4-q2-lesson', 1, { id: 'mq-b4-q2-1-lsong', earStage: 'mq-b4-5-2-2', title: '2-1. テーマ＋左手（1頭のみ）', titleEn: '2-1. Theme + LH (beat 1)', clearRequired: false }),
  lessonSongRow('mq-b4-q2-lesson', 2, { id: 'mq-b4-q2-2-lsong', earStage: 'mq-b4-5-2-3', title: '2-2. テーマ＋左手・精密', titleEn: '2-2. Theme + LH · Precision', clearRequired: false }),
  lessonSongRow('mq-b4-q2-lesson', 3, { id: 'mq-b4-q2-3-lsong', earStage: 'mq-b4-5-2-4', title: '2-3. テーマ＋左手（1頭3ウラ）', titleEn: '2-3. Theme + LH (1 + and-of-3)', clearRequired: false }),
  lessonSongRow('mq-b4-q2-lesson', 4, { id: 'mq-b4-q2-4-lsong', earStage: 'mq-b4-5-2-5', title: '2-4. テーマ＋左手（1頭3ウラ）・精密', titleEn: '2-4. Theme + LH precision', clearRequired: false }),
  lessonSongRow('mq-b4-q3-lesson', 0, { id: 'mq-b4-q3-0-lsong', survivalTutorial: 'mq-b4-q3-intro-v1', title: '3-0. テーマ・アドリブ・テーマの説明', titleEn: '3-0. Theme–ad-lib–theme intro' }),
  lessonSongRow('mq-b4-q3-lesson', 1, { id: 'mq-b4-q3-1-lsong', earStage: 'mq-b4-5-3-2', title: '3-1. まとめ・片手', titleEn: '3-1. Summary · One hand' }),
  lessonSongRow('mq-b4-q3-lesson', 2, { id: 'mq-b4-q3-2-lsong', earStage: 'mq-b4-5-3-3', title: '3-2. まとめ・両手', titleEn: '3-2. Summary · Two hands', clearRequired: false }),
  lessonSongRow('mq-b4-q3-lesson', 3, { id: 'mq-b4-q3-3-lsong', earStage: 'mq-b4-5-3-3-prec', title: '3-3. まとめ・両手・精密', titleEn: '3-3. Summary · Two hands · Precision', clearRequired: false }),
  lessonSongRow('mq-b4-q3-lesson', 4, { id: 'mq-b4-q3-4-lsong', survivalTutorial: 'mq-b4-q3-outro-v1', title: '3-4. 次はFブルースへ', titleEn: '3-4. Next: F blues' }),
].join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
`;

writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
console.log('Combat preview (OSMD):');
for (const s of STAGES.filter((x) => x.mode === 'chord_osmd')) {
  const c = combatFromTargets(s.targets);
  console.log(`  ${s.slug}: N=${s.targets} enemy_hp=${c.enemy_hp} miss=${c.miss_damage} fail=${c.fail_damage}`);
}
