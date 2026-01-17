/**
 * ファンタジーモード用移調ユーティリティ
 * tonal.jsを使用して音楽理論的に正しい移調処理を提供
 */

import { transpose, note as parseNote, Interval } from 'tonal';
import type { TaikoNote, ChordSpec, ChordProgressionDataItem } from '@/components/fantasy/TaikoNoteSystem';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';

// ===== 型定義 =====

/**
 * 移調設定
 */
export interface TranspositionSettings {
  /** 初期移調量（半音数、-6〜+6） */
  initialTranspose: number;
  /** リピートごとの移調量（0=OFF, 1=+1半音, 5=+5半音） */
  repeatTranspose: 0 | 1 | 5;
}

/**
 * 使用可能なキー（12種類）
 * CbメジャーやF#メジャーが登場しないようにフラット系を優先
 */
export const AVAILABLE_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type AvailableKey = typeof AVAILABLE_KEYS[number];

/**
 * 半音数から移調後のキーを取得するマップ
 * C = 0として、各半音に対応するキーを定義
 */
const SEMITONE_TO_KEY: Record<number, AvailableKey> = {
  0: 'C',
  1: 'Db',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'Gb', // またはF#だがGbを優先
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B'
};

/**
 * キーから半音数へのマップ（C = 0）
 */
const KEY_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2, 'Cx': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'E#': 5, 'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7, 'Fx': 7,
  'G#': 8, 'Ab': 8,
  'A': 9, 'Gx': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

// ===== ヘルパー関数 =====

/**
 * 半音数を正規化（0-11の範囲に収める）
 */
function normalizeSemitone(semitone: number): number {
  return ((semitone % 12) + 12) % 12;
}

/**
 * 音名を正規化（ダブルシャープ・ダブルフラットを等価な音名に変換）
 * 例: Fx -> G, Bbb -> A
 */
function normalizeNoteName(noteName: string): string {
  // オクターブを分離
  const match = noteName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(\d*)$/);
  if (!match) return noteName;
  
  const [, pitch, octave] = match;
  
  // tonalで解析してMIDI番号を取得
  const parsed = parseNote(pitch + '4'); // ダミーオクターブ
  if (!parsed || typeof parsed.midi !== 'number') return noteName;
  
  // MIDI番号から正規化された音名を取得
  const normalizedPitch = SEMITONE_TO_KEY[parsed.midi % 12];
  
  return octave ? `${normalizedPitch}${octave}` : normalizedPitch;
}

/**
 * 半音数をインターバル文字列に変換
 */
function semitonesToInterval(semitones: number): string {
  // 正規化（-12〜+12の範囲に収める）
  const normalized = ((semitones % 12) + 12) % 12;
  
  // 負の移調の場合
  if (semitones < 0) {
    // 下行移調: 例えば-1半音 = 11半音上行と同じピッチクラスだが、
    // オクターブを考慮すると下行方向を使用
    const absInterval = Math.abs(semitones);
    const intervalMap: Record<number, string> = {
      1: '-2m', 2: '-2M', 3: '-3m', 4: '-3M', 5: '-4P',
      6: '-5d', 7: '-5P', 8: '-6m', 9: '-6M', 10: '-7m',
      11: '-7M', 12: '-8P'
    };
    return intervalMap[absInterval] || '1P';
  }
  
  // 上行移調
  const intervalMap: Record<number, string> = {
    0: '1P', 1: '2m', 2: '2M', 3: '3m', 4: '3M', 5: '4P',
    6: '5d', 7: '5P', 8: '6m', 9: '6M', 10: '7m', 11: '7M', 12: '8P'
  };
  return intervalMap[normalized] || '1P';
}

// ===== メイン関数 =====

/**
 * 音名を指定した半音数だけ移調する
 * @param noteName 音名（例: 'C', 'F#', 'Bb4'）
 * @param semitones 移調量（半音数、-6〜+6）
 * @returns 移調後の音名
 */
