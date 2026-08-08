import { afterEach, describe, expect, it } from 'vitest';
import { resolveAffiliateCheckoutUrl } from '@/utils/lemonAffiliateCheckout';

const CHECKOUT_URL = 'https://enjazzifyjp.lemonsqueezy.com/checkout/buy/test-checkout-id';

const setClickCookie = (value: string): void => {
  document.cookie = `ls_aff_ref=${value}; path=/`;
};

describe('resolveAffiliateCheckoutUrl', () => {
  afterEach(() => {
    document.cookie = 'ls_aff_ref=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('returns the original URL when affiliate.js has not stored a click ID', () => {
    expect(resolveAffiliateCheckoutUrl(CHECKOUT_URL, 'USD')).toBe(CHECKOUT_URL);
  });

  it('appends aff_ref from the ls_aff_ref cookie for USD checkouts', () => {
    setClickCookie('click-abc123');

    expect(resolveAffiliateCheckoutUrl(CHECKOUT_URL, 'USD')).toBe(
      `${CHECKOUT_URL}?aff_ref=click-abc123`,
    );
  });

  it('skips attribution for JPY checkouts because the JPY store has no affiliate program', () => {
    setClickCookie('click-abc123');

    expect(resolveAffiliateCheckoutUrl(CHECKOUT_URL, 'JPY')).toBe(CHECKOUT_URL);
  });

  it('reads ls_aff_ref even when other cookies are present', () => {
    document.cookie = 'other_cookie=value; path=/';
    setClickCookie('click-xyz');

    expect(resolveAffiliateCheckoutUrl(CHECKOUT_URL, 'USD')).toBe(
      `${CHECKOUT_URL}?aff_ref=click-xyz`,
    );

    document.cookie = 'other_cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('does not duplicate aff_ref when the checkout URL already carries one', () => {
    setClickCookie('click-new');

    expect(resolveAffiliateCheckoutUrl(`${CHECKOUT_URL}?aff_ref=click-old`, 'USD')).toBe(
      `${CHECKOUT_URL}?aff_ref=click-new`,
    );
  });

  it('preserves existing query parameters on the checkout URL', () => {
    setClickCookie('click-abc123');

    expect(resolveAffiliateCheckoutUrl(`${CHECKOUT_URL}?embed=1`, 'USD')).toBe(
      `${CHECKOUT_URL}?embed=1&aff_ref=click-abc123`,
    );
  });
});
