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
import { log, perfLog, devLog } from '@/utils/logger';

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
    score,
    mode,
    lastKeyHighlight,
    isSettingsOpen,
    initializeGameEngine,
    destroyGameEngine,
    handleNoteInput,
    updateEngineSettings,
    updateSettings,
    updateTime,
    stop,
    pause,
    setLastKeyHighlight,
    openResultModal
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
  
  // 🔧 追加: グローバルアクセス用に参照を公開（再生中のシーク対応）
  useEffect(() => {
    (window as any).__gameAudioRef = audioRef;
    (window as any).__gameAudioContextRef = audioContextRef;
    (window as any).__gameBaseOffsetRef = baseOffsetRef;
    
    return () => {
      delete (window as any).__gameAudioRef;
      delete (window as any).__gameAudioContextRef;
      delete (window as any).__gameBaseOffsetRef;
    };
  }, []);
  
  // 楽曲読み込み時の音声設定
  useEffect(() => {
    if (currentSong?.audioFile && currentSong.audioFile.trim() !== '' && audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setAudioLoaded(true);
        log.info(`🎵 音声ファイル読み込み完了: ${audio.duration}秒`);
        devLog.debug(`🎵 音声ファイル詳細:`, {
          src: audio.src,
          duration: audio.duration,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
      };
      
      const handleError = (e: any) => {
        log.error(`🚨 音声読み込みエラー詳細:`, {
          error: e,
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          lastError: audio.error
        });
        setAudioLoaded(false);
      };
      
      const handleCanPlay = () => {
        devLog.debug('🎵 音声再生可能状態に到達');
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);
      
      log.info(`🎵 音声ファイル読み込み開始: ${currentSong.audioFile}`);
      audio.src = currentSong.audioFile;
      audio.volume = settings.musicVolume;
      audio.preload = 'metadata';
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
      };
    } else if (currentSong && (!currentSong.audioFile || currentSong.audioFile.trim() === '')) {
      // 音声ファイルなしの楽曲の場合
      log.info(`🎵 音声なしモードで楽曲を読み込み: ${currentSong.title}`);
      setAudioLoaded(true); // 音声なしでも "読み込み完了" として扱う
    } else {
      setAudioLoaded(false);
    }
  }, [currentSong?.audioFile, settings.musicVolume]);
  
  // 再生状態同期
  useEffect(() => {
    if (!gameEngine) return;

    const run = async () => {
      if (isPlaying) {
        // 音声ファイルありの場合とnしの場合で分岐
        const hasAudio = currentSong?.audioFile && currentSong.audioFile.trim() !== '' && audioRef.current && audioLoaded;
        
        if (hasAudio) {
          // === 音声ありモード ===
          const audio = audioRef.current!;

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
            log.warn('Tone.start() failed or was already started', err);
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
              // 旧API - コンテキストの直接代入は避ける
              log.warn('Unable to set Tone.js context - using default context');
            }
          } catch (err) {
            log.warn('Tone context assignment failed', err);
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
          log.error('Tone.connect failed:', err);
        }

        // 5) AudioContext を resume し、再生位置を同期
        audioContext.resume();

        // ==== 再生スピード適用 ====
        audio.playbackRate = settings.playbackSpeed;
        // ピッチ保持を試みる（ブラウザによって実装が異なる）
        try {
          // @ts-ignore - ベンダープレフィックス対応
          audio.preservesPitch = true;
          // @ts-ignore
          audio.mozPreservesPitch = true;
          // @ts-ignore
          audio.webkitPreservesPitch = true;
        } catch (_) {/* ignore */}

        // 🔧 修正: 再開時は gameEngine の正確な時間を使用
        const syncTime = gameEngine ? Math.max(0, gameEngine.getState().currentTime) : Math.max(0, currentTime);
        audio.currentTime = syncTime;

        // 6) AudioContext と HTMLAudio のオフセットを記録
        // 再生速度を考慮した正確な baseOffset 計算
        const realTimeElapsed = syncTime / settings.playbackSpeed;
        baseOffsetRef.current = audioContext.currentTime - realTimeElapsed;

        // 7) GameEngine を AudioContext に紐付けて開始
        gameEngine.start(audioContext);
        gameEngine.seek(syncTime);

        // 8) HTMLAudio 再生 (AudioContext と同軸)
        audio.play().catch(e => log.error('音声再生エラー:', e));
        } else {
          // === 音声なしモード ===
          log.info('🎵 音声なしモードでゲームエンジンを開始');
          
          // AudioContextを簡易作成
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const audioContext = audioContextRef.current!;
          audioContext.resume();

          // 🔧 修正: 音声なしモードでも gameEngine の正確な時間を使用
          const syncTime = gameEngine ? Math.max(0, gameEngine.getState().currentTime) : Math.max(0, currentTime);
          
          // ゲームエンジンを開始（音声同期なし）
          gameEngine.start(audioContext);
          gameEngine.seek(syncTime);
          
          // 音声なしモードでも baseOffset を適切に設定
          const realTimeElapsed = syncTime / settings.playbackSpeed;
          baseOffsetRef.current = audioContext.currentTime - realTimeElapsed;
        }

        startTimeSync();

        // 音声入力開始（再生中のみ）
        if (audioControllerRef.current && settings.inputMode === 'audio') {
          audioControllerRef.current.startListening();
          log.info('🎤 音声ピッチ検出開始');
        }
      } else {
        // 一時停止処理
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        // GameEngineを一時停止
        gameEngine.pause();
        log.info('🎮 GameEngine paused');

        // 音声入力停止
        if (audioControllerRef.current) {
          audioControllerRef.current.stopListening();
          log.info('🎤 音声ピッチ検出停止');
        }
        
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
  
  // 設定モーダルが開いた時に音楽を一時停止
  useEffect(() => {
    if (isSettingsOpen && isPlaying) {
      pause();
      log.info('⚙️ 設定モーダルを開いたため音楽を一時停止しました');
    }
  }, [isSettingsOpen, isPlaying, pause]);
  
  // 音量変更の同期
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume;
    }
  }, [settings.musicVolume]);
  
  // 再生スピード変更の同期
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackSpeed;

      // ピッチを保持
      try {
        // @ts-ignore
        audioRef.current.preservesPitch = true;
        // @ts-ignore
        audioRef.current.mozPreservesPitch = true;
        // @ts-ignore
        audioRef.current.webkitPreservesPitch = true;
      } catch (_) {/* ignore */}
    }

    // 🔧 追加: 再生中に速度が変更された場合、baseOffsetRefを再計算
    if (audioContextRef.current && isPlaying) {
      const currentLogicalTime = currentTime;
      // 新しい速度での経過時間を計算し、baseOffsetを調整
      const newElapsedReal = currentLogicalTime / settings.playbackSpeed;
      baseOffsetRef.current = audioContextRef.current.currentTime - newElapsedReal;
      
      // ログ削除: FPS最適化のため
      // devLog.debug(`🔧 再生速度変更: ${settings.playbackSpeed}x - baseOffset再計算完了`);
    }

    // GameEngine にも設定を反映
    if (gameEngine) {
      updateEngineSettings();
    }
  }, [settings.playbackSpeed, gameEngine, updateEngineSettings, isPlaying, currentTime]);
  
  // 時間同期ループ
  const startTimeSync = useCallback(() => {
    const syncTime = () => {
      if (audioContextRef.current && isPlaying) {
        const audioCtxTime = audioContextRef.current.currentTime;
        const logicalTime = (audioCtxTime - baseOffsetRef.current) * settings.playbackSpeed;
        updateTime(logicalTime);
        
        // 楽曲終了チェック
        if (logicalTime >= (currentSong?.duration || 0)) {
          stop();
          openResultModal();
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(syncTime);
      }
    };
    syncTime();
  }, [isPlaying, currentSong?.duration, updateTime, stop, settings.playbackSpeed, openResultModal]);
  
  const stopTimeSync = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  // シーク機能（音声ありと音声なし両方対応）
  useEffect(() => {
    if (audioContextRef.current && gameEngine) {
      const hasAudio = currentSong?.audioFile && currentSong.audioFile.trim() !== '' && audioRef.current && audioLoaded;
      
      if (hasAudio) {
        // 音声ありの場合: 音声とゲームエンジンの同期
      const audioTime = (audioContextRef.current.currentTime - baseOffsetRef.current) * settings.playbackSpeed;
      const timeDiff = Math.abs(audioTime - currentTime);
      // 0.3秒以上のずれがある場合のみシーク（より厳密な同期）
      if (timeDiff > 0.3) {
        const safeTime = Math.max(0, Math.min(currentTime, (currentSong?.duration || currentTime)));
        if (audioRef.current) audioRef.current.currentTime = safeTime;
        
        // オフセット再計算（再生速度を考慮）
        if (audioContextRef.current) {
          const realTimeElapsed = safeTime / settings.playbackSpeed;
          baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
        }
        
        // GameEngineも同時にシーク
          gameEngine.seek(safeTime);
          
          // AudioControllerの音声ピッチ検出を一時停止（シーク時の誤検出防止）
          if (audioControllerRef.current) {
            audioControllerRef.current.pauseProcessingForSeek();
          }
          
          devLog.debug(`🔄 Audio & GameEngine synced to ${safeTime.toFixed(2)}s`);
        }
      } else {
        // 音声なしの場合: ゲームエンジンのみシーク
        const timeDiff = Math.abs((audioContextRef.current.currentTime - baseOffsetRef.current) * settings.playbackSpeed - currentTime);
        if (timeDiff > 0.3) {
          const safeTime = Math.max(0, Math.min(currentTime, (currentSong?.duration || currentTime)));
          
          // オフセット再計算（音声なしモード、再生速度を考慮）
          const realTimeElapsed = safeTime / settings.playbackSpeed;
          baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
          
          // GameEngineシーク
          gameEngine.seek(safeTime);
          
          // AudioControllerの音声ピッチ検出を一時停止（シーク時の誤検出防止）
          if (audioControllerRef.current) {
            audioControllerRef.current.pauseProcessingForSeek();
          }
          
          devLog.debug(`🔄 GameEngine (音声なし) synced to ${safeTime.toFixed(2)}s`);
        }
      }
    }
  }, [currentTime, audioLoaded, gameEngine, settings.playbackSpeed]);
  
  // MIDIController管理用のRef
  const midiControllerRef = useRef<any>(null);
  // AudioController管理用のRef（音声入力）
  const audioControllerRef = useRef<any>(null);

  // 共通音声システム + MIDIController + AudioController初期化
  useEffect(() => {
    const initAudio = async () => {
      try {
        const { initializeAudioSystem } = await import('@/utils/MidiController');
        const { default: MIDIController } = await import('@/utils/MidiController');
        await initializeAudioSystem();
        log.info('✅ 共通音声システム初期化完了');
        
        // MIDIController インスタンスを作成
        if (!midiControllerRef.current) {
          midiControllerRef.current = new MIDIController({
            onNoteOn: (note: number, velocity?: number) => {
              handleNoteInput(note);
            },
            onNoteOff: (note: number) => {
              // ノートオフの処理（必要に応じて）
            },
            onConnectionChange: (connected: boolean) => {
              log.info(`🎹 MIDI接続状態変更: ${connected ? '接続' : '切断'}`);
            }
          });
          
          await midiControllerRef.current.initialize();
          log.info('✅ MIDIController初期化完了');
        }

        // AudioController インスタンスを作成（音声入力が有効な場合）
        if (!audioControllerRef.current && settings.inputMode === 'audio') {
          const { AudioController } = await import('../../../AudioController');
          audioControllerRef.current = new AudioController({
            onNoteOn: (note: number, velocity?: number) => {
              handleNoteInput(note);
              log.info(`🎤 Audio detected note: ${note}`);
            },
            onNoteOff: (note: number) => {
              // ノートオフの処理（必要に応じて）
            },
            onConnectionChange: (connected: boolean) => {
              log.info(`🎤 Audio接続状態変更: ${connected ? '接続' : '切断'}`);
            }
          });
          
          log.info('✅ AudioController初期化完了');

          // 初期設定を反映
          audioControllerRef.current.updateConfig({
            pyinThreshold: settings.pyinThreshold
          });

          // PIXIレンダラーが既に準備完了している場合はコールバックを設定
          if (pixiRenderer) {
            audioControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
              pixiRenderer.highlightKey(note, active);
            });
            audioControllerRef.current.setKeyPressEffectCallback((note: number) => {
              pixiRenderer.triggerKeyPressEffect(note);
            });
            log.info('✅ AudioController ↔ PIXIレンダラー コールバック再設定');
          }
        } else if (audioControllerRef.current && settings.inputMode === 'midi') {
          // MIDI専用モードの場合、AudioControllerを停止
          await audioControllerRef.current.disconnect();
          audioControllerRef.current = null;
          log.info('🔌 AudioController無効化（MIDI専用モード）');
        }
      } catch (audioError) {
        log.warn('⚠️ 音声/MIDIシステム初期化に失敗 (ユーザーインタラクション後に再試行):', audioError);
      }
    };
    
    initAudio();
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
      if (audioControllerRef.current) {
        audioControllerRef.current.disconnect();
        audioControllerRef.current = null;
      }
    };
  }, [handleNoteInput, settings.inputMode]);

  // MIDIデバイス選択変更監視（タイミングを調整）
  useEffect(() => {
    const connectMidiDevice = async () => {
      if (midiControllerRef.current && settings.selectedMidiDevice) {
        log.info(`🎹 MIDIデバイス接続試行: ${settings.selectedMidiDevice}`);
        
        // PIXIレンダラーが準備完了していない場合は接続を延期
        if (!pixiRenderer) {
          return;
        }
        
        const success = await midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
        if (success) {
          log.info('✅ MIDIデバイス接続成功');
        } else {
          log.warn('⚠️ MIDIデバイス接続失敗');
        }
      } else if (midiControllerRef.current && !settings.selectedMidiDevice) {
        // デバイス選択が解除された場合は切断
        midiControllerRef.current.disconnect();
        log.info('🔌 MIDIデバイス切断');
      }
    };
    
    connectMidiDevice();
  }, [settings.selectedMidiDevice, pixiRenderer]); // pixiRendererを依存配列に追加

  // 音声デバイス選択変更監視
  useEffect(() => {
    const connectAudioDevice = async () => {
      if (audioControllerRef.current && settings.selectedAudioDevice) {
        log.info(`🎤 音声デバイス接続試行: ${settings.selectedAudioDevice}`);
        
        // PIXIレンダラーが準備完了していない場合は接続を延期
        if (!pixiRenderer) {
          return;
        }
        
        const success = await audioControllerRef.current.connectDevice(settings.selectedAudioDevice);
        if (success) {
          log.info('✅ 音声デバイス接続成功');
        } else {
          log.warn('⚠️ 音声デバイス接続失敗');
        }
      } else if (audioControllerRef.current && !settings.selectedAudioDevice) {
        // デバイス選択が解除された場合は切断
        await audioControllerRef.current.disconnect();
        log.info('🔌 音声デバイス切断');
      }
    };
    
    connectAudioDevice();
  }, [settings.selectedAudioDevice, pixiRenderer]);

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
  
  // 練習モードガイド: GameEngineのキーハイライトコールバック設定
  useEffect(() => {
    if (gameEngine) {
      // GameEngine から渡される timestamp は AudioContext のタイムラインを基準としているため、
      // React 側のパフォーマンスタイムラインと整合しない場合がある。
      // UI 側では performance.now() ベースで扱うことで、過去 0.5s 以内かどうかを正しく判定できるようにする。
      gameEngine.setKeyHighlightCallback((pitch: number, _timestamp: number) => {
        // performance.now() は ms 単位なので秒に変換
        const wallClockSec = performance.now() / 1000;
        setLastKeyHighlight(pitch, wallClockSec);
      });
      log.info('🎹 練習モードガイド: GameEngineキーハイライトコールバック設定完了');
    }
  }, [gameEngine, setLastKeyHighlight]);
  
  // 練習モードガイド: キーハイライト処理
  useEffect(() => {
    if (lastKeyHighlight && pixiRenderer && settings.practiceGuide !== 'off' && isPlaying) {
      const { pitch, timestamp } = lastKeyHighlight;
      const currentTimestamp = performance.now() / 1000;
      
      // タイムスタンプが新しい場合のみハイライトを実行（重複防止）
      if (currentTimestamp - timestamp < 0.5) { // 0.5秒以内の通知のみ処理
        
        // キーをハイライト
        pixiRenderer.highlightKey(pitch, true);
        
        // 一定時間後にハイライトを解除
        setTimeout(() => {
          if (pixiRenderer) {
            pixiRenderer.highlightKey(pitch, false);
          }
        }, 150); // 150ms後にハイライト解除（マウスクリックと同じ長さ）
      }
    }
  }, [lastKeyHighlight, pixiRenderer, settings.practiceGuide, isPlaying]);
  
  // 設定変更時の更新（transpose を含む）
  useEffect(() => {
    if (gameEngine) {
      updateEngineSettings();
    }
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        noteNameStyle: settings.noteNameStyle,

        pianoHeight: settings.pianoHeight,
        transpose: settings.transpose,
        practiceGuide: settings.practiceGuide ?? 'key'
      });
    }
    // AudioControllerに音声入力設定を反映
    if (audioControllerRef.current) {
      audioControllerRef.current.updateConfig({
        pyinThreshold: settings.pyinThreshold
      });
    }
  }, [gameEngine, updateEngineSettings, pixiRenderer, settings.noteNameStyle, settings.pianoHeight, settings.transpose, settings.practiceGuide, settings.pyinThreshold]);
  
  // 練習モードガイド: キーハイライト処理はPIXIRenderer側で直接実行
  
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
  const handlePianoKeyPress = useCallback(async (note: number) => {
    try {
      // 共通音声システムで音を鳴らす
      const { playNote } = await import('@/utils/MidiController');
      await playNote(note, 100); // マウス/タッチ用の固定velocity
      
      // ゲームエンジンにノート入力（ハイライトはGameEngineの状態更新に委ねる）
      handleNoteInput(note);
      
      // 注意: キーハイライトは削除し、GameEngineの判定ロジックに完全に委ねました
      // これにより、マウスクリックとキーボード入力で一貫したエフェクト表示が実現されます
      
      // ログ削除: FPS最適化のため
    // devLog.debug(`🎹 Piano key played: ${note}`);
    } catch (error) {
      log.error('❌ Piano key play error:', error);
    }
  }, [handleNoteInput]);

  // ================= ピアノキーリリースハンドラー =================
  const handlePianoKeyRelease = useCallback(async (note: number) => {
    try {
      // 共通音声システムで音を止める
      const { stopNote } = await import('@/utils/MidiController');
      stopNote(note);
      
      // 注意: ハイライト解除も削除し、GameEngineの状態更新に完全に委ねました
      
      // ログ削除: FPS最適化のため
    // devLog.debug(`🎹 Piano key released: ${note}`);
    } catch (error) {
      log.error('❌ Piano key release error:', error);
    }
  }, []);

  // ================= PIXI.js レンダラー準備完了ハンドラー =================
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    if (!renderer) {
      // 破棄通知
      setPixiRenderer(null);
      return;
    }
    
    log.info('🎮 PIXI.js renderer ready, setting up callbacks...');
    setPixiRenderer(renderer);
    
    // 初期設定を反映
    renderer.updateSettings({
      noteNameStyle: settings.noteNameStyle,
      
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
        handlePianoKeyRelease(note);
      } // キー解放
    );
    
    // MIDIControllerにキーハイライト機能を設定
    if (midiControllerRef.current) {
      midiControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
        renderer.highlightKey(note, active);
        // アクティブ(ノートオン)時に即時エフェクトを発火
        if (active) {
          renderer.triggerKeyPressEffect(note);
        }
      });
      
      // 既に接続済みのデバイスがある場合、接続状態を確認して再設定
      if (midiControllerRef.current.isConnected() && settings.selectedMidiDevice) {
        midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
      }
      
      log.info('✅ MIDIController ↔ PIXIレンダラー連携完了');
    }

    // AudioControllerにキーハイライト機能を設定
    if (audioControllerRef.current) {
      audioControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
        renderer.highlightKey(note, active);
      });
      
      // AudioControllerにキープレスエフェクト機能を設定
      audioControllerRef.current.setKeyPressEffectCallback((note: number) => {
        renderer.triggerKeyPressEffect(note);
      });
      
      // 既に接続済みのデバイスがある場合、接続状態を確認して再設定
      if (audioControllerRef.current.isConnected() && settings.selectedAudioDevice) {
        audioControllerRef.current.connectDevice(settings.selectedAudioDevice);
      }
      
      log.info('✅ AudioController ↔ PIXIレンダラー連携完了');
    }
    
    log.info('🎮 PIXI.js ノーツレンダラー準備完了');
  }, [handlePianoKeyPress, handlePianoKeyRelease, settings.noteNameStyle, settings.pianoHeight, settings.selectedMidiDevice]);
  
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
    <div className={cn("h-full w-full flex flex-col", className)}>
      {/* ==== フローティング ステータスメニュー ==== */}
      <div className="fixed bottom-20 left-4 z-40 pointer-events-none select-none">
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
        {/* GOOD / MISS オーバーレイ */}
        {mode === 'performance' && (
        <div className="absolute top-3 left-3 z-20 text-lg font-bold bg-black bg-opacity-70 px-3 py-2 rounded-lg pointer-events-none">
          <span className="text-green-400">✓ {score.goodCount}</span>
          <span className="mx-3 text-gray-500">|</span>
          <span className="text-red-400">× {score.missCount}</span>
        </div>
        )}
        {/* PIXI.js ノーツレンダラー（統合済み） */}
        {(() => {
          const TOTAL_WHITE_KEYS = 52; // 88鍵ピアノの白鍵数
          const VISIBLE_WHITE_KEYS = 24; // モバイルで画面に収めたい白鍵数(約2オクターブ)
          const MIN_WHITE_KEY_PX = 22;   // PC での最小白鍵幅

          const fullWidthAtMin = TOTAL_WHITE_KEYS * MIN_WHITE_KEY_PX; // 1144px
          const adjustedThreshold = 1100; // paddingを考慮した実用的な閾値

          let idealWidth: number;
          let displayMode: string;
          if (gameAreaSize.width >= adjustedThreshold) {
            // PC 等、画面が十分広い → 88鍵全表示（スクロール不要）
            idealWidth = gameAreaSize.width;
            displayMode = 'PC_FULL_88_KEYS';
          } else {
            // モバイル等、画面が狭い → 横スクロール表示
            const whiteKeyWidth = gameAreaSize.width / VISIBLE_WHITE_KEYS;
            idealWidth = Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth);
            displayMode = 'MOBILE_SCROLL';
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
        onLoadedMetadata={() => log.info('🎵 音声メタデータ読み込み完了')}
        onError={(e) => log.error('🚨 音声読み込みエラー:', e)}
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