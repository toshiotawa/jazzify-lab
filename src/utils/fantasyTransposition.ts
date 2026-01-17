/**
 * ファンタジーモード用 移調ユーティリティ
 * Timingモードでのコード・ノーツの移調処理
 */

import { Note, transpose, note as parseNote } from 'tonal';

// 有効な出題キー（12種類）
// F#メジャーなどは除外し、フラット系を使用
export const VALID_TRANSPOSITION_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type TranspositionKey = typeof VALID_TRANSPOSITION_KEYS[number];

// キー変更の選択肢（±6）
export const TRANSPOSITION_OFFSETS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] as const;
export type TranspositionOffset = typeof TRANSPOSITION_OFFSETS[number];

// リピートごとのキー変更モード
export const REPEAT_KEY_CHANGE_MODES = ['off', '+1', '+5'] as const;
export type RepeatKeyChangeMode = typeof REPEAT_KEY_CHANGE_MODES[number];

// キーのインデックスマップ（半音数で計算）
const KEY_TO_SEMITONES: Record<TranspositionKey, number> = {
  'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
  'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
};

// 半音数からキーへの逆引きマップ
const SEMITONES_TO_KEY: Record<number, TranspositionKey> = Object.fromEntries(
  VALID_TRANSPOSITION_KEYS.map(key => [KEY_TO_SEMITONES[key], key])
) as Record<number, TranspositionKey>;

/**
 * 基準キーからのオフセットで移調先キーを計算
 * @param baseKey 基準キー（例: 'C', 'G', 'F'）
 * @param offset 半音オフセット（-6〜+6）
 * @returns 移調先キー（有効な12キーのいずれか）
 */
export function calculateTransposedKey(baseKey: TranspositionKey, offset: TranspositionOffset): TranspositionKey {
  const baseSemitones = KEY_TO_SEMITONES[baseKey];
  // 12音階でラップ（負の値も正しく処理）
  const targetSemitones = ((baseSemitones + offset) % 12 + 12) % 12;
  return SEMITONES_TO_KEY[targetSemitones];
}

/**
 * 2つのキー間の半音数を計算
 * @param fromKey 移調元キー
 * @param toKey 移調先キー
 * @returns 半音数（-6〜+6の範囲で最短距離）
 */
export function getSemitonesForTransposition(fromKey: TranspositionKey, toKey: TranspositionKey): number {
  const fromSemi = KEY_TO_SEMITONES[fromKey];
  const toSemi = KEY_TO_SEMITONES[toKey];
  let diff = toSemi - fromSemi;
  
  // -6〜+6の範囲に正規化
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  
  return diff;
}

/**
 * 半音数をTonalのインターバル文字列に変換
 * @param semitones 半音数（-12〜+12）
 * @returns インターバル文字列（例: '2m', '3M', '5P'）
 */
function semitonesToInterval(semitones: number): string {
  // 正規化（-12〜+12を0〜11の範囲に）
  const normalizedSemi = ((semitones % 12) + 12) % 12;
  const isNegative = semitones < 0;
  
  const intervalMap: Record<number, string> = {
    0: '1P',
    1: '2m', 2: '2M', 3: '3m', 4: '3M',
    5: '4P', 6: '4A', 7: '5P', 8: '6m',
    9: '6M', 10: '7m', 11: '7M'
  };
  
  const interval = intervalMap[normalizedSemi] || '1P';
  return isNegative ? `-${interval}` : interval;
}

/**
 * 単音を移調
 * @param noteName 音名（例: 'C', 'F#', 'Bb'）
 * @param semitones 移調する半音数
 * @returns 移調後の音名
 */
