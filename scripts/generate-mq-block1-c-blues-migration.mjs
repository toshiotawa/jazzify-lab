/**
 * メインクエスト Block1（Cブルース）の Supabase マイグレーション SQL を生成する。
 *
 * Usage:
 *   node scripts/generate-mq-block1-c-blues-migration.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'supabase', 'migrations', '20260615120000_mq_block1_c_blues_developer_test.sql');

const NS = 'a0000000-0000-4000-8000-000000000001';
const COURSE_KEY = 'course-developer-test';
const CDN = 'https://jazzify-cdn.com/sozai';
const CBLUES = `${CDN}/Cblues_24bars_100BPM.mp3`;
const CBLUES_DRUM = `${CDN}/Cblues_24bars_100BPM_Drum.mp3`;
const XML_1_1 = `${CDN}/1-1.musicxml`;
const XML_2_3 = `${CDN}/2-3.musicxml`;
const BPM = 100;
const BEATS_PER_MEASURE = 4;
const MEASURE_SEC = (60 / BPM) * BEATS_PER_MEASURE;
const LOOP_24_SEC = 57.6;

const BLUES_CHORD_NAMES = [
  'C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7',
  'G7', 'F7', 'C7', 'G7', 'C7', 'F7', 'C7', 'C7',
  'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7',
];

/** @type {Record<string, { midi: number[]; names: string[] }>} */
const GUIDE_VOICINGS = {
  C7: { midi: [64, 70], names: ['E4', 'B♭4'] },
  F7: { midi: [63, 69], names: ['E♭4', 'A4'] },
  G7: { midi: [65, 71], names: ['F4', 'B4'] },
};

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

/** @param {string} name */
function guideChordDef(name) {
  const g = GUIDE_VOICINGS[name];
  return {
    name,
    voicing: g.midi,
    voicingNames: g.names,
    keyFifths: 0,
    voicing_staves: [1, 1],
  };
}

function bluesProgressionDefs() {
  return BLUES_CHORD_NAMES.map((name) => guideChordDef(name));
}

function bluesProgressionSurvival() {
  return bluesProgressionDefs().map((c) => ({
    name: c.name,
    voicing: c.voicing,
    voicingNames: c.voicingNames,
    keyFifths: 0,
    voicing_staves: c.voicing_staves,
  }));
}

/** @param {number} measureNumber @param {boolean} listen */
function measureTiming(measureNumber) {
  const start = (measureNumber - 1) * MEASURE_SEC;
  return {
    measure_number: measureNumber,
    beat_offset: 1,
    duration_beats: 4,
    start_time_sec: start,
    end_time_sec: start + MEASURE_SEC,
  };
}

function buildOsmdChords24() {
  return BLUES_CHORD_NAMES.map((name, i) => {
    const m = i + 1;
    const listen = m % 2 === 1;
    const t = measureTiming(m);
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
      chord_name: 'C/G',
      ...t,
      voicing: ['C4', 'G4'],
      voicing_staves: [1, 1],
    };
  });
}

function buildAdlibChords24() {
  return BLUES_CHORD_NAMES.map((name, i) => {
    const m = i + 1;
    const listen = m % 2 === 1;
    const t = measureTiming(m);
    if (listen) {
      return {
        order_index: i,
        chord_name: '—',
        ...t,
        voicing: [],
        voicing_staves: [],
        input_disabled: true,
        quote: m === 1 ? { ja: '聴く', en: 'Listen' } : undefined,
      };
    }
    return {
      order_index: i,
      chord_name: 'C/G',
      ...t,
      voicing: ['C4', 'G4'],
      voicing_staves: [1, 1],
      quote: m === 2 ? { ja: '返す', en: 'Response' } : undefined,
    };
  });
}

function buildVoicingChords24() {
  return BLUES_CHORD_NAMES.map((name, i) => {
    const g = GUIDE_VOICINGS[name];
    const t = measureTiming(i + 1);
    return {
      order_index: i,
      chord_name: name,
      ...t,
      voicing: g.names,
      voicing_staves: [1, 1],
    };
  });
}

function buildOsmdRhythmChords24() {
  return BLUES_CHORD_NAMES.map((name, i) => {
    const g = GUIDE_VOICINGS[name];
    const t = measureTiming(i + 1);
    return {
      order_index: i,
      chord_name: name,
      ...t,
      voicing: g.names,
      voicing_staves: [1, 1],
    };
  });
}

