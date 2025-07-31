/**
 * ファンタジーモードの統一時間管理ストア
 * BGMの再生状態、ゲームフェーズ、拍子・小節情報を一元管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { devLog } from '@/utils/logger';

export type GamePhase = 'ready' | 'playing' | 'complete';

interface FantasyTimeState {
  // ゲームフェーズ
  gamePhase: GamePhase;
  
  // BGM関連
  bgmUrl: string | null;
  bgmVolume: number;
  isPlaying: boolean;
  
  // 時間管理
  currentMeasure: number;
  currentBeat: number;
  bpm: number;
  timeSignature: string;
  measureCount: number;
  countInMeasures: number;
  
  // BGMオーディオ要素の参照
  audioRef: HTMLAudioElement | null;
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setBgmSettings: (settings: {
    url?: string;
    volume?: number;
    bpm?: number;
    timeSignature?: string;
    measureCount?: number;
    countInMeasures?: number;
  }) => void;
  setCurrentPosition: (measure: number, beat: number) => void;
  startBgm: () => void;
  stopBgm: () => void;
  setAudioRef: (audio: HTMLAudioElement | null) => void;
  reset: () => void;
}

const initialState = {
  gamePhase: 'ready' as GamePhase,
  bgmUrl: null,
  bgmVolume: 0.7,
  isPlaying: false,
  currentMeasure: 1,
  currentBeat: 1,
  bpm: 120,
  timeSignature: '4/4',
  measureCount: 8,
  countInMeasures: 2,
  audioRef: null,
};

export const useFantasyTimeStore = create<FantasyTimeState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setGamePhase: (phase) => {
        devLog.debug('🎮 ファンタジーゲームフェーズ変更:', phase);
        set({ gamePhase: phase });
      },

      setBgmSettings: (settings) => {
        devLog.debug('🎵 BGM設定更新:', settings);
        set((state) => ({
          bgmUrl: settings.url !== undefined ? settings.url : state.bgmUrl,
          bgmVolume: settings.volume !== undefined ? settings.volume : state.bgmVolume,
          bpm: settings.bpm !== undefined ? settings.bpm : state.bpm,
          timeSignature: settings.timeSignature !== undefined ? settings.timeSignature : state.timeSignature,
          measureCount: settings.measureCount !== undefined ? settings.measureCount : state.measureCount,
          countInMeasures: settings.countInMeasures !== undefined ? settings.countInMeasures : state.countInMeasures,
        }));
        
        // 音量変更時は即座に反映
        const { audioRef, bgmVolume } = get();
        if (audioRef && settings.volume !== undefined) {
          audioRef.volume = settings.volume;
        }
      },

      setCurrentPosition: (measure, beat) => {
        set({ currentMeasure: measure, currentBeat: beat });
      },

      startBgm: () => {
        const { audioRef } = get();
        if (audioRef) {
          audioRef.play().catch(err => {
            console.error('BGM再生エラー:', err);
          });
          set({ isPlaying: true });
          devLog.debug('🎵 BGM再生開始');
        }
      },

      stopBgm: () => {
        const { audioRef } = get();
        if (audioRef) {
          audioRef.pause();
          audioRef.currentTime = 0;
          set({ isPlaying: false });
          devLog.debug('🎵 BGM停止');
        }
      },

      setAudioRef: (audio) => {
        // 既存のaudioRefがあればクリーンアップ
        const { audioRef: oldAudio } = get();
        if (oldAudio && oldAudio !== audio) {
          oldAudio.pause();
          oldAudio.src = '';
        }
        
        set({ audioRef: audio });
        
        // 新しいaudioRefに音量を設定
        if (audio) {
          audio.volume = get().bgmVolume;
        }
      },

      reset: () => {
        devLog.debug('🔄 ファンタジー時間管理ストアリセット');
        const { audioRef } = get();
        if (audioRef) {
          audioRef.pause();
          audioRef.src = '';
        }
        set(initialState);
      },
    }),
    {
      name: 'fantasy-time-store',
    }
  )
);