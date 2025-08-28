import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';

/**
 * Standard(Global) 用のPaddle購入/管理UI
 * - 月額 $9.9（税別）
 * - 年間プランなし
 * - 非日本ユーザー向け
 */
const GlobalPlan: React.FC = () => {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState<'buy' | 'downgrade' | null>(null);

  const isJapan = useMemo(() => {
    const country = (profile?.country || '').trim();
    return country.toUpperCase() === 'JP' || country.toLowerCase() === 'japan';
  }, [profile?.country]);

  if (!profile || isJapan) return null;

  const handleBuy = async () => {
    if (!useAuthStore.getState().session?.access_token) {
      toast.error('ログインが必要です');
      return;
    }
    setLoading('buy');
    try {
      const res = await fetch('/.netlify/functions/paddleCreateCheckout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token || ''}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'エラーが発生しました' }));
        toast.error(err.error || '購入リンクの生成に失敗しました');
        return;
      }
      const data: { url: string } = await res.json();
      if (!data.url) {
        toast.error('購入リンクを取得できませんでした');
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error('購入リンクの生成に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const handleDowngradeNow = async () => {
    if (!useAuthStore.getState().session?.access_token) {
      toast.error('ログインが必要です');
      return;
    }
    setLoading('downgrade');
    try {
      const res = await fetch('/.netlify/functions/paddleDowngradeNow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().session?.access_token || ''}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'エラーが発生しました' }));
        toast.error(err.error || 'ダウングレードに失敗しました');
        return;
      }
      await useAuthStore.getState().fetchProfile({ forceRefresh: true });
      toast.success('Freeプランに即時ダウングレードしました');
    } catch {
      toast.error('ダウングレードに失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const isGlobalStandard = profile.rank === 'standard_global';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Standard (Global)</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300">
          {isGlobalStandard ? '現在のプラン: Standard(Global)' : '非日本ユーザー向け'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-gray-300 text-sm">
          <div className="text-white text-xl font-bold">$9.9 / 月</div>
          <div className="text-xs text-gray-400">税別・年払いなし・Paddleにより税制対応</div>
        </div>

        <div className="flex gap-2">
          {!isGlobalStandard && (
            <button
              className="btn btn-sm btn-primary"
              onClick={handleBuy}
              disabled={loading === 'buy'}
            >
              {loading === 'buy' ? '処理中…' : 'Paddleで購入'}
            </button>
          )}

          {isGlobalStandard && (
            <button
              className="btn btn-sm btn-outline"
              onClick={handleDowngradeNow}
              disabled={loading === 'downgrade'}
              title="即時にFreeへ変更します"
            >
              {loading === 'downgrade' ? '処理中…' : '今すぐFreeにダウングレード'}
            </button>
          )}
        </div>
      </div>

      {isGlobalStandard && (import.meta.env.VITE_PADDLE_CUSTOMER_PORTAL_URL ? (
        <div className="mt-2 text-right">
          <a
            href={import.meta.env.VITE_PADDLE_CUSTOMER_PORTAL_URL as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 underline"
          >
            Paddleカスタマーポータルを開く
          </a>
        </div>
      ) : null)}
    </div>
  );
};

export default GlobalPlan;

