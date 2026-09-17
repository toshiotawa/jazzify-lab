import {
  buildDefenseTutorialPhrase,
  pickDefenseTutorialConcertOctave,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { defaultTutorialNotationSettings } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { resolveTutorialWrittenOffset } from '@/game/defense/tutorial/defenseTutorialNotation';
import { DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES } from '@/game/defense/tutorial/defenseTutorialConstants';

describe('buildDefenseTutorialPhrase', () => {
  it('keeps concert pitch classes 0,2,4 for all presets', () => {
    const presets = [
      'piano',
      'trumpet_bb',
      'alto_sax',
      'french_horn_f',
      'guitar',
      'tenor_sax',
      'electric_bass',
    ] as const;

    presets.forEach((id) => {
      const settings = defaultTutorialNotationSettings(id);
      const { chord } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
      const pitchClasses = chord.notes.map((n) => n.pitchClass);
      expect(pitchClasses).toEqual([...DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES]);
    });
  });

  it('writes B♭ trumpet notes as D4 E4 F♯4 for concert C4 D4 E4', () => {
    const settings = defaultTutorialNotationSettings('trumpet_bb');
    const { chord, concertMidis } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([60, 62, 64]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['D4', 'E4', 'F#4']);
  });

  it('writes E♭ alto sax notes as A4 B4 C#5 for concert C4 D4 E4', () => {
    const settings = defaultTutorialNotationSettings('alto_sax');
    const { chord, concertMidis } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(concertMidis).toEqual([60, 62, 64]);
    expect(chord.notes.map((n) => n.noteName)).toEqual(['A4', 'B4', 'C#5']);
  });

  it('uses separate stepIndex 0,1,2', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { chord } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(chord.notes.map((n) => n.stepIndex)).toEqual([0, 1, 2]);
  });

  it('does not change concert midis when notationOctaveShift changes', () => {
    const base = defaultTutorialNotationSettings('piano', 0);
    const shifted = defaultTutorialNotationSettings('piano', 2);
    const a = buildDefenseTutorialPhrase(base, 'https://example.com/a.mp3');
    const b = buildDefenseTutorialPhrase(shifted, 'https://example.com/a.mp3');
    expect(a.concertMidis).toEqual(b.concertMidis);
    expect(resolveTutorialWrittenOffset(shifted)).not.toBe(resolveTutorialWrittenOffset(base));
  });

  it('includes quarter rest staff group', () => {
    const settings = defaultTutorialNotationSettings('piano');
    const { staffGroups } = buildDefenseTutorialPhrase(settings, 'https://example.com/a.mp3');
    expect(staffGroups).toHaveLength(4);
    expect(staffGroups[3]?.isRest).toBe(true);
    expect(staffGroups[3]?.noteValue).toBe('quarter');
  });

  it('picks C3 for bass clef preset', () => {
    const settings = defaultTutorialNotationSettings('cello');
    expect(pickDefenseTutorialConcertOctave(settings)).toBe(3);
  });
});
