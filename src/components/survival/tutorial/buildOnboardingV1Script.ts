import type { TutorialScriptPayload } from './tutorialScriptTypes';
import { TUTORIAL_OVERRIDE_PRESETS } from './tutorialScriptPresets';

const ONBOARDING_G7_OFFSETS = [-104, -52, 0, 52, 104] as const;

/** onboarding-v1 を DB 投入可能な v2 台本 JSON に変換した定義 */
export function buildOnboardingV1Script(): TutorialScriptPayload {
  const progression = [
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
    },
    {
      name: 'CM7',
      voicing: [52, 55, 59, 62],
      voicingNames: ['E3', 'G3', 'B3', 'D4'],
      keyFifths: 0,
    },
  ];

  return {
    version: 2,
    audioTracks: {
      main_bgm: { resolveFrom: 'progression', defaultLoop: true, defaultVolume: 0.45 },
      drum_loop: {
        url: 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
        defaultLoop: true,
        defaultVolume: 0.35,
      },
    },
    stage: {
      name: 'オンボーディング ii-V-I',
      nameEn: 'Onboarding ii-V-I',
      stageType: 'progression',
      chordDisplayName: 'ii-V-I',
      chordDisplayNameEn: 'ii-V-I',
      chordProgression: progression,
      mapCategory: 'lesson',
      lessonOnly: true,
    },
    chords: {
      dm7: progression[0],
      g7: progression[1],
      cm7: progression[2],
      scene3_dm7: { name: 'Dm7', voicing: [60, 65], voicingNames: ['C4', 'F4'], keyFifths: 0 },
      scene3_g7: { name: 'G7', voicing: [59, 65], voicingNames: ['B3', 'F4'], keyFifths: 0 },
      scene3_cm7: { name: 'CM7', voicing: [59, 64], voicingNames: ['B3', 'E4'], keyFifths: 0 },
    },
    overridePresets: TUTORIAL_OVERRIDE_PRESETS,
    steps: [
      { type: 'audio', trackId: 'main_bgm', action: 'play', loop: true },
      { type: 'narration', clear: true },
      { type: 'overrides', preset: 'scene1' },
      { type: 'slot', aEnabled: false, bEnabled: true },
      {
        type: 'character',
        text: {
          ja: 'ジャズって難しそう？\nコードを覚えるのが難しい？',
          en: 'Jazz looks hard?\nChords feel hard to memorize?',
        },
      },
      { type: 'delay', seconds: 2 },
      {
        type: 'character',
        text: {
          ja: 'コードを弾くと、ワザが出る。遊んでいるうちに、ジャズの形が身につく。',
          en: 'Play a chord to unleash a move. As you play, jazz starts to stick.',
        },
      },
      { type: 'delay', seconds: 2 },
      {
        type: 'character',
        text: { ja: 'これがこのアプリの基本です。', en: "That's the foundation of this app." },
      },
      { type: 'delay', seconds: 2.2 },
      { type: 'character', text: { ja: '', en: '' } },
      {
        type: 'demoOneChord',
        chord: 'dm7',
        spawn: { kind: 'front', distance: 88 },
        attack: { slot: 'A' },
      },
      {
        type: 'demoOneChord',
        chord: 'g7',
        spawn: { kind: 'front', distance: 88 },
        attack: { slot: 'A' },
      },
      {
        type: 'demoOneChord',
        chord: 'cm7',
        spawn: { kind: 'ring', count: 12, radius: 180 },
        attack: { special: true },
      },
      { type: 'delay', seconds: 1.2 },
      { type: 'narration', clear: true },
      {
        type: 'character',
        text: { ja: 'キーボードを用意しよう。', en: "Let's get your keyboard ready." },
      },
      { type: 'overrides', preset: 'scene2' },
      { type: 'slot', clearBChord: true, bEnabled: false },
      { type: 'delay', seconds: 2 },
      {
        type: 'narration',
        text: {
          ja: 'MIDIキーボードを持っている人は接続してください。\nまだ持っていない人も大丈夫。画面鍵盤でそのまま試せます。',
          en: 'If you have a MIDI keyboard, connect it.\nNo keyboard yet? You can try with the on-screen one.',
        },
      },
      { type: 'keyboardSetup', midiWaitSeconds: 5 },
      { type: 'connectedDevice', text: null },
      { type: 'overrides', preset: 'scene3' },
      { type: 'slot', aEnabled: false, bEnabled: true, resetBCompletion: true },
      {
        type: 'chordFight',
        chord: 'scene3_dm7',
        spawn: { kind: 'front', distance: 80 },
        assistAttack: { slot: 'B' },
        completionAttack: { slot: 'B' },
        introCharacter: { ja: 'まずはDm7。下からCとF、2音だけ。', en: 'First, Dm7. Just C and F from the bottom.' },
        introDelaySeconds: 0.8,
        successCharacter: { ja: 'OK。', en: 'Nice.' },
        successDelaySeconds: 0.8,
        failCharacter: { ja: '大丈夫、次でもう一回。', en: 'No worries. Once more.' },
        failDelaySeconds: 1.4,
      },
      {
        type: 'chordFight',
        chord: 'scene3_g7',
        spawn: { kind: 'perpOffsets', distanceForward: 95, offsets: [...ONBOARDING_G7_OFFSETS] },
        assistAttack: { slot: 'A' },
        completionAttack: { slot: 'A' },
        introCharacter: { ja: '次はG7。下からBとF。', en: 'Next, G7. B and F from the bottom.' },
        introDelaySeconds: 0.8,
        successCharacter: { ja: 'いいね、ジャズになってきた', en: "Nice. That's starting to sound like jazz." },
        successDelaySeconds: 1.8,
        failCharacter: { ja: '大丈夫、次でもう一回。', en: 'No worries. Once more.' },
        failDelaySeconds: 1.4,
      },
      {
        type: 'chordFight',
        chord: 'scene3_cm7',
        spawn: { kind: 'ring', count: 12, radius: 190 },
        assistAttack: { special: true },
        completionAttack: null,
        useSpecial: true,
        introCharacter: {
          ja: '最後はCM7。下からBとEで着地しよう。',
          en: 'Last, CM7. Land on B and E from the bottom.',
        },
        introDelaySeconds: 0.8,
      },
      { type: 'character', text: { ja: '', en: '' } },
      { type: 'delay', seconds: 0.4 },
      { type: 'clearEnemies' },
      { type: 'slot', clearBChord: true, bEnabled: false, aEnabled: false },
      { type: 'overrides', preset: 'scene4Cleanup' },
      {
        type: 'character',
        text: { ja: '今の3つは、ジャズでよく出る進行。', en: 'Those three show up all the time in jazz.' },
      },
      { type: 'delay', seconds: 2 },
      {
        type: 'character',
        text: { ja: '"II-V-I（ツーファイブワン）"。', en: '"Two-Five-One" (II-V-I).' },
      },
      { type: 'delay', seconds: 2 },
      {
        type: 'character',
        text: {
          ja: '理屈はあとで追いつく。\nまずは、指で覚えよう。',
          en: 'Theory will catch up later.\nFirst, let your fingers learn it.',
        },
      },
      { type: 'delay', seconds: 2.2 },
      { type: 'overrides', preset: 'scene5' },
      {
        type: 'character',
        text: {
          ja: 'ここから少しずつ、できることが増えていくよ。',
          en: "From here, you'll slowly unlock more and more.",
        },
      },
      { type: 'delay', seconds: 2 },
      { type: 'character', text: { ja: '', en: '' } },
      {
        type: 'pillar',
        text: { ja: '使えるコードが増える。', en: "You'll grow your usable chords." },
        systemImage: 'music.note.list',
        imageAsset: 'onboarding_pillar_chords',
      },
      {
        type: 'pillar',
        text: { ja: 'リズムに乗れる。', en: "You'll ride the rhythm." },
        systemImage: 'metronome',
        imageAsset: 'onboarding_pillar_timing',
      },
      {
        type: 'pillar',
        text: { ja: '自分のフレーズで返せる。', en: "You'll answer with your own phrases." },
        systemImage: 'waveform',
        imageAsset: 'onboarding_pillar_phrase',
      },
      {
        type: 'character',
        text: {
          ja: '僕はファイ、君と一緒に冒険できることを楽しみにしているよ',
          en: "I'm Fai, and I can't wait to go on this adventure with you.",
        },
      },
      { type: 'delay', seconds: 2.5 },
      { type: 'showCta', show: true },
      { type: 'delay', seconds: 5 },
      { type: 'finish' },
    ],
  };
}
