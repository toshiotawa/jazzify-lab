import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// リズムモード用のコード進行データ型
export interface RhythmChordData {
  chord: string;
  measure: number;
  beat: number;  // 1.0 = 1拍目、1.5 = 1拍目の裏、3.75 = 3拍目の16分音符4つ目
}

// リズムモード判定結果
export interface RhythmJudgment {
  timing: 'perfect' | 'good' | 'miss';
  timeDiff: number;  // 判定タイミングとの差（ミリ秒）
  chord: string;
}

// リズムストアの状態
interface RhythmStoreState {
  // 基本設定
  bpm: number;
  timeSignature: number;  // 3 or 4
  measureCount: number;
  loopMeasures: number;
  
  // 再生状態
  isPlaying: boolean;
  currentTime: number;  // 現在の再生時間（秒）
  currentMeasure: number;  // 現在の小節（1ベース）
  currentBeat: number;  // 現在の拍（1ベース）
  
  // オーディオ関連
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  startTime: number;  // 再生開始時刻（AudioContext時間）
  loopStartTime: number;  // ループ開始位置（秒）
  
  // コード進行データ（プログレッションモード用）
  chordProgressionData: RhythmChordData[];
  currentChordIndex: number;
  
  // 判定関連
  judgmentTolerance: number;  // 判定許容範囲（ミリ秒）
  lastJudgment: RhythmJudgment | null;
  
  // アクション
  initialize: (bpm: number, timeSignature: number, measureCount: number, loopMeasures: number) => void;
  setChordProgressionData: (data: RhythmChordData[]) => void;
  start: () => void;
  stop: () => void;
  updateTime: (time: number) => void;
  setAudioElement: (element: HTMLAudioElement) => void;
  setAudioContext: (context: AudioContext) => void;
  
  // 判定関連
  checkTiming: (chord: string) => RhythmJudgment;
  getNextChordTiming: () => { chord: string; timing: number } | null;
  getCurrentChordTiming: () => { chord: string; timing: number } | null;
  
  // ユーティリティ
  getMeasureTime: (measure: number, beat: number) => number;
  getCurrentMeasureAndBeat: (time: number) => { measure: number; beat: number };
  getBeatDuration: () => number;
  getMeasureDuration: () => number;
}

// デフォルト値
const defaultState = {
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  loopMeasures: 8,
  isPlaying: false,
  currentTime: 0,
  currentMeasure: 1,
  currentBeat: 1,
  audioContext: null,
  audioElement: null,
  startTime: 0,
  loopStartTime: 0,  // 2小節目から（1小節目はカウント用）
  chordProgressionData: [],
  currentChordIndex: 0,
  judgmentTolerance: 200,  // 前後200ms
  lastJudgment: null,
};

