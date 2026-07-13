import type {
  EarTrainingTutorialOsmdTimedLine,
  EarTrainingTutorialScriptPayload,
  EarTrainingTutorialUiOverrides,
} from './earTrainingTutorialScriptTypes';

/** MQ B1 Q1 と同一の MusicXML / MP3 / BPM / 小節数（タイミング調整専用台本） */
export const OSMD_TIMING_ADJUSTMENT_SCRIPT_ID = 'osmd-timing-adjustment-v1';

export const OSMD_TIMING_ADJUSTMENT_CONTENT_REF = 'osmd-timing-adjustment';
export const OSMD_TIMING_MQ_TUTORIAL_CONTENT_REF = 'mq-b1-q1-osmd';

const MQ_B1_Q1_OSMD_TIMED_LINES: EarTrainingTutorialOsmdTimedLine[] = Array.from(
  { length: 24 },
  (_, index) => {
    const measure = index + 2;
    const isListen = measure % 2 === 0;
    return {
      at: { loop: 0, measure, beat: 1 },
      text: isListen
        ? { ja: '聴く', en: 'Listen' }
        : { ja: '返す（ドとソ）', en: 'Answer (Do & Sol)' },
    };
  },
);

/** タイミング調整シーン用 UI（キャリブレーション） */
export const timingCalibrationUi = (): EarTrainingTutorialUiOverrides => ({
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideLobby: true,
  hideMidiToggle: true,
  hidePhraseIntroQuota: true,
  showExitButton: false,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: false,
});

/** MQ 1-1 OSMD チュートリアル用 UI（聴く/返す・無敵） */
export const mqOsmdTutorialUi = (): EarTrainingTutorialUiOverrides => ({
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideLobby: true,
  hideMidiToggle: true,
  hidePhraseIntroQuota: true,
  showExitButton: false,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: true,
});

export const resolveTimingAdjustmentSceneUi = (
  contentRef: string,
): EarTrainingTutorialUiOverrides => {
  if (contentRef === OSMD_TIMING_ADJUSTMENT_CONTENT_REF) {
    return timingCalibrationUi();
  }
  return mqOsmdTutorialUi();
};

export const isTimingCalibrationContentRef = (contentRef: string): boolean => (
  contentRef === OSMD_TIMING_ADJUSTMENT_CONTENT_REF
);

