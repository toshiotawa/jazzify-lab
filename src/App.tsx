import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import GameScreen from '@/components/game/GameScreen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/utils/cn';

/**
 * メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);
  
  // ゲームストアの初期化状態
  const settings = useGameStore((state) => state.settings);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🎵 Initializing Jazz Learning Game...');
        setInitProgress(0.1);
        
        // 基本的な環境チェック
        setInitProgress(0.2);
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        
        setInitProgress(0.3);
        if (!document.querySelector || !document.getElementById) {
          throw new Error('DOM methods not available');
        }
        
        // オーディオ初期化
        setInitProgress(0.4);
        await initializeAudio();
        
        // MIDI 初期化
        setInitProgress(0.6);
        await initializeMidi();
        
        // 初期データの読み込み
        setInitProgress(0.8);
        await loadInitialData();
        
        // 最終チェック
        setInitProgress(0.9);
        await new Promise(resolve => setTimeout(resolve, 200)); // 少し待機
        
        setInitProgress(1.0);
        setIsInitialized(true);
        console.log('✅ Jazz Learning Game initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
        setInitProgress(0);
      }
    };
    
    initializeApp();
  }, []);
  
  const initializeAudio = async () => {
    try {
      // Web Audio API の基本チェック
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        console.log('🔊 Audio context available');
      } else {
        console.warn('⚠️ Web Audio API not supported');
      }
      return Promise.resolve();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      return Promise.resolve(); // オーディオエラーは致命的ではない
    }
  };
  
  const initializeMidi = async () => {
    try {
      // Web MIDI API の基本チェック
      if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess !== undefined) {
        console.log('🎹 MIDI API available');
      } else {
        console.warn('⚠️ Web MIDI API not supported');
      }
      return Promise.resolve();
    } catch (error) {
      console.warn('MIDI initialization failed:', error);
      return Promise.resolve(); // MIDIエラーは致命的ではない
    }
  };
  
  const loadInitialData = async () => {
    try {
      // 基本的なフェッチテスト
      const response = await fetch('/vite.svg');
      if (!response.ok) {
        console.warn('Static asset test failed, but continuing...');
      } else {
        console.log('📁 Static assets accessible');
      }
      return Promise.resolve();
    } catch (error) {
      console.warn('Initial data loading failed:', error);
      return Promise.resolve(); // データ読み込みエラーは致命的ではない
    }
  };
  
  // 初期化中の表示
  if (!isInitialized) {
    return (
      <LoadingScreen 
        progress={initProgress}
        message={
          initProgress < 0.3 ? 'システムを初期化中...' :
          initProgress < 0.6 ? 'オーディオシステムを準備中...' :
          initProgress < 0.8 ? 'MIDIシステムを準備中...' :
          initProgress < 1.0 ? 'データを読み込み中...' :
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
        {/* メインゲーム画面 */}
        <GameScreen />
        
        {/* グローバルな状態表示 */}
        {settings.showFPS && (
          <FPSCounter />
        )}
        
        {/* デバッグ情報（開発時のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <DebugInfo />
        )}
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
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        frameCount = 0;
        lastTime = currentTime;
        
        // ストアのデバッグ情報も更新
        useGameStore.getState().updateDebugInfo({ fps: currentFPS });
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-70 text-green-400 px-3 py-1 rounded text-sm font-mono">
      FPS: {fps}
      <br />
      Render: {debug.renderTime.toFixed(1)}ms
    </div>
  );
};

/**
 * デバッグ情報表示（開発環境のみ）
 */
const DebugInfo: React.FC = () => {
  const gameState = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-yellow-600 text-black px-2 py-1 rounded text-xs font-mono"
      >
        DEBUG
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-90 text-green-400 p-4 rounded-lg text-xs font-mono max-w-sm max-h-64 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-yellow-400">DEBUG INFO</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div>Mode: {gameState.mode}</div>
        <div>Instrument: {gameState.settings.instrumentMode}</div>
        <div>Playing: {gameState.isPlaying ? 'YES' : 'NO'}</div>
        <div>Time: {gameState.currentTime.toFixed(2)}s</div>
        <div>Song: {gameState.currentSong?.title || 'None'}</div>
        <div>Notes: {gameState.notes.length}</div>
        <div>Active: {gameState.activeNotes.size}</div>
        <div>Score: {gameState.score.score}</div>
        <div>Combo: {gameState.score.combo}</div>
        <div>Accuracy: {(gameState.score.accuracy * 100).toFixed(1)}%</div>
      </div>
      
      {/* ストア操作ボタン */}
      <div className="mt-3 space-y-1">
        <button
          onClick={() => gameState.resetGame()}
          className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
        >
          Reset Game
        </button>
        <button
          onClick={() => {
            // サンプルデータでテスト
            const sampleSong = {
              id: 'test',
              title: 'Test Song',
              artist: 'Test Artist',
              difficulty: 1,
              duration: 120,
              audioFile: '/test.mp3',
              notesFile: '/test.json',
              genreCategory: 'jazz'
            };
            const sampleNotes = [
              { id: '1', time: 5, pitch: 60 },
              { id: '2', time: 6, pitch: 64 },
              { id: '3', time: 7, pitch: 67 }
            ];
            gameState.loadSong(sampleSong, sampleNotes);
          }}
          className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          Load Test Song
        </button>
      </div>
    </div>
  );
};

export default App; 