import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Stripe Pricing Table用の型定義（グローバル宣言）
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': {
        'pricing-table-id': string;
        'publishable-key': string;
        'customer-email'?: string;
      };
    }
  }
}

interface PlanPrice {
  monthly: string;
}

const PLAN_PRICES: Record<string, PlanPrice> = {
  standard: {
    monthly: import.meta.env.VITE_STRIPE_STANDARD_MONTHLY_PRICE_ID || '',
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
  },
  platinum: {
    monthly: import.meta.env.VITE_STRIPE_PLATINUM_MONTHLY_PRICE_ID || '',
  },
};

const PricingTable: React.FC = () => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  // Stripe Pricing Tableスクリプトを動的に読み込み
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // クリーンアップ
      const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handlePlanSelect = async (plan: 'standard' | 'premium' | 'platinum') => {
    if (!profile) {
      alert('ログインが必要です');
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

        {/* 14日間無料トライアル */}
        <div className="text-sm text-green-400">すべての有料プランに14日間無料トライアル</div>
      </div>

      {/* カスタムプラン表示 */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
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
            <div className="text-sm text-green-400 mb-4">14日間無料トライアル</div>
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
            <div className="text-sm text-green-400 mb-4">14日間無料トライアル</div>
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
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 md:col-start-2">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">プラチナ</h3>
            <div className="text-3xl font-bold text-white mb-1">¥14,800</div>
            <div className="text-sm text-gray-400 mb-2">月額</div>
            <div className="text-sm text-green-400 mb-4">14日間無料トライアル</div>
            <button 
              className="btn btn-primary w-full"
              onClick={() => handlePlanSelect('platinum')}
              disabled={loading === 'platinum'}
            >
              {loading === 'platinum' ? '処理中...' : '選択する'}
            </button>
          </div>
        </div>
      </div>

      {/* Stripe Pricing Table（代替案）*/}
      {import.meta.env.VITE_STRIPE_PRICING_TABLE_ID && (
        <div className="border-t border-slate-700 pt-8">
          <h3 className="text-xl font-semibold text-white text-center mb-6">
            または Stripe Pricing Table
          </h3>
          <stripe-pricing-table
            pricing-table-id={import.meta.env.VITE_STRIPE_PRICING_TABLE_ID as string}
            publishable-key={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string}
            customer-email={profile?.email}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default PricingTable;