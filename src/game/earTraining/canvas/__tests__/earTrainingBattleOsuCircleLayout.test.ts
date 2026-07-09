import {
  applyOsuCircleAnchorOffset,
  resolveOsuCircleAnchorOffset,
} from '../earTrainingBattleOsuCircleLayout';

describe('earTrainingBattleOsuCircleLayout', () => {
  it('同じ layoutIndex なら毎回同じオフセットを返す', () => {
    expect(resolveOsuCircleAnchorOffset(0)).toEqual({ offsetX: 0, offsetY: 0 });
    expect(resolveOsuCircleAnchorOffset(1)).toEqual({ offsetX: -22, offsetY: -10 });
    expect(resolveOsuCircleAnchorOffset(1)).toEqual({ offsetX: -22, offsetY: -10 });
  });

  it('パターンを超えた index はループする', () => {
    expect(resolveOsuCircleAnchorOffset(8)).toEqual(resolveOsuCircleAnchorOffset(0));
    expect(resolveOsuCircleAnchorOffset(9)).toEqual(resolveOsuCircleAnchorOffset(1));
  });

  it('applyOsuCircleAnchorOffset は基準座標にオフセットを加える', () => {
    expect(applyOsuCircleAnchorOffset(200, 320, 2)).toEqual({
      centerX: 222,
      targetY: 310,
    });
  });
});
