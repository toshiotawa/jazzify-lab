import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RhythmLane } from '../RhythmLane';
import { ChordDefinition } from '../FantasyGameEngine';

// Mock useTimeStore
vi.mock('@/stores/timeStore', () => ({
  useTimeStore: () => ({
    currentBeat: 1,
    currentMeasure: 1,
    isCountIn: false
  })
}));

describe('RhythmLane', () => {
  const mockChord: ChordDefinition = {
    id: 'C',
    displayName: 'C',
    notes: [60, 64, 67],
    noteNames: ['C', 'E', 'G'],
    description: 'C Major',
    romanNumeral: 'I',
    quality: 'major'
  };

  const mockRhythmChords = [
    {
      chord: mockChord,
      measure: 1,
      beat: 1,
      timing: 2000,
      judged: false
    }
  ];

  const mockJudgmentWindows = [
    {
      chordId: 'C',
      startTime: 1800,
      endTime: 2200,
      judged: false,
      success: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the rhythm lane canvas', () => {
    const { container } = render(
      <RhythmLane
        rhythmChords={mockRhythmChords}
        judgmentWindows={mockJudgmentWindows}
        startAt={Date.now()}
        bpm={120}
        timeSignature={4}
        onNoteHit={() => {}}
      />
    );

    const canvas = container.querySelector('canvas.rhythm-lane');
    expect(canvas).toBeTruthy();
  });

  it('sets correct canvas dimensions', () => {
    const { container } = render(
      <RhythmLane
        rhythmChords={mockRhythmChords}
        judgmentWindows={mockJudgmentWindows}
        startAt={Date.now()}
        bpm={120}
        timeSignature={4}
        onNoteHit={() => {}}
      />
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    
    // The canvas style should have the correct max width
    expect(canvas.style.maxWidth).toBe('800px');
    expect(canvas.style.height).toBe('120px');
  });

  it('renders with empty chord list', () => {
    const { container } = render(
      <RhythmLane
        rhythmChords={[]}
        judgmentWindows={[]}
        startAt={Date.now()}
        bpm={120}
        timeSignature={4}
        onNoteHit={() => {}}
      />
    );

    const canvas = container.querySelector('canvas.rhythm-lane');
    expect(canvas).toBeTruthy();
  });

  it('handles null startAt gracefully', () => {
    const { container } = render(
      <RhythmLane
        rhythmChords={mockRhythmChords}
        judgmentWindows={mockJudgmentWindows}
        startAt={null}
        bpm={120}
        timeSignature={4}
        onNoteHit={() => {}}
      />
    );

    const canvas = container.querySelector('canvas.rhythm-lane');
    expect(canvas).toBeTruthy();
  });
});