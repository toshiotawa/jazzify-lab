/**
 * コードユーティリティ
 * tonal.js を使った音楽理論的に正しい移調処理
 */

import { transpose, note as parseTonalNote, distance, Note } from 'tonal';
import { CHORD_TEMPLATES, ChordQuality, CHORD_ALIASES } from './chord-templates';

// +++ 新規追加: コード定義の型 +++
export interface ChordInfo {
  name: string;      // コード名 (例: "C#m7")
  root: string;      // ルート音 (例: "C#")
  quality: ChordQuality; // コードクオリティ (例: "m7")
  intervals: string[]; // インターバル配列
  notes: string[];     // 構成音 (オクターブなし)
  midi: number[];      // MIDIノート番号
}

/**
 * コード名をパースしてルートとクオリティに分割する
 * @param chordName コード名（例: "C#M7", "Fbbm7", "Gxaug")
 * @returns { root: string, quality: ChordQuality } | null
 */
export function parseChordName(chordName: string): { root: string; quality: ChordQuality } | null {
  // +++ 変更点: ダブルシャープ/フラットにも対応する正規表現 +++
  const match = chordName.match(/^([A-G](?:b{1,2}|#{1,2}|x|))(.+)?$/);
  if (!match) return null;
  
  const root = Note.simplify(match[1]); // C## を Cx に、Cbb を C## のまま扱えるように
  const suffix = match[2] || '';
  
  const quality = CHORD_ALIASES[suffix];
  if (!quality) {
    console.warn(`⚠️ 未知のコードサフィックス: ${suffix} in ${chordName}`);
    return null;
  }
  
  return { root, quality };
}

/**
 * +++ 新規追加: 中心となる新しい関数 +++
 * コード名から音楽理論的に正しい構成音を持つオブジェクトを生成する
 * @param chordName コード名 (例: "DbM7", "D#7", "A")
 * @param baseOctave 基準オクターブ (デフォルト: 4)
 * @returns {ChordInfo} | null
 */
export function getChord(chordName: string, baseOctave: number = 4): ChordInfo | null {
  const parsed = parseChordName(chordName);
  if (!parsed) {
    console.error(`❌ コードのパースに失敗: ${chordName}`);
    return null;
  }
  
  const { root, quality } = parsed;
  const intervals = CHORD_TEMPLATES[quality];
  if (!intervals) {
    console.error(`❌ 未定義のコードクオリティ: ${quality}`);
    return null;
  }
  
  const rootWithOctave = `${root}${baseOctave}`;
  
  // `tonal.transpose` を使って各構成音を算出
  // これにより "D#" の長3度は "Fx" (F##) と正しく計算される
  const notes = intervals.map(interval => {
    const noteName = transpose(rootWithOctave, interval);
    return parseTonalNote(noteName).name; // オクターブ除去
  });
  
  // MIDI番号も計算
  const midi = notes.map((noteName, index) => {
    // 各音に適切なオクターブを割り当てる
    // ルート音から順に、音程が下がらないようにオクターブを調整
    let octave = baseOctave;
    if (index > 0) {
      const prevMidi = parseTonalNote(`${notes[index - 1]}${octave}`).midi || 0;
      const currentMidi = parseTonalNote(`${noteName}${octave}`).midi || 0;
      
      // 前の音より低い場合はオクターブを上げる
      while (currentMidi < prevMidi && octave < 8) {
        octave++;
        const newMidi = parseTonalNote(`${noteName}${octave}`).midi || 0;
        if (newMidi >= prevMidi) break;
      }
    }
    
    return parseTonalNote(`${noteName}${octave}`).midi;
  }).filter(m => m != null) as number[];
  
  return {
    name: chordName,
    root,
    quality,
    intervals,
    notes,
    midi,
  };
}

/**
 * 任意ルートのコードから実音配列を取得（オクターブなし）
 * @param root ルート音名（英語表記: C, C#, Db, D#, Fx など）
 * @param quality コードクオリティ
 * @param octave 基準オクターブ（デフォルト: 4）- 内部計算用
 * @returns 実音配列（音名のみ、オクターブなし）
 */
export function buildChordNotes(root: string, quality: ChordQuality, octave: number = 4): string[] {
  const chordName = quality === 'maj' ? root : `${root}${quality}`;
  const chord = getChord(chordName, octave);
  return chord ? chord.notes : [];
}

/**
 * 任意ルートのコードからMIDIノート番号配列を取得
 * @param root ルート音名（英語表記: C, C#, Db, D#, Fx など）
 * @param quality コードクオリティ
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function buildChordMidiNotes(root: string, quality: ChordQuality, octave: number = 4): number[] {
  const chordName = quality === 'maj' ? root : `${root}${quality}`;
  const chord = getChord(chordName, octave);
  return chord ? chord.midi : [];
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
 * @deprecated 古いファンタジーモードとの互換性のための関数。新しい `getChord` の使用を推奨。
 */
export function getFantasyChordNotes(chordId: string, octave: number = 4): number[] {
  console.warn("⚠️ getFantasyChordNotes() は非推奨です。getChord() を使用してください。");
  const chord = getChord(chordId, octave);
  return chord ? chord.midi : [];
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
  const note1 = parseTonalNote(from);
  const note2 = parseTonalNote(to);
  
  if (!note1 || !note2 || 
      typeof note1.midi !== 'number' || 
      typeof note2.midi !== 'number') {
    return 0;
  }
  
  return note2.midi - note1.midi;
}