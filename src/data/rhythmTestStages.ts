/**
 * リズムモードテスト用ステージデータ
 * demo-1.mp3を使用したハードコーディングされたステージ
 */

import { FantasyStage } from '@/types';

// テスト用ステージデータ
export const rhythmTestStages: FantasyStage[] = [
  // T-01: 4/4 BPM120 bars=32 Random
  {
    id: 'rhythm-test-01',
    stage_number: 'RT-01',
    name: 'リズムテスト 4/4 Random',
    description: '4/4拍子、BPM120、32小節、ランダムパターン',
    max_hp: 10,
    enemy_gauge_seconds: 4, // 1小節 = 2秒なので、2小節分
    enemy_count: 1,
    enemy_hp: 5,
    min_damage: 3,
    max_damage: 5,
    mode: 'single',
    allowed_chords: ['C', 'F', 'G', 'Am', 'Em', 'Dm'],
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 1,
    monster_icon: 'monster_01',
    // リズムモード専用フィールド
    gameMode: 'rhythm',
    pattern_type: 'random',
    music_meta: {
      bpm: 120,
      timeSig: 4,
      bars: 32
    },
    audio_url: '/demo-1.mp3'
  },

  // T-02: 4/4 BPM80 bars=8 Random
  {
    id: 'rhythm-test-02',
    stage_number: 'RT-02',
    name: 'リズムテスト Slow Random',
    description: '4/4拍子、BPM80、8小節、ランダムパターン',
    max_hp: 10,
    enemy_gauge_seconds: 6, // 1小節 = 3秒なので、2小節分
    enemy_count: 1,
    enemy_hp: 3,
    min_damage: 2,
    max_damage: 4,
    mode: 'single',
    allowed_chords: ['C', 'G', 'Am', 'F'],
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 1,
    monster_icon: 'monster_02',
    gameMode: 'rhythm',
    pattern_type: 'random',
    music_meta: {
      bpm: 80,
      timeSig: 4,
      bars: 8
    },
    audio_url: '/demo-1.mp3'
  },

  // T-03: 3/4 BPM90 bars=24 Progression
  {
    id: 'rhythm-test-03',
    stage_number: 'RT-03',
    name: 'リズムテスト 3/4 Progression',
    description: '3/4拍子、BPM90、24小節、プログレッションパターン',
    max_hp: 10,
    enemy_gauge_seconds: 4, // 約2小節分
    enemy_count: 3,
    enemy_hp: 4,
    min_damage: 2,
    max_damage: 4,
    mode: 'progression',
    allowed_chords: ['C', 'Am', 'F', 'G', 'Em'],
    chord_progression: ['C', 'Am', 'F', 'G', 'Em'], // 5コード（3の倍数でない）
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 3,
    monster_icon: 'monster_03',
    gameMode: 'rhythm',
    pattern_type: 'progression',
    music_meta: {
      bpm: 90,
      timeSig: 3,
      bars: 24
    },
    audio_url: '/demo-1.mp3'
  },

  // T-04: 4/4 BPM140 bars=6 Progression
  {
    id: 'rhythm-test-04',
    stage_number: 'RT-04',
    name: 'リズムテスト Fast Progression',
    description: '4/4拍子、BPM140、6小節、プログレッションパターン',
    max_hp: 10,
    enemy_gauge_seconds: 3.5, // 約2小節分
    enemy_count: 4,
    enemy_hp: 6,
    min_damage: 3,
    max_damage: 5,
    mode: 'progression',
    allowed_chords: ['C', 'G', 'Am', 'F', 'Dm', 'Em'],
    chord_progression: ['C', 'G', 'Am', 'F', 'Dm', 'Em'], // 6コード（4の倍数でない）
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 4,
    monster_icon: 'monster_04',
    gameMode: 'rhythm',
    pattern_type: 'progression',
    music_meta: {
      bpm: 140,
      timeSig: 4,
      bars: 6
    },
    audio_url: '/demo-1.mp3'
  },

  // T-05: クロスフェード境界テスト
  {
    id: 'rhythm-test-05',
    stage_number: 'RT-05',
    name: 'リズムテスト Loop Test',
    description: 'ループ3周動作確認用（短い曲）',
    max_hp: 20,
    enemy_gauge_seconds: 2,
    enemy_count: 1,
    enemy_hp: 3,
    min_damage: 1,
    max_damage: 2,
    mode: 'single',
    allowed_chords: ['C', 'F', 'G'],
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 1,
    monster_icon: 'monster_05',
    gameMode: 'rhythm',
    pattern_type: 'random',
    music_meta: {
      bpm: 120,
      timeSig: 4,
      bars: 4 // 非常に短い（8秒でループ）
    },
    audio_url: '/demo-1.mp3'
  },

  // T-06: Ready フェーズ入力無効確認
  {
    id: 'rhythm-test-06',
    stage_number: 'RT-06',
    name: 'リズムテスト Ready Phase',
    description: 'Readyフェーズ中の入力無効を確認',
    max_hp: 10,
    enemy_gauge_seconds: 4,
    enemy_count: 1,
    enemy_hp: 5,
    min_damage: 3,
    max_damage: 5,
    mode: 'single',
    allowed_chords: ['C', 'G', 'F'],
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 1,
    monster_icon: 'monster_06',
    gameMode: 'rhythm',
    pattern_type: 'random',
    music_meta: {
      bpm: 100,
      timeSig: 4,
      bars: 16
    },
    audio_url: '/demo-1.mp3'
  },

  // T-07: 連続禁止ロジック確認
  {
    id: 'rhythm-test-07',
    stage_number: 'RT-07',
    name: 'リズムテスト Single Chord',
    description: '1種類のコードのみ（連続禁止ロジック確認）',
    max_hp: 10,
    enemy_gauge_seconds: 4,
    enemy_count: 1,
    enemy_hp: 5,
    min_damage: 3,
    max_damage: 5,
    mode: 'single',
    allowed_chords: ['C'], // 1種類のみ
    show_sheet_music: false,
    show_guide: true,
    simultaneous_monster_count: 1,
    monster_icon: 'monster_07',
    gameMode: 'rhythm',
    pattern_type: 'random',
    music_meta: {
      bpm: 120,
      timeSig: 4,
      bars: 8
    },
    audio_url: '/demo-1.mp3'
  }
];

// ステージ番号でステージを取得
export const getRhythmTestStageByNumber = (stageNumber: string): FantasyStage | null => {
  return rhythmTestStages.find(stage => stage.stage_number === stageNumber) || null;
};

// 全てのテストステージを取得
export const getAllRhythmTestStages = (): FantasyStage[] => {
  return rhythmTestStages;
};