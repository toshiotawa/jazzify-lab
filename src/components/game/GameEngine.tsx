/**
 * Phase 3: ゲームエンジン + PIXI.js統合 UI コンポーネント
 * ゲームエンジンとPIXI.jsレンダリングの接続
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { PIXINotesRenderer, PIXINotesRendererInstance } from './PIXINotesRenderer';

interface GameEngineComponentProps {
  className?: string;
}

export const GameEngineComponent: React.FC<GameEngineComponentProps> = ({ 
  className 
}) => {
  const {
    gameEngine,
    engineActiveNotes,
    isPlaying,
    currentSong,
    currentTime,
    settings,
    initializeGameEngine,
    destroyGameEngine,
    handleNoteInput,
    updateEngineSettings,
    updateSettings,
    updateTime,
    pause,
    stop
  } = useGameStore();
  
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 800, height: 600 });
  
  // 音声再生用の要素
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  // === オーディオタイミング同期用 ===
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  // GameEngine と updateTime に渡すための AudioContext ベースのタイムスタンプ
  const baseOffsetRef = useRef<number>(0); // currentTime = audioCtx.time - baseOffset
  const animationFrameRef = useRef<number | null>(null);
  
  // 楽曲読み込み時の音声設定
  useEffect(() => {
    if (currentSong?.audioFile && audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setAudioLoaded(true);
        console.log(`🎵 音声ファイル読み込み完了: ${audio.duration}秒`);
      };
      
      const handleError = (e: any) => {
        console.error('音声ファイルの読み込みに失敗:', e);
        setAudioLoaded(false);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      audio.src = currentSong.audioFile;
      audio.volume = settings.musicVolume;
      audio.preload = 'metadata';
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
      };
    } else {
      setAudioLoaded(false);
    }
  }, [currentSong?.audioFile, settings.musicVolume]);
  
  // 再生状態同期
  useEffect(() => {
    if (!audioRef.current || !audioLoaded || !gameEngine) return;
    
    const audio = audioRef.current;
    
    if (isPlaying) {
      // 1) AudioContext を初期化 (存在しなければ)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current!;

      // 2) MediaElementSource を生成（初回のみ）
      if (!mediaSourceRef.current) {
        mediaSourceRef.current = audioContext.createMediaElementSource(audio);
        mediaSourceRef.current.connect(audioContext.destination);
      }

      // 3) AudioContext を resume し、再生位置を同期
      audioContext.resume();

      const syncTime = Math.max(0, currentTime);
      audio.currentTime = syncTime;

      // 4) AudioContext と HTMLAudio のオフセットを記録
      baseOffsetRef.current = audioContext.currentTime - syncTime;

      // 5) GameEngine を AudioContext に紐付けて開始
      gameEngine.start(audioContext);
      gameEngine.seek(syncTime);

      // 6) HTMLAudio 再生 (AudioContext と同軸)
      audio.play().catch(e => console.error('音声再生エラー:', e));

      startTimeSync();
    } else {
      audio.pause();
      
      // GameEngineを一時停止
      gameEngine.pause();
      console.log('🎮 GameEngine paused');
      
      // AudioContext も suspend してCPU節約
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }

      stopTimeSync();
    }
  }, [isPlaying, audioLoaded, gameEngine]);
  
  // 音量変更の同期
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume;
    }
  }, [settings.musicVolume]);
  
  // 時間同期ループ
  const startTimeSync = useCallback(() => {
    const syncTime = () => {
      if (audioContextRef.current && isPlaying) {
        const audioCtxTime = audioContextRef.current.currentTime;
        const logicalTime = audioCtxTime - baseOffsetRef.current;
        updateTime(logicalTime);
        
        // 楽曲終了チェック
        if (logicalTime >= (currentSong?.duration || 0)) {
          stop();
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(syncTime);
      }
    };
    syncTime();
  }, [isPlaying, currentSong?.duration, updateTime, stop]);
  
  const stopTimeSync = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // シーク機能
  useEffect(() => {
    if (audioContextRef.current && audioLoaded) {
      const audioTime = audioContextRef.current.currentTime - baseOffsetRef.current;
      const timeDiff = Math.abs(audioTime - currentTime);
      // 0.3秒以上のずれがある場合のみシーク（より厳密な同期）
      if (timeDiff > 0.3) {
        const safeTime = Math.max(0, Math.min(currentTime, (currentSong?.duration || currentTime)));
        if (audioRef.current) audioRef.current.currentTime = safeTime;
        
        // オフセット再計算
        if (audioContextRef.current) {
          baseOffsetRef.current = audioContextRef.current.currentTime - safeTime;
        }
        
        // GameEngineも同時にシーク
        if (gameEngine) {
          gameEngine.seek(safeTime);
          console.log(`🔄 Audio & GameEngine synced to ${safeTime.toFixed(2)}s`);
        }
      }
    }
  }, [currentTime, audioLoaded, gameEngine]);
  
  // ゲームエンジン初期化
  useEffect(() => {
    const initEngine = async () => {
      if (!gameEngine && currentSong) {
        await initializeGameEngine();
        setIsEngineReady(true);
      }
    };
    
    initEngine();
    
    return () => {
      if (gameEngine) {
        destroyGameEngine();
        setIsEngineReady(false);
      }
    };
  }, [currentSong, gameEngine, initializeGameEngine, destroyGameEngine]);
  
  // 設定変更時の更新
  useEffect(() => {
    if (gameEngine) {
      updateEngineSettings();
    }
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        keyboardNoteNameStyle: settings.keyboardNoteNameStyle ?? 'abc',
        noteNoteNameStyle: settings.noteNoteNameStyle ?? 'abc',
        noteAccidentalStyle: settings.noteAccidentalStyle ?? 'sharp',
        pianoHeight: settings.pianoHeight
      });
      pixiRenderer.resize(gameAreaSize.width, gameAreaSize.height);
    }
  }, [gameEngine, updateEngineSettings, pixiRenderer, settings.keyboardNoteNameStyle, settings.noteNoteNameStyle, settings.noteAccidentalStyle, settings.pianoHeight, gameAreaSize.width, gameAreaSize.height]);
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    const updateSize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newSize = {
          width: rect.width || 800,
          height: rect.height || 600
        };
        setGameAreaSize(newSize);

        // 鍵盤高さを従来の50%に縮小
        const baseHeight = Math.max(40, Math.min(100, newSize.width / 6));
        const dynamicPianoHeight = Math.max(20, Math.floor(baseHeight / 2));

        // ビューポート＆ピアノ高さをストアに反映し、GameEngineにも即時伝達
        updateSettings({ 
          viewportHeight: newSize.height,
          pianoHeight: dynamicPianoHeight
        });
        updateEngineSettings();

        // PIXI レンダラーにも即時反映
        if (pixiRenderer) {
          pixiRenderer.updateSettings({ pianoHeight: dynamicPianoHeight });
          pixiRenderer.resize(newSize.width, newSize.height);
        }
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSettings, updateEngineSettings, pixiRenderer]);
  
  // PIXI.js レンダラー準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance) => {
    console.log('🎮 PIXI.js renderer ready, setting up callbacks...');
    setPixiRenderer(renderer);
    
    // 初期設定を反映
    renderer.updateSettings({
      keyboardNoteNameStyle: settings.keyboardNoteNameStyle ?? 'abc',
      noteNoteNameStyle: settings.noteNoteNameStyle ?? 'abc',
      noteAccidentalStyle: settings.noteAccidentalStyle ?? 'sharp'
    });
    
    // ピアノキーボードのクリックイベントを接続
    renderer.setKeyCallbacks(
      (note: number) => {
        // console.log(`🎮 GameEngine received key press: ${note}`);
        handlePianoKeyPress(note);
      }, // キー押下
      (note: number) => {
        // console.log(`🎮 GameEngine received key release: ${note}`);
        if (renderer) {
          renderer.highlightKey(note, false);
        }
      } // キー解放
    );
    
    console.log('🎮 PIXI.js ノーツレンダラー準備完了');
  }, [handleNoteInput]); // handleNoteInputを依存関係に追加
  
  // ピアノキー演奏ハンドラー
  const handlePianoKeyPress = useCallback((note: number) => {
    // console.log(`🎹 Piano key press handler called for note: ${note}`);
    
    // PIXI.jsピアノキーのハイライト
    if (pixiRenderer) {
      // console.log(`🎨 Highlighting key: ${note}`);
      pixiRenderer.highlightKey(note, true);
      setTimeout(() => {
        pixiRenderer.highlightKey(note, false);
      }, 150); // 150ms後にハイライト解除
    } 
    // Note: PIXIレンダラーが初期化中の場合は、ビジュアルハイライトを省略
    // 音入力の処理は下記で継続される
    
    // ゲームエンジンに音入力を送信
    // console.log(`🎮 Sending note input to game engine: ${note}`);
    handleNoteInput(note);
  }, [pixiRenderer, handleNoteInput]);
  
  // キーボード入力処理（テスト用）
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isPlaying || !gameEngine) return;
    
    // シンプルなキーボードマッピング（C4オクターブ）
    const keyToNote: { [key: string]: number } = {
      'z': 60, // C
      's': 61, // C#
      'x': 62, // D
      'd': 63, // D#
      'c': 64, // E
      'v': 65, // F
      'g': 66, // F#
      'b': 67, // G
      'h': 68, // G#
      'n': 69, // A
      'j': 70, // A#
      'm': 71, // B
    };
    
    const note = keyToNote[event.key.toLowerCase()];
    if (note) {
      handlePianoKeyPress(note);
    }
  }, [isPlaying, gameEngine, handlePianoKeyPress]);
  
  // キーボードイベント登録
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  if (!currentSong) {
    return (
      <div className={cn(
        "flex items-center justify-center h-64 bg-gray-100 rounded-lg",
        className
      )}>
        <p className="text-gray-500">楽曲を選択してください</p>
      </div>
    );
  }
  
  return (
    <div className={cn("relative", className)}>
      {/* ゲームエンジン・音声状態表示 (フローティング) */}
      <div className="fixed top-4 left-4 z-40 bg-gray-800 bg-opacity-80 text-white text-xs rounded-lg shadow-lg px-3 py-2 pointer-events-none">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isEngineReady ? "bg-green-500" : "bg-yellow-500"
            )} />
            <span className="font-medium">
              ゲームエンジン: {isEngineReady ? "準備完了" : "初期化中..."}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              audioLoaded ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="font-medium">
              音声: {audioLoaded ? "読み込み完了" : "読み込み中..."}
            </span>
          </div>
        </div>
        <div className="text-right mt-1">
          アクティブノーツ: {engineActiveNotes.length}
        </div>
      </div>
      
      {/* Phase 3: PIXI.js ノーツ表示エリア - フル高さ */}
      <div 
        ref={gameAreaRef}
        className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '40vh' }}
      >
        {/* PIXI.js ノーツレンダラー（統合済み） */}
        {(() => {
          const TOTAL_WHITE_KEYS = 52; // 88鍵ピアノの白鍵数
          const VISIBLE_WHITE_KEYS = 24; // モバイルで画面に収めたい白鍵数(約2オクターブ)
          const MIN_WHITE_KEY_PX = 22;   // PC での最小白鍵幅

          const fullWidthAtMin = TOTAL_WHITE_KEYS * MIN_WHITE_KEY_PX;

          let idealWidth: number;
          if (gameAreaSize.width >= fullWidthAtMin) {
            // PC 等、画面が十分広い → スクロール不要
            idealWidth = gameAreaSize.width;
          } else {
            // モバイル等、画面が狭い → 2〜3 オクターブ分を基準にスケーリング
            const whiteKeyWidth = gameAreaSize.width / VISIBLE_WHITE_KEYS;
            idealWidth = Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth);
          }
          return (
            <div className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: idealWidth, height: '100%' }}>
                <PIXINotesRenderer
                  activeNotes={engineActiveNotes}
                  width={idealWidth}
                  height={gameAreaSize.height}
                  currentTime={currentTime}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            </div>
          );
        })()}
        
        {/* PIXI.js デバッグ情報 */}
        {pixiRenderer && (
          <div className="fixed top-4 right-4 bg-black bg-opacity-60 text-white text-xs p-2 rounded z-30 pointer-events-none">
            <div>PIXI.js レンダラー: 稼働中</div>
            <div>アクティブノーツ: {engineActiveNotes.length}</div>
            <div>解像度: {gameAreaSize.width}×{gameAreaSize.height}</div>
          </div>
        )}
      </div>
      
      {/* HTML5 Audio Element（楽曲再生用） */}
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
        onLoadedMetadata={() => console.log('🎵 音声メタデータ読み込み完了')}
        onError={(e) => console.error('🚨 音声読み込みエラー:', e)}
        onTimeUpdate={() => {
          // 時間同期はstartTimeSyncで別途処理
        }}
      />
    </div>
  );
};

// ===== サブコンポーネント =====
// 注：Phase 3でPIXI.jsレンダリングに移行済み
// HTMLベースのピアノキーボードは削除し、PIXI.js側で統一

export default GameEngineComponent; 