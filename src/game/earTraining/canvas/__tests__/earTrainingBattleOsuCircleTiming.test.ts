import {
  computeOsuCircleTiming,
  getOsuCircleOverlapOuterRadiusPx,
  OSU_CIRCLE_INNER_RADIUS_PX,
  OSU_CIRCLE_LINE_WIDTH,
  OSU_CIRCLE_OUTER_START_RADIUS_PX,
  resolveOsuApproachCirclePhraseTiming,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCircleTiming';
import { PARRY_MAX_RADIUS_PX } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import { chordOsmdApproachLeadSec, chordOsmdBeatToTargetTimeSec } from '@/utils/earTrainingChordOsmd';

const baseInput = {
  approachStartPhraseSec: 1.0,
  judgedPhraseSec: 1.5,
  centerX: 200,
  targetY: 300,
};

describe('computeOsuCircleTiming', () => {
  it('内円は従来パリィ最大半径、アプローチ外円はその2倍から開始', () => {
    expect(OSU_CIRCLE_INNER_RADIUS_PX).toBe(PARRY_MAX_RADIUS_PX);
    expect(OSU_CIRCLE_OUTER_START_RADIUS_PX).toBe(PARRY_MAX_RADIUS_PX * 2);
    expect(OSU_CIRCLE_LINE_WIDTH).toBeLessThan(5);
  });

  it('approachStartPhraseSec 以前は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: 0.999,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('hidden');
  });

  it('1拍前: 外円は最大半径で内円が表示開始', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: 1.0,
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
      nowPhraseSec: 1.5,
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
      nowPhraseSec: 1.5,
    });
    const afterJudged = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: 1.8,
    });
    expect(afterJudged.outerRadius).toBe(atJudged.outerRadius);
    expect(afterJudged.phase).toBe('locked');
  });

  it('burst 後は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: 1.6,
      burstAtPhraseSec: 1.55,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('burst');
  });

  it('dismiss 後は非表示', () => {
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: 1.6,
      dismissed: true,
    });
    expect(state.visible).toBe(false);
    expect(state.phase).toBe('dismissed');
  });

  it('早押し窓（-250ms）付近では外円が内円外周に接しない', () => {
    const beatSec = baseInput.judgedPhraseSec - baseInput.approachStartPhraseSec;
    const earlyWindowSec = 0.25;
    const overlapOuter = getOsuCircleOverlapOuterRadiusPx();
    const state = computeOsuCircleTiming({
      ...baseInput,
      nowPhraseSec: baseInput.judgedPhraseSec - earlyWindowSec,
    });
    expect(beatSec).toBeCloseTo(0.5, 5);
    expect(state.outerRadius).toBeGreaterThan(overlapOuter + 1);
  });
});

describe('phrase timeline alignment', () => {
  it('接円ジャストは judgedPhraseSec と同一 phrase 時刻で locked になる', () => {
    const judgedPhraseSec = 2.44;
    const approachLeadSec = chordOsmdApproachLeadSec(100);
    const timing = resolveOsuApproachCirclePhraseTiming(judgedPhraseSec, approachLeadSec);
    const atJust = computeOsuCircleTiming({
      nowPhraseSec: judgedPhraseSec,
      approachStartPhraseSec: timing.approachStartPhraseSec,
      judgedPhraseSec: timing.judgedPhraseSec,
      centerX: 0,
      targetY: 0,
    });
    expect(atJust.phase).toBe('locked');
    expect(timing.approachStartPhraseSec).toBeCloseTo(judgedPhraseSec - approachLeadSec, 5);
  });
});

describe('swing residual', () => {
  it('裏拍ターゲットでは even 1拍 lead と swung gap が一致しない（一律調整では吸収しきれない）', () => {
    const target = chordOsmdBeatToTargetTimeSec(1, 1.5, 100, 4, true);
    const prevOnbeat = chordOsmdBeatToTargetTimeSec(1, 1, 100, 4, true);
    const swungGap = target - prevOnbeat;
    const evenLead = chordOsmdApproachLeadSec(100);
    expect(swungGap).toBeCloseTo(0.4, 5);
    expect(evenLead).toBeCloseTo(0.6, 5);
    expect(swungGap).not.toBeCloseTo(evenLead, 2);
  });
});
