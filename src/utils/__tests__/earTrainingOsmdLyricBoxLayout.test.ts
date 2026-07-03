import {
  estimateLyricTextWidthPx,
  placeScoreLyricBoxes,
  REQUIRED_LYRIC_GAP_PX,
} from '@/utils/earTrainingOsmdLyricBoxLayout';
import type { ChordOsmdScoreLyricEvent } from '@/utils/earTrainingChordOsmd';
import type { InterStaffLyricArea } from '@/utils/earTrainingOsmdStaffVerticalLayout';
import { resolveInterStaffLyricArea } from '@/utils/earTrainingOsmdStaffVerticalLayout';

const lyricAreaFourLanes: InterStaffLyricArea = {
  gapTopPx: 100,
  gapBottomPx: 100 + REQUIRED_LYRIC_GAP_PX,
  gapHeightPx: REQUIRED_LYRIC_GAP_PX,
  laneBasePx: 100,
  laneHeightPx: 18,
  laneGapPx: 2,
  laneCount: 4,
  isInterStaff: true,
};

describe('estimateLyricTextWidthPx', () => {
  it('空文字は 0', () => {
    expect(estimateLyricTextWidthPx('')).toBe(0);
  });

  it('ASCII と改行を除いて幅を見積もる', () => {
    expect(estimateLyricTextWidthPx('abc')).toBe(21);
    expect(estimateLyricTextWidthPx('a\nb')).toBe(14);
  });
});

describe('placeScoreLyricBoxes', () => {
  const baseEvent = (
    overrides: Partial<ChordOsmdScoreLyricEvent>,
  ): ChordOsmdScoreLyricEvent => ({
    targetTimeSec: 0,
    measureNumber: 1,
    beatStartInMeasure: 1,
    verseNumber: 1,
    text: 'Hi',
    ...overrides,
  });

  it('verse ごとに固定 Y を割り当てる', () => {
    const events = [
      baseEvent({ verseNumber: 1, text: 'A' }),
      baseEvent({ verseNumber: 2, text: 'B', beatStartInMeasure: 1 }),
    ];
    const placed = placeScoreLyricBoxes({
      events,
      lyricArea: lyricAreaFourLanes,
      measureBoundsByNumber: { 1: { left: 40, right: 200 } },
      beatsPerMeasure: 4,
      noteXByEventKey: {
        '1:1.0000:1': 60,
        '1:1.0000:2': 60,
      },
    });
    const verse1 = placed.find((box) => box.verseNumber === 1);
    const verse2 = placed.find((box) => box.verseNumber === 2);
    expect(verse1?.topPx).toBe(100);
    expect(verse2?.topPx).toBe(100 + 18 + 2);
  });

  it('同一 verse で横衝突する場合は短縮または非表示', () => {
    const events = [
      baseEvent({ text: 'LongInstructionOne' }),
      baseEvent({ text: 'LongInstructionTwo', beatStartInMeasure: 1.25 }),
    ];
    const placed = placeScoreLyricBoxes({
      events,
      lyricArea: lyricAreaFourLanes,
      measureBoundsByNumber: { 1: { left: 0, right: 400 } },
      beatsPerMeasure: 4,
      noteXByEventKey: {
        '1:1.0000:1': 50,
        '1:1.2500:1': 58,
      },
    });
    const visibleCount = placed.filter((box) => box.visibleOnScore).length;
    expect(visibleCount).toBeLessThanOrEqual(1);
  });

  it('verse 5 以上は譜面配置対象外', () => {
    const placed = placeScoreLyricBoxes({
      events: [baseEvent({ verseNumber: 5, text: 'Overlay only' })],
      lyricArea: lyricAreaFourLanes,
      measureBoundsByNumber: { 1: { left: 0, right: 200 } },
      beatsPerMeasure: 4,
      noteXByEventKey: { '1:1.0000:5': 40 },
    });
    expect(placed).toEqual([]);
  });
});

describe('resolveInterStaffLyricArea', () => {
  it('2段譜の段間から歌詞エリアを算出する', () => {
    const area = resolveInterStaffLyricArea([
      { staffIndex: 0, topPx: 10, bottomPx: 50 },
      { staffIndex: 1, topPx: 150, bottomPx: 190 },
    ]);
    expect(area?.isInterStaff).toBe(true);
    expect(area?.gapTopPx).toBeGreaterThan(50);
    expect(area?.gapBottomPx).toBeLessThan(150);
    expect(area?.laneCount).toBeGreaterThanOrEqual(1);
  });

  it('段間が狭い場合はレーン数を縮退する', () => {
    const area = resolveInterStaffLyricArea([
      { staffIndex: 0, topPx: 0, bottomPx: 40 },
      { staffIndex: 1, topPx: 60, bottomPx: 100 },
    ]);
    expect(area?.laneCount).toBeLessThan(4);
  });
});
