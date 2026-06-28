import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ToastContainer from '@/components/ui/ToastContainer';
import MidiWarningModal from '@/components/ui/MidiWarningModal';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { isIOSWebView } from '@/utils/iosbridge';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAppIdlePrefetch } from '@/hooks/useAppIdlePrefetch';
import { getHashBase, useHashMonitor } from '@/hooks/useHashMonitor';
import { dashboardPath } from '@/utils/appNavigation';
import AppHashRedirect from '@/routes/AppHashRedirect';
import GameRoutes from '@/routes/GameRoutes';

const LazyAdminDashboard = React.lazy(() => import('@/components/admin/AdminDashboard'));

const LazyDashboard = React.lazy(() => import('@/components/dashboard/Dashboard'));
const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const ProfileWizard = React.lazy(() => import('@/components/auth/ProfileWizard'));
const AccountPage = React.lazy(() => import('@/components/ui/AccountModal'));
const MypagePage = React.lazy(() => import('@/components/ui/MypageModal'));
const LessonPage = React.lazy(() => import('@/components/lesson/LessonPage'));
const CoursePage = React.lazy(() => import('@/components/lesson/CoursePage'));
const LessonDetailPage = React.lazy(() => import('@/components/lesson/LessonDetailPage'));
const InformationPage = React.lazy(() => import('@/components/information/InformationPage'));
const AchievementsPage = React.lazy(() => import('@/components/achievements/AchievementsPage'));
const PricingTable = React.lazy(() => import('@/components/subscription/PricingTable'));

const renderDashboard = (): React.ReactNode => (
  <React.Suspense fallback={<LoadingScreen />}>
    <LazyDashboard />
  </React.Suspense>
);

const AppShell: React.FC = () => {
  const location = useLocation();
  const hash = useHashMonitor();
  const { isInitialized, initError, initProgress, retry } = useAppInitialization();
  const { profile, loading: authLoading, user } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isAdmin = Boolean(profile?.isAdmin);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    geoCountryHint: geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const isFreeRank = profile?.rank === 'free';
  const forceLogin = hash === '#login';

  useEffect(() => {
    if (isIOSWebView()) return;
    if (window.location.hash === '' || window.location.hash === '#') {
      if (location.pathname === '/main' || location.pathname === '/main/') {
        window.location.replace(dashboardPath());
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const ensureHeaderVisible = (): void => {
      if (typeof window === 'undefined') return;
      const gameHashes = ['#songs', '#practice', '#performance'];
      const currentHash = window.location.hash.split('?')[0];
      if (gameHashes.includes(currentHash)) return;
      if (location.pathname.startsWith('/main/play/')) return;
      void import('@/stores/gameStore').then(({ useGameStore }) => {
        useGameStore.getState().updateSettings({ showHeader: true });
      });
    };

    ensureHeaderVisible();
    window.addEventListener('hashchange', ensureHeaderVisible);
    return () => window.removeEventListener('hashchange', ensureHeaderVisible);
  }, [location.pathname]);

  useEffect(() => {
    const baseHash = getHashBase(hash);
    if (baseHash !== '#songs') return;
    window.location.replace(dashboardPath());
  }, [hash]);

  useEffect(() => {
    if (isIOSWebView()) return;
    const baseHash = getHashBase(hash);
    if (!isPremiumMember && !isAdmin) {
      const allowedForLimited = new Set([
        '#dashboard',
        '#account',
        '#pricing',
        '#plan-comparison',
        '#lessons',
        '#course',
        '#lesson-detail',
        '#information',
        '#achievements',
        '#survival',
        '#survival-lesson',
        '#survival-tutorial-lesson',
        '#balloon-rush-lesson',
        '#ear-training-lesson',
        '#ear-training-tutorial-lesson',
        '#play-lesson',
        '#practice',
        '#performance',
      ]);
      const allowedPathPrefixes = [
        '/main/dashboard',
        '/main/account',
        '/main/pricing',
        '/main/plan-comparison',
        '/main/lessons',
        '/main/courses/',
        '/main/information',
        '/main/achievements',
        '/main/play/survival',
        '/main/play/balloon-rush',
        '/main/play/ear-training',
        '/main/play/lesson',
      ];
      const pathAllowed = allowedPathPrefixes.some((prefix) =>
        location.pathname === prefix || location.pathname.startsWith(prefix),
      );
      if (!allowedForLimited.has(baseHash) && !pathAllowed) {
        window.location.replace(dashboardPath());
      }
    }
  }, [hash, isAdmin, isPremiumMember, location.pathname]);

  useAppIdlePrefetch({
    hash,
    pathname: location.pathname,
    isInitialized,
    user,
    profile,
    isPremiumMember,
  });

  if (!isInitialized) {
    return (
      <LoadingScreen
        progress={initProgress}
        message={
          initProgress < 0.3 ? (isEnglishCopy ? 'Initializing system...' : 'システムを初期化中...') :
          initProgress < 0.7 ? (isEnglishCopy ? 'Checking browser features...' : 'ブラウザ機能をチェック中...') :
          initProgress < 1.0 ? (isEnglishCopy ? 'Finishing preparation...' : '準備を完了中...') :
          (isEnglishCopy ? 'Almost ready...' : 'まもなく完了...')
        }
        error={initError}
        onRetry={retry}
      />
    );
  }

  if (authLoading) return <LoadingScreen />;

  if (!user || forceLogin) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <AuthLanding mode="login" />
        <ToastContainer />
      </React.Suspense>
    );
  }

  const adminHashBase = getHashBase(hash);
  if (adminHashBase.startsWith('#admin-')) {
    if (!isAdmin) {
      return <Navigate to="/main/dashboard" replace />;
    }
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyAdminDashboard />
          <ToastContainer />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppHashRedirect />
      <React.Suspense fallback={<LoadingScreen />}>
        <div
          className={cn(
            'game-container',
            'relative w-full h-screen overflow-hidden',
            'bg-gradient-game text-white',
            'font-sans antialiased',
          )}
        >
          {user && <ProfileWizard />}
          <MidiWarningModal />
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={renderDashboard()} />
            <Route
              path="lessons"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <LessonPage />
                </React.Suspense>
              }
            />
            <Route
              path="lessons/:lessonId"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <LessonDetailPage />
                </React.Suspense>
              }
            />
            <Route
              path="courses/:courseId"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <CoursePage />
                </React.Suspense>
              }
            />
            <Route
              path="information"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <InformationPage />
                </React.Suspense>
              }
            />
            <Route
              path="achievements"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <AchievementsPage />
                </React.Suspense>
              }
            />
            <Route
              path="pricing"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <PricingTable />
                </React.Suspense>
              }
            />
            <Route
              path="plan-comparison"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <PricingTable mode="view" />
                </React.Suspense>
              }
            />
            <Route
              path="account"
              element={
                <React.Suspense fallback={<LoadingScreen />}>
                  <AccountPage />
                </React.Suspense>
              }
            />
            <Route
              path="mypage"
              element={
                isFreeRank ? (
                  <Navigate to="/main/dashboard" replace />
                ) : (
                  <React.Suspense fallback={<LoadingScreen />}>
                    <MypagePage />
                  </React.Suspense>
                )
              }
            />
            <Route
              path="play/*"
              element={
                <GameRoutes
                  isPremiumMember={isPremiumMember}
                  renderDashboard={renderDashboard}
                />
              }
            />
            <Route path="*" element={<Navigate to="/main/dashboard" replace />} />
          </Routes>
          <ToastContainer />
        </div>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default AppShell;
