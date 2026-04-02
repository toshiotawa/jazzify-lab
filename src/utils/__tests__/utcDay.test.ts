import { formatUtcResetCountdown, getUtcDateString, getUtcResetCountdown } from '@/utils/utcDay';

describe('utcDay', () => {
  it('returns UTC date string', () => {
    expect(getUtcDateString(new Date('2026-04-02T23:15:00+09:00'))).toBe('2026-04-02');
  });

  it('computes countdown until next UTC midnight', () => {
    const countdown = getUtcResetCountdown(new Date('2026-04-02T10:15:00Z'));

    expect(countdown).toEqual({
      hours: 13,
      minutes: 45,
      totalMinutes: 825,
    });
  });

  it('formats Japanese and English labels', () => {
    const date = new Date('2026-04-02T22:05:00Z');

    expect(formatUtcResetCountdown(date, false)).toBe('UTC日付リセットまであと1時間55分');
    expect(formatUtcResetCountdown(date, true)).toBe('UTC reset in 1h 55m');
  });
});
