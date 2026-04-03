/**
 * Phase 3: ゲームエンジン + PIXI.js統合 UI コンポーネント
 * ゲームエンジンとPIXI.jsレンダリングの接続
 */

import React, { useEffect, useCallback, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { useChords, useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { PIXINotesRenderer, PIXINotesRendererInstance } from './PIXINotesRenderer';
import { LegendRenderBridge } from './LegendRenderBridge';
import ScoreOverlay from './ScoreOverlay';
import * as Tone from 'tone';
import { devLog, log } from '@/utils/logger';
import { VoiceInputController } from '@/utils/VoiceInputController';
import { applyAudioOutputDevice } from '@/utils/audioOutput';
import { FantasySoundManager } from '@/utils/FantasySoundManager';

const LegendComboDisplay: React.FC = () => {
  const combo = useGameSelector((s) => s.score.combo);
  if (combo < 2) return null;
  return (
    <div className="absolute bottom-16 right-3 z-20 pointer-events-none text-right">
      <span className="text-3xl font-black text-yellow-300 drop-shadow-lg">{combo}</span>
      <span className="block text-xs font-bold text-yellow-200 tracking-widest">COMBO</span>
    </div>
  );
};

const TOTAL_WHITE_KEYS = 52;
const VISIBLE_WHITE_KEYS = 24;
const MOBILE_SCROLL_BREAKPOINT = 1100;
const MIN_PIANO_ZOOM = 1;
const MAX_PIANO_ZOOM = 2.5;
const MEDIA_DRIFT_THRESHOLD = 0.05;

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
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }
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
      settings,
      mode,
      isSettingsOpen,
      resultModalOpen
    } = useGameSelector((state) => ({
      gameEngine: state.gameEngine,
      isPlaying: state.isPlaying,
      currentSong: state.currentSong,
      settings: state.settings,
      mode: state.mode,
      isSettingsOpen: state.isSettingsOpen,
      resultModalOpen: state.resultModalOpen
    }));
    const currentSongId = currentSong?.id ?? null;
    const currentSongAudioFile = currentSong?.audioFile ?? '';
    const currentSongDuration = currentSong?.duration ?? null;
    const currentSongTitle = currentSong?.title ?? '';
    const hasAudioTrack = currentSongAudioFile.trim() !== '';
    const rangeAudioOffset = (currentSong as any)?.audio_start_time ?? 0;
    const chords = useChords();

  const {
    initializeGameEngine,
    destroyGameEngine,
    handleNoteInput,
    updateEngineSettings,
      updateSettings,
      updateTime,
      pause,
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
      if (!pixiRenderer) {
        return;
      }
      if (!chords || chords.length === 0) {
        pixiRenderer.setChordDisplay('');
        return;
      }
      const chordList = [...chords].sort((a, b) => a.startTime - b.startTime);
      let lastChordText = '';

      const findChordAtTime = (time: number) => {
        let low = 0;
        let high = chordList.length - 1;
        let matchIndex = -1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (chordList[mid].startTime <= time) {
            matchIndex = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        if (matchIndex < 0) {
          return undefined;
        }
        const candidate = chordList[matchIndex];
        if (candidate.endTime !== undefined && time >= candidate.endTime) {
          return undefined;
        }
        return candidate;
      };

      const updateChordDisplay = (time: number) => {
        const chord = findChordAtTime(time);
        const nextText = chord?.symbol.displayText ?? '';
        if (nextText === lastChordText) {
          return;
        }
        lastChordText = nextText;
        pixiRenderer.setChordDisplay(nextText);
      };

      updateChordDisplay(currentTimeRef.current);
      const unsubscribe = useGameStore.subscribe(
        (state) => state.currentTime,
        (time) => updateChordDisplay(time)
      );

      return () => {
        unsubscribe();
        pixiRenderer.setChordDisplay('');
      };
    }, [pixiRenderer, chords]);

    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(
          (state) => state.currentTime,
          (time) => {
            currentTimeRef.current = time;
            if (!isPlayingRef.current) {
              renderBridgeRef.current?.syncFromEngine();
            }
            if (currentSongDuration && time >= currentSongDuration - 0.01) {
              setHasPlaybackFinished(true);
              if (isPlayingRef.current) {
                pause();
              }
              if (currentSongDuration && time > currentSongDuration) {
                updateTime(currentSongDuration);
              }
            }
          }
        );
        return unsubscribe;
      }, [currentSongDuration, pause, updateTime]);

    useEffect(() => {
      if (!isPlaying) {
        renderBridgeRef.current?.syncFromEngine();
      }
    }, [settings.transpose, settings.notesSpeed, isPlaying]);

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
      }, [currentSongId]);

  const [audioLoaded, setAudioLoaded] = useState(false);
  const [hasPlaybackFinished, setHasPlaybackFinished] = useState(false);
  // === オーディオタイミング同期用 ===
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const audioFetchAbortRef = useRef<AbortController | null>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
    // GameEngine と updateTime に渡すための AudioContext ベースのタイムスタンプ
      const baseOffsetRef = useRef<number>(0); // currentTime = audioCtx.time - baseOffset
      const currentTimeRef = useRef(useGameStore.getState().currentTime);
      const scoreRef = useRef(useGameStore.getState().score);
      const isPlayingRef = useRef(isPlaying);
  const isIosDevice = useMemo(() => isIOS(), []);
  const playbackSpeedRef = useRef(settings.playbackSpeed);
  const rangeAudioOffsetRef = useRef(rangeAudioOffset);
  const selectedAudioOutputDeviceRef = useRef<string | null>(settings.selectedAudioOutputDevice);

  useEffect(() => {
    selectedAudioOutputDeviceRef.current = settings.selectedAudioOutputDevice;
  }, [settings.selectedAudioOutputDevice]);
    
    // 現在時刻の参照を最新化（高頻度の依存関係排除用）
      useEffect(() => {
        isPlayingRef.current = isPlaying;
      }, [isPlaying]);

  const ensureAudioContext = useCallback((): AudioContext => {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }
    if (typeof window === 'undefined') {
      throw new Error('AudioContext is not available on the server');
    }
    const AudioContextClass =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser');
    }
    const context = new AudioContextClass();
    audioContextRef.current = context;
    // 出力デバイスの指定（対応ブラウザのみ・失敗しても致命ではない）
    void applyAudioOutputDevice(context, selectedAudioOutputDeviceRef.current);
    return context;
  }, []);

  useEffect(() => {
    if (!audioContextRef.current) {
      return;
    }
    void applyAudioOutputDevice(audioContextRef.current, settings.selectedAudioOutputDevice);
  }, [settings.selectedAudioOutputDevice]);

  const ensureMusicGainNode = useCallback(
    (context: AudioContext): GainNode => {
      if (!musicGainRef.current) {
        const gain = context.createGain();
        gain.gain.value = settings.musicVolume;
        gain.connect(context.destination);
        musicGainRef.current = gain;
      }
      return musicGainRef.current;
    },
    [settings.musicVolume]
  );

  const stopCurrentBufferSource = useCallback(() => {
    if (!bufferSourceRef.current) {
      return;
    }
    try {
      bufferSourceRef.current.onended = null;
      bufferSourceRef.current.stop();
    } catch (error) {
      log.warn('AudioBufferSourceNode stop failed', error);
    }
    try {
      bufferSourceRef.current.disconnect();
    } catch {
      // ignore
    }
    bufferSourceRef.current = null;
  }, []);

  useEffect(() => {
    if (!musicGainRef.current || !audioContextRef.current) {
      return;
    }
    const contextTime = audioContextRef.current.currentTime;
    musicGainRef.current.gain.setValueAtTime(settings.musicVolume, contextTime);
  }, [settings.musicVolume]);

  const getTimelineTime = useCallback((): number => {
    if (!audioContextRef.current) {
      return currentTimeRef.current;
    }
    const elapsed = audioContextRef.current.currentTime - baseOffsetRef.current;
    const timeline = elapsed * playbackSpeedRef.current;
    const durationLimit = currentSongDuration ?? audioBufferRef.current?.duration ?? null;
    if (durationLimit === null) {
      return Math.max(0, timeline);
    }
    return Math.max(0, Math.min(timeline, durationLimit));
  }, [currentSongDuration]);

  const getEffectivePitchShift = useCallback((): number => {
    const safeSpeed = Math.max(settings.playbackSpeed, 0.0001);
    const speedSemitoneOffset = Math.log2(safeSpeed) * 12;
    return settings.transpose - speedSemitoneOffset;
  }, [settings.playbackSpeed, settings.transpose]);

  const disposePitchShiftNode = useCallback(() => {
    if (pitchShiftRef.current) {
      try {
        pitchShiftRef.current.disconnect();
      } catch {
        // ignore
      }
      try {
        pitchShiftRef.current.dispose();
      } catch (error) {
        log.warn('PitchShift dispose failed', error);
      }
      pitchShiftRef.current = null;
    }
  }, []);

