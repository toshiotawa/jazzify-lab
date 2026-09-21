import { describe, expect, it } from 'vitest';

import {
  isSharedProgressionFrameCountValid,
  planSharedProgressionSwitch,
  sharedProgressionBarOffsetSec,
  sharedProgressionBarSeconds,
} from '@/game/defense/defenseSharedProgressionTransport';
import { beatSeconds } from '@/game/defense/defenseTransport';

const N = 12;
const K1 = 1 as const;
const K2 = 2 as const;
const K4 = 4 as const;
const t0 = 0;
const barSec = sharedProgressionBarSeconds(120, 4, 1);
const beatSec = beatSeconds(120, 1);

describe('planSharedProgressionSwitch', () => {
  it('uses K=1 boundaries for 1-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 5,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      beatSec,
    })).toEqual({
      switchAt: 6,
      destinationBar0: 3,
      absoluteSwitchBar0: 3,
      immediate: false,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 11,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      beatSec,
    })).toEqual({
      switchAt: 12,
      destinationBar0: 6,
      absoluteSwitchBar0: 6,
      immediate: false,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 23,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      beatSec,
    })).toEqual({
      switchAt: 24,
      destinationBar0: 0,
      absoluteSwitchBar0: 12,
      immediate: false,
    });
  });

  it('uses K=2 boundaries for 2-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 5,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      beatSec,
    })).toEqual({
      switchAt: 8,
      destinationBar0: 4,
      absoluteSwitchBar0: 4,
      immediate: false,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 7,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      beatSec,
    })).toEqual({
      switchAt: 8,
      destinationBar0: 4,
      absoluteSwitchBar0: 4,
      immediate: false,
    });
  });

  it('uses K=4 boundaries for 4-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 11,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K4,
      beatSec,
    })).toEqual({
      switchAt: 16,
      destinationBar0: 8,
      absoluteSwitchBar0: 8,
      immediate: false,
    });
  });

  it('targets upcoming K boundary even inside old lead window', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 7.95,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K4,
      beatSec,
    })).toEqual({
      switchAt: 8,
      destinationBar0: 4,
      absoluteSwitchBar0: 4,
      immediate: false,
    });
  });

  it('immediate within one beat after boundary', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 8.2,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      beatSec,
    })).toMatchObject({
      immediate: true,
      switchAt: 8.2,
      destinationBar0: 4,
    });
  });

  it('does not move to the next bar when arriving exactly on a boundary', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 8,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      beatSec,
    })).toMatchObject({
      immediate: true,
      switchAt: 8,
      destinationBar0: 4,
    });
  });

  it('preserves source bar offset at half speed in processed seconds', () => {
    const halfBarSec = sharedProgressionBarSeconds(120, 4, 0.5);
    const plan = planSharedProgressionSwitch({
      nowAudioTime: 10,
      transportStart: t0,
      barSec: halfBarSec,
      progressionBars: N,
      switchEveryBars: K1,
      beatSec: beatSeconds(120, 0.5),
    });
    expect(plan.switchAt).toBe(12);
    expect(sharedProgressionBarOffsetSec(plan.destinationBar0, halfBarSec)).toBeCloseTo(12);
  });
});

describe('isSharedProgressionFrameCountValid', () => {
  it('accepts AAC padding of tens of milliseconds', () => {
    const sampleRate = 44100;
    const expected = Math.round(18 * sampleRate);
    expect(isSharedProgressionFrameCountValid(expected + 324, expected, sampleRate)).toBe(true);
    expect(isSharedProgressionFrameCountValid(expected - 1, expected, sampleRate)).toBe(true);
  });

  it('rejects files that are a whole extra bar long', () => {
    const sampleRate = 44100;
    const expected = Math.round(18 * sampleRate);
    const extraBar = Math.round(1.5 * sampleRate);
    expect(isSharedProgressionFrameCountValid(expected + extraBar, expected, sampleRate)).toBe(false);
  });
});
