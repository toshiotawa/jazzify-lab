/**
 * 移調ユーティリティ
 * ファンタジーモードのTimingモードで使用
 */

import { transpose as tonalTranspose, note as parseNote, Chord, Note } from 'tonal';

/**
 * 許可されるキー（12種類）
 * CbメジャーキーやF#メジャーキーが登場しないように選択
 */
export const ALLOWED_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type AllowedKey = typeof ALLOWED_KEYS[number];

/**
 * キー変更オプション
 */
export type KeyChangeOption = 'OFF' | '+1' | '+5';

/**
 * 半音数からキー名を取得（基準キーからの移調）
 * @param baseKey 基準キー（例: 'C'）
 * @param semitones 半音数（-6〜+6）
 * @returns 移調後のキー名
 */
export function getKeyFromSemitones(baseKey: AllowedKey, semitones: number): AllowedKey {
  const baseIndex = ALLOWED_KEYS.indexOf(baseKey);
  if (baseIndex === -1) return 'C';
  
  // 半音数を正規化（0〜11の範囲に）
  let newIndex = (baseIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return ALLOWED_KEYS[newIndex];
}

/**
 * キー間の半音差を計算
 * @param fromKey 元のキー
 * @param toKey 移調先のキー
 * @returns 半音数
 */
export function getSemitonesBetweenKeys(fromKey: AllowedKey, toKey: AllowedKey): number {
  const fromIndex = ALLOWED_KEYS.indexOf(fromKey);
  const toIndex = ALLOWED_KEYS.indexOf(toKey);
  if (fromIndex === -1 || toIndex === -1) return 0;
  
  let diff = toIndex - fromIndex;
  // -6〜+5の範囲に正規化（最短距離）
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  
  return diff;
}

/**
 * 音名を移調
 * @param noteName 元の音名（例: 'C', 'F#', 'Bb'）
 * @param semitones 半音数
 * @returns 移調後の音名
 */
export function transposeNoteName(noteName: string, semitones: number): string {
  if (semitones === 0) return noteName;
  
  // オクターブ付きの場合とそうでない場合を分離
  const match = noteName.match(/^([A-G][#bx]*)?(\d+)?$/i);
  if (!match) return noteName;
  
  const pitchClass = match[1] || noteName;
  const octave = match[2];
  
  // 移調（オクターブ4を仮定して計算）
  const transposed = tonalTranspose(`${pitchClass}4`, `${semitones > 0 ? '+' : ''}${semitones}P1`);
  
  if (!transposed) return noteName;
  
  // 結果から音名を抽出
  const resultNote = parseNote(transposed);
  if (!resultNote.pc) return noteName;
  
  // エンハーモニック変換（理論的に正しいキーに変換）
  const normalizedPc = normalizeEnharmonic(resultNote.pc);
  
  return octave ? `${normalizedPc}${octave}` : normalizedPc;
}

/**
 * コード名を移調
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @param semitones 半音数
 * @returns 移調後のコード名
 */
export function transposeChordName(chordName: string, semitones: number): string {
  if (semitones === 0) return chordName;
  
  // スラッシュコードの分割
  const slashIndex = chordName.indexOf('/');
  if (slashIndex !== -1) {
    const [chordPart, bassPart] = chordName.split('/');
    const transposedChord = transposeChordName(chordPart, semitones);
    const transposedBass = transposeNoteName(bassPart, semitones);
    return `${transposedChord}/${transposedBass}`;
  }
  
  // ルート音と品質を分離
  const chordInfo = Chord.get(chordName);
  if (!chordInfo.tonic) {
    // パースできない場合は単純に音名部分だけ移調を試みる
    const rootMatch = chordName.match(/^([A-G][#bx]*)/i);
    if (rootMatch) {
      const root = rootMatch[1];
      const quality = chordName.slice(root.length);
      const transposedRoot = transposeNoteName(root, semitones);
      return `${transposedRoot}${quality}`;
    }
    return chordName;
  }
  
  // ルート音を移調
  const transposedRoot = transposeNoteName(chordInfo.tonic, semitones);
  
  // 品質部分を取得
  const quality = chordName.slice(chordInfo.tonic.length);
  
  return `${transposedRoot}${quality}`;
}

/**
 * MIDIノート番号を移調
 * @param midiNote MIDIノート番号
 * @param semitones 半音数
 * @returns 移調後のMIDIノート番号
 */
export function transposeMidiNote(midiNote: number, semitones: number): number {
  return midiNote + semitones;
}

/**
 * MIDIノート番号の配列を移調
 * @param midiNotes MIDIノート番号の配列
 * @param semitones 半音数
 * @returns 移調後のMIDIノート番号の配列
 */
export function transposeMidiNotes(midiNotes: number[], semitones: number): number[] {
  return midiNotes.map(note => transposeMidiNote(note, semitones));
}

/**
 * エンハーモニック変換（理論的に正しい音名に変換）
 * CbメジャーキーやF#メジャーキーを避けるため
 */
function normalizeEnharmonic(noteName: string): string {
  const enharmonicMap: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb',
    'E#': 'F',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
    'B#': 'C',
    'Cb': 'B',
    'Db': 'Db',
    'Eb': 'Eb',
    'Fb': 'E',
    'Gb': 'Gb',
    'Ab': 'Ab',
    'Bb': 'Bb',
    // ダブルシャープ/フラット
    'C##': 'D',
    'D##': 'E',
    'E##': 'F#',
    'F##': 'G',
    'G##': 'A',
    'A##': 'B',
    'B##': 'C#',
    'Cbb': 'Bb',
    'Dbb': 'C',
    'Ebb': 'D',
    'Fbb': 'Eb',
    'Gbb': 'F',
    'Abb': 'G',
    'Bbb': 'A',
  };
  
  return enharmonicMap[noteName] || noteName;
}

/**
 * キー変更オプションから次の半音数を計算
 * @param currentSemitones 現在の半音数
 * @param option キー変更オプション
 * @returns 次の半音数
 */
export function getNextTransposeSemitones(currentSemitones: number, option: KeyChangeOption): number {
  switch (option) {
    case 'OFF':
      return currentSemitones;
    case '+1':
      // +6まで行ったら-6に戻る
      let next1 = currentSemitones + 1;
      if (next1 > 6) next1 = -5;
      return next1;
    case '+5':
      // 5度圏で移動
      let next5 = currentSemitones + 5;
      if (next5 > 6) next5 -= 12;
      return next5;
    default:
      return currentSemitones;
  }
}

/**
 * 移調量の表示用文字列を取得
 * @param semitones 半音数
 * @returns 表示用文字列（例: "+3", "-2", "0"）
 */
export function formatTransposeSemitones(semitones: number): string {
  if (semitones > 0) return `+${semitones}`;
  return String(semitones);
}

/**
 * キー名と移調量から表示用文字列を取得
 * @param baseKey 基準キー
 * @param semitones 半音数
 * @returns 表示用文字列（例: "C → Eb (+3)"）
 */
export function formatKeyChange(baseKey: AllowedKey, semitones: number): string {
  const newKey = getKeyFromSemitones(baseKey, semitones);
  const semitonesStr = formatTransposeSemitones(semitones);
  return `${baseKey} → ${newKey} (${semitonesStr})`;
}

/**
 * ChordProgressionDataItem を移調
 */
export interface TransposableChordItem {
  chord: string;
  notes?: string[];
  lyricDisplay?: string;
  text?: string;
}

export function transposeChordProgressionItem<T extends TransposableChordItem>(
  item: T,
  semitones: number
): T {
  if (semitones === 0) return item;
  
  const transposed = { ...item };
  
  // コード名を移調
  if (transposed.chord) {
    transposed.chord = transposeChordName(transposed.chord, semitones);
  }
  
  // notes配列を移調
  if (transposed.notes && Array.isArray(transposed.notes)) {
    transposed.notes = transposed.notes.map(note => transposeNoteName(note, semitones));
  }
  
  // lyricDisplayを移調（音名の場合）
  if (transposed.lyricDisplay) {
    // 単純な音名かどうかチェック
    const isSimpleNote = /^[A-G][#bx]*\d*$/.test(transposed.lyricDisplay);
    if (isSimpleNote) {
      transposed.lyricDisplay = transposeNoteName(transposed.lyricDisplay, semitones);
    }
  }
  
  return transposed;
}

/**
 * ChordDefinition を移調
 */
export interface TransposableChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

export function transposeChordDefinition<T extends TransposableChordDefinition>(
  chord: T,
  semitones: number
): T {
  if (semitones === 0) return chord;
  
  return {
    ...chord,
    id: transposeChordName(chord.id, semitones),
    displayName: transposeChordName(chord.displayName, semitones),
    notes: transposeMidiNotes(chord.notes, semitones),
    noteNames: chord.noteNames.map(name => transposeNoteName(name, semitones)),
    root: transposeNoteName(chord.root, semitones),
  };
}
