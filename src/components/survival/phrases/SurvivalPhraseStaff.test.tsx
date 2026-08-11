import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SurvivalPhraseStaff } from './SurvivalPhraseStaff';
import type { SurvivalPhraseChord } from '@/utils/survivalPhraseDefinitions';

const CORRECT_COLOR = '#22c55e';
const NEXT_TARGET_COLOR = '#f39800';

const chordStepPhrase: SurvivalPhraseChord = {
  id: 'c0',
  orderIndex: 0,
  chordName: 'F',
  measureNumber: 1,
  notes: [
    { orderIndex: 0, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 0 },
    { orderIndex: 1, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 1 },
    { orderIndex: 2, pitchMidi: 68, pitchClass: 8, noteName: 'Ab4', staff: 1, stepIndex: 1 },
    { orderIndex: 3, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 2 },
  ],
};

describe('SurvivalPhraseStaff', () => {
  it('renders chord steps as stacked groups and colors only matched pitches', () => {
    const { container } = render(
      <SurvivalPhraseStaff
        currentChord={chordStepPhrase}
        nextChord={null}
        keyFifths={0}
        correctNoteIndices={new Set([0, 1])}
        revealedNoteIndices={new Set([0, 1])}
        targetStepIndex={1}
        hintMode
        unpressedNoteOpacity={1}
      />,
    );

    const groups = container.querySelectorAll('ellipse[data-voicing-group-id]');
    expect(groups.length).toBe(4);

    const chordGroupNotes = container.querySelectorAll('ellipse[data-voicing-group-id="m0-s1"]');
    expect(chordGroupNotes.length).toBe(2);

    const matchedF = container.querySelector(
      'ellipse[data-voicing-group-id="m0-s1"][data-voicing-pitch-class="5"]',
    );
    const pendingAb = container.querySelector(
      'ellipse[data-voicing-group-id="m0-s1"][data-voicing-pitch-class="8"]',
    );

    expect(matchedF?.getAttribute('stroke')).toBe(CORRECT_COLOR);
    expect(pendingAb?.getAttribute('stroke')).toBe(NEXT_TARGET_COLOR);
  });
});
