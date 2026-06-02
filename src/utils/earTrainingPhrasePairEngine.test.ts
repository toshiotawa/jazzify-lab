import {
  CM7_ADLIB_PATTERNS,
  createInitialAdlibRuntimeState,
  evaluateAdlibNote,
  handleChordChange,
  type AdlibRuntimeState,
} from '@/utils/earTrainingPhrasePairEngine';

const patterns = CM7_ADLIB_PATTERNS;

function playSequence(
  pcs: readonly number[],
  initial: AdlibRuntimeState = createInitialAdlibRuntimeState(),
): { results: ReturnType<typeof evaluateAdlibNote>[]; state: AdlibRuntimeState } {
  let state = initial;
  const results: ReturnType<typeof evaluateAdlibNote>[] = [];
  for (const pc of pcs) {
    const ev = evaluateAdlibNote(state, pc, patterns);
    results.push(ev);
    state = ev.nextState;
  }
  return { results, state };
}

describe('earTrainingPhrasePairEngine CM7', () => {
  it('C D => A complete', () => {
    const { results } = playSequence([0, 2]);
    expect(results[1].result).toBe('complete');
    expect(results[1].completedPattern?.familyId).toBe('CM7-A');
  });

  it('D C => A complete', () => {
    const { results } = playSequence([2, 0]);
    expect(results[1].result).toBe('complete');
    expect(results[1].completedPattern?.familyId).toBe('CM7-A');
  });

  it('B C => D complete, buffer = [C]', () => {
    const { results, state } = playSequence([11, 0]);
    expect(results[1].result).toBe('complete');
    expect(results[1].completedPattern?.familyId).toBe('CM7-D');
    expect(state.buffer).toEqual([0]);
  });

  it('B C D => D complete then A complete', () => {
    const { results } = playSequence([11, 0, 2]);
    expect(results[1].result).toBe('complete');
    expect(results[1].completedPattern?.familyId).toBe('CM7-D');
    expect(results[2].result).toBe('complete');
    expect(results[2].completedPattern?.familyId).toBe('CM7-A');
  });

  it('B D C => A prime complete, buffer = [C]', () => {
    const { results, state } = playSequence([11, 2, 0]);
    expect(results[2].result).toBe('complete');
    expect(results[2].completedPattern?.familyId).toBe('CM7-Ap');
    expect(state.buffer).toEqual([0]);
  });

  it('D B C => A prime complete, buffer = [C]', () => {
    const { results, state } = playSequence([2, 11, 0]);
    expect(results[2].result).toBe('complete');
    expect(results[2].completedPattern?.familyId).toBe('CM7-Ap');
    expect(state.buffer).toEqual([0]);
  });

  it('B D Db B C => A double prime only, not D, buffer = [C]', () => {
    const { results, state } = playSequence([11, 2, 1, 11, 0]);
    const completes = results.filter((r) => r.result === 'complete');
    expect(completes).toHaveLength(1);
    expect(completes[0].completedPattern?.familyId).toBe('CM7-App');
    expect(state.buffer).toEqual([0]);
  });

  it('A B C => C pair complete, D does not fire', () => {
    const { results } = playSequence([9, 11, 0]);
    expect(results[1].result).toBe('complete');
    expect(results[1].completedPattern?.familyId).toBe('CM7-C');
    expect(results[2].result).not.toBe('complete');
    expect(results[2].result).toBe('progress');
  });

  it('invalid note is miss with empty buffer', () => {
    const { results } = playSequence([8]);
    expect(results[0].result).toBe('miss');
    expect(results[0].nextState.buffer).toEqual([]);
  });

  it('resync when wrong note matches new phrase start', () => {
    let state = createInitialAdlibRuntimeState();
    state = evaluateAdlibNote(state, 0, patterns).nextState;
    expect(state.buffer).toEqual([0]);

    const ev = evaluateAdlibNote(state, 4, patterns);
    expect(ev.result).toBe('resync');
    expect(ev.nextState.buffer).toEqual([4]);
  });
});

describe('handleChordChange', () => {
  it('keeps longest suffix-prefix when switching pattern sets', () => {
    const fullPatterns = patterns;
    const withoutApp = patterns.filter((p) => p.familyId !== 'CM7-App');

    let state = createInitialAdlibRuntimeState();
    state = evaluateAdlibNote(state, 11, fullPatterns).nextState;
    state = evaluateAdlibNote(state, 2, fullPatterns).nextState;
    state = evaluateAdlibNote(state, 1, fullPatterns).nextState;
    expect(state.buffer).toEqual([11, 2, 1]);

    state = handleChordChange(state, withoutApp);
    expect(state.buffer).toEqual([]);
  });

  it('retains partial buffer when suffix matches next patterns', () => {
    let state = createInitialAdlibRuntimeState();
    state = evaluateAdlibNote(state, 11, patterns).nextState;
    state = evaluateAdlibNote(state, 0, patterns).nextState;
    expect(state.buffer).toEqual([0]);

    state = handleChordChange(state, patterns);
    expect(state.buffer).toEqual([0]);
  });

  it('clears buffer when no prefix matches next patterns', () => {
    let state = createInitialAdlibRuntimeState();
    state = evaluateAdlibNote(state, 7, patterns).nextState;
    expect(state.buffer).toEqual([7]);

    state = handleChordChange(state, patterns.filter((p) => !p.pcs.includes(7)));
    expect(state.buffer).toEqual([]);
  });
});
