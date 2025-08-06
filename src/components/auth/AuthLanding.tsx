import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';
import { 
  getMagicLinkConfig, 
  validateMagicLinkConfig, 
  diagnoseMagicLinkIssues,
  parseMagicLinkFromUrl 
} from '@/utils/magicLinkConfig';

const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [useOtp, setUseOtp] = useState(false); // OTPモードの切り替え
  const { loginWithMagicLink, enterGuestMode, loading, error, user, isGuest } = useAuthStore();
  const toast = useToast();

  // 開発環境でのみデバッグ情報を表示
  useEffect(() => {
    if (import.meta.env.DEV) {
      setShowDebugInfo(true);
    }
  }, []);

  // ログイン済みユーザーをリダイレクト
  useEffect(() => {
    console.log('🔍 AuthLanding: リダイレクトチェック', {
      user: !!user,
      userEmail: user?.email,
      isGuest,
      shouldRedirect: user && !isGuest
    });
    
    // ユーザーがログイン済みで、かつゲストモードでない場合のみリダイレクト
    if (user && !isGuest) {
      console.log('🔄 ログイン済みユーザーを /main へリダイレクト', {
        user: user?.email,
        isGuest
      });
      navigate('/main', { replace: true });
    }
  }, [user, isGuest, navigate]);



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
      await loginWithMagicLink(email, mode, useOtp);
      
      if (useOtp) {
        // OTPモードの場合、新しいページにリダイレクト
        toast.success('認証コードを送信しました。メールをご確認ください。', {
          title: 'コード送信完了',
          duration: 5000,
        });
        navigate(`/login/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        // マジックリンクモードの場合
        const successMessage = mode === 'signup' 
          ? 'Magic Link を送信しました（会員登録）'
          : 'Magic Link を送信しました（ログイン）';
          
        toast.success(successMessage, {
          title: 'メール送信完了',
          duration: 5000,
        });
      }
    } catch (err) {
      // エラーメッセージを適切に処理
      const errorMessage = err instanceof Error ? err.message : 'Magic Link送信に失敗しました';
      
      if (errorMessage.includes('サインアップが無効')) {
        setSignupDisabled(true);
        toast.error('現在サインアップが無効になっています。既存のアカウントでログインしてください。', {
          title: 'サインアップ無効',
          duration: 8000,
        });
      } else {
        toast.error(handleApiError(err, 'Magic Link送信'));
      }
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
  
  // マジックリンク設定の詳細情報を取得
  const magicLinkConfig = getMagicLinkConfig();
  const validation = validateMagicLinkConfig();
  const diagnosis = diagnoseMagicLinkIssues();
  const urlMagicLinkInfo = parseMagicLinkFromUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Jazz Learning Game</h1>
        
        {/* デバッグ情報（開発環境のみ） */}
        {showDebugInfo && (
          <div className="bg-slate-700/60 p-4 rounded-lg text-xs space-y-2">
            <h3 className="font-bold text-yellow-400">🔧 デバッグ情報</h3>
            
            {/* 基本設定情報 */}
            <div className="space-y-1">
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
            </div>
            
            {/* 設定検証結果 */}
            <div className="space-y-1">
              <div>
                <strong>設定検証:</strong>
                <span className={validation.isValid ? 'text-green-400' : 'text-red-400'}>
                  {validation.isValid ? '✅ 正常' : '❌ 問題あり'}
                </span>
              </div>
              {validation.issues.length > 0 && (
                <div className="text-red-400">
                  <strong>問題点:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {validation.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* URLマジックリンク情報 */}
            {urlMagicLinkInfo.hasMagicLink && (
              <div className="space-y-1">
                <div className="text-green-400 font-bold">🎯 URLにマジックリンク検出</div>
                <div>
                  <strong>アクセストークン:</strong>
                  <span className={urlMagicLinkInfo.accessToken ? 'text-green-400' : 'text-red-400'}>
                    {urlMagicLinkInfo.accessToken ? '存在' : 'なし'}
                  </span>
                </div>
                <div>
                  <strong>リフレッシュトークン:</strong>
                  <span className={urlMagicLinkInfo.refreshToken ? 'text-green-400' : 'text-red-400'}>
                    {urlMagicLinkInfo.refreshToken ? '存在' : 'なし'}
                  </span>
                </div>
                <div>
                  <strong>タイプ:</strong>
                  <span className="text-blue-400">{urlMagicLinkInfo.type || 'なし'}</span>
                </div>
                {urlMagicLinkInfo.error && (
                  <div className="text-red-400">
                    <strong>エラー:</strong> {urlMagicLinkInfo.error}
                  </div>
                )}
              </div>
            )}
            
            {!redirectUrl && (
              <div className="text-orange-400">
                ⚠️ 環境変数が未設定のため、現在のoriginを使用します
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-800/60 p-6 rounded-lg space-y-4">
          {/* OTPモード切り替えトグル */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm">認証方法</label>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${!useOtp ? 'text-blue-400' : 'text-gray-400'}`}>マジックリンク</span>
              <label className="swap swap-flip">
                <input 
                  type="checkbox" 
                  checked={useOtp} 
                  onChange={(e) => {
                    setUseOtp(e.target.checked);
                  }} 
                />
                <div className="swap-on">📱</div>
                <div className="swap-off">✉️</div>
              </label>
              <span className={`text-sm ${useOtp ? 'text-blue-400' : 'text-gray-400'}`}>認証コード</span>
            </div>
          </div>

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
            <button className="btn btn-primary flex-1" disabled={loading || signupDisabled} onClick={()=>{void handleSendLink('signup')}}>
              {useOtp ? '認証コードで登録' : 'マジックリンクで登録'}
            </button>
            <button className="btn btn-outline flex-1" disabled={loading} onClick={()=>{void handleSendLink('login')}}>
              {useOtp ? '認証コードでログイン' : 'マジックリンクでログイン'}
            </button>
          </div>
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
            {useOtp ? '認証コードは異なるデバイスでも使用できます' : 'リンクを開くと自動でログインします（同じブラウザでのみ有効）'}
          </div>
          
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