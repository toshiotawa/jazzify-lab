import { describe, expect, it } from 'vitest';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';
import {
  computeSurvivalKeyboardScrollAnchor,
  maxPitchMidiFromPhraseDefinition,
  scrollAnchorWhiteMidi,
} from '@/utils/survivalKeyboardScrollAnchor';
import { maxSurvivalHintMidiFromChordNotes } from '@/utils/survivalProgressionChords';
import type { SurvivalProgressionBuiltChord } from '@/utils/survivalProgressionChords';
import { getChordDefinition } from '@/components/survival/SurvivalGameEngine';

describe('scrollAnchorWhiteMidi', () => {
  it('高めの MIDI に対して有効な白鍵インデックスを返す（iOS と同一式）', () => {
    const anchor = scrollAnchorWhiteMidi(72);
    expect(anchor % 12 === 1 || anchor % 12 === 3 || anchor % 12 === 6 || anchor % 12 === 8 || anchor % 12 === 10).toBe(
      false,
    );
    expect(anchor).toBeGreaterThanOrEqual(21);
    expect(anchor).toBeLessThanOrEqual(108);
  });

  it('最上限付近でもクランプする', () => {
    expect(scrollAnchorWhiteMidi(127)).toBeLessThanOrEqual(108);
  });
});

describe('maxPitchMidiFromPhraseDefinition', () => {
  it('複数和弦のピッチ MIDI 最大を取る', () => {
    const phrase: SurvivalPhraseDefinition = {
      id: 'p1',
      mapCategory: 'phrases',
      stageNumber: 1,
      title: '',
      bgmUrl: null,
      keyFifths: 0,
      chords: [
        {
          id: 'c1',
          orderIndex: 0,
          chordName: 'C',
          measureNumber: 1,
          notes: [{ orderIndex: 0, pitchMidi: 60, pitchClass: 0, noteName: 'C', staff: 1 }],
        },
        {
          id: 'c2',
          orderIndex: 1,
          chordName: 'G',
          measureNumber: 1,
          notes: [{ orderIndex: 0, pitchMidi: 79, pitchClass: 7, noteName: 'G', staff: 1 }],
        },
      ],
    };
    expect(maxPitchMidiFromPhraseDefinition(phrase)).toBe(79);
  });

  it('null 相当は null', () => {
    expect(maxPitchMidiFromPhraseDefinition(null)).toBe(null);
    expect(maxPitchMidiFromPhraseDefinition(undefined)).toBe(null);
  });
});

describe('computeSurvivalKeyboardScrollAnchor progression', () => {
  it('コード列の構成音 MIDI 最大でアンカー', () => {
    const chords: SurvivalProgressionBuiltChord[] = [
      { id: 'a', displayName: 'A', notes: [50, 60], noteNames: [], quality: 'progression', root: 'C' },
      { id: 'b', displayName: 'B', notes: [40, 70], noteNames: [], quality: 'progression', root: 'C' },
    ];
    expect(
      computeSurvivalKeyboardScrollAnchor({
        kind: 'progression',
        chords,
      }),
    ).toBe(scrollAnchorWhiteMidi(70));
  });
});

describe('computeSurvivalKeyboardScrollAnchor random', () => {
  it('単音 C の notes 最大 MIDI と整合', () => {
    const c = getChordDefinition('C');
    expect(c).not.toBeNull();
    const hintMx = maxSurvivalHintMidiFromChordNotes(c!.notes);
    expect(hintMx).not.toBeNull();
    expect(computeSurvivalKeyboardScrollAnchor({ kind: 'random', allowedChordIds: ['C'] })).toBe(
      scrollAnchorWhiteMidi(hintMx!),
    );
  });
});

describe('maxSurvivalHintMidiFromChordNotes', () => {
  it('notes 配列の最大 MIDI を返す', () => {
    const midi = maxSurvivalHintMidiFromChordNotes([60, 64, 67, 71]);
    expect(midi).toBe(71);
  });
});


describe('computeSurvivalKeyboardScrollAnchor', () => {
  it('種別ごとに白鍵アンカーまたは null', () => {
    const phrase: SurvivalPhraseDefinition = {
      id: 'p1',
      mapCategory: 'phrases',
      stageNumber: 1,
      title: '',
      bgmUrl: null,
      keyFifths: 0,
      chords: [
        {
          id: 'c1',
          orderIndex: 0,
          chordName: 'X',
          measureNumber: 1,
          notes: [{ orderIndex: 0, pitchMidi: 65, pitchClass: 5, noteName: 'F', staff: 1 }],
        },
      ],
    };
    expect(computeSurvivalKeyboardScrollAnchor({ kind: 'phrase', phrase })).toBe(scrollAnchorWhiteMidi(65));

    expect(computeSurvivalKeyboardScrollAnchor({ kind: 'random', allowedChordIds: [] })).toBe(null);

    expect(computeSurvivalKeyboardScrollAnchor({ kind: 'progression', chords: [] })).toBe(null);
  });
});
