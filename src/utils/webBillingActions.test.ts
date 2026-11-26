import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelSubscriptionForProvider,
  resumeSubscriptionForProvider,
} from '@/utils/webBillingActions';

vi.mock('@/utils/stripeBillingClient', () => ({
  cancelStripeSubscriptionRequest: vi.fn(),
  resumeStripeSubscription: vi.fn(),
}));

vi.mock('@/utils/lemonBillingClient', () => ({
  cancelLemonSubscriptionRequest: vi.fn(),
  resumeLemonSubscription: vi.fn(),
}));

import { cancelStripeSubscriptionRequest, resumeStripeSubscription } from '@/utils/stripeBillingClient';
import { cancelLemonSubscriptionRequest, resumeLemonSubscription } from '@/utils/lemonBillingClient';

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
    resumeLemonMock.mockResolvedValue({ ok: true });

    await cancelSubscriptionForProvider('lemon', 'premium');
    await resumeSubscriptionForProvider('lemon', 'premium', false);

    expect(cancelLemonMock).toHaveBeenCalled();
    expect(resumeLemonMock).toHaveBeenCalled();

    const coachingCancel = await cancelSubscriptionForProvider('lemon', 'coaching');
    expect(coachingCancel.ok).toBe(false);
  });
});