export function transposeNoteName(noteName: string, semitones: number): string {
  if (semitones === 0) return noteName;
  
  // オクターブを分離
  const match = noteName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(\d*)$/);
  if (!match) {
    console.warn(`⚠️ 移調失敗: 無効な音名 ${noteName}`);
    return noteName;
  }
  
  const [, pitch, octave] = match;
  
  // インターバルに変換して移調
  const interval = semitonesToInterval(semitones);
  const noteWithOctave = octave ? `${pitch}${octave}` : `${pitch}4`;
  const transposed = transpose(noteWithOctave, interval);
  
  if (!transposed) {
    console.warn(`⚠️ 移調失敗: ${noteName} + ${semitones}半音`);
    return noteName;
  }
  
  // 結果を正規化
  const normalizedTransposed = normalizeNoteName(transposed);
  
  // オクターブの有無に応じて返す
  if (octave) {
    return normalizedTransposed;
  }
  // オクターブを除去
  return normalizedTransposed.replace(/\d+$/, '');
}

/**
 * コード名を移調する
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @param semitones 移調量（半音数、-6〜+6）
 * @returns 移調後のコード名
 */
export function transposeChordName(chordName: string, semitones: number): string {
  if (semitones === 0) return chordName;
  
  // スラッシュコード対応
  if (chordName.includes('/')) {
    const [chord, bass] = chordName.split('/');
    const transposedChord = transposeChordName(chord, semitones);
    const transposedBass = transposeNoteName(bass, semitones);
    return `${transposedChord}/${transposedBass}`;
  }
  
  // ルート音とサフィックスを分離
  const match = chordName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.*)$/);
  if (!match) {
    console.warn(`⚠️ コード移調失敗: 無効なコード名 ${chordName}`);
    return chordName;
  }
  
  const [, root, suffix] = match;
  const transposedRoot = transposeNoteName(root, semitones);
  
  return `${transposedRoot}${suffix}`;
}

/**
 * ChordSpecを移調する
 * @param spec コード指定
 * @param semitones 移調量（半音数）
 * @returns 移調後のChordSpec
 */
export function transposeChordSpec(spec: ChordSpec, semitones: number): ChordSpec {
  if (semitones === 0) return spec;
  
  if (typeof spec === 'string') {
    return transposeChordName(spec, semitones);
  }
  
  return {
    ...spec,
    chord: transposeChordName(spec.chord, semitones)
  };
}

/**
 * ChordDefinitionを移調する
 * @param chord コード定義
 * @param semitones 移調量（半音数）
 * @returns 移調後のChordDefinition
 */
export function transposeChordDefinition(chord: ChordDefinition, semitones: number): ChordDefinition {
  if (semitones === 0) return chord;
  
  // MIDIノートを移調
  const transposedNotes = chord.notes.map(note => note + semitones);
  
  // 音名を移調
  const transposedNoteNames = chord.noteNames.map(name => 
    transposeNoteName(name, semitones)
  );
  
  // 表示名とルートを移調
  const transposedDisplayName = transposeChordName(chord.displayName, semitones);
  const transposedRoot = transposeNoteName(chord.root, semitones);
  const transposedId = transposeChordName(chord.id, semitones);
  
  return {
    ...chord,
    id: transposedId,
    displayName: transposedDisplayName,
    notes: transposedNotes,
    noteNames: transposedNoteNames,
    root: transposedRoot
  };
}

/**
 * TaikoNoteを移調する
 * @param note 太鼓ノーツ
 * @param semitones 移調量（半音数）
 * @returns 移調後のTaikoNote
 */
export function transposeTaikoNote(note: TaikoNote, semitones: number): TaikoNote {
  if (semitones === 0) return note;
  
  return {
    ...note,
    chord: transposeChordDefinition(note.chord, semitones)
  };
}

/**
 * TaikoNote配列を移調する
 * @param notes 太鼓ノーツ配列
 * @param semitones 移調量（半音数）
 * @returns 移調後のTaikoNote配列
 */
