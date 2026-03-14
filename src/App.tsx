import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import AuthGate from '@/components/auth/AuthGate';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

const LegacyApp = React.lazy(() => import('./LegacyApp'));
const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const VerifyOtpPage = React.lazy(() => import('@/components/auth/VerifyOtpPage'));
const HelpIosMidi = React.lazy(() => import('@/components/help/HelpIosMidi'));
const ContactPage = React.lazy(() => import('@/components/contact/ContactPage'));
const TermsPage = React.lazy(() => import('@/components/legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/components/legal/PrivacyPage'));
const TokushohoPage = React.lazy(() => import('@/components/legal/TokushohoPage'));
const WithdrawalCompletePage = React.lazy(() => import('@/components/auth/WithdrawalCompletePage'));

const AuthLoadingFallback: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <div>Initializing...</div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);
  const { init } = useAuthStore();
  const ensureGeoCountry = useGeoStore(state => state.ensureCountry);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await Promise.race([
          init(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Auth init timeout')), 5000)
          ),
        ]);
      } catch (e) {
        console.warn('⚠️ App: 認証初期化タイムアウトまたはエラー、続行します', e);
      }
      setAuthReady(true);
      const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
      idle(() => import('./LegacyApp').catch(() => {}));
    };
    initializeAuth();
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
          {/* ========== 公開ルート — 認証完了を待たず即座に表示 ========== */}
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

          {/* ========== 保護ルート — 認証完了後にのみ表示 ========== */}
          <Route
            path="/*"
            element={
              authReady ? (
                <AuthGate>
                  <LegacyApp />
                </AuthGate>
              ) : (
                <AuthLoadingFallback />
              )
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
