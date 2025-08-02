import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { useTimeStore } from '@/stores/timeStore';
import type { FantasyStage } from '@/types';
import { inWindow } from '@/utils/judgeWindow';
import { useEnemyStore } from '@/stores/enemyStore';
import { usePlayerStore } from '@/stores/playerStore';

type Question = {
  id: string;
  measure: number;
  beat: number;
  chord: string;
  targetMs: number;
};

interface RhythmState {
  questions: Question[];
  pointer: number;
  pattern: 'random' | 'progression';
  generate: (stage: FantasyStage) => void;
  tick: (nowMs: number) => void;
  isFinished: boolean;
  reset: () => void;
  judgeSuccess: () => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  questions: [],
  pointer: 0,
  pattern: 'random',
  isFinished: false,
  
  generate: (stage) => {
    const timeStore = useTimeStore.getState();
    const msecPerBeat = 60000 / (stage.bpm || 120);
    const beatsPerMeasure = stage.time_signature || 4;
    const questions: Question[] = [];

    if (!stage.chord_progression_data) {
      // ランダムパターン
      set({ pattern: 'random' });
      const measureCount = stage.measure_count || 8;
      
      for (let m = 1; m <= measureCount; m++) {
        const chord = stage.allowed_chords[Math.floor(Math.random() * stage.allowed_chords.length)];
        const targetMs = timeStore.readyDuration + ((m - 1 + (stage.count_in_measures || 0)) * beatsPerMeasure) * msecPerBeat;
        questions.push({
          id: nanoid(),
          measure: m,
          beat: 1,
          chord,
          targetMs,
        });
      }
    } else {
      // プログレッションパターン
      set({ pattern: 'progression' });
      const data = stage.chord_progression_data.chords;
      
      data.forEach((d) => {
        const targetMs = timeStore.readyDuration + ((d.measure - 1 + (stage.count_in_measures || 0)) * beatsPerMeasure + (d.beat - 1)) * msecPerBeat;
        questions.push({
          id: nanoid(),
          measure: d.measure,
          beat: d.beat,
          chord: d.chord,
          targetMs,
        });
      });
    }

    set({ questions, pointer: 0, isFinished: false });
  },
  
  tick: (now) => {
    const { questions, pointer } = get();
    if (pointer >= questions.length) return;
    
    const q = questions[pointer];
    if (!q) return;

    const timeStore = useTimeStore.getState();
    if (!timeStore.startAt) return;
    
    const elapsedMs = now - timeStore.startAt;

    if (inWindow(elapsedMs, q.targetMs)) {
      // 判定ウィンドウ内 - 成功判定待ち
      // 実際の成功/失敗判定はRhythmGameScreenから呼ばれる
    } else if (elapsedMs > q.targetMs + 200) {
      // 判定ウィンドウを過ぎた - 失敗
      usePlayerStore.getState().damage(1);
      set({ pointer: pointer + 1 });
      
      if (pointer + 1 >= questions.length) {
        set({ isFinished: true });
      }
    }
  },
  
  // 成功時に呼ばれる
  judgeSuccess: () => {
    const { pointer, questions } = get();
    if (pointer >= questions.length) return;
    
    useEnemyStore.getState().attack(1);
    set({ pointer: pointer + 1 });
    
    if (pointer + 1 >= questions.length) {
      set({ isFinished: true });
    }
  },
  
  reset: () => {
    set({
      questions: [],
      pointer: 0,
      pattern: 'random',
      isFinished: false,
    });
  },
}));