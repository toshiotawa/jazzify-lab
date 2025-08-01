import { create } from 'zustand';
import { JudgmentWindow, ChordProgressionData } from '@/types';

interface RhythmState {
  // 判定ウィンドウ管理
  judgmentWindows: JudgmentWindow[];
  currentWindowIndex: number;
  
  // コード進行データ
  progressionData: ChordProgressionData | null;
  isRandomMode: boolean;
  
  // 判定結果
  lastJudgmentTime: number;
  consecutiveMisses: number;
  
  // 関数
  initializeRhythmMode: (
    progressionData: ChordProgressionData | null,
    allowedChords: string[],
    bpm: number,
    timeSignature: number,
    measureCount: number,
    countInMeasures: number
  ) => void;
  
  generateRandomChord: (measure: number, allowedChords: string[]) => string;
  
  updateJudgmentWindows: (currentTime: number, bpm: number, timeSignature: number) => boolean;
  
  judgeChord: (chord: string, currentTime: number) => {
    success: boolean;
    timing: 'early' | 'perfect' | 'late' | 'miss';
  };
  
  resetRhythmMode: () => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  judgmentWindows: [],
  currentWindowIndex: 0,
  progressionData: null,
  isRandomMode: true,
  lastJudgmentTime: 0,
  consecutiveMisses: 0,
  
  initializeRhythmMode: (progressionData, allowedChords, bpm, timeSignature, measureCount, countInMeasures) => {
    const isRandom = !progressionData || !progressionData.chords || progressionData.chords.length === 0;
    const windows: JudgmentWindow[] = [];
    
    if (!isRandom && progressionData) {
      // プログレッションモード: JSONデータを使用
      progressionData.chords.forEach((chordData) => {
        const beatTime = 60000 / bpm; // 1拍の時間（ms）
        const measureTime = beatTime * timeSignature; // 1小節の時間（ms）
        const startTime = (chordData.measure - 1 + countInMeasures) * measureTime + (chordData.beat - 1) * beatTime;
        
        windows.push({
          startTime: startTime - 200, // 前200ms
          endTime: startTime + 200,   // 後200ms
          chord: chordData.chord,
          measure: chordData.measure,
          beat: chordData.beat,
          judged: false
        });
      });
    }
    
    set({
      progressionData,
      isRandomMode: isRandom,
      judgmentWindows: windows,
      currentWindowIndex: 0,
      lastJudgmentTime: 0,
      consecutiveMisses: 0
    });
  },
  
  generateRandomChord: (measure, allowedChords) => {
    // ランダムにコードを選択
    return allowedChords[Math.floor(Math.random() * allowedChords.length)];
  },
  
  updateJudgmentWindows: (currentTime, _bpm, _timeSignature) => {
    const state = get();
    
    if (!state.isRandomMode) {
      // プログレッションモード: 現在の判定ウィンドウをチェック
      const windows = [...state.judgmentWindows];
      let currentIndex = state.currentWindowIndex;
      let missedThisTurn = false;
      
      // 現在のウィンドウが終了したら次へ
      while (currentIndex < windows.length && currentTime > windows[currentIndex].endTime) {
        if (!windows[currentIndex].judged) {
          // ミス判定
          missedThisTurn = true;
          set({ consecutiveMisses: state.consecutiveMisses + 1 });
        }
        currentIndex++;
      }
      
      // ループ処理
      if (currentIndex >= windows.length) {
        // 全てのウィンドウを未判定にリセット
        windows.forEach(w => w.judged = false);
        currentIndex = 0;
      }
      
      set({
        judgmentWindows: windows,
        currentWindowIndex: currentIndex
      });
      
      return missedThisTurn; // ミスがあったかどうかを返す
    }
    
    return false;
  },
  
  judgeChord: (chord, currentTime) => {
    const state = get();
    
    if (state.isRandomMode) {
      // ランダムモード: 常に成功
      return { success: true, timing: 'perfect' as const };
    }
    
    // プログレッションモード: 判定ウィンドウをチェック
    const currentWindow = state.judgmentWindows[state.currentWindowIndex];
    
    if (!currentWindow || currentWindow.judged) {
      return { success: false, timing: 'miss' as const };
    }
    
    // 判定ウィンドウ内かチェック
    if (currentTime >= currentWindow.startTime && currentTime <= currentWindow.endTime) {
      if (chord === currentWindow.chord) {
        // 正解
        const windows = [...state.judgmentWindows];
        windows[state.currentWindowIndex].judged = true;
        
        const centerTime = (currentWindow.startTime + currentWindow.endTime) / 2;
        const timingError = Math.abs(currentTime - centerTime);
        
        let timing: 'early' | 'perfect' | 'late';
        if (currentTime < centerTime) {
          timing = timingError < 50 ? 'perfect' : 'early';
        } else {
          timing = timingError < 50 ? 'perfect' : 'late';
        }
        
        set({
          judgmentWindows: windows,
          lastJudgmentTime: currentTime,
          consecutiveMisses: 0
        });
        
        return { success: true, timing };
      }
    }
    
    return { success: false, timing: 'miss' as const };
  },
  
  resetRhythmMode: () => {
    set({
      judgmentWindows: [],
      currentWindowIndex: 0,
      progressionData: null,
      isRandomMode: true,
      lastJudgmentTime: 0,
      consecutiveMisses: 0
    });
  }
}));