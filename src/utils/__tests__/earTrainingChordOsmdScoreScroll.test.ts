import {
  OSMD_BATTLE_PLAYHEAD_PX,
  computeOsmdMeasureJumpScrollOffset,
} from '@/utils/earTrainingChordOsmdScoreScroll';

const bounds = {
  1: { left: 10, right: 90 },
  2: { left: 100, right: 220 },
  3: { left: 220, right: 340 },
};

const centers = {
  1: 50,
  2: 160,
  3: 280,
};

describe('computeOsmdMeasureJumpScrollOffset', () => {
  it('現在小節の左端（小節線）をプレイヘッド位置へ合わせる', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(10);
    expect(result.offsetPx).toBe(0);
  });

  it('小節が変わると小節線位置に合わせてオフセットが更新される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 2,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(100);
    expect(result.offsetPx).toBe(0);
  });

  it('小節境界が無い場合は中心座標へフォールバックする', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 2,
      measureBoundsByNumber: {},
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(160);
  });

  it('オフセットは scoreWidth に clamp される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 300,
      viewportWidth: 400,
    });
    expect(result.offsetPx).toBe(0);
  });
});
