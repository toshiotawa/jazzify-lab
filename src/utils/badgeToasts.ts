import type { useToast } from '@/stores/toastStore';
import {
  dispatchBadgesUpdated,
  grantUserBadgesForEvent,
  syncUserBadges,
  type BadgeEventParams,
  type EarnedBadge,
} from '@/platform/supabaseBadges';

type BadgeToastApi = Pick<ReturnType<typeof useToast>, 'success'>;

function showBadgeGrantToasts(
  toast: BadgeToastApi,
  badges: EarnedBadge[],
  isEnglishCopy: boolean,
): void {
  for (const badge of badges) {
    const name = isEnglishCopy ? badge.definition.nameEn : badge.definition.nameJa;
    toast.success(
      isEnglishCopy
        ? `You earned "${name}".`
        : `「${name}」を獲得しました`,
      {
        title: isEnglishCopy ? 'Title earned' : '称号獲得',
        duration: 5200,
      },
    );
  }
}

export async function grantAndToastUserBadges(
  params: BadgeEventParams,
  toast: BadgeToastApi,
  isEnglishCopy: boolean,
): Promise<EarnedBadge[]> {
  const granted = await grantUserBadgesForEvent(params);
  dispatchBadgesUpdated(granted);
  showBadgeGrantToasts(toast, granted, isEnglishCopy);
  return granted;
}

export async function syncAndToastUserBadges(
  toast: BadgeToastApi,
  isEnglishCopy: boolean,
): Promise<EarnedBadge[]> {
  const granted = await syncUserBadges();
  dispatchBadgesUpdated(granted);
  showBadgeGrantToasts(toast, granted, isEnglishCopy);
  return granted;
}
