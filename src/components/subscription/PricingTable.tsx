import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface PlanPrice {
  monthly: string;
}

const PLAN_PRICES: Record<'standard' | 'premium' | 'platinum' | 'black', PlanPrice> = {
  standard: {
    monthly: import.meta.env.VITE_STRIPE_STANDARD_MONTHLY_PRICE_ID || '',
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
  },
  platinum: {
    monthly: import.meta.env.VITE_STRIPE_PLATINUM_MONTHLY_PRICE_ID || '',
  },
  black: {
    monthly: import.meta.env.VITE_STRIPE_BLACK_MONTHLY_PRICE_ID || '',
  },
};

type PlanKey = 'free' | 'standard' | 'premium' | 'platinum' | 'black';

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
    name: 'フリー',
    price: '¥0',
    priceSuffix: '',
    headerClass: 'bg-slate-800',
  },
  {
    key: 'standard',
    name: 'スタンダード',
    price: '¥2,980',
    priceSuffix: '/月',
    headerClass: 'bg-slate-800',
  },
  {
    key: 'premium',
    name: 'プレミアム',
    price: '¥8,980',
    priceSuffix: '/月',
    badge: 'おすすめ',
    badgeClass: 'bg-primary-500 text-white',
    headerClass: 'bg-slate-800 border-t-2 border-primary-500',
  },
  {
    key: 'platinum',
    name: 'プラチナ',
    price: '¥14,800',
    priceSuffix: '/月',
    headerClass: 'bg-slate-800',
  },
  {
    key: 'black',
    name: 'ブラック',
    price: '¥19,800',
    priceSuffix: '/月',
    badge: '最上位',
    badgeClass: 'bg-slate-200 text-black',
    headerClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-black',
  },
];

interface FeatureRow {
  label: string;
  values: Record<PlanKey, string>;
}

const FEATURES: FeatureRow[] = [
  {
    label: 'コミュニティ機能\n(日記・ランキング)',
    values: { free: '×', standard: '○', premium: '○', platinum: '○', black: '○' },
  },
  {
    label: 'ミッション',
    values: { free: '×', standard: '○', premium: '○', platinum: '○', black: '○' },
  },
  {
    label: 'ファンタジー',
    values: { free: '×', standard: '○', premium: '○', platinum: '○', black: '○' },
  },
  {
    label: 'レジェンド',
    values: { free: '×', standard: '5曲', premium: '無制限', platinum: '無制限', black: '無制限' },
  },
  {
    label: 'サバイバル',
    values: { free: '×', standard: '1キャラ', premium: '無制限', platinum: '無制限', black: '無制限' },
  },
  {
    label: 'レッスン',
    values: { free: '×', standard: '1コースのみ', premium: '無制限', platinum: '無制限', black: '無制限' },
  },
  {
    label: 'レッスンブロックの\n手動解放',
    values: { free: '×', standard: '×', premium: '無制限', platinum: '月10ブロック', black: '月10ブロック' },
  },
  {
    label: 'LINEでの課題添削',
    values: { free: '×', standard: '×', premium: '×', platinum: '×', black: '○' },
  },
];

interface Props {
  mode?: 'checkout' | 'view';
}

const PricingTable: React.FC<Props> = ({ mode = 'checkout' }) => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const normalizedCountry = profile?.country ? profile.country.trim().toUpperCase() : null;
  const isJapanUser =
    !normalizedCountry ||
    normalizedCountry === 'JP' ||
    normalizedCountry === 'JPN' ||
    normalizedCountry === 'JAPAN';

  const handlePlanSelect = async (plan: 'standard' | 'premium' | 'platinum' | 'black') => {
    if (!profile) {
      alert('ログインが必要です');
      return;
    }

    if (!isJapanUser) {
      if (plan !== 'standard') {
        alert('海外ユーザーはStandard(Global)プランをご利用ください。');
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
          const err = await response.json().catch(() => ({ error: 'グローバルプランの取得に失敗しました', details: '' }));
          const msg = [err.error, err.details].filter(Boolean).join(': ');
          alert(msg || 'エラーが発生しました');
        }
      } catch (error) {
        console.error('LemonSqueezy link error:', error);
        alert('エラーが発生しました');
      } finally {
        setLoading(null);
      }
      return;
    }

    const priceId = PLAN_PRICES[plan].monthly;
    if (!priceId) {
      alert('プラン情報が正しく設定されていません');
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/.netlify/functions/createCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token || ''}`,
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Checkout session error:', error);
      alert('エラーが発生しました');
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
            {mode === 'checkout' ? 'プランを選択' : 'プラン比較'}
          </h2>
          <p className="text-gray-300 mb-4">
            Jazz Learning Gameのプレミアム機能をご利用ください
          </p>
          {!isJapanUser && (
            <p className="text-sm text-yellow-400 mb-2">
              ※ Standard(Global) は海外向けの限定機能プランです（本画面からの購入対象外）。
            </p>
          )}
          <div className="text-sm text-green-400">すべての有料プランに7日間（1週間）無料トライアル</div>
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
                {PLANS.map((plan) => (
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
                      <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>
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
                  {PLANS.map((plan) => (
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
                          onClick={() => handlePlanSelect(plan.key as 'standard' | 'premium' | 'platinum' | 'black')}
                          disabled={loading === plan.key}
                        >
                          {loading === plan.key ? '処理中...' : '選択する'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingTable;
