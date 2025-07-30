import { create } from 'zustand';
import { devLog } from '@/utils/logger';

export type GameType = 'quiz' | 'rhythm';
export type RhythmPattern = 'random' | 'progression';
export type GamePhase = 'ready' | 'playing' | 'paused' | 'gameover' | 'clear';

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopCount: number;
}

interface RhythmState {
  bpm: number;
  timeSignature: 3 | 4;
  loopMeasures: number;
  currentMeasure: number;
  currentBeat: number;
  nextChordTiming?: {
    measure: number;
    beat: number;
    timeMs: number;
  };
}

interface JudgmentTiming {
  targetTime: number;
  windowStart: number;
  windowEnd: number;
  isInWindow: boolean;
}

interface FantasyStore {
  // ゲーム基本情報
  gameType: GameType;
  rhythmPattern?: RhythmPattern;
  gamePhase: GamePhase;
  
  // オーディオ状態
  audioState: AudioState;
  audioElement: HTMLAudioElement | null;
  
  // リズム状態
  rhythmState: RhythmState;
  
  // 判定タイミング
  judgmentTimings: Map<string, JudgmentTiming>; // モンスターIDごとの判定タイミング
  
  // アクション
  setGameType: (type: GameType) => void;
  setRhythmPattern: (pattern: RhythmPattern) => void;
  setGamePhase: (phase: GamePhase) => void;
  
  // オーディオ制御
  initAudio: (url: string) => Promise<void>;
  playAudio: () => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  updateAudioTime: (time: number) => void;
  
  // リズム制御
  initRhythm: (bpm: number, timeSignature: 3 | 4, loopMeasures: number) => void;
  updateRhythmPosition: (timeMs: number) => void;
  calculateNextChordTiming: (measure: number, beat: number) => number;
  
  // 判定タイミング制御
  setJudgmentTiming: (monsterId: string, targetTime: number) => void;
  checkJudgmentWindow: (monsterId: string, currentTime: number) => boolean;
  clearJudgmentTiming: (monsterId: string) => void;
  
  // リセット
  reset: () => void;
}

const initialAudioState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  loopCount: 0,
};

const initialRhythmState: RhythmState = {
  bpm: 120,
  timeSignature: 4,
  loopMeasures: 8,
  currentMeasure: 1,
  currentBeat: 1,
};

export const useFantasyStore = create<FantasyStore>((set, get) => ({
  // 初期状態
  gameType: 'quiz',
  rhythmPattern: undefined,
  gamePhase: 'ready',
  audioState: initialAudioState,
  audioElement: null,
  rhythmState: initialRhythmState,
  judgmentTimings: new Map(),
  
  // ゲーム設定
  setGameType: (type) => set({ gameType: type }),
  setRhythmPattern: (pattern) => set({ rhythmPattern: pattern }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  
  // オーディオ制御
  initAudio: async (url) => {
    const audio = new Audio(url);
    audio.loop = true;
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', () => {
        set({
          audioElement: audio,
          audioState: {
            ...get().audioState,
            duration: audio.duration,
          },
        });
        resolve();
      });
      
      audio.addEventListener('error', (e) => {
        devLog.error('Audio load error:', e);
        reject(e);
      });
      
      audio.load();
    });
  },
  
  playAudio: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.play();
      set({
        audioState: {
          ...get().audioState,
          isPlaying: true,
        },
      });
    }
  },
  
  pauseAudio: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      set({
        audioState: {
          ...get().audioState,
          isPlaying: false,
        },
      });
    }
  },
  
  stopAudio: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      set({
        audioState: {
          ...get().audioState,
          isPlaying: false,
          currentTime: 0,
        },
      });
    }
  },
  
  updateAudioTime: (time) => {
    const { rhythmState, audioState } = get();
    const { loopMeasures, bpm, timeSignature } = rhythmState;
    
    // ループ処理
    const measureDuration = (60 / bpm) * timeSignature;
    const loopDuration = measureDuration * loopMeasures;
    
    if (time >= loopDuration) {
      const loopCount = Math.floor(time / loopDuration);
      const newTime = time % loopDuration;
      
      if (get().audioElement) {
        get().audioElement!.currentTime = newTime;
      }
      
      set({
        audioState: {
          ...audioState,
          currentTime: newTime,
          loopCount,
        },
      });
    } else {
      set({
        audioState: {
          ...audioState,
          currentTime: time,
        },
      });
    }
  },
  
  // リズム制御
  initRhythm: (bpm, timeSignature, loopMeasures) => {
    set({
      rhythmState: {
        ...get().rhythmState,
        bpm,
        timeSignature,
        loopMeasures,
      },
    });
  },
  
  updateRhythmPosition: (timeMs) => {
    const { bpm, timeSignature } = get().rhythmState;
    const beatDuration = 60000 / bpm; // ms per beat
    const measureDuration = beatDuration * timeSignature;
    
    const currentMeasure = Math.floor(timeMs / measureDuration) + 1;
    const measureOffset = timeMs % measureDuration;
    const currentBeat = Math.floor(measureOffset / beatDuration) + 1;
    
    set({
      rhythmState: {
        ...get().rhythmState,
        currentMeasure,
        currentBeat,
      },
    });
  },
  
  calculateNextChordTiming: (measure, beat) => {
    const { bpm, timeSignature, loopMeasures } = get().rhythmState;
    const beatDuration = 60000 / bpm;
    const measureDuration = beatDuration * timeSignature;
    
    // 現在のループ内での時間を計算
    const targetTime = (measure - 1) * measureDuration + (beat - 1) * beatDuration;
    
    return targetTime;
  },
  
  // 判定タイミング制御
  setJudgmentTiming: (monsterId, targetTime) => {
    const windowMs = 200; // 前後200ms
    const timing: JudgmentTiming = {
      targetTime,
      windowStart: targetTime - windowMs,
      windowEnd: targetTime + windowMs,
      isInWindow: false,
    };
    
    const newTimings = new Map(get().judgmentTimings);
    newTimings.set(monsterId, timing);
    set({ judgmentTimings: newTimings });
  },
  
  checkJudgmentWindow: (monsterId, currentTime) => {
    const timing = get().judgmentTimings.get(monsterId);
    if (!timing) return false;
    
    const isInWindow = currentTime >= timing.windowStart && currentTime <= timing.windowEnd;
    
    if (isInWindow !== timing.isInWindow) {
      const newTimings = new Map(get().judgmentTimings);
      newTimings.set(monsterId, { ...timing, isInWindow });
      set({ judgmentTimings: newTimings });
    }
    
    return isInWindow;
  },
  
  clearJudgmentTiming: (monsterId) => {
    const newTimings = new Map(get().judgmentTimings);
    newTimings.delete(monsterId);
    set({ judgmentTimings: newTimings });
  },
  
  // リセット
  reset: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    set({
      gameType: 'quiz',
      rhythmPattern: undefined,
      gamePhase: 'ready',
      audioState: initialAudioState,
      rhythmState: initialRhythmState,
      judgmentTimings: new Map(),
    });
  },
}));