export interface UtcResetCountdown {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export const getUtcDateString = (date: Date = new Date()): string => date.toISOString().slice(0, 10);

export const getUtcResetCountdown = (date: Date = new Date()): UtcResetCountdown => {
  const nextResetMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  const diffMs = Math.max(0, nextResetMs - date.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
};

export const formatUtcResetCountdown = (date: Date = new Date(), isEnglish = false): string => {
  const { hours, minutes } = getUtcResetCountdown(date);
  return isEnglish
    ? `UTC reset in ${hours}h ${minutes}m`
    : `UTC日付リセットまであと${hours}時間${minutes}分`;
};
