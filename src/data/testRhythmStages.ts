import { RhythmStageData, RhythmEvent } from '@/types/rhythmMode';

// テスト用のハードコーディングされたステージデータ
export const testRhythmStages: RhythmStageData[] = [
  {
    id: 'test-rhythm-1',
    stage_number: 'R-1',
    play_mode: 'rhythm',
    pattern_type: 'random',
    time_signature: 4,
    bpm: 120,
    loop_measures: 8,
    allowed_chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'],
    enemy_gauge_seconds: 2, // 2秒でゲージがMAXになる
    enemy_count: 1,
    enemy_hp: 100,
    min_damage: 20,
    max_damage: 30,
    simultaneous_monster_count: 1,
    monster_icon: '🎵',
    bgm_url: '/sounds/demo1.mp3',
    show_guide: true,
  },
  {
    id: 'test-rhythm-2',
    stage_number: 'R-2',
    play_mode: 'rhythm',
    pattern_type: 'progression',
    time_signature: 4,
    bpm: 120,
    loop_measures: 8,
    allowed_chords: ['C', 'Am', 'F', 'G'],
    chord_progression: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'],
    enemy_gauge_seconds: 2,
    enemy_count: 4,
    enemy_hp: 80,
    min_damage: 15,
    max_damage: 25,
    simultaneous_monster_count: 4,
    monster_icon: '🎹',
    bgm_url: '/sounds/demo1.mp3',
    show_guide: true,
  },
  {
    id: 'test-rhythm-3',
    stage_number: 'R-3',
    play_mode: 'rhythm',
    pattern_type: 'progression',
    time_signature: 3,
    bpm: 120,
    loop_measures: 8,
    allowed_chords: ['C', 'F', 'G'],
    chord_progression: ['C', 'F', 'G', 'C', 'G', 'F'], // 6コード（3の倍数でない例）
    enemy_gauge_seconds: 1.5, // 3拍子なので少し短め
    enemy_count: 3,
    enemy_hp: 90,
    min_damage: 18,
    max_damage: 28,
    simultaneous_monster_count: 3,
    monster_icon: '🎼',
    bgm_url: '/sounds/demo1.mp3',
    show_guide: false,
  },
];

// テスト用のリズムイベントデータ（コードランダムパターン用）
export const testRhythmEventsRandom: RhythmEvent[] = [
  { code: 'C', measure: 1, beat: 1.0 },
  { code: 'F', measure: 2, beat: 1.0 },
  { code: 'G', measure: 3, beat: 1.0 },
  { code: 'Am', measure: 4, beat: 1.0 },
  { code: 'Dm', measure: 5, beat: 1.0 },
  { code: 'Em', measure: 6, beat: 1.0 },
  { code: 'G', measure: 7, beat: 1.0 },
  { code: 'C', measure: 8, beat: 1.0 },
];

// テスト用のリズムイベントデータ（コードプログレッションパターン用）
export const testRhythmEventsProgression: RhythmEvent[] = [
  // 1小節目
  { code: 'C', measure: 1, beat: 1.0 },
  { code: 'Am', measure: 1, beat: 2.0 },
  { code: 'F', measure: 1, beat: 3.0 },
  { code: 'G', measure: 1, beat: 4.0 },
  // 2小節目
  { code: 'C', measure: 2, beat: 1.0 },
  { code: 'Am', measure: 2, beat: 2.0 },
  { code: 'F', measure: 2, beat: 3.0 },
  { code: 'G', measure: 2, beat: 4.0 },
  // 3小節目
  { code: 'C', measure: 3, beat: 1.0 },
  { code: 'Am', measure: 3, beat: 2.0 },
  { code: 'F', measure: 3, beat: 3.0 },
  { code: 'G', measure: 3, beat: 4.0 },
  // 4小節目
  { code: 'C', measure: 4, beat: 1.0 },
  { code: 'Am', measure: 4, beat: 2.0 },
  { code: 'F', measure: 4, beat: 3.0 },
  { code: 'G', measure: 4, beat: 4.0 },
];

// 3拍子のテストデータ
export const testRhythmEvents3Beat: RhythmEvent[] = [
  // 1小節目
  { code: 'C', measure: 1, beat: 1.0 },
  { code: 'F', measure: 1, beat: 2.0 },
  { code: 'G', measure: 1, beat: 3.0 },
  // 2小節目
  { code: 'C', measure: 2, beat: 1.0 },
  { code: 'G', measure: 2, beat: 2.0 },
  { code: 'F', measure: 2, beat: 3.0 },
  // 3小節目
  { code: 'C', measure: 3, beat: 1.0 },
  { code: 'F', measure: 3, beat: 2.0 },
  { code: 'G', measure: 3, beat: 3.0 },
  // 4小節目
  { code: 'C', measure: 4, beat: 1.0 },
  { code: 'G', measure: 4, beat: 2.0 },
  { code: 'F', measure: 4, beat: 3.0 },
];

// 変則的なタイミングのテストデータ（16分音符、裏拍など）
export const testRhythmEventsComplex: RhythmEvent[] = [
  { code: 'C', measure: 1, beat: 1.0 },
  { code: 'Am', measure: 1, beat: 1.5 }, // 裏拍
  { code: 'F', measure: 1, beat: 2.25 }, // 16分音符
  { code: 'G', measure: 1, beat: 3.0 },
  { code: 'C', measure: 2, beat: 1.0 },
  { code: 'Em', measure: 2, beat: 2.5 }, // 裏拍
  { code: 'Dm', measure: 2, beat: 3.75 }, // 16分音符
  { code: 'G7', measure: 2, beat: 4.0 },
];

// クイズモードのテストデータ（比較用）
export const testQuizStage: RhythmStageData = {
  id: 'test-quiz-1',
  stage_number: 'Q-1',
  play_mode: 'quiz',
  time_signature: 4,
  bpm: 120,
  loop_measures: 8,
  allowed_chords: ['C', 'F', 'G', 'Am'],
  enemy_gauge_seconds: 5,
  enemy_count: 1,
  enemy_hp: 120,
  min_damage: 25,
  max_damage: 35,
  simultaneous_monster_count: 1,
  monster_icon: '🎯',
  bgm_url: '/sounds/demo1.mp3',
  show_guide: true,
};