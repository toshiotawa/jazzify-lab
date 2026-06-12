import {
  buildBillingInvoiceRow,
  mergeInvoiceAttrs,
  resolveInvoiceUserId,
} from '../../netlify/functions/lib/lemonInvoiceMirror';

describe('resolveInvoiceUserId', () => {
  it('prefers billing_subscriptions link over billing_customers', () => {
    const result = resolveInvoiceUserId({
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_1',
      billingSubscriptionLink: {
        user_id: 'user-a',
        billing_subscription_id: 10,
        billing_customer_id: 5,
      },
      billingCustomerLink: {
        user_id: 'user-b',
        billing_customer_id: 99,
      },
      lazySubscriptionUserId: 'user-c',
    });

    expect(result).toEqual({
      kind: 'resolved',
      userId: 'user-a',
      billingSubscriptionId: 10,
      billingCustomerId: 5,
      source: 'billing_subscription',
    });
  });

  it('uses lazy subscription user when billing_subscriptions missing', () => {
    const result = resolveInvoiceUserId({
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_1',
      billingSubscriptionLink: null,
      billingCustomerLink: null,
      lazySubscriptionUserId: 'user-lazy',
    });

    expect(result).toEqual({
      kind: 'resolved',
      userId: 'user-lazy',
      billingSubscriptionId: null,
      billingCustomerId: null,
      source: 'lazy_subscription',
    });
  });

  it('falls back to billing_customers', () => {
    const result = resolveInvoiceUserId({
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_1',
      billingSubscriptionLink: null,
      billingCustomerLink: {
        user_id: 'user-customer',
        billing_customer_id: 7,
      },
      lazySubscriptionUserId: null,
    });

    expect(result).toEqual({
      kind: 'resolved',
      userId: 'user-customer',
      billingSubscriptionId: null,
      billingCustomerId: 7,
      source: 'billing_customer',
    });
  });

  it('fails when user cannot be resolved', () => {
    const result = resolveInvoiceUserId({
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_1',
      billingSubscriptionLink: null,
      billingCustomerLink: null,
      lazySubscriptionUserId: null,
    });

    expect(result).toEqual({ kind: 'failed', reason: 'user_id resolution failed' });
  });
});

describe('buildBillingInvoiceRow', () => {
  it('builds row with nullable amounts for fallback payload', () => {
    const row = buildBillingInvoiceRow(
      'inv_1',
      'user-1',
      {
        subscription_id: 'sub_1',
        customer_id: 'cust_1',
        status: 'paid',
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      },
      10,
      5,
    );

    expect(row).toMatchObject({
      user_id: 'user-1',
      provider_invoice_id: 'inv_1',
      provider_subscription_id: 'sub_1',
      provider_customer_id: 'cust_1',
      total: null,
      billing_subscription_id: 10,
      billing_customer_id: 5,
    });
  });

  it('normalizes Lemon minor-unit amounts to yen on ingest', () => {
    const row = buildBillingInvoiceRow(
      'inv_1',
      'user-1',
      {
        subscription_id: 'sub_1',
        customer_id: 'cust_1',
        status: 'paid',
        total: 397979,
        currency: 'JPY',
      },
      10,
      5,
    );

    expect(row?.total).toBe(3980);
  });

  it('returns null when required provider ids missing', () => {
    expect(
      buildBillingInvoiceRow('inv_1', 'user-1', { subscription_id: '', customer_id: '' }, null, null),
    ).toBeNull();
  });
});

describe('mergeInvoiceAttrs', () => {
  it('prefers primary API fields over webhook fallback', () => {
    const merged = mergeInvoiceAttrs(
      {
        subscription_id: 'sub_api',
        customer_id: 'cust_api',
        total: 3980,
        status: 'paid',
        created_at: '2026-06-01T00:00:00.000Z',
      },
      {
        subscription_id: 'sub_webhook',
        customer_id: 'cust_webhook',
        total: 100,
        status: 'pending',
      },
    );

    expect(merged.total).toBe(3980);
    expect(merged.subscription_id).toBe('sub_api');
  });

  it('uses fallback when primary is null', () => {
    const merged = mergeInvoiceAttrs(null, {
      subscription_id: 'sub_webhook',
      customer_id: 'cust_webhook',
      total: 3980,
    });

    expect(merged.subscription_id).toBe('sub_webhook');
    expect(merged.total).toBe(3980);
  });
});

describe('invoice event from old subscription (pure resolution)', () => {
  it('resolves user via billing_subscriptions without touching current subscription row', () => {
    const resolution = resolveInvoiceUserId({
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_old',
      billingSubscriptionLink: {
        user_id: 'user-same',
        billing_subscription_id: 1,
        billing_customer_id: 2,
      },
      billingCustomerLink: null,
      lazySubscriptionUserId: null,
    });

    expect(resolution.kind).toBe('resolved');
    if (resolution.kind === 'resolved') {
      expect(resolution.userId).toBe('user-same');
      expect(resolution.source).toBe('billing_subscription');
    }
  });
});

describe('duplicate webhook upsert key', () => {
  it('uses same provider composite key for two builds', () => {
    const attrs = {
      subscription_id: 'sub_1',
      customer_id: 'cust_1',
      status: 'paid',
      total: 397979,
      refunded_amount: 397979,
    };
    const first = buildBillingInvoiceRow('inv_dup', 'user-1', attrs, 1, 1);
    const second = buildBillingInvoiceRow('inv_dup', 'user-1', { ...attrs, status: 'refunded' }, 1, 1);

    expect(first?.provider_invoice_id).toBe(second?.provider_invoice_id);
    expect(second?.status).toBe('refunded');
    expect(second?.refunded_amount).toBe(3980);
  });
});
