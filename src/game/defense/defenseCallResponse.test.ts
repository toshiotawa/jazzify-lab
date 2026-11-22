import { describe, expect, it } from 'vitest';
import {
  createDefenseCallResponseSnapshot,
  getDefenseCallResponseConfig,
  resolveDefenseCallResponseState,
} from '@/game/defense/defenseCallResponse';

const config8x1 = {
  audioLoopBars: 8,
  callBars: 1,
  responseBars: 1,
  cycleBars: 2,
} as const;
const config4x1x3 = {
  audioLoopBars: 4,
  callBars: 1,
  responseBars: 3,
  cycleBars: 4,
} as const;
const config8x2 = {
  audioLoopBars: 8,
  callBars: 2,
  responseBars: 2,
  cycleBars: 4,
} as const;
const barSec = 2;
const beatsPerBar = 4;

describe('getDefenseCallResponseConfig', () => {
  it('accepts valid loop/call-response sizing', () => {
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 8,
      callResponseBars: 1,
      callResponseResponseBars: null,
    })).toEqual(config8x1);
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 4,
      callResponseBars: 1,
      callResponseResponseBars: 3,
    })).toEqual(config4x1x3);
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 8,
      callResponseBars: 2,
      callResponseResponseBars: null,
    })).toEqual(config8x2);
  });

  it('rejects invalid values', () => {
    expect(getDefenseCallResponseConfig({
      audioLoopBars: null,
      callResponseBars: 1,
      callResponseResponseBars: null,
    })).toBeNull();
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 8,
      callResponseBars: null,
      callResponseResponseBars: null,
    })).toBeNull();
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 7,
      callResponseBars: 1,
      callResponseResponseBars: null,
    })).toBeNull();
    expect(getDefenseCallResponseConfig({
      audioLoopBars: 5,
      callResponseBars: 1,
      callResponseResponseBars: 3,
    })).toBeNull();
  });
});

describe('resolveDefenseCallResponseState', () => {
  it('returns disabled defaults when config is null', () => {
    const snap = resolveDefenseCallResponseState({
      config: null,
      elapsedFromPhraseStartSec: 1,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(snap.enabled).toBe(false);
    expect(snap.enemyBehavior).toBe('approach');
    expect(snap.judgeActive).toBe(true);
  });

  it('alternates call and response bars in an 8-bar loop (1:1)', () => {
    const call = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 0.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(call.phase).toBe('call');
    expect(call.cue).toBe('listen');
    expect(call.enemyBehavior).toBe('dance');

    const response = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 2.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(response.phase).toBe('response');
    expect(response.cue).toBe('play');
    expect(response.judgeActive).toBe(true);
    expect(response.enemyBehavior).toBe('approach');
  });

  it('uses 1-bar call and 3-bar response in a 4-bar loop', () => {
    const call = resolveDefenseCallResponseState({
      config: config4x1x3,
      elapsedFromPhraseStartSec: 0.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(call.phase).toBe('call');
    expect(call.barIndexInLoop).toBe(0);
    expect(call.loopIndex).toBe(0);

    const responseMid = resolveDefenseCallResponseState({
      config: config4x1x3,
      elapsedFromPhraseStartSec: 4.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(responseMid.phase).toBe('response');
    expect(responseMid.barIndexInLoop).toBe(2);

    const wrap = resolveDefenseCallResponseState({
      config: config4x1x3,
      elapsedFromPhraseStartSec: 8,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(wrap.loopIndex).toBe(1);
    expect(wrap.phase).toBe('call');
    expect(wrap.barIndexInLoop).toBe(0);
  });

  it('wraps bar index within audioLoopBars', () => {
    const snap = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 17,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(snap.barIndexInLoop).toBe(0);
    expect(snap.phase).toBe('call');
    expect(snap.loopIndex).toBe(1);
  });

  it('enables judge 30ms before response for 1-bar call', () => {
    const before = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 1.969,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(before.judgeActive).toBe(false);

    const atLead = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 1.97,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(atLead.judgeActive).toBe(true);

    const atBarHead = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 2,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(atBarHead.judgeActive).toBe(true);
    expect(atBarHead.phase).toBe('response');
  });

  it('does not judge mid call bar', () => {
    const mid = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 1,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(mid.phase).toBe('call');
    expect(mid.judgeActive).toBe(false);
  });

  it('enables judge only on second call bar end for 2-bar call', () => {
    const firstBarEnd = resolveDefenseCallResponseState({
      config: config8x2,
      elapsedFromPhraseStartSec: 1.97,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(firstBarEnd.phase).toBe('call');
    expect(firstBarEnd.judgeActive).toBe(false);

    const secondBarEnd = resolveDefenseCallResponseState({
      config: config8x2,
      elapsedFromPhraseStartSec: 3.97,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(secondBarEnd.phase).toBe('call');
    expect(secondBarEnd.judgeActive).toBe(true);
  });

  it('handles transition_wait after phrase success', () => {
    const wait = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 5.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: 6,
    });
    expect(wait.phase).toBe('transition_wait');
    expect(wait.enemyBehavior).toBe('pause');
    expect(wait.judgeActive).toBe(false);
    expect(wait.cue).toBeNull();

    const after = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 8,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: 6,
    });
    expect(after.phase).toBe('call');
    expect(after.enemyBehavior).toBe('dance');
  });

  it('treats negative elapsed as call lead-in', () => {
    const snap = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: -0.05,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    });
    expect(snap.phase).toBe('call');
    expect(snap.judgeActive).toBe(false);
    expect(snap.barIndexInLoop).toBe(0);
  });

  it('reuses provided scratch snapshot without allocating a new object', () => {
    const scratch = createDefenseCallResponseSnapshot();
    const first = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 0.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    }, scratch);
    expect(first).toBe(scratch);
    expect(scratch.phase).toBe('call');

    const second = resolveDefenseCallResponseState({
      config: config8x1,
      elapsedFromPhraseStartSec: 2.5,
      barSec,
      beatsPerBar,
      transitionWaitUntilElapsedSec: null,
    }, scratch);
    expect(second).toBe(scratch);
    expect(scratch.phase).toBe('response');
  });
});