import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';

const AuthLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const { loginWithMagicLink, enterGuestMode, loading, error } = useAuthStore();
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
        </div>

        <div className="text-center">
          <button className="btn btn-secondary" onClick={handleGuest}>おためしプレイ</button>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding; 