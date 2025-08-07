/**
 * コードユーティリティ
 * tonal.js を使った音楽理論的に正しい移調処理
 */

import { transpose, note as parseNote, distance } from 'tonal';
import { CHORD_TEMPLATES, ChordQuality, FANTASY_CHORD_MAP, CHORD_ALIASES } from './chord-templates';
import { type DisplayOpts, toDisplayChordName } from './display-note';

/**
 * コードテンプレートから実音配列を生成
 * @param root ルート音（例: 'C', 'F#', 'Bb'）
 * @param quality コードの性質（例: 'maj', 'm7', '7'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @param bass ベース音（オンコードの場合）
 * @returns 音名配列（例: ['C', 'E', 'G']）
 */
export function buildChordNotes(root: string, quality: ChordQuality, octave: number = 4, bass?: string): string[] {
  const template = CHORD_TEMPLATES[quality];
  if (!template) {
    console.warn(`⚠️ 未定義のコードクオリティ: ${quality}`);
    return [];
  }
  
  // インターバルから実音に変換
  const notes = template.map(interval => {
    return transpose(root, interval);
  });
  
  // オンコードの場合、最初にベース音を追加
  if (bass) {
    // ベース音がすでにコード内にある場合は重複を避ける
    const bassIndex = notes.findIndex(note => 
      note && noteToMidi(note + octave) === noteToMidi(bass + octave)
    );
    
    if (bassIndex !== -1) {
      // ベース音がすでにある場合は、その音を最初に移動
      const [bassNote] = notes.splice(bassIndex, 1);
      return [bassNote, ...notes];
    } else {
      // ベース音がない場合は最初に追加
      return [bass, ...notes];
    }
  }
  
  return notes;
}

/**
 * コードテンプレートからMIDIノート番号配列を生成
 * @param root ルート音（例: 'C', 'F#', 'Bb'）
 * @param quality コードの性質（例: 'maj', 'm7', '7'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @param bass ベース音（オンコードの場合）
 * @returns MIDIノート番号配列
 */
export function buildChordMidiNotes(root: string, quality: ChordQuality, octave: number = 4, bass?: string): number[] {
  const notes = buildChordNotes(root, quality, octave, bass);
  
  // 音名をMIDIノート番号に変換
  return notes.map((noteName, index) => {
    // オンコードで最初の音（ベース音）の場合は、1オクターブ下げる
    const noteOctave = (bass && index === 0) ? octave - 1 : octave;
    const midi = noteToMidi(noteName + noteOctave);
    if (typeof midi !== 'number') {
      console.warn(`⚠️ MIDI変換失敗: ${noteName}${noteOctave}`);
      return 60; // デフォルトでC4
    }
    return midi;
  });
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
 * @param chordId 既存のコードID（例: 'CM7', 'G7', 'Am', 'C/E'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function getFantasyChordNotes(chordId: string, octave: number = 4): number[] {
  const mapping = FANTASY_CHORD_MAP[chordId];
  if (!mapping) {
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return [];
  }
  
  return buildChordMidiNotes(mapping.root, mapping.quality, octave, mapping.bass);
}

/**
 * コード名のパース（ルートとクオリティに分割）
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7', 'C/E', 'F/G'）
 * @returns { root: string, quality: ChordQuality, bass?: string } | null
 */
export function parseChordName(chordName: string): { root: string; quality: ChordQuality; bass?: string } | null {
  // オンコード（分数コード）の処理
  const slashIndex = chordName.indexOf('/');
  let bassNote: string | undefined;
  let mainChord = chordName;
  
  if (slashIndex !== -1) {
    mainChord = chordName.substring(0, slashIndex);
    bassNote = chordName.substring(slashIndex + 1);
    
    // ベース音の検証
    if (!bassNote.match(/^[A-G](?:#{1,2}|b{1,2}|x)?$/)) {
      console.warn(`⚠️ 無効なベース音: ${bassNote} in ${chordName}`);
      return null;
    }
  }
  
  // ルート音とサフィックスを分離（ダブルシャープ・ダブルフラットも対応）
  const match = mainChord.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.*)$/);
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
  
  return { root, quality, bass: bassNote };
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
  const notes = buildChordNotes(parsed.root, parsed.quality, octave, parsed.bass);

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