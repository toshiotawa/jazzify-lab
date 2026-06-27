/**
 * 音楽理論初級コース v2 のマイグレーション SQL をファイルへ出力する
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const NS = 'a0000000-0000-4000-8000-000000000001';
const COURSE_SLUG = 'course-music-theory-beginner';
const BGM = 'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3';
const OUT = fileURLToPath(new URL('../supabase/migrations/20260327120000_music_theory_beginner_v2_restructure.sql', import.meta.url));

const rootsCDE = ['C', 'D', 'E'];
const rootsFGAB = ['F', 'G', 'A', 'B'];
const rootsBlackMaj = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
const allMajTriadRoots = [...rootsCDE, ...rootsFGAB, ...rootsBlackMaj];

const rootsMinCDE = ['Cm', 'Dm', 'Em'];
const rootsMinFGAB = ['Fm', 'Gm', 'Am', 'Bm'];
const rootsMinBlack = ['C#m', 'Ebm', 'F#m', 'Abm', 'Bbm'];
const allMinTriads = [...rootsMinCDE, ...rootsMinFGAB, ...rootsMinBlack];

const rootsMajB3 = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
const rootsMinB3 = ['C#m', 'Ebm', 'F#m', 'Abm', 'Bbm'];

const TWELVE_MAJOR_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const intervalRoots = {
  cde: rootsCDE,
  fgab: rootsFGAB,
  blackMaj: rootsBlackMaj,
  all: allMajTriadRoots,
};

function j(obj) {
  return JSON.stringify(obj).replace(/'/g, "''");
}

function majRootsFromRule(rule) {
  if (rule === 'cde') return rootsCDE;
  if (rule === 'fgab') return rootsFGAB;
  if (rule === 'blackMaj') return rootsBlackMaj;
  if (rule === 'all') return allMajTriadRoots;
  throw new Error(String(rule));
}

function minFromRule(rule) {
  if (rule === 'cde') return rootsMinCDE;
  if (rule === 'fgab') return rootsMinFGAB;
  if (rule === 'blackMin') return rootsMinBlack;
  if (rule === 'all') return allMinTriads;
  throw new Error(String(rule));
}

function mixedBlock3(rule) {
  if (rule === 'cde') return [...rootsCDE, ...rootsMinCDE];
  if (rule === 'fgab') return [...rootsFGAB, ...rootsMinFGAB];
  if (rule === 'mixedBlack') return [...rootsMajB3, ...rootsMinB3];
  if (rule === 'all') return [...allMajTriadRoots, ...allMinTriads];
  throw new Error(String(rule));
}

function intervalSpecs(roots, interval, direction) {
  return roots.map((root) => ({
    type: 'interval',
    chord: root,
    interval,
    direction,
  }));
}

function rootsForChordBlocks(rule) {
  if (rule === 'cde') return rootsCDE;
  if (rule === 'fgab') return rootsFGAB;
  if (rule === 'blackMaj') return rootsBlackMaj;
  if (rule === 'all') return allMajTriadRoots;
  throw new Error(String(rule));
}

function buildMin7FromRoots(letterRoots) {
  return letterRoots.map((r) => `${r}m7`);
}

function block9Allowed(rule) {
  if (rule === 'cde') return buildMin7FromRoots(rootsCDE);
  if (rule === 'fgab') return buildMin7FromRoots(rootsFGAB);
  if (rule === 'blackMin') return ['C#m7', 'Ebm7', 'F#m7', 'Abm7', 'Bbm7'];
  if (rule === 'all') return TWELVE_MAJOR_ROOTS.map((r) => `${r}m7`);
  throw new Error(String(rule));
}

function block12All() {
  const out = [];
  for (const r of TWELVE_MAJOR_ROOTS) {
    out.push(`${r}M7`, `${r}m7`, `${r}7`, `${r}m7b5`);
  }
  return out;
}

/** ブロック12の「C#–Eb–F#–Ab–Bb」グループ（ブロック9の黒鍵マイナー系ルートと同じ表記） */
function block12BlackSharpGroup() {
  const r = ['C#', 'Eb', 'F#', 'Ab', 'Bb'];
  const out = [];
  for (const root of r) {
    out.push(`${root}M7`, `${root}m7`, `${root}7`, `${root}m7b5`);
  }
  return out;
}

function block12Allowed(rule) {
  if (rule === 'all') return block12All();
  if (rule === 'blackSharp') return block12BlackSharpGroup();
  const r = rootsForChordBlocks(rule);
  const out = [];
  for (const root of r) {
    out.push(`${root}M7`, `${root}m7`, `${root}7`, `${root}m7b5`);
  }
  return out;
}