export function transposeTaikoNotes(notes: TaikoNote[], semitones: number): TaikoNote[] {
  if (semitones === 0) return notes;
  
  return notes.map(note => transposeTaikoNote(note, semitones));
}

/**
 * ChordProgressionDataItemを移調する
 * @param item コード進行データ項目
 * @param semitones 移調量（半音数）
 * @returns 移調後のChordProgressionDataItem
 */
export function transposeProgressionDataItem(
  item: ChordProgressionDataItem,
  semitones: number
): ChordProgressionDataItem {
  if (semitones === 0) return item;
  
  const result: ChordProgressionDataItem = {
    ...item,
    chord: transposeChordName(item.chord, semitones)
  };
  
  // notes配列がある場合は移調
  if (item.notes) {
    result.notes = item.notes.map(note => transposeNoteName(note, semitones));
  }
  
  // lyricDisplayがある場合は移調（コード名として扱う）
  if (item.lyricDisplay) {
    result.lyricDisplay = transposeChordName(item.lyricDisplay, semitones);
  }
  
  // textがある場合は移調（Harmony表示など）
  if (item.text) {
    result.text = transposeChordName(item.text, semitones);
  }
  
  return result;
}

/**
 * コード進行データ配列を移調する
 * @param data コード進行データ配列
 * @param semitones 移調量（半音数）
 * @returns 移調後のコード進行データ配列
 */
export function transposeProgressionData(
  data: ChordProgressionDataItem[],
  semitones: number
): ChordProgressionDataItem[] {
  if (semitones === 0) return data;
  
  return data.map(item => transposeProgressionDataItem(item, semitones));
}

/**
 * リピートサイクルに応じた移調量を計算
 * @param loopCycle 現在のループサイクル（0始まり）
 * @param settings 移調設定
 * @returns 適用する移調量（半音数）
 */
export function calculateTransposeForLoop(
  loopCycle: number,
  settings: TranspositionSettings
): number {
  if (settings.repeatTranspose === 0) {
    // リピート移調OFFの場合は初期移調量をそのまま返す
    return settings.initialTranspose;
  }
  
  // リピートごとに移調を加算
  const totalTranspose = settings.initialTranspose + (loopCycle * settings.repeatTranspose);
  
  // -6〜+6の範囲に正規化（12半音を超えたらオクターブを巻き戻す）
  let normalized = totalTranspose % 12;
  if (normalized > 6) normalized -= 12;
  if (normalized < -6) normalized += 12;
  
  return normalized;
}

/**
 * 移調量から表示用のキー名を取得
 * @param semitones 移調量（半音数、基準キーCからの差分）
 * @returns キー名（C, Db, D, ...）
 */
export function getKeyNameFromTranspose(semitones: number): AvailableKey {
  const normalized = normalizeSemitone(semitones);
  return SEMITONE_TO_KEY[normalized];
}

/**
 * 移調量をユーザー表示用の文字列に変換
 * @param semitones 移調量
 * @returns 表示用文字列（例: "+2", "-3", "0"）
 */
export function formatTransposeDisplay(semitones: number): string {
  if (semitones > 0) return `+${semitones}`;
  return `${semitones}`;
}

/**
 * 移調オプションを生成（±6の範囲）
 * @returns 移調オプション配列
 */
export function generateTransposeOptions(): Array<{ value: number; label: string }> {
  const options: Array<{ value: number; label: string }> = [];
  
  for (let i = -6; i <= 6; i++) {
    options.push({
      value: i,
      label: formatTransposeDisplay(i)
    });
  }
  
  return options;
}

/**
 * リピート移調オプション
 */
export const REPEAT_TRANSPOSE_OPTIONS: Array<{ value: 0 | 1 | 5; label: string }> = [
  { value: 0, label: 'OFF' },
  { value: 1, label: '+1' },
  { value: 5, label: '+5' }
];

/**
 * デフォルトの移調設定
 */
export const DEFAULT_TRANSPOSITION_SETTINGS: TranspositionSettings = {
  initialTranspose: 0,
  repeatTranspose: 0
};
