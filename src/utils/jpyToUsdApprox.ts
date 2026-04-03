/**
 * Converts a JPY amount to a rounded USD whole amount using the ECB-based JPY→USD rate
 * (e.g. from Frankfurter: one JPY equals `jpyToUsdRate` USD).
 */
export const jpyAmountToApproxUsdWhole = (jpyAmount: number, jpyToUsdRate: number): number =>
  Math.round(jpyAmount * jpyToUsdRate);
