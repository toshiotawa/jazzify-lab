import type { Profile } from '@/types';

const COUNTRY_TIMEZONE: Readonly<Record<string, string>> = {
  JP: 'Asia/Tokyo',
  US: 'America/New_York',
  GB: 'Europe/London',
  AU: 'Australia/Sydney',
  KR: 'Asia/Seoul',
  TW: 'Asia/Taipei',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
};

export const TIMEZONE_OPTIONS: readonly { value: string; labelJa: string; labelEn: string }[] = [
  { value: 'Asia/Tokyo', labelJa: '日本 (Asia/Tokyo)', labelEn: 'Japan (Asia/Tokyo)' },
  { value: 'America/New_York', labelJa: '米国東部 (America/New_York)', labelEn: 'US Eastern (America/New_York)' },
  { value: 'America/Los_Angeles', labelJa: '米国西部 (America/Los_Angeles)', labelEn: 'US Pacific (America/Los_Angeles)' },
  { value: 'Europe/London', labelJa: '英国 (Europe/London)', labelEn: 'UK (Europe/London)' },
  { value: 'Europe/Berlin', labelJa: 'ドイツ (Europe/Berlin)', labelEn: 'Germany (Europe/Berlin)' },
  { value: 'Australia/Sydney', labelJa: 'オーストラリア (Australia/Sydney)', labelEn: 'Australia (Australia/Sydney)' },
  { value: 'Asia/Seoul', labelJa: '韓国 (Asia/Seoul)', labelEn: 'Korea (Asia/Seoul)' },
  { value: 'Asia/Taipei', labelJa: '台湾 (Asia/Taipei)', labelEn: 'Taiwan (Asia/Taipei)' },
];

const dateKeyFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getDateKeyFormatter = (timezone: string): Intl.DateTimeFormat => {
  const cached = dateKeyFormatterCache.get(timezone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  dateKeyFormatterCache.set(timezone, formatter);
  return formatter;
};

export const countryToTimezone = (country: string | null | undefined): string | null => {
  if (!country) return null;
  return COUNTRY_TIMEZONE[country.toUpperCase()] ?? null;
};

export const detectBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo';
  } catch {
    return 'Asia/Tokyo';
  }
};

export const resolveUserTimezone = (profile: Pick<Profile, 'timezone' | 'country'> | null | undefined): string => (
  profile?.timezone?.trim()
  || countryToTimezone(profile?.country)
  || detectBrowserTimezone()
);

export const getLocalDateKey = (date: Date, timezone: string): string => (
  getDateKeyFormatter(timezone).format(date)
);

export interface WeekDayCell {
  readonly key: string;
  readonly dayOfMonth: number;
  readonly weekdayIndex: number;
}

const parseDateKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateKeyFromUtc = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addUtcDays = (date: Date, days: number): Date => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const getSundayStartWeek = (todayKey: string): readonly WeekDayCell[] => {
  const today = parseDateKey(todayKey);
  const weekdayIndex = today.getUTCDay();
  const sunday = addUtcDays(today, -weekdayIndex);
  const cells: WeekDayCell[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addUtcDays(sunday, i);
    cells.push({
      key: formatDateKeyFromUtc(date),
      dayOfMonth: date.getUTCDate(),
      weekdayIndex: i,
    });
  }
  return cells;
};

export const countActiveDaysInWeek = (
  week: readonly WeekDayCell[],
  activeDays: ReadonlySet<string>,
): number => {
  let count = 0;
  for (const cell of week) {
    if (activeDays.has(cell.key)) count += 1;
  }
  return count;
};

export const isTodayTrainingStreakUpdated = (
  activeDays: ReadonlySet<string>,
  todayKey: string,
): boolean => activeDays.has(todayKey);

export const computeStreak = (
  activeDays: ReadonlySet<string>,
  todayKey: string,
): number => {
  let streak = 0;
  let cursor = parseDateKey(todayKey);
  if (!activeDays.has(todayKey)) {
    cursor = addUtcDays(cursor, -1);
  }
  while (activeDays.has(formatDateKeyFromUtc(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
};

export interface CalendarDayCell {
  readonly key: string | null;
  readonly dayOfMonth: number | null;
}

export const buildMonthCalendar = (monthKey: string): readonly (readonly CalendarDayCell[])[] => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const startOffset = firstDay.getUTCDay();
  const daysInMonth = lastDay.getUTCDate();

  const weeks: CalendarDayCell[][] = [];
  let currentWeek: CalendarDayCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    currentWeek.push({ key: null, dayOfMonth: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${yearRaw}-${monthRaw}-${String(day).padStart(2, '0')}`;
    currentWeek.push({ key, dayOfMonth: day });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ key: null, dayOfMonth: null });
    }
    weeks.push(currentWeek);
  }

  return weeks;
};

export const getMonthRange = (monthKey: string): { from: string; to: string } => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthPadded = String(month).padStart(2, '0');
  return {
    from: `${yearRaw}-${monthPadded}-01`,
    to: `${yearRaw}-${monthPadded}-${String(lastDay).padStart(2, '0')}`,
  };
};

export const getWeekdayLabels = (isEnglish: boolean): readonly string[] => (
  isEnglish
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '月', '火', '水', '木', '金', '土']
);

export const computeWeeklyGoalPercent = (activeDaysThisWeek: number, weeklyTarget = 3): number => (
  Math.min(100, Math.round((activeDaysThisWeek / weeklyTarget) * 100))
);
