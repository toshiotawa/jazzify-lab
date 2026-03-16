import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { verifyOtp, loading, profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const en = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '';

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      toast.error(en ? 'Invalid access. Please try again.' : '不正なアクセスです。再度操作をお試しください。');
      navigate('/login', { replace: true });
    }
  }, [location.search]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      return toast.error(en ? 'Please enter a 6-digit code.' : '認証コードは6桁で入力してください');
    }

    try {
      await verifyOtp(email, otpCode);
      navigate(redirect || '/main#dashboard', { replace: true });
    } catch {
      toast.error(en ? 'OTP verification failed. Please check your code.' : 'OTP検証に失敗しました。コードを確認してください。');
    }
  };

  const handleBack = () => {
    const to = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
    navigate(to);
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div>{en ? 'Loading...' : '読み込み中...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4">
      <div className="w-full max-w-md space-y-6 bg-slate-800/60 p-6 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {en ? 'Enter Verification Code' : '認証コードの入力'}
          </h2>
          <p className="text-sm text-gray-300 mt-2">
            {en
              ? `Enter the 6-digit code sent to ${email}.`
              : `${email} に送信された6桁のコードを入力してください。`}
          </p>
        </div>
        <input
          type="text"
          className="input input-bordered w-full text-center text-2xl tracking-widest"
          value={otpCode}
          onChange={e => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length <= 6) setOtpCode(value);
          }}
          placeholder="000000"
          maxLength={6}
          disabled={loading}
          aria-label={en ? 'Verification code' : '認証コード'}
        />
        <button
          className="btn btn-primary w-full"
          disabled={loading || otpCode.length !== 6}
          onClick={handleVerifyOtp}
        >
          {loading ? (en ? 'Verifying...' : '認証中...') : (en ? 'Verify' : '認証する')}
        </button>
        <button
          className="btn btn-ghost btn-sm w-full"
          onClick={handleBack}
        >
          {en ? 'Back' : '戻る'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
