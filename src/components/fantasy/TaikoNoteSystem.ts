/**
 * 太鼓の達人風ノーツシステム
 * コード進行モードでのノーツ管理とタイミング判定
 */

import { ChordDefinition } from './FantasyGameEngine';
import { note as parseNote, transpose, Interval, Key } from 'tonal';

// ===== 移調設定の型定義 =====

/**
 * 出題キーの配列（CbメジャーやF#メジャーを避けた12キー）
 * 基準キーから±6の範囲で移調
 * 注: 実際の移調では元のキーに基づいて正しいエンハーモニックを選択する
 */
export const TRANSPOSE_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type TransposeKey = typeof TRANSPOSE_KEYS[number];

/**
 * 五度圏のfifths値からキー名を取得
 */
function fifthsToKeyName(fifths: number): string {
  const fifthsToKeyMap: Record<number, string> = {
    '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
    '0': 'C', '1': 'G', '2': 'D', '3': 'A', '4': 'E', '5': 'B', '6': 'F#', '7': 'C#',
  };
  return fifthsToKeyMap[fifths] ?? 'C';
}

/**
 * キー名から五度圏のfifths値を取得
 */
function keyNameToFifths(keyName: string): number {
  const keyToFifthsMap: Record<string, number> = {
    'Cb': -7, 'Gb': -6, 'Db': -5, 'Ab': -4, 'Eb': -3, 'Bb': -2, 'F': -1,
    'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
  };
  return keyToFifthsMap[keyName] ?? 0;
}

/**
 * 半音数から五度圏での移動量を計算
 * @param semitones 半音数
 * @returns 五度圏での移動量（-6〜+6の範囲に正規化済み）
 */
function semitonesToFifthsChange(semitones: number): number {
  // 半音数を0-11に正規化
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  
  // 半音数と五度圏移動の対応
  // 0→0, 1→-5(+7), 2→2, 3→-3(+9), 4→4, 5→-1(+11), 
  // 6→6(-6), 7→1, 8→-4(+8), 9→3, 10→-2(+10), 11→5
  const semitoneToFifths: Record<number, number> = {
    0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1,
    6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5
  };
  
  return semitoneToFifths[normalizedSemitones] ?? 0;
}

/**
 * 元のキーと半音数から正しいターゲットキーを計算
 * 五度圏で最適な方向（シャープ側/フラット側）を選択
 * @param originalKey 元のキー
 * @param semitones 半音数
 * @returns ターゲットキー名（CbとF#は避ける）
 */
export function getTargetKeyFromTransposition(originalKey: string, semitones: number): string {
  const originalFifths = keyNameToFifths(originalKey);
  const fifthsChange = semitonesToFifthsChange(semitones);
  
  let targetFifths = originalFifths + fifthsChange;
  
  // -6〜+6の範囲に収める（Cb=-7とC#=+7を避ける）
  while (targetFifths > 6) targetFifths -= 12;
  while (targetFifths < -6) targetFifths += 12;
  
  // Cbメジャー（-7）は避けてBメジャー（+5）に
  // C#メジャー（+7）は避けてDbメジャー（-5）に
  if (targetFifths === -7) targetFifths = 5;  // Cb → B
  if (targetFifths === 7) targetFifths = -5;  // C# → Db
  
  return fifthsToKeyName(targetFifths);
}

/**
 * リピートごとのキー変更オプション
 * off: 転調なし
 * +1: 半音上
 * +5: 完全4度上（5半音）
 * -1: 半音下
 * -5: 完全4度下（-5半音）
 * random: +1, +5, -1, -5からランダムに選択
 */
export type RepeatKeyChange = 'off' | '+1' | '+5' | '-1' | '-5' | 'random';

/**
 * 移調設定
 */
export interface TransposeSettings {
  /** 開始時のキーオフセット（-6 ~ +6） */
  keyOffset: number;
  /** リピートごとのキー変更 */
  repeatKeyChange: RepeatKeyChange;
}

/**
 * キーオフセットから出題キー名を取得
 * レジェンドモード仕様: ±6の範囲に収め、五度圏で正しいキーを選択
 * @param baseKey 基準キー（通常は 'C'）
 * @param offset 半音オフセット（任意の整数、内部で±6に正規化）
 * @returns 出題キー名
 */
