import {
  buildDefenseTutorialPhrase,
  pickDefenseTutorialWrittenOctave,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { resolveTutorialWrittenOffset } from '@/game/defense/tutorial/defenseTutorialNotation';

describe('buildDefenseTutorialPhrase', () => {
  it('uses instrument concert midis for Bb trumpet', () => {
    const settings = defaultTutorialNotationSettings('trumpet_bb');
    const { chord, concertMidis } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([58, 60, 62]);
    expect(chord.notes.map((n) => n.pitchMidi)).toEqual([58, 60, 62]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['C4', 'D4', 'E4']);
  });

  it('uses instrument concert midis for Eb alto sax', () => {
    const settings = defaultTutorialNotationSettings('alto_sax');
    const { concertMidis, chord } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([63, 65, 67]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['C5', 'D5', 'E5']);
  });

  it('uses instrument concert midis for F horn', () => {
    const settings = defaultTutorialNotationSettings('french_horn_f');
    const { concertMidis } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([65, 67, 69]);
  });

  it('uses C4 D4 E4 for piano', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { concertMidis } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([60, 62, 64]);
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
});
