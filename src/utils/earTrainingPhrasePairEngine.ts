/**
 * Phrase pair adlib: suffix-buffer stream matching with explicit carry.
 * Rules: consume completed notes; carry only when carryTailLength > 0;
 * longest pattern wins on simultaneous completion; chord change keeps longest suffix-prefix.
 */

export interface AdlibPattern {
  readonly id: string;
  readonly label: string;
  readonly pcs: readonly number[];
  readonly familyId: string;
  /** Notes to seed into next buffer after completion (0 = consume all). */
  readonly carryTailLength: number;
  readonly priority?: number;
  /** Octave note names for staff display (same order/length as pcs). */
  readonly voicing?: readonly string[];
  /** Staff per note: 1=treble, 2=bass (same order/length as pcs). */
  readonly voicingStaves?: readonly number[];
}

export interface AdlibRuntimeState {
  readonly buffer: readonly number[];
  readonly lastCompletedPatternId: string | null;
}

export type AdlibNoteResult = 'progress' | 'complete' | 'resync' | 'miss';

export interface AdlibEvaluation {
  readonly result: AdlibNoteResult;
  readonly completedPattern: AdlibPattern | null;
  readonly nextState: AdlibRuntimeState;
}

export const createInitialAdlibRuntimeState = (): AdlibRuntimeState => ({
  buffer: [],
  lastCompletedPatternId: null,
});

export function maxPatternLength(patterns: readonly AdlibPattern[]): number {
  let max = 0;
  for (const p of patterns) {
    if (p.pcs.length > max) max = p.pcs.length;
  }
  return max;
}

export function isPrefixOfAny(
  buffer: readonly number[],
  patterns: readonly AdlibPattern[],
): boolean {
  if (buffer.length === 0) return false;
  for (const pattern of patterns) {
    if (buffer.length > pattern.pcs.length) continue;
    let ok = true;
    for (let i = 0; i < buffer.length; i += 1) {
      if (buffer[i] !== pattern.pcs[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function patternMatchesSuffix(
  trial: readonly number[],
  pattern: AdlibPattern,
): boolean {
  if (pattern.pcs.length > trial.length) return false;
  const offset = trial.length - pattern.pcs.length;
  for (let i = 0; i < pattern.pcs.length; i += 1) {
    if (trial[offset + i] !== pattern.pcs[i]) return false;
  }
  return true;
}

export function longestSuffixPrefix(
  trial: readonly number[],
  patterns: readonly AdlibPattern[],
): readonly number[] {
  const maxLen = Math.min(trial.length, maxPatternLength(patterns) - 1);
  for (let len = maxLen; len >= 1; len -= 1) {
    const suffix = trial.slice(trial.length - len);
    if (isPrefixOfAny(suffix, patterns)) return suffix;
  }
  return [];
}

function sortCompletedPatterns(
  completed: readonly AdlibPattern[],
): readonly AdlibPattern[] {
  return completed.slice().sort((a, b) => {
    const lenDiff = b.pcs.length - a.pcs.length;
    if (lenDiff !== 0) return lenDiff;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });
}

export function evaluateAdlibNote(
  state: AdlibRuntimeState,
  inputPc: number,
  patterns: readonly AdlibPattern[],
): AdlibEvaluation {
  const normalizedPc = ((inputPc % 12) + 12) % 12;
  const trial = [...state.buffer, normalizedPc];

  const completed = sortCompletedPatterns(
    patterns.filter((pattern) => patternMatchesSuffix(trial, pattern)),
  );

  if (completed.length > 0) {
    const chosen = completed[0];
    const carry = chosen.carryTailLength > 0
      ? chosen.pcs.slice(-chosen.carryTailLength)
      : [];
    const safeCarry = isPrefixOfAny(carry, patterns) ? carry : [];

    return {
      result: 'complete',
      completedPattern: chosen,
      nextState: {
        buffer: safeCarry,
        lastCompletedPatternId: chosen.id,
      },
    };
  }

  const nextBuffer = longestSuffixPrefix(trial, patterns);

  if (nextBuffer.length > 0) {
    const wasResync =
      state.buffer.length > 0
      && nextBuffer.length === 1
      && nextBuffer[0] === normalizedPc;

    return {
      result: wasResync ? 'resync' : 'progress',
      completedPattern: null,
      nextState: {
        buffer: nextBuffer,
        lastCompletedPatternId: state.lastCompletedPatternId,
      },
    };
  }

  return {
    result: 'miss',
    completedPattern: null,
    nextState: {
      buffer: [],
      lastCompletedPatternId: state.lastCompletedPatternId,
    },
  };
}

/** On chord change: keep longest suffix that is a prefix of any next-chord pattern. No completion. */
export function handleChordChange(
  state: AdlibRuntimeState,
  nextPatterns: readonly AdlibPattern[],
): AdlibRuntimeState {
  return {
    ...state,
    buffer: longestSuffixPrefix(state.buffer, nextPatterns),
  };
}

/** CM7 demo patterns (pitch classes relative to C=0). */
export const CM7_ADLIB_PATTERNS: readonly AdlibPattern[] = [
  { id: 'CM7-A-CD', label: 'A', pcs: [0, 2], familyId: 'CM7-A', carryTailLength: 0 },
  { id: 'CM7-A-DC', label: 'A', pcs: [2, 0], familyId: 'CM7-A', carryTailLength: 0 },
  { id: 'CM7-B-EG', label: 'B', pcs: [4, 7], familyId: 'CM7-B', carryTailLength: 0 },
  { id: 'CM7-B-GE', label: 'B', pcs: [7, 4], familyId: 'CM7-B', carryTailLength: 0 },
  { id: 'CM7-C-AB', label: 'C', pcs: [9, 11], familyId: 'CM7-C', carryTailLength: 0 },
  { id: 'CM7-C-BA', label: 'C', pcs: [11, 9], familyId: 'CM7-C', carryTailLength: 0 },
  { id: 'CM7-D-BC', label: 'D', pcs: [11, 0], familyId: 'CM7-D', carryTailLength: 1 },
  { id: 'CM7-Ap-DBC', label: "A'", pcs: [2, 11, 0], familyId: 'CM7-Ap', carryTailLength: 1 },
  { id: 'CM7-Ap-BDC', label: "A'", pcs: [11, 2, 0], familyId: 'CM7-Ap', carryTailLength: 1 },
  {
    id: 'CM7-App-BDDbBC',
    label: "A''",
    pcs: [11, 2, 1, 11, 0],
    familyId: 'CM7-App',
    carryTailLength: 1,
  },
];
