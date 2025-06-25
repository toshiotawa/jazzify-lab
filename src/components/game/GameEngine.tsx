/**
 * Phase 3: ゲームエンジン + PIXI.js統合 UI コンポーネント
 * ゲームエンジンとPIXI.jsレンダリングの接続
 */

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { PIXINotesRenderer, PIXINotesRendererInstance } from './PIXINotesRenderer';
import * as Tone from 'tone';

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
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
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

    const run = async () => {
      const audio = audioRef.current!;

      if (isPlaying) {
        // 1) AudioContext を初期化 (存在しなければ)
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current!;

        // 2) MediaElementSource を生成（初回のみ）
        if (!mediaSourceRef.current) {
          mediaSourceRef.current = audioContext.createMediaElementSource(audio);
        }

        // 3) Tone.js PitchShift エフェクトを初期化（初回のみ）
        if (!pitchShiftRef.current) {
          try {
            await Tone.start();
          } catch (err) {
            console.warn('Tone.start() failed or was already started', err);
          }

          // Tone.js が独自の AudioContext を持っている場合、現在のものに切り替え
          try {
            // Tone v14 以降は setContext が存在
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (Tone.setContext) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              Tone.setContext(audioContext);
            } else {
              // 旧API
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              Tone.context = audioContext;
            }
          } catch (err) {
            console.warn('Tone context assignment failed', err);
          }

          pitchShiftRef.current = new Tone.PitchShift({ pitch: settings.transpose }).toDestination();
        }

        // 4) Web Audio → Tone.js エフェクトへ橋渡し
        try {
          mediaSourceRef.current.disconnect();
        } catch (_) {/* already disconnected */}

        try {
          // Tone.connect を使用するとネイティブ AudioNode と ToneAudioNode を安全に接続できる
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          Tone.connect(mediaSourceRef.current, pitchShiftRef.current);
        } catch (err) {
          console.error('Tone.connect failed:', err);
        }

        // 5) AudioContext を resume し、再生位置を同期
        audioContext.resume();

        const syncTime = Math.max(0, currentTime);
        audio.currentTime = syncTime;

        // 6) AudioContext と HTMLAudio のオフセットを記録
        baseOffsetRef.current = audioContext.currentTime - syncTime;

        // 7) GameEngine を AudioContext に紐付けて開始
        gameEngine.start(audioContext);
        gameEngine.seek(syncTime);

        // 8) HTMLAudio 再生 (AudioContext と同軸)
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
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // 設定変更時の更新（transpose を含む）
  useEffect(() => {
    if (gameEngine) {
      updateEngineSettings();
    }
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        keyboardNoteNameStyle: settings.keyboardNoteNameStyle ?? 'abc',
        noteNoteNameStyle: settings.noteNoteNameStyle ?? 'abc',
        noteAccidentalStyle: settings.noteAccidentalStyle ?? 'sharp',
        pianoHeight: settings.pianoHeight,
        transpose: settings.transpose,
        practiceGuide: settings.practiceGuide ?? 'key'
      });
    }
  }, [gameEngine, updateEngineSettings, pixiRenderer, settings.keyboardNoteNameStyle, settings.noteNoteNameStyle, settings.noteAccidentalStyle, settings.pianoHeight, settings.transpose]);
  
  // トランスポーズに合わせてオーディオのピッチを変更（tempo も変わるが簡易実装）
  useEffect(() => {
    if (pitchShiftRef.current) {
      // Tone.PitchShift の pitch プロパティは semitones
      (pitchShiftRef.current as any).pitch = settings.transpose;
    }
  }, [settings.transpose]);
  
  // ゲームエリアのリサイズ対応（ResizeObserver 使用）
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: rect.width || 800,
        height: rect.height || 600
      };
      setGameAreaSize(newSize);

      // 小さい画面では鍵盤高さを縮小（横幅ベースで算出）
      const dynamicPianoHeight = Math.max(40, Math.min(100, newSize.width / 6));

      // ストアに反映
      updateSettings({
        viewportHeight: newSize.height,
        pianoHeight: dynamicPianoHeight
      });
      updateEngineSettings();
    };

    // 初回サイズ取得
    updateSize();

    // ResizeObserver でコンテナサイズ変化を監視
    const observer = new ResizeObserver(updateSize);
    observer.observe(gameAreaRef.current);

    // サブで window サイズ変化も監視（iOS Safari 回転等に保険）
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [updateSettings, updateEngineSettings]);
  
  // ================= ピアノキー演奏ハンドラー =================
  const handlePianoKeyPress = useCallback((note: number) => {
    // PIXI.jsピアノキーのハイライト
    if (pixiRenderer) {
      pixiRenderer.highlightKey(note, true);
      setTimeout(() => {
        pixiRenderer.highlightKey(note, false);
      }, 150);
    }
    // ゲームエンジンにノート入力
    handleNoteInput(note);
  }, [pixiRenderer, handleNoteInput]);

  // ================= PIXI.js レンダラー準備完了ハンドラー =================
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    if (!renderer) {
      // 破棄通知
      setPixiRenderer(null);
      return;
    }
    
    console.log('🎮 PIXI.js renderer ready, setting up callbacks...');
    setPixiRenderer(renderer);
    
    // 初期設定を反映
    renderer.updateSettings({
      keyboardNoteNameStyle: settings.keyboardNoteNameStyle ?? 'abc',
      noteNoteNameStyle: settings.noteNoteNameStyle ?? 'abc',
      noteAccidentalStyle: settings.noteAccidentalStyle ?? 'sharp',
      pianoHeight: settings.pianoHeight,
      transpose: settings.transpose,
      practiceGuide: settings.practiceGuide ?? 'key'
    });
    
    // ピアノキーボードのクリックイベントを接続
    renderer.setKeyCallbacks(
      (note: number) => {
        handlePianoKeyPress(note);
      }, // キー押下
      (note: number) => {
        if (renderer) {
          renderer.highlightKey(note, false);
        }
      } // キー解放
    );
    
    console.log('🎮 PIXI.js ノーツレンダラー準備完了');
  }, [handlePianoKeyPress, settings.keyboardNoteNameStyle, settings.noteNoteNameStyle, settings.noteAccidentalStyle, settings.pianoHeight]);
  
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
    <div className={cn("space-y-4", className)}>
      {/* ==== フローティング ステータスメニュー ==== */}
      <div className="fixed top-20 left-4 z-40 pointer-events-none select-none">
        <div className="bg-black bg-opacity-70 text-white text-xs rounded-md shadow px-3 py-2 space-y-1">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isEngineReady ? "bg-green-400" : "bg-yellow-400"
            )} />
            <span>ゲームエンジン: {isEngineReady ? "準備完了" : "初期化中..."}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              audioLoaded ? "bg-green-400" : "bg-red-500"
            )} />
            <span>音声: {audioLoaded ? "読み込み完了" : "読み込み中..."}</span>
          </div>
          <div className="text-right">
            アクティブノーツ: {engineActiveNotes.length}
          </div>
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