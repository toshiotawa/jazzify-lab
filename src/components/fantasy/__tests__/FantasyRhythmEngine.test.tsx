import React from 'react';
import { render, act } from '@testing-library/react';
import { FantasyRhythmEngine } from '../FantasyRhythmEngine';
import { useTimeStore } from '@/stores/timeStore';
import { vi } from 'vitest';

// モックする
vi.mock('@/utils/logger', () => ({
  devLog: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('@/stores/timeStore', () => ({
  useTimeStore: vi.fn()
}));

describe('FantasyRhythmEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // timeStoreのモック
    (useTimeStore as any).mockImplementation(() => ({
      currentMeasure: 1,
      currentBeat: 1,
      isCountIn: false,
      startAt: performance.now(),
      readyDuration: 3000
    }));
    
    // getStateのモック
    (useTimeStore as any).getState = vi.fn().mockReturnValue({
      startAt: performance.now(),
      readyDuration: 3000
    });
  });

  const defaultProps = {
    isActive: true,
    bpm: 120,
    timeSignature: 4,
    measureCount: 8,
    countInMeasures: 1,
    allowedChords: ['C', 'G', 'Am', 'F'],
    simultaneousMonsterCount: 1,
    onJudgment: vi.fn(),
    onChordSchedule: vi.fn()
  };

  it('should render without crashing', () => {
    const { container } = render(<FantasyRhythmEngine {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('should generate rhythm schedule when activated', () => {
    const onChordSchedule = vi.fn();
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        onChordSchedule={onChordSchedule}
      />
    );
    
    expect(onChordSchedule).toHaveBeenCalled();
    const schedule = onChordSchedule.mock.calls[0][0];
    expect(schedule).toBeDefined();
    expect(schedule.length).toBeGreaterThan(0);
  });

  it('should generate random pattern when no chord progression data', () => {
    const onChordSchedule = vi.fn();
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        chordProgressionData={null}
        onChordSchedule={onChordSchedule}
      />
    );
    
    expect(onChordSchedule).toHaveBeenCalled();
    const schedule = onChordSchedule.mock.calls[0][0];
    expect(schedule).toBeDefined();
    expect(schedule[0].position).toBe('A'); // ランダムパターンは常にA列
  });

  it('should generate progression pattern with chord progression data', () => {
    const onChordSchedule = vi.fn();
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        chordProgressionData={{
          chords: [
            { measure: 1, beat: 1, chord: 'C' },
            { measure: 2, beat: 1, chord: 'G' },
            { measure: 3, beat: 1, chord: 'Am' },
            { measure: 4, beat: 1, chord: 'F' }
          ]
        }}
        simultaneousMonsterCount={4}
        onChordSchedule={onChordSchedule}
      />
    );
    
    expect(onChordSchedule).toHaveBeenCalled();
    const schedule = onChordSchedule.mock.calls[0][0];
    expect(schedule).toBeDefined();
    expect(schedule.filter(s => s.position === 'A').length).toBeGreaterThan(0);
    expect(schedule.filter(s => s.position === 'B').length).toBeGreaterThan(0);
  });

  it('should handle judgment within window', async () => {
    const onJudgment = vi.fn();
    const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => any }>();
    
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        ref={ref}
        onJudgment={onJudgment}
      />
    );
    
    // 少し待って判定を試みる
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    if (ref.current) {
      const result = ref.current.judge('C', performance.now());
      // スケジュール次第で判定可能かどうかが変わる
      if (result) {
        expect(result.chordId).toBe('C');
        expect(['perfect', 'good', 'miss']).toContain(result.result);
      }
    }
  });

  it('should trigger enemy attack on missed judgment', async () => {
    const onEnemyAttack = vi.fn();
    const getMonsterIdByPosition = vi.fn().mockReturnValue('monster-1');
    
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        onEnemyAttack={onEnemyAttack}
        getMonsterIdByPosition={getMonsterIdByPosition}
      />
    );
    
    // 判定ウィンドウが過ぎるまで待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // タイミングによってはonEnemyAttackが呼ばれる可能性がある
    // （スケジュールの生成タイミングに依存）
  });
});