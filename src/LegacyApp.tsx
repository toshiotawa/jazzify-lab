import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/utils/cn';

import ToastContainer from '@/components/ui/ToastContainer';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import Dashboard from '@/components/dashboard/Dashboard';
import { isIOSWebView, getIOSMode, getIOSParam } from '@/utils/iosbridge';

const AuthLanding = React.lazy(() => import('@/components/auth/AuthLanding'));
const ProfileWizard = React.lazy(() => import('@/components/auth/ProfileWizard'));
const AccountPage = React.lazy(() => import('@/components/ui/AccountModal'));
const MypagePage = React.lazy(() => import('@/components/ui/MypageModal'));
const LessonPage = React.lazy(() => import('@/components/lesson/LessonPage'));
const CoursePage = React.lazy(() => import('@/components/lesson/CoursePage'));
const LessonDetailPage = React.lazy(() => import('@/components/lesson/LessonDetailPage'));
const InformationPage = React.lazy(() => import('@/components/information/InformationPage'));
const AdminDashboard = React.lazy(() => import('@/components/admin/AdminDashboard'));
const PricingTable = React.lazy(() => import('@/components/subscription/PricingTable'));
const LazyFantasyMain = React.lazy(() => import('@/components/fantasy/FantasyMain'));
const LazyStoryPage = React.lazy(() => import('@/components/fantasy/StoryPage'));
const LazyDailyChallengeMain = React.lazy(() => import('@/components/dailyChallenge/DailyChallengeMain'));
const LazySurvivalMain = React.lazy(() => import('@/components/survival/SurvivalMain'));
const LazyGameScreen = React.lazy(() => import('@/components/game/GameScreen'));

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);
  
  // 認証ストアの状態
  const { profile, loading:authLoading, isGuest, user } = useAuthStore();
  const geoCountry = useGeoStore(s => s.country);
  const isFree = profile?.rank === 'free';
  const isAdmin = Boolean(profile?.isAdmin);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    geoCountryHint: geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  
  // hash monitor
  const [hash, setHash] = useState(window.location.hash);
  useEffect(()=>{
    const h=()=>setHash(window.location.hash);
    window.addEventListener('hashchange',h);
    return()=>window.removeEventListener('hashchange',h);
  },[]);
  const forceLogin = hash === '#login';
  
  // ルートアクセス時にダッシュボードへリダイレクト
  useEffect(() => {
    if (window.location.hash === '' || window.location.hash === '#') {
      window.location.hash = '#dashboard';
    }
  }, []);
  
  // ゲーム設定書き換え用アクション
  const updateGameSettings = useGameStore((state) => state.updateSettings);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        setInitProgress(0.5);
        // 必須チェックのみ同期的に実行、ブラウザ機能チェックはバックグラウンド
        setTimeout(() => {
          if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
            console.warn('⚠️ Web Audio API not supported');
          }
          if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess === undefined) {
            console.warn('⚠️ Web MIDI API not supported');
          }
        }, 0);
        await new Promise(resolve => setTimeout(resolve, 30));
        setInitProgress(1.0);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
        setInitProgress(0);
      }
    };
    const timeoutId = setTimeout(initializeApp, 0);
    return () => clearTimeout(timeoutId);
  }, []);
  
  useEffect(() => {
    const baseHash = window.location.hash.split('?')[0];
    if (isGuest) {
      if (baseHash !== '#dashboard' && baseHash !== '#account') {
        window.location.hash = '#dashboard';
      }
    }
  }, [isGuest]);

  // フリープランはダッシュボード/アカウント/料金プランのみ
  useEffect(() => {
    const baseHash = window.location.hash.split('?')[0];
    if (isFree && !isAdmin) {
      if (baseHash !== '#dashboard' && baseHash !== '#account' && baseHash !== '#pricing') {
        window.location.hash = '#dashboard';
      }
    }
  }, [isFree, isAdmin]);
  
  // 他画面遷移時にヘッダー非表示状態を自動解除
  useEffect(() => {
    const ensureHeaderVisible = () => {
      const gameHashes = ['#songs', '#practice', '#performance'];
      const currentHash = window.location.hash;
      if (!gameHashes.includes(currentHash)) {
        updateGameSettings({ showHeader: true });
      }
    };

    // 初期チェック
    ensureHeaderVisible();

    window.addEventListener('hashchange', ensureHeaderVisible);
    return () => window.removeEventListener('hashchange', ensureHeaderVisible);
  }, [updateGameSettings]);
  
  // 初期化中の表示
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
        onRetry={() => {
          setInitError(null);
          setIsInitialized(false);
          setInitProgress(0);
          // 再初期化をトリガー
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }}
      />
    );
  }

  const iosMode = getIOSMode();
  if (isIOSWebView()) {
    if (useGameStore.getState().settings.showHeader) {
      updateGameSettings({ showHeader: false });
    }
  }
  if (isIOSWebView() && iosMode && iosMode !== 'web-page') {
    let IOSContent: React.ReactNode;
    switch (iosMode) {
      case 'demo-lp':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazySurvivalMain demoMode />
          </React.Suspense>
        );
        break;
      case 'demo-fantasy':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyFantasyMain demoStage={getIOSParam('stage') ?? '1-1'} />
          </React.Suspense>
        );
        break;
      case 'fantasy': {
        const stageParam = getIOSParam('stage');
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyFantasyMain initialStage={stageParam ?? undefined} />
          </React.Suspense>
        );
        break;
      }
      case 'survival':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazySurvivalMain />
          </React.Suspense>
        );
        break;
      case 'play-lesson':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyGameScreen />
          </React.Suspense>
        );
        break;
      case 'daily-challenge':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyDailyChallengeMain />
          </React.Suspense>
        );
        break;
      case 'lesson-detail':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LessonDetailPage />
          </React.Suspense>
        );
        break;
      case 'songs':
      case 'practice':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyGameScreen />
          </React.Suspense>
        );
        break;
      default:
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazyGameScreen />
          </React.Suspense>
        );
        break;
    }

    return (
      <ErrorBoundary>
        <div className="game-container relative w-full h-screen overflow-hidden bg-gradient-game text-white font-sans antialiased">
          {IOSContent}
        </div>
      </ErrorBoundary>
    );
  }

  if (authLoading) return <LoadingScreen />;

  if (!user && !isGuest || forceLogin) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <AuthLanding mode="login" />
        <ToastContainer />
      </React.Suspense>
    );
  }

  if (hash.startsWith('#account')) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <AccountPage />
        <ToastContainer />
      </React.Suspense>
    );
  }

  if (hash === '#mypage' && !isFree) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <MypagePage />
        <ToastContainer />
      </React.Suspense>
    );
  }


  // メインコンテンツの条件付きレンダリング
  let MainContent: React.ReactNode;
  
  // ハッシュをベース部分だけで判定するための処理
  const baseHash = hash.split('?')[0];
  const isStandardGlobal = profile?.rank === 'standard_global';
  
  switch (baseHash) {
    case '#dashboard':
      MainContent = <Dashboard />;
      break;
    case '#lessons':
      MainContent = isFree ? <Dashboard /> : <LessonPage />;
      break;
    case '#course':
      MainContent = isFree ? <Dashboard /> : <CoursePage />;
      break;
    case '#lesson-detail':
      MainContent = isFree ? <Dashboard /> : <LessonDetailPage />;
      break;
    case '#information':
      MainContent = isFree ? <Dashboard /> : <InformationPage />;
      break;
    case '#pricing':
      MainContent = <PricingTable />;
      break;
    case '#plan-comparison':
      MainContent = <PricingTable mode="view" />;
      break;
    case '#admin-songs':
    case '#admin-fantasy-bgm':
    case '#admin-fantasy-stages':
    case '#admin-survival':
    case '#admin-lesson-stages':
    case '#admin-lessons':
    case '#admin-challenges':
    case '#admin-users':
    case '#admin-announcements':
    case '#admin-courses':
    case '#admin-dayly-fantasy':
      MainContent = isAdmin ? <AdminDashboard /> : <Dashboard />;
      break;
    case '#fantasy':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyFantasyMain />
        </React.Suspense>
      );
      break;
    case '#daily-challenge':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyDailyChallengeMain />
        </React.Suspense>
      );
      break;
    case '#Story':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyStoryPage />
        </React.Suspense>
      );
      break;
    case '#survival':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain />
        </React.Suspense>
      );
      break;
    case '#survival-lesson':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain lessonMode />
        </React.Suspense>
      );
      break;
    case '#songs':
    case '#practice':
    case '#performance':
    case '#play-lesson':
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      );
      break;
    default:
      MainContent = isFree ? <Dashboard /> : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      );
      break;
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingScreen />}>
        <div 
          className={cn(
            'game-container',
            'relative w-full h-screen overflow-hidden',
            'bg-gradient-game text-white',
            'font-sans antialiased'
          )}
        >
          {user && !isGuest && <ProfileWizard />}
          {MainContent}
          <ToastContainer />
        </div>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App; 