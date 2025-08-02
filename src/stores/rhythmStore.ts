import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// リズムノーツの型定義
export interface RhythmNote {
  id: string;
  chord: string;
  targetTime: number;  // ノーツが判定ラインに到達する時刻（ms）
  position: number;    // 現在の位置（0.0 = 判定ライン、1.0 = 画面右端）
  judged: boolean;     // 判定済みフラグ
  measure: number;     // 小節番号
  beat: number;        // 拍番号
}

// 判定ウィンドウの型定義
export interface JudgmentWindow {
  noteId: string;
  startTime: number;   // 判定開始時刻（ms）
  endTime: number;     // 判定終了時刻（ms）
  chord: string;
  judged: boolean;     // 判定済みフラグ
}

// リズムモードの状態
interface RhythmState {
  // ノーツ管理
  activeNotes: RhythmNote[];
  judgmentWindows: JudgmentWindow[];
  nextNoteId: number;
  
  // 判定結果
  lastJudgment: 'good' | 'miss' | null;
  lastJudgmentTime: number;
  
  // 設定
  judgmentWindowMs: number;  // 判定ウィンドウの幅（±ms）
  scrollSpeed: number;       // スクロール速度（1.0 = 標準）
  
  // アクション
  addNote: (chord: string, targetTime: number, measure: number, beat: number) => void;
  updateNotePositions: (currentTime: number, scrollDurationMs: number) => void;
  judgeNote: (noteId: string, inputTime: number) => 'good' | 'miss' | 'none';
  cleanupOldNotes: (currentTime: number) => void;
  reset: () => void;
  setJudgmentWindowMs: (ms: number) => void;
  setScrollSpeed: (speed: number) => void;
}

export const useRhythmStore = create<RhythmState>()(
  devtools(
    immer((set, get) => ({
      // 初期状態
      activeNotes: [],
      judgmentWindows: [],
      nextNoteId: 1,
      lastJudgment: null,
      lastJudgmentTime: 0,
      judgmentWindowMs: 200,
      scrollSpeed: 1.0,
      
      // ノーツ追加
      addNote: (chord, targetTime, measure, beat) => set((state) => {
        const noteId = `note_${state.nextNoteId}`;
        
        // ノーツを追加
        state.activeNotes.push({
          id: noteId,
          chord,
          targetTime,
          position: 1.0,  // 画面右端からスタート
          judged: false,
          measure,
          beat
        });
        
        // 判定ウィンドウを追加
        state.judgmentWindows.push({
          noteId,
          startTime: targetTime - state.judgmentWindowMs,
          endTime: targetTime + state.judgmentWindowMs,
          chord,
          judged: false
        });
        
        state.nextNoteId++;
      }),
      
      // ノーツ位置更新
      updateNotePositions: (currentTime, scrollDurationMs) => set((state) => {
        const scrollDuration = scrollDurationMs / state.scrollSpeed;
        
        state.activeNotes.forEach((note) => {
          if (!note.judged) {
            // 残り時間から位置を計算（0.0 = 判定ライン、1.0 = 画面右端）
            const timeUntilTarget = note.targetTime - currentTime;
            note.position = Math.max(0, Math.min(1, timeUntilTarget / scrollDuration));
          }
        });
      }),
      
      // ノーツ判定
      judgeNote: (noteId, inputTime) => {
        const state = get();
        const window = state.judgmentWindows.find(w => w.noteId === noteId && !w.judged);
        
        if (!window) return 'none';
        
        // 判定ウィンドウ内かチェック
        if (inputTime >= window.startTime && inputTime <= window.endTime) {
          set((state) => {
            // ノーツとウィンドウを判定済みにする
            const note = state.activeNotes.find(n => n.id === noteId);
            if (note) note.judged = true;
            
            const win = state.judgmentWindows.find(w => w.noteId === noteId);
            if (win) win.judged = true;
            
            state.lastJudgment = 'good';
            state.lastJudgmentTime = inputTime;
          });
          return 'good';
        }
        
        return 'none';
      },
      
      // 古いノーツのクリーンアップ
      cleanupOldNotes: (currentTime) => set((state) => {
        // 判定ウィンドウを過ぎたノーツを削除
        const activeNoteIds = new Set<string>();
        
        state.judgmentWindows = state.judgmentWindows.filter(window => {
          // 判定済みまたは時間切れのウィンドウを削除
          if (window.judged || window.endTime < currentTime) {
            // 時間切れで未判定の場合はミス判定
            if (!window.judged && window.endTime < currentTime) {
              state.lastJudgment = 'miss';
              state.lastJudgmentTime = window.endTime;
            }
            return false;
          }
          activeNoteIds.add(window.noteId);
          return true;
        });
        
        // 対応するノーツも削除
        state.activeNotes = state.activeNotes.filter(note => 
          activeNoteIds.has(note.id) || note.position > -0.1
        );
      }),
      
      // リセット
      reset: () => set((state) => {
        state.activeNotes = [];
        state.judgmentWindows = [];
        state.nextNoteId = 1;
        state.lastJudgment = null;
        state.lastJudgmentTime = 0;
      }),
      
      // 設定変更
      setJudgmentWindowMs: (ms) => set((state) => {
        state.judgmentWindowMs = ms;
      }),
      
      setScrollSpeed: (speed) => set((state) => {
        state.scrollSpeed = Math.max(0.5, Math.min(2.0, speed));
      })
    })),
    { name: 'rhythm-store' }
  )
);