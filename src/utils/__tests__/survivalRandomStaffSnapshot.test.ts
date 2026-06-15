import { buildLessonRandomChordDefinition } from '@/utils/survivalLessonRandomChords';
import { buildRandomStaffSnapshotFromChord } from '@/utils/survivalRandomStaffSnapshot';

describe('buildRandomStaffSnapshotFromChord', () => {
  it('progressionStaffVoicingNames がある C7 override は 2 音譜面を返す', () => {
    const chord = buildLessonRandomChordDefinition({
      name: 'C7',
      voicing: [64, 70],
      voicingNames: ['E4', 'B♭4'],
      voicingStaves: [1, 1],
      keyFifths: 0,
    });
    if (!chord) {
      throw new Error('expected C7 chord definition');
    }

    const snapshot = buildRandomStaffSnapshotFromChord({
      chord,
      correctPitchClasses: [],
      chordDisplayName: 'C7',
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.voicingNames).toEqual(['E4', 'B♭4']);
    expect(snapshot?.voicingStaves).toEqual([1, 1]);
    expect(snapshot?.keyFifths).toBe(0);
    expect(snapshot?.staffClef).toBe('treble');
  });

  it('override が無い C7 は direct 譜面（4 音）にフォールバックする', () => {
    const snapshot = buildRandomStaffSnapshotFromChord({
      chord: {
        id: 'C7',
        displayName: 'C7',
        notes: [60, 64, 67, 70],
        noteNames: ['C4', 'E4', 'G4', 'B♭4'],
        quality: '7',
        root: 'C',
      },
      correctPitchClasses: [],
      chordDisplayName: 'C7',
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.voicingNames).toHaveLength(4);
    expect(snapshot?.voicingNames).toEqual(
      expect.arrayContaining(['C4', 'E4', 'G4', 'Bb4']),
    );
  });
});
