import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  resolveChordVoicingSelfPacedPhraseClockUrl,
} from '@/utils/earTrainingChordVoicingDrumLoop';

describe('resolveChordVoicingSelfPacedPhraseClockUrl', () => {
  it('uses drum loop url when audio is null, undefined, or blank', () => {
    expect(resolveChordVoicingSelfPacedPhraseClockUrl(null)).toBe(
      CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
    );
    expect(resolveChordVoicingSelfPacedPhraseClockUrl(undefined)).toBe(
      CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
    );
    expect(resolveChordVoicingSelfPacedPhraseClockUrl('')).toBe(CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL);
    expect(resolveChordVoicingSelfPacedPhraseClockUrl('  \t')).toBe(
      CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
    );
  });

  it('returns trimmed non-empty urls', () => {
    expect(resolveChordVoicingSelfPacedPhraseClockUrl(' https://example.com/a.mp3 ')).toBe(
      'https://example.com/a.mp3',
    );
  });
});
