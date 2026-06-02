import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  ADLIB_MAX_FIREBALLS_PER_HARMONY,
  applyHarmonyWindowTransition,
  buildAdlibStaffVoicingGroups,
  computeAdlibKeyboardHints,
  createAdlibWindowState,
  getHarmonyUnionPitchClasses,
  handleAdlibNoteOn,
} from '@/utils/earTrainingAdlibEngine';

const damage = {
  perCorrectNote: 10,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 5,
  fail: 0,
};

const dm7Chord: EarTrainingPhraseChord = {
  id: 'chord-1',
  phrase_id: 'phrase-1',
  order_index: 0,
  chord_name: 'Dm7',
  measure_number: 1,
  start_time_sec: 0,
  end_time_sec: 2,
  voicing: ['D3', 'F3', 'A3', 'C4'],
  voicing_staves: [1, 1, 1, 1],
};

const phrase: EarTrainingPhrase = {
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  title: 'test',
  audio_url: 'https://example.com/a.mp3',
  loop_duration_sec: 4,
  chords: [dm7Chord],
};

const harmonyRow = {
  representativeId: 'chord-1',
  chordName: 'Dm7',
  voicingIds: ['chord-1'],
};

describe('earTrainingAdlibEngine', () => {
  it('accepts any voicing pitch class in any order', () => {
    const union = getHarmonyUnionPitchClasses(phrase, harmonyRow);
    const initialWindow = createAdlibWindowState('chord-1');

    const d = handleAdlibNoteOn(initialWindow, union, 50, damage);
    expect(d.kind).toBe('correct');
    expect(d.shouldFire).toBe(true);
    expect(d.enemyDamage).toBe(10);

    const f = handleAdlibNoteOn(d.nextWindow, union, 53, damage);
    expect(f.kind).toBe('correct');
    expect(f.shouldFire).toBe(true);

    const c = handleAdlibNoteOn(f.nextWindow, union, 60, damage);
    expect(c.kind).toBe('correct');
    expect(c.nextWindow.pressedPitchClasses.size).toBe(3);
  });

  it('allows repeat correct presses with fireballs until cap', () => {
    const union = getHarmonyUnionPitchClasses(phrase, harmonyRow);
    let windowState = createAdlibWindowState('chord-1');

    for (let i = 0; i < ADLIB_MAX_FIREBALLS_PER_HARMONY; i += 1) {
      const result = handleAdlibNoteOn(windowState, union, 50, damage);
      expect(result.shouldFire).toBe(true);
      windowState = result.nextWindow;
    }

    const capped = handleAdlibNoteOn(windowState, union, 50, damage);
    expect(capped.kind).toBe('correct');
    expect(capped.shouldFire).toBe(false);
    expect(capped.enemyDamage).toBe(0);
    expect(capped.nextWindow.fireCount).toBe(ADLIB_MAX_FIREBALLS_PER_HARMONY);
  });

  it('treats out-of-group notes as miss with player damage', () => {
    const union = getHarmonyUnionPitchClasses(phrase, harmonyRow);
    const window = createAdlibWindowState('chord-1');
    const result = handleAdlibNoteOn(window, union, 61, damage);
    expect(result.kind).toBe('miss');
    expect(result.playerDamage).toBe(5);
    expect(result.shouldFire).toBe(false);
  });

  it('resets window state on harmony change', () => {
    const prev = {
      harmonyRepresentativeId: 'a',
      pressedPitchClasses: new Set([0, 2]),
      fireCount: 3,
    };
    const next = applyHarmonyWindowTransition(prev, 'b');
    expect(next.harmonyRepresentativeId).toBe('b');
    expect(next.pressedPitchClasses.size).toBe(0);
    expect(next.fireCount).toBe(0);
  });

  it('builds horizontal staff groups in voicing order', () => {
    const groups = buildAdlibStaffVoicingGroups(phrase, harmonyRow);
    expect(groups).toHaveLength(4);
    expect(groups[0].voicing[0]).toBe('D3');
    expect(groups[1].voicing[0]).toBe('F3');
    expect(groups[0].chordName).toBe('Dm7');
  });

  it('maps keyboard hints with pressed pitch classes as completed', () => {
    const hints = computeAdlibKeyboardHints(
      phrase,
      harmonyRow,
      new Set([2]),
    );
    expect(hints.completedMidis.length).toBeGreaterThan(0);
    expect(hints.pendingMidis.length).toBeGreaterThan(0);
  });
});
