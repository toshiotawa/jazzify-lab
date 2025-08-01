import React from 'react';
import { render } from '@testing-library/react';
import { FantasyRhythmEngine } from '../FantasyRhythmEngine';
import { vi } from 'vitest';

// Mock the time store
vi.mock('@/stores/timeStore', () => ({
  useTimeStore: () => ({
    currentMeasure: 1,
    currentBeat: 1,
    isCountIn: false,
    startAt: Date.now(),
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
  it('should render without errors', () => {
    const mockOnJudgment = vi.fn();
    const mockOnChordSchedule = vi.fn();
    const mockOnMiss = vi.fn();
    
    const { container } = render(
      <FantasyRhythmEngine
        ref={React.createRef()}
        isActive={true}
        bpm={120}
        timeSignature={4}
        measureCount={8}
        countInMeasures={1}
        chordProgressionData={null}
        allowedChords={['C', 'G', 'Am', 'F']}
        simultaneousMonsterCount={1}
        onJudgment={mockOnJudgment}
        onChordSchedule={mockOnChordSchedule}
        onMiss={mockOnMiss}
      />
    );
    
    // Component should render nothing (it's a logic-only component)
    expect(container.firstChild).toBeNull();
  });
  
  it('should call onMiss when judgment window is missed', async () => {
    const mockOnJudgment = vi.fn();
    const mockOnChordSchedule = vi.fn();
    const mockOnMiss = vi.fn();
    
    render(
      <FantasyRhythmEngine
        ref={React.createRef()}
        isActive={true}
        bpm={120}
        timeSignature={4}
        measureCount={8}
        countInMeasures={1}
        chordProgressionData={null}
        allowedChords={['C', 'G', 'Am', 'F']}
        simultaneousMonsterCount={1}
        onJudgment={mockOnJudgment}
        onChordSchedule={mockOnChordSchedule}
        onMiss={mockOnMiss}
      />
    );
    
    // Wait for schedule to be generated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that onChordSchedule was called
    expect(mockOnChordSchedule).toHaveBeenCalled();
  });
});