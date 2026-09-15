import { buildTrainingQuestion } from '@/game/training/trainingQuestionBuilder';
import type { TrainingRow } from '@/game/training/trainingTypes';

const baseTraining = (overrides: Partial<TrainingRow>): TrainingRow => ({
  id: 't1',
  categoryId: 'c1',
  slug: 'test',
  titleJa: 'テスト',
  titleEn: 'Test',
  sortOrder: 0,
  kind: 'chord',
  clefMode: 'instrument',
  useKeySignature: false,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: { quality: 'maj', roots: ['C'] },
  isActive: true,
  ...overrides,
});

const piano = { notationInstrumentId: 'piano', notationOctaveShift: 0 } as const;

describe('trainingQuestionBuilder', () => {
  it('builds note reading questions within treble range using natural notes only', () => {
    for (let i = 0; i < 30; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({
          kind: 'note_reading',
          config: { clef: 'treble', includeAccidentals: false },
        }),
        ...piano,
      });
      expect(q.notes).toHaveLength(1);
      expect(q.notes[0]?.midi).toBeGreaterThanOrEqual(60);
      expect(q.notes[0]?.midi).toBeLessThanOrEqual(81);
      expect([0, 2, 4, 5, 7, 9, 11]).toContain(q.notes[0]?.pitchClass);
      expect(q.promptLabel).toBe('');
    }
  });

  it('includes sharps, flats, and naturals in treble note reading when enabled', () => {
    let sawAccidental = false;
    let sawNatural = false;
    for (let i = 0; i < 80; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({
          kind: 'note_reading',
          config: { clef: 'treble', includeAccidentals: true },
        }),
        ...piano,
      });
      expect(q.notes[0]?.midi).toBeGreaterThanOrEqual(60);
      expect(q.notes[0]?.midi).toBeLessThanOrEqual(81);
      const pc = q.notes[0]?.pitchClass ?? 0;
      if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) {
        sawNatural = true;
        expect(q.notes[0]?.noteName).not.toMatch(/[#b]/);
      } else {
        sawAccidental = true;
        expect(q.notes[0]?.noteName).toMatch(/[#b]/);
      }
    }
    expect(sawAccidental).toBe(true);
    expect(sawNatural).toBe(true);
  });

  it('includes sharps, flats, and naturals in bass note reading when enabled', () => {
    let sawAccidental = false;
    let sawNatural = false;
    for (let i = 0; i < 80; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({
          kind: 'note_reading',
          clefMode: 'bass_concert',
          config: { clef: 'bass', includeAccidentals: true },
        }),
        ...piano,
        ignoreNotationInstrument: true,
      });
      expect(q.notes[0]?.midi).toBeGreaterThanOrEqual(40);
      expect(q.notes[0]?.midi).toBeLessThanOrEqual(60);
      expect(q.notes[0]?.staff).toBe(2);
      const pc = q.notes[0]?.pitchClass ?? 0;
      if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) {
        sawNatural = true;
        expect(q.notes[0]?.noteName).not.toMatch(/[#b]/);
      } else {
        sawAccidental = true;
        expect(q.notes[0]?.noteName).toMatch(/[#b]/);
      }
    }
    expect(sawAccidental).toBe(true);
    expect(sawNatural).toBe(true);
  });

  it('uses bass clef In C fixed range for bass note reading', () => {
    for (let i = 0; i < 30; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({
          kind: 'note_reading',
          clefMode: 'bass_concert',
          config: { clef: 'bass', includeAccidentals: false },
        }),
        ...piano,
        ignoreNotationInstrument: true,
      });
      expect(q.notes[0]?.midi).toBeGreaterThanOrEqual(40);
      expect(q.notes[0]?.midi).toBeLessThanOrEqual(60);
      expect(q.notes[0]?.staff).toBe(2);
      expect([0, 2, 4, 5, 7, 9, 11]).toContain(q.notes[0]?.pitchClass);
    }
  });

  it('avoids repeating the same question key', () => {
    const training = baseTraining({ kind: 'chord', config: { quality: 'maj', roots: ['C', 'D', 'E'] } });
    const first = buildTrainingQuestion({ training, ...piano });
    const second = buildTrainingQuestion({ training, ...piano, previousQuestionKey: first.questionKey });
    expect(second.questionKey).not.toBe(first.questionKey);
    expect(second.questionKey.startsWith('fallback:')).toBe(false);
    expect(second.notes.length).toBeGreaterThan(1);
    expect(second.promptLabel).not.toBe('');
  });

  it('keeps a single-root chord instead of falling back to C4', () => {
    const training = baseTraining({ kind: 'chord', config: { quality: 'maj', roots: ['C'] } });
    const first = buildTrainingQuestion({ training, ...piano });
    for (let i = 0; i < 20; i += 1) {
      const next = buildTrainingQuestion({ training, ...piano, previousQuestionKey: first.questionKey });
      expect(next.questionKey).toBe(first.questionKey);
      expect(next.promptLabel).toBe('C');
      expect(next.notes.map((n) => n.noteName)).toEqual(['C5', 'E5', 'G5']);
    }
  });

  it('never falls back to a single C when a different chord root is available', () => {
    const training = baseTraining({ kind: 'chord', config: { quality: 'maj', roots: ['C', 'G'] } });
    const first = buildTrainingQuestion({
      training: { ...training, config: { ...training.config, roots: ['C'] } },
      ...piano,
    });
    for (let i = 0; i < 40; i += 1) {
      const next = buildTrainingQuestion({ training, ...piano, previousQuestionKey: first.questionKey });
      expect(next.questionKey.startsWith('fallback:')).toBe(false);
      expect(next.notes.length).toBe(3);
      expect(next.promptLabel).not.toBe('');
    }
  });

  it('keeps flat spellings for chords and places the lowest note inside the staff', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({ kind: 'chord', config: { quality: 'maj', roots: ['Db'] } }),
      ...piano,
    });
    expect(q.notes.map((n) => n.noteName)).toEqual(['Db5', 'F5', 'Ab5']);
    expect(q.promptLabel).toBe('Db');
    expect(q.keyFifths).toBe(0);
    // 正解時のルート音は最低音直下のルート
    expect(q.rootMidi).toBe(61);
  });

  it('uses chord symbols for chord prompts', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({ kind: 'chord', config: { quality: 'm7b5', roots: ['F#'] } }),
      ...piano,
    });
    expect(q.promptLabel).toBe('F#m7(b5)');
    expect(q.notes.map((n) => n.noteName)).toEqual(['F#4', 'A4', 'C5', 'E5']);
  });

  it('starts C major scale one octave above middle C on a treble staff', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({ kind: 'scale', config: { scale: 'major', roots: ['C'] } }),
      ...piano,
    });
    expect(q.layout).toBe('horizontal');
    expect(q.ordered).toBe(true);
    expect(q.notes.map((n) => n.noteName)).toEqual(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']);
    expect(q.promptLabel).toBe('C テスト');
  });

  it('spells G half-whole diminished with the expected pitch names', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({
        kind: 'scale',
        config: { scale: 'half_whole_diminished', roots: ['G'] },
      }),
      ...piano,
    });
    expect(q.notes.map((n) => n.noteName.replace(/\d+$/, ''))).toEqual([
      'G', 'Ab', 'Bb', 'B', 'C#', 'D', 'E', 'F',
    ]);
  });

  it('excludes the octave-up root from scale answers', () => {
    const scales = ['major', 'half_whole_diminished', 'whole_half_diminished'] as const;
    for (const scale of scales) {
      const q = buildTrainingQuestion({
        training: baseTraining({ kind: 'scale', config: { scale, roots: ['C'] } }),
        ...piano,
      });
      const rootMidi = q.notes[0]?.midi;
      expect(rootMidi).toBeDefined();
      expect(q.notes.some((n) => n.midi === (rootMidi ?? 0) + 12)).toBe(false);
    }
  });

  it('keeps 8 notes for diminished scales and spells Bb scale with flats', () => {
    const dim = buildTrainingQuestion({
      training: baseTraining({ kind: 'scale', config: { scale: 'whole_half_diminished', roots: ['C'] } }),
      ...piano,
    });
    expect(dim.notes).toHaveLength(8);
    const bb = buildTrainingQuestion({
      training: baseTraining({ kind: 'scale', config: { scale: 'major', roots: ['Bb'] } }),
      ...piano,
    });
    expect(bb.notes.map((n) => n.noteName)).toEqual(['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5']);
  });

  it('shifts the staff bottom for transposing instruments (concert pitch output)', () => {
    // Bb トランペット: 記譜 E4 以上 → コンサート D4 以上
    const q = buildTrainingQuestion({
      training: baseTraining({ kind: 'scale', config: { scale: 'major', roots: ['C'] } }),
      notationInstrumentId: 'trumpet_bb',
      notationOctaveShift: 0,
    });
    expect(q.notes[0]?.noteName).toBe('C5');
    const d = buildTrainingQuestion({
      training: baseTraining({ kind: 'scale', config: { scale: 'major', roots: ['D'] } }),
      notationInstrumentId: 'trumpet_bb',
      notationOctaveShift: 0,
    });
    expect(d.notes[0]?.noteName).toBe('D4');
  });

  it('places tension voicings at the lowest octave above min_lowest_note (bass concert)', () => {
    const training = baseTraining({
      kind: 'voicing',
      titleJa: 'M7(9)',
      titleEn: 'M7(9)',
      clefMode: 'bass_concert',
      config: { intervals: ['3M', '5P', '7M', '9M'], roots: ['C'], minLowestNote: 'E3' },
    });
    const c = buildTrainingQuestion({ training, ...piano, ignoreNotationInstrument: true });
    expect(c.notes.map((n) => n.noteName)).toEqual(['E3', 'G3', 'B3', 'D4']);
    expect(c.promptLabel).toBe('CM7(9)');
    expect(c.rootMidi).toBe(48); // C3
    const b = buildTrainingQuestion({
      training: { ...training, config: { ...training.config, roots: ['B'] } },
      ...piano,
      ignoreNotationInstrument: true,
    });
    expect(b.notes.map((n) => n.noteName)).toEqual(['D#4', 'F#4', 'A#4', 'C#5']);
    expect(b.notes.every((n) => n.staff === 2)).toBe(true);
  });

  it('transposes two-hand voicings from the reference root and respects min_lowest_note', () => {
    const training = baseTraining({
      kind: 'voicing',
      titleJa: '7 mixo 4th',
      titleEn: '7 mixo 4th',
      clefMode: 'grand_concert',
      config: {
        voicingNotes: ['Bb2', 'E3', 'A3', 'D4', 'G4', 'C5'],
        staves: [2, 2, 2, 1, 1, 1],
        roots: ['Eb'],
        referenceRoot: 'C',
        minLowestNote: 'Db3',
      },
    });
    const eb = buildTrainingQuestion({ training, ...piano, ignoreNotationInstrument: true });
    expect(eb.notes.map((n) => n.noteName)).toEqual(['Db3', 'G3', 'C4', 'F4', 'Bb4', 'Eb5']);
    expect(eb.notes.map((n) => n.staff)).toEqual([2, 2, 2, 1, 1, 1]);
    expect(eb.promptLabel).toBe('Eb7 mixo 4th');
    // C7 は Eb7 より低くなるため 1 オクターブ上に配置
    const c = buildTrainingQuestion({
      training: { ...training, config: { ...training.config, roots: ['C'] } },
      ...piano,
      ignoreNotationInstrument: true,
    });
    expect(c.notes[0]?.noteName).toBe('Bb3');
  });

  it('keeps Fb spelling in the bVI upper-structure voicing', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({
        kind: 'voicing',
        clefMode: 'grand_concert',
        config: {
          voicingNotes: ['Bb2', 'Fb3', 'Ab3', 'C4', 'Eb4'],
          staves: [2, 2, 2, 1, 1],
          roots: ['E'],
          referenceRoot: 'C',
          minLowestNote: 'D3',
        },
      }),
      ...piano,
      ignoreNotationInstrument: true,
    });
    expect(q.notes.map((n) => n.noteName)).toEqual(['D3', 'Ab3', 'C4', 'E4', 'G4']);
  });

  it('returns a fallback question for progression kind without recursing', () => {
    const q = buildTrainingQuestion({
      training: baseTraining({ kind: 'progression', config: {} }),
      ...piano,
    });
    expect(q.questionKey.startsWith('fallback:')).toBe(true);
    expect(q.notes).toHaveLength(1);
    expect(q.notes[0]?.midi).toBe(60);
  });

  it('builds mixed interval questions with a random interval label in the prompt', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({
          kind: 'interval',
          titleJa: '度数まとめ上',
          config: { direction: 'up' },
        }),
        ...piano,
      });
      expect(q.notes).toHaveLength(2);
      expect(q.notes[0]?.isTarget).toBe(false);
      expect(q.notes[1]?.isTarget).toBe(true);
      const basePitch = (q.notes[0]?.noteName ?? '').replace(/\d+$/, '');
      expect(q.promptLabel).toMatch(new RegExp(`^${basePitch} (短|長|完全|増)\\d度上$`));
    }
  });

  it('builds interval questions with a visible reference note and a simple-spelled target', () => {
    for (let i = 0; i < 40; i += 1) {
      const q = buildTrainingQuestion({
        training: baseTraining({ kind: 'interval', config: { interval: '4A', direction: 'down' } }),
        ...piano,
      });
      expect(q.notes).toHaveLength(2);
      expect(q.notes[0]?.isTarget).toBe(false);
      expect(q.notes[1]?.isTarget).toBe(true);
      expect((q.notes[0]?.midi ?? 0) - (q.notes[1]?.midi ?? 0)).toBe(6);
      expect(q.notes[1]?.midi).toBeGreaterThanOrEqual(64);
      expect(q.notes[1]?.noteName).not.toMatch(/x|bb|E#|B#|Cb|Fb/);
      const basePitch = (q.notes[0]?.noteName ?? '').replace(/\d+$/, '');
      expect(q.promptLabel).toBe(`${basePitch} テスト`);
    }
  });
});
