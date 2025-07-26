/**
 * 音名表示ユーティリティ
 * UI レイヤーでの音名表示変換処理
 */

import { note as parseNote, Note } from 'tonal';

export type DisplayLang = 'en' | 'solfege';

export interface DisplayOpts {
  lang: DisplayLang;       // 表示言語
  simple: boolean;         // 簡易表記（ダブルシャープ・フラットを排除）
}

/**
 * 英語音名からドレミ（カタカナ）への変換マップ
 * ★ ダブルシャープ(x)や理論的な異名同音の表記を追加・修正
 */
const SOLFEGE_MAP: Record<string, string> = {
  // 基本音名
  'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 
  'G': 'ソ', 'A': 'ラ', 'B': 'シ',
  
  // シャープ系
  'C#': 'ド♯', 'D#': 'レ♯', 'F#': 'ファ♯', 'G#': 'ソ♯', 'A#': 'ラ♯',
  
  // フラット系
  'Db': 'レ♭', 'Eb': 'ミ♭', 'Gb': 'ソ♭', 'Ab': 'ラ♭', 'Bb': 'シ♭',
  
  // 理論的な異名同音（簡易表示OFFの時に使われる）
  'E#': 'ミ♯', 'B#': 'シ♯',
  'Fb': 'ファ♭', 'Cb': 'ド♭',

  // ダブルシャープ (## と x の両方に対応)
  'C##': 'ドx', 'D##': 'レx', 'E##': 'ミx', 'F##': 'ファx', 'G##': 'ソx', 'A##': 'ラx', 'B##': 'シx',
  'Cx': 'ドx', 'Dx': 'レx', 'Ex': 'ミx', 'Fx': 'ファx', 'Gx': 'ソx', 'Ax': 'ラx', 'Bx': 'シx',
  
  // ダブルフラット
  'Cbb': 'ド♭♭', 'Dbb': 'レ♭♭', 'Ebb': 'ミ♭♭', 'Fbb': 'ファ♭♭', 'Gbb': 'ソ♭♭', 'Abb': 'ラ♭♭', 'Bbb': 'シ♭♭'
};

/**
 * 簡易化マッピング（ダブルシャープ・フラット → 基本音名）
 */
const SIMPLIFY_MAP: Record<string, string> = {
  // 異名同音（白鍵）
  'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E',
  
  // ダブルシャープ → 基本音名
  'Cx': 'D', 'Dx': 'E', 'Ex': 'F#', 'Fx': 'G',
  'Gx': 'A', 'Ax': 'B', 'Bx': 'C#',
  
  // ダブルフラット → 基本音名
  'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb',
  'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A'
};

/**
 * 音名を表示用に変換（オクターブ情報なし）
 * ★ 簡易表示ロジックを tonal.Note.simplify() を使うように修正
 * @param noteName 元の音名（例: 'C', 'F#', 'Gbb', 'Fx4'）
 * @param opts 表示オプション
 * @returns 表示用音名（オクターブなし）
 */
export function toDisplayName(noteName: string, opts: DisplayOpts): string {
  if (!noteName) return '';
  
  // オクターブ情報などを除去した純粋な音名を取得
  let processedName = Note.get(noteName).name;

  // 簡易表記が有効な場合、tonal.Note.simplify を使用して異名同音を単純化
  if (opts.simple) {
    processedName = Note.simplify(processedName);
  }

  // ## を x に置換（表示統一のため）
  processedName = processedName.replace("##", "x");

  // 言語変換
  if (opts.lang === 'solfege') {
    return SOLFEGE_MAP[processedName] || processedName;
  }
  
  return processedName;
}

/**
 * コード名を表示用に変換
 * ★ 日本語サフィックス変換のロジックを改善
 * @param chordName コード名（例: 'CM7', 'F#m7', 'Bb7'）
 * @param opts 表示オプション
 * @returns 表示用コード名
 */
export function toDisplayChordName(chordName: string, opts: DisplayOpts): string {
  if (!chordName) return '';
  
  // ルート音とサフィックスを分離
  const match = chordName.match(/^([A-G][#bx]*)(.*)/);
  if (!match) return chordName;
  
  const [, root, suffix] = match;
  const displayRoot = toDisplayName(root, opts);
  
  let displaySuffix = suffix;

  if (opts.lang === 'solfege') {
    // 日本語表記の場合のサフィックス変換マップ
    const suffixMap: Record<string, string> = {
      'M7': 'メジャー7',
      'maj7': 'メジャー7',
      'm7': 'マイナー7',
      '7': '7', // ドミナントセブンスはそのまま「7」
      'maj': 'メジャー',
      'm': 'マイナー',
      'dim': 'ディミニッシュ',
      'aug': 'オーグメント',
      // 必要に応じて他のサフィックスも追加
    };
    displaySuffix = suffixMap[suffix] ?? suffix;
  } else {
    // 英語表記の場合、'maj' は省略することが多い
    if (suffix === 'maj') {
      displaySuffix = '';
    }
  }
  
  return displayRoot + displaySuffix;
}

/**
 * 音名配列を表示用に一括変換
 * @param noteNames 音名配列
 * @param opts 表示オプション
 * @returns 表示用音名配列
 */
export function toDisplayNames(noteNames: string[], opts: DisplayOpts): string[] {
  return noteNames.map(name => toDisplayName(name, opts));
}

/**
 * MIDIノート番号から表示用音名を取得
 * @param midi MIDIノート番号
 * @param opts 表示オプション
 * @returns 表示用音名
 */
export function midiToDisplayName(midi: number, opts: DisplayOpts): string {
  const noteName = midiToNoteName(midi);
  return toDisplayName(noteName, opts);
}

/**
 * MIDIノート番号から音名を取得（ヘルパー関数）
 * @param midi MIDIノート番号
 * @returns 音名（オクターブ付き - 内部処理用）
 */
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  // toDisplayNameで後でオクターブが削除されるため、ここでは付加する
  return noteNames[noteIndex] + octave;
}