const UP_INTERVALS = [
  { key: 'M2', ja: '長2度上' },
  { key: 'M3', ja: '長3度上' },
  { key: 'P4', ja: '完全4度上' },
  { key: 'P5', ja: '完全5度上' },
  { key: 'M6', ja: '長6度上' },
  { key: 'M7', ja: '長7度上' },
];

const DOWN_INTERVALS = [
  { key: 'M2', ja: '長2度下' },
  { key: 'M3', ja: '長3度下' },
  { key: 'P4', ja: '完全4度下' },
  { key: 'P5', ja: '完全5度下' },
  { key: 'M6', ja: '長6度下' },
  { key: 'M7', ja: '長7度下' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @type {Array<Record<string, unknown>>} */
const stages = [];

function pushStage(meta) {
  const idx = stages.filter((s) => s.block === meta.block).length + 1;
  const sn = `MT-${pad2(meta.block)}-${pad2(idx)}`;
  stages.push({
    ...meta,
    stageNumber: sn,
    idSlug: `mtb-v2-stage-${sn}`,
    orderIndex: stages.length,
    idxInBlock: idx,
  });
}

// --- Block 1 ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMaj', '黒鍵'],
  ['all', '全ルート'],
]) {
  pushStage({
    block: 1,
    name: `メジャートライアド（${label}）その1`,
    nameEn: `Major triads (${label}) · Part 1`,
    mode: 'single',
    allowed: majRootsFromRule(rule),
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 1,
    name: `メジャートライアド（${label}）その2`,
    nameEn: `Major triads (${label}) · Part 2`,
    mode: 'progression_random',
    allowed: majRootsFromRule(rule),
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 2 ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMin', 'C#–Eb–F#–Ab–Bb'],
  ['all', '全ルート'],
]) {
  pushStage({
    block: 2,
    name: `マイナートライアド（${label}）その1`,
    nameEn: `Minor triads (${label}) · Part 1`,
    mode: 'single',
    allowed: minFromRule(rule),
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 2,
    name: `マイナートライアド（${label}）その2`,
    nameEn: `Minor triads (${label}) · Part 2`,
    mode: 'progression_random',
    allowed: minFromRule(rule),
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 3 ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['mixedBlack', '黒鍵混合'],
  ['all', '全ルート'],
]) {
  pushStage({
    block: 3,
    name: `メジャー/マイナー混合（${label}）その1`,
    nameEn: `Major/Minor mix (${label}) · Part 1`,
    mode: 'single',
    allowed: mixedBlock3(rule),
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 3,
    name: `メジャー/マイナー混合（${label}）その2`,
    nameEn: `Major/Minor mix (${label}) · Part 2`,
    mode: 'progression_random',
    allowed: mixedBlock3(rule),
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 4 度数（上）---
for (const intr of UP_INTERVALS) {
  for (const [rk, label] of [
    ['cde', 'CDE'],
    ['fgab', 'FGAB'],
    ['blackMaj', '黒鍵'],
  ]) {
    pushStage({
      block: 4,
      name: `${intr.ja}（${label}）`,
      nameEn: `${intr.key} up (${label})`,
      mode: 'single',
      allowed: intervalSpecs(intervalRoots[rk], intr.key, 'up'),
      enemyGauge: 5,
      maxHp: 10,
      scale: false,
    });
  }
}

// --- Block 5 度数（下）---
for (const intr of DOWN_INTERVALS) {
  for (const [rk, label] of [
    ['cde', 'CDE'],
    ['fgab', 'FGAB'],
    ['blackMaj', '黒鍵'],
  ]) {
    pushStage({
      block: 5,
      name: `${intr.ja}（${label}）`,
      nameEn: `${intr.key} down (${label})`,
      mode: 'single',
      allowed: intervalSpecs(intervalRoots[rk], intr.key, 'down'),
      enemyGauge: 5,
      maxHp: 10,
      scale: false,
    });
  }
}

// --- Block 6 メジャースケール ---
const majScaleGroups = [
  { keys: ['C', 'F', 'Bb'], ja: 'C–F–Bb' },
  { keys: ['D', 'G', 'A'], ja: 'D–G–A' },
  { keys: ['B', 'E', 'Gb'], ja: 'B–E–Gb' },
  { keys: ['Eb', 'Ab', 'Db'], ja: 'Eb–Ab–Db' },
  { keys: TWELVE_MAJOR_ROOTS, ja: '12調すべて' },
];
for (const g of majScaleGroups) {
  pushStage({
    block: 6,
    name: `メジャースケール（${g.ja}）`,
    nameEn: `Major scale (${g.ja})`,
    mode: 'single',
    allowed: g.keys.map((root) => `${root} major`),
    enemyGauge: 6,
    maxHp: 10,
    scale: true,
  });
}

// --- Block 7 ナチュラルマイナー ---
const natMinGroups = [
  { keys: ['A', 'D', 'G'], ja: 'A–D–G' },
  { keys: ['B', 'E', 'C#'], ja: 'B–E–C#' },
  { keys: ['G#', 'C#', 'Eb'], ja: 'G#–C#–Eb' },
  { keys: ['C', 'F', 'Bb'], ja: 'C–F–Bb' },
  { keys: TWELVE_MAJOR_ROOTS, ja: '12調すべて' },
];
for (const g of natMinGroups) {
  pushStage({
    block: 7,
    name: `ナチュラルマイナー（${g.ja}）`,
    nameEn: `Natural minor (${g.ja})`,
    mode: 'single',
    allowed: g.keys.map((root) => `${root} natural_minor`),
    enemyGauge: 6,
    maxHp: 10,
    scale: true,
  });
}

// --- Block 8 メジャーセブンス ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMaj', '黒鍵'],
  ['all', '全ルート'],
]) {
  const r = rootsForChordBlocks(rule);
  const allowed = r.map((x) => `${x}M7`);
  pushStage({
    block: 8,
    name: `メジャーセブンス（${label}）その1`,
    nameEn: `Major 7th (${label}) · Part 1`,
    mode: 'single',
    allowed,
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 8,
    name: `メジャーセブンス（${label}）その2`,
    nameEn: `Major 7th (${label}) · Part 2`,
    mode: 'progression_random',
    allowed,
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 9 マイナーセブンス ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMin', 'C#–Eb–F#–Ab–Bb'],
  ['all', '全ルート'],
]) {
  const allowed = block9Allowed(rule);
  pushStage({
    block: 9,
    name: `マイナーセブンス（${label}）その1`,
    nameEn: `Minor 7th (${label}) · Part 1`,
    mode: 'single',
    allowed,
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 9,
    name: `マイナーセブンス（${label}）その2`,
    nameEn: `Minor 7th (${label}) · Part 2`,
    mode: 'progression_random',
    allowed,
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 10 ドミナントセブンス ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMaj', '黒鍵'],
  ['all', '全ルート'],
]) {
  const r = rootsForChordBlocks(rule);
  const allowed = r.map((x) => `${x}7`);
  pushStage({
    block: 10,
    name: `ドミナントセブンス（${label}）その1`,
    nameEn: `Dominant 7th (${label}) · Part 1`,
    mode: 'single',
    allowed,
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 10,
    name: `ドミナントセブンス（${label}）その2`,
    nameEn: `Dominant 7th (${label}) · Part 2`,
    mode: 'progression_random',
    allowed,
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 11 ハーフディミニッシュ ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackMin', 'C#–Eb–F#–Ab–Bb'],
  ['all', '全ルート'],
]) {
  const r =
    rule === 'blackMin'
      ? ['C#', 'Eb', 'F#', 'Ab', 'Bb']
      : rule === 'all'
        ? TWELVE_MAJOR_ROOTS
        : rootsForChordBlocks(rule);
  const allowed = r.map((x) => `${x}m7b5`);
  pushStage({
    block: 11,
    name: `ハーフディミニッシュ（${label}）その1`,
    nameEn: `Half-diminished (${label}) · Part 1`,
    mode: 'single',
    allowed,
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 11,
    name: `ハーフディミニッシュ（${label}）その2`,
    nameEn: `Half-diminished (${label}) · Part 2`,
    mode: 'progression_random',
    allowed,
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 12 基本4和音まとめ ---
for (const [rule, label] of [
  ['cde', 'CDE'],
  ['fgab', 'FGAB'],
  ['blackSharp', 'C#–Eb–F#–Ab–Bb'],
  ['all', '全ルート'],
]) {
  const allowed = block12Allowed(rule);
  pushStage({
    block: 12,
    name: `基本4和音まとめ（${label}）・シングル`,
    nameEn: `Four-part basics (${label}) · Single`,
    mode: 'single',
    allowed,
    enemyGauge: 5,
    maxHp: 10,
    scale: false,
  });
  pushStage({
    block: 12,
    name: `基本4和音まとめ（${label}）その2`,
    nameEn: `Four-part basics (${label}) · Part 2`,
    mode: 'progression_random',
    allowed,
    enemyGauge: 5,
    maxHp: 5,
    scale: false,
    noteIntervalBeats: 4,
    measureCount: 32,
    countIn: 1,
  });
}

// --- Block 13 ハーモニックマイナー ---
const harmMinGroups = [
  { keys: ['A', 'D', 'G'], ja: 'A–D–G' },
  { keys: ['B', 'E', 'C#'], ja: 'B–E–C#' },
  { keys: ['G#', 'C#', 'Eb'], ja: 'G#–C#–Eb' },
  { keys: ['C', 'F', 'Bb'], ja: 'C–F–Bb' },
  { keys: TWELVE_MAJOR_ROOTS, ja: '12調すべて' },
];
for (const g of harmMinGroups) {
  pushStage({
    block: 13,
    name: `ハーモニックマイナー（${g.ja}）`,
    nameEn: `Harmonic minor (${g.ja})`,
    mode: 'single',
    allowed: g.keys.map((root) => `${root} harmonic_minor`),
    enemyGauge: 6,
    maxHp: 10,
    scale: true,
  });
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''");
}

let sql = `-- 音楽理論初級コース v2: 専用ファンタジーステージとレッスンを再定義
-- BGM: ${BGM}
BEGIN;

DELETE FROM public.lesson_songs
WHERE lesson_id IN (SELECT id FROM public.lessons WHERE course_id = uuid_generate_v5('${NS}'::uuid, '${COURSE_SLUG}'));

DELETE FROM public.lessons
WHERE course_id = uuid_generate_v5('${NS}'::uuid, '${COURSE_SLUG}');

UPDATE public.courses
SET
  description = 'メジャー/マイナートライアドから度数・スケール・主要4和音まで、段階的に耳と指を鍛える初級コースです。',
  description_en = 'From triads and intervals through scales and core seventh chords, a step-by-step introductory theory course.',
  difficulty_tier = 'beginner'
WHERE id = uuid_generate_v5('${NS}'::uuid, '${COURSE_SLUG}');

`;

for (const s of stages) {
  const id = `uuid_generate_v5('${NS}'::uuid, '${sqlEscape(s.idSlug)}')`;
  const allowed = j(s.allowed);
  const mode = s.mode;
  const eg = s.scale ? 6 : 5;
  const maxHp = s.maxHp;
  const enemyCount = mode === 'single' ? 30 : 10;
  const mcount = s.measureCount != null ? s.measureCount : 8;
  const nib = s.noteIntervalBeats != null ? s.noteIntervalBeats : 'NULL';
  const cin = s.countIn != null ? s.countIn : 0;

  sql += `INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  ${id},
  '${sqlEscape(s.stageNumber)}',
  '${sqlEscape(s.name)}',
  '${sqlEscape(s.nameEn)}',
  '',
  '',
  ${maxHp},
  ${mode === 'single' ? 100 : 32},
  ${eg},
  '${mode}',
  '${allowed}'::jsonb,
  '[]'::jsonb,
  false,
  ${enemyCount},
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  ${mcount},
  ${cin},
  'lesson',
  false,
  false,
  ${nib},
  '${BGM}',
  '${BGM}'
);

`;
}

sql += '\n';

stages.forEach((s, i) => {
  const lid = `uuid_generate_v5('${NS}'::uuid, 'mtb-v2-lesson-${String(i).padStart(3, '0')}')`;
  const lsg = `uuid_generate_v5('${NS}'::uuid, 'mtb-v2-lsg-${String(i).padStart(3, '0')}')`;
  const sid = `uuid_generate_v5('${NS}'::uuid, '${sqlEscape(s.idSlug)}')`;
  const bn = s.block;
  sql += `INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  ${lid},
  uuid_generate_v5('${NS}'::uuid, '${COURSE_SLUG}'),
  '${sqlEscape(s.name)}',
  '${sqlEscape(s.nameEn)}',
  '',
  '',
  ${i},
  ${bn},
  'ブロック${bn}',
  'Block ${bn}',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  ${lsg},
  ${lid},
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  ${sid},
  '${sqlEscape(s.name)}'
);

`;
});

sql += 'COMMIT;\n';

writeFileSync(OUT, sql, 'utf8');
console.log('Wrote', OUT, 'stages:', stages.length);
