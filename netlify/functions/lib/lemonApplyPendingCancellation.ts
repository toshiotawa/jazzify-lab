/**
 * 予約解約の定期適用ロジック（lemonsqueezyApplyPendingPlanChanges から呼ぶ）。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  decideFailureOutcome,
  MAX_PENDING_ATTEMPTS,
} from './lemonPendingPlanApply';
import {
  decidePendingCancelApply,
  type PendingCancelRow,
} from './lemonPendingCancelApply';
import {
  cancelLemonSubscription,
  fetchLemonSubscription,
} from './lemonNetlifyCommon';

const APPLY_WINDOW_MS = 15 * 60 * 1000;
const LOCK_TIMEOUT_MS = 30 * 60 * 1000;

interface PendingCancelCandidateRow extends PendingCancelRow {
  user_id: string;
  provider_subscription_id: string;
  pending_cancel_status: string;
}

const CLEAR_PENDING_CANCEL_FIELDS = {
  pending_cancel_effective_at: null,
  pending_cancel_effective_at_snapshot: null,
  pending_cancel_status: null,
  pending_cancel_locked_at: null,
  pending_cancel_failed_reason: null,
  pending_cancel_attempts: 0,
} as const;

const insertCancelEvent = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  eventType: string,
  details: Record<string, unknown>,
): Promise<void> => {
  await supabase.from('subscription_events').insert({
    user_id: row.user_id,
    provider: 'lemon',
    event_type: eventType,
    provider_event_id: row.provider_subscription_id,
    payload: {
      pending_cancel_effective_at: row.pending_cancel_effective_at,
      ...details,
    },
  });
};

const releaseStaleCancelLocks = async (supabase: SupabaseClient, nowMs: number): Promise<void> => {
  const lockDeadline = new Date(nowMs - LOCK_TIMEOUT_MS).toISOString();
  await supabase
    .from('subscriptions')
    .update({
      pending_cancel_status: 'failed',
      pending_cancel_failed_reason: 'lock_timeout',
      pending_cancel_locked_at: null,
    })
    .eq('provider', 'lemon')
    .eq('pending_cancel_status', 'applying')
    .lt('pending_cancel_locked_at', lockDeadline);
};

const claimCancelRow = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  nowMs: number,
): Promise<boolean> => {
  const { data } = await supabase
    .from('subscriptions')
    .update({
      pending_cancel_status: 'applying',
      pending_cancel_locked_at: new Date(nowMs).toISOString(),
    })
    .eq('user_id', row.user_id)
    .eq('pending_cancel_status', row.pending_cancel_status)
    .select('user_id');
  return Array.isArray(data) && data.length > 0;
};

const clearCancelWithEvent = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  eventType: string,
  details: Record<string, unknown>,
  extraColumns: Record<string, unknown>,
): Promise<void> => {
  await supabase
    .from('subscriptions')
    .update({ ...CLEAR_PENDING_CANCEL_FIELDS, ...extraColumns, updated_at: new Date().toISOString() })
    .eq('user_id', row.user_id);
  await insertCancelEvent(supabase, row, eventType, details);
};

/** cron 適用後は Lemon grace を使わず即 expired（フリー）にする */
const expireAfterPendingCancelApply = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  eventType: string,
  details: Record<string, unknown>,
): Promise<void> => {
  const appliedAt = new Date().toISOString();
  await supabase
    .from('subscriptions')
    .update({
      ...CLEAR_PENDING_CANCEL_FIELDS,
      status: 'expired',
      entitlement_state: 'expired',
      current_period_ends_at: null,
      last_pending_cancel_applied_at: appliedAt,
      updated_at: appliedAt,
    })
    .eq('user_id', row.user_id);
  await supabase.from('profiles').update({
    rank: 'free',
    lemon_subscription_status: 'expired',
  }).eq('id', row.user_id);
  await insertCancelEvent(supabase, row, eventType, { ...details, immediate_expire: true });
};

