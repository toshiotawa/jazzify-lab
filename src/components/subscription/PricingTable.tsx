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

const PricingTable: React.FC = () => {
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
        window.location.href = url; // Stripe Checkoutにリダイレクト
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

  return (
    <div className="w-full h-full overflow-auto">
      <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">プランを選択</h2>
        <p className="text-gray-300 mb-6">
          Jazz Learning Gameのプレミアム機能をご利用ください
        </p>
        <p className="text-gray-400 text-xs">
          ※ Standard(Global) は海外向けの限定機能プランです（本画面からの購入対象外）。
        </p>

        {/* 7日間無料トライアル */}
        <div className="text-sm text-green-400">すべての有料プランに7日間（1週間）無料トライアル</div>
      </div>

        {/* カスタムプラン表示 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {/* フリープラン */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">フリー</h3>
            <div className="text-3xl font-bold text-white mb-4">¥0</div>
            <p className="text-gray-400 text-sm mb-6">基本機能のみ</p>
            <button 
              className="btn btn-outline w-full"
              disabled
            >
              現在のプラン
            </button>
          </div>
        </div>

        {/* スタンダードプラン */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">スタンダード</h3>
            <div className="text-3xl font-bold text-white mb-1">¥1,980</div>
            <div className="text-sm text-gray-400 mb-2">月額</div>
            <div className="text-sm text-green-400 mb-4">7日間無料トライアル</div>
            <button 
              className="btn btn-primary w-full"
              onClick={() => handlePlanSelect('standard')}
              disabled={loading === 'standard'}
            >
              {loading === 'standard' ? '処理中...' : '選択する'}
            </button>
          </div>
        </div>

        {/* プレミアムプラン */}
        <div className="bg-slate-800 rounded-lg p-6 border border-primary-500 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              おすすめ
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">プレミアム</h3>
            <div className="text-3xl font-bold text-white mb-1">¥8,980</div>
            <div className="text-sm text-gray-400 mb-2">月額</div>
            <div className="text-sm text-green-400 mb-4">7日間無料トライアル</div>
            <button 
              className="btn btn-primary w-full"
              onClick={() => handlePlanSelect('premium')}
              disabled={loading === 'premium'}
            >
              {loading === 'premium' ? '処理中...' : '選択する'}
            </button>
          </div>
        </div>

          {/* プラチナプラン */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">プラチナ</h3>
            <div className="text-3xl font-bold text-white mb-1">¥14,800</div>
            <div className="text-sm text-gray-400 mb-2">月額</div>
            <div className="text-sm text-green-400 mb-4">7日間無料トライアル</div>
            <button 
              className="btn btn-primary w-full"
              onClick={() => handlePlanSelect('platinum')}
              disabled={loading === 'platinum'}
            >
              {loading === 'platinum' ? '処理中...' : '選択する'}
            </button>
          </div>
        </div>

          {/* ブラックプラン */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-black rounded-lg p-6 border border-slate-600 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-slate-200 text-black px-3 py-1 rounded-full text-xs font-medium">
                最上位
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">ブラック</h3>
              <div className="text-3xl font-bold text-white mb-1">¥19,800</div>
              <div className="text-sm text-gray-400 mb-2">月額</div>
              <div className="text-sm text-green-400 mb-4">7日間無料トライアル</div>
              <ul className="space-y-3 text-sm text-gray-300 mb-6 text-left">
                <li><i className="fas fa-check text-green-400 mr-2"></i>全機能（無制限）</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>個人レッスン（月2回）</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>エグゼクティブコンシェルジュ</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>楽譜ダウンロード</li>
                <li><i className="fas fa-check text-green-400 mr-2"></i>ブラックデスク（最優先サポート）</li>
              </ul>
              <button 
                className="btn btn-primary w-full"
                onClick={() => handlePlanSelect('black')}
                disabled={loading === 'black'}
              >
                {loading === 'black' ? '処理中...' : '選択する'}
              </button>
            </div>
          </div>
      </div>

      </div>
    </div>
  );
};

export default PricingTable;