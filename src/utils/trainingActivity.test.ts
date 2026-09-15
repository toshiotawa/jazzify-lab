import {
  buildMonthCalendar,
  computeStreak,
  countActiveDaysInWeek,
  getSundayStartWeek,
  resolveUserTimezone,
} from '@/utils/trainingActivity';

describe('trainingActivity', () => {
  it('resolves timezone from profile country', () => {
    expect(resolveUserTimezone({ timezone: null, country: 'JP' })).toBe('Asia/Tokyo');
    expect(resolveUserTimezone({ timezone: 'Europe/London', country: 'JP' })).toBe('Europe/London');
  });

  it('builds sunday-start week from date key', () => {
    const week = getSundayStartWeek('2026-09-15');
    expect(week).toHaveLength(7);
    expect(week[0]?.weekdayIndex).toBe(0);
    expect(week[0]?.key).toBe('2026-09-13');
    expect(week[6]?.key).toBe('2026-09-19');
  });

  it('counts active days in week', () => {
    const week = getSundayStartWeek('2026-09-15');
    const active = new Set(['2026-09-14', '2026-09-16', '2026-09-18']);
    expect(countActiveDaysInWeek(week, active)).toBe(3);
  });

  it('computes streak including today when active', () => {
    const active = new Set(['2026-09-13', '2026-09-14', '2026-09-15']);
    expect(computeStreak(active, '2026-09-15')).toBe(3);
  });

  it('computes streak from yesterday when today is inactive', () => {
    const active = new Set(['2026-09-13', '2026-09-14']);
    expect(computeStreak(active, '2026-09-15')).toBe(2);
  });

  it('builds month calendar with sunday start rows', () => {
    const weeks = buildMonthCalendar('2026-09');
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[0]?.[0]?.dayOfMonth).toBeNull();
    expect(weeks.flat().some((cell) => cell.key === '2026-09-01')).toBe(true);
  });
});
