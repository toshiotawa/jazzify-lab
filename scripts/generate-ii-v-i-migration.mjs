/**
 * II-V-I レッスンコース用 INSERT SQL を生成（MCP用にチャンク分割可能）。
 *
 * 全件: node scripts/generate-ii-v-i-migration.mjs > full.sql
 * チャンク: node scripts/generate-ii-v-i-migration.mjs 1 40 > part1.sql
 *   1-based inclusive lesson indices (全120レッスン)
 *
 * --with-xml  MusicXML ファイルを読み込み music_xml カラムに挿入（要 public/II-V-I_1-50/）
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { ja: 'C', slug: 'c', suffix: 'C', semitones: 0 },
  { ja: 'F', slug: 'f', suffix: '+5st_F', semitones: 5 },
  { ja: 'B♭', slug: 'bb', suffix: '-2st_Bb', semitones: -2 },
  { ja: 'E♭', slug: 'eb', suffix: '+3st_Eb', semitones: 3 },
  { ja: 'A♭', slug: 'ab', suffix: '-4st_Ab', semitones: -4 },
  { ja: 'D♭', slug: 'db', suffix: '+1st_Db', semitones: 1 },
  { ja: 'G♭', slug: 'gb', suffix: '+6st_Gb', semitones: 6 },
  { ja: 'B', slug: 'b', suffix: '-1st_B', semitones: -1 },
  { ja: 'E', slug: 'e', suffix: '+4st_E', semitones: 4 },
  { ja: 'A', slug: 'a', suffix: '-3st_A', semitones: -3 },
  { ja: 'D', slug: 'd', suffix: '+2st_D', semitones: 2 },
  { ja: 'G', slug: 'g', suffix: '-5st_G', semitones: -5 },
];

/** enemyHp = 2周分のノーツ数。maxHp ≒ 期待ミス(25/75) + 余裕 */
const RANGES = [
  { label: '1-5', fileXml: '01-05', fileMp3: '1-5', notes: 256, enemyHp: 512 },
  { label: '6-10', fileXml: '06-10', fileMp3: '6-10', notes: 224, enemyHp: 448 },
  { label: '11-15', fileXml: '11-15', fileMp3: '11-15', notes: 252, enemyHp: 504 },
  { label: '16-20', fileXml: '16-20', fileMp3: '16-20', notes: 258, enemyHp: 516 },
  { label: '21-25', fileXml: '21-25', fileMp3: '21-25', notes: 242, enemyHp: 484 },
  { label: '26-30', fileXml: '26-30', fileMp3: '26-30', notes: 218, enemyHp: 436 },
  { label: '31-35', fileXml: '31-35', fileMp3: '31-35', notes: 206, enemyHp: 412 },
  { label: '36-40', fileXml: '36-40', fileMp3: '36-40', notes: 266, enemyHp: 532 },
  { label: '41-45', fileXml: '41-45', fileMp3: '41-45', notes: 272, enemyHp: 544 },
  { label: '46-50', fileXml: '46-50', fileMp3: '46-50', notes: 264, enemyHp: 528 },
].map((r) => ({
  ...r,
  maxHp: Math.ceil(r.enemyHp / 3) + 55,
}));

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const courseDescJa = `定番のII–V–I進行を、短いフレーズ単位で12調×50種に練習するコースです。各レッスンは5フレーズを1本の音源で（各フレーズ2回ずつ）演奏します。BPM 160。ファンタジーモードのリズム・カスタム（楽譜＋タイミング判定）で、クリア（Cランク以上）を目指してください。`;
const courseDescEn = `Practice essential II–V–I lines across 12 keys and 50 short phrases. Each lesson uses one backing track covering five phrases (each phrase played twice) at 160 BPM. Clear the Fantasy rhythm/custom stage (sheet + timing) with any successful clear rank (C or better).`;

const args = process.argv.slice(2);
const withXml = args.includes('--with-xml');
const numArgs = args.filter(a => !a.startsWith('--'));
let fromIdx = 1;
let toIdx = KEYS.length * RANGES.length;
if (numArgs.length >= 2) {
  fromIdx = Math.max(1, parseInt(numArgs[0], 10) || 1);
  toIdx = Math.min(KEYS.length * RANGES.length, parseInt(numArgs[1], 10) || toIdx);
}

