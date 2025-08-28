import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';

// オープンベータ用の簡易プラン変更UI
// 注意: Stripe を介さず Supabase の profiles.rank を直接更新します
type Rank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum';

const OpenBetaPlanSwitcher: React.FC = () => {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [updating, setUpdating] = useState(false);
  const [selected, setSelected] = useState<Rank>(profile?.rank || 'free');

  const isRank = (value: string): value is Rank => (
    value === 'free' ||
    value === 'standard' ||
    value === 'standard_global' ||
    value === 'premium' ||
    value === 'platinum'
  );

  const availablePlans = useMemo((): Array<{ value: Rank; label: string }> => {
    const isJapan = (profile?.country || '').toUpperCase() === 'JP' || (profile?.country || '').toLowerCase() === 'japan';
    if (isJapan) {
      return [
        { value: 'free', label: 'フリー' },
        { value: 'standard', label: 'スタンダード' },
        { value: 'premium', label: 'プレミアム' },
        { value: 'platinum', label: 'プラチナ' },
      ];
    }
    return [
      { value: 'free', label: 'フリー' },
      { value: 'standard_global', label: 'スタンダード（グローバル）' },
    ];
  }, [profile?.country]);

  // プロフィールのrankが変わったらセレクトを同期
  useEffect(() => {
    if (profile?.rank && isRank(profile.rank)) {
      setSelected(profile.rank);
    }
  }, [profile?.rank]);

  const applyPlan = async () => {
    if (!profile?.id) return;
    if (!availablePlans.some(p => p.value === selected)) {
      toast.error('選択したプランは利用できません');
      return;
    }

    setUpdating(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({ rank: selected })
        .eq('id', profile.id);

      if (error) {
        throw new Error(error.message);
      }

      // 楽観的更新で即時反映
      useAuthStore.setState(state => {
        if (state.profile) {
          state.profile = { ...state.profile, rank: selected };
        }
      });

      // キャッシュ無効化して最新を取得
      await useAuthStore.getState().fetchProfile({ forceRefresh: true });
      toast.success('プランを更新しました');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`プランの更新に失敗しました: ${message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">オープンベータ: プラン変更</h3>
        {profile?.rank && (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300">
            現在: {profile.rank}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="openbeta-plan" className="text-sm text-gray-300">プランを選択</label>
        <select
          id="openbeta-plan"
          className="w-full p-2 rounded bg-slate-700 text-sm"
          value={selected}
          onChange={(e) => {
            const value = e.target.value;
            if (isRank(value)) {
              setSelected(value);
            }
          }}
          disabled={updating}
        >
          {availablePlans.map(plan => (
            <option key={plan.value} value={plan.value}>{plan.label}</option>
          ))}
        </select>
        <button
          className="btn btn-sm btn-primary mt-2"
          onClick={applyPlan}
          disabled={updating || !selected}
        >
          {updating ? '更新中…' : 'このプランに変更'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          本UIはオープンベータ用です。決済なしで一時的にプランを切り替えます。
        </p>
      </div>
    </div>
  );
};

export default OpenBetaPlanSwitcher;