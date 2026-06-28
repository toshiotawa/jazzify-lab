import React, { useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/utils/cn';

import ToastContainer from '@/components/ui/ToastContainer';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { isIOSWebView, getIOSMode, getIOSParam } from '@/utils/iosbridge';
import { runWhenIdle } from '@/utils/idlePrefetch';
import MidiWarningModal from '@/components/ui/MidiWarningModal';

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
const AdminDashboard = React.lazy(() => import('@/components/admin/AdminDashboard'));
const PricingTable = React.lazy(() => import('@/components/subscription/PricingTable'));
const LazyFantasyMain = React.lazy(() => import('@/components/fantasy/FantasyMain'));
const LazyStoryPage = React.lazy(() => import('@/components/fantasy/StoryPage'));
const LazySurvivalMain = React.lazy(() => import('@/components/survival/SurvivalMain'));
const LazySurvivalTutorialMain = React.lazy(
  () => import('@/components/survival/tutorial/SurvivalTutorialMain'),
);
const LazyGameScreen = React.lazy(() => import('@/components/game/GameScreen'));
const LazyEarTrainingMain = React.lazy(() => import('@/components/earTraining/EarTrainingMain'));
const LazyEarTrainingTutorialMain = React.lazy(
  () => import('@/components/earTraining/tutorial/EarTrainingTutorialMain'),
);
const LazyBalloonRushMain = React.lazy(() => import('@/components/balloonRush/BalloonRushMain'));

const renderDashboard = (): React.ReactNode => (
  <React.Suspense fallback={<LoadingScreen />}>
    <LazyDashboard />
  </React.Suspense>
);

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);
  
  // 認証ストアの状態
  const { profile, loading:authLoading, user } = useAuthStore();
  const geoCountry = useGeoStore(s => s.country);
  const isAdmin = Boolean(profile?.isAdmin);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    geoCountryHint: geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { isPremiumMember } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const isFreeRank = profile?.rank === 'free';
  
  // hash monitor
  const [hash, setHash] = useState(window.location.hash);
  useEffect(()=>{
    const h=()=>setHash(window.location.hash);
    window.addEventListener('hashchange',h);
    return()=>window.removeEventListener('hashchange',h);
  },[]);
  const forceLogin = hash === '#login';
  
  // ルートアクセス時にダッシュボードへリダイレクト（iOS WebViewでは不要）
  useEffect(() => {
    if (isIOSWebView()) return;
    if (window.location.hash === '' || window.location.hash === '#') {
      window.location.hash = '#dashboard';
    }
  }, []);
  
  // ゲーム設定書き換え用（gameStore は遅延 import）
  useEffect(() => {
    const ensureHeaderVisible = () => {
      if (typeof window === 'undefined') return;
      const gameHashes = ['#songs', '#practice', '#performance'];
      const currentHash = window.location.hash.split('?')[0];
      if (gameHashes.includes(currentHash)) {
        return;
      }
      void import('@/stores/gameStore').then(({ useGameStore }) => {
        useGameStore.getState().updateSettings({ showHeader: true });
      });
    };

    ensureHeaderVisible();
    window.addEventListener('hashchange', ensureHeaderVisible);
    return () => window.removeEventListener('hashchange', ensureHeaderVisible);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        setInitProgress(0.5);
        // 必須チェックのみ同期的に実行、ブラウザ機能チェックはバックグラウンド
        setTimeout(() => {
          if (typeof AudioContext === 'undefined' && typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext === 'undefined') {
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
  
  // レジェンドモードの曲選択（#songs）は非表示のためダッシュボードへ
  useEffect(() => {
    const baseHash = hash.split('?')[0];
    if (baseHash !== '#songs') return;
    const next = `${window.location.pathname}${window.location.search}#dashboard`;
    window.location.replace(next);
  }, [hash]);

  // プレミアム未加入はフリー向けハッシュのみ（課金APIと rank の両方を考慮）
  useEffect(() => {
    if (isIOSWebView()) return;
    const baseHash = window.location.hash.split('?')[0];
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
      if (!allowedForLimited.has(baseHash)) {
        window.location.hash = '#dashboard';
      }
    }
  }, [isPremiumMember, isAdmin]);

  useEffect(() => {
    if (!isIOSWebView()) return;
    void import('@/stores/gameStore').then(({ useGameStore }) => {
      if (useGameStore.getState().settings.showHeader) {
        useGameStore.getState().updateSettings({ showHeader: false });
      }
    });
  }, []);

  useEffect(() => {
    if (!isInitialized || !user || isIOSWebView()) return;
    const cancels = [
      runWhenIdle('chunk:lesson-page', () => {
        void import('@/components/lesson/LessonPage').catch(() => {});
      }),
      runWhenIdle('chunk:survival-main', () => {
        void import('@/components/survival/SurvivalMain').catch(() => {});
      }),
      runWhenIdle('chunk:ear-training-main', () => {
        void import('@/components/earTraining/EarTrainingMain').catch(() => {});
      }),
    ];
    if (isPremiumMember) {
      cancels.push(
        runWhenIdle('chunk:fantasy-main', () => {
          void import('@/components/fantasy/FantasyMain').catch(() => {});
        }),
      );
    }
    return () => {
      cancels.forEach(cancel => cancel());
    };
  }, [isInitialized, user, isPremiumMember]);

  useEffect(() => {
    if (!isInitialized || !user || !profile || isIOSWebView()) return;
    const cancel = runWhenIdle('warm:courses-details', () => {
      void (async () => {
        const [{ fetchCoursesWithDetails }, { shouldIncludeDeveloperLessonCoursesForUser }] =
          await Promise.all([
            import('@/platform/supabaseCourses'),
            import('@/utils/environment'),
          ]);
        await fetchCoursesWithDetails({
          includeDeveloperCourses: shouldIncludeDeveloperLessonCoursesForUser(profile.isAdmin),
        });
      })().catch(() => {});
    });
    return cancel;
  }, [isInitialized, user, profile]);

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
    const resolveHashRoute = (): React.ReactNode => {
      const hashBase = window.location.hash.split('?')[0].replace('#', '');
      switch (hashBase) {
        case 'survival-lesson':
          return <LazySurvivalMain lessonMode />;
        case 'survival-tutorial-lesson':
          return <LazySurvivalTutorialMain />;
        case 'balloon-rush-lesson':
          return (
            <React.Suspense fallback={<LoadingScreen />}>
              <LazyBalloonRushMain />
            </React.Suspense>
          );
        case 'ear-training-lesson':
          return <LazyEarTrainingMain />;
        case 'ear-training-tutorial-lesson':
          return <LazyEarTrainingTutorialMain />;
        case 'fantasy':
          return <LazyFantasyMain />;
        case 'play-lesson':
        case 'play-mission':
          return <LazyGameScreen />;
        case 'survival':
          return <LazySurvivalMain />;
        default:
          return <LazyGameScreen />;
      }
    };

    const effectiveMode = iosMode ?? 'web-page';
    let IOSContent: React.ReactNode;

    switch (effectiveMode) {
      case 'demo-lp':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            <LazySurvivalMain demoMode />
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
      case 'ear-training-lesson':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            {effectiveMode === 'ear-training-lesson' ? <LazyEarTrainingMain /> : <LazyGameScreen />}
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
      case 'web-page':
        IOSContent = (
          <React.Suspense fallback={<LoadingScreen />}>
            {resolveHashRoute()}
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

  if (!user || forceLogin) {
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

  if (hash === '#mypage' && !isFreeRank) {
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
      MainContent = renderDashboard();
      break;
    case '#lessons':
      MainContent = <LessonPage />;
      break;
    case '#course':
      MainContent = <CoursePage />;
      break;
    case '#lesson-detail':
      MainContent = <LessonDetailPage />;
      break;
    case '#information':
      MainContent = <InformationPage />;
      break;
    case '#achievements':
      MainContent = <AchievementsPage />;
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
    case '#admin-code-run-map':
    case '#admin-lesson-stages':
    case '#admin-ear-training':
    case '#admin-lessons':
    case '#admin-challenges':
    case '#admin-users':
    case '#admin-announcements':
    case '#admin-courses':
    case '#admin-dayly-fantasy':
      MainContent = isAdmin ? <AdminDashboard /> : renderDashboard();
      break;
    case '#ear-training-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyEarTrainingMain />
        </React.Suspense>
      );
      break;
    case '#ear-training-tutorial-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyEarTrainingTutorialMain />
        </React.Suspense>
      );
      break;
    case '#fantasy':
      MainContent = !isPremiumMember ? renderDashboard() : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyFantasyMain />
        </React.Suspense>
      );
      break;
    case '#Story':
      MainContent = !isPremiumMember ? renderDashboard() : (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyStoryPage />
        </React.Suspense>
      );
      break;
    case '#survival':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain />
        </React.Suspense>
      );
      break;
    case '#survival-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalMain lessonMode />
        </React.Suspense>
      );
      break;
    case '#survival-tutorial-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazySurvivalTutorialMain />
        </React.Suspense>
      );
      break;
    case '#balloon-rush-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyBalloonRushMain />
        </React.Suspense>
      );
      break;
    case '#practice':
    case '#performance':
    case '#play-lesson':
      MainContent = (
        <React.Suspense fallback={<LoadingScreen />}>
          <LazyGameScreen />
        </React.Suspense>
      );
      break;
    case '#songs':
      MainContent = renderDashboard();
      break;
    default:
      MainContent = renderDashboard();
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
          {user && <ProfileWizard />}
          <MidiWarningModal />
          {MainContent}
          <ToastContainer />
        </div>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
