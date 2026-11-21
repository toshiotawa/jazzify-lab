/** Pure call/response transport math. The audio transport, not wall-clock time, is authoritative. */
export interface DefenseCallResponseConfig {
  readonly audioLoopBars: number;
  readonly callBars: number;
  readonly beatsPerBar: number;
}

export interface DefenseCallResponsePosition {
  readonly phase: 'call' | 'response';
  /** Zero based call/response pair within the backing loop. */
  readonly pairIndex: number;
  /** Call stays visually active for the entire call measure, including the 30ms judging lead. */
  readonly judgmentOpen: boolean;
}

export const makeDefenseCallResponseConfig = (
  audioLoopBars: number,
  callBars: number,
  beatsPerBar: number,
): DefenseCallResponseConfig | null => {
  if (![audioLoopBars, callBars, beatsPerBar].every(
    (n) => Number.isSafeInteger(n) && n > 0,
  )) return null;
  if (audioLoopBars % (2 * callBars) !== 0) return null;
  return { audioLoopBars, callBars, beatsPerBar };
};

/**
 * positionBeats is the audible backing's unwrapped or loop-local beat offset.
 * Accept an onset from 30ms before each response; never judge during the rest of a call.
 */
export const defenseCallResponseAtBeat = (
  positionBeats: number,
  bpm: number,
  playbackRatio: number,
  config: DefenseCallResponseConfig,
): DefenseCallResponsePosition => {
  const loopBeats = config.audioLoopBars * config.beatsPerBar;
  const pairBeats = 2 * config.callBars * config.beatsPerBar;
  const safePosition = Number.isFinite(positionBeats) ? positionBeats : 0;
  const inLoop = ((safePosition % loopBeats) + loopBeats) % loopBeats;
  const pairIndex = Math.floor(inLoop / pairBeats);
  const inPair = inLoop - pairIndex * pairBeats;
  const callBeats = config.callBars * config.beatsPerBar;
  const isCall = inPair < callBeats;
  const secondsUntilResponse = (callBeats - inPair) * 60
    / Math.max(1, bpm) / Math.max(0.0001, playbackRatio);
  return {
    phase: isCall ? 'call' : 'response',
    pairIndex,
    judgmentOpen: !isCall || secondsUntilResponse <= 0.03,
  };
};
