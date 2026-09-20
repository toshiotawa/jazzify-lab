import { describe, expect, it } from 'vitest';

import {
  planSharedProgressionSwitch,
  sharedProgressionBarOffsetSec,
  sharedProgressionBarSeconds,
} from '@/game/defense/defenseSharedProgressionTransport';

const N = 12;
const K1 = 1 as const;
const K2 = 2 as const;
const K4 = 4 as const;
const t0 = 0;
const barSec = sharedProgressionBarSeconds(120, 4, 1);

describe('planSharedProgressionSwitch', () => {
  it('uses K=1 boundaries for 1-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 5,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 6,
      destinationBar0: 3,
      absoluteSwitchBar0: 3,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 11,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 12,
      destinationBar0: 6,
      absoluteSwitchBar0: 6,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 23,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K1,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 24,
      destinationBar0: 0,
      absoluteSwitchBar0: 12,
    });
  });

  it('uses K=2 boundaries for 2-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 5,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 8,
      destinationBar0: 4,
      absoluteSwitchBar0: 4,
    });

    expect(planSharedProgressionSwitch({
      nowAudioTime: 7,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 8,
      destinationBar0: 4,
      absoluteSwitchBar0: 4,
    });
  });

  it('uses K=4 boundaries for 4-bar phrases', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 11,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K4,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 16,
      destinationBar0: 8,
      absoluteSwitchBar0: 8,
    });
  });

  it('skips to the next K boundary when scheduling lead is missed', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 7.95,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K4,
      schedulingLeadSec: 0.1,
    })).toEqual({
      switchAt: 16,
      destinationBar0: 8,
      absoluteSwitchBar0: 8,
    });
  });

  it('does not move to the next bar when arriving exactly on a boundary', () => {
    expect(planSharedProgressionSwitch({
      nowAudioTime: 8,
      transportStart: t0,
      barSec,
      progressionBars: N,
      switchEveryBars: K2,
      schedulingLeadSec: 0,
    })).toEqual({
      switchAt: 12,
      destinationBar0: 6,
      absoluteSwitchBar0: 6,
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
      schedulingLeadSec: 0,
    });
    expect(plan.switchAt).toBe(12);
    expect(sharedProgressionBarOffsetSec(plan.destinationBar0, halfBarSec)).toBeCloseTo(12);
  });
});
