/**
 * Test data for rhythm mode development
 */

import { RhythmFantasyStage } from './generator';

export const testRhythmStage: RhythmFantasyStage = {
  id: 'test-rhythm-1',
  stage_number: '4-1',
  name: 'リズムモードテスト',
  description: 'リズムモードの動作確認用ステージ',
  max_hp: 3,
  enemy_gauge_seconds: 30,
  enemy_count: 8,
  enemy_hp: 100,
  min_damage: 20,
  max_damage: 50,
  mode: 'single',
  allowed_chords: ['C', 'G', 'Am', 'F', 'Em', 'Dm'],
  show_sheet_music: false,
  show_guide: true,
  simultaneous_monster_count: 4,
  monster_icon: 'monster_01',
  
  // Rhythm-specific fields
  game_type: 'rhythm',
  rhythm_pattern: 'random',
  bpm: 120,
  time_signature: 4,
  loop_measures: 8,
  mp3_url: '/demo-1.mp3'
};

export const testProgressionStage: RhythmFantasyStage = {
  ...testRhythmStage,
  id: 'test-rhythm-2',
  stage_number: '4-2',
  name: 'コード進行テスト',
  rhythm_pattern: 'progression',
  chord_progression_data: [
    { chord: 'C', measure: 2, beat: 1 },
    { chord: 'G', measure: 3, beat: 1 },
    { chord: 'Am', measure: 4, beat: 1 },
    { chord: 'F', measure: 5, beat: 1 },
    { chord: 'C', measure: 6, beat: 1 },
    { chord: 'F', measure: 7, beat: 1 },
    { chord: 'G', measure: 8, beat: 1 },
    { chord: 'C', measure: 8, beat: 3 }
  ]
};