export function getKeyFromOffset(baseKey: string = 'C', offset: number): TransposeKey {
  // オフセットを±6の範囲に正規化
  const normalizedOffset = normalizeToSixRange(offset);
  
  // 元のキーに基づいて正しいターゲットキーを計算
  const targetKey = getTargetKeyFromTransposition(baseKey, normalizedOffset);
  
  // TRANSPOSE_KEYSに含まれるキー名に変換
  // F# → Gb（TRANSPOSE_KEYSにはGbが含まれている）
  const keyMapping: Record<string, TransposeKey> = {
    'C': 'C', 'Db': 'Db', 'D': 'D', 'Eb': 'Eb', 'E': 'E', 'F': 'F',
    'F#': 'Gb', 'Gb': 'Gb', 'G': 'G', 'Ab': 'Ab', 'A': 'A', 'Bb': 'Bb', 'B': 'B',
    'C#': 'Db', 'D#': 'Eb', 'G#': 'Ab', 'A#': 'Bb', 'Cb': 'B'
  };
  
  return keyMapping[targetKey] || 'C';
}

/**
 * 半音数を音楽理論的なインターバル名に変換
 */
function semitonesToInterval(semitones: number): string {
  const intervalMap: Record<number, string> = {
    0: '1P', 1: '2m', 2: '2M', 3: '3m', 4: '3M', 5: '4P',
    6: '4A', 7: '5P', 8: '6m', 9: '6M', 10: '7m', 11: '7M', 12: '8P'
  };
  
  // 負の値も対応
  const absSemitones = Math.abs(semitones);
  const normalized = absSemitones % 12;
  const interval = intervalMap[normalized];
  
  if (!interval) return '1P';
  
  // 負の場合は下行
  if (semitones < 0 && normalized !== 0) {
    return '-' + interval;
  }
  
  return interval;
}

/**
 * 単一の音名を移調
 * @param noteName 音名（例: 'C', 'Eb', 'F#'）
 * @param semitones 半音数（正: 上行、負: 下行）
 * @param simpleMode 簡易表示モード（true: ダブルシャープや白鍵の異名同音を変換）
 * @param targetKey ターゲットキー（指定されている場合、そのキーのスケールに合わせて表記）
 * @returns 移調後の音名
 */
export function transposeNoteName(noteName: string, semitones: number, simpleMode: boolean = true, targetKey?: string): string {
  if (semitones === 0) return simpleMode ? normalizeEnharmonic(noteName, true, targetKey) : noteName;
  
  // オクターブを除去
  const cleanName = noteName.replace(/\d+$/, '');
  const octaveMatch = noteName.match(/(\d+)$/);
  const octave = octaveMatch ? parseInt(octaveMatch[1], 10) : 4;
  
  // tonalで移調（正しいインターバルを使用）
  const interval = Interval.fromSemitones(semitones);
  const transposed = transpose(cleanName + octave, interval);
  
  if (!transposed) {
    console.warn(`⚠️ 移調失敗: ${noteName} + ${semitones}半音`);
    return noteName;
  }
  
  // 結果を正規化（ターゲットキーを考慮）
  const result = normalizeEnharmonic(transposed.replace(/\d+$/, ''), simpleMode, targetKey);
  return octaveMatch ? result + octave : result;
}

/**
 * ターゲットキーのスケール音を取得
 * @param keyName キー名
 * @returns スケール音の配列（正しいエンハーモニック表記）
 */
function getKeyScaleNotes(keyName: string): string[] {
  const keyInfo = Key.majorKey(keyName);
  if (keyInfo && keyInfo.scale) {
    return [...keyInfo.scale]; // readonly配列をミュータブルにコピー
  }
  
  // フォールバック: 一般的なメジャースケール
  const scaleMap: Record<string, string[]> = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  };
  
  return scaleMap[keyName] || scaleMap['C'];
}

/**
 * 音名がターゲットキーのスケールに含まれるかチェックし、
 * 含まれない場合は正しいエンハーモニックに変換
 * @param noteName 音名
 * @param targetKey ターゲットキー
 * @returns 正しいエンハーモニック表記の音名
 */