const mqB1Q1OsmdScript = {
  version: 1,
  audioTracks: {
    drum_loop: { url: CBLUES, volume: 0.5 },
  },
  ui: earTutorialUi,
  content: {
    'mq-b1-q1-osmd': {
      stage: {
        slug: 'mq-b1-q1-osmd',
        title: 'ドとソをまねしよう',
        title_en: 'Copy Do and Sol',
        bpm: BPM,
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
        show_keyboard_hints_in_battle: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'Cブルース・ドとソ',
          title_en: 'C Blues Do/Sol',
          music_xml_url: XML_1_1,
          audio_url: CBLUES,
          loop_duration_sec: LOOP_24_SEC,
          audio_duration_sec: LOOP_24_SEC,
          note_count: 24,
          key_fifths: 0,
          chords: buildOsmdChords24(),
        },
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'ファイよ、この世界は音のチカラを失い、崩れかけておる。', en: 'Fai, this world has lost the power of sound and is crumbling.' },
        { speaker: 'player', ja: 'えっ、オレが何とかするの？', en: 'Wait — I have to fix this?' },
        { speaker: 'partner', ja: 'うむ。必要なのは、ジャズのチカラじゃ。', en: 'Aye. What we need is the power of jazz.' },
        { speaker: 'player', ja: 'ジャズって、むずかしそうだけど。', en: 'Jazz sounds pretty hard though.' },
        { speaker: 'partner', ja: '心配いらん。まず使う音は、ドとソだけじゃ。', en: 'Fear not. For now you only need Do and Sol.' },
        { speaker: 'player', ja: '2つだけなら、いけそう！', en: 'Only two notes — I can do that!' },
        { speaker: 'partner', ja: 'ワシの音を1小節聴き、次の1小節でまねするのじゃ。', en: 'Listen for one bar, then copy me in the next bar.' },
        { speaker: 'player', ja: 'まずは、ドとソをまねしてみよう。', en: "Let's start by copying Do and Sol." },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'このコースでは、Cブルースに挑戦する。', en: 'In this course we take on the C blues.' },
        { speaker: 'player', ja: 'Cブルース？', en: 'C blues?' },
        { speaker: 'partner', ja: 'ジャズの入口にぴったりの流れじゃ。', en: 'A perfect entry into jazz.' },
        { speaker: 'player', ja: 'いきなり曲っぽいことするんだね。', en: 'So we jump into something song-like right away.' },
        { speaker: 'partner', ja: 'そうじゃ。読むより先に、聴いて、返して、手で覚えるのじゃ。', en: 'Aye. Hear, answer, and learn with your hands before reading.' },
        { speaker: 'player', ja: 'よし、まずは音で会話だ！', en: 'Alright — conversation with sound first!' },
        { speaker: 'player', ja: '流れる音を聴いて、次の小節で同じように返そう。', en: 'Listen to the music, then answer the same way in the next bar.' },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: '上の楽譜が進む。光る音をよく見るのじゃ。', en: 'The score above moves. Watch the highlighted notes.' },
        { speaker: 'player', ja: '聴くところと、弾くところが交互に来るんだね。', en: 'Listen bars and play bars alternate.' },
        { speaker: 'partner', ja: 'うむ。聴く小節では聴く。返す小節で弾く。', en: 'Aye. Listen on listen bars. Play on answer bars.' },
        { speaker: 'player', ja: 'あわてず、ドとソをねらえばいいんだな。', en: 'No rush — just aim for Do and Sol.' },
        { speaker: 'player', ja: '1小節聴いて、1小節まねしよう。', en: 'One bar listen, one bar copy.' },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: 'mq-b1-q1-osmd',
      requiredLoops: 1,
      timedLines: [
        { at: { loop: 0, measure: 1, beat: 1 }, text: { ja: '聴く', en: 'Listen' } },
        { at: { loop: 0, measure: 2, beat: 1 }, text: { ja: '返す（ドとソ）', en: 'Answer (Do & Sol)' } },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'よし。ドとソで返事ができたのう。', en: 'Good. You answered with Do and Sol.' },
        { speaker: 'player', ja: 'ちょっと音で会話してる感じがした！', en: 'It felt like talking with sound!' },
        { speaker: 'partner', ja: '次は、まねるだけではない。', en: "Next, you won't only copy." },
        { speaker: 'player', ja: 'じゃあ、どうするの？', en: 'So what do I do?' },
        { speaker: 'partner', ja: 'ドとソだけで、自分の返事を弾くのじゃ。', en: 'Answer in your own way with just Do and Sol.' },
        { speaker: 'player', ja: '次は、ドとソで自由にアドリブしよう。', en: 'Next up: ad-lib with Do and Sol.' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB1Q2SurvivalScript = {
  version: 3,
  audioTracks: {
    drum_loop: { url: CBLUES_DRUM, volume: 0.5 },
  },
  ui: survivalTutorialUi,
  scenarioOverrides: survivalScenarioAlwaysStaff,
  content: {
    'mq-b1-q2-random': {
      stage: {
        name: '2音コード',
        nameEn: 'Two-note chords',
        stageType: 'random',
        mapCategory: 'lesson',
        chordDisplayName: 'C7 / F7 / G7',
        chordDisplayNameEn: 'C7 / F7 / G7',
        lessonOnly: true,
      },
      randomChordPoolEasy: [
        guideChordDef('C7'),
        guideChordDef('F7'),
        guideChordDef('G7'),
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'アドリブには、土台となる響きがある。', en: 'Ad-lib needs a harmonic foundation.' },
        { speaker: 'fai', ja: 'それがコード？', en: 'You mean chords?' },
        { speaker: 'jajii', ja: 'そうじゃ。今日はC7、F7、G7を使う。', en: 'Aye. Today we use C7, F7, and G7.' },
        { speaker: 'fai', ja: '全部の音を弾くの？', en: 'Do I play every note?' },
        { speaker: 'jajii', ja: 'いや、まずは2音だけでよい。2音でもコードの性格は出る。', en: 'No — two notes are enough. They still show the chord color.' },
        { speaker: 'fai', ja: '少ない音で、響きを作るんだな。', en: 'So we build the sound with fewer notes.' },
        { speaker: 'fai', ja: 'C7、F7、G7の2音コードを覚えよう。', en: "Let's learn the two-note C7, F7, and G7 shapes." },
      ],
    },
    {
      type: 'random_battle',
      contentRef: 'mq-b1-q2-random',
      questionCount: 3,
      hardQuestions: false,
      introDelaySeconds: 3,
      dialogue: {
        intro: { ja: 'C7、F7、G7の2音を覚えるのじゃ。', en: 'Learn the two-note C7, F7, and G7 shapes.' },
        onReveal: { ja: 'この響きを演奏！', en: 'Play this sound!' },
        onCorrectRemaining: { ja: 'OK、あと{{remaining}}問。', en: 'OK, {{remaining}} left.' },
      },
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'よし。コードの響きが見えてきたのう。', en: 'Good. You can hear the chord colors now.' },
        { speaker: 'fai', ja: '2音だけでも、けっこう雰囲気出るね。', en: 'Two notes still feel pretty jazzy.' },
        { speaker: 'jajii', ja: '次は、C7とF7をすばやく見分けて弾くのじゃ。', en: 'Next, tell C7 and F7 apart and play them quickly.' },
        { speaker: 'fai', ja: 'C7とF7のコードランに進もう。', en: 'On to the C7/F7 chord run.' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB1Q3SurvivalScript = {
  version: 3,
  audioTracks: {
    drum_loop: { url: CBLUES_DRUM, volume: 0.5 },
  },
  ui: survivalTutorialUi,
  scenarioOverrides: survivalScenarioAlwaysStaff,
  content: {
    'mq-b1-q3-progression': {
      stage: {
        name: 'Cブルース進行',
        nameEn: 'C blues progression',
        stageType: 'progression',
        mapCategory: 'lesson',
        chordDisplayName: 'Cブルース',
        chordDisplayNameEn: 'C blues',
        lessonOnly: true,
      },
      chordProgression: bluesProgressionSurvival(),
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'コードは単体で覚えるだけでは足りん。', en: 'Chords alone are not enough.' },
        { speaker: 'fai', ja: '曲の流れの中で弾くんだね。', en: 'We play them in the flow of a tune.' },
        { speaker: 'jajii', ja: 'そうじゃ。Cブルースの進行に合わせて、ゆっくり押してみよ。', en: 'Aye. Play slowly along the C blues changes.' },
        { speaker: 'fai', ja: 'まずは速さより、順番を覚える！', en: 'Order first — speed later!' },
        { speaker: 'jajii', ja: 'うむ。C7、F7、G7がどこで出るか感じるのじゃ。', en: 'Feel where C7, F7, and G7 appear.' },
        { speaker: 'fai', ja: 'Cブルースのコード進行を、ゆっくり弾こう。', en: "Let's play the C blues changes slowly." },
      ],
    },
    {
      type: 'progression_battle',
      contentRef: 'mq-b1-q3-progression',
      loopCount: 24,
      introDelaySeconds: 3,
      dialogue: {
        intro: { ja: 'ゆっくり、順番どおりに進むのじゃ。', en: 'Take it slow and follow the order.' },
        onReveal: { ja: 'このコードを演奏！', en: 'Play this chord!' },
        onCorrectRemaining: { ja: 'OK、あと{{remaining}}問。', en: 'OK, {{remaining}} left.' },
      },
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'jajii', ja: 'よし。コードの流れが少し見えてきたのう。', en: 'Good. The chord flow is coming into view.' },
        { speaker: 'fai', ja: 'C7、F7、G7が曲の中で動いてる感じがした！', en: 'I felt C7, F7, and G7 moving through the tune!' },
        { speaker: 'jajii', ja: '次は、その流れを最初から最後まで通して聴くぞ。', en: 'Next, hear that flow from start to finish.' },
        { speaker: 'fai', ja: 'Cブルースを1周通して弾こう。', en: "Let's play through one chorus of C blues." },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB1Q3VoicingScript = {
  version: 1,
  audioTracks: {
    drum_loop: { url: CBLUES, volume: 0.35 },
  },
  ui: earTutorialUi,
  content: {
    'mq-b1-q3-voicing': {
      stage: {
        slug: 'mq-b1-q3-voicing',
        title: 'Cブルースを通して弾く',
        title_en: 'Play through C blues',
        bpm: BPM,
        key_fifths: 0,
        beats_per_measure: BEATS_PER_MEASURE,
        beat_type: 4,
        loop_measures: 24,
        max_loops_per_phrase: 2,
        count_in_beats: 0,
        time_limit_sec: 600,
        player_hp: 100,
        enemy_hp: 10000,
        miss_damage: 0,
        fail_damage: 0,
        background_theme: 'blue_club',
        mode: 'chord_voicing',
        chord_voicing_self_paced: true,
        show_keyboard_hints_in_battle: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'Cブルース 24小節',
          title_en: 'C blues 24 bars',
          audio_url: CBLUES,
          loop_duration_sec: LOOP_24_SEC,
          audio_duration_sec: LOOP_24_SEC,
          note_count: 0,
          key_fifths: 0,
          chords: buildVoicingChords24(),
        },
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'ここではCブルースを通して進む。', en: 'Here we move through the whole C blues.' },
        { speaker: 'player', ja: '途中で止まらず、最後まで行くんだね。', en: "Don't stop — go to the end." },
        { speaker: 'partner', ja: 'うむ。完璧でなくてよい。流れを止めないことが大事じゃ。', en: "Aye. Perfection isn't required. Keep the flow going." },
        { speaker: 'player', ja: '間違えても、次のコードに戻ればいいんだな。', en: 'If I miss one, I just catch the next chord.' },
        { speaker: 'partner', ja: 'その意気じゃ。耳で聴きながら、手で追いかけよ。', en: "That's the spirit. Listen and follow with your hands." },
        { speaker: 'player', ja: 'Cブルースを1周、コードで通して弾こう。', en: 'Play one chorus of C blues with the chord shapes.' },
      ],
    },
    {
      type: 'chord_voicing_self_paced',
      contentRef: 'mq-b1-q3-voicing',
      requiredSuccessfulLoops: 1,
      dialogue: {},
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: 'よし。ブルースの形がつながってきた。', en: 'Good. The blues shape is connecting.' },
        { speaker: 'player', ja: 'コードだけでも、曲っぽくなってきた！', en: 'Even chords alone sound like a tune now!' },
        { speaker: 'partner', ja: '次はリズムじゃ。1拍目だけをねらって弾く。', en: 'Next is rhythm — aim for beat one only.' },
        { speaker: 'player', ja: 'リズムに合わせて、1拍目だけコードを弾こう。', en: 'Hit the chords on beat one with the groove.' },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
};

const mqB1Q3OsmdScript = {
  version: 1,
  audioTracks: {
    drum_loop: { url: CBLUES, volume: 0.5 },
  },
  ui: earTutorialUi,
  content: {
    'mq-b1-q3-osmd': {
      stage: {
        slug: 'mq-b1-q3-osmd',
        title: '1拍目だけ弾く',
        title_en: 'Hit beat one',
        bpm: BPM,
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
        show_keyboard_hints_in_battle: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'Cブルース・1拍目',
          title_en: 'C blues beat one',
          music_xml_url: XML_2_3,
          audio_url: CBLUES,
          loop_duration_sec: LOOP_24_SEC,
          audio_duration_sec: LOOP_24_SEC,
          note_count: 24,
          key_fifths: 0,
          chords: buildOsmdRhythmChords24(),
        },
      ],
    },
  },
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: '今度は、リズムに合わせる練習じゃ。', en: 'Now we practice with the groove.' },
        { speaker: 'player', ja: '全部弾くんじゃなくて、1拍目だけ？', en: 'Not every beat — just beat one?' },
        { speaker: 'partner', ja: 'そうじゃ。まずは小節の頭を感じる。', en: 'Aye. Feel the top of each bar first.' },
        { speaker: 'player', ja: 'コードが変わる場所を、ちゃんと踏むんだね。', en: 'Land where the chords change.' },
        { speaker: 'partner', ja: 'うむ。ジャズは音だけでなく、時間に乗る音楽じゃ。', en: 'Jazz rides time, not just notes.' },
        { speaker: 'player', ja: 'リズムを聴いて、各小節の1拍目にコードを弾こう。', en: 'Listen and hit each chord on beat one.' },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: 'mq-b1-q3-osmd',
      requiredLoops: 1,
      timedLines: [
        { at: { loop: 0, measure: 1, beat: 1 }, text: { ja: '1拍目', en: 'Beat 1' } },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        { speaker: 'partner', ja: '見事じゃ。コードをリズムに乗せられたのう。', en: 'Well done. You rode the rhythm with your chords.' },
        { speaker: 'player', ja: 'ただ押すより、音楽っぽくなった！', en: 'It feels more musical than just pressing keys!' },
        { speaker: 'partner', ja: 'これでCブルースの土台はできた。', en: 'The foundation of C blues is in place.' },
        { speaker: 'player', ja: '次はもっと自由に弾けそう！', en: 'I feel ready to play more freely!' },
        { speaker: 'partner', ja: 'うむ。響きとリズムの上で、アドリブは育つのじゃ。', en: 'Aye. Ad-lib grows on harmony and rhythm.' },
        { speaker: 'player', ja: '次のクエストへ進もう。', en: 'On to the next quest.' },
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
  updated_at = now();
`;
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
  updated_at = now();
`;
}

const coderunProgression = [
  guideChordDef('C7'),
  guideChordDef('F7'),
  guideChordDef('C7'),
  guideChordDef('F7'),
  guideChordDef('C7'),
  guideChordDef('F7'),
  guideChordDef('C7'),
  guideChordDef('F7'),
].map((c) => ({
  name: c.name,
  voicing: c.voicing,
  voicing_names: c.voicingNames,
  key_fifths: 0,
  voicing_staves: c.voicing_staves,
}));

const runDialogue = {
  lines: [
    { atSeconds: 2, speaker: 'fai', text: 'C7とF7を弾こう', textEn: "Let's play C7 and F7." },
    { atSeconds: 8, speaker: 'jajii', text: '右に進むんじゃ', textEn: 'Head to the right.' },
    { atSeconds: 14, speaker: 'jajii', text: '2段ジャンプもできるぞ', textEn: 'You can double-jump too.' },
  ],
};

const sql = `-- メインクエスト Block1: Cブルースを弾いてみよう（開発者テストコース / block_number=1）
-- 生成: node scripts/generate-mq-block1-c-blues-migration.mjs
-- 事前: node scripts/upload-sozai-main-quest-block1-r2.mjs
BEGIN;

-- ---------------------------------------------------------------------------
-- チュートリアル台本
-- ---------------------------------------------------------------------------
${insertTutorialScript('mq-b1-q1-osmd-v1', 'MQ B1: ドとソをまねしよう', 'MQ B1: Copy Do and Sol', mqB1Q1OsmdScript)}
${insertSurvivalTutorialScript('mq-b1-q2-survival-v1', 'MQ B1: 2音コード', 'MQ B1: Two-note chords', mqB1Q2SurvivalScript)}
${insertSurvivalTutorialScript('mq-b1-q3-survival-v1', 'MQ B1: 進行をゆっくり', 'MQ B1: Slow progression', mqB1Q3SurvivalScript)}
${insertTutorialScript('mq-b1-q3-voicing-v1', 'MQ B1: Cブルース1周', 'MQ B1: One chorus C blues', mqB1Q3VoicingScript)}
${insertTutorialScript('mq-b1-q3-osmd-v1', 'MQ B1: 1拍目リズム', 'MQ B1: Beat-one rhythm', mqB1Q3OsmdScript)}

-- ---------------------------------------------------------------------------
-- 1-2 アドリブ本編ステージ
-- ---------------------------------------------------------------------------
DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = ${uuid('mq-b1-q1-2-adlib-phrase')};

DELETE FROM public.ear_training_phrases
WHERE id = ${uuid('mq-b1-q1-2-adlib-phrase')};

DELETE FROM public.ear_training_stages
WHERE id = ${uuid('mq-b1-q1-2-adlib-stage')};

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode, show_keyboard_hints_in_battle
) VALUES (
  ${uuid('mq-b1-q1-2-adlib-stage')},
  'mq-b1-q1-2-adlib',
  'ドとソでアドリブ',
  'Ad-lib with Do and Sol',
  'Cブルース上でドとソだけ自由に返す。聴く小節と返す小節が交互。',
  'Answer freely with Do and Sol on C blues. Listen and response bars alternate.',
  ${BPM}, 0, ${BEATS_PER_MEASURE}, 4, 24, 8,
  0, 300, 100, 2500,
  50, 12, 18, 24,
  0, 0, 4, 8,
  'blue_club', true, false, 'adlib', true
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  ${uuid('mq-b1-q1-2-adlib-phrase')},
  ${uuid('mq-b1-q1-2-adlib-stage')},
  0,
  'Cブルース・ドとソアドリブ',
  'C blues Do/Sol adlib',
  NULL,
  '${CBLUES}',
  ${LOOP_24_SEC},
  ${LOOP_24_SEC},
  0,
  0
);

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name, measure_number, beat_offset,
  duration_beats, start_time_sec, end_time_sec, voicing, voicing_staves, input_disabled
) VALUES
${buildAdlibChords24().map((c, i) => `  (
    ${uuid(`mq-b1-q1-2-adlib-c${i}`)},
    ${uuid('mq-b1-q1-2-adlib-phrase')},
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

-- ---------------------------------------------------------------------------
-- 2-2 コードラン（tutorial_3 マップ / C7⇔F7）
-- ---------------------------------------------------------------------------
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, run_map_id, run_time_limit_sec, run_dialogue_script,
  production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'basic',
  182,
  'progression',
  'code_run',
  'MQ B1: C7/F7コードラン',
  'MQ B1: C7/F7 chord run',
  'easy',
  '',
  'C7 / F7',
  'C7 / F7',
  NULL,
  '',
  '',
  'code_run',
  false,
  NULL,
  '${sqlJson(coderunProgression)}'::jsonb,
  true,
  'tutorial_3',
  120,
  '${sqlJson(runDialogue)}'::jsonb,
  'always',
  'always'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2-3 風船ラッシュ
-- ---------------------------------------------------------------------------
INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  ${uuid('mq-b1-balloon-stage')},
  'mq-b1-balloon-c7f7g7',
  'MQ B1: G7を追加（風船）',
  'MQ B1: Add G7 (balloon)',
  'C7/F7/G7の2音コードをランダム出題。2分以内に15個。',
  'Random two-note C7/F7/G7. Pop 15 balloons within 2 minutes.',
  'random',
  '7',
  NULL,
  '["C7","F7","G7"]'::jsonb,
  NULL,
  120,
  15,
  10,
  5,
  3,
  '${CBLUES_DRUM}',
  0,
  true,
  true,
  'always',
  'always',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  stage_type = EXCLUDED.stage_type,
  chord_suffix = EXCLUDED.chord_suffix,
  root_pattern = EXCLUDED.root_pattern,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- クエスト（lessons）×3
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  ${uuid('mq-b1-q1-lesson')},
  ${uuid(COURSE_KEY)},
  'クエスト1：ドとソでジャズの返事をしよう',
  'Quest 1: Answer jazz with Do and Sol',
  'Cブルース入門。ドとソだけで聴いて返し、アドリブへ。',
  'C blues intro. Hear and answer with Do and Sol, then ad-lib.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  'ドとソでジャズの返事を覚えましょう。',
  'Learn to answer jazz with Do and Sol.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = ${uuid(COURSE_KEY)}) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  ${uuid('mq-b1-q2-lesson')},
  ${uuid(COURSE_KEY)},
  'クエスト2：コードの2音を覚える',
  'Quest 2: Learn two-note chords',
  'C7/F7/G7の2音コード、コードラン、風船ラッシュ。',
  'Two-note C7/F7/G7, chord run, and balloon rush.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  '2音でもコードの響きを覚えましょう。',
  'Learn chord color with just two notes.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = ${uuid(COURSE_KEY)}) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  ${uuid('mq-b1-q3-lesson')},
  ${uuid(COURSE_KEY)},
  'クエスト3：ブルースのコード進行に乗る',
  'Quest 3: Ride the blues changes',
  '進行をゆっくり押し、1周通して、1拍目リズムへ。',
  'Slow changes, one chorus, then beat-one rhythm.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  'Cブルースのコード進行に乗りましょう。',
  'Ride the C blues chord changes.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = ${uuid(COURSE_KEY)}) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

-- ---------------------------------------------------------------------------
-- 課題（lesson_songs）×8
-- ---------------------------------------------------------------------------
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
    ${uuid('mq-b1-q1-1-lsong')}, ${uuid('mq-b1-q1-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q1-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-1. ドとソをまねしよう', '1-1. Copy Do and Sol'
  ),
  (
    ${uuid('mq-b1-q1-2-lsong')}, ${uuid('mq-b1-q1-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL,
    true, ${uuid('mq-b1-q1-2-adlib-stage')},
    false, NULL, false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '1-2. ドとソでアドリブしよう', '1-2. Ad-lib with Do and Sol'
  ),
  (
    ${uuid('mq-b1-q2-1-lsong')}, ${uuid('mq-b1-q2-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b1-q2-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '2-1. 2音でもコードの響きになる', '2-1. Two notes make a chord'
  ),
  (
    ${uuid('mq-b1-q2-2-lsong')}, ${uuid('mq-b1-q2-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, true, 182, 'basic', false, NULL,
    false, NULL, false, NULL, false, NULL,
    '{"bgmUrl":"${CBLUES_DRUM}"}'::jsonb, NULL, 'always', 'always',
    '2-2. C7とF7でコードラン', '2-2. C7/F7 chord run'
  ),
  (
    ${uuid('mq-b1-q2-3-lsong')}, ${uuid('mq-b1-q2-lesson')}, NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, false, NULL, true,
    (SELECT id FROM public.balloon_rush_stages WHERE slug = 'mq-b1-balloon-c7f7g7'),
    NULL,
    '${sqlJson([
      guideChordDef('C7'),
      guideChordDef('F7'),
      guideChordDef('G7'),
    ].map((c) => ({
      name: c.name,
      voicing: c.voicing,
      voicingNames: c.voicingNames,
      voicingStaves: c.voicing_staves,
      keyFifths: 0,
    })))}'::jsonb,
    'always', 'always',
    '2-3. G7を追加しよう', '2-3. Add G7'
  ),
  (
    ${uuid('mq-b1-q3-1-lsong')}, ${uuid('mq-b1-q3-lesson')}, NULL, 0,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    false, NULL, true, 'mq-b1-q3-survival-v1', false, NULL, NULL, NULL, NULL, NULL,
    '3-1. コード進行をゆっくり押す', '3-1. Slow chord changes'
  ),
  (
    ${uuid('mq-b1-q3-2-lsong')}, ${uuid('mq-b1-q3-lesson')}, NULL, 1,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q3-voicing-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-2. Cブルースを通して弾く', '3-2. Play through C blues'
  ),
  (
    ${uuid('mq-b1-q3-3-lsong')}, ${uuid('mq-b1-q3-lesson')}, NULL, 2,
    '{"count":1,"rank":"C"}'::jsonb,
    false, NULL, false, NULL, NULL, false, NULL,
    true, 'mq-b1-q3-osmd-v1', false, NULL, false, NULL, NULL, NULL, NULL, NULL,
    '3-3. リズムに合わせて1拍目だけ弾く', '3-3. Hit beat one'
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
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
  title_en = EXCLUDED.title_en;

COMMIT;
`;

writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
