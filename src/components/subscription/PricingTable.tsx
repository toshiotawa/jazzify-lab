import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { isIOSWebView } from '@/utils/iosbridge';

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
    price: '¥4,980',
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

const FEATURES: FeatureRow[] = [
  {
    label: 'コミュニティ機能\n(日記・ランキング)',
    values: { free: '×', premium: '○' },
  },
  {
    label: 'ミッション',
    values: { free: '×', premium: '○' },
  },
  {
    label: 'ファンタジー',
    values: { free: '×', premium: '○' },
  },
  {
    label: 'レジェンド',
    values: { free: '×', premium: '無制限' },
  },
  {
    label: 'サバイバル',
    values: { free: '×', premium: '無制限' },
  },
  {
    label: 'レッスン',
    values: { free: '×', premium: '無制限' },
  },
];

interface Props {
  mode?: 'checkout' | 'view';
}

const PricingTable: React.FC<Props> = ({ mode = 'checkout' }) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const [loading, setLoading] = useState<string | null>(null);
  const [billingProvider, setBillingProvider] = useState<string | null>(null);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });

  const isIOS = isIOSWebView();

  useEffect(() => {
    const checkBilling = async () => {
      try {
        const token = useAuthStore.getState().session?.access_token;
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
    checkBilling();
  }, []);

  if (isIOS) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <p>{isEnglishCopy
            ? 'Subscription management is available in the app settings.'
            : 'サブスクリプション管理はアプリの設定から行えます。'}</p>
        </div>
      </div>
    );
  }

  if (billingProvider === 'apple') {
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
              ? 'To manage your subscription, please use the iOS app settings.'
              : 'サブスクリプションの管理はiOSアプリの設定から行ってください。'}
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
    } catch (error) {
      console.error('LemonSqueezy checkout error:', error);
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
    return <span className="text-white text-sm font-medium">{value}</span>;
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            {mode === 'checkout'
              ? (isEnglishCopy ? 'Choose your plan' : 'プランを選択')
              : (isEnglishCopy ? 'Plan comparison' : 'プラン比較')}
          </h2>
          <p className="text-gray-300 mb-4">
            {isEnglishCopy
              ? 'Unlock all lessons and game modes with Premium.'
              : 'Premium で全レッスンと全ゲームモードを利用できます。'}
          </p>
          <p className="text-sm text-gray-500">
            {isEnglishCopy
              ? 'Eligible users get a 7-day free trial, then Premium is billed monthly via Lemon Squeezy (JPY; USD equivalent at checkout).'
              : '初回は7日間の無料トライアル（対象者あり）のあと、月額4,980円（税込）が Lemon Squeezy 経由で課金されます。'}
          </p>
        </div>

        {/* 比較テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* プランヘッダー */}
            <thead>
              <tr>
                <th className="p-3 text-left bg-slate-900 border border-slate-700 min-w-[140px]">
                  <span className="text-gray-400 text-sm">機能</span>
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.key}
                    className={`p-4 text-center border border-slate-700 min-w-[130px] ${plan.headerClass}`}
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
                    {plan.key !== 'free' && (
                      <div className="text-xs text-green-400 mt-1">
                        {isEnglishCopy ? '7-day free trial when eligible' : '初回7日間無料トライアル（対象者あり）'}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* 機能行 */}
            <tbody>
              {FEATURES.map((feature, idx) => (
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
                  <td className="p-3 border border-slate-700 bg-slate-900" />
                  {PLANS.map((plan) => (
                    <td key={plan.key} className="p-4 border border-slate-700 text-center bg-slate-900">
                      {plan.key === 'free' ? (
                        <button className="btn btn-outline btn-sm w-full opacity-60" disabled>
                          現在のプラン
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm w-full"
                          onClick={() => handlePlanSelect(plan.key as 'premium')}
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
          <div className="text-center mt-8">
            <button
              className="btn btn-outline"
              onClick={() => { window.history.back(); }}
            >
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingTable;
