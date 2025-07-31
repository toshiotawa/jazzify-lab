import { renderHook, act } from '@testing-library/react';
import { useFantasyRhythmEngine } from '../FantasyRhythmEngine';
import { parseRhythmJson, generateDemoProgression } from '@/utils/rhythmJsonLoader';

// モックステージデータ
const mockStage = {
  id: 'test-stage',
  stageNumber: '1-1',
  name: 'テストステージ',
  description: 'テスト用',
  maxHp: 5,
  enemyGaugeSeconds: 4,
  enemyCount: 10,
  enemyHp: 1,
  minDamage: 1,
  maxDamage: 1,
  mode: 'rhythm' as const,
  allowedChords: ['C', 'G', 'Am', 'F'],
  showSheetMusic: true,
  showGuide: true,
  monsterIcon: 'test',
  simultaneousMonsterCount: 1,
  bpm: 120,
  measureCount: 8,
  countInMeasures: 1,
  timeSignature: 4
};

describe('FantasyRhythmEngine', () => {
  it('エンジンが正しく初期化される', () => {
    const { result } = renderHook(() => useFantasyRhythmEngine(mockStage));
    
    expect(result.current.gameState.isActive).toBe(false);
    expect(result.current.gameState.playerHp).toBe(5);
    expect(result.current.gameState.score).toBe(0);
  });

  it('ゲームが開始できる', () => {
    const { result } = renderHook(() => useFantasyRhythmEngine(mockStage));
    
    act(() => {
      result.current.startGame();
    });
    
    expect(result.current.gameState.isActive).toBe(true);
  });

  it('入力バッファが正しく管理される', () => {
    const { result } = renderHook(() => useFantasyRhythmEngine(mockStage));
    
    act(() => {
      result.current.startGame();
      result.current.handleInput(60); // C4
    });
    
    expect(result.current.gameState.inputBuffer).toContain(60);
  });
});

describe('rhythmJsonLoader', () => {
  it('正しいJSONデータをパースできる', () => {
    const jsonData = {
      chords: [
        { chord: 'C', measure: 1, beat: 1 },
        { chord: 'G', measure: 2, beat: 1 }
      ]
    };
    
    const result = parseRhythmJson(jsonData);
    expect(result).toHaveLength(2);
    expect(result?.[0].chord).toBe('C');
  });

  it('無効なJSONデータを適切に処理する', () => {
    const result = parseRhythmJson(null);
    expect(result).toBeNull();
  });

  it('デモ進行を生成できる', () => {
    const chords = ['C', 'G', 'Am', 'F'];
    const result = generateDemoProgression(chords, 4, 4);
    
    expect(result).toHaveLength(4);
    expect(result[0].measure).toBe(1);
    expect(result[0].beat).toBe(1);
  });
});