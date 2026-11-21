import type { DefenseStage } from '@/game/defense/defenseTypes';

export const DEFENSE_CALL_RESPONSE_LEAD_SEC = 0.03;

export interface DefenseCallResponseConfig {
  readonly audioLoopBars: number;
  readonly callResponseBars: number;
}

export type DefenseCallResponsePhase = 'call' | 'response' | 'transition_wait';

export type DefenseEnemyBehavior = 'approach' | 'dance' | 'pause';

export type DefenseCallResponseCue = 'listen' | 'play' | null;

export interface DefenseCallResponseSnapshot {
  readonly enabled: boolean;
  readonly phase: DefenseCallResponsePhase;
  readonly judgeActive: boolean;
  readonly enemyBehavior: DefenseEnemyBehavior;
  readonly cue: DefenseCallResponseCue;
  readonly barIndexInLoop: number;
  readonly danceBeatPhase: number;
}

const disabledSnapshot: DefenseCallResponseSnapshot = {
  enabled: false,
  phase: 'response',
  judgeActive: true,
  enemyBehavior: 'approach',
  cue: null,
  barIndexInLoop: 0,
  danceBeatPhase: 0,
};

export const getDefenseCallResponseConfig = (
  stage: Pick<DefenseStage, 'audioLoopBars' | 'callResponseBars'>,
): DefenseCallResponseConfig | null => {
  const callResponseBars = stage.callResponseBars;
  const audioLoopBars = stage.audioLoopBars;
  if (
    callResponseBars == null
    || callResponseBars < 1
    || audioLoopBars == null
    || audioLoopBars < callResponseBars * 2
    || audioLoopBars % (callResponseBars * 2) !== 0
  ) {
    return null;
  }
  return { audioLoopBars, callResponseBars };
};

export const resolveDefenseCallResponseState = (params: {
  readonly config: DefenseCallResponseConfig | null;
  readonly elapsedFromPhraseStartSec: number;
  readonly barSec: number;
  readonly beatsPerBar: number;
  readonly transitionWaitUntilElapsedSec: number | null;
}): DefenseCallResponseSnapshot => {
  const { config, elapsedFromPhraseStartSec, barSec, beatsPerBar, transitionWaitUntilElapsedSec } = params;
  if (config === null) {
    return disabledSnapshot;
  }

  const safeBarSec = Math.max(1e-6, barSec);

  if (
    transitionWaitUntilElapsedSec !== null
    && elapsedFromPhraseStartSec < transitionWaitUntilElapsedSec
  ) {
    const tWait = Math.max(0, elapsedFromPhraseStartSec);
    const barIndex = Math.floor(tWait / safeBarSec);
    return {
      enabled: true,
      phase: 'transition_wait',
      judgeActive: false,
      enemyBehavior: 'pause',
      cue: null,
      barIndexInLoop: barIndex % config.audioLoopBars,
      danceBeatPhase: 0,
    };
  }

  if (elapsedFromPhraseStartSec < 0) {
    return {
      enabled: true,
      phase: 'call',
      judgeActive: false,
      enemyBehavior: 'dance',
      cue: 'listen',
      barIndexInLoop: 0,
      danceBeatPhase: 0,
    };
  }

  const t = Math.max(0, elapsedFromPhraseStartSec);
  const barIndex = Math.floor(t / safeBarSec);
  const barIndexInLoop = barIndex % config.audioLoopBars;
  const cycleBars = config.callResponseBars * 2;
  const posInCycle = barIndex % cycleBars;
  const isCall = posInCycle < config.callResponseBars;
  const phase: DefenseCallResponsePhase = isCall ? 'call' : 'response';
  const enemyBehavior: DefenseEnemyBehavior = isCall ? 'dance' : 'approach';
  const cue: DefenseCallResponseCue = isCall ? 'listen' : 'play';

  let judgeActive = false;
  if (!isCall) {
    judgeActive = true;
  } else if (
    posInCycle === config.callResponseBars - 1
    && (barIndex + 1) * safeBarSec - t <= DEFENSE_CALL_RESPONSE_LEAD_SEC + 1e-9
  ) {
    judgeActive = true;
  }

  const danceBeatPhase = (t / safeBarSec) * Math.max(1, beatsPerBar);

  return {
    enabled: true,
    phase,
    judgeActive,
    enemyBehavior,
    cue,
    barIndexInLoop,
    danceBeatPhase,
  };
};

export const resolveCallResponseTransitionEndBar = (
  elapsedFromPhraseStartSec: number,
  barSec: number,
): number => {
  const safeBarSec = Math.max(1e-6, barSec);
  return Math.floor(Math.max(0, elapsedFromPhraseStartSec) / safeBarSec) + 1;
};