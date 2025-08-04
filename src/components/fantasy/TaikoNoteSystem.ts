/**
 * 太鼓の達人風ノーツシステム
 * コード進行モードでのノーツ管理とタイミング判定
 */

import { ChordDefinition } from './FantasyGameEngine';
import { bgmManager } from '@/utils/BGMManager';

// ノーツの型定義
export interface TaikoNote {
  id: string;
  chord: ChordDefinition;
  hitTime: number; // ヒットすべきタイミング（音楽時間、秒）
  measure: number; // 小節番号（1始まり）
  beat: number; // 拍番号（1始まり、小数可）
  isHit: boolean; // 既にヒットされたか
  isMissed: boolean; // ミスしたか
  loopIndex: number; // ループインデックス（何回目のループで出現するか）
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

// 判定ウィンドウの定義（±300ms）
export const JUDGMENT_WINDOW_MS = 300;

/**
 * タイミング判定を行う
 * @param currentTime 現在の音楽時間（秒）
 * @param targetTime ターゲットの音楽時間（秒）
 * @param windowMs 判定ウィンドウ（ミリ秒）
 */
export function judgeTimingWindow(
  currentTime: number,
  targetTime: number,
  windowMs: number = JUDGMENT_WINDOW_MS
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
 * ループを考慮して複数周分のノーツを生成
 * @param chordProgression コード進行配列
 * @param measureCount 総小節数
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param maxLoops 最大ループ数（デフォルト: 10）
 */
export function generateBasicProgressionNotes(
  chordProgression: string[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (chordId: string) => ChordDefinition | null,
  maxLoops: number = 10
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  
  // maxLoops回分のノーツを生成
  for (let loopIndex = 0; loopIndex < maxLoops; loopIndex++) {
    for (let measure = 1; measure <= measureCount; measure++) {
      const chordIndex = (measure - 1) % chordProgression.length;
      const chordId = chordProgression[chordIndex];
      const chord = getChordDefinition(chordId);
      
      if (chord) {
        // ループを考慮した連続的な時間計算
        const hitTime = (loopIndex * measureCount + measure - 1) * secPerMeasure;
        
        notes.push({
          id: `note_${loopIndex}_${measure}_1`,
          chord,
          hitTime,
          measure: measure + (loopIndex * measureCount), // 連続的な小節番号
          beat: 1,
          isHit: false,
          isMissed: false,
          loopIndex
        });
      }
    }
  }
  
  return notes;
}

/**
 * 拡張版progression用：chord_progression_dataのJSONを解析
 * ループを考慮して複数周分のノーツを生成
 * @param progressionData JSON配列
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param measureCount 総小節数
 * @param maxLoops 最大ループ数（デフォルト: 10）
 */
export function parseChordProgressionData(
  progressionData: ChordProgressionDataItem[],
  bpm: number,
  timeSignature: number,
  measureCount: number,
  getChordDefinition: (chordId: string) => ChordDefinition | null,
  maxLoops: number = 10
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  const loopDuration = measureCount * secPerMeasure;
  
  // maxLoops回分のノーツを生成
  for (let loopIndex = 0; loopIndex < maxLoops; loopIndex++) {
    progressionData.forEach((item, index) => {
      const chord = getChordDefinition(item.chord);
      if (chord) {
        // bar（小節）とbeats（拍）から実際の時刻を計算
        const baseTime = (item.bar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
        const hitTime = baseTime + (loopIndex * loopDuration);
        
        notes.push({
          id: `note_${loopIndex}_${item.bar}_${item.beats}_${index}`,
          chord,
          hitTime,
          measure: item.bar + (loopIndex * measureCount), // 連続的な小節番号
          beat: item.beats,
          isHit: false,
          isMissed: false,
          loopIndex
        });
      }
    });
  }
  
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
 * 判定ウィンドウを過ぎたノーツを自動的にミス判定する
 * @param notes 全ノーツ
 * @param currentTime 現在の音楽時間（秒）
 * @returns 新しくミスになったノーツのリスト
 */
export function updateMissedNotes(
  notes: TaikoNote[],
  currentTime: number
): TaikoNote[] {
  const newlyMissed: TaikoNote[] = [];
  
  notes.forEach(note => {
    if (!note.isHit && !note.isMissed) {
      const timeDiff = (currentTime - note.hitTime) * 1000;
      if (timeDiff > JUDGMENT_WINDOW_MS) {
        note.isMissed = true;
        newlyMissed.push(note);
      }
    }
  });
  
  return newlyMissed;
}

/**
 * 現在のノーツインデックスを取得（ループを考慮）
 * @param notes 全ノーツ
 * @param currentTime 現在の音楽時間（秒）
 * @returns 現在のノーツインデックス
 */
export function getCurrentNoteIndex(
  notes: TaikoNote[],
  currentTime: number
): number {
  // 次に来るノーツを探す
  for (let i = 0; i < notes.length; i++) {
    if (!notes[i].isHit && !notes[i].isMissed && notes[i].hitTime >= currentTime - JUDGMENT_WINDOW_MS / 1000) {
      return i;
    }
  }
  
  // 見つからない場合は最後のインデックス
  return Math.max(0, notes.length - 1);
}

/**
 * 拡張版用のサンプルJSON文字列をパース
 * 簡易形式：各行が "bar X beats Y chord Z" の形式
 */
export function parseSimpleProgressionText(text: string): ChordProgressionDataItem[] {
  const lines = text.trim().split('\n');
  const result: ChordProgressionDataItem[] = [];
  
  for (const line of lines) {
    const match = line.match(/bar\s+(\d+)\s+beats\s+([\d.]+)\s+chord\s+(\S+)/);
    if (match) {
      result.push({
        bar: parseInt(match[1]),
        beats: parseFloat(match[2]),
        chord: match[3]
      });
    }
  }
  
  return result;
}