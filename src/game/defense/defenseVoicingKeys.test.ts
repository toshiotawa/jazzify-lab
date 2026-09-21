import { describe, expect, it } from 'vitest';

import type { DefensePhrase, DefensePhraseChord } from '@/game/defense/defenseTypes';
import {
  advanceVoicingKey,
  buildOrderedKeyCycle,
  buildRandomKeyBag,
  buildTransposedVoicingPhrases,
  createInitialVoicingKeyState,
  currentVoicingKey,
  placeLowestInOctaveAbove,
  transposeDefensePhraseToKey,
} from '@/game/defense/defenseVoicingKeys';
import type { DefenseStage } from '@/game/defense/defenseTypes';
import { ABA_VOICINGS_BY_KEY } from '@/utils/twoHandVoicingIntermediateCourse';

describe('defenseVoicingKeys', () => {
  it('buildOrderedKeyCycle starts from F', () => {
    expect(buildOrderedKeyCycle('F')).toEqual([
      'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G', 'C',
    ]);
  });

  it('placeLowestInOctaveAbove keeps lowest note in range', () => {
    const names = placeLowestInOctaveAbove(['C4', 'E4', 'G4', 'B4'], 41);
    expect(names[0]).toBe('C3');
  });

  it('transposes staffChordName and compound chordName from F to C', () => {
    const chord: DefensePhraseChord = {
      id: 'c0',
      orderIndex: 0,
      chordName: 'Gm7(9) | C7(9.13)',
      measureNumber: 1,
      notes: [
        {
          orderIndex: 0,
          pitchMidi: 53,
          pitchClass: 5,
          noteName: 'F3',
          staff: 2,
          stepIndex: 0,
          staffChordName: 'Gm7(9)',
        },
        {
          orderIndex: 1,
          pitchMidi: 52,
          pitchClass: 4,
          noteName: 'E3',
          staff: 2,
          stepIndex: 1,
          staffChordName: 'C7(9.13)',
        },
      ],
    };
    const phrase: DefensePhrase = {
      id: 'p0',
      orderIndex: 0,
      title: 'F',
      audioUrl: '',
      loopStartMeasure: 1,
      loopEndMeasure: 1,
      keyFifths: -1,
      requiredCompletionCount: null,
      chords: [chord],
    };
    const transposed = transposeDefensePhraseToKey(phrase, 'F', 'C', 'F3');
    expect(transposed.chords[0]?.chordName).toBe('Dm7(9) | G7(9.13)');
    expect(transposed.chords[0]?.notes[0]?.staffChordName).toBe('Dm7(9)');
    expect(transposed.chords[0]?.notes[1]?.staffChordName).toBe('G7(9.13)');
  });

  it('transposes F II-V-I template to C', () => {
    const fSet = ABA_VOICINGS_BY_KEY.F;
    const chord: DefensePhraseChord = {
      id: 'c0',
      orderIndex: 0,
      chordName: fSet.ii.displayName,
      measureNumber: 1,
      notes: fSet.ii.notes.map((noteName, orderIndex) => ({
        orderIndex,
        pitchMidi: 0,
        pitchClass: 0,
        noteName,
        staff: orderIndex === 0 ? 2 as const : 1 as const,
        stepIndex: 0,
      })),
    };
    const phrase: DefensePhrase = {
      id: 'p0',
      orderIndex: 0,
      title: 'F',
      audioUrl: '',
      loopStartMeasure: 1,
      loopEndMeasure: 3,
      keyFifths: -1,
      requiredCompletionCount: null,
      chords: [chord],
    };
    const transposed = transposeDefensePhraseToKey(phrase, 'F', 'C', 'F3');
    expect(transposed.chords[0]?.chordName).toContain('Dm7');
    expect(transposed.keyFifths).toBe(0);
    const lowest = Math.min(...transposed.chords[0]?.notes.map((n) => n.pitchMidi) ?? [0]);
    expect(lowest).toBeGreaterThanOrEqual(41);
  });

  it('advanceVoicingKey cycles order mode', () => {
    const initial = createInitialVoicingKeyState('order', 'F');
    expect(currentVoicingKey(initial)).toBe('F');
    const next = advanceVoicingKey(initial);
    expect(currentVoicingKey(next)).toBe('Bb');
  });

  it('buildRandomKeyBag avoids repeating avoidKey at bag start when possible', () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const bag = buildRandomKeyBag('C');
      expect(bag).toHaveLength(12);
      if (bag.some((key) => key !== 'C')) {
        expect(bag[0]).not.toBe('C');
        break;
      }
    }
  });

  it('buildTransposedVoicingPhrases returns one phrase for chord voicing stage', () => {
    const templatePhrase: DefensePhrase = {
      id: 'p0',
      orderIndex: 0,
      title: 'template',
      audioUrl: 'https://example.com/a.mp3',
      loopStartMeasure: 1,
      loopEndMeasure: 3,
      keyFifths: -1,
      requiredCompletionCount: null,
      chords: [],
    };
    const stage: DefenseStage = {
      id: 's',
      slug: 's',
      stageNumber: 1,
      title: 't',
      titleEn: 't',
      bpm: 100,
      beatsPerBar: 4,
      audioRegistrationMode: 'single_source',
      audioUrl: 'https://example.com/a.mp3',
      melodyAudioUrl: null,
      progressionBars: 3,
      phraseBars: 1,
      staffLayout: 'grand',
      attackTrigger: 'note',
      keyFifths: -1,
      requiredCompletionCount: 1,
      difficultyLevel: 1,
      surviveSeconds: 120,
      playerHp: 20,
      productionStaffHintMode: 'always',
      productionKeyboardHintMode: 'always',
      playStyle: 'chord_voicing',
      voicingKeyMode: 'order',
      voicingLowestKey: 'F',
      voicingStartKey: 'F',
      voicingMinLowestNote: 'F3',
      playRootOnChordChange: true,
      phrases: [templatePhrase],
      progressionChords: [],
    };
    const keyState = createInitialVoicingKeyState('order', 'F');
    expect(buildTransposedVoicingPhrases(stage, keyState)).toHaveLength(1);
  });
});