function adjustToKeyScale(noteName: string, targetKey: string): string {
  const scaleNotes = getKeyScaleNotes(targetKey);
  
  // 音名のクロマ（ピッチクラス）を取得
  const noteInfo = parseNote(noteName);
  if (!noteInfo || noteInfo.chroma === undefined) {
    return noteName;
  }
  const chroma = noteInfo.chroma;
  
  // スケール内で同じクロマを持つ音を探す
  for (const scaleNote of scaleNotes) {
    const scaleNoteInfo = parseNote(scaleNote);
    if (scaleNoteInfo && scaleNoteInfo.chroma === chroma) {
      return scaleNote;
    }
  }
  
  // スケールに含まれない音（臨時記号付き）はそのまま返す
  return noteName;
}

/**
 * エンハーモニックの正規化
 * - simpleMode=true: ダブルシャープ・ダブルフラットを変換
 * - targetKeyが指定されている場合: そのキーのスケールに合わせて表記
 * @param noteName 音名
 * @param simpleMode 簡易表示モード
 * @param targetKey ターゲットキー（スケールに合わせた表記用）
 * @returns 正規化された音名
 */
function normalizeEnharmonic(noteName: string, simpleMode: boolean = true, targetKey?: string): string {
  // ターゲットキーが指定されている場合、そのキーのスケールに合わせる
  if (targetKey) {
    const adjusted = adjustToKeyScale(noteName, targetKey);
    // 簡易モードでダブルシャープ/ダブルフラットのみを変換
    if (simpleMode) {
      return normalizeDoubleAccidentals(adjusted);
    }
    return adjusted;
  }
  
  // ターゲットキーが指定されていない場合の処理
  if (!simpleMode) {
    return noteName;
  }
  
  // 簡易表示モード: ダブルシャープ・ダブルフラットのみを変換
  // 白鍵の異名同音（E#, B#, Cb, Fb）は変換しない（キーによって正しい表記が異なるため）
  return normalizeDoubleAccidentals(noteName);
}

/**
 * ダブルシャープ・ダブルフラットのみを簡易表記に変換
 * 白鍵の異名同音（E#, B#, Cb, Fb）は変換しない
 * @param noteName 音名
 * @returns 変換された音名
 */
function normalizeDoubleAccidentals(noteName: string): string {
  const doubleAccidentalMap: Record<string, string> = {
    // ダブルシャープ
    'Cx': 'D', 'C##': 'D',
    'Dx': 'E', 'D##': 'E',
    'Ex': 'F#', 'E##': 'F#',
    'Fx': 'G', 'F##': 'G',
    'Gx': 'A', 'G##': 'A',
    'Ax': 'B', 'A##': 'B',
    'Bx': 'C#', 'B##': 'C#',
    // ダブルフラット
    'Cbb': 'Bb',
    'Dbb': 'C',
    'Ebb': 'D',
    'Fbb': 'Eb',
    'Gbb': 'F',
    'Abb': 'G',
    'Bbb': 'A',
  };
  
  return doubleAccidentalMap[noteName] || noteName;
}

/**
 * 調号の少ない方を優先してキーを選択（GbメジャーとF#メジャーならGbを優先）
 * Cbメジャー（-7）は出現しないようにする
 * @param offset 移調オフセット（-6〜+6）
 * @returns 優先するキー名
 */
export function getPreferredKeyName(offset: number): string {
  // 調号数の少ない方を優先するマッピング
  // +6 = F#/Gb → Gb（♭6個）を優先（F#は#6個で同じだがフラットの方が読みやすい）
  // -6 = Gb/F# → Gb を優先
  const keyMap: Record<number, string> = {
    0: 'C',
    1: 'Db',   // Db（♭5個）を優先（C#は#7個）
    2: 'D',
    3: 'Eb',   // Eb（♭3個）を優先（D#は#5個）
    4: 'E',
    5: 'F',
    6: 'Gb',   // Gb（♭6個）を優先（F#は#6個、同等だがフラットを優先）
    '-1': 'B',
    '-2': 'Bb', // Bb（♭2個）
    '-3': 'A',
    '-4': 'Ab', // Ab（♭4個）
    '-5': 'G',
    '-6': 'Gb', // Gb（♭6個）= F#（#6個）、フラットを優先
  };
  
  return keyMap[offset] || 'C';
}

