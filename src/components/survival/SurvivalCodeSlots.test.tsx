import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChordDefinition } from '../fantasy/FantasyGameEngine';
import type { CodeSlot, SlotType } from './SurvivalTypes';
import SurvivalCodeSlots from './SurvivalCodeSlots';

const buildChord = (displayName: string): ChordDefinition => ({
  id: displayName,
  displayName,
  notes: [60, 64, 67],
  noteNames: ['C', 'E', 'G'],
  quality: 'progression',
  root: 'C',
});

const buildSlot = (type: SlotType, chord: ChordDefinition | null, isEnabled: boolean): CodeSlot => ({
  type,
  chord,
  correctNotes: [],
  timer: 10,
  isCompleted: false,
  isEnabled,
});

describe('SurvivalCodeSlots progression layout', () => {
  it('renders only the Punch column in progression stages', () => {
    const currentSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      buildSlot('A', null, false),
      buildSlot('B', buildChord('Cmaj7'), true),
      buildSlot('C', null, false),
      buildSlot('D', null, false),
    ];
    const nextSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      buildSlot('A', null, false),
      buildSlot('B', buildChord('Dm7'), true),
      buildSlot('C', null, false),
      buildSlot('D', null, false),
    ];

    render(
      <SurvivalCodeSlots
        currentSlots={currentSlots}
        nextSlots={nextSlots}
        hintSlotIndex={null}
        aSlotCooldown={0}
        bSlotCooldown={0}
        cSlotCooldown={0}
        dSlotCooldown={0}
        hasMagic={false}
        isStageMode
        isProgressionStage
      />,
    );

    expect(screen.getByText(/Punch/)).toBeInTheDocument();
    expect(screen.getByText('Cmaj7')).toBeInTheDocument();
    expect(screen.getByText('Dm7')).toBeInTheDocument();
    expect(screen.queryByText(/Shot/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Magic/)).not.toBeInTheDocument();
  });

  it('renders only the Punch column when both progression and boss flags are set', () => {
    const currentSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      buildSlot('A', null, false),
      buildSlot('B', buildChord('Fmaj7'), true),
      buildSlot('C', null, false),
      buildSlot('D', null, false),
    ];
    const nextSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      buildSlot('A', null, false),
      buildSlot('B', buildChord('G7'), true),
      buildSlot('C', null, false),
      buildSlot('D', null, false),
    ];

    render(
      <SurvivalCodeSlots
        currentSlots={currentSlots}
        nextSlots={nextSlots}
        hintSlotIndex={null}
        aSlotCooldown={0}
        bSlotCooldown={0}
        cSlotCooldown={0}
        dSlotCooldown={0}
        hasMagic={false}
        isStageMode
        isBossStage
        isProgressionStage
      />,
    );

    expect(screen.getByText(/Punch/)).toBeInTheDocument();
    expect(screen.getByText('Fmaj7')).toBeInTheDocument();
    expect(screen.getByText('G7')).toBeInTheDocument();
    expect(screen.queryByText(/Shot/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Magic/)).not.toBeInTheDocument();
    expect(screen.queryByText('---')).not.toBeInTheDocument();
  });
});
