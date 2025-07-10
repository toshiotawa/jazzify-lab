import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import AuthLanding from '@/components/auth/AuthLanding';
import { cn } from '@/utils/cn';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * ログインが必要な領域をラップするゲート。
 * - ローディング中はスピナー
 * - 未ログインなら Magic Link 入力 UI
 * - ゲストプレイボタンも提供
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading, init, error, isGuest, hasProfile, createProfile } = useAuthStore();

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white text-xl">
        Loading...
      </div>
    );
  }

  // ログイン済みでプロフィールがある
  if (isGuest || (user && hasProfile)) {
    return <>{children}</>;
  }

  // ログイン済みだがプロフィール未作成 -> モーダル
  if (user && !hasProfile) {
    return (
      <AccountRegistrationModal onSubmit={createProfile} error={error} />
    );
  }

  // 未ログイン・ゲストでもない場合は AuthLanding を表示（#login と同デザイン）
  return <AuthLanding />;
};

export default AuthGate;

interface AccountModalProps {
  onSubmit: (nickname: string, agreed: boolean) => Promise<void>;
  error: string | null;
}

const AccountRegistrationModal: React.FC<AccountModalProps> = ({ onSubmit, error }) => {
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black/70 p-6">
      <div className="bg-slate-800 rounded-lg w-full max-w-md p-8 text-white space-y-6">
        <h2 className="text-xl font-bold text-center">アカウント登録</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="ニックネーム"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full px-4 py-2 rounded bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span>
              <a href="/terms" target="_blank" className="underline">利用規約</a> と <a href="/privacy" target="_blank" className="underline">プライバシーポリシー</a> に同意します
            </span>
          </label>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            disabled={!nickname || !agreed || submitting}
            onClick={async () => {
              setSubmitting(true);
              await onSubmit(nickname, agreed);
              setSubmitting(false);
            }}
            className={cn(
              'w-full py-2 rounded font-semibold',
              nickname && agreed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed',
            )}
          >
            登録して開始
          </button>
        </div>
      </div>
    </div>
  );
}; 