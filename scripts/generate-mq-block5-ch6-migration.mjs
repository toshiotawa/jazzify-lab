/**
 * メインクエスト Ch6（Fブルースに挑戦）のマイグレーション SQL を生成する。
 *
 * Usage:
 *   node scripts/generate-mq-block5-ch6-migration.mjs
 *
 * 事前:
 *   node scripts/prepare-mq-b5-assets.mjs
 *   node scripts/upload-sozai-main-quest-block5-r2.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'supabase', 'migrations', '20260812100000_mq_block5_ch6.sql');
const Q9_XML = join(ROOT, 'public', 'sozai', 'mq-b5-6-9.musicxml');

const NS = 'a0000000-0000-4000-8000-000000000004';
const MAIN_COURSE_ID = 'a0000000-0000-0000-0000-000000000001';
const CDN = 'https://jazzify-cdn.com/sozai';
const ASSET_V = '202608121000';
const DRUM = `${CDN}/Cblues_24bars_100BPM_Drum.mp3`;

const KEY_FIFTHS = -1;
const BEATS = 4;
const BLOCK_NAME = 'Fブルースに挑戦';
const BLOCK_NAME_EN = 'Take on the F Blues';

const uuid = (key) => `uuid_generate_v5('${NS}'::uuid, '${key}')`;
const sqlJson = (obj) => JSON.stringify(obj).replace(/'/g, "''");
const asset = (name) => `${CDN}/${name}?v=${ASSET_V}`;
const esc = (s) => s.replace(/'/g, "''");

const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** @param {number} midi */
const midiToName = (midi) => {
  const pc = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${FLAT_NAMES[pc]}${oct}`;
};

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

/** @param {readonly number[]} midi @param {2 | 3} voices */
const voicingDef = (name, midi, voices) => ({
  name,
  voicing: [...midi],
  voicingNames: midi.map(midiToName),
  voicing_staves: midi.map(() => 2),
  key_fifths: KEY_FIFTHS,
  voices,
});

const VOICINGS_2V = {
  F7: voicingDef('F7', [51, 57], 2),
  Bb7: voicingDef('Bb7', [50, 56], 2),
  D7: voicingDef('D7', [54, 60], 2),
  Gm7: voicingDef('Gm7', [53, 58], 2),
  C7: voicingDef('C7', [52, 58], 2),
};

const VOICINGS_3V = {
  F7: voicingDef('F7', [51, 57, 62], 3),
  Bb7: voicingDef('Bb7', [50, 56, 60], 3),
  D7: voicingDef('D7', [54, 60, 63], 3),
  Gm7: voicingDef('Gm7', [53, 58, 62], 3),
  C7: voicingDef('C7', [52, 58, 62], 3),
};

/** @param {Record<string, ReturnType<typeof voicingDef>>} pool */
const randomChordPool = (pool) =>
  Object.values(pool).map((c) => ({
    name: c.name,
    voicing: c.voicing,
    voicingNames: c.voicingNames,
    voicingStaves: c.voicing_staves,
    keyFifths: KEY_FIFTHS,
  }));

const CHORD_NAMES_5 = ['F7', 'Bb7', 'D7', 'Gm7', 'C7'];
const F_BLUES_TURNAROUND = ['F7', 'Bb7', 'F7', 'Gm7', 'C7'];

/** @type {readonly {
 *   key: string;
 *   slug: string;
 *   title: string;
 *   titleEn: string;
 *   description: string;
 *   descriptionEn: string;
 *   mode: 'chord_osmd' | 'chord_precision';
 *   base: string;
 *   xmlSuffix: 'guide-voice4-cue' | 'precision' | '';
 *   mp3Base: string;
 *   measures: number;
 *   targets: number;
 *   bpm: number;
 *   is_swing: boolean;
 *   loopSec?: number;
 *   count_in_beats?: number;
 *   hammer_lead_measures?: number;
 * }[]} */
const STAGES = [
  {
    key: 'mq-b5-6-1-2', slug: 'mq-b5-6-1-2-osmd', title: 'Fブルース入門（2音）', titleEn: 'F blues intro (2 notes)',
    description: 'Fブルースでコール＆レスポンス。', descriptionEn: 'Call and response on the F blues.',
    mode: 'chord_osmd', base: 'mq-b5-6-1-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-1-2',
    measures: 25, targets: 38, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-2-6', slug: 'mq-b5-6-2-6-osmd', title: '2音・頭拍パターン', titleEn: 'Two-note head-beat pattern',
    description: 'F7〜C7の2音コードを頭拍で。', descriptionEn: 'Two-note chords on beat one.',
    mode: 'chord_osmd', base: 'mq-b5-6-2-6', xmlSuffix: '', mp3Base: 'mq-b5-6-karaoke',
    measures: 25, targets: 56, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-3-6', slug: 'mq-b5-6-3-6-osmd', title: '3音・頭拍パターン', titleEn: 'Three-note head-beat pattern',
    description: '3音ヴォイシングで頭拍を支える。', descriptionEn: 'Support beat one with three-note voicings.',
    mode: 'chord_osmd', base: 'mq-b5-6-3-6', xmlSuffix: '', mp3Base: 'mq-b5-6-karaoke',
    measures: 25, targets: 84, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-4-2', slug: 'mq-b5-6-4-2-osmd', title: 'パターン2（3音・頭拍）', titleEn: 'Pattern 2 (3-note head beat)',
    description: '6-3-6 と同じ譜面・音源。', descriptionEn: 'Same score and audio as 6-3-6.',
    mode: 'chord_osmd', base: 'mq-b5-6-3-6', xmlSuffix: '', mp3Base: 'mq-b5-6-karaoke',
    measures: 25, targets: 84, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-4-3', slug: 'mq-b5-6-4-3-osmd', title: 'パターン3', titleEn: 'Pattern 3',
    description: '4つのリズムパターンの3つ目。', descriptionEn: 'Third of four rhythm patterns.',
    mode: 'chord_osmd', base: 'mq-b5-6-4-3', xmlSuffix: '', mp3Base: 'mq-b5-6-4-3',
    measures: 25, targets: 147, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-4-4', slug: 'mq-b5-6-4-4-osmd', title: 'パターン4', titleEn: 'Pattern 4',
    description: '4つのリズムパターンの4つ目。', descriptionEn: 'Fourth of four rhythm patterns.',
    mode: 'chord_osmd', base: 'mq-b5-6-4-4', xmlSuffix: '', mp3Base: 'mq-b5-6-4-4',
    measures: 25, targets: 144, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-4-5', slug: 'mq-b5-6-4-5-osmd', title: 'パターン5', titleEn: 'Pattern 5',
    description: '4つのリズムパターンの5つ目。', descriptionEn: 'Fifth rhythm pattern.',
    mode: 'chord_osmd', base: 'mq-b5-6-4-5', xmlSuffix: '', mp3Base: 'mq-b5-6-4-5',
    measures: 25, targets: 148, bpm: 100, is_swing: true, loopSec: 60.048,
  },
  {
    key: 'mq-b5-6-4-6', slug: 'mq-b5-6-4-6-osmd', title: 'パターン6（まとめ）', titleEn: 'Pattern 6 (summary)',
    description: '4パターンのまとめ（クリア必須ではない）。', descriptionEn: 'Summary of four patterns (optional clear).',
    mode: 'chord_osmd', base: 'mq-b5-6-4-6', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-4-3',
    measures: 25, targets: 185, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-5-2', slug: 'mq-b5-6-5-2-osmd', title: 'アドリブ2（2音）', titleEn: 'Ad-lib 2 (2 notes)',
    description: '2音コードでアドリブに挑戦。', descriptionEn: 'Ad-lib with two-note voicings.',
    mode: 'chord_osmd', base: 'mq-b5-6-5-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-5-2',
    measures: 25, targets: 43, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-5-3', slug: 'mq-b5-6-5-3-osmd', title: 'アドリブ3（2音）', titleEn: 'Ad-lib 3 (2 notes)',
    description: '聴いて返すアドリブ。', descriptionEn: 'Listen-and-answer ad-lib.',
    mode: 'chord_osmd', base: 'mq-b5-6-5-3', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-5-3',
    measures: 25, targets: 43, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-5-4', slug: 'mq-b5-6-5-4-osmd', title: 'アドリブ4（まとめ）', titleEn: 'Ad-lib 4 (summary)',
    description: 'F・Ab・Bb / C・Eb・F の組み合わせ。', descriptionEn: 'Combine F Ab Bb and C Eb F.',
    mode: 'chord_osmd', base: 'mq-b5-6-5-4', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-5-4',
    measures: 25, targets: 64, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-6-2', slug: 'mq-b5-6-6-2-osmd', title: 'ペンタトニック実戦', titleEn: 'Pentatonic in action',
    description: '80BPMスウィングでペンタトニック。', descriptionEn: 'Pentatonic at 80 BPM swing.',
    mode: 'chord_osmd', base: 'mq-b5-6-6-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-6-2',
    measures: 25, targets: 64, bpm: 80, is_swing: true, loopSec: 75.048,
  },
  {
    key: 'mq-b5-6-7-2', slug: 'mq-b5-6-7-2-osmd', title: 'ブルーノート・スケール', titleEn: 'Blue-note scale',
    description: 'ブルーノートを使ったフレーズ。', descriptionEn: 'Phrases using blue notes.',
    mode: 'chord_osmd', base: 'mq-b5-6-7-2', xmlSuffix: 'guide-voice4-cue', mp3Base: 'mq-b5-6-7-2',
    measures: 25, targets: 76, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-7-3', slug: 'mq-b5-6-7-3-precision', title: 'ブルーノート・精密', titleEn: 'Blue notes · Precision',
    description: '7-2 の精密モード。', descriptionEn: 'Precision version of 7-2.',
    mode: 'chord_precision', base: 'mq-b5-6-7-2', xmlSuffix: 'precision', mp3Base: 'mq-b5-6-7-2',
    measures: 25, targets: 76, bpm: 100, is_swing: true, loopSec: 60,
  },
  {
    key: 'mq-b5-6-8-2', slug: 'mq-b5-6-8-2-precision', title: 'フレーズ1・精密', titleEn: 'Phrase 1 · Precision',
    description: '精密モード（クリア必須ではない）。', descriptionEn: 'Precision mode (optional clear).',
    mode: 'chord_precision', base: 'mq-b5-6-8-2', xmlSuffix: 'precision', mp3Base: 'mq-b5-6-8-2',
    measures: 25, targets: 350, bpm: 80, is_swing: true, loopSec: 75.048,
  },
  {
    key: 'mq-b5-6-8-3', slug: 'mq-b5-6-8-3-precision', title: 'フレーズ2・精密', titleEn: 'Phrase 2 · Precision',
    description: '精密モード（クリア必須ではない）。', descriptionEn: 'Precision mode (optional clear).',
    mode: 'chord_precision', base: 'mq-b5-6-8-3', xmlSuffix: 'precision', mp3Base: 'mq-b5-6-8-3',
    measures: 25, targets: 336, bpm: 80, is_swing: true, loopSec: 75.048,
  },
  {
    key: 'mq-b5-6-8-4', slug: 'mq-b5-6-8-4-precision', title: 'フレーズ3・精密', titleEn: 'Phrase 3 · Precision',
    description: '精密モード（クリア必須ではない）。', descriptionEn: 'Precision mode (optional clear).',
    mode: 'chord_precision', base: 'mq-b5-6-8-4', xmlSuffix: 'precision', mp3Base: 'mq-b5-6-8-4',
    measures: 25, targets: 312, bpm: 80, is_swing: true, loopSec: 75.048,
  },
  {
    key: 'mq-b5-6-10-2', slug: 'mq-b5-6-10-2-precision', title: 'Fブルース総仕上げ・精密', titleEn: 'F blues finale · Precision',
    description: '章の総仕上げ（クリア必須ではない）。', descriptionEn: 'Chapter finale (optional clear).',
    mode: 'chord_precision', base: 'mq-b5-6-10-2', xmlSuffix: 'precision', mp3Base: 'mq-b5-6-10-2',
    measures: 25, targets: 400, bpm: 80, is_swing: true, loopSec: 75.048,
  },
];

/** @param {(typeof STAGES)[number]} s */
function buildStageSql(s) {
  const measureSec = (60 / s.bpm) * BEATS;
  const loopSec = Number((s.loopSec ?? s.measures * measureSec).toFixed(3));
  const countIn = s.count_in_beats ?? 0;
  const hammerLead = s.hammer_lead_measures ?? 1;
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
  const xmlFile = s.xmlSuffix ? `${s.base}-${s.xmlSuffix}.musicxml` : `${s.base}.musicxml`;
  const xmlUrl = asset(xmlFile);
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
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  ${uuid(`${s.key}-stage`)},
  '${s.slug}',
  '${esc(s.title)}',
  '${esc(s.titleEn)}',
  '${esc(s.description)}',
  '${esc(s.descriptionEn)}',
  ${s.bpm}, ${KEY_FIFTHS}, ${BEATS}, 4, ${s.measures}, ${combat.max_loops_per_phrase},
  ${countIn}, 600, ${combat.player_hp}, ${combat.enemy_hp},
  ${combat.per_correct_note_damage}, ${combat.good_completion_damage}, ${combat.great_completion_damage}, ${combat.perfect_completion_damage},
  ${combat.miss_damage}, ${combat.fail_damage}, 4, 8,
  'blue_club', true, false, '${s.mode}',
  ${s.mode === 'chord_precision' ? 'false' : 'true'}, true, ${s.is_swing ? 'true' : 'false'},
  ${hammerLead}
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  ${uuid(`${s.key}-phrase`)},
  ${uuid(`${s.key}-stage`)},
  0,
  '${esc(s.title)}',
  '${esc(s.titleEn)}',
  '${xmlUrl}',
  '${audioUrl}',
  ${loopSec},
  ${loopSec},
  0,
  ${KEY_FIFTHS}
);`;
}

