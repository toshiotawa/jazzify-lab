import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelSubscriptionForProvider,
  fetchPaymentMethodLinkForProvider,
  resumeSubscriptionForProvider,
} from '@/utils/webBillingActions';

vi.mock('@/utils/stripeBillingClient', () => ({
  cancelStripeSubscriptionRequest: vi.fn(),
  resumeStripeSubscription: vi.fn(),
  fetchStripeBillingLink: vi.fn(),
}));

vi.mock('@/utils/lemonBillingClient', () => ({
  cancelLemonSubscriptionRequest: vi.fn(),
  resumeLemonSubscription: vi.fn(),
  fetchLemonBillingLink: vi.fn(),
}));

import {
  cancelStripeSubscriptionRequest,
  fetchStripeBillingLink,
  resumeStripeSubscription,
} from '@/utils/stripeBillingClient';
import {
  cancelLemonSubscriptionRequest,
  fetchLemonBillingLink,
  resumeLemonSubscription,
} from '@/utils/lemonBillingClient';

const cancelStripeMock = vi.mocked(cancelStripeSubscriptionRequest);
const resumeStripeMock = vi.mocked(resumeStripeSubscription);
const cancelLemonMock = vi.mocked(cancelLemonSubscriptionRequest);
const resumeLemonMock = vi.mocked(resumeLemonSubscription);

describe('webBillingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes Stripe cancel/resume with product', async () => {
    cancelStripeMock.mockResolvedValue({ ok: true });
    resumeStripeMock.mockResolvedValue({ ok: true, clearedScheduledCancel: true });

    await cancelSubscriptionForProvider('stripe', 'coaching');
    await resumeSubscriptionForProvider('stripe', 'coaching');

    expect(cancelStripeMock).toHaveBeenCalledWith('coaching');
    expect(resumeStripeMock).toHaveBeenCalledWith('coaching');
  });

  it('routes Lemon premium cancel/resume only for premium product', async () => {
    cancelLemonMock.mockResolvedValue({ ok: true });
    resumeLemonMock.mockResolvedValue({ ok: true, clearedScheduledCancel: true });

    await cancelSubscriptionForProvider('lemon', 'premium');
    await resumeSubscriptionForProvider('lemon', 'premium');

    expect(cancelLemonMock).toHaveBeenCalled();
    expect(resumeLemonMock).toHaveBeenCalled();

    const coachingCancel = await cancelSubscriptionForProvider('lemon', 'coaching');
    expect(coachingCancel.ok).toBe(false);

    const lemonResume = await resumeSubscriptionForProvider('lemon', 'premium');
    expect(lemonResume).toEqual({ ok: true, clearedScheduledCancel: true });
  });

  it('fetchPaymentMethodLinkForProvider dispatches by provider', async () => {
  vi.mocked(fetchStripeBillingLink).mockResolvedValue('https://stripe.example');
  vi.mocked(fetchLemonBillingLink).mockResolvedValue('https://lemon.example');

  await expect(fetchPaymentMethodLinkForProvider('stripe')).resolves.toBe('https://stripe.example');
  await expect(fetchPaymentMethodLinkForProvider('lemon')).resolves.toBe('https://lemon.example');
  await expect(fetchPaymentMethodLinkForProvider('paddle')).resolves.toBeNull();
  });
});
