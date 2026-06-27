/**
 * メインクエスト Block2（Cブルース：モチーフでアドリブ）の Supabase マイグレーション SQL を生成する。
 *
 * Usage:
 *   node scripts/generate-mq-block2-motif-migration.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseMqB2SurvivalTutorialXml } from './parse-mq-b2-survival-tutorial-xml.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'supabase', 'migrations', '20260625120000_mq_block2_motif.sql');

const NS = 'a0000000-0000-4000-8000-000000000002';
const MAIN_COURSE_ID = 'a0000000-0000-0000-0000-000000000001';
const CDN = 'https://jazzify-cdn.com/sozai';
const CBLUES_DRUM = `${CDN}/Cblues_24bars_100BPM_Drum.mp3`;

const DOMIFA = `${CDN}/mq-b2-domifa.mp3`;
const DOMIFA_CI = `${CDN}/mq-b2-domifa_count-in.mp3`;
const DOMIFA_XML = `${CDN}/mq-b2-domifa.musicxml`;
const SOSHIDO = `${CDN}/mq-b2-soshido.mp3`;
const SOSHIDO_CI = `${CDN}/mq-b2-soshido_count-in.mp3`;
const SOSHIDO_XML = `${CDN}/mq-b2-soshido.musicxml`;
const MOTIF = `${CDN}/mq-b2-motif.mp3`;
const MOTIF_XML = `${CDN}/mq-b2-motif.musicxml`;
const CBLUES_12 = `${CDN}/mq-b2-c-blues-12bars-100bpm.mp3`;
const MOTIF_DEMO_SILENT = `${CDN}/mq-b2-motif-demo-silent.mp3`;
const MOTIF_PLAYALONG_SILENT = `${CDN}/mq-b2-motif-playalong-silent.mp3`;

const BPM_OSMD = 120;
const BPM_ADLIB_12 = 120;
const BPM_ADLIB_FINAL = 100;
const BEATS_PER_MEASURE = 4;
const MEASURE_SEC_120 = (60 / BPM_OSMD) * BEATS_PER_MEASURE;
const MEASURE_SEC_100 = (60 / BPM_ADLIB_FINAL) * BEATS_PER_MEASURE;
const LOOP_24_SEC = MEASURE_SEC_120 * 24;
const LOOP_24_CI_SEC = MEASURE_SEC_120 * 25;
const LOOP_12_SEC_120 = MEASURE_SEC_120 * 12;
const LOOP_12_SEC_100 = MEASURE_SEC_100 * 12;
const COUNT_IN_MEASURES = 1;

const BLUES_12 = [
  'C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7',
];

const ADLIB_VOICINGS = {
  domifa: ['C4', 'Eb4', 'F4'],
  soshido: ['G4', 'Bb4', 'C5'],
  both: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'],
};

const ADLIB_COMBAT = {
  player_hp: 100,
  enemy_hp: 1500,
  per_correct_note_damage: 50,
  miss_damage: 10,
  count_in_beats: 4,
  time_limit_sec: 300,
};

const survivalParsed = parseMqB2SurvivalTutorialXml();

const uuid = (key) => `uuid_generate_v5('${NS}'::uuid, '${key}')`;

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

const chordOsmdStageDefaults = {
  show_keyboard_hints_in_battle: true,
  osmd_targets_from_score: true,
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

const survivalScenarioAlwaysStaff = {
  hideStaffOnBSlotCompletion: false,
  hideStaff: false,
};

/** @param {number} measureNumber @param {number} [measureOffset] @param {number} [bpm] */
function measureTiming(measureNumber, measureOffset = 0, bpm = BPM_OSMD) {
  const measureSec = (60 / bpm) * BEATS_PER_MEASURE;
  const logicalMeasure = measureNumber + measureOffset;
  const start = (logicalMeasure - 1) * measureSec;
  return {
    measure_number: logicalMeasure,
    beat_offset: 1,
    duration_beats: 4,
    start_time_sec: start,
    end_time_sec: start + measureSec,
  };
}