/**
 * MIDIノートを移調
 * @param midi MIDIノート番号
 * @param semitones 半音数
 * @returns 移調後のMIDIノート番号
 */
export function transposeMidi(midi: number, semitones: number): number {
  return midi + semitones;
}

/**
 * ChordDefinitionを移調
 * @param chord 元のコード定義
 * @param semitones 半音数
 * @param simpleMode 簡易表示モード（true: ダブルシャープや白鍵の異名同音を変換）
 * @returns 移調後のコード定義
 */
export function transposeChordDefinition(chord: ChordDefinition, semitones: number, simpleMode: boolean = true, originalKey?: string): ChordDefinition {
  // ターゲットキーを計算（元のキーが不明な場合はルート音から推測）
  const effectiveOriginalKey = originalKey || chord.root;
  const targetKey = semitones !== 0 
    ? getTargetKeyFromTransposition(effectiveOriginalKey, semitones)
    : effectiveOriginalKey;
  
  if (semitones === 0) {
    // 移調なしでも簡易モードの正規化は適用
    if (simpleMode) {
      const normalizedRoot = normalizeEnharmonic(chord.root, true, targetKey);
      const normalizedNoteNames = chord.noteNames.map(name => normalizeEnharmonic(name, true, targetKey));
      let normalizedDisplayName = chord.displayName;
      if (chord.displayName.startsWith(chord.root) && chord.root !== normalizedRoot) {
        normalizedDisplayName = normalizedRoot + chord.displayName.slice(chord.root.length);
      }
      return {
        ...chord,
        root: normalizedRoot,
        noteNames: normalizedNoteNames,
        displayName: normalizedDisplayName,
        id: normalizedDisplayName.replace(/\s+/g, '')
      };
    }
    return chord;
  }
  
  // ルート音を移調（ターゲットキーを渡す）
  const transposedRoot = transposeNoteName(chord.root, semitones, simpleMode, targetKey);
  
  // 各構成音を移調（ターゲットキーを渡す）
  const transposedNoteNames = chord.noteNames.map(name => transposeNoteName(name, semitones, simpleMode, targetKey));
  
  // MIDIノートを移調
  const transposedNotes = chord.notes.map(midi => transposeMidi(midi, semitones));
  
  // 表示名を更新（コード名の場合はルートを置換）
  let transposedDisplayName = chord.displayName;
  if (chord.displayName.startsWith(chord.root)) {
    transposedDisplayName = transposedRoot + chord.displayName.slice(chord.root.length);
  } else {
    // 単音などの場合
    transposedDisplayName = transposedNoteNames.join(' ');
  }
  
  return {
    id: transposedDisplayName.replace(/\s+/g, ''),
    displayName: transposedDisplayName,
    notes: transposedNotes,
    noteNames: transposedNoteNames,
    quality: chord.quality,
    root: transposedRoot
  };
}

/**
 * TaikoNoteを移調
 * @param note 元のノート
 * @param semitones 半音数
 * @param simpleMode 簡易表示モード（true: ダブルシャープや白鍵の異名同音を変換）
 * @returns 移調後のノート
 */
export function transposeTaikoNote(note: TaikoNote, semitones: number, simpleMode: boolean = true, originalKey?: string): TaikoNote {
  if (semitones === 0 && !simpleMode) return note;
  
  return {
    ...note,
    id: semitones !== 0 ? `${note.id}_t${semitones}` : note.id, // 移調を識別できるようにIDを更新
    chord: transposeChordDefinition(note.chord, semitones, simpleMode, originalKey)
  };
}

/**
 * TaikoNote配列を移調
 * @param notes ノート配列
 * @param semitones 半音数
 * @param simpleMode 簡易表示モード（true: ダブルシャープや白鍵の異名同音を変換）
 * @param originalKey 元のキー（省略時は最初のノートのルート音から推測）
 * @returns 移調後のノート配列
 */
