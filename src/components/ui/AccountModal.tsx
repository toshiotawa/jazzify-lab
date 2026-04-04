import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { useToastStore } from '@/stores/toastStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import GameHeader from '@/components/ui/GameHeader';
import { persistPreferredLocale, resolveAudienceLocale, shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getMembershipLabel, isPremiumTier } from '@/utils/membership';

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
  const [billingProvider, setBillingProvider] = useState<string | null>(null);
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
  const planLabel = getMembershipLabel(profile?.rank, localeCode);
  const isPremiumMember = isPremiumTier(profile?.rank);
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

  const handleOpenBillingPortal = useCallback(async () => {
    const readPortalUrl = (data: unknown): string | null => {
      if (typeof data !== 'object' || data === null || !('url' in data)) return null;
      const url = Reflect.get(data, 'url');
      return typeof url === 'string' ? url : null;
    };
    const readErrorFields = (data: unknown): { error: string; details: string } => {
      if (typeof data !== 'object' || data === null) return { error: '', details: '' };
      const e = Reflect.get(data, 'error');
      const d = Reflect.get(data, 'details');
      return {
        error: typeof e === 'string' ? e : '',
        details: typeof d === 'string' ? d : '',
      };
    };
    try {
      const response = await fetch('/.netlify/functions/lemonsqueezyPortal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token ?? ''}`,
        },
      });
      if (response.ok) {
        const portalUrl = readPortalUrl(await response.json());
        if (portalUrl) window.open(portalUrl, '_blank');
      } else if (response.status === 404) {
        alert(isEnglishCopy ? 'No subscription found. Please select Premium first.' : 'Premium プランが見つかりません。先にプランを選択してください。');
        window.location.href = '/main#pricing';
      } else {
        const err = readErrorFields(await response.json().catch(() => null));
        const msg = [err.error, err.details].filter(Boolean).join(': ') || (isEnglishCopy ? 'Failed to open billing portal' : '請求ポータルの表示に失敗しました');
        alert(msg);
      }
    } catch {
      alert(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
    }
  }, [isEnglishCopy]);

  useEffect(() => {
    const syncFromHash = () => {
      setOpen(window.location.hash.startsWith('#account'));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    const checkBilling = async () => {
      try {
        const token = session?.access_token;
        if (!token) return;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/billing-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBillingProvider(data.provider ?? null);
        }
      } catch { /* ignore */ }
    };
    if (open) checkBilling();
  }, [open, session?.access_token]);

  // Stripe Checkout など外部遷移から戻った際に最新プロフィールを取得（即時反映）
  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    const initialRank = profile.rank;
    const hasCheckoutSession = window.location.hash.includes('session_id=');

    const refreshOnce = async () => {
      await useAuthStore.getState().fetchProfile({ forceRefresh: true });
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
  }, [open, profile?.id]);

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
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-xl font-bold text-center">{isEnglishCopy ? 'Account' : 'アカウント'}</h2>
          
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
                        <span className="font-medium text-sm">{profile?.nickname}</span>
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
                    <h3 className="text-lg font-semibold">{isEnglishCopy ? 'Your Plan' : 'あなたのプラン'}</h3>
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span>{isEnglishCopy ? 'Current Plan' : 'ご利用中のプラン'}</span>
                        <span className="font-semibold text-primary-400">
                          {planLabel}
                        </span>
                      </div>

                      {billingProvider === 'apple' && (
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
                      {billingProvider === 'lemon' && (
                        <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30 mt-2 space-y-2">
                          <p className="text-sm text-blue-200 font-semibold mb-1">
                            {isEnglishCopy ? 'Subscribed via Web' : 'Web版で手続き済み'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isEnglishCopy
                              ? 'Use the billing portal to view your plan or cancel your subscription.'
                              : '請求ポータルでプランの確認や解約ができます。'}
                          </p>
                          {isPremiumMember && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline w-full"
                              onClick={() => void handleOpenBillingPortal()}
                            >
                              {isEnglishCopy ? 'Open Billing Portal' : '請求ポータルを開く'}
                            </button>
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

    </div>
  );
};

export default AccountPage; 