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
import GuildRanking from '@/components/ranking/GuildRanking';
import MissionPage from '@/components/mission/MissionPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PricingTable from '@/components/subscription/PricingTable';
import FantasyMain from '@/components/fantasy/FantasyMain';
import GuildDashboard from '@/components/guild/GuildDashboard';
import GuildHistory from '@/components/guild/GuildHistory';
import GuildPage from '@/components/guild/GuildPage';
import GuildDetail from '@/components/guild/GuildDetail';

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);
  
  // ゲームストアの初期化状態
  const settings = useGameStore((state) => state.settings);
  
  // 認証ストアの状態
  const { profile, loading:authLoading, isGuest, user } = useAuthStore();
  const isFree = profile?.rank === 'free';
  
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
        console.log('🎵 Initializing Jazz Learning Game App...');
        setInitProgress(0.1);
        
        // 基本的な環境チェック（簡素化）
        setInitProgress(0.3);
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        
        setInitProgress(0.5);
        
        // 簡素化された初期化 - エラーが起きやすい処理を削除
        console.log('🔊 Checking basic browser features...');
        
        // Web Audio API の基本チェック（但しエラーは無視）
        if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
          console.log('🔊 Audio context available');
        } else {
          console.warn('⚠️ Web Audio API not supported');
        }
        
        setInitProgress(0.7);
        
        // MIDI API の基本チェック（但しエラーは無視）
        if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess !== undefined) {
          console.log('🎹 MIDI API available');
        } else {
          console.warn('⚠️ Web MIDI API not supported');
        }
        
        setInitProgress(0.9);
        
        // 最終チェック（シンプルに）
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setInitProgress(1.0);
        setIsInitialized(true);
        console.log('✅ Jazz Learning Game App initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
        setInitProgress(0);
      }
    };
    
    // 初期化を少し遅延させて確実に実行
    const timeoutId = setTimeout(initializeApp, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  useEffect(() => {
    const baseHash = window.location.hash.split('?')[0];
    if (isGuest) {
      if (baseHash !== '#dashboard' && baseHash !== '#account') {
        window.location.hash = '#dashboard';
      }
    }
  }, [isGuest]);

  // フリープランはダッシュボード/アカウントのみ
  useEffect(() => {
    const baseHash = window.location.hash.split('?')[0];
    if (isFree) {
      if (baseHash !== '#dashboard' && baseHash !== '#account') {
        window.location.hash = '#dashboard';
      }
    }
  }, [isFree]);
  
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
          initProgress < 0.3 ? 'システムを初期化中...' :
          initProgress < 0.7 ? 'ブラウザ機能をチェック中...' :
          initProgress < 1.0 ? '準備を完了中...' :
          'まもなく完了...'
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

  if (authLoading) return <LoadingScreen />;

  if (!user && !isGuest || forceLogin) {
    return (
      <>
        <AuthLanding />
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
    case '#guilds':
      MainContent = isFree ? <Dashboard /> : <GuildDashboard />;
      break;
    case '#guild':
      MainContent = isFree ? <Dashboard /> : <GuildPage />;
      break;
    case '#guild-history':
      MainContent = isFree ? <Dashboard /> : <GuildHistory />;
      break;
    case '#guilds-detail':
      MainContent = isFree ? <Dashboard /> : <GuildDetail />;
      break;
    case '#missions':
    case '#mission':
      MainContent = isFree ? <Dashboard /> : <MissionPage />;
      break;
    case '#mission-ranking':
      MainContent = isFree ? <Dashboard /> : <MissionRanking />;
      break;
    case '#guilds-ranking':
      MainContent = isFree ? <Dashboard /> : <GuildRanking />;
      break;
    case '#information':
      MainContent = isFree ? <Dashboard /> : <InformationPage />;
      break;
    case '#pricing':
      MainContent = isFree ? <Dashboard /> : <PricingTable />;
      break;
    case '#admin-songs':
    case '#admin-fantasy-bgm':
    case '#admin-fantasy-stages':
    case '#admin-lessons':
    case '#admin-challenges':
    case '#admin-users':
    case '#admin-announcements':
    case '#admin-courses':
      MainContent = isFree ? <Dashboard /> : <AdminDashboard />;
      break;
    case '#fantasy':
      MainContent = isFree ? <Dashboard /> : <FantasyMain />;
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
        
        {/* グローバルな状態表示 */}
        {settings.showFPS && (
          <FPSCounter />
        )}
        
        {/* デバッグ情報（開発時のみ） */}
        {false && process.env.NODE_ENV === 'development' && (
          <DebugInfo />
        )}
        

        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

/**
 * FPSカウンター（パフォーマンス監視用）
 */
const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(60);
  const debug = useGameStore((state) => state.debug);
  
  useEffect(() => {
    // ❌ 独立したrequestAnimationFrameループを削除
    // ✅ unifiedFrameControllerのパフォーマンス情報を使用
    
    const updateFPSFromPerformanceMonitor = () => {
      if (window.performanceMonitor) {
        const currentFPS = window.performanceMonitor.getFPS();
        setFps(currentFPS);
        
        // ストアのデバッグ情報も更新
        useGameStore.getState().updateDebugInfo({ fps: currentFPS });
      }
    };
    
    // 1秒間隔で更新（競合しない軽量な方式）
    const intervalId = setInterval(updateFPSFromPerformanceMonitor, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-70 text-green-400 px-4 py-2 rounded text-lg font-mono">
      FPS: {fps}
      <br />
      Render: {debug.renderTime.toFixed(1)}ms
    </div>
  );
};

/**
 * デバッグ情報表示（開発時のみ）
 */
const DebugInfo: React.FC = () => {
  const debug = useGameStore((state) => state.debug);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const currentTime = useGameStore((state) => state.currentTime);
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-70 text-yellow-400 px-4 py-3 rounded text-base font-mono max-w-sm">
      <div>Playing: {isPlaying ? 'YES' : 'NO'}</div>
      <div>Time: {currentTime.toFixed(2)}s</div>
      <div>Audio Latency: {debug.audioLatency.toFixed(1)}ms</div>
    </div>
  );
};

export default App; 