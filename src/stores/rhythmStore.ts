import { create } from 'zustand';
import { FantasyStage, RhythmQuestion } from '@/types';
import { inWindow } from '@/utils/judgeWindow';
import { devLog } from '@/utils/logger';

interface RhythmState {
  // 状態
  questions: RhythmQuestion[];
  currentPointer: number;
  pattern: 'random' | 'progression';
  isActive: boolean;
  pendingChordInput: string | null;
  lastJudgedIndex: number;
  
  // Actions
  generate: (stage: FantasyStage) => void;
  judge: (chordInput: string, nowMs: number) => 'success' | 'fail' | 'pending';
  setChordInput: (chord: string) => void;
  clearChordInput: () => void;
  nextQuestion: () => void;
  reset: () => void;
  setActive: (active: boolean) => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  questions: [],
  currentPointer: 0,
  pattern: 'random',
  isActive: false,
  pendingChordInput: null,
  lastJudgedIndex: -1,
  
  generate: (stage: FantasyStage) => {
    const { startAt, readyDuration, bpm, timeSignature, measureCount, countInMeasures } = {
      startAt: 0, // 実際はtimeStoreから取得
      readyDuration: 2000,
      bpm: stage.bpm || 120,
      timeSignature: stage.time_signature || 4,
      measureCount: stage.measure_count || 8,
      countInMeasures: stage.count_in_measures || 1,
    };
    
    const msPerBeat = 60000 / bpm;
    const questions: RhythmQuestion[] = [];
    
    if (!stage.chord_progression_data) {
      // ランダムパターン
      devLog.debug('リズムモード: ランダムパターン生成');
      
      // カウントイン中も含めて全小節に出題
      for (let measure = 1; measure <= countInMeasures + measureCount; measure++) {
        const chord = stage.allowed_chords[Math.floor(Math.random() * stage.allowed_chords.length)];
        const measureFromStart = measure - 1; // 0-based
        const targetMs = readyDuration + (measureFromStart * timeSignature * msPerBeat);
        
        questions.push({
          id: `${measure}-1-${Date.now()}`,
          chord,
          measure,
          beat: 1,
          targetMs,
        });
      }
      
      set({ questions, pattern: 'random', currentPointer: 0, isActive: true });
    } else {
      // コード進行パターン
      devLog.debug('リズムモード: コード進行パターン生成');
      
      stage.chord_progression_data.chords.forEach((chordData) => {
        const measureFromStart = chordData.measure - 1 + countInMeasures;
        const beatFromStart = (measureFromStart * timeSignature) + (chordData.beat - 1);
        const targetMs = readyDuration + (beatFromStart * msPerBeat);
        
        questions.push({
          id: `${chordData.measure}-${chordData.beat}-${Date.now()}`,
          chord: chordData.chord,
          measure: chordData.measure,
          beat: chordData.beat,
          targetMs,
        });
      });
      
      set({ questions, pattern: 'progression', currentPointer: 0, isActive: true });
    }
    
    devLog.debug('リズムモード: 出題生成完了', { count: questions.length, pattern: get().pattern });
  },
  
  judge: (chordInput: string, nowMs: number) => {
    const state = get();
    if (!state.isActive) return 'pending';
    
    const { questions, currentPointer, lastJudgedIndex } = state;
    
    // 現在の問題から判定ウィンドウ内にある問題を探す
    for (let i = currentPointer; i < questions.length; i++) {
      const question = questions[i];
      
      // 既に判定済みの問題はスキップ
      if (i <= lastJudgedIndex) continue;
      
      // 判定ウィンドウ内かチェック
      if (inWindow(nowMs, question.targetMs)) {
        if (chordInput === question.chord) {
          // 成功
          devLog.debug('リズムモード: 判定成功', { chord: chordInput, timing: nowMs - question.targetMs });
          set({ 
            currentPointer: Math.min(i + 1, questions.length),
            lastJudgedIndex: i,
            pendingChordInput: null 
          });
          return 'success';
        }
      }
      
      // まだ早い場合は次の問題もチェックしない
      if (nowMs < question.targetMs - 200) {
        break;
      }
    }
    
    // どの問題にも該当しない
    return 'pending';
  },
  
  setChordInput: (chord: string) => {
    set({ pendingChordInput: chord });
  },
  
  clearChordInput: () => {
    set({ pendingChordInput: null });
  },
  
  nextQuestion: () => {
    const state = get();
    const nextPointer = state.currentPointer + 1;
    
    if (state.pattern === 'random' && nextPointer >= state.questions.length) {
      // ランダムパターンでループ時は新しく生成
      devLog.debug('リズムモード: ループ検出、新規生成');
      // 実際は再度generateを呼ぶ必要があるが、ここでは単純にポインタリセット
      set({ currentPointer: state.countInMeasures || 0 }); // カウントイン後に戻る
    } else {
      set({ currentPointer: nextPointer % state.questions.length });
    }
  },
  
  reset: () => {
    set({
      questions: [],
      currentPointer: 0,
      pattern: 'random',
      isActive: false,
      pendingChordInput: null,
      lastJudgedIndex: -1,
    });
  },
  
  setActive: (active: boolean) => {
    set({ isActive: active });
  },
}));