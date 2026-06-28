import { describe, expect, it } from 'vitest';
import {
  clampPracticeSpeedPercent,
  effectivePracticeBpm,
  formatPracticeSpeedPercentLabel,
  practiceSpeedRatio,
  PRACTICE_SPEED_MAX_PERCENT,
  PRACTICE_SPEED_MIN_PERCENT,
  scalePracticePhraseLoopEndSec,
  scalePracticeTargetTimeSec,
  scalePracticeTimingWindowSec,
} from '@/utils/earTrainingPracticeSpeed';

describe('earTrainingPracticeSpeed', () => {
  it('clampPracticeSpeedPercent は 40〜100 に収める', () => {
    expect(clampPracticeSpeedPercent(100)).toBe(100);
    expect(clampPracticeSpeedPercent(40)).toBe(40);
    expect(clampPracticeSpeedPercent(39)).toBe(40);
    expect(clampPracticeSpeedPercent(101)).toBe(100);
    expect(clampPracticeSpeedPercent(55.7)).toBe(55);
  });

  it('practiceSpeedRatio は percent/100', () => {
    expect(practiceSpeedRatio(100)).toBe(1);
    expect(practiceSpeedRatio(50)).toBe(0.5);
    expect(practiceSpeedRatio(40)).toBe(0.4);
  });

  it('scalePracticeTargetTimeSec: 100% ならそのまま', () => {
    expect(scalePracticeTargetTimeSec(2, 100)).toBe(2);
  });

  it('scalePracticeTargetTimeSec: 50% なら 2 倍', () => {
    expect(scalePracticeTargetTimeSec(2, 50)).toBe(4);
  });

  it('effectivePracticeBpm: 速度に比例', () => {
    expect(effectivePracticeBpm(120, 100)).toBe(120);
    expect(effectivePracticeBpm(120, 50)).toBe(60);
  });

  it('scalePracticePhraseLoopEndSec: 50% なら 2 倍', () => {
    expect(scalePracticePhraseLoopEndSec(60, 50)).toBe(120);
    expect(scalePracticePhraseLoopEndSec(60, 100)).toBe(60);
  });

  it('scalePracticeTimingWindowSec: 100% ならそのまま', () => {
    expect(scalePracticeTimingWindowSec(0.25, 100)).toBe(0.25);
  });

  it('scalePracticeTimingWindowSec: 50% なら 2 倍', () => {
    expect(scalePracticeTimingWindowSec(0.25, 50)).toBe(0.5);
    expect(scalePracticeTimingWindowSec(0.1, 50)).toBe(0.2);
  });

  it('scalePracticeTimingWindowSec: 40% なら 2.5 倍', () => {
    expect(scalePracticeTimingWindowSec(0.25, 40)).toBe(0.625);
  });

  it('formatPracticeSpeedPercentLabel', () => {
    expect(formatPracticeSpeedPercentLabel(75)).toBe('75%');
  });

  it('定数範囲', () => {
    expect(PRACTICE_SPEED_MIN_PERCENT).toBe(40);
    expect(PRACTICE_SPEED_MAX_PERCENT).toBe(100);
  });
});