const markCancelFailure = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  reason: string,
): Promise<void> => {
  const outcome = decideFailureOutcome(row.pending_cancel_attempts);
  if (outcome.kind === 'permanent') {
    await clearCancelWithEvent(
      supabase,
      row,
      'pending_cancel_failed_permanently',
      { reason, attempts: outcome.nextAttempts },
      {},
    );
    return;
  }
  await supabase
    .from('subscriptions')
    .update({
      pending_cancel_status: 'failed',
      pending_cancel_failed_reason: reason,
      pending_cancel_attempts: outcome.nextAttempts,
      pending_cancel_locked_at: null,
    })
    .eq('user_id', row.user_id);
};

const processCancelRow = async (
  supabase: SupabaseClient,
  row: PendingCancelCandidateRow,
  nowMs: number,
): Promise<string> => {
  const claimed = await claimCancelRow(supabase, row, nowMs);
  if (!claimed) return 'skipped_not_claimed';

  const lemonSub = await fetchLemonSubscription(row.provider_subscription_id);
  if (!lemonSub) {
    await markCancelFailure(supabase, row, 'lemon_subscription_fetch_failed');
    return 'fetch_failed';
  }

  const attrs = lemonSub.data.attributes;
  const decision = decidePendingCancelApply(row, {
    status: String(attrs.status ?? ''),
    cancelled: attrs.cancelled === true,
    renews_at: attrs.renews_at ?? null,
  });

  switch (decision.action) {
    case 'cancel_pending':
      await clearCancelWithEvent(
        supabase,
        row,
        'pending_cancel_cleared',
        { reason: decision.reason },
        { last_pending_cancel_cleared_at: new Date().toISOString() },
      );
      return decision.reason;
    case 'mark_applied':
      await expireAfterPendingCancelApply(supabase, row, 'pending_cancel_applied', {
        reason: decision.reason,
      });
      return decision.reason;
    case 'reschedule':
      await supabase
        .from('subscriptions')
        .update({
          pending_cancel_status: 'scheduled',
          pending_cancel_effective_at: decision.newEffectiveAt,
          pending_cancel_effective_at_snapshot: decision.newEffectiveAt,
          pending_cancel_failed_reason: decision.reason,
          pending_cancel_locked_at: null,
        })
        .eq('user_id', row.user_id);
      await insertCancelEvent(supabase, row, 'pending_cancel_rescheduled', {
        reason: decision.reason,
        new_effective_at: decision.newEffectiveAt,
      });
      return decision.reason;
    case 'delete': {
      const cancelResult = await cancelLemonSubscription(row.provider_subscription_id);
      if (!cancelResult.ok) {
        await markCancelFailure(
          supabase,
          row,
          `lemon_delete_failed: ${cancelResult.details.slice(0, 500)}`,
        );
        return 'delete_failed';
      }
      await expireAfterPendingCancelApply(supabase, row, 'pending_cancel_applied', {
        ends_at: cancelResult.endsAt,
      });
      return 'applied';
    }
  }
};

export async function applyPendingCancellations(
  supabase: SupabaseClient,
  nowMs: number,
): Promise<Record<string, string>> {
  await releaseStaleCancelLocks(supabase, nowMs);

  const applyDeadline = new Date(nowMs + APPLY_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'user_id, provider_subscription_id, pending_cancel_effective_at, pending_cancel_effective_at_snapshot, pending_cancel_status, pending_cancel_attempts',
    )
    .eq('provider', 'lemon')
    .in('pending_cancel_status', ['scheduled', 'failed'])
    .lt('pending_cancel_attempts', MAX_PENDING_ATTEMPTS)
    .lte('pending_cancel_effective_at', applyDeadline)
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const results: Record<string, string> = {};
  const rows = (data ?? []).filter(
    (row): row is PendingCancelCandidateRow =>
      typeof row.user_id === 'string' &&
      typeof row.provider_subscription_id === 'string' &&
      typeof row.pending_cancel_effective_at === 'string' &&
      typeof row.pending_cancel_status === 'string' &&
      typeof row.pending_cancel_attempts === 'number',
  );

  for (const row of rows) {
    results[row.user_id] = await processCancelRow(supabase, row, nowMs);
  }

  return results;
}
