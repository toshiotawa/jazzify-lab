/**
 * 移調ユーティリティ
 * ファンタジーモードのTiming移調機能用
 * tonalライブラリを使用して音楽理論的に正しい移調を行う
 */

import { Note, Interval, transpose as tonalTranspose } from 'tonal';
import { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { TaikoNote, ChordProgressionDataItem } from '@/components/fantasy/TaikoNoteSystem';

/**
 * 使用可能なキー（12種類）
 * CbメジャーキーやF#メジャーキーは使用しない
 */
export const AVAILABLE_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type AvailableKey = typeof AVAILABLE_KEYS[number];

/**
 * 半音数から対応するキー名を取得
 * @param semitones 半音数（0-11）
 * @param direction 移調の方向（'up' = シャープ優先、'down' = フラット優先）
 */
export function getKeyFromSemitones(semitones: number, direction: 'up' | 'down' = 'up'): AvailableKey {
  // 0-11の範囲に正規化
  const normalized = ((semitones % 12) + 12) % 12;
  
  // 方向に応じてシャープ系/フラット系を選択
  const sharpKeys: Record<number, AvailableKey> = {
    0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };
  
  return sharpKeys[normalized];
}

/**
 * キー名から半音数を取得
 * @param key キー名
 */
export function getSemitonesFromKey(key: string): number {
  const keyMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
  };
  return keyMap[key] ?? 0;
}

/**
 * 移調方向に基づいて適切な異名同音を選択
 * @param noteName 音名（オクターブなし、例: "C#", "Db"）
 * @param direction 移調の方向（正の数 = シャープ優先、負の数 = フラット優先）
 */
export function selectEnharmonicEquivalent(noteName: string, direction: number): string {
  // オクターブを分離
  const match = noteName.match(/^([A-G])(#{1,2}|b{1,2}|x)?(\d+)?$/);
  if (!match) return noteName;
  
  const [, letter, accidental, octave] = match;
  const noteWithoutOctave = `${letter}${accidental || ''}`;
  
  // MIDI番号を取得して正規化
  const parsed = Note.get(noteWithoutOctave + '4'); // オクターブはダミー
  if (parsed.empty || typeof parsed.midi !== 'number') return noteName;
  
  const midi = parsed.midi % 12;
  
  // 方向に応じた異名同音マッピング
  // direction > 0: シャープ優先（上行移調）
  // direction < 0: フラット優先（下行移調）
  // direction === 0: AVAILABLE_KEYSに基づく
  const sharpPreference: Record<number, string> = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
    6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
  };
  
  const flatPreference: Record<number, string> = {
    0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };
  
  // AVAILABLE_KEYSに合わせた標準マッピング（0移調時やニュートラル時）
  const standardPreference: Record<number, string> = {
    0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };
  
  let selectedNote: string;
  if (direction > 0) {
    selectedNote = sharpPreference[midi];
  } else if (direction < 0) {
    selectedNote = flatPreference[midi];
  } else {
    selectedNote = standardPreference[midi];
  }
  
  // オクターブがあれば付加
  return octave ? `${selectedNote}${octave}` : selectedNote;
}

/**
 * 音名を移調する（オクターブなし）
 * @param noteName 音名（例: "C", "C#", "Db"）
 * @param semitones 移調する半音数（正 = 上、負 = 下）
 */
export function transposeNoteName(noteName: string, semitones: number): string {
  if (semitones === 0) return noteName;
  
  // オクターブを保持するか確認
  const hasOctave = /\d+$/.test(noteName);
  const noteWithOctave = hasOctave ? noteName : `${noteName}4`;
  
  // tonalで移調
  const interval = Interval.fromSemitones(semitones);
  const transposed = tonalTranspose(noteWithOctave, interval);
  if (!transposed) return noteName;
  
  // 異名同音を適切に選択
  const normalized = selectEnharmonicEquivalent(transposed, semitones);
  
  // オクターブがなかった場合は除去
  if (!hasOctave) {
    return normalized.replace(/\d+$/, '');
  }
  return normalized;
}

/**
 * MIDIノート番号を移調する
 * @param midiNote MIDIノート番号
 * @param semitones 移調する半音数
 */
export function transposeMidiNote(midiNote: number, semitones: number): number {
  return midiNote + semitones;
}

/**
 * ChordDefinitionを移調する
 * @param chord コード定義
 * @param semitones 移調する半音数
 */
export function transposeChordDefinition(chord: ChordDefinition, semitones: number): ChordDefinition {
  if (semitones === 0) return chord;
  
  // ルート音を移調
  const transposedRoot = transposeNoteName(chord.root, semitones);
  
  // MIDIノートを移調
  const transposedNotes = chord.notes.map(note => transposeMidiNote(note, semitones));
  
  // 音名を移調
  const transposedNoteNames = chord.noteNames.map(name => transposeNoteName(name, semitones));
  
  // 表示名を更新（コード名を移調）
  const transposedDisplayName = transposeChordName(chord.displayName, semitones);
  
  // IDを更新（コード名を移調）
  const transposedId = transposeChordName(chord.id, semitones);
  
  return {
    ...chord,
    id: transposedId,
    root: transposedRoot,
    notes: transposedNotes,
    noteNames: transposedNoteNames,
    displayName: transposedDisplayName
  };
}

/**
 * コード名を移調する（例: "CM7" → "DbM7"）
 * @param chordName コード名
 * @param semitones 移調する半音数
 */
export function transposeChordName(chordName: string, semitones: number): string {
  if (semitones === 0) return chordName;
  
  // ルート音とサフィックスを分離
  const match = chordName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.*)$/);
  if (!match) return chordName;
  
  const [, root, suffix] = match;
  const transposedRoot = transposeNoteName(root, semitones);
  
  return `${transposedRoot}${suffix}`;
}

