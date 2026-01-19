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
 * ★注: tonalは##形式で返すため、両方の形式をサポート
 */
const SIMPLIFY_MAP: Record<string, string> = {
  // 異名同音（白鍵）
  'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E',
  
  // ダブルシャープ → 基本音名（x形式と##形式の両方をサポート）
  'Cx': 'D', 'Dx': 'E', 'Ex': 'F#', 'Fx': 'G',
  'Gx': 'A', 'Ax': 'B', 'Bx': 'C#',
  'C##': 'D', 'D##': 'E', 'E##': 'F#', 'F##': 'G',
  'G##': 'A', 'A##': 'B', 'B##': 'C#',
  
  // ダブルフラット → 基本音名
  'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb',
  'Gbb': 'F', 'Abb': 'G', 'Bbb': 'A'
};

/**
 * 音名を表示用に変換（オクターブ情報なし）
 * ★ 簡易表示ロジックを改善
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
  
  // 簡易表記が有効な場合
  // ★修正: ダブルシャープ・ダブルフラット、理論的異名同音（B#, Cb, E#, Fb）のみを簡易化
  // 一般的なフラット系（Eb, Bb など）はそのまま保持して音楽理論的正確性を維持
  if (opts.simple && parsed.alt !== 0) {
    // ダブルシャープ・ダブルフラット（alt >= 2 or <= -2）または
    // 理論的異名同音（B#, Cb, E#, Fb）の場合のみ簡易化
    const needsSimplification = Math.abs(parsed.alt) >= 2 || SIMPLIFY_MAP[displayName];
    if (needsSimplification && SIMPLIFY_MAP[displayName]) {
      displayName = SIMPLIFY_MAP[displayName];
    }
  }
  
  // ## を x に置換（表示統一のため）
  displayName = displayName.replace("##", "x");
  
  // 言語変換
  if (opts.lang === 'solfege') {
    displayName = SOLFEGE_MAP[displayName] || displayName;
  }
  
  // オクターブ情報は付加しない
  return displayName;
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
  
  // サフィックスの表示変換
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
      'sus4': 'サス4',
      'sus2': 'サス2',
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