/** @param {readonly string[]} answerVoicing @param {number} [measureOffset] */
function buildOsmdChords24(answerVoicing, measureOffset = 0) {
  return Array.from({ length: 24 }, (_, i) => {
    const m = i + 1;
    const listen = m % 2 === 1;
    const t = measureTiming(m, measureOffset);
    if (listen) {
      return {
        order_index: i,
        chord_name: '—',
        ...t,
        voicing: [],
        voicing_staves: [],
        input_disabled: true,
      };
    }
    return {
      order_index: i,
      chord_name: answerVoicing.join('/'),
      ...t,
      voicing: [...answerVoicing],
      voicing_staves: answerVoicing.map(() => 1),
    };
  });
}

/** @param {readonly string[]} answerVoicing @param {string} answerJa @param {string} answerEn @param {number} [measureOffset] */
function buildOsmdTimedLines(answerVoicing, answerJa, answerEn, measureOffset = 0) {
  return Array.from({ length: 24 }, (_, i) => {
    const measureNumber = i + 1 + measureOffset;
    const listen = (i + 1) % 2 === 1;
    return {
      at: { loop: 0, measure: measureNumber, beat: 1 },
      text: listen
        ? { ja: '聴く', en: 'Listen' }
        : { ja: answerJa, en: answerEn },
    };
  });
}

/**
 * @param {string} stageKey
 * @param {readonly string[]} answerVoicing
 * @param {string} xmlUrl
 * @param {string} audioCiUrl
 * @param {string} answerJa
 * @param {string} answerEn
 */
function buildOsmdTutorialContent(stageKey, answerVoicing, xmlUrl, audioCiUrl, answerJa, answerEn) {
  return {
    stage: {
      slug: stageKey,
      title: 'モチーフで返す',
      title_en: 'Answer with motifs',
      bpm: BPM_OSMD,
      key_fifths: 0,
      beats_per_measure: BEATS_PER_MEASURE,
      beat_type: 4,
      loop_measures: 24,
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
      ...chordOsmdStageDefaults,
    },
    phrases: [
      {
        order_index: 0,
        title: 'Cブルース・モチーフ',
        title_en: 'C blues motifs',
        music_xml_url: xmlUrl,
        audio_url: audioCiUrl,
        loop_duration_sec: LOOP_24_CI_SEC,
        audio_duration_sec: LOOP_24_CI_SEC,
        note_count: 24,
        key_fifths: 0,
        chords: buildOsmdChords24(answerVoicing, COUNT_IN_MEASURES),
      },
    ],
  };
}

/** @param {readonly string[]} blues12 @param {readonly string[]} answerVoicing @param {object} quotes @param {number} bpm */
function buildAdlibChords12(blues12, answerVoicing, quotes, bpm) {
  return blues12.map((name, i) => {
    const m = i + 1;
    const listen = m % 2 === 1;
    const t = measureTiming(m, 0, bpm);
    if (listen) {
      return {
        order_index: i,
        chord_name: name,
        ...t,
        voicing: [],
        voicing_staves: [],
        input_disabled: true,
        quote: m === 1 ? quotes.listen : undefined,
      };
    }
    return {
      order_index: i,
      chord_name: name,
      ...t,
      voicing: [...answerVoicing],
      voicing_staves: answerVoicing.map(() => 1),
      quote: m === 2 ? quotes.play : undefined,
    };
  });
}

/** @param {string} phraseKey @param {ReturnType<typeof buildAdlibChords12>} chords */
function buildAdlibQuoteInsertSql(phraseKey, chords) {
  const rows = chords
    .map((c, i) => {
      const text = c.quote?.ja?.trim();
      if (!text) {
        return null;
      }
      return `  (${uuid(`${phraseKey}-c${i}`)}, '${text.replace(/'/g, "''")}')`;
    })
    .filter(Boolean);
  if (rows.length === 0) {
    return '';
  }
  return `
INSERT INTO public.ear_training_phrase_chord_quotes (phrase_chord_id, text) VALUES
${rows.join(',\n')}
ON CONFLICT (phrase_chord_id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();
`;
}

