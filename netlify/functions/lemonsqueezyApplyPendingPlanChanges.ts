/**
 * 予約プラン変更の定期適用（Netlify Scheduled Function、netlify.toml で10分間隔）。
 *
 * 設計:
 * - 予約適用はこの cron だけが行う（Webhook・他APIは pending を適用しない）。
 * - CAS ロック（scheduled/failed → applying）で重複実行に耐える冪等設計。
 * - 適用前に Lemon の現在状態を再確認し、前提が崩れていたら PATCH しない。
 * - applied / cancelled / failed_permanently は subscriptions に状態として残さず、
 *   subscription_events に監査ログとして記録する。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  decideFailureOutcome,
  decidePendingApply,
  MAX_PENDING_ATTEMPTS,
  type PendingPlanRow,
} from './lib/lemonPendingPlanApply';
import {
  fetchLemonSubscription,
  getSupabaseServiceClient,
  patchLemonSubscriptionVariant,
} from './lib/lemonNetlifyCommon';

const APPLY_WINDOW_MS = 15 * 60 * 1000;
const LOCK_TIMEOUT_MS = 30 * 60 * 1000;

interface PendingCandidateRow extends PendingPlanRow {
  user_id: string;
  provider_subscription_id: string;
  pending_status: string;
}

const CLEAR_PENDING_FIELDS = {
  pending_plan_code: null,
  pending_plan_effective_at: null,
  pending_provider_variant_id: null,
  pending_from_provider_variant_id: null,
  pending_effective_at_snapshot: null,
  pending_status: null,
  pending_locked_at: null,
  pending_failed_reason: null,
  pending_attempts: 0,
} as const;

const insertPendingEvent = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  eventType: string,
  details: Record<string, unknown>,
): Promise<void> => {
  await supabase.from('subscription_events').insert({
    user_id: row.user_id,
    provider: 'lemon',
    event_type: eventType,
    provider_event_id: row.provider_subscription_id,
    payload: {
      pending_plan_code: row.pending_plan_code,
      pending_provider_variant_id: row.pending_provider_variant_id,
      pending_from_provider_variant_id: row.pending_from_provider_variant_id,
      pending_plan_effective_at: row.pending_plan_effective_at,
      ...details,
    },
  });
};

const releaseStaleLocks = async (supabase: SupabaseClient, nowMs: number): Promise<void> => {
  const lockDeadline = new Date(nowMs - LOCK_TIMEOUT_MS).toISOString();
  await supabase
    .from('subscriptions')
    .update({ pending_status: 'failed', pending_failed_reason: 'lock_timeout', pending_locked_at: null })
    .eq('provider', 'lemon')
    .eq('pending_status', 'applying')
    .lt('pending_locked_at', lockDeadline);
};

const claimRow = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  nowMs: number,
): Promise<boolean> => {
  const { data } = await supabase
    .from('subscriptions')
    .update({ pending_status: 'applying', pending_locked_at: new Date(nowMs).toISOString() })
    .eq('user_id', row.user_id)
    .eq('pending_status', row.pending_status)
    .select('user_id');
  return Array.isArray(data) && data.length > 0;
};

const clearPendingWithEvent = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  eventType: string,
  details: Record<string, unknown>,
  extraColumns: Record<string, unknown>,
): Promise<void> => {
  await supabase
    .from('subscriptions')
    .update({ ...CLEAR_PENDING_FIELDS, ...extraColumns, updated_at: new Date().toISOString() })
    .eq('user_id', row.user_id);
  await insertPendingEvent(supabase, row, eventType, details);
};

const markSuccess = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  details: Record<string, unknown>,
): Promise<void> => {
  await clearPendingWithEvent(supabase, row, 'pending_plan_applied', details, {
    plan_code: row.pending_plan_code,
    provider_variant_id: row.pending_provider_variant_id,
    last_pending_plan_applied_at: new Date().toISOString(),
  });
};

const markFailure = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  reason: string,
): Promise<void> => {
  const outcome = decideFailureOutcome(row.pending_attempts);
  if (outcome.kind === 'permanent') {
    await clearPendingWithEvent(
      supabase,
      row,
      'pending_plan_failed_permanently',
      { reason, attempts: outcome.nextAttempts },
      {},
    );
    return;
  }
  await supabase
    .from('subscriptions')
    .update({
      pending_status: 'failed',
      pending_failed_reason: reason,
      pending_attempts: outcome.nextAttempts,
      pending_locked_at: null,
    })
    .eq('user_id', row.user_id);
};

const processRow = async (
  supabase: SupabaseClient,
  row: PendingCandidateRow,
  nowMs: number,
): Promise<string> => {
  const claimed = await claimRow(supabase, row, nowMs);
  if (!claimed) return 'skipped_not_claimed';

  const lemonSub = await fetchLemonSubscription(row.provider_subscription_id);
  if (!lemonSub) {
    await markFailure(supabase, row, 'lemon_subscription_fetch_failed');
    return 'fetch_failed';
  }

  const attrs = lemonSub.data.attributes;
  const decision = decidePendingApply(row, {
    status: String(attrs.status ?? ''),
    cancelled: attrs.cancelled === true,
    variant_id: attrs.variant_id ?? null,
    renews_at: attrs.renews_at ?? null,
  });

  switch (decision.action) {
    case 'cancel_pending':
      await clearPendingWithEvent(
        supabase,
        row,
        'pending_plan_cancelled',
        { reason: decision.reason },
        { last_pending_plan_cancelled_at: new Date().toISOString() },
      );
      return decision.reason;
    case 'mark_applied':
      await markSuccess(supabase, row, { reason: decision.reason });
      return decision.reason;
    case 'fail_permanently':
      await clearPendingWithEvent(
        supabase,
        row,
        'pending_plan_failed_permanently',
        { reason: decision.reason },
        {},
      );
      return decision.reason;
    case 'reschedule':
      await supabase
        .from('subscriptions')
        .update({
          pending_status: 'scheduled',
          pending_plan_effective_at: decision.newEffectiveAt,
          pending_effective_at_snapshot: decision.newEffectiveAt,
          pending_failed_reason: decision.reason,
          pending_locked_at: null,
        })
        .eq('user_id', row.user_id);
      await insertPendingEvent(supabase, row, 'pending_plan_rescheduled', {
        reason: decision.reason,
        new_effective_at: decision.newEffectiveAt,
      });
      return decision.reason;
    case 'patch': {
      const patchResult = await patchLemonSubscriptionVariant(
        row.provider_subscription_id,
        row.pending_provider_variant_id,
      );
      if (!patchResult.ok) {
        await markFailure(supabase, row, `lemon_patch_failed: ${patchResult.details.slice(0, 500)}`);
        return 'patch_failed';
      }
      await markSuccess(supabase, row, {
        renews_at_after_patch: patchResult.renewsAt,
        ends_at_after_patch: patchResult.endsAt,
      });
      return 'applied';
    }
  }
};

export const handler = async () => {
  const supabase = getSupabaseServiceClient();
  const nowMs = Date.now();

  await releaseStaleLocks(supabase, nowMs);

  const applyDeadline = new Date(nowMs + APPLY_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'user_id, provider_subscription_id, pending_plan_code, pending_provider_variant_id, pending_from_provider_variant_id, pending_plan_effective_at, pending_effective_at_snapshot, pending_status, pending_attempts',
    )
    .eq('provider', 'lemon')
    .in('pending_status', ['scheduled', 'failed'])
    .lt('pending_attempts', MAX_PENDING_ATTEMPTS)
    .lte('pending_plan_effective_at', applyDeadline)
    .limit(50);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const results: Record<string, string> = {};
  const rows = (data ?? []).filter(
    (row): row is PendingCandidateRow =>
      typeof row.user_id === 'string' &&
      typeof row.provider_subscription_id === 'string' &&
      typeof row.pending_plan_code === 'string' &&
      typeof row.pending_provider_variant_id === 'string' &&
      typeof row.pending_plan_effective_at === 'string' &&
      typeof row.pending_status === 'string' &&
      typeof row.pending_attempts === 'number',
  );

  for (const row of rows) {
    results[row.user_id] = await processRow(supabase, row, nowMs);
  }

  return { statusCode: 200, body: JSON.stringify({ processed: rows.length, results }) };
};
