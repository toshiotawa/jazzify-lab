import {
  OSMD_BATTLE_PLAYHEAD_PX,
  computeOsmdMeasureJumpScrollOffset,
} from '@/utils/earTrainingChordOsmdScoreScroll';

const centers = {
  1: 50,
  2: 160,
  3: 280,
};

describe('computeOsmdMeasureJumpScrollOffset', () => {
  it('現在小節の中心をプレイヘッド位置へ合わせる', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(50);
    expect(result.offsetPx).toBe(0);
  });

  it('小節が変わるとオフセットが更新される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 2,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(160);
    expect(result.offsetPx).toBe(40);
  });

  it('中心が取れない場合は小節1またはビューポート中央へフォールバックする', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 5,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(50);
  });

  it('オフセットは scoreWidth に clamp される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 3,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 300,
      viewportWidth: 400,
    });
    expect(result.offsetPx).toBe(0);
  });
});