function insertEarTutorial(id, title, titleEn, script) {
  return `
INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  '${id}',
  '${esc(title)}',
  '${esc(titleEn)}',
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
  '${esc(title)}',
  '${esc(titleEn)}',
  '${sqlJson(script)}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();`;
}

/** @param {(typeof STAGES)[number]} s */
function osmdStageContent(s) {
  const measureSec = (60 / s.bpm) * BEATS;
  const loopSec = Number((s.loopSec ?? s.measures * measureSec).toFixed(3));
  const xmlFile = s.xmlSuffix ? `${s.base}-${s.xmlSuffix}.musicxml` : `${s.base}.musicxml`;
  const combat = s.mode === 'chord_osmd' ? combatFromTargets(s.targets) : null;
  return {
    stage: {
      slug: s.slug,
      title: s.title,
      title_en: s.titleEn,
      bpm: s.bpm,
      key_fifths: KEY_FIFTHS,
      beats_per_measure: BEATS,
      beat_type: 4,
      loop_measures: s.measures,
      max_loops_per_phrase: 2,
      count_in_beats: s.count_in_beats ?? 0,
      time_limit_sec: 600,
      player_hp: combat?.player_hp ?? 100,
      enemy_hp: combat?.enemy_hp ?? 10000,
      per_correct_note_damage: combat?.per_correct_note_damage ?? 10,
      good_completion_damage: 30,
      miss_damage: 0,
      fail_damage: 0,
      background_theme: 'blue_club',
      mode: s.mode,
      show_keyboard_hints_in_battle: true,
      osmd_targets_from_score: true,
      is_swing: s.is_swing,
      hammer_lead_measures: s.hammer_lead_measures ?? 1,
    },
    phrases: [{
      order_index: 0,
      title: s.title,
      title_en: s.titleEn,
      music_xml_url: asset(xmlFile),
      audio_url: asset(`${s.mp3Base}.mp3`),
      loop_duration_sec: loopSec,
      audio_duration_sec: loopSec,
      note_count: 0,
      key_fifths: KEY_FIFTHS,
    }],
  };
}

