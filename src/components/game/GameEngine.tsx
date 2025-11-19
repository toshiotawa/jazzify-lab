/**
 * Phase 3: ゲームエンジン + PIXI.js統合 UI コンポーネント
 * ゲームエンジンとPIXI.jsレンダリングの接続
 */

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState, useRef, useLayoutEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { PIXINotesRenderer, PIXINotesRendererInstance } from './PIXINotesRenderer';
import { LegendRenderBridge } from './LegendRenderBridge';
import ChordOverlay from './ChordOverlay';
import * as Tone from 'tone';
import { devLog, log } from '@/utils/logger';

const TOTAL_WHITE_KEYS = 52;
const VISIBLE_WHITE_KEYS = 24;
const MOBILE_SCROLL_BREAKPOINT = 1100;
const MIN_PIANO_ZOOM = 1;
const MAX_PIANO_ZOOM = 2.5;

interface PinchState {
  startDistance: number;
  startZoom: number;
  originRatio: number;
  viewportOffset: number;
}

const clampZoomValue = (value: number): number => Math.min(MAX_PIANO_ZOOM, Math.max(MIN_PIANO_ZOOM, value));

const getTouchDistance = (touchA: React.Touch, touchB: React.Touch): number => {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
};

const getTouchMidpointX = (touchA: React.Touch, touchB: React.Touch): number => (touchA.clientX + touchB.clientX) / 2;

