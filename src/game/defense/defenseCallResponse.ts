import type { DefenseStage } from '@/game/defense/defenseTypes';

const DEFENSE_CALL_RESPONSE_LEAD_SEC = 0.03;

export interface DefenseCallResponseConfig {
  readonly audioLoopBars: number;
  readonly callBars: number;
  readonly responseBars: number;
  readonly cycleBars: number;
}

export type DefenseCallResponsePhase = 'call' | 'response' | 'transition_wait';

export type DefenseEnemyBehavior = 'approach' | 'dance' | 'pause';

export type DefenseCallResponseCue = 'listen' | 'play' | null;

interface MutableDefenseCallResponseSnapshot {
  enabled: boolean;
  phase: DefenseCallResponsePhase;
  judgeActive: boolean;
  enemyBehavior: DefenseEnemyBehavior;
  cue: DefenseCallResponseCue;
  barIndexInLoop: number;
  loopIndex: number;
  danceBeatPhase: number;
}

export const createDefenseCallResponseSnapshot = (): MutableDefenseCallResponseSnapshot => ({
  enabled: false,
  phase: 'response',
  judgeActive: true,
  enemyBehavior: 'approach',
  cue: null,
  barIndexInLoop: 0,
  loopIndex: 0,
  danceBeatPhase: 0,
});

export const getDefenseCallResponseConfig = (
  stage: Pick<DefenseStage, 'audioLoopBars' | 'callResponseBars' | 'callResponseResponseBars'>,
): DefenseCallResponseConfig | null => {
  const callBars = stage.callResponseBars;
  const audioLoopBars = stage.audioLoopBars;
  if (
    callBars == null
    || callBars < 1
    || audioLoopBars == null
    || audioLoopBars < 1
  ) {
    return null;
  }

  const responseBars = stage.callResponseResponseBars ?? callBars;
  const cycleBars = callBars + responseBars;

  if (stage.callResponseResponseBars == null) {
    if (
      audioLoopBars < callBars * 2
      || audioLoopBars % (callBars * 2) !== 0
    ) {
      return null;
    }
  } else if (
    audioLoopBars < cycleBars
    || audioLoopBars % cycleBars !== 0
  ) {
    return null;
  }

  return {
    audioLoopBars,
    callBars,
    responseBars,
    cycleBars,
  };
};

export const resolveDefenseCallResponseState = (
  params: {
    readonly config: DefenseCallResponseConfig | null;
    readonly elapsedFromPhraseStartSec: number;
    readonly barSec: number;
    readonly beatsPerBar: number;
    readonly transitionWaitUntilElapsedSec: number | null;
  },
  out: MutableDefenseCallResponseSnapshot = createDefenseCallResponseSnapshot(),
): MutableDefenseCallResponseSnapshot => {
  const { config, elapsedFromPhraseStartSec, barSec, beatsPerBar, transitionWaitUntilElapsedSec } = params;
  if (config === null) {
    out.enabled = false;
    out.phase = 'response';
    out.judgeActive = true;
    out.enemyBehavior = 'approach';
    out.cue = null;
    out.barIndexInLoop = 0;
    out.loopIndex = 0;
    out.danceBeatPhase = 0;
    return out;
  }

  const safeBarSec = Math.max(1e-6, barSec);

  if (
    transitionWaitUntilElapsedSec !== null
    && elapsedFromPhraseStartSec < transitionWaitUntilElapsedSec
  ) {
    const tWait = Math.max(0, elapsedFromPhraseStartSec);
    const barIndex = Math.floor(tWait / safeBarSec);
    out.enabled = true;
    out.phase = 'transition_wait';
    out.judgeActive = false;
    out.enemyBehavior = 'pause';
    out.cue = null;
    out.barIndexInLoop = barIndex % config.audioLoopBars;
    out.loopIndex = Math.floor(barIndex / config.audioLoopBars);
    out.danceBeatPhase = 0;
    return out;
  }

  if (elapsedFromPhraseStartSec < 0) {
    out.enabled = true;
    out.phase = 'call';
    out.judgeActive = false;
    out.enemyBehavior = 'dance';
    out.cue = 'listen';
    out.barIndexInLoop = 0;
    out.loopIndex = 0;
    out.danceBeatPhase = 0;
    return out;
  }

  const t = Math.max(0, elapsedFromPhraseStartSec);
  const barIndex = Math.floor(t / safeBarSec);
  const barIndexInLoop = barIndex % config.audioLoopBars;
  const loopIndex = Math.floor(barIndex / config.audioLoopBars);
  const posInCycle = barIndex % config.cycleBars;
  const isCall = posInCycle < config.callBars;

  let judgeActive = false;
  if (!isCall) {
    judgeActive = true;
  } else if (
    posInCycle === config.callBars - 1
    && (barIndex + 1) * safeBarSec - t <= DEFENSE_CALL_RESPONSE_LEAD_SEC + 1e-9
  ) {
    judgeActive = true;
  }

  out.enabled = true;
  out.phase = isCall ? 'call' : 'response';
  out.judgeActive = judgeActive;
  out.enemyBehavior = isCall ? 'dance' : 'approach';
  out.cue = isCall ? 'listen' : 'play';
  out.barIndexInLoop = barIndexInLoop;
  out.loopIndex = loopIndex;
  out.danceBeatPhase = (t / safeBarSec) * Math.max(1, beatsPerBar);
  return out;
};