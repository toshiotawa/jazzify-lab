import type { useToast } from '@/stores/toastStore';
import type { AwardPlayerXpResult, PlayerLevelUiState } from '@/platform/supabasePlayerXp';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';

export const PLAYER_XP_UPDATED_EVENT = 'jazzify:player-xp-updated';

type ToastApi = Pick<ReturnType<typeof useToast>, 'success' | 'info'>;

/**
 * 「+EXP」 と必要なら「レベルアップ」を出す。
 * gainedXp<=0 で何もしない（サーバー側重複済み）。
 */
export function showPlayerXpToasts(toast: ToastApi, award: AwardPlayerXpResult, isEnglishCopy: boolean): void {
  if (award.gainedXp <= 0) return;

  const gainBody = isEnglishCopy
    ? `You earned +${award.gainedXp} EXP.`
    : `+${award.gainedXp} EXP を獲得しました`;

  toast.success(gainBody, {
    title: isEnglishCopy ? 'Experience' : '経験値',
    duration: 3500,
  });

  if (award.leveledUp) {
    const levelBody = isEnglishCopy
      ? `You've reached Level ${award.newLevel}!`
      : `レベル ${award.newLevel} にレベルアップ！`;
    toast.info(levelBody, {
      title: isEnglishCopy ? 'Level up!' : 'レベルアップ',
      duration: 4500,
    });
  }

  if (isIOSWebView()) {
    sendGameCallback('playerXpChanged');
  }

  if (typeof window !== 'undefined') {
    const detail: PlayerLevelUiState = {
      totalXp: award.totalXp,
      level: award.newLevel,
      inLevelXp: award.inLevelXp,
      nextLevelXp: award.nextLevelXp,
    };
    window.dispatchEvent(
      new CustomEvent<PlayerLevelUiState>(PLAYER_XP_UPDATED_EVENT, { detail }),
    );
  }
}