const playFromOffset = useCallback(
  async (requestedOffset: number) => {
    if (!gameEngine) {
      return;
    }

    const audioContext = ensureAudioContext();
    if (hasAudioTrack && audioBufferRef.current && audioLoaded) {
      try {
        await audioContext.resume();
      } catch (error) {
        log.warn('AudioContext resume エラー:', error);
      }

      stopCurrentBufferSource();

      const buffer = audioBufferRef.current;
      const bufferDuration = buffer.duration;
      const effectiveDuration = currentSongDuration ?? bufferDuration;
      const safeOffset = Math.max(0, Math.min(requestedOffset, effectiveDuration));
      const audioOffset = rangeAudioOffsetRef.current;
      const bufferOffset = Math.max(0, Math.min(safeOffset + audioOffset, bufferDuration));

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(playbackSpeedRef.current, audioContext.currentTime);

      const gainNode = ensureMusicGainNode(audioContext);
      const pitchShiftAmount = getEffectivePitchShift();
      const shouldUsePitchShift = Math.abs(pitchShiftAmount) > 0.001;
      if (shouldUsePitchShift) {
        try {
          await Tone.start();
        } catch (err) {
          log.warn('Tone.start() failed or was already started', err);
        }
        try {
          if ((Tone as any).setContext) {
            (Tone as any).setContext(audioContext);
          }
        } catch (err) {
          log.warn('Tone context assignment failed', err);
        }
        if (!pitchShiftRef.current) {
          pitchShiftRef.current = new Tone.PitchShift({ pitch: pitchShiftAmount });
        } else {
          (pitchShiftRef.current as any).pitch = pitchShiftAmount;
        }
        try {
          (pitchShiftRef.current as any).disconnect();
        } catch {
          // ignore
        }
        (pitchShiftRef.current as any).connect(gainNode);
        try {
          Tone.connect(source, pitchShiftRef.current);
        } catch (err) {
          log.error('Tone.connect failed:', err);
          source.connect(gainNode);
        }
      } else {
        disposePitchShiftNode();
        source.connect(gainNode);
      }

      source.onended = () => {
        if (bufferSourceRef.current !== source) {
          return;
        }
        bufferSourceRef.current = null;
        if (!isPlayingRef.current) {
          return;
        }
        const finalTime = Math.min(effectiveDuration, bufferDuration);
        setHasPlaybackFinished(true);
        pause();
        updateTime(finalTime);
      };

      bufferSourceRef.current = source;
      const startContextTime = audioContext.currentTime;
      source.start(0, bufferOffset);
      baseOffsetRef.current = startContextTime - safeOffset / playbackSpeedRef.current;

      setHasPlaybackFinished(false);
      gameEngine.start(audioContext);
      gameEngine.seek(safeOffset);
    } else {
      log.info('🎵 音声なしモードでゲームエンジンを開始');
      try {
        await audioContext.resume();
      } catch (error) {
        log.warn('AudioContext resume エラー:', error);
      }
      const effectiveDuration = currentSongDuration ?? requestedOffset;
      const safeOffset = Math.max(0, Math.min(requestedOffset, effectiveDuration));
      gameEngine.start(audioContext);
      gameEngine.seek(safeOffset);
      baseOffsetRef.current = audioContext.currentTime - safeOffset / playbackSpeedRef.current;
    }
  },
    [
      audioLoaded,
      currentSongDuration,
      disposePitchShiftNode,
      ensureAudioContext,
      ensureMusicGainNode,
      gameEngine,
      getEffectivePitchShift,
      hasAudioTrack,
      pause,
      stopCurrentBufferSource,
      updateTime
    ]
);

    useEffect(() => {
      if (mode !== 'performance' || !currentSongId) {
        return;
      }
      const maybeCompletePerformance = (latestScore: typeof scoreRef.current) => {
        if (mode !== 'performance' || !currentSongId) {
          return;
        }
        if (stageRunStateRef.current !== 'running') {
          return;
        }
        const judgedNotes = latestScore.goodCount + latestScore.missCount;
        if (
          latestScore.totalNotes > 0 &&
          judgedNotes >= latestScore.totalNotes &&
          hasPlaybackFinished &&
          !resultModalOpen
        ) {
          stageRunStateRef.current = 'completed';
          pause();
          openResultModal();
        }
      };

      maybeCompletePerformance(scoreRef.current);
      const unsubscribe = useGameStore.subscribe(
        (state) => state.score,
        (nextScore) => {
          scoreRef.current = nextScore;
          maybeCompletePerformance(nextScore);
        }
      );

      return unsubscribe;
    }, [mode, currentSongId, pause, openResultModal, resultModalOpen, hasPlaybackFinished]);

  // 楽曲読み込み時の音声設定
  useEffect(() => {
    audioFetchAbortRef.current?.abort();
    audioFetchAbortRef.current = null;
    audioBufferRef.current = null;
    setAudioLoaded(false);

    if (!currentSongId) {
      return undefined;
    }

    if (!hasAudioTrack || !currentSongAudioFile) {
      log.info(`🎵 音声なしモードで楽曲を読み込み: ${currentSongTitle}`);
      setAudioLoaded(true);
      return () => {
        stopCurrentBufferSource();
      };
    }

    const controller = new AbortController();
    audioFetchAbortRef.current = controller;
    let isCancelled = false;

    const loadAudioBuffer = async () => {
      try {
        log.info(`🎵 音声ファイル読み込み開始: ${currentSongAudioFile}`);
        const response = await fetch(currentSongAudioFile, { signal: controller.signal, mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to load audio file: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = ensureAudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (controller.signal.aborted || isCancelled) {
          return;
        }
        audioBufferRef.current = decodedBuffer;
        setAudioLoaded(true);
        setHasPlaybackFinished(false);
        devLog.debug('🎵 音声バッファ詳細', {
          duration: decodedBuffer.duration,
          sampleRate: decodedBuffer.sampleRate,
          numberOfChannels: decodedBuffer.numberOfChannels
        });
      } catch (error) {
        if (controller.signal.aborted || isCancelled) {
          return;
        }
        log.error('🚨 音声バッファの読み込みに失敗しました', error);
        setAudioLoaded(false);
      }
    };

    void loadAudioBuffer();

    return () => {
      isCancelled = true;
      controller.abort();
      audioFetchAbortRef.current = null;
      stopCurrentBufferSource();
    };
  }, [
    currentSongAudioFile,
    currentSongDuration,
    currentSongId,
    currentSongTitle,
    ensureAudioContext,
    hasAudioTrack,
    stopCurrentBufferSource
  ]);

    useEffect(() => {
      setHasPlaybackFinished(false);
    }, [currentSongId]);

    useEffect(() => {
      if (isPlaying) {
        setHasPlaybackFinished(false);
      }
    }, [isPlaying]);

    useEffect(() => {
      if (hasAudioTrack || !currentSongDuration) {
        return;
      }
      if (!isPlaying && currentTimeRef.current >= currentSongDuration) {
        setHasPlaybackFinished(true);
      }
      const unsubscribe = useGameStore.subscribe(
        (state) => state.currentTime,
        (time) => {
          if (!isPlayingRef.current && time >= currentSongDuration) {
            setHasPlaybackFinished(true);
          }
        }
      );
      return unsubscribe;
    }, [hasAudioTrack, currentSongDuration, isPlaying]);
  
// playFromOffsetをrefで保持して、依存配列から外す（transpose変更時の意図しない再生開始を防ぐ）
const playFromOffsetRef = useRef(playFromOffset);
useEffect(() => {
  playFromOffsetRef.current = playFromOffset;
}, [playFromOffset]);

// 再生状態同期 - isPlayingの変更のみで発火するように修正
// 🐛 Fix: playFromOffsetを依存配列から外すことで、transpose変更時の音楽複製問題を解決
useEffect(() => {
  if (!gameEngine) {
    return;
  }

  if (isPlaying) {
    void playFromOffsetRef.current(currentTimeRef.current);
  } else {
    stopCurrentBufferSource();
    gameEngine.pause();
    log.info('🎮 GameEngine paused');
    const timelineTime = getTimelineTime();
    updateTime(timelineTime);
  }
}, [gameEngine, isPlaying, stopCurrentBufferSource]);

useEffect(() => {
  if (!gameEngine || !isPlaying || !audioLoaded || !hasAudioTrack || !audioBufferRef.current) {
    return;
  }
  if (bufferSourceRef.current) {
    return;
  }
  void playFromOffsetRef.current(currentTimeRef.current);
}, [audioLoaded, gameEngine, hasAudioTrack, isPlaying]);

useEffect(() => {
  return () => {
    audioFetchAbortRef.current?.abort();
    stopCurrentBufferSource();
    if (pitchShiftRef.current) {
      try {
        pitchShiftRef.current.dispose();
      } catch (error) {
        log.warn('PitchShift dispose failed during cleanup', error);
      }
      pitchShiftRef.current = null;
    }
    if (musicGainRef.current) {
      try {
        musicGainRef.current.disconnect();
      } catch {
        // ignore
      }
      musicGainRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  };
}, [stopCurrentBufferSource]);
  
  // 設定モーダルが開いた時に音楽を一時停止
  useEffect(() => {
    if (isSettingsOpen && isPlaying) {
      pause();
      log.info('⚙️ 設定モーダルを開いたため音楽を一時停止しました');
    }
  }, [isSettingsOpen, isPlaying, pause]);

  const applyPitchCompensationIfNeeded = useCallback(() => {
    if (!pitchShiftRef.current) {
      return;
    }
    const pitchShiftAmount = getEffectivePitchShift();
    if (Math.abs(pitchShiftAmount) < 0.001) {
      disposePitchShiftNode();
      return;
    }
    (pitchShiftRef.current as any).pitch = pitchShiftAmount;
  }, [disposePitchShiftNode, getEffectivePitchShift]);

  // 再生スピード変更の同期
  useEffect(() => {
    rangeAudioOffsetRef.current = rangeAudioOffset;
  }, [rangeAudioOffset]);

  useEffect(() => {
    const previousSpeed = playbackSpeedRef.current;
    playbackSpeedRef.current = settings.playbackSpeed;

    if (audioContextRef.current) {
      const elapsed = audioContextRef.current.currentTime - baseOffsetRef.current;
      const timeline = elapsed * previousSpeed;
      baseOffsetRef.current = audioContextRef.current.currentTime - timeline / settings.playbackSpeed;
    }

    if (bufferSourceRef.current && audioContextRef.current) {
      bufferSourceRef.current.playbackRate.setValueAtTime(
        settings.playbackSpeed,
        audioContextRef.current.currentTime
      );
    }

    applyPitchCompensationIfNeeded();

    if (gameEngine) {
      updateEngineSettings();
    }
  }, [settings.playbackSpeed, applyPitchCompensationIfNeeded, gameEngine, updateEngineSettings]);

  useEffect(() => {
    applyPitchCompensationIfNeeded();
  }, [applyPitchCompensationIfNeeded]);
  
  // シーク機能（音声あり/なし両対応）
  // 🐛 Fix: playFromOffsetを依存配列から外すことで、transpose変更時の意図しないシーク処理を防ぐ
  useEffect(() => {
    if (!gameEngine) {
      return;
    }

    const clampTime = (time: number): { value: number; clamped: boolean } => {
      const durationLimit =
        currentSongDuration ?? audioBufferRef.current?.duration ?? null;
      if (durationLimit === null) {
        const bounded = Math.max(0, time);
        return { value: bounded, clamped: bounded !== time };
      }
      const bounded = Math.min(Math.max(0, time), durationLimit);
      return { value: bounded, clamped: Math.abs(bounded - time) > 0.0001 };
    };

    const syncMediaPosition = (targetTime: number) => {
      const { value: safeTime, clamped } = clampTime(targetTime);
      if (isPlayingRef.current) {
        void playFromOffsetRef.current(safeTime);
        return;
      }
      if (audioContextRef.current) {
        const realTimeElapsed = safeTime / playbackSpeedRef.current;
        baseOffsetRef.current = audioContextRef.current.currentTime - realTimeElapsed;
      }
      gameEngine.seek(safeTime);
      if (clamped) {
        updateTime(safeTime);
      }
    };

    const handleTimeDrift = (targetTime: number) => {
      const { value: safeTime } = clampTime(targetTime);

      if (!isPlayingRef.current) {
        syncMediaPosition(safeTime);
        return;
      }

      const timelineTime = getTimelineTime();
      const timeDiff = Math.abs(timelineTime - safeTime);

      if (timeDiff > MEDIA_DRIFT_THRESHOLD) {
        void playFromOffsetRef.current(safeTime);
      }
    };

    handleTimeDrift(currentTimeRef.current);
    const unsubscribe = useGameStore.subscribe(
      (state) => state.currentTime,
      (time) => handleTimeDrift(time)
    );

    return unsubscribe;
  }, [currentSongDuration, gameEngine, getTimelineTime, updateTime]);
  
  // MIDIController管理用のRef
  const midiControllerRef = useRef<any>(null);
  // MIDI 初期化完了フラグ（初期化後に接続エフェクトを確実に発火させる）
  const [isMidiReady, setIsMidiReady] = useState(false);
  
  // VoiceInputController管理用のRef
  const voiceControllerRef = useRef<VoiceInputController | null>(null);
  // Voice初期化完了フラグ（将来のUI状態表示用）
  const [_isVoiceReady, setIsVoiceReady] = useState(false);
  // PIXIレンダラーのrefを追加（コールバック内での最新値アクセス用）
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  
  // pixiRendererの変更をrefに反映
  useEffect(() => {
    pixiRendererRef.current = pixiRenderer;
  }, [pixiRenderer]);

  // 共通音声システム + MIDIController初期化
  useEffect(() => {
    const initAudio = async () => {
      try {
        const midiModule = await ensureMidiModule();
        const { initializeAudioSystem, default: MIDIController } = midiModule;
        await Promise.all([
          initializeAudioSystem(),
          FantasySoundManager.init(0.8, 0.5, true),
        ]);
        FantasySoundManager.ensureContextsRunning();
        log.info('✅ 共通音声システム初期化完了');
        
        if (!midiControllerRef.current) {
            midiControllerRef.current = new MIDIController({
              onNoteOn: (note: number, _velocity?: number) => {
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
      if (midiControllerRef.current && settings.selectedMidiDevice && pixiRenderer && settings.inputMethod === 'midi') {
        const isRestored = await midiControllerRef.current.checkAndRestoreConnection();
        if (isRestored) {
          log.info('✅ 楽曲変更後のMIDI接続を復元しました');
        }
      }
    };

    // 少し遅延を入れて確実に復元
    const timer = setTimeout(restoreMidiConnection, 200);
    return () => clearTimeout(timer);
  }, [currentSong, settings.selectedMidiDevice, settings.inputMethod, pixiRenderer, isMidiReady]); // MIDI初期化完了後にも復元を試行

  // ===== 音声入力（Voice Input）の初期化と管理 =====
  useEffect(() => {
    // 音声入力モードでない場合は切断してスキップ
    if (settings.inputMethod !== 'voice') {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
        log.info('🔌 音声入力モードがオフのため切断');
      }
      return;
    }

    // 未選択（=まだ許可要求もしていない）場合は何もしない
    if (!settings.selectedAudioDevice) {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      return;
    }

    // VoiceInputControllerが未サポートの場合はスキップ
    if (!VoiceInputController.isSupported()) {
      log.warn('⚠️ 音声入力はこのブラウザでサポートされていません');
      return;
    }

    const initVoiceInput = async () => {
      try {
        // 既存のコントローラーがない場合は作成
        if (!voiceControllerRef.current) {
          voiceControllerRef.current = new VoiceInputController({
            onNoteOn: (note: number, _velocity?: number) => {
              handleNoteInput(note);
              // キーハイライト表示（refを使用して最新のレンダラーにアクセス）
              const renderer = pixiRendererRef.current;
              if (renderer) {
                renderer.highlightKey(note, true);
                setTimeout(() => {
                  // タイムアウト時も最新のレンダラーを使用
                  const currentRenderer = pixiRendererRef.current;
                  if (currentRenderer) {
                    currentRenderer.highlightKey(note, false);
                  }
                }, 150);
              }
            },
            onNoteOff: (note: number) => {
              // ノートオフの処理 - キーハイライトを解除
              const renderer = pixiRendererRef.current;
              if (renderer) {
                renderer.highlightKey(note, false);
              }
            },
            onConnectionChange: (connected: boolean) => {
              log.info(`🎤 音声入力接続状態変更: ${connected ? '接続' : '切断'}`);
            },
            onError: (error: string) => {
              log.error('🎤 音声入力エラー:', error);
            }
          });
          
          voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
          log.info('✅ VoiceInputController作成完了');
        }

        // 選択されたデバイスに接続
        if (settings.selectedAudioDevice) {
          const deviceId = settings.selectedAudioDevice === 'default' ? undefined : settings.selectedAudioDevice;
          const connected = await voiceControllerRef.current.connect(deviceId);
          if (connected) {
            log.info('✅ 音声入力接続完了');
            setIsVoiceReady(true);
          } else {
            log.warn('⚠️ 音声入力接続に失敗');
            setIsVoiceReady(false);
          }
        }
      } catch (error) {
        log.error('❌ 音声入力初期化エラー:', error);
        setIsVoiceReady(false);
      }
    };

    void initVoiceInput();

    return () => {
      // クリーンアップは inputMethod 切り替え時に行う
    };
  }, [settings.inputMethod, settings.selectedAudioDevice, handleNoteInput]); // pixiRendererはrefで管理するため依存関係から除外

  // 音声認識感度の反映
  useEffect(() => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
    }
  }, [settings.voiceSensitivity]);

  // 音声入力コントローラーのクリーンアップ
  useEffect(() => {
    return () => {
      if (voiceControllerRef.current) {
        voiceControllerRef.current.destroy();
        voiceControllerRef.current = null;
      }
    };
  }, []);

  // 入力方式切り替え時のMIDI/Voice切り替え処理
  useEffect(() => {
    if (settings.inputMethod === 'midi') {
      // MIDIモードの場合、音声入力を切断
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      // MIDIデバイスが選択されている場合は再接続
      if (midiControllerRef.current && settings.selectedMidiDevice) {
        void midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
      }
    } else if (settings.inputMethod === 'voice') {
      // 音声モードの場合、MIDI入力を切断
      if (midiControllerRef.current) {
        midiControllerRef.current.disconnect();
      }
    }
    // iOS: 入力方式切り替え後に音楽トラックの音量が低下する問題への対策
    const timer = setTimeout(() => {
      if (musicGainRef.current && audioContextRef.current) {
        musicGainRef.current.gain.setValueAtTime(
          settings.musicVolume,
          audioContextRef.current.currentTime
        );
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [settings.inputMethod, settings.selectedMidiDevice, settings.musicVolume]);

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
  // React state を経由せず pixiRendererRef で直接ハイライトすることで、
  // 同時ノート（左手＋右手）が同一フレームで通過してもすべてハイライトされる
  useEffect(() => {
    if (gameEngine) {
      gameEngine.setKeyHighlightCallback((pitch: number, _timestamp: number) => {
        if (!isPlayingRef.current) return;
        const renderer = pixiRendererRef.current;
        if (!renderer) return;
        renderer.highlightKey(pitch, true);
        setTimeout(() => {
          const r = pixiRendererRef.current;
          if (r) r.highlightKey(pitch, false);
        }, 150);
      });

      gameEngine.setAutoPlayNoteCallback((pitch: number, durationSec: number) => {
        if (!isPlayingRef.current) return;
        const releaseMs = Math.max(50, durationSec * 1000 - 30);
        const module = midiModuleRef.current;
        if (module) {
          void module.playNote(pitch, 80).catch(() => {});
          setTimeout(() => module.stopNote(pitch), releaseMs);
          return;
        }
        void ensureMidiModule().then((m) => {
          void m.playNote(pitch, 80).catch(() => {});
          setTimeout(() => m.stopNote(pitch), releaseMs);
        }).catch(() => {});
      });
    }
  }, [gameEngine, ensureMidiModule]);

  // BGM合成: 音源なし曲でノーツを自動演奏してBGMとして鳴らす（オートプレイと同じ経路）
  useEffect(() => {
    if (!gameEngine) return;

    if (!hasAudioTrack) {
      gameEngine.setEnableBgmSynthesis(true);
      gameEngine.setBgmNoteCallback((pitch: number, durationSec: number) => {
        if (!isPlayingRef.current) return;
        const releaseMs = Math.max(50, durationSec * 1000 - 30);
        const module = midiModuleRef.current;
        if (module) {
          void module.playNote(pitch, 80).catch(() => {});
          setTimeout(() => module.stopNote(pitch), releaseMs);
          return;
        }
        void ensureMidiModule().then((m) => {
          void m.playNote(pitch, 80).catch(() => {});
          setTimeout(() => m.stopNote(pitch), releaseMs);
        }).catch(() => {});
      });
    } else {
      gameEngine.setEnableBgmSynthesis(false);
    }
  }, [gameEngine, hasAudioTrack, ensureMidiModule]);
  
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
  
  // トランスポーズ変更時: 再生中なら現在位置から再開して PitchShift を正しく再構築
  const prevTransposeRef = useRef(settings.transpose);
  useEffect(() => {
    if (prevTransposeRef.current === settings.transpose) return;
    prevTransposeRef.current = settings.transpose;

    if (isPlayingRef.current && bufferSourceRef.current && audioContextRef.current) {
      // 現在の再生位置を取得してから再開
      const currentPos = getTimelineTime();
      playFromOffset(currentPos);
    } else if (pitchShiftRef.current) {
      // 停止中は PitchShift ノードのみ更新
      if (settings.transpose === 0) {
        disposePitchShiftNode();
      } else {
        (pitchShiftRef.current as any).pitch = getEffectivePitchShift();
      }
    }
  }, [settings.transpose, disposePitchShiftNode, getEffectivePitchShift, getTimelineTime, playFromOffset]);
  
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
  }, [handlePianoKeyPress, handlePianoKeyRelease, settings.noteNameStyle, settings.simpleDisplayMode, settings.pianoHeight, settings.transpose, settings.transposingInstrument, settings.selectedMidiDevice, settings.practiceGuide]);
  
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
        <ScoreOverlay className="absolute top-3 left-3 z-20 pointer-events-none" />
        {/* コンボ表示（右上） */}
        <LegendComboDisplay />
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
              </div>
            </div>
          ))()}
        
      </div>
    </div>
  );
};

// ===== サブコンポーネント =====
// 注：Phase 3でPIXI.jsレンダリングに移行済み
// HTMLベースのピアノキーボードは削除し、PIXI.js側で統一

export default GameEngineComponent; 