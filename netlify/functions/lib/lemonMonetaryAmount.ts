/**
 * Lemon Squeezy API の金額は minor unit（cent 相当）で返る。
 * JPY も 3980 円 → 398000 のように 100 倍で格納される。
 */

export const LEMON_MINOR_UNIT_DIVISOR = 100;

export function normalizeLemonAmountToMajorUnits(
  amount: number | null | undefined,
): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  return Math.round(amount / LEMON_MINOR_UNIT_DIVISOR);
}

export function formatInvoiceAmountLabel(
  amountMajorUnits: number | null,
  currency: string | null,
): string | null {
  if (amountMajorUnits === null) return null;
  if (currency?.toUpperCase() === 'JPY') {
    return `¥${amountMajorUnits.toLocaleString('ja-JP')}`;
  }
  return `${amountMajorUnits}`;
}

/**
 * DB に cent スケールで誤保存された行を major unit に直す閾値。
 * 正規化後の月額(3980)・年額(34800) より十分大きい値のみ対象。
 */
export const LEMON_CENT_SCALE_TOTAL_THRESHOLD = 100_000;

export function isLikelyLemonCentScaleAmount(total: number | null): boolean {
  return typeof total === 'number' && total >= LEMON_CENT_SCALE_TOTAL_THRESHOLD;
}

export function coerceStoredAmountToMajorUnits(total: number | null): number | null {
  if (total === null) return null;
  if (isLikelyLemonCentScaleAmount(total)) {
    return normalizeLemonAmountToMajorUnits(total);
  }
  return total;
}
