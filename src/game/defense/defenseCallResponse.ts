import type { DefenseStage } from '@/game/defense/defenseTypes';

const DEFENSE_CALL_RESPONSE_LEAD_SEC = 0.03;

interface DefenseCallResponseConfig {
  readonly audioLoopBars: number;
  readonly callResponseBars: number;
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
  danceBeatPhase: number;
}

export const createDefenseCallResponseSnapshot = (): MutableDefenseCallResponseSnapshot => ({
  enabled: false,
  phase: 'response',
  judgeActive: true,
  enemyBehavior: 'approach',
  cue: null,
  barIndexInLoop: 0,
  danceBeatPhase: 0,
});

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
    out.danceBeatPhase = 0;
    return out;
  }

  const t = Math.max(0, elapsedFromPhraseStartSec);
  const barIndex = Math.floor(t / safeBarSec);
  const barIndexInLoop = barIndex % config.audioLoopBars;
  const cycleBars = config.callResponseBars * 2;
  const posInCycle = barIndex % cycleBars;
  const isCall = posInCycle < config.callResponseBars;

  let judgeActive = false;
  if (!isCall) {
    judgeActive = true;
  } else if (
    posInCycle === config.callResponseBars - 1
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
  out.danceBeatPhase = (t / safeBarSec) * Math.max(1, beatsPerBar);
  return out;
};