// iOS検出関数
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const isiOSDevice = /iPad|iPhone|iPod/.test(ua);
  const isTouchMac = /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
  if (typeof window === 'undefined') {
    return isiOSDevice || isTouchMac;
  }
  return (isiOSDevice || isTouchMac) && !('MSStream' in window);
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
      isSettingsOpen,
      resultModalOpen
    } = useGameSelector((state) => ({
      gameEngine: state.gameEngine,
      isPlaying: state.isPlaying,
      currentSong: state.currentSong,
      currentTime: state.currentTime,
      settings: state.settings,
      score: state.score,
      mode: state.mode,
      lastKeyHighlight: state.lastKeyHighlight,
      isSettingsOpen: state.isSettingsOpen,
      resultModalOpen: state.resultModalOpen
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
  
  const showSeekbar = settings.showSeekbar;
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const renderBridgeRef = useRef<LegendRenderBridge | null>(null);
  if (!renderBridgeRef.current) {
    renderBridgeRef.current = new LegendRenderBridge();
  }
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
    const [pianoZoom, setPianoZoom] = useState(1);
    const pianoZoomRef = useRef(1);
    const baseContentWidthRef = useRef(0);
    const pinchStateRef = useRef<PinchState | null>(null);
    const pendingScrollLeftRef = useRef<number | null>(null);
    const stageRunStateRef = useRef<'idle' | 'running' | 'completed'>('idle');
    const handlePianoScroll = useCallback(() => {
      if (!isProgrammaticScrollRef.current) {
        hasUserScrolledRef.current = true;
      }
    }, []);
    const isMobileKeyboardLayout = gameAreaSize.width < MOBILE_SCROLL_BREAKPOINT;
    const normalizedViewportWidth = gameAreaSize.width > 0 ? gameAreaSize.width : MOBILE_SCROLL_BREAKPOINT;
    const baseWhiteKeyWidth = normalizedViewportWidth / VISIBLE_WHITE_KEYS;
    const baseKeyboardWidth = Math.max(
      1,
      isMobileKeyboardLayout ? Math.ceil(TOTAL_WHITE_KEYS * baseWhiteKeyWidth) : normalizedViewportWidth
    );
    const appliedKeyboardWidth = isMobileKeyboardLayout
      ? Math.max(1, Math.round(baseKeyboardWidth * pianoZoom))
      : baseKeyboardWidth;
    baseContentWidthRef.current = baseKeyboardWidth;

    const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobileKeyboardLayout || event.touches.length !== 2 || !pianoScrollRef.current) {
        return;
      }
      const [touchA, touchB] = [event.touches[0], event.touches[1]];
      const distance = getTouchDistance(touchA, touchB);
      if (distance <= 0) {
        return;
      }
      const container = pianoScrollRef.current;
      const rect = container.getBoundingClientRect();
      const midpoint = getTouchMidpointX(touchA, touchB) - rect.left;
      const totalWidth = baseContentWidthRef.current * pianoZoomRef.current;
      if (totalWidth <= 0) {
        return;
      }
      const originX = container.scrollLeft + midpoint;
      const originRatio = Math.min(1, Math.max(0, originX / totalWidth));
      pinchStateRef.current = {
        startDistance: distance,
        startZoom: pianoZoomRef.current,
        originRatio,
        viewportOffset: midpoint
      };
      hasUserScrolledRef.current = true;
    }, [isMobileKeyboardLayout]);

    const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobileKeyboardLayout) {
        return;
      }
      const pinchState = pinchStateRef.current;
      if (!pinchState || event.touches.length < 2 || !pianoScrollRef.current) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      const [touchA, touchB] = [event.touches[0], event.touches[1]];
      const distance = getTouchDistance(touchA, touchB);
      if (distance <= 0 || pinchState.startDistance <= 0) {
        return;
      }
      const scale = distance / pinchState.startDistance;
      const nextZoom = clampZoomValue(pinchState.startZoom * scale);
      if (Math.abs(nextZoom - pianoZoomRef.current) > 0.001) {
        setPianoZoom(nextZoom);
      }
      const container = pianoScrollRef.current;
      const contentWidth = baseContentWidthRef.current * nextZoom;
      if (contentWidth <= 0) {
        return;
      }
      const targetCenter = pinchState.originRatio * contentWidth;
      const desiredScrollLeft = Math.min(
        Math.max(0, targetCenter - pinchState.viewportOffset),
        Math.max(0, contentWidth - container.clientWidth)
      );
      pendingScrollLeftRef.current = desiredScrollLeft;
    }, [isMobileKeyboardLayout]);

    const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length < 2) {
        pinchStateRef.current = null;
        pendingScrollLeftRef.current = null;
      }
    }, []);

  useEffect(() => {
    return () => {
      renderBridgeRef.current?.dispose();
    };
  }, []);

    useEffect(() => {
      pianoZoomRef.current = pianoZoom;
    }, [pianoZoom]);

    useEffect(() => {
      if (!isMobileKeyboardLayout && pianoZoom !== 1) {
        setPianoZoom(1);
      }
    }, [isMobileKeyboardLayout, pianoZoom]);

    useLayoutEffect(() => {
      const container = pianoScrollRef.current;
      if (!container || !isMobileKeyboardLayout) {
        pendingScrollLeftRef.current = null;
        return;
      }
      if (pendingScrollLeftRef.current !== null) {
        container.scrollLeft = pendingScrollLeftRef.current;
        pendingScrollLeftRef.current = null;
        return;
      }
      const maxScroll = Math.max(0, appliedKeyboardWidth - container.clientWidth);
      if (container.scrollLeft > maxScroll) {
        container.scrollLeft = maxScroll;
      }
    }, [appliedKeyboardWidth, isMobileKeyboardLayout]);

  useEffect(() => {
    const bridge = renderBridgeRef.current;
    if (!bridge) return;
    bridge.attachEngine(gameEngine);
    return () => {
      bridge.attachEngine(null);
    };
  }, [gameEngine]);

    useEffect(() => {
      if (!gameEngine) {
        return;
      }
      updateEngineSettings();
      if (!isPlaying) {
        renderBridgeRef.current?.syncFromEngine();
      }
    }, [settings.timingAdjustment, gameEngine, updateEngineSettings, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      renderBridgeRef.current?.syncFromEngine();
    }
  }, [currentTime, settings.transpose, settings.notesSpeed, isPlaying]);

    useEffect(() => {
      if (mode !== 'performance') {
        stageRunStateRef.current = 'idle';
        return;
      }
      if (isPlaying) {
        stageRunStateRef.current = 'running';
      }
    }, [mode, isPlaying]);

    useEffect(() => {
      stageRunStateRef.current = 'idle';
    }, [currentSong?.id]);

      const notesCompletedRef = useRef(false);

      const handlePlaybackCompleted = useCallback(() => {
        if (mode !== 'performance') {
          return;
        }
        if (stageRunStateRef.current === 'completed') {
          return;
        }
        stageRunStateRef.current = 'completed';
        pause();
        if (!resultModalOpen) {
          openResultModal();
        }
      }, [mode, pause, openResultModal, resultModalOpen]);

      useEffect(() => {
        notesCompletedRef.current = false;
      }, [currentSong?.id, mode]);
  
  // 音声再生用の要素
    const shouldUseBufferedAudio = isIOS();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioLoaded, setAudioLoaded] = useState(false);
    // === オーディオタイミング同期用 ===
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
    const tonePlayerRef = useRef<Tone.Player | null>(null);
    const toneGainRef = useRef<Tone.Gain | null>(null);
    const toneStartAtRef = useRef(0);
    const toneManualStopRef = useRef(false);
    const bufferedOffsetRef = useRef(0);
    // GameEngine と updateTime に渡すための AudioContext ベースのタイムスタンプ
    const baseOffsetRef = useRef<number>(0); // currentTime = audioCtx.time - baseOffset
      const animationFrameRef = useRef<number | null>(null);
      const currentTimeRef = useRef(currentTime);
  
    // 現在時刻の参照を最新化（高頻度の依存関係排除用）
    useEffect(() => {
      currentTimeRef.current = currentTime;
    }, [currentTime]);

  // 楽曲読み込み時の音声設定
  useEffect(() => {
    if (!currentSong) {
      setAudioLoaded(false);
      return;
    }
    const hasAudioFile = currentSong.audioFile && currentSong.audioFile.trim() !== '';
    if (!hasAudioFile) {
      log.info(`🎵 音声なしモードで楽曲を読み込み: ${currentSong.title}`);
      setAudioLoaded(true);
      return;
    }
    if (shouldUseBufferedAudio) {
      let isMounted = true;
      setAudioLoaded(false);
      const setupTonePlayer = async () => {
        try {
          await Tone.start();
        } catch (err) {
          log.warn('Tone.start() failed or was already started', err);
        }
        if (!audioContextRef.current) {
          audioContextRef.current = Tone.getContext().rawContext;
        } else if (Tone.getContext().rawContext !== audioContextRef.current && (Tone as any).setContext) {
          try {
            (Tone as any).setContext(audioContextRef.current);
          } catch (err) {
            log.warn('Tone context assignment failed', err);
          }
        }
        toneManualStopRef.current = true;
        try {
          tonePlayerRef.current?.stop();
        } catch {}
        tonePlayerRef.current?.dispose();
        toneGainRef.current?.dispose();
        const gain = new Tone.Gain().toDestination();
        toneGainRef.current = gain;
        const player = new Tone.Player({
          url: currentSong.audioFile,
          autostart: false,
          loop: false,
          onload: () => {
            if (!isMounted) return;
            setAudioLoaded(true);
            devLog.debug('🎵 Tone.Player loaded audio buffer');
          },
          onerror: (error) => {
            if (!isMounted) return;
            log.error('🚨 Tone.Player load error:', error);
            setAudioLoaded(false);
          }
        });
        player.fadeIn = 0;
        player.fadeOut = 0.02;
        player.connect(gain);
        tonePlayerRef.current = player;
        bufferedOffsetRef.current = 0;
        toneStartAtRef.current = 0;
        toneManualStopRef.current = false;
      };
      setupTonePlayer().catch((error) => {
        log.error('🚨 Tone player初期化エラー:', error);
        setAudioLoaded(false);
      });
      return () => {
        isMounted = false;
        toneManualStopRef.current = true;
        try {
          tonePlayerRef.current?.stop();
        } catch {}
        tonePlayerRef.current?.dispose();
        tonePlayerRef.current = null;
        toneGainRef.current?.dispose();
        toneGainRef.current = null;
        setAudioLoaded(false);
      };
    }
  
    if (!audioRef.current) {
      return;
    }
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
    audio.crossOrigin = 'anonymous';
    audio.src = currentSong.audioFile;
    audio.preload = 'auto';
    try {
      audio.load();
    } catch (loadError) {
      devLog.debug('audio.load failed (likely Safari):', loadError);
    }
  
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      try { audio.pause(); } catch {}
      try { audio.currentTime = 0; } catch {}
      try {
        if (mediaSourceRef.current) {
          mediaSourceRef.current.disconnect();
        }
      } catch {}
      try {
        if (pitchShiftRef.current) {
          pitchShiftRef.current.disconnect();
        }
      } catch {}
    };
        }, [currentSong?.audioFile, shouldUseBufferedAudio]);

      useEffect(() => {
        if (!currentSong) {
          notesCompletedRef.current = false;
          return;
        }
        const judgedNotes = score.goodCount + score.missCount;
        if (score.totalNotes > 0 && judgedNotes >= score.totalNotes) {
          notesCompletedRef.current = true;
          if (!currentSong.audioFile || currentSong.audioFile.trim() === '') {
            handlePlaybackCompleted();
          }
        }
      }, [score.goodCount, score.missCount, score.totalNotes, currentSong, handlePlaybackCompleted]);
    
      useEffect(() => {
        if (shouldUseBufferedAudio) {
          return;
        }
        const audio = audioRef.current;
        if (!audio) {
          return;
        }
        const handleEnded = () => {
          if (notesCompletedRef.current) {
            handlePlaybackCompleted();
          }
        };
        audio.addEventListener('ended', handleEnded);
        return () => {
          audio.removeEventListener('ended', handleEnded);
        };
      }, [shouldUseBufferedAudio, handlePlaybackCompleted]);
  
  // 再生状態同期
  useEffect(() => {
    if (!gameEngine) return;

    const run = async () => {
      if (!isPlaying) {
        if (shouldUseBufferedAudio) {
          toneManualStopRef.current = true;
          try {
            tonePlayerRef.current?.stop();
          } catch {}
          toneManualStopRef.current = false;
          if (audioContextRef.current) {
            const logicalTime = Math.max(
              0,
              (audioContextRef.current.currentTime - baseOffsetRef.current) * (settings.playbackSpeed || 1)
            );
            bufferedOffsetRef.current = logicalTime;
          }
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
        gameEngine.pause();
        log.info('🎮 GameEngine paused');
        return;
      }

      const hasAudioFile = Boolean(currentSong?.audioFile && currentSong.audioFile.trim() !== '');
      const toneReady = shouldUseBufferedAudio && tonePlayerRef.current && audioLoaded;
      const mediaReady = !shouldUseBufferedAudio && audioRef.current && audioLoaded;
      const hasAudio = hasAudioFile && (toneReady || mediaReady);

      if (hasAudio && shouldUseBufferedAudio) {
        const player = tonePlayerRef.current;
        const gainNode = toneGainRef.current;
        if (!player || !gainNode) {
          log.warn('Tone.Player が初期化されていないため再生できません');
          return;
        }
        if (!audioContextRef.current) {
          audioContextRef.current = Tone.getContext().rawContext;
        }
        const audioContext = audioContextRef.current;
        if (!audioContext) {
          log.error('AudioContextが取得できません (Tone)');
          return;
        }
        await audioContext.resume();
        const syncTime = Math.max(0, currentTime);
        bufferedOffsetRef.current = syncTime;
        gainNode.gain.value = settings.musicVolume;

        if (settings.transpose !== 0) {
          if (!pitchShiftRef.current) {
            try {
              await Tone.start();
            } catch (err) {
              log.warn('Tone.start() failed or was already started', err);
            }
            pitchShiftRef.current = new Tone.PitchShift({ pitch: settings.transpose });
          } else {
            (pitchShiftRef.current as unknown as { pitch: number }).pitch = settings.transpose;
          }
          player.disconnect();
          pitchShiftRef.current.disconnect();
          player.connect(pitchShiftRef.current);
          pitchShiftRef.current.connect(gainNode);
        } else {
          if (pitchShiftRef.current) {
            try {
              pitchShiftRef.current.disconnect();
              pitchShiftRef.current.dispose();
            } catch (err) {
              log.warn('PitchShift dispose failed', err);
            }
            pitchShiftRef.current = null;
          }
          player.disconnect();
          player.connect(gainNode);
        }

        toneManualStopRef.current = true;
        try {
          player.stop();
        } catch {}
        toneManualStopRef.current = false;
        player.start(undefined, syncTime);
        toneStartAtRef.current = Tone.now() - (syncTime / (settings.playbackSpeed || 1));
        player.onstop = () => {
          if (!toneManualStopRef.current && notesCompletedRef.current) {
            handlePlaybackCompleted();
          }
        };

        const realTimeElapsed = syncTime / (settings.playbackSpeed || 1);
        baseOffsetRef.current = audioContext.currentTime - realTimeElapsed;
        gameEngine.start(audioContext);
        gameEngine.seek(syncTime);
        return;
      }

      if (hasAudio && audioRef.current) {
        const audio = audioRef.current;
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current!;

        if (!mediaSourceRef.current) {
          try {
            mediaSourceRef.current = audioContext.createMediaElementSource(audio);
            log.info('✅ MediaElementAudioSourceNode created successfully');
          } catch (error) {
            log.error('🚨 MediaElementAudioSourceNode creation failed:', error);
            throw error;
          }
        }

        const shouldApplyPitchShift = settings.transpose !== 0;

        if (shouldApplyPitchShift) {
          if (!pitchShiftRef.current) {
            try {
              await Tone.start();
            } catch (err) {
              log.warn('Tone.start() failed or was already started', err);
            }

            try {
              if (Tone.setContext) {
                Tone.setContext(audioContext);
              } else {
                log.warn('Unable to set Tone.js context - using default context');
              }
            } catch (err) {
              log.warn('Tone context assignment failed', err);
            }

            pitchShiftRef.current = new Tone.PitchShift({ pitch: settings.transpose }).toDestination();
          } else {
            (pitchShiftRef.current as unknown as { pitch: number }).pitch = settings.transpose;
          }

          try {
            mediaSourceRef.current.disconnect();
          } catch {}

          try {
            Tone.connect(mediaSourceRef.current, pitchShiftRef.current);
          } catch (err) {
            log.error('Tone.connect failed:', err);
          }
        } else {
          if (pitchShiftRef.current) {
            try {
              pitchShiftRef.current.dispose();
            } catch (err) {
              log.warn('PitchShift dispose failed', err);
            }
            pitchShiftRef.current = null;
          }
          try {
            mediaSourceRef.current.disconnect();
          } catch {}
          try {
            mediaSourceRef.current.connect(audioContext.destination);
          } catch (err) {
            log.error('MediaElementAudioSourceNode connect failed:', err);
          }
        }

        const resumePromise = audioContext.resume();
        audio.playbackRate = settings.playbackSpeed;
        try {
          audio.preservesPitch = true;
          audio.mozPreservesPitch = true;
          audio.webkitPreservesPitch = true;
        } catch {}

        const syncTime = Math.max(0, currentTime);
        audio.currentTime = syncTime;
        const realTimeElapsed = syncTime / settings.playbackSpeed;
        baseOffsetRef.current = audioContext.currentTime - realTimeElapsed;

        gameEngine.start(audioContext);
        gameEngine.seek(syncTime);

        resumePromise
          .then(() => {
            if (isIOS()) {
              return new Promise((resolve) => setTimeout(resolve, 100));
            }
            return Promise.resolve();
          })
          .then(() => {
            audio.play().catch((e) => log.error('音声再生エラー:', e));
          })
          .catch((e) => log.error('AudioContext resume エラー:', e));
        return;
      }

      // === 音声なしモード ===
      log.info('🎵 音声なしモードでゲームエンジンを開始');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current!;
      
      audioContext.resume().catch(e => log.warn('AudioContext resume エラー:', e));

      const syncTime = Math.max(0, currentTime);
      
      gameEngine.start(audioContext);
      gameEngine.seek(syncTime);
      
      const realTimeElapsed = syncTime / settings.playbackSpeed;
      baseOffsetRef.current = audioContext.currentTime - realTimeElapsed;
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, audioLoaded, gameEngine, settings.transpose, shouldUseBufferedAudio]);
  
  // 設定モーダルが開いた時に音楽を一時停止
  useEffect(() => {
    if (isSettingsOpen && isPlaying) {
      pause();
      log.info('⚙️ 設定モーダルを開いたため音楽を一時停止しました');
    }
  }, [isSettingsOpen, isPlaying, pause]);
  
// 音量変更の同期
useEffect(() => {
  if (shouldUseBufferedAudio) {
    if (toneGainRef.current) {
      toneGainRef.current.gain.value = settings.musicVolume;
    }
    return;
  }
  if (audioRef.current) {
    audioRef.current.volume = settings.musicVolume;
  }
}, [settings.musicVolume, shouldUseBufferedAudio]);
  
    // 再生スピード変更の同期
    useEffect(() => {
      if (shouldUseBufferedAudio) {
        if (tonePlayerRef.current) {
          tonePlayerRef.current.playbackRate = settings.playbackSpeed;
        }
      } else if (audioRef.current) {
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
        const newElapsedReal = currentTimeRef.current / settings.playbackSpeed;
        baseOffsetRef.current = audioContextRef.current.currentTime - newElapsedReal;
        
        // ログ削除: FPS最適化のため
        // devLog.debug(`🔧 再生速度変更: ${settings.playbackSpeed}x - baseOffset再計算完了`);
      }

      // GameEngine にも設定を反映
      if (gameEngine) {
        updateEngineSettings();
      }
    }, [settings.playbackSpeed, gameEngine, updateEngineSettings, isPlaying, shouldUseBufferedAudio]);
  
// シーク機能（音声ありと音声なし両方対応）
useEffect(() => {
  if (audioContextRef.current && gameEngine) {
    const hasMediaAudio = !shouldUseBufferedAudio && audioRef.current && audioLoaded;
    const hasToneAudio = shouldUseBufferedAudio && tonePlayerRef.current && audioLoaded;
    const hasAudio = Boolean(currentSong?.audioFile && currentSong.audioFile.trim() !== '' && (hasMediaAudio || hasToneAudio));
    
    if (hasAudio) {
      const audioTime = (audioContextRef.current.currentTime - baseOffsetRef.current) * settings.playbackSpeed;
      const timeDiff = Math.abs(audioTime - currentTime);
      if (timeDiff > 0.3) {
        const safeTime = Math.max(0, Math.min(currentTime, (currentSong?.duration || currentTime)));
        if (shouldUseBufferedAudio) {
          if (tonePlayerRef.current) {
            bufferedOffsetRef.current = safeTime;
            toneManualStopRef.current = true;
            try {
              tonePlayerRef.current.stop();
            } catch {}
            toneManualStopRef.current = false;
            tonePlayerRef.current.start(undefined, safeTime);
            toneStartAtRef.current = Tone.now() - (safeTime / (settings.playbackSpeed || 1));
          }
        } else if (audioRef.current) {
          audioRef.current.currentTime = safeTime;
        }
        
        if (audioContextRef.current) {
          const realTimeElapsed = safeTime / settings.playbackSpeed;
          baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
        }
        
        gameEngine.seek(safeTime);
        updateTime(safeTime);
        devLog.debug(`🔄 Audio & GameEngine synced to ${safeTime.toFixed(2)}s`);
      }
    } else {
      const timeDiff = Math.abs((audioContextRef.current.currentTime - baseOffsetRef.current) * settings.playbackSpeed - currentTime);
      if (timeDiff > 0.3) {
        const safeTime = Math.max(0, Math.min(currentTime, (currentSong?.duration || currentTime)));
        const realTimeElapsed = safeTime / settings.playbackSpeed;
        baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
        gameEngine.seek(safeTime);
        updateTime(safeTime);
        devLog.debug(`🔄 GameEngine (音声なし) synced to ${safeTime.toFixed(2)}s`);
      }
    }
  }
}, [currentTime, audioLoaded, gameEngine, settings.playbackSpeed, shouldUseBufferedAudio]);
  
  // MIDIController管理用のRef
  const midiControllerRef = useRef<any>(null);
  // MIDI 初期化完了フラグ（初期化後に接続エフェクトを確実に発火させる）
  const [isMidiReady, setIsMidiReady] = useState(false);

  // 共通音声システム + MIDIController初期化
  useEffect(() => {
    const initAudio = async () => {
      try {
        const midiModule = await ensureMidiModule();
        const { initializeAudioSystem, default: MIDIController } = midiModule;
        await initializeAudioSystem();
        log.info('✅ 共通音声システム初期化完了');
        
        if (!midiControllerRef.current) {
          midiControllerRef.current = new MIDIController({
            onNoteOn: (note: number, velocity?: number) => {
              handleNoteInput(note);
            },
            onNoteOff: (_note: number) => {
              // ノートオフの処理（必要に応じて）
            },
            onConnectionChange: (connected: boolean) => {
              log.info(`🎹 MIDI接続状態変更: ${connected ? '接続' : '切断'}`);
            },
            playMidiSound: true
          });
          
          await midiControllerRef.current.initialize();
          log.info('✅ MIDIController初期化完了');
          setIsMidiReady(true);
        }
      } catch (controllerError) {
        log.warn('⚠️ MIDIシステム初期化に失敗 (ユーザーインタラクション後に再試行):', controllerError);
      }
    };
    
    initAudio();
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, [handleNoteInput, ensureMidiModule]);

    useEffect(() => {
      let isMounted = true;
        void ensureMidiModule()
          .then(async (module) => {
            if (!isMounted) return;
            try {
              await module.initializeAudioSystem();
            } catch (warmupError) {
              log.warn('⚠️ Audio system warmup failed:', warmupError);
            }
          })
        .catch((error) => {
          log.warn('⚠️ MIDI module preload failed:', error);
        });
      return () => {
        isMounted = false;
      };
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
  }, [gameEngine, updateEngineSettings, pixiRenderer, settings.noteNameStyle, settings.simpleDisplayMode, settings.pianoHeight, settings.transpose, settings.transposingInstrument, settings.practiceGuide]);
  
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
          ...(showSeekbar === undefined && needsHorizontalScroll ? { showSeekbar: false } : {})
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
    }, [updateSettings, updateEngineSettings, showSeekbar]);
  
  // ================= ピアノキー演奏ハンドラー =================
    const handlePianoKeyPress = useCallback((note: number) => {
      handleNoteInput(note);
      const module = midiModuleRef.current;
      if (module) {
        void module.playNote(note, 64).catch((error: unknown) => {
          log.error('❌ Piano key play error:', error);
        });
        return;
      }
      void ensureMidiModule()
        .then(({ playNote }) => playNote(note, 64))
        .catch((error) => {
          log.error('❌ Piano key play error:', error);
        });
    }, [handleNoteInput, ensureMidiModule]);

  // ================= ピアノキーリリースハンドラー =================
    const handlePianoKeyRelease = useCallback((note: number) => {
      const module = midiModuleRef.current;
      if (module?.stopNote) {
        module.stopNote(note);
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
          {(() => (
            <div 
              className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x pixi-mobile-scroll custom-game-scrollbar" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'none',
                scrollBehavior: 'auto',
                touchAction: 'pan-x pinch-zoom'
              }}
              onScroll={handlePianoScroll}
              ref={pianoScrollRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <div style={{ 
                width: appliedKeyboardWidth, 
                height: '100%',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                position: 'relative'
              }}>
                <PIXINotesRenderer
                  width={appliedKeyboardWidth}
                  height={gameAreaSize.height}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
                <ChordOverlay />
              </div>
            </div>
          ))()}
        
      </div>
      
      {/* HTML5 Audio Element（楽曲再生用） */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="metadata"
          playsInline
        style={{ display: 'none' }}
        onLoadedMetadata={() => log.info('🎵 音声メタデータ読み込み完了')}
        onError={(e) => log.error('🚨 音声読み込みエラー:', e)}
          onTimeUpdate={() => {}}
      />
    </div>
  );
};

// ===== サブコンポーネント =====
// 注：Phase 3でPIXI.jsレンダリングに移行済み
// HTMLベースのピアノキーボードは削除し、PIXI.js側で統一

export default GameEngineComponent; 