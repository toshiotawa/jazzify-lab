import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { getCountryLabel, getSortedCountryCodes } from '@/constants/countries';
import { Navigate, useLocation } from 'react-router-dom';
import { getTermsContent, type TermsLocale } from '@/components/legal/termsContent';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * ログインが必要な領域をラップするゲート。
 * - ローディング中はスピナー
 * - 未ログインなら /login へリダイレクト（/login 系は素通り）
 * - ゲストプレイボタンも提供
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading, error, isGuest, hasProfile, createProfile, fetchProfile, profile: authProfile } = useAuthStore();
  const location = useLocation();
  const geoCountry = useGeoStore(state => state.country);
  const inAuthFlow =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/login/verify-otp';
  const isEnglishCopy = shouldUseEnglishCopy({ rank: authProfile?.rank, country: authProfile?.country ?? geoCountry });
  const locale: TermsLocale = isEnglishCopy ? 'en' : 'ja';
  const termsContent = getTermsContent(locale);
  const loadingText = isEnglishCopy ? 'Loading...' : '読み込み中...';
  const errorTitle = isEnglishCopy ? 'Authentication Error' : '認証エラー';
  const retryText = isEnglishCopy ? 'Retry' : '再試行';
  const accountRegistrationHeading = isEnglishCopy ? 'Account Registration' : 'アカウント登録';
  const profileConfirmedHeading = isEnglishCopy ? 'Profile Confirmation' : 'プロフィール確認';

  // ローディング中
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white text-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div>{loadingText}</div>
          </div>
      </div>
    );
  }

  // エラーがある場合は表示
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
        <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-4">{errorTitle}</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
              {retryText}
          </button>
        </div>
      </div>
    );
  }

  // デバッグ情報を出力
  console.log('🔍 AuthGate: 状態確認', {
    user: !!user,
    isGuest,
    hasProfile,
    loading,
    error,
    userId: user?.id,
    userEmail: user?.email,
  });

  // ログイン済みでプロフィールがある、またはゲストモード
  if (isGuest || (user && hasProfile)) {
    console.log('✅ AuthGate: 正常アクセス許可');
    return <>{children}</>;
  }

  // ログイン済みだがプロフィール未作成 -> モーダル
  if (user && !hasProfile) {
    console.log('⚠️ AuthGate: プロフィール未作成 - アカウント登録モーダル表示');
      return (
        <AccountRegistrationModal
          onSubmit={createProfile}
          error={error}
          onRetry={fetchProfile}
          isEnglishCopy={isEnglishCopy}
          termsContent={termsContent}
          locale={locale}
        />
      );
  }

  // 未ログイン: /login 系はゲート対象外（そのまま子コンポーネントを表示）
  if (inAuthFlow) {
    return <>{children}</>;
  }

  // 未ログイン: それ以外は /login にリダイレクト（戻り先を付与）
  const redirect = encodeURIComponent(location.pathname + location.search + location.hash);
  return <Navigate to={`/login?redirect=${redirect}`} replace />;
};

export default AuthGate;

interface AccountModalProps {
  onSubmit: (nickname: string, agreed: boolean, country?: string) => Promise<void>;
  error: string | null;
  onRetry: () => Promise<void>;
  isEnglishCopy: boolean;
  termsContent: ReturnType<typeof getTermsContent>;
  locale: TermsLocale;
}

