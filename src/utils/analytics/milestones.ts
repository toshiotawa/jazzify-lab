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
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_user_milestone', {
    p_user_id: userId,
    p_milestone: milestone,
  });

  if (error) {
    throw error;
  }
};

export const recordUserMilestoneFireAndForget = (
  userId: string,
  milestone: UserMilestone,
): void => {
  void recordUserMilestone(userId, milestone).catch(() => {
    /* analytics must not block UX */
  });
};
