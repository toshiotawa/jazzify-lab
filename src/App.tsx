import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthLanding from '@/components/auth/AuthLanding';
import VerifyOtpPage from '@/components/auth/VerifyOtpPage';
import AuthGate from '@/components/auth/AuthGate';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';
import { useAuthStore } from '@/stores/authStore';
import TermsPage from '@/components/legal/TermsPage';
import PrivacyPage from '@/components/legal/PrivacyPage';
import TokushohoPage from '@/components/legal/TokushohoPage';

// LegacyApp はバンドルサイズが大きいため遅延読み込みする
const LegacyApp = React.lazy(() => import('./LegacyApp'));

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const { init } = useAuthStore();

  // アプリケーション起動時に一度だけ認証状態を初期化
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 App: 認証初期化開始');
      await init();
      console.log('✅ App: 認証初期化完了');
      setInitialized(true);
    };
    initializeAuth();
  }, [init]);

  // 初期化中はローディング表示
  if (!initialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div>Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="w-full h-screen flex items-center justify-center text-white">
            Loading...
          </div>
        }
      >
        <Routes>
          {/* ========== 公開ルート (AuthGateの外) ========== */}
          <Route path="/" element={<LandingPage />} />
                                  <Route path="/login" element={<AuthLanding mode="login" />} />
            <Route path="/signup" element={<AuthLanding mode="signup" />} />
            <Route path="/login/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/legal/terms" element={<TermsPage />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/tokushoho" element={<TokushohoPage />} />

          {/* ========== 保護ルート (AuthGateの内側) ========== */}
          {/* '/*' を使い、上記以外のすべてのパスを保護対象にする */}
          <Route
            path="/*"
            element={
              <AuthGate>
                <LegacyApp />
              </AuthGate>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer />
      <EnvironmentBadge />
    </>
  );
};

export default App;