/** @param {string} stageKey @param {string} phraseKey @param {object} opts */
function buildAdlibStageSql(stageKey, phraseKey, opts) {
  const chords = buildAdlibChords12(BLUES_12, opts.voicing, opts.quotes, opts.bpm);
  return `
DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT id FROM public.ear_training_phrase_chords WHERE phrase_id = ${uuid(`${phraseKey}-phrase`)}
);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = ${uuid(`${phraseKey}-phrase`)};
DELETE FROM public.ear_training_phrases WHERE id = ${uuid(`${phraseKey}-phrase`)};
DELETE FROM public.ear_training_stages WHERE id = ${uuid(`${stageKey}-stage`)};

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  ${uuid(`${stageKey}-stage`)},
  '${stageKey}',
  '${opts.title.replace(/'/g, "''")}',
  '${opts.titleEn.replace(/'/g, "''")}',
  '${opts.description.replace(/'/g, "''")}',
  '${opts.descriptionEn.replace(/'/g, "''")}',
  ${opts.bpm}, 0, ${BEATS_PER_MEASURE}, 4, 12, 8,
  ${ADLIB_COMBAT.count_in_beats}, ${ADLIB_COMBAT.time_limit_sec}, ${ADLIB_COMBAT.player_hp}, ${ADLIB_COMBAT.enemy_hp},
  ${ADLIB_COMBAT.per_correct_note_damage}, 12, 18, 24,
  ${ADLIB_COMBAT.miss_damage}, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  ${uuid(`${phraseKey}-phrase`)},
  ${uuid(`${stageKey}-stage`)},
  0,
  '${opts.phraseTitle.replace(/'/g, "''")}',
  '${opts.phraseTitleEn.replace(/'/g, "''")}',
  NULL,
  '${opts.audioUrl}',
  ${opts.loopSec},
  ${opts.loopSec},
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
${chords.map((c, i) => `  (
    ${uuid(`${phraseKey}-c${i}`)},
    ${uuid(`${phraseKey}-phrase`)},
    ${c.order_index},
    '${c.chord_name.replace(/'/g, "''")}',
    ${c.measure_number},
    ${c.beat_offset},
    ${c.duration_beats},
    ${c.start_time_sec},
    ${c.end_time_sec},
    ${c.voicing.length > 0 ? `ARRAY[${c.voicing.map((v) => `'${v}'`).join(', ')}]::text[]` : 'ARRAY[]::text[]'},
    ${c.voicing_staves.length > 0 ? `ARRAY[${c.voicing_staves.join(', ')}]::smallint[]` : 'ARRAY[]::smallint[]'},
    ${c.input_disabled ? 'true' : 'false'}
  )`).join(',\n')};
${buildAdlibQuoteInsertSql(phraseKey, chords)}`;
}

function buildMotifOsmdStageSql() {
  return `
DELETE FROM public.ear_training_phrases WHERE stage_id = ${uuid('mq-b2-q3-2-osmd-stage')};
DELETE FROM public.ear_training_stages WHERE id = ${uuid('mq-b2-q3-2-osmd-stage')};

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  ${uuid('mq-b2-q3-2-osmd-stage')},
  'mq-b2-q3-2-osmd',
  '2つのモチーフで演奏',
  'Play two motifs',
  '譜面通りにモチーフを演奏。1ループPerfectでクリア。',
  'Play motifs from the score. Clear with one Perfect loop.',
  ${BPM_OSMD}, 0, ${BEATS_PER_MEASURE}, 4, 24, 4,
  ${BEATS_PER_MEASURE}, 600, 300, 10000,
  10, 5000, 7500, 10000,
  10, 15, 4, 8,
  'blue_club', true, false, 'chord_osmd', true, true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  ${uuid('mq-b2-q3-2-osmd-phrase')},
  ${uuid('mq-b2-q3-2-osmd-stage')},
  0,
  'モチーフ譜面',
  'Motif score',
  '${MOTIF_XML}',
  '${MOTIF}',
  ${LOOP_24_SEC},
  ${LOOP_24_SEC},
  0,
  0
);`;
}

