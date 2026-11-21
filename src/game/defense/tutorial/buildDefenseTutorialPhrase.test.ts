import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildDefenseTutorialPhrase,
  DEFENSE_TUTORIAL_AUDIO_URL,
  defaultTutorialNotationSettings,
  pickDefenseTutorialWrittenOctave,
  resolveDefenseTutorialAudioUrl,
  resolveDefenseTutorialAudioUrlForMidis,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import {
  DEFENSE_TUTORIAL_AUDIO_BASE_URL,
  DEFENSE_TUTORIAL_PREGENERATED_ROOT_MIDIS,
} from '@/game/defense/tutorial/defenseTutorialConstants';
import { buildDefaultTutorialNotationFromStore } from '@/components/defense/tutorial/DefenseTutorialSetup';
import {
  formatTutorialOctaveShiftLabel,
  resolveTutorialDefaultOctaveShift,
  resolveTutorialDisplayStaves,
  resolveTutorialVoicingStaff,
  resolveTutorialWrittenOffset,
  type DefenseTutorialNotationSettings,
} from '@/game/defense/tutorial/defenseTutorialNotation';
import {
  NOTATION_INSTRUMENT_PRESETS,
  NOTATION_OCTAVE_SHIFT_MAX,
  NOTATION_OCTAVE_SHIFT_MIN,
  type NotationInstrumentClef,
} from '@/utils/notationInstrument';

const TUTORIAL_CLEF_OVERRIDES: readonly (NotationInstrumentClef | null)[] = [
  null, 'treble', 'bass', 'grand',
];
const TUTORIAL_TRANSPOSITION_OVERRIDES: readonly (number | null)[] = [null, 0, -2, -7, -9];

const expectedDefenseTutorialRootAudioUrl = (rootConcertMidi: number): string => (
  `${DEFENSE_TUTORIAL_AUDIO_BASE_URL}defense-tutorial-call-response-root-${rootConcertMidi}-bpm60.mp3`
);

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

  it('configures call-response audio loop on tutorial stage', () => {
    const { stage } = buildDefenseTutorialPhrase(defaultTutorialNotationSettings('piano'), 'https://example.com/a.mp3');
    expect(stage.audioLoopBars).toBe(8);
    expect(stage.callResponseBars).toBe(1);
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

describe('defense tutorial audio url resolution', () => {
  it('keeps legacy default audio url export', () => {
    expect(DEFENSE_TUTORIAL_AUDIO_URL).toBe(
      'https://jazzify-cdn.com/sozai/defense-call-response/defense-tutorial-call-response-cde-bpm60.mp3',
    );
  });

  it('enumerates all notation combinations with do-re-mi midis and pregenerated urls', () => {
    const roots = new Set<number>();

    NOTATION_INSTRUMENT_PRESETS.forEach((preset) => {
      for (
        let notationOctaveShift = NOTATION_OCTAVE_SHIFT_MIN;
        notationOctaveShift <= NOTATION_OCTAVE_SHIFT_MAX;
        notationOctaveShift += 1
      ) {
        TUTORIAL_CLEF_OVERRIDES.forEach((clefOverride) => {
          TUTORIAL_TRANSPOSITION_OVERRIDES.forEach((transpositionOverride) => {
            const settings: DefenseTutorialNotationSettings = {
              notationInstrumentId: preset.id,
              notationOctaveShift,
              clefOverride,
              transpositionOverride,
            };
            const { concertMidis, phrase } = buildDefenseTutorialPhrase(settings);
            const root = concertMidis[0];
            expect(concertMidis).toEqual([root, root + 2, root + 4]);
            const expectedUrl = expectedDefenseTutorialRootAudioUrl(root);
            expect(resolveDefenseTutorialAudioUrl(root)).toBe(expectedUrl);
            expect(resolveDefenseTutorialAudioUrlForMidis(concertMidis)).toBe(expectedUrl);
            expect(phrase.audioUrl).toBe(expectedUrl);
            roots.add(root);
          });
        });
      }
    });

    expect([...roots].sort((a, b) => a - b)).toEqual([...DEFENSE_TUTORIAL_PREGENERATED_ROOT_MIDIS]);
  });

  it.each([
    ['piano', 60],
    ['trumpet_bb', 58],
    ['alto_sax', 63],
    ['french_horn_f', 65],
    ['trombone', 48],
    ['electric_bass', 36],
  ] as const)('resolves representative instrument %s to root %i url', (instrumentId, root) => {
    const settings = defaultTutorialNotationSettings(instrumentId);
    const { concertMidis, phrase } = buildDefenseTutorialPhrase(settings);
    const expectedUrl = expectedDefenseTutorialRootAudioUrl(root);
    expect(concertMidis[0]).toBe(root);
    expect(resolveDefenseTutorialAudioUrl(root)).toBe(expectedUrl);
    expect(resolveDefenseTutorialAudioUrlForMidis(concertMidis)).toBe(expectedUrl);
    expect(phrase.audioUrl).toBe(expectedUrl);
  });

  it.each([0, 61, 99])('returns null for unregistered root %i', (root) => {
    expect(resolveDefenseTutorialAudioUrl(root)).toBeNull();
  });

  it('returns null for non-do-re-mi concert midi triplets', () => {
    expect(resolveDefenseTutorialAudioUrlForMidis([60, 62, 65])).toBeNull();
  });

  it('has committed non-empty local MP3 assets for every pregenerated root and legacy cde', () => {
    const audioDir = resolve(process.cwd(), 'public/sozai/defense-call-response');
    const cdePath = resolve(audioDir, 'defense-tutorial-call-response-cde-bpm60.mp3');
    expect(existsSync(cdePath)).toBe(true);
    expect(statSync(cdePath).size).toBeGreaterThan(0);

    DEFENSE_TUTORIAL_PREGENERATED_ROOT_MIDIS.forEach((root) => {
      const filePath = resolve(audioDir, `defense-tutorial-call-response-root-${root}-bpm60.mp3`);
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeGreaterThan(0);
    });
  });
});
