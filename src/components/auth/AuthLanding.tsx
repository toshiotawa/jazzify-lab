import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';

const AuthLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [otpCode, setOtpCode] = useState(''); // OTPコード
  const [otpSent, setOtpSent] = useState(false); // OTP送信済みフラグ
  const { loginWithMagicLink, verifyOtp, enterGuestMode, loading, error } = useAuthStore();
  const toast = useToast();

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
      
      // OTPモードのみ使用
      setOtpSent(true);
      toast.success('認証コードを送信しました。メールをご確認ください。', {
        title: 'コード送信完了',
        duration: 5000,
      });
    } catch (err) {
      // エラーメッセージを適切に処理
      const errorMessage = err instanceof Error ? err.message : 'OTP送信に失敗しました';
      
      if (errorMessage.includes('サインアップが無効')) {
        setSignupDisabled(true);
        toast.error('現在サインアップが無効になっています。既存のアカウントでログインしてください。', {
          title: 'サインアップ無効',
          duration: 8000,
        });
      } else {
        toast.error(handleApiError(err, 'OTP送信'));
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      return toast.error('認証コードを入力してください');
    }
    
    if (otpCode.length !== 6) {
      return toast.error('認証コードは6桁で入力してください');
    }

    try {
      await verifyOtp(email, otpCode);
      toast.success('ログインに成功しました', {
        title: 'ログイン完了',
        duration: 3000,
      });
    } catch (err) {
      toast.error(handleApiError(err, 'OTP検証'));
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



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Jazz Learning Game</h1>
        


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
          {!otpSent ? (
            <>
              <div className="flex space-x-2">
                <button className="btn btn-primary flex-1" disabled={loading || signupDisabled} onClick={()=>{void handleSendLink('signup')}}>
                  会員登録
                </button>
                <button className="btn btn-outline flex-1" disabled={loading} onClick={()=>{void handleSendLink('login')}}>
                  ログイン
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-sm text-gray-300 mb-4">
                <p>{email} に6桁の認証コードを送信しました</p>
                <p className="text-xs text-gray-400 mt-1">メールが届かない場合は迷惑メールフォルダをご確認ください</p>
              </div>
              <div>
                <label className="block text-sm mb-1">認証コード（6桁）</label>
                <input
                  type="text"
                  className="input input-bordered w-full text-center text-2xl tracking-widest"
                  value={otpCode}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 6) {
                      setOtpCode(value);
                    }
                  }}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button 
                className="btn btn-primary w-full" 
                disabled={loading || otpCode.length !== 6} 
                onClick={()=>{void handleVerifyOtp()}}
              >
                認証する
              </button>
              <button 
                className="btn btn-ghost btn-sm w-full" 
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                }}
              >
                戻る
              </button>
            </>
          )}
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
            認証コードは異なるデバイスでも使用できます
          </div>
          
          {/* トラブルシューティング情報 */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <div>認証コードが届かない場合:</div>
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