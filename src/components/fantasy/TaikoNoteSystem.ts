/**
 * 太鼓の達人風ノーツシステム
 * コード進行モードでのノーツ管理とタイミング判定
 */

import { ChordDefinition } from './FantasyGameEngine';
import { note as parseNote } from 'tonal';

// ===== 袋形式ランダムセレクター =====

/**
 * 袋形式（Bag Random / Shuffle Random）セレクター
 * 全てのアイテムが均等に出現することを保証する
 * 
 * 動作原理：
 * 1. 全アイテムを袋に入れてシャッフル
 * 2. 袋から順番に取り出す
 * 3. 袋が空になったら補充してシャッフル
 * 
 * これにより、短期間での偏りを防ぎ、全選択肢が均等に出現する
 */
export class BagRandomSelector<T> {
  private bag: T[] = [];
  private pool: T[];
  private getKey: (item: T) => string;
  private lastKey: string = '';

  /**
   * @param items 選択対象のアイテム配列
   * @param getKey アイテムから一意のキーを取得する関数（重複回避に使用）
   */
  constructor(items: T[], getKey?: (item: T) => string) {
    this.pool = [...items];
    this.getKey = getKey || ((item: T) => String(item));
    this.refillBag();
  }

  /**
   * 袋を補充してシャッフル（Fisher-Yatesアルゴリズム）
   */
  private refillBag(): void {
    this.bag = [...this.pool];
    // Fisher-Yates シャッフル
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  /**
   * 次のアイテムを取得
   * 直前と同じアイテムは可能な限り避ける
   * @param avoidKey 避けたいアイテムのキー（省略時は直前のアイテムを避ける）
   */
  next(avoidKey?: string): T {
    if (this.bag.length === 0) {
      this.refillBag();
    }

    const keyToAvoid = avoidKey ?? this.lastKey;
    
    // 直前と同じアイテムを避ける
    if (this.pool.length > 1 && this.bag.length > 0) {
      const topKey = this.getKey(this.bag[this.bag.length - 1]);
      if (topKey === keyToAvoid) {
        // 袋の残りから別のアイテムを探す
        for (let i = this.bag.length - 2; i >= 0; i--) {
          if (this.getKey(this.bag[i]) !== keyToAvoid) {
            // 見つかったアイテムを末尾と交換
            [this.bag[i], this.bag[this.bag.length - 1]] = [this.bag[this.bag.length - 1], this.bag[i]];
            break;
          }
        }
      }
    }

    const item = this.bag.pop()!;
    this.lastKey = this.getKey(item);
    return item;
  }

  /**
   * 同時に複数のアイテムを取得（敵の同時出現用）
   * @param count 取得する数
   * @param avoidDuplicates 重複を避けるか（コード種類が足りない場合は無視）
   */
  nextMultiple(count: number, avoidDuplicates: boolean = true): T[] {
    const results: T[] = [];
    const usedKeys = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      if (this.bag.length === 0) {
        this.refillBag();
      }
      
      let item: T | null = null;
      
      if (avoidDuplicates && usedKeys.size < this.pool.length) {
        // 重複を避ける（可能な範囲で）
        // 袋から未使用のアイテムを探す
        for (let j = this.bag.length - 1; j >= 0; j--) {
          const key = this.getKey(this.bag[j]);
          if (!usedKeys.has(key)) {
            // 見つかったアイテムを末尾と交換して取り出す
            [this.bag[j], this.bag[this.bag.length - 1]] = [this.bag[this.bag.length - 1], this.bag[j]];
            item = this.bag.pop()!;
            break;
          }
        }
        
        // 袋内に未使用のアイテムがなければ補充
        if (item === null) {
          this.refillBag();
          item = this.bag.pop()!;
        }
      } else {
        // 重複を許可する場合（コード種類 < 同時出現数の場合など）
        item = this.bag.pop()!;
      }
      
      usedKeys.add(this.getKey(item));
      results.push(item);
      this.lastKey = this.getKey(item);
    }
    
    return results;
  }

  /**
   * 袋をリセット（新しいゲーム開始時などに使用）
   */
  reset(): void {
    this.lastKey = '';
    this.refillBag();
  }

  /**
   * 残りのアイテム数を取得
   */
  get remaining(): number {
    return this.bag.length;
  }
}

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

// Progressionで受け取るコード指定（後方互換: string も許容）
export type ChordSpec =
  | string
  | {
      chord: string;
      inversion?: number | null;
      octave?: number | null;
      /** 単音指定の場合に 'note' をセット（省略時はコード扱い） */
      type?: 'note';
    };

