import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast, handleApiError } from '@/stores/toastStore';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthLandingProps {
  mode: 'signup' | 'login';
}

const AuthLanding: React.FC<AuthLandingProps> = ({ mode }) => {
  const { sendOtp, enterGuestMode, loading, error, user, isGuest } = useAuthStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [signupDisabled, setSignupDisabled] = useState(false);
  // 国選択はOTP後のプロフィール作成段階へ移動
  const navigate = useNavigate();
  const location = useLocation();

  // ログイン画面にいるときは、既にログイン済みならダッシュボードへ即リダイレクト
  useEffect(() => {
    if (mode === 'login' && user && !isGuest) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [mode, user, isGuest, navigate]);

  // 地理情報の事前取得や国のローカル保存は行わない

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSignupDisabled(false);

    try {
      await sendOtp(email, mode);
      toast.success(
        mode === 'signup'
          ? '認証コードを送信しました（会員登録）'
          : '認証コードを送信しました（ログイン）',
        {
          title: '認証コード送信',
          duration: 5000,
        }
      );

      // 現在のURLからredirectパラメータを引き継ぐ
      const currentParams = new URLSearchParams(location.search);
      const redirect = currentParams.get('redirect') || '';
      const params = new URLSearchParams({ email, mode });
      if (redirect) params.set('redirect', redirect);

      navigate(`/login/verify-otp?${params.toString()}`, { replace: true });
    } catch (err) {
      console.error('認証コード送信エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '認証コード送信に失敗しました';

      if (errorMessage.includes('Signups not allowed') || errorMessage.includes('signups not allowed')) {
        setSignupDisabled(true);
      }

      toast.error(handleApiError(err, '認証コード送信'));
    }
  };

  const handleGuest = () => {
    enterGuestMode();
    navigate('/main#dashboard');
  };

  if (user && !isGuest) {
    // モードがloginであれば上のuseEffectでリダイレクト済み。signupの場合のみ表示。
    if (mode === 'signup') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white">
          <div className="text-center">
            <h1 className="text-2xl mb-4">既にログインしています</h1>
            <a href="/main#dashboard" className="btn btn-primary">ダッシュボードへ</a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-900 to-black text-white">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-8">
          {/* タブ切り替え */}
          <div className="flex justify-center">
            <div role="tablist" aria-label="認証切替" className="tabs tabs-boxed bg-transparent">
              <button
                role="tab"
                aria-selected={mode === 'signup'}
                className={`tab ${mode === 'signup' ? 'tab-active' : ''}`}
                onClick={() => navigate('/signup')}
              >
                会員登録
              </button>
              <button
                role="tab"
                aria-selected={mode === 'login'}
                className={`tab ${mode === 'login' ? 'tab-active' : ''}`}
                onClick={() => navigate('/login')}
              >
                ログイン
              </button>
            </div>
          </div>
          <div className="text-center"><h2 className="text-xl mb-6">{mode === 'signup' ? '会員登録' : 'ログイン'}</h2></div>

          <div className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 国選択はOTP後(ProfileWizard)に移動 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn btn-primary"
              >
                {loading ? '送信中...' : '認証コードを送信'}
              </button>
            </form>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {signupDisabled && (
              <div className="bg-orange-900/30 border border-orange-500/50 rounded p-3 text-sm">
                <div className="font-semibold text-orange-300 mb-1">⚠️ サインアップ無効</div>
                <div className="text-orange-200 text-xs">
                  現在サインアップが無効になっています。<br />
                  既存のアカウントでログインしてください。
                </div>
              </div>
            )}
            <div className="text-center text-xs text-gray-400">
              認証コードは6桁の数字で送信されます
            </div>
            
            {/* トラブルシューティング情報 */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <div>認証コードが届かない場合:</div>
              <div>1. スパムフォルダを確認</div>
              <div>2. メールアドレスを再確認</div>
              <div>3. 数分待ってから再試行</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button className="btn btn-secondary" onClick={handleGuest}>おためしプレイ</button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>トップに戻る</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding; 