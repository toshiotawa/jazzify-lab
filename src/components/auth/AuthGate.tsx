import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import AuthLanding from '@/components/auth/AuthLanding';
import { cn } from '@/utils/cn';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * ログインが必要な領域をラップするゲート。
 * - ローディング中はスピナー
 * - 未ログインなら 認証コード入力 UI
 * - ゲストプレイボタンも提供
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading, error, isGuest, hasProfile, createProfile, fetchProfile } = useAuthStore();

  // ローディング中
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white text-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // エラーがある場合は表示
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
        <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h2 className="text-xl font-bold text-red-400 mb-4">認証エラー</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // デバッグ情報を出力
  console.log('🔍 AuthGate: 状態確認', { 
    user: !!user, 
    isGuest, 
    hasProfile, 
    loading, 
    error,
    userId: user?.id,
    userEmail: user?.email
  });

  // ログイン済みでプロフィールがある、またはゲストモード
  if (isGuest || (user && hasProfile)) {
    console.log('✅ AuthGate: 正常アクセス許可');
    return <>{children}</>;
  }

  // ログイン済みだがプロフィール未作成 -> モーダル
  if (user && !hasProfile) {
    console.log('⚠️ AuthGate: プロフィール未作成 - アカウント登録モーダル表示');
    return (
      <AccountRegistrationModal 
        onSubmit={createProfile} 
        error={error}
        onRetry={fetchProfile}
      />
    );
  }

  // 未ログイン・ゲストでもない場合は AuthLanding を表示（#login と同デザイン）
  return <AuthLanding mode="login" />;
};

export default AuthGate;

interface AccountModalProps {
  onSubmit: (nickname: string, agreed: boolean) => Promise<void>;
  error: string | null;
  onRetry: () => Promise<void>;
}

const AccountRegistrationModal: React.FC<AccountModalProps> = ({ onSubmit, error, onRetry }) => {
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      return;
    }
    if (!agreed) {
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit(nickname.trim(), agreed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    await onRetry();
  };

  // 既存プロフィールエラーの場合の特別な表示
  const isExistingProfileError = error?.includes('既にプロフィールが登録されています');

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black/70 p-6">
      <div className="bg-slate-800 rounded-lg w-full max-w-md p-8 text-white space-y-6">
        <h2 className="text-xl font-bold text-center">
          {isExistingProfileError ? 'プロフィール確認' : 'アカウント登録'}
        </h2>
        
        {isExistingProfileError ? (
          <div className="space-y-4">
            <div className="bg-blue-900/50 p-4 rounded border-l-4 border-blue-400">
              <p className="text-blue-200 text-sm">{error}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
              >
                ゲームを開始
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="ニックネーム（必須）"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-2 rounded bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
            <label className="flex items-start space-x-2 text-sm">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1"
                disabled={submitting}
              />
              <span>
                <a href="/terms" target="_blank" className="underline text-blue-300">利用規約</a> と <a href="/privacy" target="_blank" className="underline text-blue-300">プライバシーポリシー</a> に同意します
              </span>
            </label>
            {error && !isExistingProfileError && (
              <div className="bg-red-900/50 p-3 rounded border-l-4 border-red-400">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            <button
              disabled={!nickname.trim() || !agreed || submitting}
              onClick={handleSubmit}
              className={cn(
                'w-full py-2 rounded font-semibold transition-colors flex items-center justify-center',
                nickname.trim() && agreed && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-500 cursor-not-allowed',
              )}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登録中...
                </>
              ) : (
                '登録して開始'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 