export function transposeNote(noteName: string, semitones: number): string {
  if (semitones === 0) return noteName;
  
  // オクターブを分離
  const match = noteName.match(/^([A-Ga-g][#bx]*)(\d*)$/);
  if (!match) return noteName;
  
  const [, pitch, octaveStr] = match;
  const octave = octaveStr ? parseInt(octaveStr, 10) : 4;
  
  // Tonalで移調（ダブルシャープ対応）
  const noteWithOctave = pitch.replace(/x/g, '##') + octave;
  const interval = semitonesToInterval(semitones);
  const transposed = transpose(noteWithOctave, interval);
  
  if (!transposed) {
    console.warn(`⚠️ 移調失敗: ${noteName} + ${semitones}半音`);
    return noteName;
  }
  
  // 結果を正規化（ダブルシャープ→x、エンハーモニック処理）
  let result = transposed.replace(/\d+$/, ''); // オクターブを除去
  result = result.replace(/##/g, 'x'); // ダブルシャープをxに変換
  
  // 有効なキー表記に正規化（例: D# → Eb、F## → G）
  result = normalizeToValidKey(result);
  
  // オクターブがあれば付け直す
  if (octaveStr) {
    // 移調後のオクターブを計算
    const parsed = parseNote(transposed);
    const newOctave = parsed?.oct ?? octave;
    result = result + newOctave;
  }
  
  return result;
}

/**
 * 音名を有効なキー表記に正規化
 * シャープ系をフラット系に変換（F#→Gb、C#→Dbなど）
 * @param noteName 音名
 * @returns 正規化された音名
 */
function normalizeToValidKey(noteName: string): string {
  // ダブルフラット、ダブルシャープを単純な音名に変換
  const enharmonicMap: Record<string, string> = {
    // シャープ系 → フラット系
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
    // ダブルシャープ
    'Cx': 'D', 'Dx': 'E', 'Ex': 'F#', 'Fx': 'G', 'Gx': 'A', 'Ax': 'B', 'Bx': 'C#',
    // ダブルフラット
    'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb', 'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A',
    // E#, B# の処理
    'E#': 'F', 'B#': 'C',
    // Cb, Fb の処理
    'Cb': 'B', 'Fb': 'E'
  };
  
  const normalized = enharmonicMap[noteName] || noteName;
  
  // まだシャープが残っている場合は再帰的に変換
  if (normalized.includes('#') && enharmonicMap[normalized]) {
    return normalizeToValidKey(normalized);
  }
  
  return normalized;
}

/**
 * コード名を移調
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @param semitones 移調する半音数
 * @returns 移調後のコード名
 */
export function transposeChord(chordName: string, semitones: number): string {
  if (semitones === 0) return chordName;
  
  // スラッシュコード対応（例: C/E → Db/F）
  if (chordName.includes('/')) {
    const [numerator, denominator] = chordName.split('/');
    const transposedNum = transposeChord(numerator, semitones);
    const transposedDenom = transposeNote(denominator, semitones);
    return `${transposedNum}/${transposedDenom}`;
  }
  
  // ルート音とサフィックスを分離
  const match = chordName.match(/^([A-Ga-g][#bx]*)(.*)$/);
  if (!match) return chordName;
  
  const [, root, suffix] = match;
  const transposedRoot = transposeNote(root, semitones);
  
  return transposedRoot + suffix;
}

/**
 * MIDIノート番号を移調
 * @param midiNote MIDIノート番号
 * @param semitones 移調する半音数
 * @returns 移調後のMIDIノート番号
 */
export function transposeMidiNote(midiNote: number, semitones: number): number {
  return midiNote + semitones;
}

/**
 * MIDIノート番号配列を移調
 * @param midiNotes MIDIノート番号配列
 * @param semitones 移調する半音数
 * @returns 移調後のMIDIノート番号配列
 */
export function transposeMidiNotes(midiNotes: number[], semitones: number): number[] {
  if (semitones === 0) return midiNotes;
  return midiNotes.map(note => transposeMidiNote(note, semitones));
}

/**
 * リピート時の次のキーを計算
 * @param currentKey 現在のキー
 * @param repeatMode リピートキー変更モード
 * @param loopCount 現在のループ回数（0始まり）
 * @returns 次のキー
 */
export function calculateNextKeyForRepeat(
  currentKey: TranspositionKey,
  repeatMode: RepeatKeyChangeMode,
  _loopCount: number
): TranspositionKey {
  if (repeatMode === 'off') return currentKey;
  
  const increment = repeatMode === '+1' ? 1 : 5;
  return calculateTransposedKey(currentKey, increment as TranspositionOffset);
}

/**
 * ドロップダウン用のキー選択肢を生成
 * @param baseKey 基準キー
 * @returns { value: TranspositionKey, label: string, offset: number }[]
 */
export function generateKeyOptions(baseKey: TranspositionKey): Array<{
  value: TranspositionKey;
  label: string;
  offset: number;
}> {
  return TRANSPOSITION_OFFSETS.map(offset => {
    const key = calculateTransposedKey(baseKey, offset);
    const sign = offset > 0 ? '+' : '';
    const label = offset === 0 ? `${key}（基準）` : `${key}（${sign}${offset}）`;
    return { value: key, label, offset };
  });
}

/**
 * 移調設定インターフェース
 */
export interface TranspositionSettings {
  /** 移調練習機能が有効か */
  enabled: boolean;
  /** ステージの基準キー */
  baseKey: TranspositionKey;
  /** ユーザー選択のキー変更オフセット */
  userKeyOffset: TranspositionOffset;
  /** リピートごとのキー変更モード */
  repeatKeyChangeMode: RepeatKeyChangeMode;
}

/**
 * デフォルトの移調設定
 */
export const DEFAULT_TRANSPOSITION_SETTINGS: TranspositionSettings = {
  enabled: false,
  baseKey: 'C',
  userKeyOffset: 0,
  repeatKeyChangeMode: 'off'
};

/**
 * 現在の演奏キーを計算
 * @param settings 移調設定
 * @param loopCount 現在のループ回数（0始まり）
 * @returns 現在の演奏キー
 */
export function getCurrentPlayKey(
  settings: TranspositionSettings,
  loopCount: number = 0
): TranspositionKey {
  if (!settings.enabled) return settings.baseKey;
  
  // 基準キー + ユーザー選択オフセット
  let currentKey = calculateTransposedKey(settings.baseKey, settings.userKeyOffset);
  
  // リピートごとのキー変更を適用
  if (settings.repeatKeyChangeMode !== 'off' && loopCount > 0) {
    const increment = settings.repeatKeyChangeMode === '+1' ? 1 : 5;
    const totalOffset = (increment * loopCount) % 12;
    currentKey = calculateTransposedKey(currentKey, totalOffset as TranspositionOffset);
  }
  
  return currentKey;
}

/**
 * 移調に必要な半音数を計算
 * @param settings 移調設定
 * @param loopCount 現在のループ回数（0始まり）
 * @returns 半音数
 */
export function getTranspositionSemitones(
  settings: TranspositionSettings,
  loopCount: number = 0
): number {
  const currentKey = getCurrentPlayKey(settings, loopCount);
  return getSemitonesForTransposition(settings.baseKey, currentKey);
}
