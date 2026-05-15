import type { useToast } from '@/stores/toastStore';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
import type { AwardPlayerXpResult } from '@/platform/supabasePlayerXp';

type ToastApi = Pick<ReturnType<typeof useToast>, 'success' | 'info'>;

/**
 * 「+EXP」 と必要なら「レベルアップ」を出す。
 * gainedXp<=0 で何もしない（サーバー側重複済み）。
 */
export function showPlayerXpToasts(toast: ToastApi, award: AwardPlayerXpResult, isEnglishCopy: boolean): void {
  if (award.gainedXp <= 0) return;

  const gainBody = isEnglishCopy
    ? `+${award.gainedXp} EXP`
    : `+${award.gainedXp} EXP を獲得しました`;

  toast.success(gainBody, {
    title: isEnglishCopy ? 'Progress' : '経験値',
    duration: 3500,
  });

  if (award.leveledUp) {
    const levelBody = isEnglishCopy
      ? `You reached Level ${award.newLevel}.`
      : `レベル ${award.newLevel} にレベルアップ！`;
    toast.info(levelBody, {
      title: isEnglishCopy ? 'Level up' : 'レベルアップ',
      duration: 4500,
    });
  }

  if (isIOSWebView()) {
    sendGameCallback('playerXpChanged');
  }
}
