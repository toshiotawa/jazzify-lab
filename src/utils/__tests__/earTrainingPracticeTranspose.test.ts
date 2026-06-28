import { Note } from 'tonal';
import {
  applyPracticeTransposeToMusicXml,
  clampPracticeTransposeOffset,
  fifthsToPreferredKeyName,
  getPracticeTransposeTargetKeyName,
  normalizeSignedSemitoneOffset,
  PRACTICE_TRANSPOSE_MAX,
  PRACTICE_TRANSPOSE_MIN,
  readKeyFifthsFromMusicXml,
} from '@/utils/earTrainingPracticeTranspose';

const sampleMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure>
      <attributes>
        <key><fifths>-1</fifths></key>
      </attributes>
      <note><pitch><step>F</step><octave>4</octave></pitch></note>
    </measure>
  </part>
</score-partwise>`;

describe('earTrainingPracticeTranspose', () => {
  it('reads key fifths from MusicXML', () => {
    expect(readKeyFifthsFromMusicXml(sampleMusicXml)).toBe(-1);
  });

  it('clamps offset to ±6', () => {
    expect(clampPracticeTransposeOffset(-10)).toBe(PRACTICE_TRANSPOSE_MIN);
    expect(clampPracticeTransposeOffset(10)).toBe(-2);
    expect(clampPracticeTransposeOffset(3.7)).toBe(3);
  });

  it('maps unsigned mod-12 offsets to signed shortest path', () => {
    expect(normalizeSignedSemitoneOffset(10)).toBe(-2);
    expect(normalizeSignedSemitoneOffset(-2)).toBe(-2);
    expect(normalizeSignedSemitoneOffset(-10)).toBe(PRACTICE_TRANSPOSE_MIN);
  });

  it('maps fifths to preferred key names', () => {
    expect(fifthsToPreferredKeyName(-1)).toBe('F');
    expect(fifthsToPreferredKeyName(0)).toBe('C');
    expect(fifthsToPreferredKeyName(6)).toBe('Gb');
  });

  it('computes target key name from original fifths and offset', () => {
    expect(getPracticeTransposeTargetKeyName(-1, 2)).toBe('G');
    expect(getPracticeTransposeTargetKeyName(-1, 0)).toBe('F');
  });

  it('applies transpose to MusicXML when offset is non-zero', () => {
    const transposed = applyPracticeTransposeToMusicXml(sampleMusicXml, 2);
    expect(transposed).not.toBe(sampleMusicXml);
    expect(readKeyFifthsFromMusicXml(transposed)).toBe(1);
  });

  it('負の半音移調でもピッチクラスが下方向になる', () => {
    const transposed = applyPracticeTransposeToMusicXml(sampleMusicXml, -2);
    const step = transposed.match(/<step>([^<]+)<\/step>/)?.[1] ?? '';
    const alterText = transposed.match(/<alter>(-?\d+)<\/alter>/)?.[1];
    const alter = alterText ? Number.parseInt(alterText, 10) : 0;
    const octave = Number.parseInt(transposed.match(/<octave>(\d+)<\/octave>/)?.[1] ?? '4', 10);
    let accidental = '';
    if (alter > 0) {
      accidental = '#'.repeat(alter);
    } else if (alter < 0) {
      accidental = 'b'.repeat(-alter);
    }
    const midi = Note.midi(`${step}${accidental}${octave}`);
    expect(midi).toBe(Note.midi('D#4'));
  });

  it('returns base XML unchanged when offset is zero', () => {
    expect(applyPracticeTransposeToMusicXml(sampleMusicXml, 0)).toBe(sampleMusicXml);
  });
});
