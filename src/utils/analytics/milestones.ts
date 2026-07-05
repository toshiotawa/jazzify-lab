import { getSupabaseClient } from '@/platform/supabaseClient';

export type UserMilestone =
  | 'first_play'
  | 'first_success'
  | 'free_tier_wall_view'
  | 'checkout_click'
  | 'trial_start'
  | 'paid';

export const recordUserMilestone = async (
  userId: string,
  milestone: UserMilestone,
  source?: string,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_user_milestone', {
    p_user_id: userId,
    p_milestone: milestone,
    p_source: source ?? null,
  });

  if (error) {
    throw error;
  }
};

export const recordUserMilestoneFireAndForget = (
  userId: string,
  milestone: UserMilestone,
  source?: string,
): void => {
  void recordUserMilestone(userId, milestone, source).catch(() => {
    /* analytics must not block UX */
  });
};
