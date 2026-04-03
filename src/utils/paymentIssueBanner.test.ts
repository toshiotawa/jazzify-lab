import {
  resolvePaymentIssueBanner,
  PAYMENT_ISSUE_COPY,
} from '@/utils/paymentIssueBanner';

describe('resolvePaymentIssueBanner', () => {
  it('returns lemon_with_access for lemon + payment_issue_with_access', () => {
    expect(resolvePaymentIssueBanner('lemon', 'payment_issue_with_access')).toBe(
      'lemon_with_access',
    );
  });

  it('returns apple_no_access for apple + payment_issue_no_access', () => {
    expect(resolvePaymentIssueBanner('apple', 'payment_issue_no_access')).toBe(
      'apple_no_access',
    );
  });

  it('returns null for active entitlement', () => {
    expect(resolvePaymentIssueBanner('apple', 'active')).toBeNull();
    expect(resolvePaymentIssueBanner('lemon', 'active')).toBeNull();
  });

  it('returns null when provider and entitlement mismatch', () => {
    expect(resolvePaymentIssueBanner('apple', 'payment_issue_with_access')).toBeNull();
    expect(resolvePaymentIssueBanner('lemon', 'payment_issue_no_access')).toBeNull();
  });

  it('returns null for none provider', () => {
    expect(resolvePaymentIssueBanner('none', 'payment_issue_with_access')).toBeNull();
  });
});

describe('PAYMENT_ISSUE_COPY', () => {
  it('has ja and en keys for both variants', () => {
    expect(PAYMENT_ISSUE_COPY.ja.lemon_with_access.length).toBeGreaterThan(0);
    expect(PAYMENT_ISSUE_COPY.ja.apple_no_access.length).toBeGreaterThan(0);
    expect(PAYMENT_ISSUE_COPY.en.lemon_with_access.length).toBeGreaterThan(0);
    expect(PAYMENT_ISSUE_COPY.en.apple_no_access.length).toBeGreaterThan(0);
  });
});
