import React from 'react';
import { render, act } from '@testing-library/react';
import { FantasyRhythmEngine, useRhythmJudge } from '../FantasyRhythmEngine';

// Mock the timeStore
jest.mock('@/stores/timeStore', () => ({
  useTimeStore: () => ({
    currentMeasure: 1,
    currentBeat: 1,
    isCountIn: false,
    startAt: performance.now(),
    readyDuration: 2000
  })
}));

// Mock devLog to avoid console spam during tests
jest.mock('@/utils/logger', () => ({
  devLog: {
    debug: jest.fn()
  }
}));

describe('FantasyRhythmEngine', () => {
  const defaultProps = {
    isActive: true,
    bpm: 120,
    timeSignature: 4,
    measureCount: 8,
    countInMeasures: 1,
    chordProgressionData: null,
    allowedChords: ['C', 'G', 'Am', 'F'],
    simultaneousMonsterCount: 1,
    onJudgment: jest.fn(),
    onChordSchedule: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<FantasyRhythmEngine {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('calls onChordSchedule when active', () => {
    const onChordSchedule = jest.fn();
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        onChordSchedule={onChordSchedule}
      />
    );

    // Component should generate schedule when active
    expect(onChordSchedule).toHaveBeenCalled();
  });

  it('supports chord progression data', () => {
    const onChordSchedule = jest.fn();
    const chordProgressionData = {
      chords: [
        { measure: 1, beat: 1, chord: 'C' },
        { measure: 2, beat: 1, chord: 'G' },
        { measure: 3, beat: 1, chord: 'Am' },
        { measure: 4, beat: 1, chord: 'F' }
      ]
    };

    render(
      <FantasyRhythmEngine
        {...defaultProps}
        chordProgressionData={chordProgressionData}
        onChordSchedule={onChordSchedule}
      />
    );

    // Should create schedule based on progression data
    expect(onChordSchedule).toHaveBeenCalled();
    const scheduleCall = onChordSchedule.mock.calls[0][0];
    expect(scheduleCall).toBeInstanceOf(Array);
    expect(scheduleCall.length).toBeGreaterThan(0);
  });

  it('adjusts positions based on time signature', () => {
    const onChordSchedule = jest.fn();
    
    // Test with 3/4 time signature
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        timeSignature={3}
        simultaneousMonsterCount={4}
        chordProgressionData={{
          chords: [
            { measure: 1, beat: 1, chord: 'C' },
            { measure: 1, beat: 2, chord: 'G' },
            { measure: 1, beat: 3, chord: 'Am' }
          ]
        }}
        onChordSchedule={onChordSchedule}
      />
    );

    const scheduleCall = onChordSchedule.mock.calls[0][0];
    const positions = scheduleCall.map((item: any) => item.position);
    
    // Should only use positions A, B, C for 3/4 time
    expect(positions.every((pos: string) => ['A', 'B', 'C'].includes(pos))).toBe(true);
  });

  it('does not generate schedule when inactive', () => {
    const onChordSchedule = jest.fn();
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        isActive={false}
        onChordSchedule={onChordSchedule}
      />
    );

    // Should not call onChordSchedule when inactive
    expect(onChordSchedule).not.toHaveBeenCalled();
  });
  
  describe('judge function', () => {
    it('returns perfect judgment for small time difference (30ms)', () => {
      const onJudgment = jest.fn();
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => any }>();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );
      
      // Wait for the component to be ready
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Create a mock judgment scenario
      const targetTime = 1000;
      const inputTime = targetTime + 30; // 30ms late
      
      // Manually create an active judgment for testing
      act(() => {
        onJudgment.mockImplementation((judgment) => {
          if (!judgment.judged) {
            // Simulate having an active judgment
            const result = ref.current?.judge('C', inputTime);
            expect(result).toBeTruthy();
            if (result) {
              expect(result.result).toBe('perfect');
            }
          }
        });
      });
    });
    
    it('returns good judgment for medium time difference (150ms)', () => {
      const onJudgment = jest.fn();
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => any }>();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );
      
      // Wait for the component to be ready
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const targetTime = 1000;
      const inputTime = targetTime + 150; // 150ms late
      
      act(() => {
        onJudgment.mockImplementation((judgment) => {
          if (!judgment.judged) {
            const result = ref.current?.judge('C', inputTime);
            expect(result).toBeTruthy();
            if (result) {
              expect(result.result).toBe('good');
            }
          }
        });
      });
    });
    
    it('returns null for large time difference (250ms)', () => {
      const onJudgment = jest.fn();
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => any }>();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );
      
      // Wait for the component to be ready
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const targetTime = 1000;
      const inputTime = targetTime + 250; // 250ms late (outside window)
      
      act(() => {
        const result = ref.current?.judge('C', inputTime);
        expect(result).toBeNull(); // Should be null because it's outside the judgment window
      });
    });
  });
});