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
 */
const SOLFEGE_MAP: Record<string, string> = {
  // 基本音名
  'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 
  'G': 'ソ', 'A': 'ラ', 'B': 'シ',
  
  // シャープ系
  'C#': 'ド♯', 'D#': 'レ♯', 'E#': 'ファ', 'F#': 'ファ♯',
  'G#': 'ソ♯', 'A#': 'ラ♯', 'B#': 'ド',
  
  // フラット系
  'Cb': 'シ', 'Db': 'レ♭', 'Eb': 'ミ♭', 'Fb': 'ミ',
  'Gb': 'ソ♭', 'Ab': 'ラ♭', 'Bb': 'シ♭',
  
  // ダブルシャープ（小文字のxで統一）
  'Cx': 'レ', 'Dx': 'ミ', 'Ex': 'ファ♯', 'Fx': 'ソ',
  'Gx': 'ラ', 'Ax': 'シ', 'Bx': 'ド♯',
  
  // ダブルフラット
  'Cbb': 'シ♭', 'Dbb': 'ド', 'Ebb': 'レ', 'Fbb': 'ミ♭',
  'Gbb': 'ファ', 'Abb': 'ソ', 'Bbb': 'ラ'
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
 * @param noteName 元の音名（例: 'C', 'F#', 'Gbb', 'Fx4'）
 * @param opts 表示オプション
 * @returns 表示用音名（オクターブなし）
 */
export function toDisplayName(noteName: string, opts: DisplayOpts): string {
  if (!noteName) return '';
  
  // オクターブ情報を分離
  const parsed = parseNote(noteName);
  if (!parsed || parsed.empty) return noteName;
  
  // 音名部分を取得（オクターブなし）
  let displayName = parsed.name;
  
  // ダブルシャープを小文字のxに統一（##→x）
  displayName = displayName.replace(/##/g, 'x');
  
  // 簡易表記が有効な場合
  if (opts.simple) {
    // ダブルシャープ・ダブルフラットの場合のみ簡易化
    if (Math.abs(parsed.alt) > 1) {
      // tonal v6では、Note.enharmonic()を使用
      const enharmonicNote = Note.enharmonic(displayName);
      if (enharmonicNote && enharmonicNote !== displayName) {
        displayName = enharmonicNote;
      } else if (SIMPLIFY_MAP[displayName]) {
        // フォールバック: 手動マッピング
        displayName = SIMPLIFY_MAP[displayName];
      }
    }
  }
  
  // 言語変換
  if (opts.lang === 'solfege') {
    displayName = SOLFEGE_MAP[displayName] || displayName;
  }
  
  // オクターブ情報は付加しない
  return displayName;
}

/**
 * コード名を表示用に変換
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
  
  // ファンタジーモードでは、コードのルート音は常に英語表記
  // 構成音のみ設定に応じて変換される
  const displayRoot = root; // 英語表記のまま
  
  // サフィックスはそのまま（M7, m7, 7など）
  return displayRoot + suffix;
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