/**
 * 太鼓の達人風ノーツシステム
 * コード進行モードでのノーツ管理とタイミング判定
 */

import { ChordDefinition } from './FantasyGameEngine';

// ノーツの型定義
export interface TaikoNote {
  id: string;
  chord: ChordDefinition;
  hitTime: number; // ヒットすべきタイミング（音楽時間、秒）
  measure: number; // 小節番号（1始まり）
  beat: number; // 拍番号（1始まり、小数可）
  isHit: boolean; // 既にヒットされたか
  isMissed: boolean; // ミスしたか
}

// chord_progression_data のJSON形式
export interface ChordProgressionDataItem {
  bar: number; // 小節番号（1始まり）
  beats: number; // 拍番号（1始まり、小数可）
  chord: string; // コード名
}

// タイミング判定の結果
export interface TimingJudgment {
  isHit: boolean;
  timing: 'early' | 'perfect' | 'late' | 'miss';
  timingDiff: number; // ミリ秒単位の差
}

/**
 * タイミング判定を行う
 * @param currentTime 現在の音楽時間（秒）
 * @param targetTime ターゲットの音楽時間（秒）
 * @param windowMs 判定ウィンドウ（ミリ秒）
 */
export function judgeTimingWindow(
  currentTime: number,
  targetTime: number,
  windowMs: number = 300
): TimingJudgment {
  const diffMs = (currentTime - targetTime) * 1000;
  
  if (Math.abs(diffMs) > windowMs) {
    return {
      isHit: false,
      timing: 'miss',
      timingDiff: diffMs
    };
  }
  
  // 判定ウィンドウ内
  let timing: 'early' | 'perfect' | 'late';
  if (Math.abs(diffMs) <= 50) {
    timing = 'perfect';
  } else if (diffMs < 0) {
    timing = 'early';
  } else {
    timing = 'late';
  }
  
  return {
    isHit: true,
    timing,
    timingDiff: diffMs
  };
}

/**
 * 基本版progression用：小節の頭(Beat 1)でコードを配置
 * カウントインを考慮して正しいタイミングを計算
 * @param chordProgression コード進行配列
 * @param measureCount 総小節数
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param getChordDefinition コード定義取得関数
 * @param countInMeasures カウントイン小節数
 */
