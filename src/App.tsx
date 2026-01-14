import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthLanding from '@/components/auth/AuthLanding';
import VerifyOtpPage from '@/components/auth/VerifyOtpPage';
import AuthGate from '@/components/auth/AuthGate';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import HelpIosMidi from '@/components/help/HelpIosMidi';
import ContactPage from '@/components/contact/ContactPage';
import TermsPage from '@/components/legal/TermsPage';
import PrivacyPage from '@/components/legal/PrivacyPage';
import TokushohoPage from '@/components/legal/TokushohoPage';
import WithdrawalCompletePage from '@/components/auth/WithdrawalCompletePage';

// LegacyApp はバンドルサイズが大きいため遅延読み込みする
const LegacyApp = React.lazy(() => import('./LegacyApp'));

const App: React.FC = () => {
  const { init } = useAuthStore();
  const ensureGeoCountry = useGeoStore(state => state.ensureCountry);

  // アプリケーション起動時に一度だけ認証状態を初期化（非同期・非ブロッキング）
  useEffect(() => {
    // 認証初期化をバックグラウンドで実行（UIをブロックしない）
    init().catch(console.error);
  }, [init]);

  useEffect(() => {
    void ensureGeoCountry();
  }, [ensureGeoCountry]);

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
          <Route path="/help/ios-midi" element={<HelpIosMidi />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal/tokushoho" element={<TokushohoPage />} />
          <Route path="/withdrawal-complete" element={<WithdrawalCompletePage />} />
          <Route path="/login" element={<AuthLanding mode="login" />} />
            <Route path="/signup" element={<AuthLanding mode="signup" />} />
            <Route path="/login/verify-otp" element={<VerifyOtpPage />} />

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