const xmlCache = new Map();
function getMusicXml(fileXml) {
  if (!withXml) return null;
  if (xmlCache.has(fileXml)) return xmlCache.get(fileXml);
  const p = resolve(__dirname, '..', 'public', 'II-V-I_1-50', `II-V 50 - ${fileXml}.musicxml`);
  try {
    const content = readFileSync(p, 'utf8');
    xmlCache.set(fileXml, content);
    return content;
  } catch {
    console.error(`-- WARNING: MusicXML not found: ${p}`);
    xmlCache.set(fileXml, null);
    return null;
  }
}

const includeCourse = fromIdx === 1;

const lines = [];
lines.push(`-- II-V-I lesson course chunk ${fromIdx}-${toIdx} (generator: generate-ii-v-i-migration.mjs)`);
lines.push('BEGIN;');
lines.push('');

if (includeCourse) {
  lines.push(`INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial
) VALUES (
  uuid_generate_v5('${NS}'::uuid, 'ii-v-i-course'),
  'II-V-Iフレーズ基礎',
  'II-V-I Phrase Basics',
  ${sqlStr(courseDescJa)},
  ${sqlStr(courseDescEn)},
  true,
  22,
  'both',
  false
);`);
  lines.push('');
}

/** アプリは order_index を 0 始まりとし、表示で +1 する（CoursePage / lessonNavigation） */
/** 並び: 同一フレーズ帯（例 1-5）を全キーで回してから次の帯（6-10）へ（C→F→B♭→…→G × 帯） */
let lessonOrder = -1;
for (let ri = 0; ri < RANGES.length; ri++) {
  const r = RANGES[ri];
  const blockNum = ri + 1;
  const blockJa = `フレーズ ${r.label}`;
  const blockEn = `Phrases ${r.label}`;

  for (let bi = 0; bi < KEYS.length; bi++) {
    const k = KEYS[bi];
    lessonOrder += 1;
    if (lessonOrder < fromIdx || lessonOrder > toIdx) {
      continue;
    }
    const stageKey = `st-${k.slug}-${r.label}`;
    const lessonKey = `lsn-${k.slug}-${r.label}`;
    const lsKey = `lsg-${k.slug}-${r.label}`;

    const titleJa = `II-V-I フレーズ ${r.label}（${k.ja}）`;
    const titleEn = `II-V-I phrases ${r.label} (${k.ja.replace('♭', 'b').replace('♯', '#')})`;
    const stNameJa = titleJa;
    const stNameEn = titleEn;
    const descJa = `フレーズ ${r.label}（${k.ja}調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。`;
    const descEn = `Phrases ${r.label} in ${k.ja.replace('♭', 'b').replace('♯', '#')}. Play along with the backing track (160 BPM, five phrases × two passes each).`;

    const bgmPath = `https://jazzify-cdn.com/fantasy-bgm/ii-v-i-${r.fileMp3}-${k.slug}.mp3`;

    const xml = getMusicXml(r.fileXml);
    const xmlCols = xml ? ',\n  music_xml' : '';
    const xmlVals = xml ? `,\n  $musicxml$${xml}$musicxml$` : '';

    lines.push(`-- ${stageKey} (lesson #${lessonOrder})`);
    lines.push(`INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url${xmlCols}
) VALUES (
  uuid_generate_v5('${NS}'::uuid, ${sqlStr(stageKey)}),
  NULL,
  ${sqlStr(stNameJa)},
  ${sqlStr(stNameEn)},
  ${sqlStr(descJa)},
  ${sqlStr(descEn)},
  ${r.maxHp},
  ${r.enemyHp},
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  ${r.enemyHp},
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  ${k.semitones},
  ${sqlStr(bgmPath)},
  ${sqlStr(bgmPath)}${xmlVals}
);`);
    lines.push('');
    lines.push(`INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('${NS}'::uuid, ${sqlStr(lessonKey)}),
  uuid_generate_v5('${NS}'::uuid, 'ii-v-i-course'),
  ${sqlStr(titleJa)},
  ${sqlStr(titleEn)},
  ${sqlStr(`実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。`)},
  ${sqlStr(`Practice: Clear the linked Fantasy stage once (rank C or better).`)},
  ${lessonOrder},
  ${blockNum},
  ${sqlStr(blockJa)},
  ${sqlStr(blockEn)},
  true,
  NULL,
  '[]'::jsonb
);`);
    lines.push('');
    lines.push(`INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('${NS}'::uuid, ${sqlStr(lsKey)}),
  uuid_generate_v5('${NS}'::uuid, ${sqlStr(lessonKey)}),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('${NS}'::uuid, ${sqlStr(stageKey)}),
  ${sqlStr(titleJa)}
);`);
    lines.push('');
  }
}

lines.push('COMMIT;');
console.log(lines.join('\n'));
