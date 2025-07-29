/**
 * useRhythmMode
 * リズムモード専用のカスタムフック
 * - BGMループ再生
 * - Timeline管理
 * - 判定タイミング処理
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FantasyStage } from '@/types';
import { LoopingBgmPlayer } from '@/utils/LoopingBgmPlayer';
import { Timeline } from '@/lib/rhythm/Timeline';
import { RandomProblemGenerator } from '@/lib/rhythm/RandomProblemGenerator';
import { ProgressionProblemGenerator } from '@/lib/rhythm/ProgressionProblemGenerator';

export interface RhythmModeState {
  isReady: boolean;
  readyCountdown: number;
  currentBar: number;
  currentBeat: number;
  loopCount: number;
  barProgress: number;
  isJudgmentTiming: boolean;
  debugInfo?: {
    bar: number;
    beat: number;
    loop: number;
    bpm: number;
    timeSig: number;
  };
}

export interface UseRhythmModeOptions {
  stage: FantasyStage | null;
  onBeat?: (bar: number, beat: number) => void;
  onBarChange?: (bar: number) => void;
  onJudgmentWindow?: (isInWindow: boolean) => void;
  debugMode?: boolean;
}

const READY_COUNTDOWN_SECONDS = 3;
const JUDGMENT_RATIO = 0.8; // 80%位置
const JUDGMENT_WINDOW_MS = 200; // ±200ms

export const useRhythmMode = ({
  stage,
  onBeat,
  onBarChange,
  onJudgmentWindow,
  debugMode = false
}: UseRhythmModeOptions) => {
  const [state, setState] = useState<RhythmModeState>({
    isReady: false,
    readyCountdown: READY_COUNTDOWN_SECONDS,
    currentBar: 0,
    currentBeat: 0,
    loopCount: 0,
    barProgress: 0,
    isJudgmentTiming: false
  });

  const bgmPlayerRef = useRef<LoopingBgmPlayer | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const problemGeneratorRef = useRef<RandomProblemGenerator | ProgressionProblemGenerator | null>(null);
  const readyIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastBarRef = useRef<number>(-1);

  // BGMとTimelineの初期化
  const initialize = useCallback(async () => {
    if (!stage || stage.game_mode !== 'rhythm' || !stage.audio_url || !stage.music_meta) {
      console.warn('Invalid stage for rhythm mode');
      return;
    }

    try {
      // BGMプレイヤーを作成
      const bgmPlayer = new LoopingBgmPlayer(
        stage.audio_url,
        stage.music_meta,
        100 // クロスフェード100ms
      );
      await bgmPlayer.load();
      bgmPlayerRef.current = bgmPlayer;

      // Timelineを作成
      const timeline = new Timeline({
        bpm: stage.music_meta.bpm,
        timeSig: stage.music_meta.timeSig,
        bars: stage.music_meta.bars
      });
      timelineRef.current = timeline;

      // 問題生成器を作成
      if (stage.pattern_type === 'random') {
        const generator = new RandomProblemGenerator({
          allowedChords: stage.allowed_chords,
          timeline
        });
        problemGeneratorRef.current = generator;
      } else if (stage.pattern_type === 'progression' && stage.chord_progression) {
        const generator = new ProgressionProblemGenerator({
          chordProgression: stage.chord_progression,
          timeline
        });
        problemGeneratorRef.current = generator;
      }

      // 拍コールバックを設定
      timeline.onBeat((barIdx, beatIdx) => {
        if (onBeat) onBeat(barIdx, beatIdx);
        
        // 小節が変わった場合
        if (barIdx !== lastBarRef.current) {
          lastBarRef.current = barIdx;
          if (onBarChange) onBarChange(barIdx);
        }
      });

      console.log('Rhythm mode initialized');
    } catch (error) {
      console.error('Failed to initialize rhythm mode:', error);
    }
  }, [stage, onBeat, onBarChange]);

  // Readyフェーズ開始
  const startReady = useCallback(() => {
    setState(prev => ({
      ...prev,
      isReady: true,
      readyCountdown: READY_COUNTDOWN_SECONDS
    }));

    // カウントダウン
    let countdown = READY_COUNTDOWN_SECONDS;
    readyIntervalRef.current = window.setInterval(() => {
      countdown--;
      setState(prev => ({
        ...prev,
        readyCountdown: countdown
      }));

      if (countdown <= 0) {
        if (readyIntervalRef.current) {
          clearInterval(readyIntervalRef.current);
          readyIntervalRef.current = null;
        }
        startGame();
      }
    }, 1000);
  }, []);

  // ゲーム開始
  const startGame = useCallback(() => {
    if (!bgmPlayerRef.current || !timelineRef.current || !problemGeneratorRef.current) {
      console.error('Rhythm mode not initialized');
      return;
    }

    setState(prev => ({
      ...prev,
      isReady: false,
      readyCountdown: 0
    }));

    // BGM再生開始
    bgmPlayerRef.current.start();
    const startTime = bgmPlayerRef.current.getStartTime();

    // Timeline開始（BGMと同期）
    timelineRef.current.start(startTime);

    // 問題生成開始
    problemGeneratorRef.current.start();

    // 更新ループ開始
    updateLoop();
  }, []);

  // 更新ループ
  const updateLoop = useCallback(() => {
    const update = () => {
      if (!timelineRef.current) return;

      const timeline = timelineRef.current;
      const bar = timeline.getCurrentBar();
      const beat = timeline.getCurrentBeat();
      const loop = timeline.getLoopCount();
      const barProgress = timeline.getBarProgress();
      const isJudgment = timeline.isJudgmentTiming(JUDGMENT_RATIO, JUDGMENT_WINDOW_MS);

      // 判定タイミングの変化を検出
      if (isJudgment !== state.isJudgmentTiming && onJudgmentWindow) {
        onJudgmentWindow(isJudgment);
      }

      setState(prev => ({
        ...prev,
        currentBar: bar,
        currentBeat: beat,
        loopCount: loop,
        barProgress: barProgress,
        isJudgmentTiming: isJudgment,
        debugInfo: debugMode ? {
          bar,
          beat,
          loop,
          bpm: timeline.getBpm(),
          timeSig: timeline.getTimeSig()
        } : undefined
      }));

      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();
  }, [debugMode, onJudgmentWindow, state.isJudgmentTiming]);

  // 停止
  const stop = useCallback(() => {
    // Readyカウントダウン停止
    if (readyIntervalRef.current) {
      clearInterval(readyIntervalRef.current);
      readyIntervalRef.current = null;
    }

    // 更新ループ停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // BGM停止
    if (bgmPlayerRef.current) {
      bgmPlayerRef.current.stop();
    }

    // Timeline停止
    if (timelineRef.current) {
      timelineRef.current.stop();
    }

    // 問題生成停止
    if (problemGeneratorRef.current) {
      problemGeneratorRef.current.stop();
    }

    // 状態リセット
    setState({
      isReady: false,
      readyCountdown: READY_COUNTDOWN_SECONDS,
      currentBar: 0,
      currentBeat: 0,
      loopCount: 0,
      barProgress: 0,
      isJudgmentTiming: false
    });
  }, []);

  // BGM音量設定
  const setVolume = useCallback((volume: number) => {
    if (bgmPlayerRef.current) {
      bgmPlayerRef.current.setVolume(volume);
    }
  }, []);

  // 判定チェック
  const checkJudgment = useCallback((): boolean => {
    if (!timelineRef.current) return false;
    return timelineRef.current.isJudgmentTiming(JUDGMENT_RATIO, JUDGMENT_WINDOW_MS);
  }, []);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    state,
    initialize,
    startReady,
    stop,
    setVolume,
    checkJudgment,
    timeline: timelineRef.current,
    problemGenerator: problemGeneratorRef.current,
    bgmPlayer: bgmPlayerRef.current
  };
};

export default useRhythmMode;