const mqB2Q1OsmdScript = {
  version: 1,
  ui: earTutorialUi,
  content: {
    'mq-b2-q1-osmd': buildOsmdTutorialContent(
      'mq-b2-q1-osmd',
      ADLIB_VOICINGS.domifa,
      DOMIFA_XML,
      DOMIFA_CI,
      '返す（ド・ミ♭・ファ）',
      'Answer (C, Eb, F)',
    ),
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'ファイよ、世界は少し輝きを取り戻したが、まだ不安定じゃ。', en: 'Fai, the world has regained some light, but it is still unstable.' },
        { speaker: 'player', ja: '前よりマシになったけど、まだ足りないんだね。', en: 'It is better, but still not enough.' },
        { speaker: 'partner', ja: 'うむ。次に必要なのは、音を増やすことではない。', en: 'Aye. Next we need something more than adding notes.' },
        { speaker: 'player', ja: 'じゃあ、何をすればいいの？', en: 'Then what do I do?' },
        { speaker: 'partner', ja: '音で会話する力じゃ。短い音型、それが「モチーフ」じゃ。', en: 'The power to converse with sound. A short pattern — a motif.' },
        { speaker: 'player', ja: 'モチーフ…短いフレーズってこと？', en: 'A motif… like a short phrase?' },
        { speaker: 'partner', ja: 'その通り。聴いて返す、コールアンドレスポンスから始めるのじゃ。', en: 'Exactly. We start with call and response — listen, then answer.' },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: '今日使う音は、ド・ミ♭・ファの3つじゃ。', en: 'Today we use three notes: C, Eb, and F.' },
        { speaker: 'player', ja: '3つだけなら、覚えやすそう！', en: 'Only three — I can handle that!' },
        { speaker: 'partner', ja: 'ワシの音を1小節聴き、次の1小節でまねて返す。', en: 'Listen for one bar, then answer in the next.' },
        { speaker: 'player', ja: 'よし、まずは譜面どおりに返してみよう。', en: 'Alright — let me answer from the score first.' },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: 'mq-b2-q1-osmd',
      requiredLoops: 1,
      timedLines: buildOsmdTimedLines(
        ADLIB_VOICINGS.domifa,
        '返す（ド・ミ♭・ファ）',
        'Answer (C, Eb, F)',
        COUNT_IN_MEASURES,
      ),
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'よし。次はまねるだけではない。', en: 'Good. Next you will not only copy.' },
        { speaker: 'player', ja: '自由に弾くの？', en: 'Play freely?' },
        { speaker: 'partner', ja: '1小節休み、1小節返す。ド・ミ♭・ファだけで、自分の返事を弾くのじゃ。', en: 'Rest one bar, answer the next. Reply in your own way with C, Eb, and F only.' },
        { speaker: 'player', ja: '次は、ド・ミ♭・ファでアドリブだ！', en: 'Next up — ad-lib with C, Eb, and F!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB2Q2OsmdScript = {
  version: 1,
  ui: earTutorialUi,
  content: {
    'mq-b2-q2-osmd': buildOsmdTutorialContent(
      'mq-b2-q2-osmd',
      ADLIB_VOICINGS.soshido,
      SOSHIDO_XML,
      SOSHIDO_CI,
      '返す（ソ・シ♭・ド）',
      'Answer (G, Bb, C)',
    ),
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'ド・ミ♭・ファが身についてきたのう。', en: 'You have got C, Eb, and F under your fingers.' },
        { speaker: 'player', ja: '次は別の3音？', en: 'Another set of three notes?' },
        { speaker: 'partner', ja: 'そうじゃ。ソ・シ♭・ドじゃ。同じように聴いて返す。', en: 'Aye. G, Bb, and C. Listen and answer the same way.' },
        { speaker: 'player', ja: '2つ目のモチーフ、いってみよう！', en: 'Let us try the second motif!' },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: 'mq-b2-q2-osmd',
      requiredLoops: 1,
      timedLines: buildOsmdTimedLines(
        ADLIB_VOICINGS.soshido,
        '返す（ソ・シ♭・ド）',
        'Answer (G, Bb, C)',
        COUNT_IN_MEASURES,
      ),
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: '次はソ・シ♭・ドだけで、自由に返すんじゃ。', en: 'Next, answer freely with G, Bb, and C only.' },
        { speaker: 'player', ja: '1小節休んで、ソ・シ♭・ドでアドリブ！', en: 'Rest a bar, then ad-lib with G, Bb, and C!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB2Q3SurvivalScript = {
  version: 3,
  ui: survivalTutorialUi,
  scenarioOverrides: survivalScenarioAlwaysStaff,
  content: {
    'mq-b2-q3-motif-phrase': {
      stage: {
        name: '2つのモチーフ',
        nameEn: 'Two motifs',
        stageType: 'progression',
        mapCategory: 'phrases',
        chordDisplayName: 'ド・ミ♭・ファ / ソ・シ♭・ド',
        chordDisplayNameEn: 'C Eb F / G Bb C',
        lessonOnly: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'モチーフ・プレイアロング',
          title_en: 'Motif play-along',
          audio_url: MOTIF_PLAYALONG_SILENT,
          loop_duration_sec: survivalParsed.playalongDurationSec,
          key_fifths: 0,
          chords: survivalParsed.playalongChords,
        },
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: '2つのモチーフを組み合わせれば、会話になる。', en: 'Combine two motifs and you get a conversation.' },
        { speaker: 'fai', ja: '問いと答え、みたいな？', en: 'Like question and answer?' },
        { speaker: 'jajii', ja: 'そうじゃ。短い音型を少し変えながら使うと、アドリブにまとまりが出る。', en: 'Aye. Vary a short pattern slightly and your ad-lib gains shape.' },
        { speaker: 'fai', ja: 'まずはジャ爺の演奏を見てみる！', en: 'Let me watch you play first!' },
      ],
    },
    {
      type: 'demo_play',
      bpm: survivalParsed.bpm,
      beatsPerMeasure: 4,
      keyFifths: 0,
      livePlayback: true,
      audio: { url: MOTIF_DEMO_SILENT, volume: 1 },
      introLines: [
        { speaker: 'jajii', ja: 'モチーフを少しずつ変えながら弾くんじゃ。', en: 'Play the motif with small variations.' },
        { speaker: 'fai', ja: 'デモ、見てみる！', en: 'Watching the demo!' },
      ],
      chords: survivalParsed.demoChords,
      lines: [
        { speaker: 'jajii', ja: 'ド・ミ♭・ファ…', en: 'C, Eb, F…', startBeat: 0, durationBeats: 4 },
        { speaker: 'jajii', ja: 'ソ・シ♭・ドで返す。', en: 'Answer with G, Bb, C.', startBeat: 4, durationBeats: 4 },
      ],
    },
    {
      type: 'phrase_battle',
      contentRef: 'mq-b2-q3-motif-phrase',
      requiredLoops: 1,
      playAlong: true,
      introDelaySeconds: 2,
      dialogue: {
        intro: { ja: '一緒に弾いてみい。', en: 'Play along with me.' },
        onReveal: { ja: 'このモチーフを演奏！', en: 'Play this motif!' },
        onCorrectRemaining: { ja: 'OK、あと{{remaining}}塊。', en: 'OK, {{remaining}} left.' },
      },
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'よし。2つのモチーフが会話になってきたのう。', en: 'Good. Your two motifs are becoming a dialogue.' },
        { speaker: 'fai', ja: '問いと答え、感じてきた！', en: 'I can feel the question and answer!' },
        { speaker: 'jajii', ja: '次は譜面どおりに本番じゃ。', en: 'Next is the real battle from the score.' },
        { speaker: 'fai', ja: 'がんばるぞ！', en: 'I am ready!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB2Q3BridgeScript = {
  version: 3,
  audioTracks: {
    drum_loop: { url: CBLUES_DRUM, volume: 0.35 },
  },
  ui: survivalTutorialUi,
  scenarioOverrides: survivalScenarioAlwaysStaff,
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: '最後の課題じゃ。ド・ミ♭・ファとソ・シ♭・ドを使って、自由にアドリブする。', en: 'The final task: ad-lib freely with C Eb F and G Bb C.' },
        { speaker: 'fai', ja: 'どう弾いてもいいんだね？', en: 'Any way I want?' },
        { speaker: 'jajii', ja: 'うむ。なるべく2つのモチーフを対応させるんじゃ。', en: 'Aye. Pair the two motifs when you can.' },
        { speaker: 'fai', ja: 'でたらめにならないように、秩序が必要なんだよね。', en: 'So I need some order so it does not turn random.' },
        { speaker: 'jajii', ja: 'そうじゃ。だが、秩序がありすぎると機械みたいに無機質になる。', en: 'Aye. But too much order turns it mechanical.' },
        { speaker: 'jajii', ja: 'このさじ加減が、アドリブの難しさじゃ。', en: 'That balance is the hard part of ad-lib.' },
        { speaker: 'fai', ja: '2つのモチーフで、自由に会話してみる！', en: 'Let me converse freely with both motifs!' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

function sqlJson(obj) {
  return JSON.stringify(obj).replace(/'/g, "''");
}

function insertTutorialScript(id, title, titleEn, script) {
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

function insertSurvivalTutorialScript(id, title, titleEn, script) {
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

const sql = `-- メインクエスト Block2: Cブルース・モチーフでアドリブ（第2章）
-- 生成: node scripts/generate-mq-block2-motif-migration.mjs
-- 事前: node scripts/prepare-mq-b2-assets.mjs && node scripts/upload-sozai-main-quest-block2-r2.mjs
BEGIN;

${insertTutorialScript('mq-b2-q1-osmd-v1', 'MQ B2: ド・ミ♭・ファ OSMD', 'MQ B2: C Eb F OSMD', mqB2Q1OsmdScript)}
${insertTutorialScript('mq-b2-q2-osmd-v1', 'MQ B2: ソ・シ♭・ド OSMD', 'MQ B2: G Bb C OSMD', mqB2Q2OsmdScript)}
${insertSurvivalTutorialScript('mq-b2-q3-survival-v1', 'MQ B2: モチーフチュートリアル', 'MQ B2: Motif tutorial', mqB2Q3SurvivalScript)}
${insertSurvivalTutorialScript('mq-b2-q3-bridge-v1', 'MQ B2: 最終アドリブ前会話', 'MQ B2: Pre-final adlib talk', mqB2Q3BridgeScript)}

${buildAdlibStageSql('mq-b2-q1-2-adlib', 'mq-b2-q1-2-adlib', {
  voicing: ADLIB_VOICINGS.domifa,
  bpm: BPM_ADLIB_12,
  audioUrl: DOMIFA,
  loopSec: LOOP_12_SEC_120,
  title: 'ド・ミ♭・ファでアドリブ',
  titleEn: 'Ad-lib with C Eb F',
  description: 'Cブルース上でド・ミ♭・ファだけ自由に返す。',
  descriptionEn: 'Answer freely with C, Eb, and F on C blues.',
  phraseTitle: 'Cブルース・ドミファ',
  phraseTitleEn: 'C blues C Eb F',
  quotes: {
    listen: { ja: '休む。', en: 'Rest.' },
    play: { ja: 'ド・ミ♭・ファでアドリブ', en: 'Ad-lib with C, Eb, F' },
  },
})}

${buildAdlibStageSql('mq-b2-q2-2-adlib', 'mq-b2-q2-2-adlib', {
  voicing: ADLIB_VOICINGS.soshido,
  bpm: BPM_ADLIB_12,
  audioUrl: SOSHIDO,
  loopSec: LOOP_12_SEC_120,
  title: 'ソ・シ♭・ドでアドリブ',
  titleEn: 'Ad-lib with G Bb C',
  description: 'Cブルース上でソ・シ♭・ドだけ自由に返す。',
  descriptionEn: 'Answer freely with G, Bb, and C on C blues.',
  phraseTitle: 'Cブルース・ソシド',
  phraseTitleEn: 'C blues G Bb C',
  quotes: {
    listen: { ja: '休む。', en: 'Rest.' },
    play: { ja: 'ソ・シ♭・ドでアドリブ', en: 'Ad-lib with G, Bb, C' },
  },
})}

${buildMotifOsmdStageSql()}

${buildAdlibStageSql('mq-b2-q3-4-adlib', 'mq-b2-q3-4-adlib', {
  voicing: ADLIB_VOICINGS.both,
  bpm: BPM_ADLIB_FINAL,
  audioUrl: CBLUES_12,
  loopSec: LOOP_12_SEC_100,
  title: '2つのモチーフでアドリブ',
  titleEn: 'Ad-lib with two motifs',
  description: 'ド・ミ♭・ファとソ・シ♭・ドで自由にアドリブ。',
  descriptionEn: 'Ad-lib freely with both motif note sets.',
  phraseTitle: 'Cブルース・2モチーフ',
  phraseTitleEn: 'C blues two motifs',
  quotes: {
    listen: { ja: '休む。', en: 'Rest.' },
    play: { ja: '2つのモチーフでアドリブ', en: 'Ad-lib with both motifs' },
  },
})}

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en, manual_completion_disabled
) VALUES
  (
    ${uuid('mq-b2-q1-lesson')},
    '${MAIN_COURSE_ID}'::uuid,
    'クエスト1：ド・ミ♭・ファでアドリブしよう',
    'Quest 1: Ad-lib with C, Eb, F',
    'モチーフとコールアンドレスポンス。ド・ミ♭・ファで返す。',
    'Motifs and call-and-response with C, Eb, and F.',
    false, 0, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    'ド・ミ♭・ファで短いモチーフを作りましょう。',
    'Build short motifs with C, Eb, and F.',
    false
  ),
  (
    ${uuid('mq-b2-q2-lesson')},
    '${MAIN_COURSE_ID}'::uuid,
    'クエスト2：ソ・シ♭・ドでアドリブしよう',
    'Quest 2: Ad-lib with G, Bb, C',
    '別の3音グループで同じ練習。',
    'The same practice with another three-note group.',
    false, 1, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    'ソ・シ♭・ドでモチーフを作りましょう。',
    'Build motifs with G, Bb, and C.',
    false
  ),
  (
    ${uuid('mq-b2-q3-lesson')},
    '${MAIN_COURSE_ID}'::uuid,
    'クエスト3：2つのモチーフで会話しよう',
    'Quest 3: Converse with two motifs',
    '2つのモチーフを組み合わせて問いと答えを作る。',
    'Combine two motifs into question and answer.',
    false, 2, 2,
    'Cブルース：モチーフでアドリブしよう', 'C Blues: Ad-lib with Motifs',
    'モチーフを使ったアドリブに挑戦する。',
    'Challenge ad-lib with motifs.',
    '[]'::jsonb,
    '2つのモチーフで会話するアドリブを試しましょう。',
    'Try ad-lib that converses with two motifs.',
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
  title, title_en
) VALUES
  (
    ${uuid('mq-b2-q1-1-lsong')}, ${uuid('mq-b2-q1-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b2-q1-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-1. ド・ミ♭・ファでまねしよう', '1-1. Copy C Eb F'
  ),
  (
    ${uuid('mq-b2-q1-2-lsong')}, ${uuid('mq-b2-q1-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, ${uuid('mq-b2-q1-2-adlib-stage')},
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-2. ド・ミ♭・ファでアドリブ', '1-2. Ad-lib C Eb F'
  ),
  (
    ${uuid('mq-b2-q2-1-lsong')}, ${uuid('mq-b2-q2-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b2-q2-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '2-1. ソ・シ♭・ドでまねしよう', '2-1. Copy G Bb C'
  ),
  (
    ${uuid('mq-b2-q2-2-lsong')}, ${uuid('mq-b2-q2-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, ${uuid('mq-b2-q2-2-adlib-stage')},
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '2-2. ソ・シ♭・ドでアドリブ', '2-2. Ad-lib G Bb C'
  ),
  (
    ${uuid('mq-b2-q3-1-lsong')}, ${uuid('mq-b2-q3-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b2-q3-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-1. モチーフのデモと一緒に弾く', '3-1. Motif demo and play-along'
  ),
  (
    ${uuid('mq-b2-q3-2-lsong')}, ${uuid('mq-b2-q3-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, ${uuid('mq-b2-q3-2-osmd-stage')},
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-2. 譜面どおりに演奏', '3-2. Play from the score'
  ),
  (
    ${uuid('mq-b2-q3-3-lsong')}, ${uuid('mq-b2-q3-lesson')}, NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b2-q3-bridge-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-3. 最終課題の説明', '3-3. Final task briefing'
  ),
  (
    ${uuid('mq-b2-q3-4-lsong')}, ${uuid('mq-b2-q3-lesson')}, NULL, 3,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, ${uuid('mq-b2-q3-4-adlib-stage')},
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-4. 2つのモチーフでアドリブ', '3-4. Ad-lib with two motifs'
  )
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
  title_en = EXCLUDED.title_en;

UPDATE public.courses
SET
  description = 'ジャズ初心者が順番に進める一本道のコース。Cブルースから、モチーフでアドリブへ。',
  description_en = 'A step-by-step path for jazz beginners. From C blues to ad-lib with motifs.',
  updated_at = now()
WHERE id = '${MAIN_COURSE_ID}'::uuid;

COMMIT;
`;

writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
