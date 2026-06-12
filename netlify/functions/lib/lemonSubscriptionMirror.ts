/**
 * Lemon Subscription object → subscriptions 行への写像（pure、テスト可能）。
 *
 * 設計原則:
 * - Webhook は Lemon の現在状態をミラーするだけ。pending 系カラムには一切触れない。
 * - invoice 系イベントの payload からはサブスク状態を決めない（GET した Subscription object のみ通す）。
 * - 古い webhook で巻き戻らないよう、attributes.updated_at が既存 provider_updated_at より
 *   古い場合は更新をスキップする。
 * - trial_used は履歴であり、true → false には戻さない（単調）。
 */

import {
  mapLemonSubscriptionObjectState,
  type EntitlementState,
} from './lemonSubscriptionMapping';

export interface LemonSubscriptionObjectAttrs {
  status?: string | null;
  cancelled?: boolean | null;
  variant_id?: number | string | null;
  customer_id?: number | string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  trial_ends_at?: string | null;
  updated_at?: string | null;
}

export interface ExistingSubscriptionSnapshot {
  plan_code: string | null;
  trial_used: boolean;
  provider_updated_at: string | null;
  pending_cancel_status?: string | null;
  last_pending_cancel_applied_at?: string | null;
}

export interface SubscriptionMirrorContext {
  variantPlanCode: string | null;
  variantIsTrial: boolean;
  nowMs: number;
}

export interface SubscriptionMirrorColumns {
  plan_code: string;
  status: string;
  entitlement_state: EntitlementState;
  current_period_ends_at: string | null;
  trial_used: boolean;
  provider_updated_at: string | null;
  provider_variant_id?: string;
  provider_customer_id?: string;
}

export type SubscriptionMirrorResult =
  | { kind: 'skipped'; reason: 'stale_provider_update' }
  | { kind: 'apply'; columns: SubscriptionMirrorColumns; trialBecameUsed: boolean };

const parseTimeMs = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/**
 * current_period_ends_at の優先順位:
 * 1. expired / cancelled（フラグ含む）→ ends_at ?? renews_at
 * 2. トライアル期間中（trial_ends_at が未来）→ trial_ends_at
 * 3. それ以外 → renews_at（なければ trial_ends_at）
 */
export function resolveCurrentPeriodEndsAt(
  attrs: LemonSubscriptionObjectAttrs,
  nowMs: number,
): string | null {
  const status = String(attrs.status ?? '').toLowerCase();
  const cancelled = attrs.cancelled === true;
  if (status === 'expired' || status === 'unpaid' || cancelled || status === 'cancelled' || status === 'paused') {
    return attrs.ends_at ?? attrs.renews_at ?? null;
  }
  const trialEndsAtMs = parseTimeMs(attrs.trial_ends_at);
  if (attrs.trial_ends_at && trialEndsAtMs !== null && trialEndsAtMs > nowMs) {
    return attrs.trial_ends_at;
  }
  return attrs.renews_at ?? attrs.trial_ends_at ?? null;
}

export function buildSubscriptionMirror(
  attrs: LemonSubscriptionObjectAttrs,
  existing: ExistingSubscriptionSnapshot | null,
  context: SubscriptionMirrorContext,
): SubscriptionMirrorResult {
  const incomingUpdatedAtMs = parseTimeMs(attrs.updated_at);
  const existingUpdatedAtMs = parseTimeMs(existing?.provider_updated_at);
  if (
    incomingUpdatedAtMs !== null &&
    existingUpdatedAtMs !== null &&
    incomingUpdatedAtMs < existingUpdatedAtMs
  ) {
    return { kind: 'skipped', reason: 'stale_provider_update' };
  }

  const status = String(attrs.status ?? '').toLowerCase();
  const cancelled = attrs.cancelled === true;
  const currentPeriodEndsAt = resolveCurrentPeriodEndsAt(attrs, context.nowMs);
  const periodEndMs = parseTimeMs(currentPeriodEndsAt) ?? 0;
  const state = mapLemonSubscriptionObjectState(status, cancelled, periodEndMs, context.nowMs);

  const previousTrialUsed = existing?.trial_used ?? false;
  const trialUsed =
    previousTrialUsed ||
    Boolean(attrs.trial_ends_at) ||
    context.variantIsTrial ||
    status === 'on_trial';

  const columns: SubscriptionMirrorColumns = {
    plan_code: context.variantPlanCode ?? existing?.plan_code ?? 'core_monthly',
    status: state.status,
    entitlement_state: state.entitlementState,
    current_period_ends_at: currentPeriodEndsAt,
    trial_used: trialUsed,
    provider_updated_at: attrs.updated_at ?? null,
  };

  if (attrs.variant_id !== null && attrs.variant_id !== undefined && String(attrs.variant_id) !== '') {
    columns.provider_variant_id = String(attrs.variant_id);
  }
  if (attrs.customer_id !== null && attrs.customer_id !== undefined && String(attrs.customer_id) !== '') {
    columns.provider_customer_id = String(attrs.customer_id);
  }

  return { kind: 'apply', columns, trialBecameUsed: trialUsed && !previousTrialUsed };
}
