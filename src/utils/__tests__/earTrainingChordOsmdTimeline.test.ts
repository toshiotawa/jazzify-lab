import { describe, expect, it } from 'vitest';
import {
  computeChordOsmdActiveMeasureNumber,
  computeChordOsmdPhraseLoopEndSec,
  countChordOsmdHammersDueFromIndex,
  shouldStartTutorialOsmdDrumLoop,
} from '@/utils/earTrainingChordOsmdTimeline';
import {
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  CHORD_OSMD_HAMMER_LEAD_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_SEC,
} from '@/utils/earTrainingChordOsmd';

const CBLUES_CI = 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3';
const DRUM_ONLY = 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3';

describe('shouldStartTutorialOsmdDrumLoop', () => {
  it('フレーズ MP3 がある場合は補助ドラムループを開始しない', () => {
    expect(shouldStartTutorialOsmdDrumLoop(CBLUES_CI, CBLUES_CI)).toBe(false);
    expect(shouldStartTutorialOsmdDrumLoop(CBLUES_CI, DRUM_ONLY)).toBe(false);
  });

  it('フレーズ音源が空でドラム URL がある場合のみ開始する', () => {
    expect(shouldStartTutorialOsmdDrumLoop('', DRUM_ONLY)).toBe(true);
    expect(shouldStartTutorialOsmdDrumLoop(null, DRUM_ONLY)).toBe(true);
    expect(shouldStartTutorialOsmdDrumLoop(undefined, DRUM_ONLY)).toBe(true);
  });

  it('ドラム URL が空なら開始しない', () => {
    expect(shouldStartTutorialOsmdDrumLoop('', '')).toBe(false);
    expect(shouldStartTutorialOsmdDrumLoop('', null)).toBe(false);
  });
});

describe('countChordOsmdHammersDueFromIndex', () => {
  const targets = [
    { targetTimeSec: 4.8 },
    { targetTimeSec: 9.6 },
    { targetTimeSec: 14.4 },
  ];

  it('投擲時刻前は 0 本', () => {
    const beforeFirst = 4.8 - CHORD_OSMD_HAMMER_LEAD_SEC - 0.01;
    expect(countChordOsmdHammersDueFromIndex(targets, beforeFirst, 0)).toBe(0);
  });

  it('経過に応じて投擲済みハンマー数が増える', () => {
    const atFirst = 4.8 - CHORD_OSMD_HAMMER_LEAD_SEC;
    expect(countChordOsmdHammersDueFromIndex(targets, atFirst, 0)).toBe(1);
    expect(countChordOsmdHammersDueFromIndex(targets, 9.6 - CHORD_OSMD_HAMMER_LEAD_SEC, 0)).toBe(2);
    expect(countChordOsmdHammersDueFromIndex(targets, 14.4 - CHORD_OSMD_HAMMER_LEAD_SEC, 0)).toBe(3);
  });

  it('startIndex 以降だけ数える', () => {
    const atThird = 14.4 - CHORD_OSMD_HAMMER_LEAD_SEC;
    expect(countChordOsmdHammersDueFromIndex(targets, atThird, 2)).toBe(1);
    expect(countChordOsmdHammersDueFromIndex(targets, atThird, 3)).toBe(0);
  });
});

describe('computeChordOsmdPhraseLoopEndSec', () => {
  it('ループ長と最終ターゲット終端の大きい方にパディングを足す', () => {
    const targets = [{ targetTimeSec: 57.6 }];
    const lastEnd = 57.6 + CHORD_OSMD_JUDGMENT_WINDOW_SEC + CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC;
    expect(computeChordOsmdPhraseLoopEndSec(60, targets)).toBeCloseTo(Math.max(60, lastEnd) + 0.08, 5);
  });
});

describe('computeChordOsmdActiveMeasureNumber', () => {
  it('フレーズ時間から小節番号を算出する（100BPM・4/4）', () => {
    const targets = [{ measureNumber: 25 }];
    expect(computeChordOsmdActiveMeasureNumber(4.8, 100, 4, 60, 24, targets)).toBe(3);
    expect(computeChordOsmdActiveMeasureNumber(0, 100, 4, 60, 24, targets)).toBe(1);
  });
});
