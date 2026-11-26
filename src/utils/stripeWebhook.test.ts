import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimStripeEventForProcessing,
  subscriptionIdFromSchedule,
  updateRecordedStripeEvent,
} from '../../netlify/functions/stripeWebhook';

const stripeEvent = {
  id: 'evt_1',
  type: 'customer.subscription.updated',
  created: 1,
  livemode: false,
} as never;

const makeSupabaseMock = (options: {
  existing?: { processing_status: string; processed_at: string | null } | null;
  claimSucceeds?: boolean;
}) => {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: options.claimSucceeds === false ? null : { id: 99 },
        error: null,
      }),
    }),
  });

  const insert = vi.fn().mockResolvedValue({ error: { code: '23505' } });

  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.existing ?? null,
    error: null,
  });

  const from = vi.fn().mockImplementation((table: string) => {
    if (table !== 'subscription_events') throw new Error(`unexpected table ${table}`);
    return {
      insert,
      update,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      }),
      eq: vi.fn().mockReturnThis(),
    };
  });

  return { from, update, insert } as unknown as SupabaseClient & {
    update: ReturnType<typeof vi.fn>;
  };
};

describe('stripeWebhook helpers', () => {
  it('subscriptionIdFromSchedule falls back to released_subscription', () => {
    expect(
      subscriptionIdFromSchedule({
        subscription: null,
        released_subscription: 'sub_released',
      }),
    ).toBe('sub_released');
    expect(
      subscriptionIdFromSchedule({
        subscription: 'sub_active',
        released_subscription: 'sub_released',
      }),
    ).toBe('sub_active');
  });

  it('claims stale received events with stale cutoff CAS', async () => {
    const staleProcessedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const supabase = makeSupabaseMock({
      existing: { processing_status: 'received', processed_at: staleProcessedAt },
      claimSucceeds: true,
    });
    const nowMs = Date.now();

    const result = await claimStripeEventForProcessing(supabase, stripeEvent, nowMs);
    expect(result).toEqual({ action: 'process' });

    const update = (supabase as { update: ReturnType<typeof vi.fn> }).update;
    const ltCalls = update.mock.results.flatMap((r) => {
      const chain = r.value as { lt?: ReturnType<typeof vi.fn> };
      return chain.lt?.mock?.calls ?? [];
    });
    expect(ltCalls.some((args) => args[0] === 'processed_at')).toBe(true);
  });

  it('returns busy for fresh received events', async () => {
    const freshProcessedAt = new Date().toISOString();
    const supabase = makeSupabaseMock({
      existing: { processing_status: 'received', processed_at: freshProcessedAt },
    });

    const result = await claimStripeEventForProcessing(supabase, stripeEvent);
    expect(result).toEqual({ action: 'busy' });
  });

  it('updateRecordedStripeEvent omits user_id when missing from payload', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
    });
    const supabase = {
      from: () => ({
        update,
      }),
    } as unknown as SupabaseClient;

    await updateRecordedStripeEvent(supabase, stripeEvent, 'failed', {});

    const payload = update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.user_id).toBeUndefined();
    expect(payload.processing_status).toBe('failed');
  });
});
