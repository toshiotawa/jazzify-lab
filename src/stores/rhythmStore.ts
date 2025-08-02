import { create } from 'zustand';
import { inJudgeWindow } from '@/utils/judgeWindow';
import { useTimeStore } from '@/stores/timeStore';
import type { FantasyStage } from '@/types';

export type RhythmQuestion = {
  id: string;
  chord: string;
  targetMs: number;
  spawnMs: number;   // 画面右端に出現する絶対時刻
};

interface RhythmState {
  pattern: 'random' | 'progression';
  questions: RhythmQuestion[];
  pointer: number;
  generate(stage: FantasyStage): void;
  tick(now: number): 'success' | 'none';
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  pattern: 'random',
  questions: [],
  pointer: 0,
  generate: stage => {
    const t = useTimeStore.getState();
    const msecPerBeat = 60000 / t.bpm;
    const secPerMeas = (60 / t.bpm) * t.timeSignature;
    const startMs = performance.now() + t.readyDuration;

    const qs: RhythmQuestion[] = [];
    if (stage.chord_progression_data) {
      // progression
      stage.chord_progression_data.chords.forEach((c, i) => {
        const beats =
          (c.measure - 1 + stage.count_in_measures!) * t.timeSignature +
          (c.beat - 1);
        const target = startMs + beats * msecPerBeat;
        qs.push({
          id: `p_${i}`,
          chord: c.chord,
          targetMs: target,
          spawnMs: target - secPerMeas * 2 * 1000 /* 2 小節前 */
        });
      });
      set({ pattern: 'progression', questions: qs, pointer: 0 });
    } else {
      // random – 1小節毎
      for (let m = 0; m < stage.measure_count!; m++) {
        const beats = (m + stage.count_in_measures!) * t.timeSignature;
        const idx = Math.floor(Math.random() * stage.allowed_chords.length);
        const target = startMs + beats * msecPerBeat;
        qs.push({
          id: `r_${m}`,
          chord: stage.allowed_chords[idx],
          targetMs: target,
          spawnMs: target - secPerMeas * 2 * 1000
        });
      }
      set({ pattern: 'random', questions: qs, pointer: 0 });
    }
  },
  tick: now => {
    const { questions, pointer } = get();
    const q = questions[pointer];
    if (!q) return 'none';
    if (inJudgeWindow(now, q.targetMs)) {
      set({ pointer: pointer + 1 });
      return 'success';
    }
    return 'none';
  }
}));