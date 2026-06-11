import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { isIOSWebView } from '@/utils/iosbridge';
import PaymentIssueBanner from '@/components/ui/PaymentIssueBanner';
import GameHeader from '@/components/ui/GameHeader';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { hasNonExpiredBillingProvider } from '@/utils/membershipDisplay';

type PlanKey = 'free' | 'premium';

interface PlanColumn {
  key: PlanKey;
  name: string;
  price: string;
  priceSuffix: string;
  badge?: string;
  badgeClass?: string;
  headerClass?: string;
}

const PLANS: PlanColumn[] = [
  {
    key: 'free',
    name: 'Free',
    price: '¥0',
    priceSuffix: '',
    headerClass: 'bg-slate-800',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '¥3,980',
    priceSuffix: '/月（税込）',
    badge: 'おすすめ',
    badgeClass: 'bg-primary-500 text-white',
    headerClass: 'bg-slate-800 border-t-2 border-primary-500',
  },
];

interface FeatureRow {
  label: string;
  values: Record<PlanKey, string>;
}

interface Props {
  mode?: 'checkout' | 'view';
}

const PricingTable: React.FC<Props> = ({ mode = 'checkout' }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const [loading, setLoading] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  const localeCode = isEnglishCopy ? 'en' : 'ja';
  const { billingPayload } = useBillingAwareMembership(localeCode);
  const showAppleBillingNotice = hasNonExpiredBillingProvider(billingPayload, 'apple');

  const isIOS = isIOSWebView();

  const featureRows = useMemo((): FeatureRow[] => [
    {
      label: isEnglishCopy ? 'Community (diary, rankings)' : 'コミュニティ機能\n(日記・ランキング)',
      values: { free: '×', premium: '○' },
    },
    {
      label: isEnglishCopy ? 'Missions' : 'ミッション',
      values: { free: '×', premium: '○' },
    },
    {
      label: isEnglishCopy ? 'Fantasy mode' : 'ファンタジー',
      values: { free: '×', premium: '○' },
    },
    {
      label: isEnglishCopy ? 'Legend mode' : 'レジェンド',
      values: { free: '×', premium: isEnglishCopy ? 'Unlimited' : '無制限' },
    },
    {
      label: isEnglishCopy ? 'Survival (stage mode)' : 'サバイバル（ステージ）',
      values: {
        free: isEnglishCopy ? 'First tier per map (Basic & Songs)' : 'Basic / Songs 各マップの第一階層まで',
        premium: isEnglishCopy ? 'Unlimited' : '無制限',
      },
    },
    {
      label: isEnglishCopy ? 'Quests' : 'クエスト',
      values: {
        free: isEnglishCopy ? 'Main Quest chapter 1 only' : 'メインクエスト第1チャプターまで',
        premium: isEnglishCopy ? 'Unlimited' : '無制限',
      },
    },
  ], [isEnglishCopy]);

  if (isIOS) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <p>{isEnglishCopy
            ? 'To view or cancel your subscription, go to Settings → Apple ID → Subscriptions.'
            : 'サブスクリプションの確認・解約は、設定 → Apple ID → サブスクリプションから行えます。'}</p>
        </div>
      </div>
    );
  }

  if (showAppleBillingNotice) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-orange-400 text-lg font-bold mb-4">
            {isEnglishCopy
              ? 'Subscribed via iOS app'
              : 'iOS版で手続き済み'}
          </div>
          <p className="text-gray-400 mb-2">
            {isEnglishCopy
              ? 'Your subscription was purchased through the iOS app. Web billing is not available.'
              : 'iOS版でサブスクリプションの手続き済みのため、Web版での決済はご利用いただけません。'}
          </p>
          <p className="text-gray-500 text-sm">
            {isEnglishCopy
              ? 'To view or cancel your subscription, go to Settings → Apple ID → Subscriptions.'
              : 'サブスクリプションの確認・解約は、設定 → Apple ID → サブスクリプションから行えます。'}
          </p>
        </div>
      </div>
    );
  }

  const plans = PLANS.map(plan => ({
    ...plan,
    name:
      plan.key === 'free'
        ? (isEnglishCopy ? 'Free' : 'フリー')
        : (isEnglishCopy ? 'Premium' : 'プレミアム'),
    priceSuffix:
      plan.key === 'free'
        ? ''
        : (isEnglishCopy ? ' / month (tax included)' : '/月（税込）'),
    badge:
      plan.key === 'premium'
        ? (isEnglishCopy ? 'Recommended' : 'おすすめ')
        : null,
  }));

  const handlePlanSelect = async (plan: 'premium') => {
    if (!profile) {
      alert(isEnglishCopy ? 'You need to log in first.' : 'ログインが必要です');
      return;
    }

    if (profile.rank === 'free') {
      setShowPaywall(true);
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/.netlify/functions/lemonsqueezyResolveLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token || ''}`,
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json().catch(() => ({ error: isEnglishCopy ? 'Failed to open checkout' : 'チェックアウトの起動に失敗しました' }));
        alert(`Error: ${error.error}`);
      }
    } catch {
      alert(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
    } finally {
      setLoading(null);
    }
  };

  const renderCellValue = (value: string) => {
    if (value === '○') {
      return <span className="text-green-400 text-lg font-bold">○</span>;
    }
    if (value === '×') {
      return <span className="text-red-400 text-lg font-bold">×</span>;
    }
    return <span className="text-white text-sm font-medium leading-snug">{value}</span>;
  };

  const featureColTitle = isEnglishCopy ? 'Features' : '機能';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto">
        <PaymentIssueBanner />
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 pb-12">
          <div
            className="rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl"
            style={{ background: 'rgba(13,19,33,0.72)' }}
          >
            <div className="text-center px-6 pt-10 pb-6 border-b border-amber-500/10">
              <span
                className="inline-block px-4 py-1 rounded-full text-xs font-medium mb-4 border border-amber-400/40 text-amber-100/95 tracking-wide"
                style={{ background: 'rgba(200,162,77,0.12)' }}
              >
                {isEnglishCopy ? 'Plans' : 'プラン'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'rgb(248 250 252)' }}>
                {mode === 'checkout'
                  ? (isEnglishCopy ? 'Choose your plan' : 'プランを選択')
                  : (isEnglishCopy ? 'Plan comparison' : 'プラン比較')}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mb-2 max-w-xl mx-auto">
                {isEnglishCopy
                  ? 'Free members can play Main Quest chapter 1, browse stats, and view Survival maps (gameplay Premium-only).'
                  : 'フリー会員はメインクエスト第1チャプターまで・統計・サバイバル閲覧などをご利用いただけます。'}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                {isEnglishCopy
                  ? 'Eligible users get a 7-day free trial, then Premium is billed at ¥3,980/month or ¥34,800/year (tax included) via Lemon Squeezy.'
                  : '初回は7日間の無料トライアルのあと、月額3,980円（税込）または年額34,800円（税込）が Lemon Squeezy 経由で課金されます。'}
              </p>
            </div>

            <div className="px-4 sm:px-6 py-6 overflow-x-auto">
          <table className="w-full border-collapse min-w-[520px]">
            {/* プランヘッダー */}
            <thead>
              <tr>
                <th className="p-3 text-left bg-slate-900/90 border border-slate-700/80 min-w-[140px]">
                  <span className="text-slate-400 text-sm">{featureColTitle}</span>
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.key}
                    className={`p-4 text-center border border-slate-700/80 min-w-[130px] ${plan.headerClass}`}
                  >
                    {plan.badge && (
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2 ${plan.badgeClass}`}>
                        {plan.badge}
                      </span>
                    )}
                    <div className="text-lg font-semibold text-white">{plan.name}</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {plan.price}
                      {plan.priceSuffix && (
                        <span className="text-xs text-gray-400 font-normal">{plan.priceSuffix}</span>
                      )}
                    </div>
                    {plan.key === 'premium' && (
                      <div className="text-xs text-amber-200/90 mt-1">
                        {isEnglishCopy
                          ? 'Or ¥34,800 / year (tax included)'
                          : '年額 ¥34,800（税込）も選べます'}
                      </div>
                    )}
                    {plan.key !== 'free' && (
                      <div className="text-xs text-amber-200/90 mt-1">
                        {isEnglishCopy ? '7-day free trial when eligible' : '初回7日間無料トライアル'}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* 機能行 */}
            <tbody>
              {featureRows.map((feature, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-800/30'}>
                  <td className="p-3 border border-slate-700 text-sm text-gray-300 font-medium whitespace-pre-line">
                    {feature.label}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.key}
                      className="p-3 border border-slate-700 text-center"
                    >
                      {renderCellValue(feature.values[plan.key])}
                    </td>
                  ))}
                </tr>
              ))}

              {/* 選択ボタン行 */}
              {mode === 'checkout' && (
                <tr>
                  <td className="p-3 border border-slate-700/80 bg-slate-900/90" />
                  {PLANS.map((plan) => (
                    <td key={plan.key} className="p-4 border border-slate-700/80 text-center bg-slate-900/90">
                      {plan.key === 'free' ? (
                        <button type="button" className="btn btn-outline btn-sm w-full opacity-60" disabled>
                          {isEnglishCopy ? 'Current plan' : '現在のプラン'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm w-full rounded-full"
                          onClick={() => void handlePlanSelect(plan.key as 'premium')}
                          disabled={loading === plan.key}
                        >
                          {loading === plan.key
                            ? (isEnglishCopy ? 'Processing...' : '処理中...')
                            : (isEnglishCopy ? 'Select' : '選択する')}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
            </div>

            {mode === 'view' && (
              <div className="text-center px-6 pb-8">
                <button
                  type="button"
                  className="btn btn-outline border-slate-500"
                  onClick={() => { window.history.back(); }}
                >
                  {isEnglishCopy ? 'Back' : '戻る'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <WebPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        isEnglishCopy={isEnglishCopy}
      />
    </div>
  );
};

export default PricingTable;
