import { formatBalloonRushRemainingCountLabel } from '@/components/balloonRush/BalloonRushStatusOverlay';

describe('formatBalloonRushRemainingCountLabel', () => {
  it('formats Japanese remaining count', () => {
    expect(formatBalloonRushRemainingCountLabel(1, false)).toBe('残り1個');
    expect(formatBalloonRushRemainingCountLabel(5, false)).toBe('残り5個');
  });

  it('formats English remaining count', () => {
    expect(formatBalloonRushRemainingCountLabel(1, true)).toBe('1 left');
    expect(formatBalloonRushRemainingCountLabel(0, true)).toBe('0 left');
  });

  it('clamps negative values to zero', () => {
    expect(formatBalloonRushRemainingCountLabel(-2, false)).toBe('残り0個');
    expect(formatBalloonRushRemainingCountLabel(-2, true)).toBe('0 left');
  });
});
