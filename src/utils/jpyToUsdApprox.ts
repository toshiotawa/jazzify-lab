/**
 * Converts a JPY amount to a rounded USD whole amount using the ECB-based JPY→USD rate
 * (e.g. from Frankfurter: one JPY equals `jpyToUsdRate` USD).
 */
export const jpyAmountToApproxUsdWhole = (jpyAmount: number, jpyToUsdRate: number): number =>
  Math.round(jpyAmount * jpyToUsdRate);

/**
 * Parses a Frankfurter `latest?base=JPY&symbols=USD` response and returns the
 * JPY→USD rate, or null when the payload shape is unexpected.
 */
export const parseFrankfurterJpyUsdRate = (data: unknown): number | null => {
  if (typeof data !== 'object' || data === null || !('rates' in data)) {
    return null;
  }
  const { rates } = data as { rates: unknown };
  if (typeof rates !== 'object' || rates === null || !('USD' in rates)) {
    return null;
  }
  const { USD } = rates as { USD: unknown };
  if (typeof USD !== 'number' || !Number.isFinite(USD) || USD <= 0) {
    return null;
  }
  return USD;
};
