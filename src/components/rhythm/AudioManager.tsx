/**
 * AudioManager - 音楽ファイルの再生とループ制御を管理
 */

import React, { useEffect, useRef } from 'react';

interface AudioManagerProps {
  src: string;
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  timeSignature: number;
  loopMeasures: number;
  onTimeUpdate: (time: number) => void;
  onAudioReady: (duration: number) => void;
  onError: (error: string) => void;
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  src,
  isPlaying,
  currentTime,
  bpm,
  timeSignature,
  loopMeasures,
  onTimeUpdate,
  onAudioReady,
  onError,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // 音楽ファイルの読み込み
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      onAudioReady(audio.duration);
    };

    const handleError = (_e: Event) => {
      onError(`音楽ファイルの読み込みに失敗しました: ${src}`);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
    };
  }, [src, onAudioReady, onError]);

  // 再生/停止制御
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        onError(`音楽の再生に失敗しました: ${error.message}`);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, onError]);

  // 時間更新とループ制御
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const currentAudioTime = audio.currentTime;
      
      // フレームレート調整（30fps程度）
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < 33) return;
      lastUpdateTimeRef.current = now;

      // ループ制御
      const secondsPerBeat = 60 / bpm;
      const secondsPerMeasure = secondsPerBeat * timeSignature;
      const loopStartTime = secondsPerMeasure; // 2小節目の開始
      const loopEndTime = secondsPerMeasure * (loopMeasures + 1); // 指定小節数後

      if (currentAudioTime >= loopEndTime) {
        // ループポイントに戻る
        audio.currentTime = loopStartTime;
        onTimeUpdate(loopStartTime);
      } else {
        onTimeUpdate(currentAudioTime);
      }
    }, 16); // 約60fps

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, timeSignature, loopMeasures, onTimeUpdate]);

  // 外部からの時間設定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 外部から時間が設定された場合
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
      style={{ display: 'none' }}
      aria-label="背景音楽"
    >
      <track kind="captions" src="" srcLang="ja" label="Japanese" default />
    </audio>
  );
};

export default AudioManager;