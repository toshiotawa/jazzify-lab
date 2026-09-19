import {
  buildDefenseTutorialPhrase,
  pickDefenseTutorialWrittenOctave,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { buildDefaultTutorialNotationFromStore } from '@/components/defense/tutorial/DefenseTutorialSetup';
import {
  formatTutorialOctaveShiftLabel,
  resolveTutorialDefaultOctaveShift,
  resolveTutorialDisplayStaves,
  resolveTutorialVoicingStaff,
  resolveTutorialWrittenOffset,
  type DefenseTutorialNotationSettings,
} from '@/game/defense/tutorial/defenseTutorialNotation';

describe('buildDefenseTutorialPhrase', () => {
  it('uses instrument concert midis for Bb trumpet', () => {
    const settings = defaultTutorialNotationSettings('trumpet_bb');
    const { chord, concertMidis, phrase, staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([58, 60, 62]);
    expect(chord.notes.map((n) => n.pitchMidi)).toEqual([58, 60, 62]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['Bb3', 'C4', 'D4']);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C4'], ['D4'], ['E4']]);
    expect(phrase.keyFifths).toBe(0);
  });

  it('uses instrument concert midis for Eb alto sax', () => {
    const settings = defaultTutorialNotationSettings('alto_sax');
    const { concertMidis, chord, phrase, staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([63, 65, 67]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['Eb4', 'F4', 'G4']);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C5'], ['D5'], ['E5']]);
    expect(phrase.keyFifths).toBe(0);
  });

  it('uses instrument concert midis for F horn', () => {
    const settings = defaultTutorialNotationSettings('french_horn_f');
    const { concertMidis, phrase, staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([65, 67, 69]);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C5'], ['D5'], ['E5']]);
    expect(phrase.keyFifths).toBe(0);
  });

  it('uses C4 D4 E4 for piano', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { concertMidis, phrase, staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([60, 62, 64]);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C4'], ['D4'], ['E4']]);
    expect(staffGroups.map((group) => group.voicingStaves)).toEqual([[1], [1], [1]]);
    expect(phrase.keyFifths).toBe(0);
  });

  it('uses separate stepIndex 0,1,2', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { chord } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(chord.notes.map((n) => n.stepIndex)).toEqual([0, 1, 2]);
  });

  it('changes written display when notationOctaveShift changes', () => {
    const base = defaultTutorialNotationSettings('piano', 0);
    const shifted = defaultTutorialNotationSettings('piano', 2);
    const a = buildDefenseTutorialPhrase(base, 'https://example.com/a.mp3');
    const b = buildDefenseTutorialPhrase(shifted, 'https://example.com/a.mp3');
    expect(resolveTutorialWrittenOffset(shifted)).not.toBe(resolveTutorialWrittenOffset(base));
    expect(a.writtenOctave).not.toBe(b.writtenOctave);
  });

  it('uses three whole-note staff groups with solfege labels', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(staffGroups).toHaveLength(3);
    expect(staffGroups.every((group) => group.noteValue === 'whole')).toBe(true);
    expect(staffGroups.map((group) => group.chordName)).toEqual(['ド', 'レ', 'ミ']);
  });

  it('picks written octave 4 for Bb trumpet', () => {
    const settings = defaultTutorialNotationSettings('trumpet_bb');
    expect(pickDefenseTutorialWrittenOctave(settings)).toBe(4);
  });

  it('places trombone notes on bass staff at written C3', () => {
    const settings = defaultTutorialNotationSettings('trombone');
    const { chord, concertMidis, staffGroups, writtenOctave } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(writtenOctave).toBe(3);
    expect(pickDefenseTutorialWrittenOctave(settings)).toBe(3);
    expect(concertMidis).toEqual([48, 50, 52]);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C3'], ['D3'], ['E3']]);
    expect(staffGroups.map((group) => group.voicingStaves)).toEqual([[2], [2], [2]]);
    expect(chord.notes.map((n) => n.staff)).toEqual([2, 2, 2]);
  });

  it('places bass-clef override notes on bass staff', () => {
    const settings: DefenseTutorialNotationSettings = {
      ...defaultTutorialNotationSettings('flute'),
      clefOverride: 'bass',
    };
    const { staffGroups, chord } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C3'], ['D3'], ['E3']]);
    expect(staffGroups.map((group) => group.voicingStaves)).toEqual([[2], [2], [2]]);
    expect(chord.notes.map((n) => n.staff)).toEqual([2, 2, 2]);
  });

  it('keeps trombone tutorial register at C3 when written octave is -1', () => {
    const settings: DefenseTutorialNotationSettings = {
      ...defaultTutorialNotationSettings('trombone'),
      notationOctaveShift: -1,
    };
    const { concertMidis, staffGroups, writtenOctave } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(writtenOctave).toBe(3);
    expect(concertMidis).toEqual([48, 50, 52]);
    expect(staffGroups.map((group) => group.voicing)).toEqual([['C3'], ['D3'], ['E3']]);
  });

  it('defaults bass-clef instruments to written octave -1', () => {
    expect(resolveTutorialDefaultOctaveShift('bass')).toBe(-1);
    expect(resolveTutorialDefaultOctaveShift('treble')).toBe(0);
    expect(resolveTutorialDefaultOctaveShift('grand')).toBe(0);
    expect(formatTutorialOctaveShiftLabel(-1, false)).toBe('記譜オクターブ -1');
    expect(formatTutorialOctaveShiftLabel(-1, true)).toBe('Written octave -1');
    expect(formatTutorialOctaveShiftLabel(0, false)).toBe('記譜オクターブ 0');
    expect(buildDefaultTutorialNotationFromStore('trombone', null, null).notationOctaveShift).toBe(-1);
    expect(buildDefaultTutorialNotationFromStore('alto_sax', null, null).notationOctaveShift).toBe(0);
  });

  it('maps tutorial clefs to voicing staff and display staves', () => {
    expect(resolveTutorialVoicingStaff('treble')).toBe(1);
    expect(resolveTutorialVoicingStaff('grand')).toBe(1);
    expect(resolveTutorialVoicingStaff('bass')).toBe(2);
    expect(resolveTutorialDisplayStaves('treble')).toEqual([1]);
    expect(resolveTutorialDisplayStaves('grand')).toEqual([1, 2]);
    expect(resolveTutorialDisplayStaves('bass')).toEqual([2]);
  });
});
