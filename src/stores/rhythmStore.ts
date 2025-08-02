import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Note, RhythmMode, StageMeta } from '../constants/rhythm';
import { v4 as uuidv4 } from 'uuid';

interface RhythmState {
  mode: RhythmMode;
  notes: Note[];
  activeNoteIds: Set<string>;
  stageMeta: StageMeta | null;
  currentLoopIndex: number;
  
  // Actions
  init: (stage: StageMeta) => void;
  spawnNextLoop: (currentMeasure: number, currentTimeMs: number) => void;
  registerSuccess: (noteId: string) => void;
  registerFail: (noteId: string) => void;
  cleanup: () => void;
  removeOldNotes: (currentTimeMs: number) => void;
}

export const useRhythmStore = create<RhythmState>()(
  devtools(
    (set, get) => ({
      mode: 'random',
      notes: [],
      activeNoteIds: new Set(),
      stageMeta: null,
      currentLoopIndex: 0,

      init: (stage: StageMeta) => {
        set({
          mode: stage.rhythmMode || 'random',
          notes: [],
          activeNoteIds: new Set(),
          stageMeta: stage,
          currentLoopIndex: 0,
        });
      },

      spawnNextLoop: (currentMeasure: number, currentTimeMs: number) => {
        const state = get();
        const { stageMeta, mode } = state;
        if (!stageMeta) return;

        const { bpm, timeSignature, measureCount, countInMeasures } = stageMeta;
        const msPerBeat = 60000 / bpm;
        const msPerMeasure = msPerBeat * timeSignature;

        // 次の小節の開始時刻を計算
        const measureStartMs = currentTimeMs + msPerMeasure;
        
        const newNotes: Note[] = [];

        if (mode === 'random') {
          // ランダムモード: 各小節に1つのノーツ
          const randomChord = stageMeta.allowedChords[
            Math.floor(Math.random() * stageMeta.allowedChords.length)
          ];
          
          newNotes.push({
            id: uuidv4(),
            chord: randomChord,
            atMeasure: currentMeasure + 1,
            atBeat: 1,
            spawnTimeMs: measureStartMs - 3000, // 3秒前から表示開始
            hitTimeMs: measureStartMs,
          });
        } else if (mode === 'progression' && stageMeta.chordProgression) {
          // コード進行モード
          const progressionMeasure = ((currentMeasure - countInMeasures) % measureCount) + 1;
          
          // 該当する小節のコードを探す
          const chordsInMeasure = stageMeta.chordProgression.filter(
            (entry) => entry.measure === progressionMeasure
          );

          chordsInMeasure.forEach((entry) => {
            const beatOffsetMs = (entry.beat - 1) * msPerBeat;
            const hitTime = measureStartMs + beatOffsetMs;
            
            newNotes.push({
              id: uuidv4(),
              chord: entry.chord,
              atMeasure: currentMeasure + 1,
              atBeat: entry.beat,
              spawnTimeMs: hitTime - 3000,
              hitTimeMs: hitTime,
            });
          });
        }

        set((state) => ({
          notes: [...state.notes, ...newNotes],
          activeNoteIds: new Set([...state.activeNoteIds, ...newNotes.map(n => n.id)]),
        }));
      },

      registerSuccess: (noteId: string) => {
        set((state) => {
          const newActiveIds = new Set(state.activeNoteIds);
          newActiveIds.delete(noteId);
          return { activeNoteIds: newActiveIds };
        });

        // バトルストアへの攻撃処理は外部で行う
      },

      registerFail: (noteId: string) => {
        set((state) => {
          const newActiveIds = new Set(state.activeNoteIds);
          newActiveIds.delete(noteId);
          return { activeNoteIds: newActiveIds };
        });

        // バトルストアへの被ダメージ処理は外部で行う
      },

      removeOldNotes: (currentTimeMs: number) => {
        set((state) => {
          // 判定時刻を200ms以上過ぎたノーツを削除
          const cutoffTime = currentTimeMs - 1000;
          const remainingNotes = state.notes.filter(
            (note) => note.hitTimeMs > cutoffTime
          );
          return { notes: remainingNotes };
        });
      },

      cleanup: () => {
        set({
          mode: 'random',
          notes: [],
          activeNoteIds: new Set(),
          stageMeta: null,
          currentLoopIndex: 0,
        });
      },
    }),
    {
      name: 'rhythm-store',
    }
  )
);