const AccountRegistrationModal: React.FC<AccountModalProps> = ({ onSubmit, error, onRetry, isEnglishCopy, termsContent, locale }) => {
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [country, setCountry] = useState<string>(() => localStorage.getItem('signup_country') || 'JP');
  const [submitting, setSubmitting] = useState(false);
  const countryLocale = locale === 'ja' ? 'ja' : 'en';
  const accountRegistrationHeading = isEnglishCopy ? 'Account Registration' : 'アカウント登録';
  const profileConfirmedHeading = isEnglishCopy ? 'Profile Confirmation' : 'プロフィール確認';
  const nicknamePlaceholder = isEnglishCopy ? 'Nickname (required)' : 'ニックネーム（必須）';
  const countryLabel = isEnglishCopy ? 'Country' : '国';
  const countryHelper = isEnglishCopy
    ? 'Choosing the wrong country may change available payment methods.'
    : '※ 国を誤って選ぶと支払い方法が変わります';
  const summaryUpdatedLabel = isEnglishCopy ? 'Last updated:' : '最終更新日:';
  const existingProfileButton = isEnglishCopy ? 'Start the game' : 'ゲームを開始';
  const registerButtonLabel = isEnglishCopy ? 'Create profile' : '登録して開始';
  const registeringLabel = isEnglishCopy ? 'Creating…' : '登録中...';
  const termsLinkLabel = termsContent.detailLinkLabel;
  const termsSummaryHeading = termsContent.summaryHeading;

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      return;
    }
    if (!agreed) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(nickname.trim(), agreed, country);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    await onRetry();
  };

  // 既存プロフィールエラーの場合の特別な表示
  const isExistingProfileError =
    error?.includes('既にプロフィールが登録されています') ||
    error?.toLowerCase().includes('profile already exists');

  return (
    <div className="w-full min-h-screen overflow-y-auto flex items-center justify-center bg-black/70 p-6">
      <div className="bg-slate-800 rounded-lg w-full max-w-md p-8 text-white space-y-6 my-auto">
          <h2 className="text-xl font-bold text-center">
            {isExistingProfileError ? profileConfirmedHeading : accountRegistrationHeading}
          </h2>
        
        {isExistingProfileError ? (
          <div className="space-y-4">
              <div className="bg-blue-900/50 p-4 rounded border-l-4 border-blue-400">
                <p className="text-blue-200 text-sm">{error}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
                >
                  {existingProfileButton}
                </button>
              </div>
          </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                  placeholder={nicknamePlaceholder}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-4 py-2 rounded bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <div className="space-y-2">
                  <label className="block text-sm">{countryLabel}</label>
                <select
                  className="select select-bordered w-full"
                  value={country}
                  onChange={e => {
                    setCountry(e.target.value);
                    localStorage.setItem('signup_country', e.target.value);
                  }}
                  disabled={submitting}
                >
                    {getSortedCountryCodes(countryLocale).map(c => (
                      <option key={c} value={c}>{getCountryLabel(c, countryLocale)}</option>
                  ))}
                </select>
                  <p className="text-xs text-orange-300">{countryHelper}</p>
              </div>
              <div className="border border-white/10 bg-slate-900/60 rounded-lg p-3 space-y-2">
                <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-white">{termsSummaryHeading}</p>
                    <span className="text-[10px] text-gray-400">{summaryUpdatedLabel} {termsContent.lastUpdated}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                    {termsContent.highlights.map(highlight => (
                    <li key={highlight} className="leading-relaxed">{highlight}</li>
                  ))}
                </ul>
                <p className="text-xs">
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">
                      {termsLinkLabel}
                  </a>
                </p>
              </div>
              <label className="flex items-start space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1"
                  disabled={submitting}
                />
                <span>
                    {isEnglishCopy ? 'I agree to the ' : ''}
                    <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">
                      {isEnglishCopy ? 'Terms of Service' : '利用規約'}
                    </a>
                    {isEnglishCopy ? ' and ' : ' と '}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-blue-300">
                      {isEnglishCopy ? 'Privacy Policy' : 'プライバシーポリシー'}
                    </a>
                    {isEnglishCopy ? '.' : ' に同意します'}
                </span>
              </label>
              {error && !isExistingProfileError && (
                <div className="bg-red-900/50 p-3 rounded border-l-4 border-red-400">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              <button
                disabled={!nickname.trim() || !agreed || submitting}
                onClick={handleSubmit}
                className={cn(
                  'w-full py-2 rounded font-semibold transition-colors flex items-center justify-center',
                  nickname.trim() && agreed && !submitting
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-500 cursor-not-allowed',
                )}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {registeringLabel}
                  </>
                ) : (
                    registerButtonLabel
                )}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}; 