export function transposeTaikoNotes(notes: TaikoNote[], semitones: number, simpleMode: boolean = true, originalKey?: string): TaikoNote[] {
  if (semitones === 0 && !simpleMode) return notes;
  
  // 元のキーが指定されていない場合、最初のノートのルート音から推測
  const effectiveOriginalKey = originalKey || (notes.length > 0 ? notes[0].chord.root : 'C');
  
  return notes.map(note => transposeTaikoNote(note, semitones, simpleMode, effectiveOriginalKey));
}

/**
 * リピート回数に応じた移調オフセットを計算
 * レジェンドモードに準拠: ±6の範囲に収める（Cbメジャーキーを避ける）
 * @param baseOffset 基準オフセット
 * @param repeatCycle 現在のリピート回数（0から開始）
 * @param repeatKeyChange リピートごとのキー変更設定
 * @returns 実際の移調オフセット（-6〜+6の半音数）
 */
export function calculateTransposeOffset(
  baseOffset: number,
  repeatCycle: number,
  repeatKeyChange: RepeatKeyChange
): number {
  if (repeatKeyChange === 'off') {
    // offの場合もbaseOffsetを±6の範囲に正規化
    return normalizeToSixRange(baseOffset);
  }
  
  let changeAmount: number;
  
  if (repeatKeyChange === 'random') {
    // ランダムモード: +1, +5, -1, -5からランダムに選択
    // repeatCycleが0の場合（初回）は変更なし、それ以降はランダム
    if (repeatCycle === 0) {
      return normalizeToSixRange(baseOffset);
    }
    // シード値としてrepeatCycleを使用し、再現性のあるランダムを生成
    // 各リピートで異なる値を選択するが、同じリピート回数なら同じ値
    const options = [1, 5, -1, -5];
    // 簡易的なハッシュ関数でインデックスを決定
    const index = Math.abs((repeatCycle * 7 + baseOffset * 13) % options.length);
    changeAmount = options[index];
    const totalChange = baseOffset + (repeatCycle * changeAmount);
    return normalizeToSixRange(totalChange);
  }
  
  // 固定値モード: +1, +5, -1, -5
  switch (repeatKeyChange) {
    case '+1':
      changeAmount = 1;
      break;
    case '+5':
      changeAmount = 5;
      break;
    case '-1':
      changeAmount = -1;
      break;
    case '-5':
      changeAmount = -5;
      break;
    default:
      changeAmount = 0;
  }
  
  const totalChange = baseOffset + (repeatCycle * changeAmount);
  
  // ±6の範囲に収める（レジェンドモード仕様）
  return normalizeToSixRange(totalChange);
}

/**
 * 半音数を±6の範囲に正規化
 * 0〜11 → 0〜6（正）と -5〜-1（7〜11を負に変換）
 * レジェンドモード仕様: Cbメジャー（-7）やF#メジャー（+6超）を避ける
 * @param semitones 半音数
 * @returns -6〜+6の範囲に正規化された半音数
 */
