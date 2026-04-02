import { useEffect, useMemo, useState } from 'react';
import { formatUtcResetCountdown, getUtcDateString } from '@/utils/utcDay';

interface UtcResetInfo {
  todayKey: string;
  resetLabel: string;
}

export const useUtcResetInfo = (isEnglish: boolean): UtcResetInfo => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());

    updateNow();
    const intervalId = window.setInterval(updateNow, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(() => {
    const now = new Date(nowMs);
    return {
      todayKey: getUtcDateString(now),
      resetLabel: formatUtcResetCountdown(now, isEnglish),
    };
  }, [isEnglish, nowMs]);
};
