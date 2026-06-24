import {
  OSMD_BATTLE_PLAYHEAD_PX,
  computeOsmdActiveMeasureHighlight,
  computeOsmdMeasureJumpScrollOffset,
} from '@/utils/earTrainingChordOsmdScoreScroll';

const bounds = {
  1: { left: 10, right: 90 },
  2: { left: 100, right: 220 },
  3: { left: 220, right: 340 },
  4: { left: 400, right: 520 },
};

const centers = {
  1: 50,
  2: 160,
  3: 280,
  4: 460,
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

  it('1小節目は noteLeft があれば記号域を除いた音符位置でスクロールする', () => {
    const firstMeasureBounds = {
      1: { left: 10, right: 90, noteLeft: 70, noteRight: 85 },
    };
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: firstMeasureBounds,
      measureCentersByNumber: { 1: 50 },
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(70);
    expect(result.offsetPx).toBe(0);
  });
});

describe('computeOsmdActiveMeasureHighlight', () => {
  it('曲頭はスクロールがクランプされても小節左端に追従する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: 10,
      widthPx: 80,
      visible: true,
    });
  });

  it('中央域ではプレイヘッド位置と一致する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: OSMD_BATTLE_PLAYHEAD_PX,
      widthPx: 120,
      visible: true,
    });
  });

  it('終盤でスクロール不能でもハイライトは進む', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 4,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 300,
      viewportWidth: 400,
    });
    expect(scroll.offsetPx).toBe(0);
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 4,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: 400,
      widthPx: 120,
      visible: true,
    });
  });

  it('effectiveScale を幅と位置に反映する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1.5,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1.5,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result.widthPx).toBe(120);
    expect(result.leftPx).toBe(15);
  });

  it('小節境界が無い場合は非表示', () => {
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 2,
      measureBoundsByNumber: {},
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: 0,
    });
    expect(result.visible).toBe(false);
  });
});
