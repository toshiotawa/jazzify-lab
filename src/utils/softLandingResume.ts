/** ダッシュボードでソフトランディングオファーを自動表示済み（セッション単位） */
export const SOFT_LANDING_OFFER_AUTO_SHOWN_SESSION_KEY = 'sl_offer_auto_shown';

/** 案内で「いいえ」を選び、当セッションは自由行動（セッション単位） */
export const SOFT_LANDING_SESSION_DISMISSED_KEY = 'sl_guided_session_dismissed';

export function readSoftLandingOfferSessionAutoShown(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(SOFT_LANDING_OFFER_AUTO_SHOWN_SESSION_KEY) === '1';
}

export function markSoftLandingOfferSessionAutoShown(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(SOFT_LANDING_OFFER_AUTO_SHOWN_SESSION_KEY, '1');
}

export function readSoftLandingSessionDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(SOFT_LANDING_SESSION_DISMISSED_KEY) === '1';
}

export function markSoftLandingSessionDismissed(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(SOFT_LANDING_SESSION_DISMISSED_KEY, '1');
}
