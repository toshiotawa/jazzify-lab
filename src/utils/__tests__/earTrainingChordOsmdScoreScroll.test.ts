import {
  OSMD_BATTLE_PLAYHEAD_PX,
  computeOsmdScoreScrollOffset,
} from '@/utils/earTrainingChordOsmdScoreScroll';
import { computeChordOsmdActiveMeasureNumber } from '@/utils/earTrainingChordOsmdTimeline';

const bounds = {
  1: { left: 0, right: 100 },
  2: { left: 100, right: 220 },
  3: { left: 220, right: 340 },
};

const centers = {
  1: 50,
  2: 160,
  3: 280,
};

describe('computeOsmdScoreScrollOffset', () => {
  it('カウントイン中は小節1の左端付近で静止する', () => {
    const result = computeOsmdScoreScrollOffset({
      phraseTimeSec: -0.5,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      measureDurationSec: 2,
      maxMeasure: 4,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.activeMeasureNumber).toBe(1);
    expect(result.xPos).toBe(0);
    expect(result.offsetPx).toBe(0);
  });

  it('小節内を線形補間して X 位置を算出する', () => {
    const result = computeOsmdScoreScrollOffset({
      phraseTimeSec: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      measureDurationSec: 2,
      maxMeasure: 4,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.activeMeasureNumber).toBe(1);
    expect(result.xPos).toBe(50);
    expect(result.offsetPx).toBe(0);
  });

  it('maxMeasure で小節番号を clamp する', () => {
    const result = computeOsmdScoreScrollOffset({
      phraseTimeSec: 10,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      measureDurationSec: 2,
      maxMeasure: 3,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.activeMeasureNumber).toBe(3);
  });

  it('activeMeasureNumber は computeChordOsmdActiveMeasureNumber と一致する', () => {
    const phraseTimeSec = 3.5;
    const measureDurationSec = 2;
    const maxMeasure = 4;
    const fromScroll = computeOsmdScoreScrollOffset({
      phraseTimeSec,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      measureDurationSec,
      maxMeasure,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    }).activeMeasureNumber;
    const fromTimeline = computeChordOsmdActiveMeasureNumber(
      phraseTimeSec,
      120,
      4,
      8,
      4,
      [{ measureNumber: 3 }],
    );
    expect(fromScroll).toBe(fromTimeline);
  });

  it('境界が無い場合は measureCentersByNumber にフォールバックする', () => {
    const result = computeOsmdScoreScrollOffset({
      phraseTimeSec: 0,
      measureBoundsByNumber: {},
      measureCentersByNumber: centers,
      measureDurationSec: 2,
      maxMeasure: 4,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(50);
  });
});