export const buildOsmdTimingAdjustmentV1Script = (): EarTrainingTutorialScriptPayload => ({
  version: 1,
  audioTracks: {
    drum_loop: {
      url: 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3',
      volume: 0.5,
    },
  },
  ui: timingCalibrationUi(),
  content: {
    [OSMD_TIMING_ADJUSTMENT_CONTENT_REF]: {
      stage: {
        slug: OSMD_TIMING_ADJUSTMENT_CONTENT_REF,
        title: 'OSMDタイミング調整',
        title_en: 'OSMD Timing Adjustment',
        bpm: 100,
        key_fifths: 0,
        beats_per_measure: 4,
        beat_type: 4,
        loop_measures: 25,
        max_loops_per_phrase: 1,
        count_in_beats: 0,
        time_limit_sec: 600,
        player_hp: 100,
        enemy_hp: 10000,
        per_correct_note_damage: 0,
        good_completion_damage: 0,
        miss_damage: 0,
        fail_damage: 0,
        background_theme: 'blue_club',
        mode: 'chord_osmd',
        show_keyboard_hints_in_battle: false,
        osmd_targets_from_score: true,
        is_swing: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'Cブルース・タイミング調整',
          title_en: 'C Blues timing adjustment',
          music_xml_url: 'https://jazzify-cdn.com/sozai/1-1_count-in.musicxml',
          audio_url: 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3',
          loop_duration_sec: 60,
          audio_duration_sec: 60,
          note_count: 24,
          key_fifths: 0,
        },
      ],
    },
    [OSMD_TIMING_MQ_TUTORIAL_CONTENT_REF]: {
      stage: {
        slug: OSMD_TIMING_MQ_TUTORIAL_CONTENT_REF,
        title: 'ドとソをまねしよう',
        title_en: 'Copy Do and Sol',
        bpm: 100,
        key_fifths: 0,
        beats_per_measure: 4,
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
          title: 'Cブルース・ドとソ',
          title_en: 'C Blues Do/Sol',
          music_xml_url: 'https://jazzify-cdn.com/sozai/1-1.musicxml?v=20260623',
          audio_url: 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3?v=20260623',
          loop_duration_sec: 60,
          audio_duration_sec: 60,
          note_count: 24,
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
        {
          speaker: 'player',
          ja: 'ようこそJazzifyへ！',
          en: 'Welcome to Jazzify!',
        },
        {
          speaker: 'partner',
          ja: 'まずは、おぬしのデバイスのタイミング調整じゃ。',
          en: "First, let's calibrate the timing for your device.",
        },
        {
          speaker: 'partner',
          ja: '音が出るタイミングと、ハンマーが出るタイミングを合わせてくれ。',
          en: 'Match when the sound plays with when the hammer appears.',
        },
        {
          speaker: 'player',
          ja: 'わかった！合わせてみるよ。',
          en: "Got it! I'll line them up.",
        },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: OSMD_TIMING_ADJUSTMENT_CONTENT_REF,
      requiredLoops: 1,
      timedLines: [],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        {
          speaker: 'partner',
          ja: 'よし、タイミングは合わせられたかのう。',
          en: 'Good — you have the timing dialed in.',
        },
        {
          speaker: 'player',
          ja: 'うん、感覚つかめてきた！',
          en: 'Yeah, I am getting the feel of it!',
        },
        {
          speaker: 'partner',
          ja: 'では本題じゃ。この世界の話をしよう。',
          en: 'Now to the real matter. Let me tell you about this world.',
        },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        {
          speaker: 'partner',
          ja: 'ファイよ、この世界は音のチカラを失い、崩れかけておる。',
          en: 'Fai, this world has lost the power of sound and is crumbling.',
        },
        {
          speaker: 'player',
          ja: 'えっ、オレが何とかするの？',
          en: 'Wait — I have to fix this?',
        },
        {
          speaker: 'partner',
          ja: 'うむ。必要なのは、ジャズのチカラじゃ。',
          en: 'Aye. What we need is the power of jazz.',
        },
        {
          speaker: 'player',
          ja: 'ジャズって、むずかしそうだけど。',
          en: 'Jazz sounds pretty hard though.',
        },
        {
          speaker: 'partner',
          ja: '心配いらん。まず使う音は、ドとソだけじゃ。',
          en: 'Fear not. For now you only need Do and Sol.',
        },
        {
          speaker: 'player',
          ja: '2つだけなら、いけそう！',
          en: 'Only two notes — I can do that!',
        },
        {
          speaker: 'partner',
          ja: 'ワシの音を1小節聴き、次の1小節でまねするのじゃ。',
          en: 'Listen for one bar, then copy me in the next bar.',
        },
        {
          speaker: 'player',
          ja: 'まずは、ドとソをまねしてみよう。',
          en: "Let's start by copying Do and Sol.",
        },
      ],
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        {
          speaker: 'partner',
          ja: 'この章では、Cブルースに挑戦する。',
          en: 'In this chapter we take on the C blues.',
        },
        {
          speaker: 'player',
          ja: 'Cブルース？',
          en: 'C blues?',
        },
        {
          speaker: 'partner',
          ja: 'ジャズの入口にぴったりの流れじゃ。',
          en: 'A perfect entry into jazz.',
        },
        {
          speaker: 'player',
          ja: 'いきなり曲っぽいことするんだね。',
          en: 'So we jump into something song-like right away.',
        },
        {
          speaker: 'partner',
          ja: 'そうじゃ。読むより先に、聴いて、返して、手で覚えるのじゃ。',
          en: 'Aye. Hear, answer, and learn with your hands before reading.',
        },
        {
          speaker: 'player',
          ja: 'よし、まずは音で会話だ！',
          en: 'Alright — conversation with sound first!',
        },
        {
          speaker: 'player',
          ja: '流れる音を聴いて、次の小節で同じように返そう。',
          en: 'Listen to the music, then answer the same way in the next bar.',
        },
      ],
    },
    {
      type: 'chord_osmd',
      contentRef: OSMD_TIMING_MQ_TUTORIAL_CONTENT_REF,
      requiredLoops: 1,
      timedLines: MQ_B1_Q1_OSMD_TIMED_LINES,
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        {
          speaker: 'partner',
          ja: 'よし。ドとソで返事ができたのう。',
          en: 'Good. You answered with Do and Sol.',
        },
        {
          speaker: 'player',
          ja: 'タイミング調整のおかげだね！ちょっと音で会話してる感じがした！',
          en: 'The timing adjustment really helped — it felt like talking with sound!',
        },
        {
          speaker: 'partner',
          ja: '次は、コードの響きを覚える番じゃ。',
          en: 'Next, we learn chord colors.',
        },
        {
          speaker: 'player',
          ja: 'コードって、たくさんの音？',
          en: 'Chords — lots of notes?',
        },
        {
          speaker: 'partner',
          ja: 'いや、まずは2音だけでよい。C7、F7、G7じゃ。',
          en: 'No — two notes are enough. C7, F7, and G7.',
        },
        {
          speaker: 'player',
          ja: '次は、2音コードに挑戦しよう。',
          en: 'Next up: two-note chords.',
        },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});
