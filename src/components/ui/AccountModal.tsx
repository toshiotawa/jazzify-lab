import React, { useEffect, useState, useCallback } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { useToastStore } from '@/stores/toastStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import GameHeader from '@/components/ui/GameHeader';
import { persistPreferredLocale, resolveAudienceLocale, shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { hasNonExpiredBillingProvider } from '@/utils/membershipDisplay';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import {
  changeLemonPlan,
  cancelPendingLemonPlanChange,
  cancelLemonSubscriptionRequest,
  fetchLemonBillingLink,
  fetchLemonInvoices,
  resumeLemonSubscription,
  type LemonInvoiceItem,
} from '@/utils/lemonBillingClient';
import PlanChangeConfirmModal from '@/components/ui/PlanChangeConfirmModal';
import CancelSubscriptionConfirmModal from '@/components/ui/CancelSubscriptionConfirmModal';
import { getPlanIntervalLabel } from '@/utils/membershipDisplay';
import { formatBillingAmountLabel } from '@/utils/premiumPricing';
/**
 * #account ハッシュに合わせて表示されるアカウントページ (モーダル→ページ化)
 */
const AccountPage: React.FC = () => {
  const {
    profile,
    logout,
    updateEmail,
    verifyEmailChangeOtp,
    updateNickname,
    emailChangeStatus,
    clearEmailChangeStatus,
    session,
  } = useAuthStore();
  const pushToast = useToastStore(state => state.push);
  const [open, setOpen] = useState(() => window.location.hash.startsWith('#account'));
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [preferredLocale, setPreferredLocale] = useState<'ja' | 'en'>(
    () => profile?.preferred_locale ?? resolveAudienceLocale(),
  );
  const [localeSaving, setLocaleSaving] = useState(false);
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  /** メール変更 OTP 待ちの新メールアドレス（null なら未送信） */
  const [emailChangePendingAddress, setEmailChangePendingAddress] = useState<string | null>(null);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country,
    preferredLocale: profile?.preferred_locale ?? preferredLocale,
    geoCountryHint: geoCountry,
  });
  const localeCode = isEnglishCopy ? 'en' : 'ja';
  const { planLabel, isPremiumMember, billingPayload, refetchBilling } = useBillingAwareMembership(localeCode);
  const showAppleBillingNotice = hasNonExpiredBillingProvider(billingPayload, 'apple');
  const showLemonBillingPortal = hasNonExpiredBillingProvider(billingPayload, 'lemon');
  const [showPaywall, setShowPaywall] = useState(false);
  const [billingActionLoading, setBillingActionLoading] = useState<string | null>(null);
  const [planChangeTarget, setPlanChangeTarget] = useState<'monthly' | 'yearly' | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [invoicesExpanded, setInvoicesExpanded] = useState(false);
  const [invoices, setInvoices] = useState<LemonInvoiceItem[] | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState(false);
  const [billingRefreshing, setBillingRefreshing] = useState(false);

  const refreshBillingStatus = useCallback(async () => {
    await refetchBilling();
  }, [refetchBilling]);

  const handleRefreshBillingStatus = useCallback(async () => {
    setBillingRefreshing(true);
    try {
      await Promise.all([
        refetchBilling(),
        useAuthStore.getState().fetchProfile({ forceRefresh: true }),
      ]);
    } finally {
      setBillingRefreshing(false);
    }
  }, [refetchBilling]);

  const formatPeriodEnd = useCallback((iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toLocaleDateString(isEnglishCopy ? 'en-US' : 'ja-JP');
  }, [isEnglishCopy]);

  const openBillingLink = useCallback(async (purpose: 'payment_method') => {
    setBillingActionLoading(purpose);
    try {
      const url = await fetchLemonBillingLink(purpose);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(isEnglishCopy ? 'Failed to open billing page' : '請求ページを開けませんでした');
      }
    } finally {
      setBillingActionLoading(null);
    }
  }, [isEnglishCopy]);

  const handleChangePlan = useCallback(async (target: 'monthly' | 'yearly') => {
    setPlanChangeTarget(target);
  }, []);

  const confirmPlanChange = useCallback(async () => {
    if (!planChangeTarget) return;
    setBillingActionLoading(`change_${planChangeTarget}`);
    try {
      const result = await changeLemonPlan(planChangeTarget);
      if (result.ok) {
        pushToast(isEnglishCopy ? 'Plan change scheduled' : 'プラン変更を予約しました', 'success');
        setPlanChangeTarget(null);
        await refreshBillingStatus();
      } else {
        alert(result.error ?? (isEnglishCopy ? 'Failed to change plan' : 'プラン変更に失敗しました'));
      }
    } finally {
      setBillingActionLoading(null);
    }
  }, [isEnglishCopy, planChangeTarget, pushToast, refreshBillingStatus]);

  const handleCancelPendingPlanChange = useCallback(async () => {
    setBillingActionLoading('cancel_pending');
    try {
      const result = await cancelPendingLemonPlanChange();
      if (result.ok) {
        pushToast(isEnglishCopy ? 'Scheduled plan change cancelled' : 'プラン変更の予約を取り消しました', 'success');
        await refreshBillingStatus();
      } else {
        alert(result.error ?? (isEnglishCopy ? 'Failed to cancel plan change' : 'プラン変更の取り消しに失敗しました'));
      }
    } finally {
      setBillingActionLoading(null);
    }
  }, [isEnglishCopy, pushToast, refreshBillingStatus]);

  const handleResumeSubscription = useCallback(async () => {
    const msg = isEnglishCopy
      ? 'Resume your subscription? Billing will continue as before.'
      : '解約を取り消してサブスクリプションを再開しますか？';
    if (!confirm(msg)) return;
    setBillingActionLoading('resume');
    try {
      const result = await resumeLemonSubscription();
      if (result.ok) {
        pushToast(isEnglishCopy ? 'Subscription resumed' : '解約を取り消しました', 'success');
        await refreshBillingStatus();
      } else {
        alert(result.error ?? (isEnglishCopy ? 'Failed to resume subscription' : '解約取り消しに失敗しました'));
      }
    } finally {
      setBillingActionLoading(null);
    }
  }, [isEnglishCopy, pushToast, refreshBillingStatus]);

  const handleConfirmCancelSubscription = useCallback(async () => {
    setBillingActionLoading('cancel');
    try {
      const result = await cancelLemonSubscriptionRequest();
      if (result.ok) {
        pushToast(
          isEnglishCopy
            ? 'Cancellation confirmed. You can use premium until the period ends'
            : '解約を受け付けました。期間終了までご利用いただけます',
          'success',
        );
        setShowCancelConfirm(false);
        await refreshBillingStatus();
      } else {
        pushToast(
          result.error ?? (isEnglishCopy ? 'Failed to cancel subscription' : '解約に失敗しました'),
          'error',
        );
      }
    } finally {
      setBillingActionLoading(null);
    }
  }, [isEnglishCopy, pushToast, refreshBillingStatus]);

  const handleToggleInvoices = useCallback(async () => {
    if (invoicesExpanded) {
      setInvoicesExpanded(false);
      return;
    }
    setInvoicesExpanded(true);
    if (invoicesLoading) return;
    if (invoices !== null && !invoicesError) return;
    setInvoicesLoading(true);
    setInvoicesError(false);
    try {
      const fetched = await fetchLemonInvoices();
      if (fetched === null) {
        // invoices を null のままにして、次回展開時に再試行できるようにする
        setInvoicesError(true);
      } else {
        setInvoices(fetched);
      }
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoices, invoicesError, invoicesExpanded, invoicesLoading]);
  const handleNicknameSave = useCallback(async () => {
    const trimmed = nicknameValue.trim();
    if (!trimmed || trimmed === profile?.nickname) {
      setNicknameEditing(false);
      return;
    }
    setNicknameSaving(true);
    const result = await updateNickname(trimmed);
    setNicknameSaving(false);
    if (result.success) {
      pushToast(isEnglishCopy ? 'Nickname updated' : 'ニックネームを更新しました', 'success');
      setNicknameEditing(false);
    } else {
      pushToast(result.message, 'error');
    }
  }, [nicknameValue, profile?.nickname, updateNickname, pushToast, isEnglishCopy]);

  const periodEndLabel = formatPeriodEnd(billingPayload?.current_period_ends_at);
  const pendingEffectiveLabel = formatPeriodEnd(
    billingPayload?.pending_plan_effective_at ?? billingPayload?.current_period_ends_at,
  );
  const isCancelledGrace = billingPayload?.entitlement_state === 'cancelled_but_active_until_end';
  const canChangePlan = billingPayload?.can_change_plan === true;
  const canCancelPendingPlanChange = billingPayload?.can_cancel_pending_plan_change === true;
  const canResume = billingPayload?.can_resume === true;
  const canManagePayment = billingPayload?.can_manage_payment === true;
  const canCancelSubscription = billingPayload?.entitlement_state === 'active';
  const pendingPlanCode = billingPayload?.pending_plan_code ?? null;
  const pendingIntervalLabel = pendingPlanCode
    ? getPlanIntervalLabel(pendingPlanCode, localeCode)
    : null;
  const nextBillingLabel = billingPayload?.next_billing_amount_jpy != null
    ? formatBillingAmountLabel(
      pendingPlanCode ?? billingPayload.plan_code,
      localeCode,
    )
    : null;
  const showChangeToYearly = canChangePlan && billingPayload?.plan_code === 'core_monthly';
  const showChangeToMonthly = canChangePlan && billingPayload?.plan_code === 'core_yearly';

  useEffect(() => {
    const syncFromHash = () => {
      setOpen(window.location.hash.startsWith('#account'));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // アカウント画面を開いたとき・Checkout 戻り時に最新状態を取得（即時反映）
  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    const initialRank = profile.rank;
    const hasCheckoutSession = window.location.hash.includes('session_id=');

    const refreshOnce = async () => {
      await Promise.all([
        useAuthStore.getState().fetchProfile({ forceRefresh: true }),
        refetchBilling(),
      ]);
    };

    const refreshWithPolling = async () => {
      const maxTries = 7; // 約10秒（1.5s * 6回 + 初回）
      for (let i = 0; i < maxTries && !cancelled; i++) {
        await useAuthStore.getState().fetchProfile({ forceRefresh: true });
        const currentRank = useAuthStore.getState().profile?.rank;
        if (currentRank && currentRank !== initialRank) {
          break;
        }
        if (i < maxTries - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    };

    if (hasCheckoutSession) {
      void refreshWithPolling();
    } else {
      void refreshOnce();
    }

    return () => {
      cancelled = true;
    };
  }, [open, profile?.id, refetchBilling]);

  useEffect(() => {
    setPreferredLocale(profile?.preferred_locale ?? resolveAudienceLocale());
  }, [profile?.preferred_locale]);
  
  // メールアドレス変更ステータスを監視してToast表示
  useEffect(() => {
    if (emailChangeStatus && emailChangeStatus.type) {
      pushToast(
        emailChangeStatus.message,
        emailChangeStatus.type,
        {
          duration: emailChangeStatus.type === 'success' ? 5000 : 7000,
          title: emailChangeStatus.title,
        }
      );
      clearEmailChangeStatus();
    }
  }, [emailChangeStatus, pushToast, clearEmailChangeStatus]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      {/* Global header */}
      <GameHeader />

      {/* Page body */}
      <div className="flex-1 w-full flex flex-col items-center overflow-auto p-6">
        <div className="w-full max-w-md space-y-6 [&_button]:font-accent [&_button]:font-bold">
          <h2 className="text-xl font-extrabold tracking-tight text-center user-name">{isEnglishCopy ? 'Account' : 'アカウント'}</h2>
          
          {profile ? (
            <div className="space-y-4">
                  {/* ニックネーム */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                    <label className="text-xs text-gray-400">{isEnglishCopy ? 'Nickname' : 'ニックネーム'}</label>
                    {nicknameEditing ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          className="flex-1 p-2 rounded-lg bg-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                          value={nicknameValue}
                          onChange={e => setNicknameValue(e.target.value)}
                          maxLength={20}
                          disabled={nicknameSaving}
                          onKeyDown={e => { if (e.key === 'Enter') void handleNicknameSave(); }}
                        />
                        <button
                          className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                          disabled={nicknameSaving || !nicknameValue.trim() || nicknameValue.trim() === profile?.nickname}
                          onClick={() => void handleNicknameSave()}
                        >
                          {nicknameSaving ? '...' : (isEnglishCopy ? 'Save' : '保存')}
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-gray-200 transition-colors whitespace-nowrap"
                          onClick={() => setNicknameEditing(false)}
                          disabled={nicknameSaving}
                        >
                          {isEnglishCopy ? 'Cancel' : 'キャンセル'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-extrabold text-sm user-name">{profile?.nickname}</span>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-gray-200 transition-colors"
                          onClick={() => { setNicknameValue(profile?.nickname ?? ''); setNicknameEditing(true); }}
                        >
                          {isEnglishCopy ? 'Edit' : '編集'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 言語設定 */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 space-y-3">
                    <div className="space-y-2">
                      <label htmlFor="preferredLocale" className="text-xs text-gray-400">
                        {isEnglishCopy ? 'Language' : '表示言語'}
                      </label>
                      <div className="flex gap-2">
                        <select
                          id="preferredLocale"
                          className="flex-1 p-2 rounded-lg bg-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                          value={preferredLocale}
                          onChange={e => setPreferredLocale(e.target.value === 'en' ? 'en' : 'ja')}
                          disabled={localeSaving}
                        >
                          <option value="ja">Japanese</option>
                          <option value="en">English</option>
                        </select>
                        <button
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                          disabled={localeSaving || preferredLocale === (profile.preferred_locale ?? resolveAudienceLocale())}
                          onClick={async () => {
                            setLocaleSaving(true);
                            try {
                              await getSupabaseClient()
                                .from('profiles')
                                .update({ preferred_locale: preferredLocale })
                                .eq('id', profile.id);
                              persistPreferredLocale(preferredLocale);
                              useAuthStore.setState(state => {
                                if (state.profile) {
                                  state.profile = {
                                    ...state.profile,
                                    preferred_locale: preferredLocale,
                                  };
                                }
                              });
                              pushToast(isEnglishCopy ? 'Language updated' : '表示言語を更新しました', 'success');
                            } catch (err) {
                              pushToast(
                                (isEnglishCopy ? 'Failed to update language: ' : '表示言語の更新に失敗しました: ') +
                                (err instanceof Error ? err.message : String(err)),
                                'error',
                              );
                            } finally {
                              setLocaleSaving(false);
                            }
                          }}
                        >
                          {localeSaving ? '...' : (isEnglishCopy ? 'Save' : '保存')}
                        </button>
                      </div>
                    </div>

                    {/* メールアドレス */}
                    <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-700/50">
                      <span className="text-gray-400">{isEnglishCopy ? 'Email' : 'メールアドレス'}</span>
                      <span className="font-medium text-xs truncate ml-4 max-w-[200px]">{profile.email}</span>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-700/50">
                      <label htmlFor="newEmail" className="text-xs text-gray-400">{isEnglishCopy ? 'Change Email' : 'メールアドレス変更'}</label>
                      <div className="flex gap-2">
                        <input
                          id="newEmail"
                          type="email"
                          className="flex-1 p-2 rounded-lg bg-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder={isEnglishCopy ? 'New email address' : '新しいメールアドレス'}
                          disabled={emailUpdating || emailChangePendingAddress != null}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                          disabled={
                            emailUpdating ||
                            emailChangePendingAddress != null ||
                            !newEmail.trim() ||
                            newEmail.trim() === profile?.email
                          }
                          onClick={async () => {
                            const email = newEmail.trim();
                            if (!email) {
                              setEmailMessage(isEnglishCopy ? 'Please enter an email address' : 'メールアドレスを入力してください');
                              return;
                            }
                            if (email === profile?.email) {
                              setEmailMessage(isEnglishCopy ? 'Same as current email' : '現在のメールアドレスと同じです');
                              return;
                            }
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(email)) {
                              setEmailMessage(isEnglishCopy ? 'Please enter a valid email address' : '有効なメールアドレスを入力してください');
                              return;
                            }
                            setEmailUpdating(true);
                            setEmailMessage('');
                            try {
                              const result = await updateEmail(email, isEnglishCopy);
                              setEmailMessage(result.message);
                              if (result.success) {
                                setEmailChangePendingAddress(email);
                                setEmailOtpCode('');
                              }
                            } catch (err) {
                              setEmailMessage((isEnglishCopy ? 'Failed to send code: ' : '送信に失敗しました: ') + (err instanceof Error ? err.message : String(err)));
                            } finally {
                              setEmailUpdating(false);
                            }
                          }}
                        >
                          {emailUpdating ? '...' : (isEnglishCopy ? 'Send code' : 'コードを送信')}
                        </button>
                      </div>

                      {emailChangePendingAddress != null && (
                        <div className="space-y-2 mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-600/50">
                          <p className="text-xs text-gray-400">
                            {isEnglishCopy ? 'Sent to' : '送信先'}:{' '}
                            <span className="text-gray-200 font-medium">{emailChangePendingAddress}</span>
                          </p>
                          <label htmlFor="emailOtp" className="text-xs text-gray-400">
                            {isEnglishCopy ? '6-digit code' : '6桁の確認コード'}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <input
                              id="emailOtp"
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              className="flex-1 min-w-[8rem] p-2 rounded-lg bg-slate-700 text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-primary-400"
                              value={emailOtpCode}
                              onChange={e => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder={isEnglishCopy ? '000000' : '000000'}
                              disabled={emailOtpVerifying}
                            />
                            <button
                              type="button"
                              className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                              disabled={
                                emailOtpVerifying ||
                                emailOtpCode.replace(/\s/g, '').length < 6
                              }
                              onClick={async () => {
                                const pending = emailChangePendingAddress;
                                if (!pending) return;
                                setEmailOtpVerifying(true);
                                setEmailMessage('');
                                try {
                                  const result = await verifyEmailChangeOtp(
                                    pending,
                                    emailOtpCode,
                                    isEnglishCopy,
                                  );
                                  setEmailMessage(result.message);
                                  if (result.success) {
                                    pushToast(
                                      isEnglishCopy ? 'Email updated' : 'メールアドレスを更新しました',
                                      'success',
                                    );
                                    setEmailChangePendingAddress(null);
                                    setNewEmail('');
                                    setEmailOtpCode('');
                                  }
                                } catch (err) {
                                  setEmailMessage(
                                    (isEnglishCopy ? 'Verification failed: ' : '確認に失敗しました: ') +
                                      (err instanceof Error ? err.message : String(err)),
                                  );
                                } finally {
                                  setEmailOtpVerifying(false);
                                }
                              }}
                            >
                              {emailOtpVerifying ? '...' : (isEnglishCopy ? 'Verify' : '確認')}
                            </button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="text-xs text-primary-300 hover:underline disabled:opacity-50"
                              disabled={emailUpdating || emailOtpVerifying}
                              onClick={async () => {
                                const pending = emailChangePendingAddress;
                                if (!pending) return;
                                setEmailUpdating(true);
                                setEmailMessage('');
                                try {
                                  const result = await updateEmail(pending, isEnglishCopy);
                                  setEmailMessage(result.message);
                                } finally {
                                  setEmailUpdating(false);
                                }
                              }}
                            >
                              {isEnglishCopy ? 'Resend code' : 'コードを再送信'}
                            </button>
                            <button
                              type="button"
                              className="text-xs text-gray-400 hover:underline"
                              disabled={emailOtpVerifying}
                              onClick={() => {
                                setEmailChangePendingAddress(null);
                                setEmailOtpCode('');
                                setEmailMessage('');
                              }}
                            >
                              {isEnglishCopy ? 'Cancel' : 'キャンセル'}
                            </button>
                          </div>
                        </div>
                      )}

                      {emailMessage && (
                        <div
                          className={`text-xs p-2 rounded-lg ${
                            emailMessage.includes('送信しました') ||
                            emailMessage.includes('verification code') ||
                            emailMessage.includes('更新しました') ||
                            emailMessage.includes('updated')
                              ? 'text-green-400 bg-green-900/20'
                              : 'text-red-400 bg-red-900/20'
                          }`}
                        >
                          {emailMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* あなたのプラン */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">{isEnglishCopy ? 'Your Plan' : 'あなたのプラン'}</h3>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost gap-1.5 text-gray-400 hover:text-gray-200 shrink-0"
                        disabled={billingRefreshing || billingActionLoading !== null}
                        onClick={() => void handleRefreshBillingStatus()}
                        aria-label={isEnglishCopy ? 'Refresh plan status' : 'プラン状態を更新'}
                      >
                        <FaSyncAlt
                          className={`w-3 h-3 ${billingRefreshing ? 'animate-spin' : ''}`}
                          aria-hidden
                        />
                        <span>
                          {billingRefreshing
                            ? (isEnglishCopy ? 'Updating…' : '更新中…')
                            : (isEnglishCopy ? 'Refresh' : '状態を更新')}
                        </span>
                      </button>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span>{isEnglishCopy ? 'Current Plan' : 'ご利用中のプラン'}</span>
                        <span className="font-semibold text-primary-400">
                          {planLabel}
                        </span>
                      </div>
                      {periodEndLabel && !isCancelledGrace && !pendingPlanCode && (
                        <p className="text-xs text-gray-400">
                          {isEnglishCopy ? `Next renewal: ${periodEndLabel}` : `次回更新日: ${periodEndLabel}`}
                        </p>
                      )}
                      {!isCancelledGrace && !pendingPlanCode && nextBillingLabel && (
                        <p className="text-xs text-gray-400">
                          {isEnglishCopy ? `Next charge: ${nextBillingLabel}` : `次回請求額: ${nextBillingLabel}`}
                        </p>
                      )}
                      {pendingPlanCode && pendingEffectiveLabel && pendingIntervalLabel && (
                        <p className="text-xs text-blue-200">
                          {isEnglishCopy
                            ? `Switching to ${pendingIntervalLabel} on ${pendingEffectiveLabel}`
                            : `${pendingEffectiveLabel}から${pendingIntervalLabel}に切り替わります`}
                        </p>
                      )}
                      {pendingPlanCode && nextBillingLabel && (
                        <p className="text-xs text-gray-400">
                          {isEnglishCopy ? `Next charge: ${nextBillingLabel}` : `次回請求額: ${nextBillingLabel}`}
                        </p>
                      )}
                      {pendingPlanCode && (
                        <p className="text-xs text-gray-400">
                          {isEnglishCopy ? 'No additional charge today' : '本日の追加請求：なし'}
                        </p>
                      )}
                      {periodEndLabel && isCancelledGrace && (
                        <p className="text-xs text-amber-300">
                          {isEnglishCopy
                            ? `Access until: ${periodEndLabel}`
                            : `利用期限: ${periodEndLabel}（解約予定）`}
                        </p>
                      )}

                      {!isPremiumMember && !showAppleBillingNotice && (
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all duration-200 mt-2"
                          onClick={() => setShowPaywall(true)}
                        >
                          {isEnglishCopy ? 'Subscribe to Premium' : 'プレミアムに登録する'}
                        </button>
                      )}

                      {showAppleBillingNotice && (
                        <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-700/30 mt-2">
                          <p className="text-sm text-orange-200 font-semibold mb-1">
                            {isEnglishCopy ? 'Subscribed via iOS app' : 'iOS版で手続き済み'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isEnglishCopy
                              ? 'To view or cancel your subscription, go to Settings → Apple ID → Subscriptions.'
                              : 'サブスクリプションの確認・解約は、設定 → Apple ID → サブスクリプションから行えます。'}
                          </p>
                        </div>
                      )}
                      {showLemonBillingPortal && (
                        <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30 mt-2 space-y-2">
                          <p className="text-sm text-blue-200 font-semibold mb-1">
                            {isEnglishCopy ? 'Web billing (Lemon Squeezy)' : 'Web課金（Lemon Squeezy）'}
                          </p>
                          {showChangeToYearly && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline w-full"
                              disabled={billingActionLoading !== null}
                              onClick={() => void handleChangePlan('yearly')}
                            >
                              {billingActionLoading === 'change_yearly'
                                ? (isEnglishCopy ? 'Processing…' : '処理中…')
                                : (isEnglishCopy ? 'Switch to yearly plan' : '年額プランに変更する')}
                            </button>
                          )}
                          {showChangeToMonthly && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline w-full"
                              disabled={billingActionLoading !== null}
                              onClick={() => void handleChangePlan('monthly')}
                            >
                              {billingActionLoading === 'change_monthly'
                                ? (isEnglishCopy ? 'Processing…' : '処理中…')
                                : (isEnglishCopy ? 'Switch to monthly plan' : '月額プランに変更する')}
                            </button>
                          )}
                          {canCancelPendingPlanChange && pendingIntervalLabel && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline w-full"
                              disabled={billingActionLoading !== null}
                              onClick={() => void handleCancelPendingPlanChange()}
                            >
                              {billingActionLoading === 'cancel_pending'
                                ? (isEnglishCopy ? 'Processing…' : '処理中…')
                                : (isEnglishCopy
                                  ? `Cancel switch to ${pendingIntervalLabel}`
                                  : `${pendingIntervalLabel}への変更を取り消す`)}
                            </button>
                          )}
                          {canResume && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary w-full"
                              disabled={billingActionLoading !== null}
                              onClick={() => void handleResumeSubscription()}
                            >
                              {billingActionLoading === 'resume'
                                ? (isEnglishCopy ? 'Processing…' : '処理中…')
                                : (isEnglishCopy ? 'Resume subscription' : '解約を取り消す')}
                            </button>
                          )}
                          {canCancelSubscription && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline w-full text-red-300 border-red-700/50"
                              disabled={billingActionLoading !== null}
                              onClick={() => setShowCancelConfirm(true)}
                            >
                              {billingActionLoading === 'cancel'
                                ? (isEnglishCopy ? 'Processing…' : '処理中…')
                                : (isEnglishCopy ? 'Cancel subscription' : '解約する')}
                            </button>
                          )}
                          {canManagePayment && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline w-full"
                                disabled={billingActionLoading !== null}
                                onClick={() => void openBillingLink('payment_method')}
                              >
                                {billingActionLoading === 'payment_method'
                                  ? (isEnglishCopy ? 'Opening…' : '開いています…')
                                  : (isEnglishCopy ? 'Update payment method' : '支払い方法を変更する')}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline w-full"
                                disabled={billingActionLoading !== null || invoicesLoading}
                                onClick={() => void handleToggleInvoices()}
                              >
                                {invoicesLoading
                                  ? (isEnglishCopy ? 'Loading…' : '読み込み中…')
                                  : (isEnglishCopy
                                    ? (invoicesExpanded ? 'Hide billing history' : 'View billing history')
                                    : (invoicesExpanded ? '請求履歴を閉じる' : '請求履歴を見る'))}
                              </button>
                              {invoicesExpanded && (
                                <div className="rounded-lg border border-blue-700/20 bg-slate-900/40 p-2 space-y-2">
                                  {invoicesLoading && (
                                    <p className="text-xs text-gray-400">
                                      {isEnglishCopy ? 'Loading…' : '読み込み中…'}
                                    </p>
                                  )}
                                  {!invoicesLoading && invoicesError && (
                                    <p className="text-xs text-red-300">
                                      {isEnglishCopy
                                        ? 'Failed to load billing history'
                                        : '請求履歴を取得できませんでした'}
                                    </p>
                                  )}
                                  {!invoicesLoading && !invoicesError && invoices?.length === 0 && (
                                    <p className="text-xs text-gray-400">
                                      {isEnglishCopy ? 'No billing history yet' : '請求履歴はまだありません'}
                                    </p>
                                  )}
                                  {!invoicesLoading && !invoicesError && invoices && invoices.length > 0 && (
                                    <ul className="space-y-2">
                                      {invoices.map((invoice) => {
                                        const dateLabel = formatPeriodEnd(invoice.created_at);
                                        return (
                                          <li
                                            key={invoice.id}
                                            className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-gray-300 border-b border-slate-700/50 pb-2 last:border-0 last:pb-0"
                                          >
                                            <div className="space-y-0.5">
                                              {dateLabel && (
                                                <p className="text-gray-200">{dateLabel}</p>
                                              )}
                                              {invoice.status_formatted && (
                                                <p className="text-gray-400">{invoice.status_formatted}</p>
                                              )}
                                              {invoice.total_formatted && (
                                                <p className="text-gray-300">{invoice.total_formatted}</p>
                                              )}
                                            </div>
                                            {invoice.invoice_url && (
                                              <a
                                                href={invoice.invoice_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-300 hover:text-blue-200 underline shrink-0"
                                              >
                                                {isEnglishCopy ? 'Receipt' : '領収書'}
                                              </a>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 退会（アカウント削除） */}
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-red-400">{isEnglishCopy ? 'Delete Account' : '退会（アカウント削除）'}</h3>
                    <p className="text-xs text-gray-400">
                      {isEnglishCopy 
                        ? 'Deleting your account will prevent you from logging in. Public data will be anonymized as "Deleted User". You must be on the Free plan to delete your account.'
                        : '退会するとログインできなくなります。公開データは「退会ユーザー」として匿名化されます。'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className={`btn btn-sm ${!isPremiumMember ? 'btn-danger' : 'btn-disabled'}`}
                        disabled={isPremiumMember}
                        onClick={async () => {
                          if (!confirm(isEnglishCopy ? 'Are you sure you want to delete your account? This action cannot be undone.' : '本当に退会しますか？この操作は取り消せません。')) return;
                          try {
                            const response = await fetch('/.netlify/functions/deleteAccount', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                              },
                            });
                            if (response.ok) {
                              // 退会成功時は即座にログアウトしてから退会完了ページへリダイレクト
                              // サーバー側でセッションは無効化されているが、クライアント側のストアもクリアする
                              await logout();
                              window.location.href = '/withdrawal-complete';
                            } else {
                              const err = await response.json().catch(()=>({error: isEnglishCopy ? 'Failed to delete account' : '退会に失敗しました'}));
                              const errorMessage = err.details ? `${err.error}: ${err.details}` : err.error;
                              alert(errorMessage || (isEnglishCopy ? 'Failed to delete account' : '退会に失敗しました'));
                            }
                          } catch (e) {
                            alert(isEnglishCopy ? 'An error occurred while deleting account' : '退会処理中にエラーが発生しました');
                          }
                        }}
                        title={isPremiumMember ? (isEnglishCopy ? 'Your subscription period has not ended yet. Please cancel first.' : 'まだサブスクリプションの利用期間が残っています。先に解約してください。') : ''}
                      >
                        {isEnglishCopy ? 'Delete Account' : '退会する'}
                      </button>
                    </div>
                  </div>
            </div>
          ) : (
            <p className="text-center text-sm">{isEnglishCopy ? 'Could not retrieve profile information.' : 'プロフィール情報が取得できませんでした。'}</p>
          )}
        </div>
        <div className="mt-8 w-full max-w-md space-y-3">
          <a
            href="/contact"
            className="btn btn-sm btn-outline w-full block text-center"
          >
            {isEnglishCopy ? 'Contact Us' : 'お問い合わせ'}
          </a>
          <button
            className="btn btn-sm btn-outline w-full"
            onClick={async () => {
              await logout();
              window.location.href = 'https://jazzify.jp/';
            }}
          >
            {isEnglishCopy ? 'Log Out' : 'ログアウト'}
          </button>
        </div>
      </div>

      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} />
      <PlanChangeConfirmModal
        open={planChangeTarget !== null}
        target={planChangeTarget ?? 'yearly'}
        periodEndLabel={periodEndLabel}
        isEnglishCopy={isEnglishCopy}
        loading={billingActionLoading === 'change_monthly' || billingActionLoading === 'change_yearly'}
        onClose={() => setPlanChangeTarget(null)}
        onConfirm={() => void confirmPlanChange()}
      />
      <CancelSubscriptionConfirmModal
        open={showCancelConfirm}
        periodEndLabel={periodEndLabel}
        pendingPlanCode={pendingPlanCode}
        isEnglishCopy={isEnglishCopy}
        loading={billingActionLoading === 'cancel'}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => void handleConfirmCancelSubscription()}
      />
    </div>
  );
};

export default AccountPage; 