export const useRhythmStore = create<RhythmStoreState>()(
  devtools(
    immer((set, get) => ({
      ...defaultState,
      
      initialize: (bpm, timeSignature, measureCount, loopMeasures) => {
        set((state) => {
          state.bpm = bpm;
          state.timeSignature = timeSignature;
          state.measureCount = measureCount;
          state.loopMeasures = loopMeasures;
          state.currentTime = 0;
          state.currentMeasure = 1;
          state.currentBeat = 1;
          state.isPlaying = false;
          state.currentChordIndex = 0;
          
          // ループ開始位置を計算（2小節目から）
          const beatDuration = 60 / bpm;
          state.loopStartTime = beatDuration * timeSignature;
        });
      },
      
      setChordProgressionData: (data) => {
        set((state) => {
          state.chordProgressionData = data;
          state.currentChordIndex = 0;
        });
      },
      
      start: () => {
        const state = get();
        if (!state.audioContext || !state.audioElement) return;
        
        set((draft) => {
          draft.isPlaying = true;
          draft.startTime = state.audioContext!.currentTime;
          draft.currentTime = 0;
          draft.currentMeasure = 1;
          draft.currentBeat = 1;
          draft.currentChordIndex = 0;
        });
        
        // オーディオ再生開始
        if (state.audioElement) {
          state.audioElement.currentTime = 0;
          state.audioElement.play();
        }
      },
      
      stop: () => {
        const state = get();
        
        set((draft) => {
          draft.isPlaying = false;
          draft.currentTime = 0;
          draft.currentMeasure = 1;
          draft.currentBeat = 1;
          draft.currentChordIndex = 0;
        });
        
        // オーディオ停止
        if (state.audioElement) {
          state.audioElement.pause();
          state.audioElement.currentTime = 0;
        }
      },
      
      updateTime: (time) => {
        const state = get();
        const { measure, beat } = state.getCurrentMeasureAndBeat(time);
        
        set((draft) => {
          draft.currentTime = time;
          draft.currentMeasure = measure;
          draft.currentBeat = beat;
          
          // ループ処理
          const measureDuration = state.getMeasureDuration();
          const totalDuration = measureDuration * state.measureCount;
          
          if (time >= totalDuration && state.audioElement) {
            // 2小節目にループ
            const newTime = state.loopStartTime + (time - totalDuration);
            draft.currentTime = newTime;
            state.audioElement.currentTime = newTime;
          }
        });
      },
      
      setAudioElement: (element) => {
        set((state) => {
          state.audioElement = element;
        });
      },
      
      setAudioContext: (context) => {
        set((state) => {
          state.audioContext = context;
        });
      },
      
      checkTiming: (chord) => {
        const state = get();
        const currentTiming = state.getCurrentChordTiming();
        
        if (!currentTiming || currentTiming.chord !== chord) {
          return {
            timing: 'miss' as const,
            timeDiff: Infinity,
            chord
          };
        }
        
        const timeDiff = Math.abs(state.currentTime - currentTiming.timing) * 1000; // ミリ秒に変換
        
        let timing: 'perfect' | 'good' | 'miss';
        if (timeDiff <= 50) {
          timing = 'perfect';
        } else if (timeDiff <= state.judgmentTolerance) {
          timing = 'good';
        } else {
          timing = 'miss';
        }
        
        const judgment = { timing, timeDiff, chord };
        
        set((draft) => {
          draft.lastJudgment = judgment;
          
          // 成功したら次のコードへ
          if (timing !== 'miss' && state.chordProgressionData.length > 0) {
            draft.currentChordIndex = (draft.currentChordIndex + 1) % state.chordProgressionData.length;
          }
        });
        
        return judgment;
      },
      
      getNextChordTiming: () => {
        const state = get();
        if (state.chordProgressionData.length === 0) return null;
        
        const nextIndex = (state.currentChordIndex + 1) % state.chordProgressionData.length;
        const nextChord = state.chordProgressionData[nextIndex];
        const timing = state.getMeasureTime(nextChord.measure, nextChord.beat);
        
        return { chord: nextChord.chord, timing };
      },
      
      getCurrentChordTiming: () => {
        const state = get();
        if (state.chordProgressionData.length === 0) return null;
        
        const currentChord = state.chordProgressionData[state.currentChordIndex];
        const timing = state.getMeasureTime(currentChord.measure, currentChord.beat);
        
        // 判定タイミングの前後200ms以内かチェック
        const timeDiff = Math.abs(state.currentTime - timing) * 1000;
        if (timeDiff > state.judgmentTolerance) return null;
        
        return { chord: currentChord.chord, timing };
      },
      
      getMeasureTime: (measure, beat) => {
        const state = get();
        const beatDuration = state.getBeatDuration();
        const measureDuration = state.getMeasureDuration();
        
        return (measure - 1) * measureDuration + (beat - 1) * beatDuration;
      },
      
      getCurrentMeasureAndBeat: (time) => {
        const state = get();
        const measureDuration = state.getMeasureDuration();
        const beatDuration = state.getBeatDuration();
        
        const measure = Math.floor(time / measureDuration) + 1;
        const beatInMeasure = ((time % measureDuration) / beatDuration) + 1;
        
        return {
          measure: Math.min(measure, state.measureCount),
          beat: Math.min(Math.floor(beatInMeasure), state.timeSignature)
        };
      },
      
      getBeatDuration: () => {
        const state = get();
        return 60 / state.bpm;
      },
      
      getMeasureDuration: () => {
        const state = get();
        return state.getBeatDuration() * state.timeSignature;
      }
    }))
  )
);