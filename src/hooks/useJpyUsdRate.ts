import { useEffect, useState } from 'react';
import { parseFrankfurterJpyUsdRate } from '@/utils/jpyToUsdApprox';

const FRANKFURTER_JPY_USD = 'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=USD';

/** Static fallback shown until the live ECB-based rate loads (≈158 JPY per USD). */
const FALLBACK_JPY_TO_USD_RATE = 0.0063;

/**
 * Returns an approximate JPY→USD rate for display on the global landing page.
 * Fetches the live rate once on mount; while loading (or on failure) the static
 * fallback is returned. Returns null when disabled (Japanese audience).
 */
export const useJpyUsdRate = (enabled: boolean): number | null => {
  const [liveRate, setLiveRate] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(FRANKFURTER_JPY_USD);
        if (!res.ok || cancelled) {
          return;
        }
        const data: unknown = await res.json();
        const rate = parseFrankfurterJpyUsdRate(data);
        if (rate !== null && !cancelled) {
          setLiveRate(rate);
        }
      } catch {
        /* network or parse failure: keep fallback rate */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }
  return liveRate ?? FALLBACK_JPY_TO_USD_RATE;
};
