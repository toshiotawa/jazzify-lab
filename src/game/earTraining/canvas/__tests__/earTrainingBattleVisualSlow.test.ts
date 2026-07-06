import {
  getVisualNow,
  getVisualSlowCompensation,
  PARRY_VISUAL_SLOW_DURATION_MS,
  PARRY_VISUAL_SLOW_SCALE,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';

describe('earTrainingBattle visual slow', () => {
  const slow = {
    startedAt: 1_000,
    durationMs: PARRY_VISUAL_SLOW_DURATION_MS,
    scale: PARRY_VISUAL_SLOW_SCALE,
  };

  it('returns zero compensation before slow starts', () => {
    expect(getVisualSlowCompensation(900, slow)).toBe(0);
    expect(getVisualNow(900, slow)).toBe(900);
  });

  it('slows visual time during the slow window', () => {
    const midReal = slow.startedAt + slow.durationMs / 2;
    const compensation = getVisualSlowCompensation(midReal, slow);
    expect(compensation).toBeCloseTo((slow.durationMs / 2) * (1 - slow.scale));
    expect(getVisualNow(midReal, slow)).toBeCloseTo(midReal - compensation);
  });

  it('caps compensation after slow ends', () => {
    const afterReal = slow.startedAt + slow.durationMs + 100;
    const maxCompensation = slow.durationMs * (1 - slow.scale);
    expect(getVisualSlowCompensation(afterReal, slow)).toBeCloseTo(maxCompensation);
    expect(getVisualNow(afterReal, slow)).toBeCloseTo(afterReal - maxCompensation);
  });
});
