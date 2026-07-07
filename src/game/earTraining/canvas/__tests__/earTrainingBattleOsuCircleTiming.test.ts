import {
  computeOsuCircleTiming,
  getOsuCircleOverlapOuterRadiusPx,
  OSU_CIRCLE_INNER_RADIUS_PX,
  OSU_CIRCLE_LINE_WIDTH,
  OSU_CIRCLE_OUTER_START_RADIUS_PX,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCircleTiming';
import { PARRY_MAX_RADIUS_PX } from '@/game/earTraining/canvas/earTrainingBattleDrawState';

const baseInput = {
  approachStartMs: 1000,
  judgedMs: 1500,
  centerX: 200,
  targetY: 300,
};

describe('computeOsuCircleTiming', () => {
  it('内円は従来パリィ最大半径、アプローチ外円はその2倍から開始', () => {
    expect(OSU_CIRCLE_INNER_RADIUS_PX).toBe(PARRY_MAX_RADIUS_PX);
    expect(OSU_CIRCLE_OUTER_START_RADIUS_PX).toBe(PARRY_MAX_RADIUS_PX * 2);
    expect(OSU_CIRCLE_LINE_WIDTH).toBeLessThan(5);
  });

  it('approachStartMs 以前は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 999,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('hidden');
  });

  it('1拍前: 外円は最大半径で内円が表示開始', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1000,
    });
    expect(state.visible).toBe(true);
    expect(state.phase).toBe('approach');
    expect(state.outerRadius).toBe(OSU_CIRCLE_OUTER_START_RADIUS_PX);
    expect(state.innerRadius).toBe(OSU_CIRCLE_INNER_RADIUS_PX);
  });

  it('判定時刻: 外円が内円外周に接する', () => {
    const overlapOuter = getOsuCircleOverlapOuterRadiusPx();
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1500,
    });
    expect(state.visible).toBe(true);
    expect(state.phase).toBe('locked');
    expect(state.outerRadius).toBe(overlapOuter);
    expect(state.innerRadius).toBe(OSU_CIRCLE_INNER_RADIUS_PX);
    expect(state.outerRadius).toBe(OSU_CIRCLE_INNER_RADIUS_PX + OSU_CIRCLE_LINE_WIDTH);
  });

  it('判定後: 外円がさらに縮まない', () => {
    const atJudged = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1500,
    });
    const afterJudged = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1800,
    });
    expect(afterJudged.outerRadius).toBe(atJudged.outerRadius);
    expect(afterJudged.phase).toBe('locked');
  });

  it('burst 後は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1600,
      burstAtMs: 1550,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('burst');
  });

  it('dismiss 後は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: 1600,
      dismissed: true,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('dismissed');
  });

  it('早押し窓（-250ms）付近では外円が内円外周に接しない', () => {
    const beatMs = baseInput.judgedMs - baseInput.approachStartMs;
    const earlyWindowMs = 250;
    const overlapOuter = getOsuCircleOverlapOuterRadiusPx();
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowMs: baseInput.judgedMs - earlyWindowMs,
    });
    expect(beatMs).toBe(500);
    expect(state.outerRadius).toBeGreaterThan(overlapOuter + 1);
  });
});
