/**
 * リズムモード用オーディオプレイヤー
 * MP3ファイルの再生とループ管理を担当
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { devLog } from '@/utils/logger';

interface RhythmAudioPlayerProps {
  mp3Url: string;
  autoStart?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onLoop?: () => void;
}

const RhythmAudioPlayer: React.FC<RhythmAudioPlayerProps> = ({
  mp3Url,
  autoStart = false,
  onTimeUpdate,
  onLoop
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const rhythmStore = useRhythmStore();
  const { 
    isPlaying, 
    setAudioElement, 
    setAudioContext, 
    updateTime,
    getBeatDuration,
    getMeasureDuration,
    measureCount,
    timeSignature,
    loopStartTime
  } = rhythmStore;

  // AudioContextの初期化
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(audioContextRef.current);
      devLog.debug('rhythm', 'AudioContext initialized');
    }
  }, [setAudioContext]);

  // オーディオ要素の初期化
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
      
      // オーディオのプリロード
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7; // 初期音量
      
      devLog.debug('rhythm', 'Audio element initialized:', mp3Url);
    }
  }, [mp3Url, setAudioElement]);

  // タイムアップデート処理
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !isPlaying) return;

    const currentTime = audioRef.current.currentTime;
    const measureDuration = getMeasureDuration();
    const totalDuration = measureDuration * measureCount;

    // ループチェック
    if (currentTime >= totalDuration) {
      // 2小節目（ループ開始位置）に戻る
      audioRef.current.currentTime = loopStartTime;
      devLog.debug('rhythm', `Audio looped: ${currentTime.toFixed(2)}s → ${loopStartTime.toFixed(2)}s`);
      
      if (onLoop) {
        onLoop();
      }
    }

    // 時間更新
    updateTime(currentTime);
    
    if (onTimeUpdate) {
      onTimeUpdate(currentTime);
    }
  }, [isPlaying, getMeasureDuration, measureCount, loopStartTime, updateTime, onTimeUpdate, onLoop]);

  // アニメーションフレームでの更新
  const updateLoop = useCallback(() => {
    handleTimeUpdate();
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    }
  }, [handleTimeUpdate, isPlaying]);

  // 再生/停止の制御
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // 再生開始
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
      
      // 更新ループ開始
      animationFrameRef.current = requestAnimationFrame(updateLoop);
      
      devLog.debug('rhythm', 'Audio playback started');
    } else {
      // 再生停止
      audioRef.current.pause();
      
      // 更新ループ停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      devLog.debug('rhythm', 'Audio playback stopped');
    }
  }, [isPlaying, updateLoop]);

  // 自動開始
  useEffect(() => {
    if (autoStart && audioRef.current && audioRef.current.readyState >= 2) {
      rhythmStore.start();
    }
  }, [autoStart, rhythmStore]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      devLog.debug('rhythm', 'Audio player cleanup');
    };
  }, []);

  // メタデータ読み込み完了時の処理
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      devLog.debug('rhythm', 'Audio metadata loaded:', {
        duration: audioRef.current.duration,
        readyState: audioRef.current.readyState
      });
    }
  };

  // エラーハンドリング
  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e);
  };

  return (
    <audio
      ref={audioRef}
      src={mp3Url}
      onLoadedMetadata={handleLoadedMetadata}
      onError={handleError}
      style={{ display: 'none' }}
    />
  );
};

export default RhythmAudioPlayer;