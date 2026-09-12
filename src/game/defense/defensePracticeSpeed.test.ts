import {
  clampDefensePracticeSpeedPercent,
  defensePracticeSpeedRatio,
  DEFENSE_PRACTICE_SPEED_MAX_PERCENT,
  DEFENSE_PRACTICE_SPEED_MIN_PERCENT,
  formatDefensePracticeSpeedLabel,
  stepDefensePracticeSpeedPercent,
} from '@/game/defense/defensePracticeSpeed';

describe('defensePracticeSpeed', () => {
  it('clampDefensePracticeSpeedPercent: 50–150', () => {
    expect(clampDefensePracticeSpeedPercent(40)).toBe(DEFENSE_PRACTICE_SPEED_MIN_PERCENT);
    expect(clampDefensePracticeSpeedPercent(160)).toBe(DEFENSE_PRACTICE_SPEED_MAX_PERCENT);
    expect(clampDefensePracticeSpeedPercent(100)).toBe(100);
  });

  it('defensePracticeSpeedRatio: percent/100', () => {
    expect(defensePracticeSpeedRatio(100)).toBe(1);
    expect(defensePracticeSpeedRatio(50)).toBe(0.5);
    expect(defensePracticeSpeedRatio(150)).toBe(1.5);
  });

  it('stepDefensePracticeSpeedPercent: 10% 刻みでクランプ', () => {
    expect(stepDefensePracticeSpeedPercent(100, 1)).toBe(110);
    expect(stepDefensePracticeSpeedPercent(100, -1)).toBe(90);
    expect(stepDefensePracticeSpeedPercent(150, 1)).toBe(150);
    expect(stepDefensePracticeSpeedPercent(50, -1)).toBe(50);
  });

  it('formatDefensePracticeSpeedLabel', () => {
    expect(formatDefensePracticeSpeedLabel(100)).toBe('100%');
    expect(formatDefensePracticeSpeedLabel(200)).toBe('150%');
  });
});
