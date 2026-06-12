import {
  buildBillingCustomerRow,
  buildBillingSubscriptionRow,
} from '../../netlify/functions/lib/lemonBillingSubscriptionMirror';

describe('buildBillingCustomerRow', () => {
  it('allows multiple customers per user (no user_id unique constraint in row builder)', () => {
    const first = buildBillingCustomerRow('user-1', 'cust_old', 'old@example.com');
    const second = buildBillingCustomerRow('user-1', 'cust_new', 'new@example.com');

    expect(first).toEqual({
      user_id: 'user-1',
      provider: 'lemon',
      provider_customer_id: 'cust_old',
      provider_email: 'old@example.com',
    });
    expect(second?.provider_customer_id).toBe('cust_new');
  });

  it('returns null without customer id', () => {
    expect(buildBillingCustomerRow('user-1', null, 'a@b.com')).toBeNull();
  });
});

describe('buildBillingSubscriptionRow', () => {
  it('preserves provider_subscription_id as history key', () => {
    const row = buildBillingSubscriptionRow(
      'user-1',
      'sub_old',
      {
        status: 'cancelled',
        cancelled: true,
        variant_id: 123,
        customer_id: 456,
        ends_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      },
      'core_monthly',
      10,
    );

    expect(row.provider_subscription_id).toBe('sub_old');
    expect(row.plan_code).toBe('core_monthly');
    expect(row.cancelled_at).toBe('2026-06-01T00:00:00.000Z');
    expect(row.billing_customer_id).toBe(10);
  });
});
