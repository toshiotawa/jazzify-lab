import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
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
  const { user, loading, init, loginWithMagicLink, error, isGuest, enterGuestMode, hasProfile, createProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);

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

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg max-w-md w-full p-8 text-white space-y-6">
        <h2 className="text-2xl font-bold text-center">Jazz Learning Game</h2>
        {!linkSent ? (
          <>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                disabled={!email}
                onClick={async () => {
                  await loginWithMagicLink(email);
                  setLinkSent(true);
                }}
                className={cn(
                  'w-full py-2 rounded font-semibold',
                  email ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed',
                )}
              >
                Magic Link を送信
              </button>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
            <div className="text-center">
              <button
                onClick={() => enterGuestMode()}
                className="text-sm underline text-gray-300 hover:text-white"
              >
                ログインせずおためしプレイ
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-lg">入力したメールアドレスにリンクを送信しました。</p>
            <p className="text-sm text-gray-300">メールを開いて認証を完了してください。</p>
            <button
              onClick={() => setLinkSent(false)}
              className="underline text-gray-300 hover:text-white text-sm"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
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