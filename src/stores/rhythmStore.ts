import { create } from 'zustand';
import { FantasyStage } from '@/components/fantasy/FantasyGameEngine';
import { useTimeStore } from './timeStore';

export interface RhythmNote {
  id: string;
  chord: string;
  measure: number;
  beat: number;
  time: number; // 絶対時間（秒）
  judged: boolean;
  judgmentResult: 'perfect' | 'miss' | null;
}

interface RhythmState {
  // ノーツ管理
  notes: RhythmNote[];
  nextNoteId: number;
  
  // 判定ウィンドウ（±200ms）
  judgmentWindow: number;
  
  // 現在のステージ情報
  currentStage: FantasyStage | null;
  
  // プログレッションパターンのインデックス
  progressionIndex: number;
  
  // 最後に生成したノーツの小節番号（ランダムパターン用）
  lastGeneratedMeasure: number;
  
  // アクション
  setStage: (stage: FantasyStage) => void;
  generateInitialNotes: () => void;
  generateNotesForMeasure: (measure: number) => void;
  judgeInput: (inputChord: string, currentTime: number) => 'perfect' | 'miss' | null;
  cleanupOldNotes: (currentTime: number) => void;
  reset: () => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  notes: [],
  nextNoteId: 0,
  judgmentWindow: 0.2, // ±200ms
  currentStage: null,
  progressionIndex: 0,
  lastGeneratedMeasure: 0,
  
  setStage: (stage) => {
    set({ currentStage: stage, progressionIndex: 0, lastGeneratedMeasure: 0 });
  },
  
  generateInitialNotes: () => {
    const { currentStage } = get();
    if (!currentStage) return;
    
    const timeStore = useTimeStore.getState();
    const notes: RhythmNote[] = [];
    let noteId = 0;
    
    if (currentStage.chord_progression_data) {
      // プログレッションパターン: JSONから全ノーツを生成
      try {
        const data = JSON.parse(currentStage.chord_progression_data);
        if (data.chords && Array.isArray(data.chords)) {
          data.chords.forEach((item: { chord: string; measure: number; beat: number }) => {
            const time = timeStore.getMeasureBeatTime(item.measure, item.beat);
            notes.push({
              id: `note-${noteId++}`,
              chord: item.chord,
              measure: item.measure,
              beat: item.beat,
              time,
              judged: false,
              judgmentResult: null
            });
          });
        }
      } catch (e) {
        console.error('Failed to parse chord progression data:', e);
      }
    } else {
      // ランダムパターン: 最初の数小節分を生成
      const initialMeasures = Math.min(8, currentStage.measureCount ?? 8);
      for (let measure = 1; measure <= initialMeasures; measure++) {
        get().generateNotesForMeasure(measure);
      }
    }
    
    set({ notes, nextNoteId: noteId });
  },
  
  generateNotesForMeasure: (measure) => {
    const { currentStage, nextNoteId } = get();
    if (!currentStage || currentStage.chord_progression_data) return;
    
    const timeStore = useTimeStore.getState();
    const allowedChords = currentStage.allowedChords || ['C', 'G', 'Am', 'F'];
    const randomChord = allowedChords[Math.floor(Math.random() * allowedChords.length)];
    
    // 1小節の1拍目に配置
    const time = timeStore.getMeasureBeatTime(measure, 1);
    const newNote: RhythmNote = {
      id: `note-${nextNoteId}`,
      chord: randomChord,
      measure,
      beat: 1,
      time,
      judged: false,
      judgmentResult: null
    };
    
    set(state => ({
      notes: [...state.notes, newNote],
      nextNoteId: nextNoteId + 1,
      lastGeneratedMeasure: measure
    }));
  },
  
  judgeInput: (inputChord, currentTime) => {
    const { notes, judgmentWindow } = get();
    
    // 判定対象のノーツを探す（未判定かつ判定ウィンドウ内）
    const targetNote = notes.find(note => 
      !note.judged && 
      Math.abs(note.time - currentTime) <= judgmentWindow
    );
    
    if (!targetNote) {
      return null;
    }
    
    const isCorrect = targetNote.chord === inputChord;
    const result = isCorrect ? 'perfect' : 'miss';
    
    // ノーツを判定済みにする
    set(state => ({
      notes: state.notes.map(note => 
        note.id === targetNote.id 
          ? { ...note, judged: true, judgmentResult: result }
          : note
      )
    }));
    
    return result;
  },
  
  cleanupOldNotes: (currentTime) => {
    // 判定ウィンドウを過ぎた未判定ノーツを自動的にmiss判定
    // 画面外に出た古いノーツを削除（メモリ管理）
    const { judgmentWindow } = get();
    const cleanupThreshold = 10; // 10秒前のノーツは削除
    
    set(state => ({
      notes: state.notes
        .map(note => {
          // 未判定で判定ウィンドウを過ぎたらmiss
          if (!note.judged && note.time + judgmentWindow < currentTime) {
            return { ...note, judged: true, judgmentResult: 'miss' as const };
          }
          return note;
        })
        .filter(note => note.time > currentTime - cleanupThreshold)
    }));
  },
  
  reset: () => {
    set({
      notes: [],
      nextNoteId: 0,
      progressionIndex: 0,
      lastGeneratedMeasure: 0
    });
  }
}));