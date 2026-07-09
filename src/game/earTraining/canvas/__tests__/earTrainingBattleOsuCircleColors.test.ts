import {
  getOsuCircleInnerStroke,
  getOsuCircleOuterStroke,
  OSU_CIRCLE_COLOR_PATTERN_COUNT,
  resolveOsuCircleColorIndex,
} from '../earTrainingBattleOsuCircleColors';

describe('resolveOsuCircleColorIndex', () => {
  it('1 小節区間なら小節ごとに 4 色を循環する', () => {
    expect(resolveOsuCircleColorIndex(1, 24, 1)).toBe(0);
    expect(resolveOsuCircleColorIndex(2, 24, 1)).toBe(1);
    expect(resolveOsuCircleColorIndex(3, 24, 1)).toBe(2);
    expect(resolveOsuCircleColorIndex(4, 24, 1)).toBe(3);
    expect(resolveOsuCircleColorIndex(5, 24, 1)).toBe(0);
  });

  it('ループ境界で小節位置を正規化する', () => {
    expect(resolveOsuCircleColorIndex(25, 24, 1)).toBe(0);
    expect(resolveOsuCircleColorIndex(26, 24, 1)).toBe(1);
  });

  it('2 小節区間なら 2 小節まとめで色が変わる', () => {
    expect(resolveOsuCircleColorIndex(1, 8, 2)).toBe(0);
    expect(resolveOsuCircleColorIndex(2, 8, 2)).toBe(0);
    expect(resolveOsuCircleColorIndex(3, 8, 2)).toBe(1);
    expect(resolveOsuCircleColorIndex(4, 8, 2)).toBe(1);
  });
});

describe('getOsuCircleInnerStroke', () => {
  it('index をパレット長でラップする', () => {
    expect(getOsuCircleInnerStroke(0)).toBe('#f9a8d4');
    expect(getOsuCircleInnerStroke(OSU_CIRCLE_COLOR_PATTERN_COUNT)).toBe('#f9a8d4');
  });
});

describe('getOsuCircleOuterStroke', () => {
  it('内円と同系色の半透明 rgba を返す', () => {
    expect(getOsuCircleOuterStroke(1)).toBe('rgba(147, 197, 253, 0.38)');
  });
});
