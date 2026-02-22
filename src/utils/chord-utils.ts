/**
 * コードユーティリティ
 * tonal.js を使った音楽理論的に正しい移調処理
 */

import { transpose, note as parseNote, distance } from 'tonal';
import { CHORD_TEMPLATES, ChordQuality, FANTASY_CHORD_MAP, CHORD_ALIASES, INTERVAL_NAME_TO_TONAL, SCALE_TEMPLATES, ScaleType, SCALE_ALIASES } from './chord-templates';
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
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7', 'C_note'）
 * @returns { root: string, quality: ChordQuality } | null
 */
export function parseChordName(chordName: string): { root: string; quality: ChordQuality } | null {
  // FANTASY_CHORD_MAP を最優先で参照（全ルート×全クオリティを網羅）
  const mapped = FANTASY_CHORD_MAP[chordName];
  if (mapped) return { root: mapped.root, quality: mapped.quality };

  // 単音表記の確認（例: 'C_note', 'D_note'）
  if (chordName.endsWith('_note')) {
    const root = chordName.replace('_note', '');
    if (/^[A-G](?:#{1,2}|b{1,2}|x)?$/.test(root)) {
      return { root, quality: 'single' };
    }
  }
  
  // ルート音とサフィックスを分離（ダブルシャープ・ダブルフラットも対応）
  const match = chordName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.*)$/);
  if (!match) return null;
  
  const [, root, suffix] = match;
  
  // サフィックスからクオリティを判定（エイリアスも含む）
  const qualityMap: Record<string, ChordQuality> = {
    ...CHORD_ALIASES,
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
    'aug7': 'aug7',
    'sus2': 'sus2',
    'sus4': 'sus4',
    '7sus4': '7sus4',
    '6': '6',
    'm6': 'm6',
    '9': '9',
    'm9': 'm9',
    'maj9': 'maj9',
    '11': '11',
    'm11': 'm11',
    '13': '13',
    'm13': 'm13',
    'add9': 'add9',
    'madd9': 'madd9',
    'mM7': 'mM7',
    'm7b5': 'm7b5',
    // ジャズボイシング
    'M7(9)': 'maj7_9',
    'm7(9)': 'm7_9',
    '7(9.6th)': '7_9_6th',
    '7(b9.b6th)': '7_b9_b6th',
    '6(9)': '6_9',
    'm6(9)': 'm6_9',
    '7(b9.6th)': '7_b9_6th',
    '7(#9.b6th)': '7_s9_b6th',
    // 後方互換
    '7(9.13)': '7_9_6th',
    '7(b9.b13)': '7_b9_b6th',
    '7(b9.13)': '7_b9_6th',
    '7(#9.b13)': '7_s9_b6th',
    'm7(b5)(11)': 'm7b5_11',
    'dim(M7)': 'dimM7',
  };
  
  const quality = qualityMap[suffix];
  if (!quality) return null;
  
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
  
  // a) スラッシュコード対応: 分子/分母に分割（例: C/E, F/G）
  let numerator = chordId;
  if (chordId.includes('/')) {
    const parts = chordId.split('/');
    if (parts[0]) {
      numerator = parts[0];
    }
  }

  // b) まずエイリアスを考慮してパース（分子のみ）
  const parsed = parseChordName(numerator);
  if (!parsed) return null;

  // c) インターバル → 実音配列（分子から生成。分母はボイシングや判定には使わない）
  const notes = buildChordNotes(parsed.root, parsed.quality, octave);

  return {
    id: chordId, // 表示や後段処理のため、元のID（スラッシュ含む）を保持
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

/**
 * インターバル（度数）からターゲット音を解決する
 * @param root ルート音名（例: 'C', 'D#', 'Bb'）
 * @param intervalName インターバル名（例: 'm2', 'M3', 'P5'）
 * @param direction 方向（'up' or 'down'）
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns { noteName: string, midi: number } | null
 */
export function resolveInterval(
  root: string,
  intervalName: string,
  direction: 'up' | 'down',
  octave: number = 4
): { noteName: string; midi: number } | null {
  const tonalInterval = INTERVAL_NAME_TO_TONAL[intervalName];
  if (!tonalInterval) return null;

  // 方向に応じてインターバルを構成
  const effectiveInterval = direction === 'down' ? `-${tonalInterval}` : tonalInterval;

  const rootWithOctave = `${root}${octave}`;
  const result = transpose(rootWithOctave, effectiveInterval);
  if (!result) return null;

  const parsed = parseNote(result);
  if (!parsed || typeof parsed.midi !== 'number') return null;

  // オクターブを除去した音名
  const noteName = result.replace(/\d+$/, '').replace(/##/g, 'x');

  return { noteName, midi: parsed.midi };
}

/**
 * インターバル表記の表示名を生成
 * @param root ルート音名
 * @param intervalName インターバル名
 * @param direction 方向
 * @returns 表示名（例: "C m2↑", "D M3↓"）
 */
export function formatIntervalDisplayName(
  root: string,
  intervalName: string,
  direction: 'up' | 'down'
): string {
  const arrow = direction === 'up' ? '↑' : '↓';
  return `${root} ${intervalName} ${arrow}`;
}

/**
 * スケール名をパース（ルートとスケールタイプに分割）
 * @param scaleName スケール名（例: 'C major', 'C major_scale', 'D natural_minor'）
 * @returns { root: string, scaleType: ScaleType } | null
 */
export function parseScaleName(scaleName: string): { root: string; scaleType: ScaleType } | null {
  // パターン1: "C major", "C major_scale", "C メジャースケール" など
  // パターン2: "Cmajor", "C_major" など
  
  // まず、スペースやアンダースコアで分割を試みる
  const parts = scaleName.split(/[\s_]+/);
  
  if (parts.length >= 2) {
    const root = parts[0];
    const scaleNamePart = parts.slice(1).join('_').toLowerCase();
    
    // スケール名のエイリアスをチェック
    const scaleType = SCALE_ALIASES[scaleNamePart];
    if (scaleType && /^[A-G](?:#{1,2}|b{1,2}|x)?$/.test(root)) {
      return { root, scaleType };
    }
  }
  
  // パターン2: ルート音とスケール名が結合されている場合（例: "Cmajor", "Dnatural_minor"）
  const match = scaleName.match(/^([A-G](?:#{1,2}|b{1,2}|x)?)(.+)$/);
  if (match) {
    const [, root, scaleNamePart] = match;
    const normalizedScaleName = scaleNamePart.toLowerCase().replace(/[_\s]/g, '_');
    const scaleType = SCALE_ALIASES[normalizedScaleName];
    if (scaleType) {
      return { root, scaleType };
    }
  }
  
  return null;
}

/**
 * スケールから実音配列を取得（オクターブなし）
 * @param root ルート音名
 * @param scaleType スケールタイプ
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns 実音配列（音名のみ、オクターブなし）
 */
export function buildScaleNotes(root: string, scaleType: ScaleType, octave: number = 4): string[] {
  const intervals = SCALE_TEMPLATES[scaleType];
  if (!intervals) {
    console.warn(`⚠️ 未定義のスケールタイプ: ${scaleType}`);
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
 * スケールからMIDIノート番号配列を取得
 * @param root ルート音名
 * @param scaleType スケールタイプ
 * @param octave 基準オクターブ（デフォルト: 4）
 * @returns MIDIノート番号配列
 */
export function buildScaleMidiNotes(root: string, scaleType: ScaleType, octave: number = 4): number[] {
  const intervals = SCALE_TEMPLATES[scaleType];
  if (!intervals) {
    console.warn(`⚠️ 未定義のスケールタイプ: ${scaleType}`);
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