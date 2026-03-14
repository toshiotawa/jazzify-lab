import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';

const LandingPage = React.lazy(() => import('@/components/LandingPage'));
const ProtectedAppRoute = React.lazy(() => import('@/routes/ProtectedAppRoute'));
const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const VerifyOtpPage = React.lazy(() => import('@/components/auth/VerifyOtpPage'));
const HelpIosMidi = React.lazy(() => import('@/components/help/HelpIosMidi'));
const ContactPage = React.lazy(() => import('@/components/contact/ContactPage'));
const TermsPage = React.lazy(() => import('@/components/legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/components/legal/PrivacyPage'));
const TokushohoPage = React.lazy(() => import('@/components/legal/TokushohoPage'));
const WithdrawalCompletePage = React.lazy(() => import('@/components/auth/WithdrawalCompletePage'));

const PUBLIC_INFO_PATHS = new Set([
  '/',
  '/help/ios-midi',
  '/contact',
  '/terms',
  '/privacy',
  '/legal/tokushoho',
  '/withdrawal-complete',
]);

const AuthLoadingFallback: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <div>Initializing...</div>
    </div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const [authReady, setAuthReady] = useState(false);
  const [authBootstrapStarted, setAuthBootstrapStarted] = useState(false);
  const pathname = location.pathname;
  const shouldBootstrapAuth = useMemo(
    () => !PUBLIC_INFO_PATHS.has(pathname),
    [pathname],
  );
  const shouldLoadFontAwesome = pathname !== '/';

  useEffect(() => {
    if (!shouldBootstrapAuth || authReady || authBootstrapStarted) {
      return;
    }

    let cancelled = false;
    setAuthBootstrapStarted(true);

    const initializeAuth = async () => {
      try {
        const [{ useAuthStore }, { useGeoStore }] = await Promise.all([
          import('@/stores/authStore'),
          import('@/stores/geoStore'),
        ]);
        void useGeoStore.getState().ensureCountry();
        await Promise.race([
          useAuthStore.getState().init(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Auth init timeout')), 5000)
          ),
        ]);
      } catch (e) {
        console.warn('⚠️ App: 認証初期化タイムアウトまたはエラー、続行します', e);
      }
      if (cancelled) {
        return;
      }
      setAuthReady(true);
      const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
      idle(() => import('@/routes/ProtectedAppRoute').catch(() => {}));
    };
    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, [authBootstrapStarted, authReady, shouldBootstrapAuth]);

  useEffect(() => {
    if (pathname === '/') {
      return;
    }
    void import('@/app-extra.css');
  }, [pathname]);

  return (
    <>
      {shouldLoadFontAwesome && (
        <Helmet>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
        </Helmet>
      )}
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
                <ProtectedAppRoute />
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
