/**
 * コードユーティリティ
 * tonal.js を使った音楽理論的に正しい移調処理
 */

import { transpose, note as parseNote, distance } from 'tonal';
import { CHORD_TEMPLATES, ChordQuality, FANTASY_CHORD_MAP, CHORD_ALIASES } from './chord-templates';
import { type DisplayOpts, toDisplayChordName } from './display-note';

/**
 * 任意ルートのコードから実音配列を取得（オクターブなし）
 * @param root ルート音名（英語表記: C, C#, Db, D#, Fx など）
 * @param quality コードクオリティ
 * @param octave 基準オクターブ（デフォルト: 4）- 内部計算用
 * @returns 実音配列（音名のみ、オクターブなし）
 */
export function buildChordNotes(root: string, quality: ChordQuality, octave: number = 4): string[] {
  const intervals = CHORD_TEMPLATES[quality];
  if (!intervals) {
    console.warn(`⚠️ 未定義のコードクオリティ: ${quality}`);
    return [];
  }

  // ルートにオクターブを付加（内部計算用）
  const rootWithOctave = `${root}${octave}`;
  
  // 各インターバルを移調して実音を生成
  return intervals.map(interval => {
    const note = transpose(rootWithOctave, interval);
    if (!note) {
      console.warn(`⚠️ 移調失敗: ${rootWithOctave} + ${interval}`);
      return root;
    }
    
    // オクターブを削除して音名のみを返す
    const noteNameOnly = note.replace(/\d+$/, '');
    // ダブルシャープをxに変換（表示用）
    return noteNameOnly.replace(/##/g, 'x');
  });
}

/**
 * 任意ルートのコードからMIDIノート番号配列を取得
 * @param root ルート音名（英語表記: C, C#, Db, D#, Fx など）
 * @param quality コードクオリティ
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function buildChordMidiNotes(root: string, quality: ChordQuality, octave: number = 4): number[] {
  const intervals = CHORD_TEMPLATES[quality];
  if (!intervals) {
    console.warn(`⚠️ 未定義のコードクオリティ: ${quality}`);
    return [];
  }

  const rootWithOctave = `${root}${octave}`;
  const midiNotes: number[] = [];
  for (const interval of intervals) {
    const n = transpose(rootWithOctave, interval);
    if (!n) {
      console.warn(`⚠️ 移調失敗: ${rootWithOctave} + ${interval}`);
      continue;
    }
    const parsed = parseNote(n);
    if (parsed && typeof parsed.midi === 'number') {
      midiNotes.push(parsed.midi);
    }
  }
  return midiNotes;
}

/**
 * キーの移調（カポや移調機能用）
 * @param currentKey 現在のキー
 * @param semitones 移調する半音数
 * @returns 移調後のキー
 */
export function transposeKey(currentKey: string, semitones: number): string {
  if (semitones === 0) return currentKey;
  
  // 半音数をインターバル名に変換
  const intervalMap: Record<string, string> = {
    '1': '2m', '2': '2M', '3': '3m', '4': '3M', '5': '4P',
    '6': '4A', '7': '5P', '8': '6m', '9': '6M', '10': '7m',
    '11': '7M', '12': '8P', '-1': '-2m', '-2': '-2M', '-3': '-3m',
    '-4': '-3M', '-5': '-4P', '-6': '-4A', '-7': '-5P', '-8': '-6m',
    '-9': '-6M', '-10': '-7m', '-11': '-7M', '-12': '-8P'
  };
  
  const interval = intervalMap[semitones.toString()];
  if (!interval) {
    console.warn(`⚠️ サポートされていない移調量: ${semitones}半音`);
    return currentKey;
  }
  
  const transposed = transpose(currentKey, interval);
  if (!transposed) {
    console.warn(`⚠️ 移調失敗: ${currentKey} + ${semitones}半音`);
    return currentKey;
  }
  
  return transposed;
}

/**
 * ファンタジーモード用: 既存のコードIDから実音配列を取得
 * @param chordId 既存のコードID（例: 'CM7', 'G7', 'Am'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function getFantasyChordNotes(chordId: string, octave: number = 4): number[] {
  const mapping = FANTASY_CHORD_MAP[chordId];
  if (!mapping) {
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return [];
  }
  
  return buildChordMidiNotes(mapping.root, mapping.quality, octave);
}

/**
 * コード名のパース（ルートとクオリティに分割）
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @returns { root: string, quality: ChordQuality } | null
 */
export function parseChordName(chordName: string): { root: string; quality: ChordQuality } | null {
  // ルート音とサフィックスを分離（ダブルシャープ・ダブルフラットも対応）
  const match = chordName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.*)$/);
  if (!match) return null;
  
  const [, root, suffix] = match;
  
  // サフィックスからクオリティを判定（エイリアスも含む）
  const qualityMap: Record<string, ChordQuality> = {
    ...CHORD_ALIASES, // エイリアスを丸ごと吸収
    '': 'maj',
    'maj': 'maj',
    'm': 'min',
    'M7': 'maj7',
    'maj7': 'maj7',
    'm7': 'm7',
    '7': '7',
    'dim': 'dim',
    'dim7': 'dim7',
    'aug': 'aug',
    'sus2': 'sus2',
    'sus4': 'sus4',
    '6': '6',
    'm6': 'm6',
    '9': '9',
    'm9': 'm9',
    'maj9': 'maj9',
    '11': '11',
    '13': '13'
  };
  
  const quality = qualityMap[suffix];
  if (!quality) {
    console.warn(`⚠️ 未知のコードサフィックス: ${suffix} in ${chordName}`);
    return null;
  }
  
  return { root, quality };
}

/**
 * 任意のコードから実音配列を取得する汎用関数
 * FANTASY_CHORD_MAPを使わずに動的にコードを解決
 * @param chordId コードID（例: 'CM7', 'DbM7', 'D#7'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @param displayOpts 表示オプション
 * @returns コード情報オブジェクト | null
 */
export function resolveChord(
  chordId: string,
  octave: number = 4,
  displayOpts?: DisplayOpts
): { id: string; root: string; quality: ChordQuality; notes: string[]; displayName: string } | null {
  
  // a) まずエイリアスを考慮してパース
  const parsed = parseChordName(chordId);
  if (!parsed) return null;

  // b) インターバル → 実音配列
  const notes = buildChordNotes(parsed.root, parsed.quality, octave);

  return {
    id: chordId,
    root: parsed.root,
    quality: parsed.quality,
    notes,
    displayName: displayOpts ? toDisplayChordName(chordId, displayOpts) : chordId
  };
}

/**
 * 2つの音名間の半音数を取得
 * @param from 開始音名
 * @param to 終了音名
 * @returns 半音数（上行が正、下行が負）
 */
export function semitonesBetween(from: string, to: string): number {
  const dist = distance(from, to);
  if (!dist) return 0;
  
  // distanceの結果をsemitonesに変換
  const note1 = parseNote(from);
  const note2 = parseNote(to);
  
  if (!note1 || !note2 || 
      typeof note1.midi !== 'number' || 
      typeof note2.midi !== 'number') {
    return 0;
  }
  
  return note2.midi - note1.midi;
}