function normalizeToSixRange(semitones: number): number {
  // まず0〜11の範囲に正規化
  let normalized = ((semitones % 12) + 12) % 12;
  
  // 7〜11は -5〜-1 に変換（五度圏で近い方を選択）
  // 6は +6 のまま（Gb = F# だが Gb を優先）
  if (normalized > 6) {
    normalized = normalized - 12;
  }
  
  return normalized;
}

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
  isAuftaktNote?: boolean; // アウフタクトノーツ（カウントイン中のノーツ、2回目以降のループで除外）
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
    }
  | {
      chord: string;       // ルート音 (例: 'C', 'D#', 'Bb')
      interval: string;    // インターバル名 (例: 'm2', 'M3', 'P5')
      direction: 'up' | 'down';
      octave?: number | null;
      /** 度数問題の場合に 'interval' をセット */
      type: 'interval';
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
  type?: 'note' | 'chord';
  /**
   * 同タイミングの複数ノーツをまとめた場合の個別音名配列
   * 例: ["C", "E", "G"] - 低い順にソート済み
   * Progression_Timing用：縦配置表示やガイドに使用
   */
  notes?: string[];
  /**
   * 歌詞から取得した表示用テキスト
   * MusicXMLの歌詞(lyric)から取得し、次の歌詞が出現するまで継続
   * 例: "C", "Dm7", "G7" など
   * 太鼓ノーツの上に表示される音名として使用
   */
  lyricDisplay?: string;
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
  if (Math.abs(diffMs) <= PERFORMANCE_CONFIG.PERFECT_WINDOW) {
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
 * @param intervalBeats 拍間隔
 * @param isAuftakt アウフタクト設定（trueの場合、カウントイン小節にもノーツを生成）
 */
export function generateBasicProgressionNotes(
  chordProgression: ChordSpec[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0,
  intervalBeats: number = timeSignature,
  isAuftakt: boolean = false
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

  const rawIntervalBeats =
    typeof intervalBeats === 'string' ? Number.parseFloat(intervalBeats) : intervalBeats;
  const safeIntervalBeats =
    Number.isFinite(rawIntervalBeats) && rawIntervalBeats > 0 ? rawIntervalBeats : timeSignature;

  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;

  // ノートごとの進行インデックス
  let noteIndex = 0;

  // アウフタクト: カウントイン小節のノーツを負のhitTimeで生成
  if (isAuftakt && countInMeasures > 0) {
    for (let ci = 0; ci < countInMeasures; ci++) {
      for (let step = 0; ; step++) {
        const beat = 1 + step * safeIntervalBeats;
        if (beat > timeSignature + 1e-9) break;

        const spec = chordProgression[noteIndex % chordProgression.length];
        const chord = getChordDefinition(spec);
        if (!chord) {
          noteIndex++;
          continue;
        }

        const hitTime = -(countInMeasures - ci) * secPerMeasure + (beat - 1) * secPerBeat;

        notes.push({
          id: `note_ci${ci + 1}_${beat}`,
          chord,
          hitTime,
          measure: ci + 1,
          beat,
          isHit: false,
          isMissed: false,
          isAuftaktNote: true,
        });

        noteIndex++;
      }
    }
  }
  
  // 各小節に対して intervalBeats おきに配置（1拍目から）
  // 浮動小数の累積誤差でタイミングが崩れないよう step から beat を算出する。
  for (let measure = 1; measure <= measureCount; measure++) {
    for (let step = 0; ; step++) {
      const beat = 1 + step * safeIntervalBeats;
      if (beat > timeSignature + 1e-9) break;

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
 * @param intervalBeats 拍間隔
 * @param isAuftakt アウフタクト設定（trueの場合、カウントイン小節にもノーツを生成）
 */
export function generateRandomProgressionNotes(
  chordPool: ChordSpec[],
  measureCount: number,
  bpm: number,
  timeSignature: number,
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0,
  intervalBeats: number = timeSignature,
  isAuftakt: boolean = false
): TaikoNote[] {
  if (chordPool.length === 0) return [];

  const rawIntervalBeats =
    typeof intervalBeats === 'string' ? Number.parseFloat(intervalBeats) : intervalBeats;
  const safeIntervalBeats =
    Number.isFinite(rawIntervalBeats) && rawIntervalBeats > 0 ? rawIntervalBeats : timeSignature;

  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;

  // 袋形式ランダムセレクターを使用
  const specToId = (s: ChordSpec) => (typeof s === 'string' ? s : s.chord);
  const bagSelector = new BagRandomSelector(chordPool, specToId);

  // アウフタクト: カウントイン小節のノーツを負のhitTimeで生成
  if (isAuftakt && countInMeasures > 0) {
    for (let ci = 0; ci < countInMeasures; ci++) {
      for (let step = 0; ; step++) {
        const beat = 1 + step * safeIntervalBeats;
        if (beat > timeSignature + 1e-9) break;

        const nextSpec = bagSelector.next();
        const chord = getChordDefinition(nextSpec);
        if (!chord) continue;

        const hitTime = -(countInMeasures - ci) * secPerMeasure + (beat - 1) * secPerBeat;

        notes.push({
          id: `note_ci${ci + 1}_${beat}`,
          chord,
          hitTime,
          measure: ci + 1,
          beat,
          isHit: false,
          isMissed: false,
          isAuftaktNote: true,
        });
      }
    }
  }

  // 各小節に対して intervalBeats おきに配置（1拍目から）
  // 浮動小数の累積誤差でタイミングが崩れないよう step から beat を算出する。
  for (let measure = 1; measure <= measureCount; measure++) {
    for (let step = 0; ; step++) {
      const beat = 1 + step * safeIntervalBeats;
      if (beat > timeSignature + 1e-9) break;

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
 * @param isAuftakt アウフタクト設定（trueの場合、bar 1〜countInMeasuresをカウントイン小節として負のhitTimeで配置）
 */
export function parseChordProgressionData(
  progressionData: ChordProgressionDataItem[],
  bpm: number,
  timeSignature: number,
  getChordDefinition: (spec: ChordSpec) => ChordDefinition | null,
  countInMeasures: number = 0,
  isAuftakt: boolean = false
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const secPerBeat = 60 / bpm;
  const secPerMeasure = secPerBeat * timeSignature;
  
  // 最大小節数を取得
  const maxBar = Math.max(...progressionData.map(item => item.bar), 0);

  // アウフタクト: bar 1〜countInMeasures のノーツを負のhitTimeにシフト
  const auftaktOffset = (isAuftakt && countInMeasures > 0) ? countInMeasures : 0;
  
  progressionData
    // 演奏用ノーツは chord が空/N.C. のものは無視（テキスト専用）
    .filter(item => item.chord && item.chord.trim() !== '' && item.chord.toUpperCase() !== 'N.C.')
    .forEach((item, index) => {
    const isAuftaktNote = auftaktOffset > 0 && item.bar <= auftaktOffset;
    const effectiveBar = auftaktOffset > 0 ? item.bar - auftaktOffset : item.bar;

    // 新方式: notes配列がある場合は複数音として処理
    if (item.notes && item.notes.length > 0) {
      const chord = buildChordFromNotes(item.notes, item.octave ?? 4, item.lyricDisplay);
      if (chord) {
        const hitTime = (effectiveBar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
        notes.push({
          id: `note_${item.bar}_${item.beats}_${index}`,
          chord,
          hitTime,
          measure: item.bar,
          beat: item.beats,
          isHit: false,
          isMissed: false,
          ...(isAuftaktNote ? { isAuftaktNote: true } : {}),
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
      const hitTime = (effectiveBar - 1) * secPerMeasure + (item.beats - 1) * secPerBeat;
      
      // lyricDisplayがある場合は、displayNameとnoteNamesを上書き
      const finalChord = item.lyricDisplay ? {
        ...chord,
        displayName: item.lyricDisplay,
        noteNames: [item.lyricDisplay]
      } : chord;
      
      notes.push({
        id: `note_${item.bar}_${item.beats}_${index}`,
        chord: finalChord,
        hitTime,
        measure: item.bar,
        beat: item.beats,
        isHit: false,
        isMissed: false,
        ...(isAuftaktNote ? { isAuftaktNote: true } : {}),
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
 * @param noteNames 音名配列
 * @param baseOctave ベースオクターブ
 * @param lyricDisplay 歌詞表示用テキスト（設定されている場合、displayNameとnoteNamesに使用）
 */
function buildChordFromNotes(noteNames: string[], baseOctave: number, lyricDisplay?: string): ChordDefinition | null {
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
  
  // lyricDisplayがある場合はそれを使用、なければ音名を結合
  const displayName = lyricDisplay || cleanNoteNames.join(' ');
  // 太鼓ノーツ上の表示用（lyricDisplayがあれば単一テキスト、なければ個別音名）
  const displayNoteNames = lyricDisplay ? [lyricDisplay] : cleanNoteNames;
  
  return {
    id: displayName.replace(/\s+/g, ''),
    displayName,
    notes: midiNotes,
    noteNames: displayNoteNames,
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
    if (note.isHit) return false;
    
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
  if (Math.abs(diffMs) <= PERFORMANCE_CONFIG.PERFECT_WINDOW) {
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
    if (note.isHit) return;
    
    let timeUntilHit = note.hitTime - currentTime;
    
    if (loopDuration !== undefined && loopDuration > 0) {
      if (currentTime + lookAheadTime > loopDuration && note.hitTime < lookAheadTime) {
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
  PERFECT_WINDOW: 60,           // Perfect判定ウィンドウ（ms）
  
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
    
    if (note.isHit) continue;
    
    let timeUntilHit = note.hitTime - currentTime;
    
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