/**
 * コードユーティリティ
 * tonal.js を使った音楽理論的に正しい移調処理
 */

import { transpose, note as parseNote, distance } from 'tonal';
import { CHORD_TEMPLATES, ChordQuality, FANTASY_CHORD_MAP, CHORD_ALIASES } from './chord-templates';

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
    
    // オクターブ情報を削除して返す
    const parsed = parseNote(note);
    return parsed ? parsed.name : root;
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
  const notes = buildChordNotes(root, quality, octave);
  
  return notes.map(noteName => {
    const note = parseNote(noteName);
    if (!note || typeof note.midi !== 'number') {
      console.warn(`⚠️ MIDI変換失敗: ${noteName}`);
      return 60; // デフォルトでC4
    }
    return note.midi;
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
 * @param chordId 既存のコードID（例: 'CM7', 'G7', 'Am'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function getFantasyChordNotes(chordId: string, octave: number = 4): number[] {
  const mapping = FANTASY_CHORD_MAP[chordId];
  if (!mapping) {
    // parseChordName を使ったフォールバック処理を追加
    const parsed = parseChordName(chordId);
    if (parsed) {
      return buildChordMidiNotes(parsed.root, parsed.quality, octave);
    }
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return [];
  }
  
  return buildChordMidiNotes(mapping.root, mapping.quality, octave);
}

/**
 * コード名のパース（ルートとクオリティに分割）
 * 'C#m7' のような複雑なコード名にも対応できるよう改善
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @returns { root: string, quality: ChordQuality } | null
 */
export function parseChordName(chordName: string): { root: string; quality: ChordQuality } | null {
  // 1. ルート音を特定 (例: 'C#', 'Db', 'F', 'G')
  const rootMatch = chordName.match(/^[A-G](##?|bb?|#|b)?/);
  if (!rootMatch) {
    console.warn(`⚠️ 無効なコード名（ルートが見つかりません）: ${chordName}`);
    return null;
  }
  const root = rootMatch[0];
  const suffix = chordName.substring(root.length);

  // 2. サフィックスからクオリティを特定
  // まずエイリアスをチェック (例: 'M7' -> 'maj7')
  if (suffix in CHORD_ALIASES) {
    return { root, quality: CHORD_ALIASES[suffix] };
  }

  // 次にテンプレートのキーと直接比較 (長いものから順に)
  const qualityKeys = Object.keys(CHORD_TEMPLATES).sort((a, b) => b.length - a.length);
  const foundQuality = qualityKeys.find(key => key === suffix) as ChordQuality | undefined;

  if (foundQuality) {
    return { root, quality: foundQuality };
  }
  
  // それでも見つからなければ、エイリアスにフォールバック (例: '' -> 'maj')
  if (suffix === '') {
     return { root, quality: 'maj' };
  }

  console.warn(`⚠️ 未知のコードサフィックス: "${suffix}" in "${chordName}"`);
  return null;
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