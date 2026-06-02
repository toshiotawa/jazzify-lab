import {
  createInitialAdlibRuntimeState,
  type AdlibPattern,
  type AdlibRuntimeState,
} from '@/utils/earTrainingPhrasePairEngine';
import {
  applyPhrasePairStepTransition,
  createPhrasePairAdlibWindowState,
  handlePhrasePairAdlibNoteOn,
  noteKeyFromPattern,
  PHRASE_PAIR_MAX_FIREBALLS_PER_STEP,
  PHRASE_PAIR_REPEAT_ENEMY_DAMAGE,
  type PhrasePairAdlibWindowState,
} from '@/utils/earTrainingPhrasePairBattleEngine';

const damage = {
  perCorrectNote: 10,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 5,
  fail: 0,
};

const dm7A: AdlibPattern = {
  id: 'dm7-a-cd',
  label: 'A',
  pcs: [0, 2],
  familyId: 'Dm7-A',
  carryTailLength: 0,
};

const bm7B: AdlibPattern = {
  id: 'bm7-b-dc',
  label: 'B',
  pcs: [2, 0],
  familyId: 'Bm7-B',
  carryTailLength: 0,
};

const otherPair: AdlibPattern = {
  id: 'other-eg',
  label: 'X',
  pcs: [4, 7],
  familyId: 'Other',
  carryTailLength: 0,
};

const sameNotePatterns = [dm7A, bm7B, otherPair];

const pcToMidi = (pc: number): number => 60 + pc;

const playPitchClasses = (
  pcs: readonly number[],
  patterns: readonly AdlibPattern[] = sameNotePatterns,
  initial?: {
    matcher: AdlibRuntimeState;
    window: PhrasePairAdlibWindowState;
  },
) => {
  let matcher = initial?.matcher ?? createInitialAdlibRuntimeState();
  let window = initial?.window ?? createPhrasePairAdlibWindowState('step-1');
  let last = handlePhrasePairAdlibNoteOn(matcher, window, patterns, 0, damage);

  for (const pc of pcs) {
    last = handlePhrasePairAdlibNoteOn(
      matcher,
      window,
      patterns,
      pcToMidi(pc),
      damage,
    );
    matcher = last.nextMatcherState;
    window = last.nextWindow;
  }

  return { ...last, matcher, window };
};

describe('earTrainingPhrasePairBattleEngine', () => {
  it('noteKeyFromPattern ignores note order', () => {
    expect(noteKeyFromPattern(dm7A)).toBe('0,2');
    expect(noteKeyFromPattern(bm7B)).toBe('0,2');
    expect(noteKeyFromPattern(otherPair)).toBe('4,7');
  });

  it('applies repeat damage when consecutive completions share the same pitch classes', () => {
    const first = playPitchClasses([0, 2]);
    expect(first.evaluation.result).toBe('complete');
    expect(first.shouldFire).toBe(true);
    expect(first.enemyDamage).toBe(10);
    expect(first.nextWindow.lastCompletedNoteKey).toBe('0,2');

    const second = playPitchClasses([2, 0], sameNotePatterns, {
      matcher: first.matcher,
      window: first.window,
    });
    expect(second.evaluation.result).toBe('complete');
    expect(second.shouldFire).toBe(true);
    expect(second.enemyDamage).toBe(PHRASE_PAIR_REPEAT_ENEMY_DAMAGE);
  });

  it('treats different pattern ids with same pcs as repeat', () => {
    const first = playPitchClasses([0, 2], [dm7A, otherPair]);
    expect(first.enemyDamage).toBe(10);

    const second = playPitchClasses([2, 0], [bm7B, otherPair], {
      matcher: first.matcher,
      window: first.window,
    });
    expect(second.enemyDamage).toBe(PHRASE_PAIR_REPEAT_ENEMY_DAMAGE);
  });

  it('resets repeat damage after a different pitch-class pair', () => {
    const cd = playPitchClasses([0, 2]);
    expect(cd.enemyDamage).toBe(10);

    const eg = playPitchClasses([4, 7], sameNotePatterns, {
      matcher: cd.matcher,
      window: cd.window,
    });
    expect(eg.enemyDamage).toBe(10);
    expect(eg.nextWindow.lastCompletedNoteKey).toBe('4,7');

    const cdAgain = playPitchClasses([0, 2], sameNotePatterns, {
      matcher: eg.matcher,
      window: eg.window,
    });
    expect(cdAgain.enemyDamage).toBe(10);
  });

  it('keeps lastCompletedNoteKey across step transition', () => {
    const completed = playPitchClasses([0, 2]);
    const transitioned = applyPhrasePairStepTransition(
      completed.nextWindow,
      'step-2',
    );
    expect(transitioned.fireCount).toBe(0);
    expect(transitioned.lastCompletedNoteKey).toBe('0,2');

    let matcher = createInitialAdlibRuntimeState();
    const repeat = handlePhrasePairAdlibNoteOn(
      matcher,
      transitioned,
      sameNotePatterns,
      pcToMidi(0),
      damage,
    );
    matcher = repeat.nextMatcherState;
    const second = handlePhrasePairAdlibNoteOn(
      matcher,
      repeat.nextWindow,
      sameNotePatterns,
      pcToMidi(2),
      damage,
    );
    expect(second.enemyDamage).toBe(PHRASE_PAIR_REPEAT_ENEMY_DAMAGE);
  });

  it('caps fireballs per step while still updating note key on complete', () => {
    let matcher = createInitialAdlibRuntimeState();
    let window = createPhrasePairAdlibWindowState('step-1');

    for (let i = 0; i < PHRASE_PAIR_MAX_FIREBALLS_PER_STEP; i += 1) {
      for (const pc of [0, 2] as const) {
        const result = handlePhrasePairAdlibNoteOn(
          matcher,
          window,
          sameNotePatterns,
          pcToMidi(pc),
          damage,
        );
        matcher = result.nextMatcherState;
        window = result.nextWindow;
      }
    }

    expect(window.fireCount).toBe(PHRASE_PAIR_MAX_FIREBALLS_PER_STEP);

    matcher = createInitialAdlibRuntimeState();
    const note0 = handlePhrasePairAdlibNoteOn(
      matcher,
      window,
      sameNotePatterns,
      pcToMidi(0),
      damage,
    );
    const capped = handlePhrasePairAdlibNoteOn(
      note0.nextMatcherState,
      note0.nextWindow,
      sameNotePatterns,
      pcToMidi(2),
      damage,
    );
    expect(capped.evaluation.result).toBe('complete');
    expect(capped.shouldFire).toBe(false);
    expect(capped.enemyDamage).toBe(0);
    expect(capped.nextWindow.lastCompletedNoteKey).toBe('0,2');
    expect(capped.nextWindow.fireCount).toBe(PHRASE_PAIR_MAX_FIREBALLS_PER_STEP);
  });
});