const stageByKey = Object.fromEntries(STAGES.map((s) => [s.key, s]));

const ch6Q1IntroDialogue = {
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
        { speaker: 'jajii', ja: 'Cブルースから、Fブルースへ。キーが上がると、指の形も響きも変わるのじゃ。', en: 'From C blues to F blues — a new key means new shapes and new colors.' },
        { speaker: 'fai', ja: 'Fブルース…新しい景色だね。', en: 'F blues… a new landscape.' },
        { speaker: 'jajii', ja: 'まずは2音コードで、F7から始めよう。EbとA——Cブルースの感覚をFへ運ぶんじゃ。', en: 'Start with two-note F7: Eb and A — carry your C blues feel into F.' },
        { speaker: 'fai', ja: 'キーが変わっても、聴いて返すやり方は同じだ！', en: 'New key, same listen-and-answer approach!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch6Q1EarTutorial = {
  version: 1,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: earTutorialUi,
  content: {
    'mq-b5-6-1-2-osmd': osmdStageContent(stageByKey['mq-b5-6-1-2']),
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'Fブルースの最初の課題じゃ。譜面を見ながら、聴いて返そう。', en: 'Your first F blues task — read the score, listen, and answer.' },
        { speaker: 'fai', ja: 'Voice4のキュー音符、頼りにするね。', en: 'I will lean on the Voice4 cue notes.' },
      ],
    },
    { type: 'chord_osmd', contentRef: 'mq-b5-6-1-2-osmd', requiredLoops: 1 },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'よし。Fブルースの入口が開いたのう。', en: 'Good — the door to F blues is open.' },
        { speaker: 'fai', ja: '次はコードの種類を増やしていこう！', en: 'Next, let us learn more chord types!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const ch6Q2Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'Fブルースで使うコードは5種類じゃ。F7、Bb7、D7、Gm7、C7。', en: 'Five chord types in F blues: F7, Bb7, D7, Gm7, and C7.' },
      { speaker: 'fai', ja: '全部2音から始めるんだね。', en: 'We start with two notes each.' },
      { speaker: 'jajii', ja: 'まずは2音ヴォイシングを体に入れる。コードラン、風船、クイズ、サバイバルで試すのじゃ。', en: 'Lock in two-note voicings — then try Code Run, Balloon, Quiz, and Survival.' },
      { speaker: 'fai', ja: 'ゲーム感覚で覚えられそう！', en: 'Sounds fun — I am in!' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q3Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: '2音が安定したら、3音目を足す番じゃ。', en: 'Once two notes feel steady, add a third.' },
      { speaker: 'fai', ja: '響きが厚くなるけど、形は覚えやすい？', en: 'Richer sound — but still learnable shapes?' },
      { speaker: 'jajii', ja: 'うむ。最低音は変えず、上に1音足すだけ。頭拍で支える練習から始めよう。', en: 'Aye — keep the bottom, add one note on top. Start with beat-one support.' },
      { speaker: 'fai', ja: '3音版のサバイバルもあるんだね。', en: 'There are three-note Survival modes too.' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q4Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'ここから4つのリズムパターンに挑む。頭拍、裏拍…形は違ってもコードは同じ5つじゃ。', en: 'Four rhythm patterns ahead — different placements, same five chords.' },
      { speaker: 'fai', ja: 'リズムが変わると、手が迷いそう…', en: 'New rhythms might trip me up…' },
      { speaker: 'jajii', ja: '焦るな。パターン6はまとめじゃ。難しければ飛ばしてよい、おまけもあるぞ。', en: 'No rush. Pattern 6 is the summary — skip extras if needed.' },
      { speaker: 'fai', ja: '4パターン、順番にいこう！', en: 'Four patterns — one at a time!' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q5IntroDialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'コンピングが動けるようになった。次はアドリブじゃ。', en: 'Your comping is moving — time for ad-lib.' },
      { speaker: 'fai', ja: 'アドリブ2と3…段階的に難しくなる？', en: 'Ad-lib 2 and 3… step by step?' },
      { speaker: 'jajii', ja: 'そうじゃ。2音で返し、3つ目の課題ではF・Ab・BbとC・Eb・Fを組み合わせる。', en: 'Aye — answer in two notes, then combine F Ab Bb with C Eb F.' },
      { speaker: 'fai', ja: '自由に返すの、ちょっとワクワクする！', en: 'Answering freely — exciting!' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q5EarTutorial = {
  version: 1,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: earTutorialUi,
  content: { 'mq-b5-6-5-4-osmd': osmdStageContent(stageByKey['mq-b5-6-5-4']) },
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'F・Ab・Bb と C・Eb・F。2つの3音セットを行き来するんじゃ。', en: 'F Ab Bb and C Eb F — move between these two three-note sets.' },
      { speaker: 'fai', ja: 'セットを切り替える感覚、練習してみる！', en: 'I will practice switching between the sets!' },
    ],
  }, { type: 'chord_osmd', contentRef: 'mq-b5-6-5-4-osmd', requiredLoops: 1 }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q5OutroDialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'アドリブの入り口まで来たのう。次はペンタトニックで色を足す。', en: 'You reached the ad-lib gateway — next, color with pentatonic.' },
      { speaker: 'fai', ja: '2音コードの上に、メロディを乗せていく感じだね。', en: 'Like laying melody over two-note chords.' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q6EarTutorial = {
  version: 1,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: earTutorialUi,
  content: {
    'mq-b5-6-6-1-osmd': {
      stage: {
        slug: 'mq-b5-6-6-1-osmd',
        title: 'Fペンタトニック',
        title_en: 'F pentatonic',
        bpm: 60,
        key_fifths: KEY_FIFTHS,
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
        is_swing: false,
        hammer_lead_measures: 1,
      },
      phrases: [{
        order_index: 0,
        title: 'Fペンタトニック',
        title_en: 'F pentatonic',
        music_xml_url: asset('mq-b5-6-6-1-guide-voice4-cue.musicxml'),
        audio_url: asset('mq-b5-6-6-1.mp3'),
        loop_duration_sec: 100,
        audio_duration_sec: 100,
        note_count: 0,
        key_fifths: KEY_FIFTHS,
      }],
    },
  },
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'Fペンタトニックじゃ。60BPM、ストレートでゆっくり確かめる。', en: 'F pentatonic — 60 BPM, straight feel, take it slow.' },
      { speaker: 'fai', ja: '5つの音だけ…シンプルだけど奥深いね。', en: 'Only five notes — simple yet deep.' },
    ],
  }, { type: 'chord_osmd', contentRef: 'mq-b5-6-6-1-osmd', requiredLoops: 1 }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q7Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'ブルーノートを使うと、ジャズらしい「色」が出る。', en: 'Blue notes add that jazz color.' },
      { speaker: 'fai', ja: 'ペンタトニックに、あえて半音ずらすやつ？', en: 'Pentatonic notes bent by a half step?' },
      { speaker: 'jajii', ja: 'その通り。まずは譜面通り、次に精密モードで自分の耳を確かめよう。', en: 'Exactly. Play from the score first, then test your ear in precision mode.' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q8Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'フレーズの中で Bb から B へ——指を横に滑らせる「スライド」の感覚じゃ。', en: 'In a phrase, slide from Bb to B — a lateral finger glide.' },
      { speaker: 'fai', ja: '1フレット分の動きだけど、ニュアンスが変わるんだね。', en: 'One fret — but the feel changes.' },
      { speaker: 'jajii', ja: '精密モードで3つのフレーズに挑戦。全部クリア必須ではないぞ。', en: 'Three precision phrases — clearing all is optional.' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q9Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'サバイバルで「フレーズ」を弾く番じゃ。1小節ずつ、5つの型を覚える。', en: 'Time for Survival phrases — five one-bar shapes.' },
      { speaker: 'fai', ja: 'ループBGMに合わせて、同じ型を繰り返すんだね。', en: 'Loop BGM, repeat the same shape.' },
      { speaker: 'jajii', ja: 'うむ。譜面の音符どおりに、低音から形を押さえるんじゃ。', en: 'Aye — read the notes and anchor the shape from the bottom.' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const ch6Q10Dialogue = {
  version: 3,
  audioTracks: { drum_loop: { url: DRUM, volume: 0.35 } },
  ui: survivalTutorialUi,
  scenarioOverrides: { hideStaffOnBSlotCompletion: false, hideStaff: false },
  content: {},
  scenes: [{
    type: 'dialogue_only',
    lineIntervalSeconds: 4,
    lines: [
      { speaker: 'jajii', ja: 'Fブルースの旅、ここまでよく走ったのう。', en: 'You ran the F blues road well.' },
      { speaker: 'fai', ja: '2音から3音、コンピング、アドリブ、フレーズ…長かった！', en: 'Two notes to three, comping, ad-lib, phrases — quite a journey!' },
      { speaker: 'jajii', ja: '最後の精密モードは総仕上げじゃ。余裕があれば挑戦して、なければ次章へ進むのもよい。', en: 'The final precision is a capstone — try it if ready, or move on.' },
      { speaker: 'fai', ja: 'Fブルース、だいぶ自分のものになった気がする！', en: 'F blues is starting to feel like mine!' },
    ],
  }, { type: 'finish' }],
  finish: { showCta: true },
};

const codeRunDialogue = {
  lines: [
    { atSeconds: 2, speaker: 'fai', text: 'Fブルースのコードを弾きながら進む！', textEn: 'Play F blues chords and run!' },
    { atSeconds: 8, speaker: 'jajii', text: '2音でも形を覚えれば、自然にヴォイシングが身につく。', textEn: 'Two-note shapes build voicing naturally.' },
    { atSeconds: 16, speaker: 'jajii', text: '右端の旗まで進むんじゃ。', textEn: 'Head for the flag on the right.' },
  ],
};

/** @param {string} key @param {number} stageNum @param {2|3} voices @param {'code_run'|'survival'} playMode */
function buildSurvivalLessonStageSql(key, stageNum, voices, playMode) {
  const pool = voices === 2 ? VOICINGS_2V : VOICINGS_3V;
  const label = voices === 2 ? '2音' : '3音';
  const name = playMode === 'code_run'
    ? `MQ Ch6: Fブルース コードラン（${label}）`
    : `MQ Ch6: Fブルース サバイバル（${label}）`;
  const nameEn = playMode === 'code_run'
    ? `MQ Ch6: F blues Code Run (${voices}v)`
    : `MQ Ch6: F blues Survival (${voices}v)`;
  const extra = playMode === 'code_run'
    ? `, run_map_id, run_time_limit_sec, run_dialogue_script`
    : '';
  const extraVals = playMode === 'code_run'
    ? `, 'tutorial_3', 120, '${sqlJson(codeRunDialogue)}'::jsonb`
    : '';
  const extraUpdate = playMode === 'code_run'
    ? `,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script`
    : '';

  return `
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode${extra}
) VALUES (
  'lesson', ${stageNum}, 'random', '${playMode}',
  '${esc(name)}', '${esc(nameEn)}', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, '${playMode === 'code_run' ? 'always' : 'fade_15s'}', '${playMode === 'code_run' ? 'always' : 'fade_15s'}'${extraVals}
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode${extraUpdate},
  updated_at = now();`;
}

/** @param {2|3} voices */
function buildBalloonStageSql(voices) {
  const slug = voices === 2 ? 'mq-b5-balloon-2v' : 'mq-b5-balloon-3v';
  const label = voices === 2 ? '2音' : '3音';
  return `
INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  ${uuid(slug)},
  '${slug}',
  'MQ Ch6: Fブルース 風船（${label}）',
  'MQ Ch6: F blues balloon (${voices}v)',
  'F7/Bb7/D7/Gm7/C7をランダム出題。90秒以内に20個。',
  'Random F7/Bb7/D7/Gm7/C7. Pop 20 balloons within 90 seconds.',
  'random', '7', NULL,
  '${sqlJson(CHORD_NAMES_5)}'::jsonb,
  NULL,
  90, 20, 10, 5, 3,
  '${DRUM}', ${KEY_FIFTHS}, true, true,
  'fade_15s', 'fade_15s', false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  allowed_chords = EXCLUDED.allowed_chords,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();`;
}

/** @param {2|3} voices @param {Record<string, ReturnType<typeof voicingDef>>} pool */
function buildQuizStageSql(voices, pool) {
  const slug = voices === 2 ? 'mq-b5-quiz-2v' : 'mq-b5-quiz-3v';
  const label = voices === 2 ? '2音' : '3音';
  const stageKey = `${slug}-stage`;
  const stageId = uuid(stageKey);
  const items = CHORD_NAMES_5.map((name, i) => {
    const c = pool[name];
    const voicingSql = `ARRAY[${c.voicingNames.map((n) => `'${n}'`).join(', ')}]::text[]`;
    const stavesSql = `ARRAY[${c.voicing_staves.join(', ')}]::smallint[]`;
    return `
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  ${uuid(`${slug}-item-${i}`)},
  ${stageId},
  ${i}, ${i + 1}, 1, 4,
  '${name}',
  ${voicingSql},
  ${stavesSql},
  ${KEY_FIFTHS}
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();`;
  }).join('\n');

  return `
DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = ${stageId};
DELETE FROM public.ear_training_stages WHERE id = ${stageId};

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  ${stageId},
  '${slug}',
  'MQ Ch6: Fブルース クイズ（${label}）',
  'MQ Ch6: F blues quiz (${voices}v)',
  '40秒以内に20問正解。Fブルースの${label}ヴォイシング。',
  'Answer 20 questions within 40 seconds using ${voices}-note F blues voicings.',
  100, ${KEY_FIFTHS}, 4, 4, 5, 6,
  0, 40, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  40, 'random', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  updated_at = now();
${items}`;
}

function parseQ9Phrases() {
  const xml = readFileSync(Q9_XML, 'utf8');
  const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
  const measures = [...doc.querySelectorAll('part measure')];
  if (measures.length !== 5) {
    throw new Error(`mq-b5-6-9.musicxml: expected 5 measures, got ${measures.length}`);
  }

  return measures.map((measure, idx) => {
    const harmony = measure.querySelector('harmony');
    let chordName = F_BLUES_TURNAROUND[idx] ?? 'F7';
    if (harmony) {
      const step = harmony.querySelector('root root-step')?.textContent ?? 'F';
      const alterEl = harmony.querySelector('root root-alter');
      const alter = alterEl?.textContent ? Number(alterEl.textContent) : 0;
      const kind = harmony.querySelector('kind')?.getAttribute('text')
        ?? harmony.querySelector('kind')?.textContent
        ?? '7';
      const acc = alter > 0 ? '#'.repeat(alter) : alter < 0 ? 'b'.repeat(-alter) : '';
      chordName = `${step}${acc}${kind}`.trim();
    }

    /** @type {{ name: string; midi: number; pc: number; stepIndex: number }[]} */
    const notes = [];
    let stepIndex = -1;
    for (const noteEl of measure.querySelectorAll('note')) {
      if (noteEl.querySelector('rest')) continue;
      if (!noteEl.querySelector('chord')) stepIndex += 1;
      const pitch = noteEl.querySelector('pitch');
      if (!pitch) continue;
      const step = pitch.querySelector('step')?.textContent ?? 'C';
      const alter = pitch.querySelector('alter')?.textContent
        ? Number(pitch.querySelector('alter')?.textContent)
        : 0;
      const octave = Number(pitch.querySelector('octave')?.textContent ?? 4);
      const pcMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      const midi = (octave + 1) * 12 + pcMap[step] + alter;
      notes.push({
        name: midiToName(midi),
        midi,
        pc: ((midi % 12) + 12) % 12,
        stepIndex,
      });
    }

    return { stageNumber: 501 + idx, roman: ['I', 'II', 'III', 'IV', 'V'][idx], chordName, notes };
  });
}

function buildSurvivalPhrasesSql() {
  const phrases = parseQ9Phrases();
  const deleteSql = `
DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505;
`;

  const stageInserts = phrases.map((p) => `
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', ${p.stageNumber}, 'progression',
  'MQ Ch6 フレーズ ${p.roman}', 'MQ Ch6 Phrase ${p.roman}', 'easy',
  '', '${esc(p.chordName)}', '${esc(p.chordName)}',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();`).join('\n');

  const phraseInserts = phrases.map((p, i) => {
    const loopIdx = i + 1;
    return `
INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', ${p.stageNumber},
  'MQ Ch6 Phrase ${p.roman}',
  '${asset(`mq-b5-6-9-${loopIdx}-loop.mp3`)}',
  ${KEY_FIFTHS}
);`;
  }).join('\n');

  const doBlock = [
    'DO $$',
    'DECLARE',
    ...phrases.map((p) => `  v_phrase_${p.stageNumber} uuid;`),
    ...phrases.map((p) => `  v_chord_${p.stageNumber} uuid;`),
    'BEGIN',
    ...phrases.map((p) => `  SELECT id INTO v_phrase_${p.stageNumber} FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = ${p.stageNumber};`),
    ...phrases.flatMap((p) => {
      const lines = [
        `  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)`,
        `  VALUES (v_phrase_${p.stageNumber}, 0, '${esc(p.chordName)}', 1)`,
        `  RETURNING id INTO v_chord_${p.stageNumber};`,
      ];
      if (p.notes.length > 0) {
        const vals = p.notes.map((n, oi) =>
          `    (v_chord_${p.stageNumber}, ${oi}, ${n.midi}, ${n.pc}, '${esc(n.name)}', 2, ${n.stepIndex})`,
        );
        lines.push(
          '  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES',
          `${vals.join(',\n')};`,
        );
      }
      return lines;
    }),
    'END $$;',
  ].join('\n');

  return `${deleteSql}\n${stageInserts}\n${phraseInserts}\n${doBlock}`;
}

/** @param {string} lessonKey @param {number} order @param {object} row */
function lessonSongRow(lessonKey, order, row) {
  const clearReq = row.clearRequired !== false;
  const survivalMap = row.survivalMap ?? 'lesson';
  const staffHint = row.staffHint ? `'${row.staffHint}'` : 'NULL';
  const keyboardHint = row.keyboardHint ? `'${row.keyboardHint}'` : 'NULL';
  const randomChords = row.survivalRandomChords
    ? `'${sqlJson(row.survivalRandomChords)}'::jsonb`
    : 'NULL';
  const overrides = row.survivalOverrides ? `'${sqlJson(row.survivalOverrides)}'::jsonb` : 'NULL';

  return `  (
    ${uuid(row.id)}, ${uuid(lessonKey)}, NULL, ${order},
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL,
    ${row.survivalStage ? `true, ${row.survivalStage}, '${survivalMap}'` : 'false, NULL, NULL'},
    ${row.earStage ? `true, ${uuid(`${row.earStage}-stage`)}` : 'false, NULL'},
    ${row.earTutorial ? `true, '${row.earTutorial}'` : 'false, NULL'},
    ${row.survivalTutorial ? `true, '${row.survivalTutorial}'` : 'false, NULL'},
    ${row.balloon ? `true, ${uuid(row.balloon)}` : 'false, NULL'},
    ${overrides},
    ${randomChords},
    ${staffHint}, ${keyboardHint},
    '${esc(row.title)}', '${esc(row.titleEn)}',
    ${clearReq}
  )`;
}

const LESSONS = [
  { key: 'mq-b5-q1-lesson', order: 0, title: 'クエスト1：Fブルース入門', titleEn: 'Quest 1: F blues intro', desc: 'CブルースからFへ。2音コール＆レスポンス。', descEn: 'From C blues to F. Two-note call and response.', assign: 'Fブルースの入口を通しましょう。', assignEn: 'Pass the gateway to F blues.' },
  { key: 'mq-b5-q2-lesson', order: 1, title: 'クエスト2：5つのコード', titleEn: 'Quest 2: Five chords', desc: 'F7/Bb7/D7/Gm7/C7の2音を覚える。', descEn: 'Learn two-note F7/Bb7/D7/Gm7/C7.', assign: '5コードを体に入れましょう。', assignEn: 'Internalize the five chords.' },
  { key: 'mq-b5-q3-lesson', order: 2, title: 'クエスト3：3音ヴォイシング', titleEn: 'Quest 3: Three-note voicings', desc: '3音に広げ、頭拍パターンを弾く。', descEn: 'Expand to three notes and play head-beat patterns.', assign: '3音ヴォイシングを練習しましょう。', assignEn: 'Practice three-note voicings.' },
  { key: 'mq-b5-q4-lesson', order: 3, title: 'クエスト4：4パターン', titleEn: 'Quest 4: Four patterns', desc: '4つのリズムパターンに挑戦。', descEn: 'Take on four rhythm patterns.', assign: '4パターンを順に練習しましょう。', assignEn: 'Work through the four patterns.' },
  { key: 'mq-b5-q5-lesson', order: 4, title: 'クエスト5：アドリブ', titleEn: 'Quest 5: Ad-lib', desc: '2音アドリブと3音セットの組み合わせ。', descEn: 'Two-note ad-lib and three-note set combinations.', assign: 'アドリブ課題に挑戦しましょう。', assignEn: 'Try the ad-lib tasks.' },
  { key: 'mq-b5-q6-lesson', order: 5, title: 'クエスト6：ペンタトニック', titleEn: 'Quest 6: Pentatonic', desc: 'Fペンタトニックで色を足す。', descEn: 'Add color with the F pentatonic.', assign: 'ペンタトニックを弾きましょう。', assignEn: 'Play the pentatonic scale.' },
  { key: 'mq-b5-q7-lesson', order: 6, title: 'クエスト7：ブルーノート', titleEn: 'Quest 7: Blue notes', desc: 'ブルーノート・スケールのフレーズ。', descEn: 'Phrases with the blue-note scale.', assign: 'ブルーノートを確かめましょう。', assignEn: 'Explore blue notes.' },
  { key: 'mq-b5-q8-lesson', order: 7, title: 'クエスト8：フレーズ', titleEn: 'Quest 8: Phrases', desc: 'Bb→Bのスライドを含む精密フレーズ。', descEn: 'Precision phrases including Bb→B slide.', assign: '精密フレーズに挑戦しましょう。', assignEn: 'Try the precision phrases.' },
  { key: 'mq-b5-q9-lesson', order: 8, title: 'クエスト9：サバイバル・フレーズ', titleEn: 'Quest 9: Survival phrases', desc: '5つの1小節フレーズをサバイバルで。', descEn: 'Five one-bar phrases in Survival.', assign: 'フレーズを覚えましょう。', assignEn: 'Learn the survival phrases.' },
  { key: 'mq-b5-q10-lesson', order: 9, title: 'クエスト10：まとめ', titleEn: 'Quest 10: Summary', desc: 'Fブルース章の総仕上げ。', descEn: 'F blues chapter finale.', assign: '総仕上げに挑戦しましょう。', assignEn: 'Take on the finale.' },
];

const R2V = randomChordPool(VOICINGS_2V);
const R3V = randomChordPool(VOICINGS_3V);

const LESSON_SONGS = [
  { lesson: 'mq-b5-q1-lesson', order: 0, id: 'mq-b5-q1-0-lsong', survivalTutorial: 'mq-b5-q1-0-v1', title: '1-0. C→Fブルース', titleEn: '1-0. C to F blues' },
  { lesson: 'mq-b5-q1-lesson', order: 1, id: 'mq-b5-q1-1-lsong', earTutorial: 'mq-b5-q1-1-v1', title: '1-1. Fブルース入門', titleEn: '1-1. F blues intro' },
  { lesson: 'mq-b5-q2-lesson', order: 0, id: 'mq-b5-q2-0-lsong', survivalTutorial: 'mq-b5-q2-0-v1', title: '2-0. 5つのコード', titleEn: '2-0. Five chords' },
  { lesson: 'mq-b5-q2-lesson', order: 1, id: 'mq-b5-q2-1-lsong', survivalStage: 1301, survivalRandomChords: R2V, staffHint: 'always', keyboardHint: 'always', title: '2-1. コードラン（2音）', titleEn: '2-1. Code Run (2v)' },
  { lesson: 'mq-b5-q2-lesson', order: 2, id: 'mq-b5-q2-2-lsong', balloon: 'mq-b5-balloon-2v', survivalRandomChords: R2V, staffHint: 'fade_15s', keyboardHint: 'fade_15s', title: '2-2. 風船（2音）', titleEn: '2-2. Balloon (2v)' },
  { lesson: 'mq-b5-q2-lesson', order: 3, id: 'mq-b5-q2-3-lsong', earStage: 'mq-b5-quiz-2v', title: '2-3. クイズ（2音）', titleEn: '2-3. Quiz (2v)' },
  { lesson: 'mq-b5-q2-lesson', order: 4, id: 'mq-b5-q2-4-lsong', survivalStage: 1302, survivalRandomChords: R2V, staffHint: 'fade_15s', keyboardHint: 'fade_15s', title: '2-4. サバイバル（2音）', titleEn: '2-4. Survival (2v)' },
  { lesson: 'mq-b5-q3-lesson', order: 0, id: 'mq-b5-q3-0-lsong', survivalTutorial: 'mq-b5-q3-0-v1', title: '3-0. 3音の説明', titleEn: '3-0. Three-note intro' },
  { lesson: 'mq-b5-q3-lesson', order: 1, id: 'mq-b5-q3-1-lsong', earStage: 'mq-b5-6-2-6', title: '3-1. 2音・頭拍', titleEn: '3-1. Two-note head beat' },
  { lesson: 'mq-b5-q3-lesson', order: 2, id: 'mq-b5-q3-2-lsong', earStage: 'mq-b5-6-3-6', title: '3-2. 3音・頭拍', titleEn: '3-2. Three-note head beat' },
  { lesson: 'mq-b5-q3-lesson', order: 3, id: 'mq-b5-q3-3-lsong', survivalStage: 1311, survivalRandomChords: R3V, staffHint: 'always', keyboardHint: 'always', title: '3-3. コードラン（3音）', titleEn: '3-3. Code Run (3v)' },
  { lesson: 'mq-b5-q3-lesson', order: 4, id: 'mq-b5-q3-4-lsong', balloon: 'mq-b5-balloon-3v', survivalRandomChords: R3V, staffHint: 'fade_15s', keyboardHint: 'fade_15s', title: '3-4. 風船（3音）', titleEn: '3-4. Balloon (3v)' },
  { lesson: 'mq-b5-q3-lesson', order: 5, id: 'mq-b5-q3-5-lsong', earStage: 'mq-b5-quiz-3v', title: '3-5. クイズ（3音）', titleEn: '3-5. Quiz (3v)' },
  { lesson: 'mq-b5-q3-lesson', order: 6, id: 'mq-b5-q3-6-lsong', survivalStage: 1312, survivalRandomChords: R3V, staffHint: 'fade_15s', keyboardHint: 'fade_15s', title: '3-6. サバイバル（3音）', titleEn: '3-6. Survival (3v)' },
  { lesson: 'mq-b5-q4-lesson', order: 0, id: 'mq-b5-q4-0-lsong', survivalTutorial: 'mq-b5-q4-0-v1', title: '4-0. 4パターン紹介', titleEn: '4-0. Four patterns intro' },
  { lesson: 'mq-b5-q4-lesson', order: 1, id: 'mq-b5-q4-1-lsong', earStage: 'mq-b5-6-4-2', title: '4-1. パターン2', titleEn: '4-1. Pattern 2' },
  { lesson: 'mq-b5-q4-lesson', order: 2, id: 'mq-b5-q4-2-lsong', earStage: 'mq-b5-6-4-3', title: '4-2. パターン3', titleEn: '4-2. Pattern 3' },
  { lesson: 'mq-b5-q4-lesson', order: 3, id: 'mq-b5-q4-3-lsong', earStage: 'mq-b5-6-4-4', title: '4-3. パターン4', titleEn: '4-3. Pattern 4' },
  { lesson: 'mq-b5-q4-lesson', order: 4, id: 'mq-b5-q4-4-lsong', earStage: 'mq-b5-6-4-5', title: '4-4. パターン5', titleEn: '4-4. Pattern 5' },
  { lesson: 'mq-b5-q4-lesson', order: 5, id: 'mq-b5-q4-5-lsong', earStage: 'mq-b5-6-4-6', clearRequired: false, title: '4-5. パターン6（まとめ）', titleEn: '4-5. Pattern 6 (optional)' },
  { lesson: 'mq-b5-q5-lesson', order: 0, id: 'mq-b5-q5-0-lsong', survivalTutorial: 'mq-b5-q5-0-v1', title: '5-0. アドリブの説明', titleEn: '5-0. Ad-lib intro' },
  { lesson: 'mq-b5-q5-lesson', order: 1, id: 'mq-b5-q5-1-lsong', earStage: 'mq-b5-6-5-2', title: '5-1. アドリブ2', titleEn: '5-1. Ad-lib 2' },
  { lesson: 'mq-b5-q5-lesson', order: 2, id: 'mq-b5-q5-2-lsong', earStage: 'mq-b5-6-5-3', title: '5-2. アドリブ3', titleEn: '5-2. Ad-lib 3' },
  { lesson: 'mq-b5-q5-lesson', order: 3, id: 'mq-b5-q5-3-lsong', earStage: 'mq-b5-6-5-4', title: '5-3. アドリブ4', titleEn: '5-3. Ad-lib 4' },
  { lesson: 'mq-b5-q5-lesson', order: 4, id: 'mq-b5-q5-4-lsong', earTutorial: 'mq-b5-q5-4-v1', title: '5-4. 3音セット練習', titleEn: '5-4. Three-note sets' },
  { lesson: 'mq-b5-q5-lesson', order: 5, id: 'mq-b5-q5-5-lsong', survivalTutorial: 'mq-b5-q5-5-v1', title: '5-5. クエスト5まとめ', titleEn: '5-5. Quest 5 summary' },
  { lesson: 'mq-b5-q6-lesson', order: 0, id: 'mq-b5-q6-1-lsong', earTutorial: 'mq-b5-q6-1-v1', title: '6-1. Fペンタトニック', titleEn: '6-1. F pentatonic' },
  { lesson: 'mq-b5-q6-lesson', order: 1, id: 'mq-b5-q6-2-lsong', earStage: 'mq-b5-6-6-2', title: '6-2. ペンタトニック実戦', titleEn: '6-2. Pentatonic in action' },
  { lesson: 'mq-b5-q7-lesson', order: 0, id: 'mq-b5-q7-0-lsong', survivalTutorial: 'mq-b5-q7-0-v1', title: '7-0. ブルーノート', titleEn: '7-0. Blue notes' },
  { lesson: 'mq-b5-q7-lesson', order: 1, id: 'mq-b5-q7-1-lsong', earStage: 'mq-b5-6-7-2', title: '7-1. ブルーノート・スケール', titleEn: '7-1. Blue-note scale' },
  { lesson: 'mq-b5-q7-lesson', order: 2, id: 'mq-b5-q7-2-lsong', earStage: 'mq-b5-6-7-3', title: '7-2. ブルーノート・精密', titleEn: '7-2. Blue notes · Precision' },
  { lesson: 'mq-b5-q8-lesson', order: 0, id: 'mq-b5-q8-0-lsong', survivalTutorial: 'mq-b5-q8-0-v1', title: '8-0. フレーズのコツ', titleEn: '8-0. Phrase tips' },
  { lesson: 'mq-b5-q8-lesson', order: 1, id: 'mq-b5-q8-1-lsong', earStage: 'mq-b5-6-8-2', clearRequired: false, title: '8-1. フレーズ1・精密', titleEn: '8-1. Phrase 1 · Precision' },
  { lesson: 'mq-b5-q8-lesson', order: 2, id: 'mq-b5-q8-2-lsong', earStage: 'mq-b5-6-8-3', clearRequired: false, title: '8-2. フレーズ2・精密', titleEn: '8-2. Phrase 2 · Precision' },
  { lesson: 'mq-b5-q8-lesson', order: 3, id: 'mq-b5-q8-3-lsong', earStage: 'mq-b5-6-8-4', clearRequired: false, title: '8-3. フレーズ3・精密', titleEn: '8-3. Phrase 3 · Precision' },
  { lesson: 'mq-b5-q9-lesson', order: 0, id: 'mq-b5-q9-0-lsong', survivalTutorial: 'mq-b5-q9-0-v1', title: '9-0. フレーズの弾き方', titleEn: '9-0. How to play phrases' },
  ...([501, 502, 503, 504, 505].map((n, i) => ({
    lesson: 'mq-b5-q9-lesson',
    order: i + 1,
    id: `mq-b5-q9-${i + 1}-lsong`,
    survivalStage: n,
    survivalMap: 'phrases',
    staffHint: 'fade_15s',
    keyboardHint: 'fade_15s',
    title: `9-${i + 1}. フレーズ ${['I', 'II', 'III', 'IV', 'V'][i]}`,
    titleEn: `9-${i + 1}. Phrase ${['I', 'II', 'III', 'IV', 'V'][i]}`,
  }))),
  { lesson: 'mq-b5-q10-lesson', order: 0, id: 'mq-b5-q10-0-lsong', survivalTutorial: 'mq-b5-q10-0-v1', title: '10-0. 章のまとめ', titleEn: '10-0. Chapter summary' },
  { lesson: 'mq-b5-q10-lesson', order: 1, id: 'mq-b5-q10-1-lsong', earStage: 'mq-b5-6-10-2', clearRequired: false, title: '10-1. 総仕上げ・精密', titleEn: '10-1. Finale · Precision' },
];

mkdirSync(join(ROOT, 'supabase', 'migrations'), { recursive: true });

const sql = `-- メインクエスト Ch6（Fブルースに挑戦）
-- 生成: node scripts/generate-mq-block5-ch6-migration.mjs
-- 事前: node scripts/prepare-mq-b5-assets.mjs && node scripts/upload-sozai-main-quest-block5-r2.mjs
BEGIN;

${insertSurvivalTutorial('mq-b5-q1-0-v1', 'MQ Ch6 Q1: C→Fブルース', 'MQ Ch6 Q1: C to F blues', ch6Q1IntroDialogue)}
${insertEarTutorial('mq-b5-q1-1-v1', 'MQ Ch6 Q1: Fブルース入門', 'MQ Ch6 Q1: F blues intro', ch6Q1EarTutorial)}
${insertSurvivalTutorial('mq-b5-q2-0-v1', 'MQ Ch6 Q2: 5コード', 'MQ Ch6 Q2: Five chords', ch6Q2Dialogue)}
${insertSurvivalTutorial('mq-b5-q3-0-v1', 'MQ Ch6 Q3: 3音', 'MQ Ch6 Q3: Three notes', ch6Q3Dialogue)}
${insertSurvivalTutorial('mq-b5-q4-0-v1', 'MQ Ch6 Q4: 4パターン', 'MQ Ch6 Q4: Four patterns', ch6Q4Dialogue)}
${insertSurvivalTutorial('mq-b5-q5-0-v1', 'MQ Ch6 Q5: アドリブ導入', 'MQ Ch6 Q5: Ad-lib intro', ch6Q5IntroDialogue)}
${insertEarTutorial('mq-b5-q5-4-v1', 'MQ Ch6 Q5: 3音セット', 'MQ Ch6 Q5: Three-note sets', ch6Q5EarTutorial)}
${insertSurvivalTutorial('mq-b5-q5-5-v1', 'MQ Ch6 Q5: まとめ', 'MQ Ch6 Q5: Summary', ch6Q5OutroDialogue)}
${insertEarTutorial('mq-b5-q6-1-v1', 'MQ Ch6 Q6: Fペンタトニック', 'MQ Ch6 Q6: F pentatonic', ch6Q6EarTutorial)}
${insertSurvivalTutorial('mq-b5-q7-0-v1', 'MQ Ch6 Q7: ブルーノート', 'MQ Ch6 Q7: Blue notes', ch6Q7Dialogue)}
${insertSurvivalTutorial('mq-b5-q8-0-v1', 'MQ Ch6 Q8: フレーズ', 'MQ Ch6 Q8: Phrases', ch6Q8Dialogue)}
${insertSurvivalTutorial('mq-b5-q9-0-v1', 'MQ Ch6 Q9: サバイバル・フレーズ', 'MQ Ch6 Q9: Survival phrases', ch6Q9Dialogue)}
${insertSurvivalTutorial('mq-b5-q10-0-v1', 'MQ Ch6 Q10: 章まとめ', 'MQ Ch6 Q10: Chapter summary', ch6Q10Dialogue)}

${STAGES.map(buildStageSql).join('\n')}

${buildSurvivalLessonStageSql('mq-b5-code-run-2v', 1301, 2, 'code_run')}
${buildSurvivalLessonStageSql('mq-b5-survival-2v', 1302, 2, 'survival')}
${buildSurvivalLessonStageSql('mq-b5-code-run-3v', 1311, 3, 'code_run')}
${buildSurvivalLessonStageSql('mq-b5-survival-3v', 1312, 3, 'survival')}

${buildBalloonStageSql(2)}
${buildBalloonStageSql(3)}

${buildQuizStageSql(2, VOICINGS_2V)}
${buildQuizStageSql(3, VOICINGS_3V)}

${buildSurvivalPhrasesSql()}

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
${LESSONS.map((l) => `  (
    ${uuid(l.key)}, '${MAIN_COURSE_ID}'::uuid,
    '${esc(l.title)}', '${esc(l.titleEn)}',
    '${esc(l.desc)}', '${esc(l.descEn)}',
    false, ${l.order}, 6,
    '${BLOCK_NAME}', '${BLOCK_NAME_EN}',
    'Fブルースで2音・3音ヴォイシング、コンピング、アドリブ、フレーズまで。', 'Two- and three-note voicings, comping, ad-lib, and phrases on the F blues.',
    '[]'::jsonb,
    '${esc(l.assign)}', '${esc(l.assignEn)}',
    false
  )`).join(',\n')}
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
${LESSON_SONGS.map((row) => lessonSongRow(row.lesson, row.order, row)).join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  survival_random_chords = EXCLUDED.survival_random_chords,
  override_production_staff_hint_mode = EXCLUDED.override_production_staff_hint_mode,
  override_production_keyboard_hint_mode = EXCLUDED.override_production_keyboard_hint_mode,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
`;

writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`Lessons: ${LESSONS.length}, lesson_songs: ${LESSON_SONGS.length}, OSMD/precision stages: ${STAGES.length}`);
console.log('Combat preview (OSMD):');
for (const s of STAGES.filter((x) => x.mode === 'chord_osmd')) {
  const c = combatFromTargets(s.targets);
  console.log(`  ${s.slug}: N=${s.targets} enemy_hp=${c.enemy_hp} miss=${c.miss_damage} fail=${c.fail_damage}`);
}
const q9 = parseQ9Phrases();
console.log('Q9 phrases parsed:', q9.map((p) => `${p.stageNumber}:${p.chordName}(${p.notes.length} notes)`).join(', '));