// chord_progression_data のJSON形式
export interface ChordProgressionDataItem {
  bar: number; // 小節番号（1始まり）
  beats: number; // 拍番号（1始まり、小数可）
  chord: string; // コード名（単音の場合は音名、複数音の場合は結合文字列 例: "CEG"）
  inversion?: number | null; // 追加: 転回形（0=基本形）
  octave?: number | null; // 追加: 最低音のオクターブ
  /**
   * 画面オーバーレイに表示するテキスト（例: Harmonyのコード名）。
   * 設定された時刻から、次のテキスト要素が出るまで持続表示。
   */
  text?: string;
  /** 歌詞が無い単音ノーツ等から生成する単音指定（省略時はコード扱い） */
  type?: 'note';
  /**
   * 同タイミングの複数ノーツをまとめた場合の個別音名配列
   * 例: ["C", "E", "G"] - 低い順にソート済み
   * Progression_Timing用：縦配置表示やガイドに使用
   */
  notes?: string[];
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
  windowMs: number = 150
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
  chordProgression: ChordSpec[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0,
  intervalBeats: number = timeSignature
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

  if (intervalBeats <= 0) {
    intervalBeats = timeSignature; // フォールバック
  }

  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;

  // ノートごとの進行インデックス
  let noteIndex = 0;
  
  // 各小節に対して intervalBeats おきに配置（1拍目から）
  for (let measure = 1; measure <= measureCount; measure++) {
    for (let beat = 1; beat <= timeSignature; beat += intervalBeats) {
      const spec = chordProgression[noteIndex % chordProgression.length];
      const chord = getChordDefinition(spec);
      if (!chord) {
        noteIndex++;
        continue;
      }

      // Measure 1 開始を0秒として計算（countInはBGM側でオフセット管理）
      const hitTime = (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat;

      notes.push({
        id: `note_${measure}_${beat}`,
        chord,
        hitTime,
        measure,
        beat,
        isHit: false,
        isMissed: false
      });

      noteIndex++;
    }
  }
  
  return notes;
}

/**
 * ランダムプログレッション用：袋形式ランダムでコードを決定
 * 全コードが均等に出現することを保証する
 * @param chordPool 選択可能なコードのプール（allowedChords or chordProgression）
 * @param measureCount 総小節数
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param getChordDefinition コード定義取得関数
 * @param countInMeasures カウントイン小節数
 */
export function generateRandomProgressionNotes(
  chordPool: ChordSpec[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0,
  intervalBeats: number = timeSignature
): TaikoNote[] {
  if (chordPool.length === 0) return [];

  if (intervalBeats <= 0) {
    intervalBeats = timeSignature; // フォールバック
  }

  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;

  // 袋形式ランダムセレクターを使用
  const specToId = (s: ChordSpec) => (typeof s === 'string' ? s : s.chord);
  const bagSelector = new BagRandomSelector(chordPool, specToId);

  // 各小節に対して intervalBeats おきに配置（1拍目から）
  for (let measure = 1; measure <= measureCount; measure++) {
    for (let beat = 1; beat <= timeSignature; beat += intervalBeats) {
      // 袋形式で次のコードを取得（直前と同じコードは自動的に避けられる）
      const nextSpec = bagSelector.next();
      const chord = getChordDefinition(nextSpec);
      if (!chord) continue;

      notes.push({
        id: `note_${measure}_${beat}`,
        chord,
        hitTime: (measure - 1) * secPerMeasure + (beat - 1) * secPerBeat,
        measure,
        beat,
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
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  
  // 最大小節数を取得
  const maxBar = Math.max(...progressionData.map(item => item.bar), 0);
  
  progressionData
    // 演奏用ノーツは chord が空/N.C. のものは無視（テキスト専用）
    .filter(item => item.chord && item.chord.trim() !== '' && item.chord.toUpperCase() !== 'N.C.')
    .forEach((item, index) => {
    // 新方式: notes配列がある場合は複数音として処理
    if (item.notes && item.notes.length > 0) {
      const chord = buildChordFromNotes(item.notes, item.octave ?? 4);
      if (chord) {
        const hitTime = (item.bar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
        notes.push({
          id: `note_${item.bar}_${item.beats}_${index}`,
          chord,
          hitTime,
          measure: item.bar,
          beat: item.beats,
          isHit: false,
          isMissed: false
        });
      }
      return;
    }
    
    // 従来方式: chordフィールドを使用
    const spec: ChordSpec = {
      chord: item.chord,
      inversion: item.inversion ?? undefined,
      octave: item.octave ?? undefined,
      type: item.type === 'note' ? 'note' : undefined
    };
    const chord = getChordDefinition(spec);
    if (chord) {
      // Measure 1 開始を0秒として計算
      const hitTime = (item.bar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
      
      notes.push({
        id: `note_${item.bar}_${item.beats}_${index}`,
        chord,
        hitTime,
        measure: item.bar,
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
 * 音名配列からChordDefinitionを構築
 * Progression_Timing用：同タイミングの複数ノーツを1つのコードとして扱う
 */
function buildChordFromNotes(noteNames: string[], baseOctave: number): ChordDefinition | null {
  if (noteNames.length === 0) return null;
  
  const midiNotes: number[] = [];
  const cleanNoteNames: string[] = [];
  
  for (const noteName of noteNames) {
    // 音名からMIDI番号を計算
    const cleanName = noteName.replace(/\d+$/, ''); // オクターブ除去
    cleanNoteNames.push(cleanName);
    
    const parsed = parseNote(cleanName.replace(/x/g, '##') + String(baseOctave));
    if (parsed && typeof parsed.midi === 'number') {
      midiNotes.push(parsed.midi);
    }
  }
  
  if (midiNotes.length === 0) return null;
  
  // 昇順にソート
  midiNotes.sort((a, b) => a - b);
  
  // 表示名を生成（例: "C E G" または "C"）
  const displayName = cleanNoteNames.join(' ');
  
  return {
    id: displayName.replace(/\s+/g, ''),
    displayName,
    notes: midiNotes,
    noteNames: cleanNoteNames,
    quality: 'custom', // 複数音の組み合わせ
    root: cleanNoteNames[0] || 'C'
  };
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
  windowMs: number = 150,
  loopDuration?: number
): TimingJudgment {
  let diffMs = (currentTime - targetTime) * 1000;
  
  // ループを考慮した判定（多周回でも安定するように正規化）
  if (loopDuration !== undefined && loopDuration > 0) {
    const loopMs = loopDuration * 1000;
    // diffMs を [-loopMs/2, +loopMs/2] に収める
    while (diffMs > loopMs / 2) {
      diffMs -= loopMs;
    }
    while (diffMs < -loopMs / 2) {
      diffMs += loopMs;
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
  JUDGMENT_WINDOW: 150,         // 判定ウィンドウ（ms）
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