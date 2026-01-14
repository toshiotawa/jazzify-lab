import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import GameScreen from '@/components/game/GameScreen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/utils/cn';

import ToastContainer from '@/components/ui/ToastContainer';
import AuthLanding from '@/components/auth/AuthLanding';
import { useAuthStore } from '@/stores/authStore';
import ProfileWizard from '@/components/auth/ProfileWizard';
import AccountPage from '@/components/ui/AccountModal';
import MypagePage from '@/components/ui/MypageModal';
import DiaryPage from '@/components/diary/DiaryPage';
import DiaryDetailPage from '@/components/diary/DiaryDetailPage';
import LessonPage from '@/components/lesson/LessonPage';
import LessonDetailPage from '@/components/lesson/LessonDetailPage';
import Dashboard from '@/components/dashboard/Dashboard';
import InformationPage from '@/components/information/InformationPage';
import LevelRanking from '@/components/ranking/LevelRanking';
import MissionRanking from '@/components/ranking/MissionRanking';
import MissionPage from '@/components/mission/MissionPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PricingTable from '@/components/subscription/PricingTable';
import FantasyMain from '@/components/fantasy/FantasyMain';
import StoryPage from '@/components/fantasy/StoryPage';
import DailyChallengeMain from '@/components/dailyChallenge/DailyChallengeMain';

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // 認証ストアの状態
  const { profile, loading:authLoading, isGuest, user } = useAuthStore();
  const isFree = profile?.rank === 'free';
  const isAdmin = Boolean(profile?.isAdmin);
  
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
    // 即座に初期化を実行（遅延なし）
    try {
      // 基本的な環境チェック（同期処理で高速化）
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
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
  
  // 初期化中の表示（エラー時のみ）
  if (!isInitialized && initError) {
    return (
      <LoadingScreen 
        error={initError}
        onRetry={() => {
          setInitError(null);
          window.location.reload();
        }}
      />
    );
  }

  if (authLoading) return <LoadingScreen />;

  if (!user && !isGuest || forceLogin) {
    return (
      <>
        <AuthLanding mode="login" />
        <ToastContainer />
      </>
    );
  }

  // 専用ページ (#account / #mypage) 表示中は他コンテンツを隠す
  if (hash === '#account') {
    return (
      <>
        <AccountPage />
        <ToastContainer />
      </>
    );
  }

  if (hash === '#mypage' && !isFree) {
    return (
      <>
        <MypagePage />
        <ToastContainer />
      </>
    );
  }

  if (hash.startsWith('#diary-detail') && !isFree) {
    return (
      <>
        <DiaryDetailPage />
        <ToastContainer />
      </>
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
    case '#diary':
    case '#diary-user':
      MainContent = isFree ? <Dashboard /> : <DiaryPage />;
      break;
    case '#lessons':
      MainContent = isFree ? <Dashboard /> : <LessonPage />;
      break;
    case '#lesson-detail':
      MainContent = isFree ? <Dashboard /> : <LessonDetailPage />;
      break;
    case '#ranking':
      MainContent = isFree ? <Dashboard /> : <LevelRanking />;
      break;
    case '#missions':
    case '#mission':
      MainContent = isFree ? <Dashboard /> : <MissionPage />;
      break;
    case '#mission-ranking':
      MainContent = isFree ? <Dashboard /> : <MissionRanking />;
      break;
    case '#information':
      MainContent = isFree ? <Dashboard /> : <InformationPage />;
      break;
    case '#pricing':
      MainContent = <PricingTable />;
      break;
    case '#admin-songs':
    case '#admin-fantasy-bgm':
    case '#admin-fantasy-stages':
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
      MainContent = isFree ? <Dashboard /> : <FantasyMain />;
      break;
    case '#daily-challenge':
      MainContent = isFree ? <Dashboard /> : <DailyChallengeMain />;
      break;
    case '#Story':
      MainContent = isFree ? <Dashboard /> : <StoryPage />;
      break;
    case '#songs':
    case '#practice':
    case '#performance':
    case '#play-lesson':
    case '#play-mission':
      MainContent = isStandardGlobal || isFree ? <Dashboard /> : <GameScreen />;
      break;
    default:
      MainContent = isStandardGlobal || isFree ? <Dashboard /> : <GameScreen />;
      break;
  }

  return (
    <ErrorBoundary>
      <div 
        className={cn(
          'game-container',
          'relative w-full h-screen overflow-hidden',
          'bg-gradient-game text-white',
          'font-sans antialiased'
        )}
      >
        {/* ログインユーザー専用モーダル類 */}
        {user && !isGuest && (
          <>
            <ProfileWizard />
          </>
        )}
        
        {/* メインコンテンツ */}
        {MainContent}
        
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

export default App; 