import type { MainQuestProgress } from '@/platform/supabaseCourses';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import type { SoftLandingCandidate } from '@/utils/softLanding';

export function isMainQuestBlockedForSoftLanding(
  progress: Pick<MainQuestProgress, 'completedLessons' | 'totalLessons' | 'nextLesson'>,
): boolean {
  const allCompleted = progress.completedLessons >= progress.totalLessons;
  const nextBlocked = progress.nextLesson != null
    && !isMainQuestBlockPlayable(progress.nextLesson.block_number, false);
  return allCompleted || nextBlocked;
}

/** ソフトランディング案内を優先表示する状態か（ルート制限はしない） */
export function shouldPrioritizeSoftLandingGuidance(input: {
  isPremiumMember: boolean;
  mainQuestBlocked: boolean;
  nextCourse: SoftLandingCandidate | null;
  sessionDismissed?: boolean;
}): boolean {
  if (input.isPremiumMember) {
    return false;
  }
  if (!input.mainQuestBlocked) {
    return false;
  }
  if (!input.nextCourse) {
    return false;
  }
  if (input.sessionDismissed === true) {
    return false;
  }
  return true;
}

export function shouldAutoShowSoftLandingOfferOnDashboard(input: {
  isPremiumMember: boolean;
  mainQuestBlocked: boolean;
  nextCourse: SoftLandingCandidate | null;
  sessionDismissed?: boolean;
  offerAlreadyShownThisSession?: boolean;
}): boolean {
  if (!shouldPrioritizeSoftLandingGuidance({
    isPremiumMember: input.isPremiumMember,
    mainQuestBlocked: input.mainQuestBlocked,
    nextCourse: input.nextCourse,
    sessionDismissed: input.sessionDismissed,
  })) {
    return false;
  }
  if (input.offerAlreadyShownThisSession === true) {
    return false;
  }
  return true;
}
