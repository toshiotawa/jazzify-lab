import Stripe from 'stripe';
import { vi } from 'vitest';
import {
  extractActiveScheduleId,
  getStripeClient,
  isJapanStripeEligible,
  mapStripeSubscriptionStatus,
  parseStripeBillingProduct,
  resolveExpectedStripeLivemode,
  resolvePendingPlanFromScheduleObject,
} from '../../netlify/functions/lib/stripeBilling';
import { scheduleStripePlanChange } from '../../netlify/functions/stripeChangePlan';

describe('stripe billing helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('maps cancel_at_period_end only for active-like Stripe subscriptions', () => {
    expect(
      mapStripeSubscriptionStatus(
        {
          status: 'active',
          cancel_at_period_end: true,
          current_period_end: 200,
        },
        100,
      ),
    ).toEqual({ status: 'canceled', entitlementState: 'cancelled_but_active_until_end' });

    expect(
      mapStripeSubscriptionStatus(
        {
          status: 'incomplete',
          cancel_at_period_end: true,
          current_period_end: 200,
        },
        100,
      ),
    ).toEqual({ status: 'past_due', entitlementState: 'payment_issue_no_access' });
  });

  it('maps unknown Stripe statuses into DB-safe values', () => {
    expect(
      mapStripeSubscriptionStatus({
        status: 'future_status',
        cancel_at_period_end: false,
        current_period_end: 200,
      } as never),
    ).toEqual({ status: 'past_due', entitlementState: 'payment_issue_no_access' });
  });

  it('enforces Stripe key livemode against deployment mode', () => {
    process.env.STRIPE_EXPECTED_LIVEMODE = 'false';
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    expect(resolveExpectedStripeLivemode()).toBe(false);
    expect(() => getStripeClient()).not.toThrow();

    process.env.STRIPE_SECRET_KEY = 'sk_live_example';
    expect(() => getStripeClient()).toThrow(/livemode/);
  });

  it('resolves Japan Stripe eligibility from profile fields', () => {
    expect(isJapanStripeEligible({ billing_currency: 'JPY' })).toBe(true);
    expect(isJapanStripeEligible({ billing_currency: 'USD' })).toBe(false);
    expect(isJapanStripeEligible({ country: 'JP', preferred_locale: 'en' })).toBe(true);
    expect(isJapanStripeEligible({ country: 'US', preferred_locale: 'ja' })).toBe(false);
    expect(isJapanStripeEligible({ preferred_locale: 'ja' })).toBe(true);
    expect(isJapanStripeEligible({ preferred_locale: 'en' })).toBe(false);
  });

  it('rejects invalid billing product JSON instead of defaulting to premium', () => {
    expect(parseStripeBillingProduct('{not json')).toBe('invalid');
    expect(parseStripeBillingProduct(JSON.stringify({ product: 'coaching' }))).toBe('coaching');
    expect(parseStripeBillingProduct(JSON.stringify([]))).toBe('invalid');
    expect(parseStripeBillingProduct(JSON.stringify(123))).toBe('invalid');
    expect(parseStripeBillingProduct(null)).toBe('premium');
  });

  it('throws for invalid STRIPE_EXPECTED_LIVEMODE values', () => {
    process.env.STRIPE_EXPECTED_LIVEMODE = 'TRUE';
    expect(() => resolveExpectedStripeLivemode()).toThrow(/Invalid STRIPE_EXPECTED_LIVEMODE/);
    process.env.STRIPE_EXPECTED_LIVEMODE = '1';
    expect(() => resolveExpectedStripeLivemode()).toThrow(/Invalid STRIPE_EXPECTED_LIVEMODE/);
  });

  it('extractActiveScheduleId ignores released schedules', () => {
    expect(extractActiveScheduleId({ schedule: null })).toBeNull();
    expect(extractActiveScheduleId({ schedule: 'sch_1' })).toBe('sch_1');
    expect(
      extractActiveScheduleId({
        schedule: { id: 'sch_2', status: 'released', object: 'subscription_schedule' } as Stripe.SubscriptionSchedule,
      }),
    ).toBeNull();
    expect(
      extractActiveScheduleId({
        schedule: { id: 'sch_3', status: 'active', object: 'subscription_schedule' } as Stripe.SubscriptionSchedule,
      }),
    ).toBe('sch_3');
  });

  it('resolvePendingPlanFromScheduleObject picks future phase by start_date', () => {
    const schedule = {
      id: 'sch_future',
      status: 'active',
      current_phase: { start_date: 100, end_date: 200 },
      phases: [
        { start_date: 100, end_date: 200, items: [{ price: { id: 'price_monthly', lookup_key: 'jazzify_premium_monthly_jpy' } }] },
        { start_date: 200, end_date: 300, items: [{ price: { id: 'price_yearly', lookup_key: 'jazzify_premium_yearly_jpy' } }] },
      ],
    } as unknown as Stripe.SubscriptionSchedule;

    const resolved = resolvePendingPlanFromScheduleObject(schedule, 'core_monthly', false);
    expect(resolved.pendingPlanCode).toBe('core_yearly');
    expect(resolved.pendingPriceId).toBe('price_yearly');

    expect(
      resolvePendingPlanFromScheduleObject(schedule, 'core_monthly', true).pendingPlanCode,
    ).toBeNull();
    expect(
      resolvePendingPlanFromScheduleObject(null, 'core_monthly', false).pendingPlanCode,
    ).toBeNull();
  });

  it('scheduleStripePlanChange includes iterations:1 and end_behavior release', async () => {
    const update = vi.fn().mockResolvedValue({});
    const release = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({
      id: 'sch_new',
      current_phase: { start_date: 50, end_date: 100 },
    });

    const stripe = {
      subscriptionSchedules: { create, update, release },
    } as unknown as Stripe;

    const current = {
      id: 'sub_1',
      current_period_start: 50,
      current_period_end: 100,
      trial_end: 80,
      items: { data: [{ price: { id: 'price_m' }, quantity: 1 }] },
    } as Stripe.Subscription;

    await scheduleStripePlanChange(stripe, current, 'price_y');

    expect(update).toHaveBeenCalledWith(
      'sch_new',
      expect.objectContaining({
        end_behavior: 'release',
        phases: [
          expect.objectContaining({ trial_end: 80 }),
          expect.objectContaining({ iterations: 1, items: [{ price: 'price_y', quantity: 1 }] }),
        ],
      }),
    );
  });
});
