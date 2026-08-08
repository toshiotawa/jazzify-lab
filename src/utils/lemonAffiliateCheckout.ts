import type { BillingCurrency } from '@/utils/billingCurrency';

/**
 * Lemon Squeezy の affiliate.js が着地時に保存するクリック ID の cookie 名。
 * affiliate.js は自前で `<a href>` を書き換えるが、API 生成の checkout URL へ
 * `window.location.href` で遷移する経路は書き換え対象外なので手動で付与する。
 */
const AFFILIATE_CLICK_COOKIE = 'ls_aff_ref';

const readAffiliateClickId = (): string | null => {
  if (typeof document === 'undefined') return null;

  const prefix = `${AFFILIATE_CLICK_COOKIE}=`;
  for (const entry of document.cookie.split(';')) {
    const trimmed = entry.trim();
    if (!trimmed.startsWith(prefix)) continue;
    const value = trimmed.slice(prefix.length);
    return value.length > 0 ? value : null;
  }
  return null;
};

/** USD ストア（アフィリエイト対象）の checkout URL にだけ `aff_ref` を付与する */
export const resolveAffiliateCheckoutUrl = (
  checkoutUrl: string,
  billingCurrency: BillingCurrency,
): string => {
  if (billingCurrency !== 'USD') return checkoutUrl;

  const clickId = readAffiliateClickId();
  if (clickId === null) return checkoutUrl;

  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('aff_ref', clickId);
    return url.toString();
  } catch {
    return checkoutUrl;
  }
};
