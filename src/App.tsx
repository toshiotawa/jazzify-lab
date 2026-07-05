import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ToastContainer from '@/components/ui/ToastContainer';
import { EnvironmentBadge } from '@/components/ui/EnvironmentBadge';
import {
  buildAppUrl,
  isAppPath,
  isLandingPath,
  normalizePathname,
  shouldRedirectLegacyAppHash,
} from '@/utils/appPaths';
import { navigateToDashboardPath } from '@/utils/appNavigation';
import { useGaPageViews } from '@/hooks/useGaPageViews';

const LandingPage = React.lazy(() => import('@/components/LandingPage'));
const ProtectedAppRoute = React.lazy(() => import('@/routes/ProtectedAppRoute'));
const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const VerifyOtpPage = React.lazy(() => import('@/components/auth/VerifyOtpPage'));
const HelpIosMidi = React.lazy(() => import('@/components/help/HelpIosMidi'));
const HelpMidiKeyboardChoice = React.lazy(() => import('@/components/help/HelpMidiKeyboardChoice'));
const ContactPage = React.lazy(() => import('@/components/contact/ContactPage'));
const TermsPage = React.lazy(() => import('@/components/legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/components/legal/PrivacyPage'));
const TokushohoPage = React.lazy(() => import('@/components/legal/TokushohoPage'));
const TokushohoIosPage = React.lazy(() => import('@/components/legal/TokushohoIosPage'));
const WithdrawalCompletePage = React.lazy(() => import('@/components/auth/WithdrawalCompletePage'));

const PUBLIC_INFO_PATHS = new Set([
  '/',
  '/help/ios-midi',
  '/help/midi-keyboard-choice',
  '/contact',
  '/terms',
  '/terms/ios',
  '/privacy',
  '/privacy/ios',
  '/legal/tokushoho',
  '/legal/tokushoho/ios',
  '/withdrawal-complete',
  '/login',
  '/signup',
  '/login/verify-otp',
]);

const AuthLoadingFallback: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center bg-black/70 text-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <div>Initializing...</div>
    </div>
  </div>
);

const PageFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center text-white">
    Loading...
  </div>
);

/** `/` 上のレガシーアプリ hash（`#lesson-detail` 等）を `/main` へ逃がす */
const LandingRoute: React.FC = () => {
  const location = useLocation();
  if (shouldRedirectLegacyAppHash(location.pathname, location.hash)) {
    return (
      <Navigate
        to={buildAppUrl(location.hash, location.search)}
        replace
      />
    );
  }
  return (
    <Suspense fallback={<PageFallback />}>
      <LandingPage />
    </Suspense>
  );
};

const App: React.FC = () => {
  const location = useLocation();
  useGaPageViews();
  const [authReady, setAuthReady] = useState(false);
  const authBootstrapStartedRef = useRef(false);
  const pathname = normalizePathname(location.pathname);
  const shouldBootstrapAuth = useMemo(
    () => !PUBLIC_INFO_PATHS.has(pathname),
    [pathname],
  );
  const shouldLoadAppAssets = isAppPath(pathname);

  useEffect(() => {
    if (!shouldBootstrapAuth || authReady || authBootstrapStartedRef.current) {
      return;
    }
    authBootstrapStartedRef.current = true;

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
            setTimeout(() => reject(new Error('Auth init timeout')), 5000),
          ),
        ]);
      } catch (e) {
        console.warn('⚠️ App: 認証初期化タイムアウトまたはエラー、続行します', e);
      }
      setAuthReady(true);
      const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
      idle(() => import('@/routes/ProtectedAppRoute').catch(() => {}));
    };
    initializeAuth();
  }, [authReady, shouldBootstrapAuth]);

  useEffect(() => {
    if (isLandingPath(pathname)) {
      return;
    }
    void import('@/app-extra.css');
  }, [pathname]);

  if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
    return (
      <Navigate
        to={normalizePathname(location.pathname) + location.search + location.hash}
        replace
      />
    );
  }

  const protectedElement = authReady ? (
    <ProtectedAppRoute />
  ) : (
    <AuthLoadingFallback />
  );

  return (
    <>
      {shouldLoadAppAssets && (
        <Helmet>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap"
          />
        </Helmet>
      )}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/help/ios-midi" element={<HelpIosMidi />} />
          <Route path="/help/midi-keyboard-choice" element={<HelpMidiKeyboardChoice />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage variant="web" />} />
          <Route path="/terms/ios" element={<TermsPage variant="ios" />} />
          <Route path="/privacy" element={<PrivacyPage variant="web" />} />
          <Route path="/privacy/ios" element={<PrivacyPage variant="ios" />} />
          <Route path="/legal/tokushoho" element={<TokushohoPage />} />
          <Route path="/legal/tokushoho/ios" element={<TokushohoIosPage />} />
          <Route path="/withdrawal-complete" element={<WithdrawalCompletePage />} />
          <Route path="/login" element={<AuthLanding mode="login" />} />
          <Route path="/signup" element={<AuthLanding mode="signup" />} />
          <Route path="/login/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/main" element={protectedElement} />
          <Route path="/main/*" element={protectedElement} />
          <Route
            path="*"
            element={<Navigate to={navigateToDashboardPath()} replace />}
          />
        </Routes>
      </Suspense>
      <ToastContainer />
      <EnvironmentBadge />
    </>
  );
};

export default App;