export function generateBasicProgressionNotes(
  chordProgression: string[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (chordId: string) => ChordDefinition | null,
  countInMeasures: number = 0 // 無視
): TaikoNote[] {
  // 入力検証
  if (!chordProgression || chordProgression.length === 0) {
    console.warn('⚠️ コード進行が空です');
    return [];
  }
  
  if (measureCount <= 0) {
    console.warn('⚠️ 無効な小節数:', measureCount);
    return [];
  }
  
  if (bpm <= 0 || bpm > 300) {
    console.warn('⚠️ 無効なBPM:', bpm);
    return [];
  }

  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  
  // M2から出題（M1は空）
  for (let measure = 2; measure <= measureCount; measure++) { // 変更: measure=2から開始
    const chordIndex = (measure - 2) % chordProgression.length; // 変更: indexを調整
    const chordId = chordProgression[chordIndex];
    const chord = getChordDefinition(chordId);
    
    if (chord) {
      const hitTime = (measure - 1) * secPerMeasure; // M1=0s, M2=secPerMeasure
      
      notes.push({
        id: `note_${measure}_1`,
        chord,
        hitTime,
        measure, // 表示用の小節番号
        beat: 1,
        isHit: false,
        isMissed: false
      });
    }
  }
  
  return notes;
}

/**
 * 拡張版progression用：chord_progression_dataのJSONを解析
 * カウントインを考慮
 * @param progressionData JSON配列
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param getChordDefinition コード定義取得関数
 * @param countInMeasures カウントイン小節数
 */
export function parseChordProgressionData(
  progressionData: ChordProgressionDataItem[],
  bpm: number,
  timeSignature: number,
  getChordDefinition: (chordId: string) => ChordDefinition | null,
  countInMeasures: number = 0 // 無視
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  
  progressionData.forEach((item, index) => {
    // M1はスキップ（休み）
    if (item.bar === 1) return; // 変更: M1をスキップ
    
    const chord = getChordDefinition(item.chord);
    if (chord) {
      // カウントインなしで直接計算
      const hitTime = (item.bar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
      
      notes.push({
        id: `note_${item.bar}_${item.beats}_${index}`,
        chord,
        hitTime,
        measure: item.bar, // 表示用の小節番号
        beat: item.beats,
        isHit: false,
        isMissed: false
      });
    }
  });
  
  // 時間順にソート
  notes.sort((a, b) => a.hitTime - b.hitTime);
  
  return notes;
}

/**
 * 現在の時間で表示すべきノーツを取得
 * @param notes 全ノーツ
 * @param currentTime 現在の音楽時間（秒）
 * @param lookAheadTime 先読み時間（秒）デフォルト3秒
 */
export function getVisibleNotes(
  notes: TaikoNote[],
  currentTime: number,
  lookAheadTime: number = 3
): TaikoNote[] {
  return notes.filter(note => {
    // 既にヒットまたはミスしたノーツは表示しない
    if (note.isHit || note.isMissed) return false;
    
    // 現在時刻から lookAheadTime 秒先までのノーツを表示
    const timeUntilHit = note.hitTime - currentTime;
    return timeUntilHit >= -0.5 && timeUntilHit <= lookAheadTime;
  });
}

/**
 * ノーツの画面上のX位置を計算（太鼓の達人風）
 * @param note ノーツ
 * @param currentTime 現在の音楽時間（秒）
 * @param judgeLineX 判定ラインのX座標
 * @param speed ノーツの移動速度（ピクセル/秒）
 */
export function calculateNotePosition(
  note: TaikoNote,
  currentTime: number,
  judgeLineX: number,
  speed: number = 300
): number {
  const timeUntilHit = note.hitTime - currentTime;
  return judgeLineX + timeUntilHit * speed;
}

/**
 * 拡張版用のサンプルJSON文字列をパース
 * 簡易形式：各行が "bar X beats Y chord Z" の形式
 */
export function parseSimpleProgressionText(text: string): ChordProgressionDataItem[] {
  if (!text || typeof text !== 'string') {
    console.warn('⚠️ 無効なプログレッションテキスト');
    return [];
  }
  
  const lines = text.trim().split('\n').filter(line => line.trim());
  const result: ChordProgressionDataItem[] = [];
  
  for (const line of lines) {
    const match = line.match(/bar\s+(\d+)\s+beats\s+([\d.]+)\s+chord\s+(\S+)/);
    if (match) {
      const bar = parseInt(match[1]);
      const beats = parseFloat(match[2]);
      const chord = match[3];
      
      // 検証
      if (bar > 0 && beats > 0 && beats <= 16 && chord) {
        result.push({ bar, beats, chord });
      } else {
        console.warn('⚠️ 無効な行をスキップ:', line);
      }
    } else {
      console.warn('⚠️ パース失敗:', line);
    }
  }
  
  return result;
}

/**
 * ループを考慮したタイミング判定
 * @param currentTime 現在の音楽時間（秒）
 * @param targetTime ターゲットの音楽時間（秒）
 * @param windowMs 判定ウィンドウ（ミリ秒）
 * @param loopDuration ループの総時間（秒）
 */
export function judgeTimingWindowWithLoop(
  currentTime: number,
  targetTime: number,
  windowMs: number = 300,
  loopDuration?: number
): TimingJudgment {
  let diffMs = (currentTime - targetTime) * 1000;
  
  // ループを考慮した判定
  if (loopDuration !== undefined && loopDuration > 0) {
    // ループ境界をまたぐ可能性を考慮
    const halfLoop = loopDuration * 500; // ミリ秒に変換して半分
    
    // 時間差が大きすぎる場合、ループを考慮
    if (diffMs > halfLoop) {
      // 現在時刻が次のループにいる
      diffMs -= loopDuration * 1000;
    } else if (diffMs < -halfLoop) {
      // ターゲットが次のループにいる
      diffMs += loopDuration * 1000;
    }
  }
  
  if (Math.abs(diffMs) > windowMs) {
    return {
      isHit: false,
      timing: 'miss',
      timingDiff: diffMs
    };
  }
  
  let timing: 'early' | 'perfect' | 'late';
  if (Math.abs(diffMs) <= 50) {
    timing = 'perfect';
  } else if (diffMs < 0) {
    timing = 'early';
  } else {
    timing = 'late';
  }
  
  return {
    isHit: true,
    timing,
    timingDiff: diffMs
  };
}

/**
 * 可視ノーツの取得（ループ対応版）
 */
export function getVisibleNotesWithLoop(
  notes: TaikoNote[],
  currentTime: number,
  lookAheadTime: number = 3,
  loopDuration?: number
): TaikoNote[] {
  const visibleNotes: TaikoNote[] = [];
  
  notes.forEach(note => {
    if (note.isHit || note.isMissed) return;
    
    let timeUntilHit = note.hitTime - currentTime;
    
    // ループを考慮
    if (loopDuration !== undefined && loopDuration > 0) {
      // ループ終端に近い場合、次のループのノーツも考慮
      if (currentTime + lookAheadTime > loopDuration && note.hitTime < lookAheadTime) {
        // 仮想的に次のループの位置として扱う
        timeUntilHit = (note.hitTime + loopDuration) - currentTime;
      }
    }
    
    if (timeUntilHit >= -0.5 && timeUntilHit <= lookAheadTime) {
      visibleNotes.push(note);
    }
  });
  
  return visibleNotes;
}

// パフォーマンス設定
export const PERFORMANCE_CONFIG = {
  // ノーツ表示設定
  MAX_VISIBLE_NOTES: 20,        // 同時表示最大ノーツ数
  LOOK_AHEAD_TIME: 4,           // 先読み時間（秒）
  NOTE_UPDATE_INTERVAL: 16,     // 更新間隔（ms）
  
  // 判定設定
  JUDGMENT_WINDOW: 300,         // 判定ウィンドウ（ms）
  PERFECT_WINDOW: 50,           // Perfect判定ウィンドウ（ms）
  
  // アニメーション設定
  LERP_FACTOR: 0.15,           // 位置補間係数
  FADE_DURATION: 300,          // フェード時間（ms）
  
  // メモリ管理
  POOL_SIZE: 30,               // オブジェクトプールサイズ
  CLEANUP_INTERVAL: 10000,     // クリーンアップ間隔（ms）
};

// 設定を使用した最適化版
export function getVisibleNotesOptimized(
  notes: TaikoNote[],
  currentTime: number,
  lookAheadTime: number = PERFORMANCE_CONFIG.LOOK_AHEAD_TIME,
  loopDuration?: number
): TaikoNote[] {
  const visibleNotes: TaikoNote[] = [];
  let visibleCount = 0;
  
  for (const note of notes) {
    // 最大表示数に達したら終了
    if (visibleCount >= PERFORMANCE_CONFIG.MAX_VISIBLE_NOTES) break;
    
    if (note.isHit || note.isMissed) continue;
    
    let timeUntilHit = note.hitTime - currentTime;
    
    // ループを考慮
    if (loopDuration !== undefined && loopDuration > 0) {
      if (currentTime + lookAheadTime > loopDuration && note.hitTime < lookAheadTime) {
        timeUntilHit = (note.hitTime + loopDuration) - currentTime;
      }
    }
    
    if (timeUntilHit >= -0.5 && timeUntilHit <= lookAheadTime) {
      visibleNotes.push(note);
      visibleCount++;
    }
  }
  
  return visibleNotes;
}