import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RhythmGameEngine from '../rhythmGameEngine';
import type { RhythmStage } from '@/types';

const mockStage: RhythmStage = {
  id: 'test-rhythm-stage',
  stage_number: '1-1',
  name: 'テストリズムステージ',
  description: 'テスト用',
  max_hp: 5,
  enemy_gauge_seconds: 4,
  enemy_count: 3,
  enemy_hp: 10,
  min_damage: 1,
  max_damage: 3,
  mode: 'rhythm',
  rhythmType: 'random',
  allowed_chords: ['C', 'G', 'Am', 'F'],
  chord_progression: [],
  show_sheet_music: false,
  show_guide: false,
  simultaneous_monster_count: 1,
  monster_icon: 'monster_01',
  bgm_url: '/test.mp3',
  mp3_url: '/test.mp3',
  bpm: 120,
  measure_count: 4,
  time_signature: 4,
  count_in_measures: 1,
  chord_progression_data: undefined
};

describe('RhythmGameEngine', () => {
  let engine: RhythmGameEngine;
  let onAttackSuccess: ReturnType<typeof vi.fn>;
  let onAttackFail: ReturnType<typeof vi.fn>;
  let onQuestionScheduled: ReturnType<typeof vi.fn>;
  let onGameComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onAttackSuccess = vi.fn();
    onAttackFail = vi.fn();
    onQuestionScheduled = vi.fn();
    onGameComplete = vi.fn();
    
    engine = new RhythmGameEngine(mockStage, {
      onAttackSuccess,
      onAttackFail,
      onQuestionScheduled,
      onGameComplete
    });
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('should generate questions for random mode', () => {
    // エンジンが作成されると、自動的に質問が生成される
    expect(onQuestionScheduled).not.toHaveBeenCalled(); // まだスケジュールされていない
  });

  it('should start and schedule questions', () => {
    engine.start(0);
    
    // 時間を進めて質問がスケジュールされることを確認
    vi.advanceTimersByTime(100);
    
    expect(onQuestionScheduled).toHaveBeenCalled();
  });

  it('should handle note input within timing window', () => {
    engine.start(0);
    
    // Ready時間を越えて最初の質問の判定ウィンドウに入る
    // Ready: 2000ms, 最初の質問: measure 1, beat 1 = 2000ms (center) ± 200ms
    vi.advanceTimersByTime(2100); // 判定ウィンドウ内
    
    // Cコードの構成音を入力 (C=0, E=4, G=7)
    engine.handleInput(60, 2100); // C4
    engine.handleInput(64, 2100); // E4
    engine.handleInput(67, 2100); // G4
    
    expect(onAttackSuccess).toHaveBeenCalled();
  });

  it('should handle note input outside timing window', () => {
    engine.start(0);
    
    // 判定ウィンドウを過ぎた後に入力
    vi.advanceTimersByTime(2300); // 判定ウィンドウ外
    
    engine.handleInput(60, 2300);
    
    expect(onAttackSuccess).not.toHaveBeenCalled();
    expect(onAttackFail).toHaveBeenCalled();
  });

  it('should handle game completion when enemy HP reaches 0', () => {
    // HPが少ない敵でテスト
    const lowHpStage = { ...mockStage, enemy_count: 1, enemy_hp: 1 };
    engine = new RhythmGameEngine(lowHpStage, {
      onAttackSuccess,
      onAttackFail,
      onQuestionScheduled,
      onGameComplete
    });
    
    engine.start(0);
    vi.advanceTimersByTime(2100);
    
    // 正解してダメージを与える
    engine.handleInput(60, 2100); // C
    engine.handleInput(64, 2100); // E
    engine.handleInput(67, 2100); // G
    
    expect(onGameComplete).toHaveBeenCalled();
  });

  it('should handle chord progression mode', () => {
    const progressionStage: RhythmStage = {
      ...mockStage,
      rhythmType: 'progression',
      chord_progression_data: {
        chords: [
          { chord: 'C', measure: 1, beat: 1 },
          { chord: 'G', measure: 2, beat: 1 },
          { chord: 'Am', measure: 3, beat: 1 },
          { chord: 'F', measure: 4, beat: 1 }
        ]
      }
    };
    
    engine = new RhythmGameEngine(progressionStage, {
      onAttackSuccess,
      onAttackFail,
      onQuestionScheduled,
      onGameComplete
    });
    
    engine.start(0);
    vi.advanceTimersByTime(100);
    
    // プログレッションモードでも質問がスケジュールされることを確認
    expect(onQuestionScheduled).toHaveBeenCalled();
  });

  it('should loop questions after reaching the end', () => {
    engine.start(0);
    
    // 全ての質問を通過する時間まで進める
    // 4小節 * 4拍 * 500ms/拍 = 8000ms + Ready 2000ms = 10000ms
    vi.advanceTimersByTime(10100);
    
    // ループ処理が行われて新しい質問がスケジュールされることを確認
    const callCount = onQuestionScheduled.mock.calls.length;
    expect(callCount).toBeGreaterThan(4); // 元の4つより多い
  });
});