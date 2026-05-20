import type { SurvivalTutorialScriptPayloadV3 } from './survivalTutorialV3ScriptTypes';
import { TUTORIAL_DRUM_LOOP_BGM_URL } from './tutorialDrumLoopBgm';

const PHRASE_BGM =
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3';

/** 開発者コース用: セリフのみ・プログレッション・ランダム・フレーズの v3 全パターンを1台本に集約。 */
export const buildSurvivalDeveloperFullV3Script = (): SurvivalTutorialScriptPayloadV3 => ({
  version: 3,
  audioTracks: {
    drum_loop: { url: TUTORIAL_DRUM_LOOP_BGM_URL, volume: 0.35 },
  },
  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    hideMidiToggle: true,
    showExitButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },
  content: {
    'prog-test': {
      stage: {
        name: 'v3・プログレッション',
        nameEn: 'v3 progression',
        stageType: 'progression',
        mapCategory: 'lesson',
        chordDisplayName: 'II-V（テスト）',
        chordDisplayNameEn: 'II–V (test)',
        lessonOnly: true,
      },
      chordProgression: [
        {
          name: 'Dm7',
          voicing: [53, 57, 60, 64],
          voicingNames: ['F3', 'A3', 'C4', 'E4'],
          keyFifths: 0,
        },
        {
          name: 'G7',
          voicing: [53, 57, 59, 64],
          voicingNames: ['F3', 'A3', 'B3', 'E4'],
          keyFifths: 0,
          voicing_staves: [2, 2, 1, 1],
        },
      ],
    },
    'rand-test': {
      stage: {
        name: 'v3・ランダム',
        nameEn: 'v3 random',
        stageType: 'random',
        mapCategory: 'lesson',
        chordDisplayName: 'ランダム検証',
        chordDisplayNameEn: 'Random QA',
        lessonOnly: true,
      },
      randomChordPoolEasy: [
        {
          name: 'Dm7',
          voicing: [53, 57, 60, 64],
          voicingNames: ['F3', 'A3', 'C4', 'E4'],
          keyFifths: 0,
        },
      ],
      randomChordPoolHard: [
        {
          name: 'CM7(9)',
          voicing: [52, 57, 59, 62, 66],
          voicingNames: ['E3', 'A3', 'B3', 'D4', 'F#4'],
          keyFifths: 0,
        },
      ],
    },
    'phrase-ii-v-i': {
      stage: {
        name: 'v3・フレーズ',
        nameEn: 'v3 phrase',
        stageType: 'progression',
        mapCategory: 'phrases',
        chordDisplayName: 'II-V-I',
        chordDisplayNameEn: 'II-V-I',
        lessonOnly: true,
      },
      phrases: [
        {
          order_index: 0,
          title: 'II-V-I（1小節×3）',
          title_en: 'II-V-I (3 measures)',
          audio_url: PHRASE_BGM,
          loop_duration_sec: 8,
          key_fifths: 0,
          chords: [
            {
              name: 'Dm7',
              measure_number: 1,
              voicing: [53, 57, 60, 64],
              voicingNames: ['F3', 'A3', 'C4', 'E4'],
              voicing_staves: [2, 2, 2, 1],
              keyFifths: 0,
              quote: {
                ja: 'II（Dm7）。ヴォイシングを順番に。',
                en: 'Dm7 — play voicing notes in order.',
              },
            },
            {
              name: 'G7',
              measure_number: 2,
              voicing: [53, 57, 59, 64],
              voicingNames: ['F3', 'A3', 'B3', 'E4'],
              voicing_staves: [2, 2, 2, 1],
              keyFifths: 0,
            },
            {
              name: 'CM7',
              measure_number: 3,
              voicing: [52, 55, 59, 62],
              voicingNames: ['E3', 'G3', 'B3', 'D4'],
              voicing_staves: [2, 2, 2, 2],
              keyFifths: 0,
              quote: {
                ja: 'I（CM7）。最後まで！',
                en: 'CM7 — finish!',
              },
            },
          ],
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
          ja: 'サバイバルチュートリアル v3（開発者向け）。',
          en: 'Survival tutorial v3 (developer).',
        },
        {
          ja: 'セリフのみ・プログレッション・ランダム・フレーズを順に試します。',
          en: 'We will try dialogue, progression, random, and phrase.',
        },
      ],
    },
    {
      type: 'progression_battle',
      contentRef: 'prog-test',
      loopCount: 2,
      introDelaySeconds: 4,
      dialogue: {
        intro: { ja: 'プログレッション。タップでスキップできます。', en: 'Progression. Tap to skip intro.' },
        onReveal: { ja: 'このコードを演奏！', en: 'Play this chord!' },
        onCorrectRemaining: { ja: 'OK、あと{{remaining}}問。', en: 'OK, {{remaining}} left.' },
      },
    },
    {
      type: 'random_battle',
      contentRef: 'rand-test',
      questionCount: 1,
      hardQuestions: true,
      introDelaySeconds: 4,
      dialogue: {
        intro: { ja: '難問ランダム（テスト）。', en: 'Hard random (test).' },
        onReveal: { ja: '難問だ。演奏！', en: 'Hard one — play!' },
        onCorrectRemaining: { ja: 'OK、あと{{remaining}}問。', en: 'OK, {{remaining}} left.' },
      },
    },
    {
      type: 'phrase_battle',
      contentRef: 'phrase-ii-v-i',
      requiredLoops: 1,
      introDelaySeconds: 5,
      dialogue: {
        intro: {
          ja: 'フレーズモード（フレーズBGM）。',
          en: 'Phrase mode (phrase BGM).',
        },
        onReveal: { ja: '1小節ずつ入力。', en: 'Enter one measure at a time.' },
        onCorrectRemaining: {
          ja: 'OK、あと{{remaining}}ループ。',
          en: 'OK, {{remaining}} loops left.',
        },
      },
    },
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [{ ja: '以上です。「完了」をタップでクリアになります。', en: 'Done. Tap complete to finish.' }],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});