/**
 * TaikoNoteを移調する
 * @param note TaikoNote
 * @param semitones 移調する半音数
 */
export function transposeTaikoNote(note: TaikoNote, semitones: number): TaikoNote {
  if (semitones === 0) return note;
  
  return {
    ...note,
    chord: transposeChordDefinition(note.chord, semitones)
  };
}

/**
 * TaikoNote配列全体を移調する
 * @param notes TaikoNote配列
 * @param semitones 移調する半音数
 */
export function transposeTaikoNotes(notes: TaikoNote[], semitones: number): TaikoNote[] {
  if (semitones === 0) return notes;
  return notes.map(note => transposeTaikoNote(note, semitones));
}

/**
 * ChordProgressionDataItemを移調する
 * @param item ChordProgressionDataItem
 * @param semitones 移調する半音数
 */
export function transposeProgressionDataItem(
  item: ChordProgressionDataItem,
  semitones: number
): ChordProgressionDataItem {
  if (semitones === 0) return item;
  
  const result: ChordProgressionDataItem = {
    ...item,
    chord: item.chord ? transposeChordName(item.chord, semitones) : item.chord
  };
  
  // notesがある場合は移調
  if (item.notes && item.notes.length > 0) {
    result.notes = item.notes.map(n => transposeNoteName(n, semitones));
  }
  
  // textはコード名の場合は移調、それ以外はそのまま
  if (item.text && /^[A-G]/.test(item.text)) {
    result.text = transposeChordName(item.text, semitones);
  }
  
  // lyricDisplayもコード名の場合は移調
  if (item.lyricDisplay && /^[A-G]/.test(item.lyricDisplay)) {
    result.lyricDisplay = transposeChordName(item.lyricDisplay, semitones);
  }
  
  return result;
}

/**
 * ±6の範囲内で有効な移調値を取得
 * @param baseKey ベースキー（例: "C"）
 */
export function getValidTranspositions(baseKey: string = 'C'): Array<{
  semitones: number;
  key: AvailableKey;
  label: string;
}> {
  const baseSemitones = getSemitonesFromKey(baseKey);
  const results: Array<{ semitones: number; key: AvailableKey; label: string }> = [];
  
  for (let i = -6; i <= 6; i++) {
    const targetSemitones = (baseSemitones + i + 12) % 12;
    const key = getKeyFromSemitones(targetSemitones, i >= 0 ? 'up' : 'down');
    const label = i === 0 ? '0' : (i > 0 ? `+${i}` : `${i}`);
    results.push({ semitones: i, key, label });
  }
  
  return results;
}

/**
 * リピートごとの移調オプション
 */
export type RepeatTransposeOption = 'OFF' | '+1' | '+5';

/**
 * リピートごとの移調量を計算
 * @param option 移調オプション
 * @param currentCycle 現在のリピート回数（0始まり）
 * @param initialTranspose 初期移調量
 */
export function calculateRepeatTransposition(
  option: RepeatTransposeOption,
  currentCycle: number,
  initialTranspose: number = 0
): number {
  if (option === 'OFF') {
    return initialTranspose;
  }
  
  const increment = option === '+1' ? 1 : 5;
  const totalTranspose = initialTranspose + (increment * currentCycle);
  
  // -6から+6の範囲を超えたらループ
  // 実際には12半音で1オクターブなので、mod 12で正規化
  return ((totalTranspose % 12) + 12) % 12;
}

/**
 * 半音数からセント値を計算（Web Audio APIのdetune用）
 * @param semitones 半音数
 */
export function semitonesToCents(semitones: number): number {
  return semitones * 100;
}

/**
 * 移調設定の型定義
 */
export interface TransposeSettings {
  /** 初期移調量（-6から+6） */
  initialTranspose: number;
  /** リピートごとの移調オプション */
  repeatTransposeOption: RepeatTransposeOption;
  /** 移調機能が有効か */
  enabled: boolean;
}

/**
 * デフォルトの移調設定
 */
export const DEFAULT_TRANSPOSE_SETTINGS: TransposeSettings = {
  initialTranspose: 0,
  repeatTransposeOption: 'OFF',
  enabled: false
};
