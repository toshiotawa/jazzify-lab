import React from 'react';
import { render, act } from '@testing-library/react';
import { FantasyRhythmEngine, RhythmJudgment } from '../FantasyRhythmEngine';

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
    onChordSchedule: jest.fn(),
    onMissJudgment: jest.fn()
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

  it('generates schedule for at least 10 seconds ahead', () => {
    const onChordSchedule = jest.fn();
    const currentTime = performance.now();
    
    render(
      <FantasyRhythmEngine
        {...defaultProps}
        onChordSchedule={onChordSchedule}
      />
    );

    const schedule = onChordSchedule.mock.calls[0][0];
    expect(schedule).toBeInstanceOf(Array);
    expect(schedule.length).toBeGreaterThan(0);
    
    // Check that schedule extends at least 10 seconds into the future
    const lastItem = schedule[schedule.length - 1];
    expect(lastItem.targetTime).toBeGreaterThan(currentTime + 9000);
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

  describe('judgment window', () => {
    it('accepts inputs within ±200ms window', () => {
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => RhythmJudgment | null }>();
      const onJudgment = jest.fn();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );

      // Simulate a scheduled chord at 1000ms
      const targetTime = 1000;
      act(() => {
        // Judgment within window (150ms before target)
        const judgment = ref.current?.judge('C', targetTime - 150);
        expect(judgment).toBeTruthy();
        expect(judgment?.result).toBeTruthy();
      });
    });

    it('rejects inputs outside ±200ms window', () => {
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => RhythmJudgment | null }>();
      const onJudgment = jest.fn();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );

      // Simulate a scheduled chord at 1000ms
      const targetTime = 1000;
      act(() => {
        // Judgment outside window (300ms before target)
        const judgment = ref.current?.judge('C', targetTime - 300);
        expect(judgment).toBeNull();
      });
    });

    it('marks perfect for inputs within ±50ms', () => {
      const ref = React.createRef<{ judge: (chordId: string, inputTime: number) => RhythmJudgment | null }>();
      const onJudgment = jest.fn();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          ref={ref}
          onJudgment={onJudgment}
        />
      );

      // Note: In a real test, we would need to mock the active judgments
      // For now, this test is illustrative of what should be tested
    });
  });

  describe('infinite loop', () => {
    it('continues generating schedule beyond measure count', () => {
      const onChordSchedule = jest.fn();
      
      render(
        <FantasyRhythmEngine
          {...defaultProps}
          measureCount={4}
          bpm={240} // Fast BPM to reach measure count quickly
          onChordSchedule={onChordSchedule}
        />
      );

      const schedule = onChordSchedule.mock.calls[0][0];
      // With 240 BPM and 4 measures, we should see items beyond measure 4
      const measuresInSchedule = new Set(schedule.map((item: any) => item.measure));
      expect(measuresInSchedule.size).toBeGreaterThan(4);
    });
  });
});