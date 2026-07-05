import type { SupabaseClient } from '@supabase/supabase-js';
import { sendGa4Event } from './ga4MeasurementProtocol';

export type ServerUserMilestone =
  | 'first_play'
  | 'first_success'
  | 'free_tier_wall_view'
  | 'checkout_click'
  | 'trial_start'
  | 'paid';

export const recordUserMilestoneForUser = async (
  supabase: SupabaseClient,
  userId: string,
  milestone: ServerUserMilestone,
): Promise<void> => {
  const { error } = await supabase.rpc('record_user_milestone', {
    p_user_id: userId,
    p_milestone: milestone,
  });
  if (error) {
    throw error;
  }
};

export const recordUserMilestoneForUserSafe = async (
  supabase: SupabaseClient,
  userId: string,
  milestone: ServerUserMilestone,
): Promise<void> => {
  try {
    await recordUserMilestoneForUser(supabase, userId, milestone);
  } catch {
    /* analytics must not block webhook processing */
  }
};

export const sendPurchaseGa4EventForUser = async (
  supabase: SupabaseClient,
  userId: string,
  params: {
    currency: string;
    value: number;
    transactionId: string;
  },
): Promise<void> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('ga_client_id')
      .eq('id', userId)
      .maybeSingle();

    const clientId = typeof data?.ga_client_id === 'string' ? data.ga_client_id : null;
    if (!clientId) {
      return;
    }

    await sendGa4Event(clientId, 'purchase', {
      currency: params.currency,
      value: params.value,
      transaction_id: params.transactionId,
    });
  } catch {
    /* analytics must not block webhook processing */
  }
};

const INITIAL_BILLING_REASONS = new Set([
  'initial',
  'renewal',
  'updated',
]);

export const isInitialPaidInvoice = (billingReason: string | null | undefined): boolean => {
  if (!billingReason) {
    return true;
  }
  const normalized = billingReason.toLowerCase();
  return INITIAL_BILLING_REASONS.has(normalized) || normalized.includes('initial');
};
