/**
 * リズムゲーム用ストア
 * 譜面データ管理とゲーム進行を担当
 */

import { create } from 'zustand';
import { devLog } from '@/utils/logger';
import type { FantasyStage } from '@/components/fantasy/FantasyGameEngine';

// 譜面上の1つの質問（ノーツ）
export interface RhythmQuestion {
  id: string;              // ユニークID
  measure: number;         // 小節番号（0-based）
  beat: number;           // 拍番号（1-based）
  chord: string;          // コード名（例: 'C', 'G7'）
  targetMs: number;       // 判定タイミング（絶対時刻ms）
}

// リズムゲームの状態
export interface RhythmState {
  questions: RhythmQuestion[];        // 生成された譜面データ
  pointer: number;                    // 現在の判定対象インデックス
  pattern: 'random' | 'progression';  // 出題パターン
  loopIndex: number;                  // ループ回数（進行パターン用）
  progressionIndex: number;           // 進行内の現在位置
  isActive: boolean;                  // ゲームアクティブフラグ
}

// リズムゲームのアクション
export interface RhythmActions {
  generate: (stage: FantasyStage, startAtMs: number, readyTimeMs: number) => void;
  tick: (nowMs: number) => RhythmQuestion | null;
  reset: () => void;
  setActive: (active: boolean) => void;
}

// 初期状態
const initialState: RhythmState = {
  questions: [],
  pointer: 0,
  pattern: 'random',
  loopIndex: 0,
  progressionIndex: 0,
  isActive: false,
};

// ストア定義
export const useRhythmStore = create<RhythmState & RhythmActions>((set, get) => ({
  ...initialState,

  /**
   * 譜面生成
   * @param stage - ステージ情報
   * @param startAtMs - BGM開始時刻（絶対時刻ms）
   * @param readyTimeMs - 準備時間（ms）
   */
  generate: (stage: FantasyStage, startAtMs: number, readyTimeMs: number) => {
    devLog.debug('🎵 Generating rhythm pattern', { stage, startAtMs, readyTimeMs });

    // パターン判定
    const pattern = stage.chordProgressionData ? 'progression' : 'random';
    
    // BPMから1拍の長さを計算
    const bpm = stage.bpm || 120;
    const timeSignature = stage.timeSignature || 4;
    const countInMeasures = stage.countInMeasures || 2;
    
    const msPerBeat = 60000 / bpm;
    
    // 2小節分の譜面を生成
    const questions: RhythmQuestion[] = [];
    const measuresToGenerate = 2;
    
    for (let measure = 0; measure < measuresToGenerate; measure++) {
      // 各小節で1つのコードを選択
      let chord: string;
      
      if (pattern === 'progression' && stage.chordProgressionData) {
        // 進行パターンから取得
        const progression = stage.chordProgressionData as string[];
        const { progressionIndex } = get();
        chord = progression[progressionIndex % progression.length];
      } else {
        // ランダム選択
        const chords = stage.allowedChords || ['C'];
        chord = chords[Math.floor(Math.random() * chords.length)];
      }
      
      // 各拍にノーツを配置（1小節に1つのコード）
      for (let beat = 1; beat <= timeSignature; beat++) {
        const targetMs = startAtMs + readyTimeMs + 
          ((measure + countInMeasures) * timeSignature + beat - 1) * msPerBeat;
        
        questions.push({
          id: `${measure}-${beat}`,
          measure,
          beat,
          chord,
          targetMs,
        });
      }
    }
    
    set({
      questions,
      pointer: 0,
      pattern,
      isActive: true,
    });
    
    devLog.debug('🎵 Generated questions', { questions });
  },

  /**
   * 時間更新処理
   * @param nowMs - 現在時刻（絶対時刻ms）
   * @returns 判定対象のquestionまたはnull
   */
  tick: (nowMs: number) => {
    const { questions, pointer, isActive } = get();
    
    if (!isActive || pointer >= questions.length) {
      return null;
    }
    
    const currentQuestion = questions[pointer];
    
    // 判定時刻を過ぎたら次へ（判定は呼び出し側で行う）
    if (nowMs > currentQuestion.targetMs + 200) {
      set({ pointer: pointer + 1 });
    }
    
    return currentQuestion;
  },

  /**
   * リセット
   */
  reset: () => {
    set(initialState);
  },

  /**
   * アクティブ状態設定
   */
  setActive: (active: boolean) => {
    set({ isActive: active });
  },
}));