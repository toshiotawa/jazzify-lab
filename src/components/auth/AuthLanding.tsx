import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';

const AuthLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { loginWithMagicLink, enterGuestMode, loading, error } = useAuthStore();
  const toast = useToast();

  // 開発環境でのみデバッグ情報を表示
  useEffect(() => {
    if (import.meta.env.DEV) {
      setShowDebugInfo(true);
    }
  }, []);

  const handleSendLink = async (mode: 'signup' | 'login') => {
    // バリデーション
    if (!email.trim()) {
      return toast.error(getValidationMessage('メールアドレス', 'required'));
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error(getValidationMessage('メールアドレス', 'email'));
    }

    try {
      await loginWithMagicLink(email, mode);
      toast.success(
        `Magic Link を送信しました（${mode==='signup'?'会員登録':'ログイン'}）`,
        {
          title: 'メール送信完了',
          duration: 5000,
        }
      );
    } catch (err) {
      toast.error(handleApiError(err, 'Magic Link送信'));
    }
  };

  const handleGuest = () => {
    enterGuestMode();
    toast.info('ゲストモードで開始', {
      title: 'ゲスト開始',
      duration: 2000,
    });
    window.location.hash = '';
  };

  // リダイレクトURLの設定状況を確認
  const redirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL;
  const currentOrigin = typeof location !== 'undefined' ? location.origin : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Jazz Learning Game</h1>
        
        {/* デバッグ情報（開発環境のみ） */}
        {showDebugInfo && (
          <div className="bg-slate-700/60 p-4 rounded-lg text-xs space-y-2">
            <h3 className="font-bold text-yellow-400">🔧 デバッグ情報</h3>
            <div>
              <strong>環境変数 VITE_SUPABASE_REDIRECT_URL:</strong>
              <span className={redirectUrl ? 'text-green-400' : 'text-red-400'}>
                {redirectUrl || '未設定'}
              </span>
            </div>
            <div>
              <strong>現在のorigin:</strong>
              <span className="text-blue-400">{currentOrigin}</span>
            </div>
            <div>
              <strong>使用されるリダイレクトURL:</strong>
              <span className="text-purple-400">
                {redirectUrl || currentOrigin}
              </span>
            </div>
            {!redirectUrl && (
              <div className="text-orange-400">
                ⚠️ 環境変数が未設定のため、現在のoriginを使用します
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-800/60 p-6 rounded-lg space-y-4">
          <div>
            <label className="block text-sm mb-1">メールアドレスでログイン / 登録</label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-primary flex-1" disabled={loading} onClick={()=>{void handleSendLink('signup')}}>
              会員登録
            </button>
            <button className="btn btn-outline flex-1" disabled={loading} onClick={()=>{void handleSendLink('login')}}>
              ログイン
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="text-center text-xs text-gray-400">リンクを開くと自動でログインします</div>
          
          {/* トラブルシューティング情報 */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <div>Magic Linkが届かない場合:</div>
            <div>1. スパムフォルダを確認</div>
            <div>2. メールアドレスを再確認</div>
            <div>3. 数分待ってから再試行</div>
          </div>
        </div>

        <div className="text-center">
          <button className="btn btn-secondary" onClick={handleGuest}>おためしプレイ</button>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding; 