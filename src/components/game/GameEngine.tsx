/**
 * Phase 3: ゲームエンジン + PIXI.js統合 UI コンポーネント
 * ゲームエンジンとPIXI.jsレンダリングの接続
 */

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { PIXINotesRenderer, PIXINotesRendererInstance } from './PIXINotesRenderer';
import { LegendRenderBridge } from './LegendRenderBridge';
import ChordOverlay from './ChordOverlay';
import * as Tone from 'tone';
import { devLog, log } from '@/utils/logger';
import type { ClockSyncPayload } from '@/workers/gameLogicTypes';
import type { JudgmentResult } from '@/types';
import { JudgmentManager } from './managers/JudgmentManager';
import { EffectManager } from './managers/EffectManager';

// iOS検出関数
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
};

type MidiModule = typeof import('@/utils/MidiController');

interface GameEngineComponentProps {
  className?: string;
}

export const GameEngineComponent: React.FC<GameEngineComponentProps> = ({ 
  className 
}) => {
  const {
  gameEngine,
  isPlaying,
    currentSong,
    currentTime,
    settings,
    score,
    mode,
    lastKeyHighlight,
    isSettingsOpen
  } = useGameSelector((state) => ({
    gameEngine: state.gameEngine,
    isPlaying: state.isPlaying,
    currentSong: state.currentSong,
    currentTime: state.currentTime,
    settings: state.settings,
    score: state.score,
    mode: state.mode,
    lastKeyHighlight: state.lastKeyHighlight,
    isSettingsOpen: state.isSettingsOpen
  }));

  const {
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
  } = useGameActions();
  
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const renderBridgeRef = useRef<LegendRenderBridge | null>(null);
  if (!renderBridgeRef.current) {
    renderBridgeRef.current = new LegendRenderBridge();
  }
  const judgmentManagerRef = useRef(new JudgmentManager());
  const effectManagerRef = useRef(new EffectManager());
  const [lastJudgment, setLastJudgment] = useState<JudgmentResult | null>(null);
  const midiModuleRef = useRef<MidiModule | null>(null);
  const ensureMidiModule = useCallback(async (): Promise<MidiModule> => {
    if (midiModuleRef.current) {
      return midiModuleRef.current;
    }
    const module = await import('@/utils/MidiController');
    midiModuleRef.current = module;
    return module;
  }, []);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 800, height: 600 });
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const handlePianoScroll = useCallback(() => {
    if (!isProgrammaticScrollRef.current) {
      hasUserScrolledRef.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      renderBridgeRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const bridge = renderBridgeRef.current;
    if (!bridge) return;
    bridge.attachEngine(gameEngine);
    return () => {
      bridge.attachEngine(null);
    };
  }, [gameEngine]);

  useEffect(() => {
    if (!isPlaying) {
      renderBridgeRef.current?.syncFromEngine();
    }
  }, [currentTime, settings.transpose, settings.notesSpeed, isPlaying]);
  
  useEffect(() => {
    return judgmentManagerRef.current.subscribe((judgment) => {
      setLastJudgment(judgment);
    });
  }, []);

  useEffect(() => {
    if (!gameEngine) return;
    const unsubscribe = gameEngine.addJudgmentListener((judgment) => {
      judgmentManagerRef.current.emit(judgment);
      effectManagerRef.current.fromJudgment(judgment);
    });
    return unsubscribe;
  }, [gameEngine]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const baseOffsetRef = useRef<number>(0);
  const hasStartedRef = useRef(false);
  const currentTimeRef = useRef(currentTime);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const ensureAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!currentSong?.audioFile || currentSong.audioFile.trim() === '') {
        audioBufferRef.current = null;
        setAudioReady(true);
        return;
      }
      setAudioReady(false);
      try {
        const response = await fetch(currentSong.audioFile);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = await ensureAudioContext();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        if (!cancelled) {
          audioBufferRef.current = buffer;
          setAudioReady(true);
          log.info(`🎵 音声ファイル読み込み完了: ${currentSong.audioFile}`);
        }
      } catch (error) {
        if (!cancelled) {
          log.error('🚨 音声読み込み失敗', error);
          setAudioReady(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      audioBufferRef.current = null;
    };
  }, [currentSong?.audioFile, ensureAudioContext]);

  const stopSourceNode = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (error) {
        devLog.debug('source stop failed', error);
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
  }, []);

  const buildClockPayload = useCallback(
    (offset: number): ClockSyncPayload => ({
      logicalTime: offset,
      performanceNow: performance.now(),
      latencyOffset: (settings.latencyAdjustment ?? 0) / 1000,
      playbackSpeed: settings.playbackSpeed ?? 1
    }),
    [settings.latencyAdjustment, settings.playbackSpeed]
  );

  const startPlayback = useCallback(async () => {
    if (!gameEngine) return;
    if (currentSong?.audioFile && !audioReady) return;
    const offset = Math.max(0, currentTimeRef.current);
    const audioContext = await ensureAudioContext();
    const playbackSpeed = settings.playbackSpeed ?? 1;
    stopSourceNode();
    if (audioBufferRef.current) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = playbackSpeed;
      let gain = gainNodeRef.current;
      if (!gain) {
        gain = audioContext.createGain();
        gainNodeRef.current = gain;
      }
      gain.gain.value = settings.musicVolume;
      source.connect(gain).connect(audioContext.destination);
      source.start(0, offset);
      source.onended = () => {
        stopSourceNode();
      };
      sourceNodeRef.current = source;
    }
    const clockPayload = buildClockPayload(offset);
    if (hasStartedRef.current) {
      gameEngine.resume(clockPayload);
    } else {
      gameEngine.start(clockPayload);
      hasStartedRef.current = true;
    }
    baseOffsetRef.current = audioContext.currentTime - offset / playbackSpeed;
    startTimeSync();
  }, [audioReady, buildClockPayload, ensureAudioContext, gameEngine, settings.musicVolume, settings.playbackSpeed, stopSourceNode, currentSong?.audioFile]);

  useEffect(() => {
    if (!gameEngine) return;
    const sync = async (): Promise<void> => {
      if (isPlaying) {
        await startPlayback();
        if (audioControllerRef.current && settings.inputMode === 'audio') {
          audioControllerRef.current.startListening();
        }
      } else {
        stopSourceNode();
        stopTimeSync();
        gameEngine.pause();
        if (audioControllerRef.current) {
          audioControllerRef.current.stopListening();
        }
      }
    };
    void sync();
  }, [isPlaying, gameEngine, startPlayback, stopSourceNode, settings.inputMode]);
  
  // 設定モーダルが開いた時に音楽を一時停止
  useEffect(() => {
    if (isSettingsOpen && isPlaying) {
      pause();
      log.info('⚙️ 設定モーダルを開いたため音楽を一時停止しました');
    }
  }, [isSettingsOpen, isPlaying, pause]);
  
  useEffect(() => {
    if (gainNodeRef.current) {
      const ctx = audioContextRef.current;
      if (ctx) {
        gainNodeRef.current.gain.setTargetAtTime(settings.musicVolume, ctx.currentTime, 0.01);
      } else {
        gainNodeRef.current.gain.value = settings.musicVolume;
      }
    }
  }, [settings.musicVolume]);
  
  useEffect(() => {
    if (!isPlaying) return;
    void startPlayback();
    if (gameEngine) {
      updateEngineSettings();
    }
  }, [settings.playbackSpeed, isPlaying, startPlayback, gameEngine, updateEngineSettings]);
  
  // ===== 時間更新処理を軽量なsetIntervalで復活（競合ループ回避） =====
  const timeIntervalRef = useRef<number | null>(null);
  
    const startTimeSync = () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      
      const updateGameTime = () => {
        if (!useGameStore.getState().isPlaying) return;
        
        const audioCtx = audioContextRef.current;
        const playbackSpeed = settings.playbackSpeed ?? 1;
        const songDuration = useGameStore.getState().currentSong?.duration || 0;
        let newTime: number;
        
        if (audioCtx) {
          const elapsed = (audioCtx.currentTime - baseOffsetRef.current) * playbackSpeed;
          newTime = Math.max(0, elapsed);
        } else {
          newTime = useGameStore.getState().currentTime + 0.05;
        }
        
        updateTime(newTime);
        
        if (songDuration > 0 && newTime >= songDuration) {
          useGameStore.getState().stop();
          if (useGameStore.getState().mode === 'performance') {
            useGameStore.getState().openResultModal();
          }
        }
      };
      
      timeIntervalRef.current = window.setInterval(updateGameTime, 30);
    };
  
  const stopTimeSync = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (!audioContextRef.current || !gameEngine) return;
    const playbackSpeed = settings.playbackSpeed ?? 1;
    const audioCtx = audioContextRef.current;
    const audioTime = (audioCtx.currentTime - baseOffsetRef.current) * playbackSpeed;
    const timeDiff = Math.abs(audioTime - currentTime);
    if (timeDiff > 0.3) {
      const safeTime = Math.max(0, Math.min(currentTime, currentSong?.duration ?? currentTime));
      baseOffsetRef.current = audioCtx.currentTime - safeTime / playbackSpeed;
      gameEngine.seek(safeTime, buildClockPayload(safeTime));
      if (audioControllerRef.current) {
        audioControllerRef.current.pauseProcessingForSeek();
      }
      updateTime(safeTime);
    }
  }, [currentTime, currentSong?.duration, gameEngine, settings.playbackSpeed, buildClockPayload, updateTime]);
  
  // MIDIController管理用のRef
  const midiControllerRef = useRef<any>(null);
  // AudioController管理用のRef（音声入力）
  const audioControllerRef = useRef<any>(null);
  // MIDI 初期化完了フラグ（初期化後に接続エフェクトを確実に発火させる）
  const [isMidiReady, setIsMidiReady] = useState(false);

  // 共通音声システム + MIDIController + AudioController初期化
  useEffect(() => {
    const initAudio = async () => {
      try {
        const midiModule = await ensureMidiModule();
        const { initializeAudioSystem, default: MIDIController } = midiModule;
        await initializeAudioSystem({ light: true });
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
            },
            playMidiSound: true // 通常曲モードでは音声再生を有効
          });
          
          await midiControllerRef.current.initialize();
          log.info('✅ MIDIController初期化完了');
          // 初期化完了を通知（この後の接続用エフェクトを確実に動かす）
          setIsMidiReady(true);
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
  }, [handleNoteInput, settings.inputMode, ensureMidiModule]);

  useEffect(() => {
    void ensureMidiModule();
  }, [ensureMidiModule]);

  // MIDIとPIXIの連携を管理する専用のuseEffect
  useEffect(() => {
    const linkMidiAndPixi = async () => {
      // MIDIコントローラー、PIXIレンダラー、選択デバイスIDの3つが揃ったら実行
        if (midiControllerRef.current && pixiRenderer && settings.selectedMidiDevice) {
          // 1. 鍵盤ハイライト用のコールバックを設定
          midiControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
            pixiRenderer.highlightKey(note, active);
          });
          
          // 2. デバイスに再接続して、設定したコールバックを有効化
          log.info(`🔧 Linking MIDI device (${settings.selectedMidiDevice}) to PIXI renderer.`);
          const success = await midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
          if (success) {
            log.info('✅ MIDI device successfully linked to renderer.');
          } else {
            log.warn('⚠️ Failed to link MIDI device to renderer.');
          }
        } else if (midiControllerRef.current && !settings.selectedMidiDevice) {
          // デバイス選択が解除された場合は切断
          midiControllerRef.current.disconnect();
          log.info('🔌 MIDIデバイス切断');
        }
    };

    linkMidiAndPixi();
    
  }, [pixiRenderer, settings.selectedMidiDevice, isMidiReady]); // MIDI初期化完了後にも発火させる

  // 楽曲変更時にMIDI接続を確認・復元
  useEffect(() => {
    const restoreMidiConnection = async () => {
      if (midiControllerRef.current && settings.selectedMidiDevice && pixiRenderer) {
        const isRestored = await midiControllerRef.current.checkAndRestoreConnection();
        if (isRestored) {
          log.info('✅ 楽曲変更後のMIDI接続を復元しました');
        }
      }
    };

    // 少し遅延を入れて確実に復元
    const timer = setTimeout(restoreMidiConnection, 200);
    return () => clearTimeout(timer);
  }, [currentSong, settings.selectedMidiDevice, pixiRenderer, isMidiReady]); // MIDI初期化完了後にも復元を試行

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
        }
      };
    
    initEngine();
    
    return () => {
        if (gameEngine) {
          destroyGameEngine();
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
        simpleDisplayMode: settings.simpleDisplayMode,
        pianoHeight: settings.pianoHeight,
        transpose: settings.transpose,
        transposingInstrument: settings.transposingInstrument,
        practiceGuide: settings.practiceGuide ?? 'key'
      });
    }
    // AudioControllerに音声入力設定を反映
    if (audioControllerRef.current) {
      audioControllerRef.current.updateConfig({
        pyinThreshold: settings.pyinThreshold
      });
    }
  }, [gameEngine, updateEngineSettings, pixiRenderer, settings.noteNameStyle, settings.simpleDisplayMode, settings.pianoHeight, settings.transpose, settings.transposingInstrument, settings.practiceGuide, settings.pyinThreshold]);
  
  // 練習モードガイド: キーハイライト処理はPIXIRenderer側で直接実行
  
  // トランスポーズに合わせてオーディオのピッチを変更（tempo も変わるが簡易実装）
  useEffect(() => {
    if (!pitchShiftRef.current) {
      return;
    }
    if (settings.transpose === 0) {
      try {
        pitchShiftRef.current.dispose();
      } catch (err) {
        log.warn('PitchShift dispose failed', err);
      }
      pitchShiftRef.current = null;
      return;
    }
    (pitchShiftRef.current as any).pitch = settings.transpose;
  }, [settings.transpose]);
  
  // ゲームエリアのリサイズ対応（ResizeObserver 使用）
  useEffect(() => {
    if (!gameAreaRef.current) return;

    let resizeTimer: number | null = null;
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

      // 横スクロールが必要かチェック（画面幅が1100px未満の場合）
      const needsHorizontalScroll = newSize.width < 1100;

      // ストアに反映
      updateSettings({
        viewportHeight: newSize.height,
        pianoHeight: dynamicPianoHeight,
        // 横スクロールが必要な場合、シークバーをデフォルトで非表示
        ...(settings.showSeekbar === undefined && needsHorizontalScroll ? { showSeekbar: false } : {})
      });
      updateEngineSettings();
    };

    // デバウンス付きのサイズ更新
    const debouncedUpdateSize = () => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        updateSize();
      }, 100);
    };

    // 初回サイズ取得
    updateSize();

    // ResizeObserver でコンテナサイズ変化を監視
    const observer = new ResizeObserver((entries) => {
      // ResizeObserver loop エラーを防ぐためのガード
      if (!entries || entries.length === 0) return;
      
      // requestAnimationFrameを使用してレイアウト計算を次のフレームに延期
      requestAnimationFrame(() => {
        debouncedUpdateSize();
      });
    });
    
    observer.observe(gameAreaRef.current);

    // サブで window サイズ変化も監視（iOS Safari 回転等に保険）
    window.addEventListener('resize', debouncedUpdateSize);

    return () => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }
      observer.disconnect();
      window.removeEventListener('resize', debouncedUpdateSize);
    };
  }, [updateSettings, updateEngineSettings, settings]);
  
  // ================= ピアノキー演奏ハンドラー =================
  const handlePianoKeyPress = useCallback((note: number) => {
    handleNoteInput(note);
    void ensureMidiModule()
      .then(({ playNote }) => playNote(note, 64))
      .catch((error) => {
        log.error('❌ Piano key play error:', error);
      });
  }, [handleNoteInput, ensureMidiModule]);

  // ================= ピアノキーリリースハンドラー =================
  const handlePianoKeyRelease = useCallback((note: number) => {
    const immediateStop = midiModuleRef.current?.stopNote;
    if (immediateStop) {
      immediateStop(note);
      return;
    }
    void ensureMidiModule()
      .then(({ stopNote }) => {
        stopNote(note);
      })
      .catch((error) => {
        log.error('❌ Piano key release error:', error);
      });
  }, [ensureMidiModule]);

  // ================= PIXI.js レンダラー準備完了ハンドラー =================
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    if (!renderer) {
      // 破棄通知
      renderBridgeRef.current?.attachRenderer(null);
      setPixiRenderer(null);
      return;
    }
    
      log.info('🎮 PIXI.js renderer ready, setting up callbacks...');
    setPixiRenderer(renderer);
    renderBridgeRef.current?.attachRenderer(renderer);
    
    // 初期設定を反映
    renderer.updateSettings({
      noteNameStyle: settings.noteNameStyle,
      simpleDisplayMode: settings.simpleDisplayMode,
      pianoHeight: settings.pianoHeight,
      transpose: settings.transpose,
      transposingInstrument: settings.transposingInstrument,
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
      });
      
      log.info('✅ MIDIController ↔ PIXIレンダラー連携完了');
    }

    // AudioControllerにキーハイライト機能を設定
    if (audioControllerRef.current) {
      audioControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
        renderer.highlightKey(note, active);
      });
      
      // 既に接続済みのデバイスがある場合、接続状態を確認して再設定
      if (audioControllerRef.current.isConnected() && settings.selectedAudioDevice) {
        audioControllerRef.current.connectDevice(settings.selectedAudioDevice).catch((error: unknown) => {
          log.warn('⚠️ 音声デバイス再接続エラー:', error);
        });
      }
      
      log.info('✅ AudioController ↔ PIXIレンダラー連携完了');
    }
    
    log.info('🎮 PIXI.js ノーツレンダラー準備完了');
  }, [handlePianoKeyPress, handlePianoKeyRelease, settings.noteNameStyle, settings.simpleDisplayMode, settings.pianoHeight, settings.transpose, settings.transposingInstrument, settings.selectedMidiDevice]);
  
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
  
  // ===== 初期スクロール位置: C4を中央に =====
  useEffect(() => {
    const container = pianoScrollRef.current;
    if (!container) return;

    const centerC4 = () => {
      if (hasUserScrolledRef.current) return;
      const contentWidth = container.scrollWidth;
      const viewportWidth = container.clientWidth;
      if (!contentWidth || !viewportWidth) return;
      if (contentWidth <= viewportWidth) return;
      const TOTAL_WHITE_KEYS = 52;
      const C4_WHITE_INDEX = 23; // A0=0 ... C4=23
      const whiteKeyWidth = contentWidth / TOTAL_WHITE_KEYS;
      const c4CenterX = (C4_WHITE_INDEX + 0.5) * whiteKeyWidth;
      const desiredScroll = Math.max(0, Math.min(contentWidth - viewportWidth, c4CenterX - viewportWidth / 2));
      isProgrammaticScrollRef.current = true;
      container.scrollLeft = desiredScroll;
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    };

    const raf = requestAnimationFrame(centerC4);
    const handleResize = () => requestAnimationFrame(centerC4);
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      <span className="sr-only" aria-live="assertive">
        {lastJudgment ? `判定: ${lastJudgment.type}` : ''}
      </span>
      {/* Phase 3: PIXI.js ノーツ表示エリア - フル高さ */}
      <div 
        ref={gameAreaRef}
        className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden"
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
            <div 
              className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x pixi-mobile-scroll custom-game-scrollbar" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'none',
                scrollBehavior: 'auto'
              }}
              onScroll={handlePianoScroll}
              ref={pianoScrollRef}
            >
              <div style={{ 
                width: idealWidth, 
                height: '100%',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                position: 'relative'
              }}>
                {/* ピアノエリアのタッチブロッカー - 削除（PIXIレベルで制御） */}
                
                  <PIXINotesRenderer
                    width={idealWidth}
                    height={gameAreaSize.height}
                    onReady={handlePixiReady}
                    className="w-full h-full"
                    effectManager={effectManagerRef.current}
                  />
                <ChordOverlay />
              </div>
            </div>
          );
        })()}
        
      </div>
    </div>
  );
};

// ===== サブコンポーネント =====
// 注：Phase 3でPIXI.jsレンダリングに移行済み
// HTMLベースのピアノキーボードは削除し、PIXI.js側で統一

export default GameEngineComponent; 