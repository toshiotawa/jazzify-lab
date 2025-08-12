import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import PricingTable from '@/components/subscription/PricingTable';

// Simple helper to detect Japan regardless of format
function isJapanCountry(country?: string | null): boolean {
  if (!country) return false;
  const c = country.trim().toUpperCase();
  return c === 'JP' || c === 'JPN' || c === 'JAPAN' || c === 'JA' || c === '日本' || c === 'ニホン' || c === 'ニッポン';
}

const OpenBetaPlanChange: React.FC = () => {
  const { profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const isJapan = useMemo(() => isJapanCountry(profile?.country || undefined), [profile?.country]);
  const currentRank = profile?.rank || 'free';

  const setRankDirect = async (rank: 'free' | 'standard_global') => {
    if (!profile) return;
    try {
      setLoading(rank);
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('profiles').update({ rank }).eq('id', profile.id);
      if (error) throw error;
      await fetchProfile();
      alert(`プランを「${rank}」に変更しました`);
    } catch (e: any) {
      console.error('Failed to change plan:', e);
      alert('プラン変更に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">オープンベータ: プラン選択</h2>
        <p className="text-sm text-gray-300 mb-6">
          現在はオープンベータ期間です。お住まいの国によって選択できるプランが異なります。
        </p>

        {isJapan ? (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded p-4">
              <h3 className="font-semibold text-white mb-1">日本のユーザー向け</h3>
              <p className="text-xs text-gray-300 mb-3">選択可能なプラン: Free / Standard / Premium / Platinum</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={currentRank === 'free' || loading === 'free'}
                  onClick={() => setRankDirect('free')}
                >
                  {loading === 'free' ? '処理中...' : currentRank === 'free' ? '現在のプラン' : 'Freeにする'}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowPricing(true)}
                >
                  Standard / Premium / Platinum を選ぶ
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                有料プランは以下の決済UI（Stripe）からお選びいただけます。
              </p>
              {showPricing && (
                <div className="mt-4">
                  <PricingTable />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded p-4">
              <h3 className="font-semibold text-white mb-1">海外のユーザー向け</h3>
              <p className="text-xs text-gray-300 mb-3">選択可能なプラン: Free / Standard(Global)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className="btn btn-sm btn-outline"
                  disabled={currentRank === 'free' || loading === 'free'}
                  onClick={() => setRankDirect('free')}
                >
                  {loading === 'free' ? '処理中...' : currentRank === 'free' ? '現在のプラン' : 'Freeにする'}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={currentRank === 'standard_global' || loading === 'standard_global'}
                  onClick={() => setRankDirect('standard_global')}
                >
                  {loading === 'standard_global' ? '処理中...' : currentRank === 'standard_global' ? '現在のプラン' : 'Standard(Global)にする'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                Standard(Global) は海外向けの限定機能プランです。
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          <ul className="list-disc pl-5 space-y-1">
            <li>プラン変更後、反映まで数秒かかることがあります。</li>
            <li>決済が必要なプランはこの画面内で完結します。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OpenBetaPlanChange;