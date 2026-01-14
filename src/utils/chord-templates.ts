/**
 * コードテンプレートシステム
 * 音楽理論的に正しい移調のためのインターバルベースのコード定義
 */

export type ChordQuality = 
  | 'maj' | 'min' | 'aug' | 'dim'
  | '7' | 'maj7' | 'm7' | 'mM7' | 'dim7' | 'aug7' | 'm7b5'
  | '6' | 'm6' | '9' | 'm9' | 'maj9' | '11' | 'm11' | '13' | 'm13'
  | 'sus2' | 'sus4' | '7sus4' | 'add9' | 'madd9'
  | 'note'; // 単音用

/**
 * 使用可能なルート音のリスト
 * 17音（黒鍵白鍵）+ 理論的な異名同音
 */
export const VALID_ROOTS = [
  // 基本の白鍵
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  // シャープ系
  'C#', 'D#', 'F#', 'G#', 'A#',
  // フラット系
  'Db', 'Eb', 'Gb', 'Ab', 'Bb',
  // 理論的な異名同音
  'Cb', 'B#', 'Fb', 'E#',
  // ダブルシャープ・ダブルフラット（必要に応じて）
  'Cx', 'Dx', 'Ex', 'Fx', 'Gx', 'Ax', 'Bx',
  'Cbb', 'Dbb', 'Ebb', 'Fbb', 'Gbb', 'Abb', 'Bbb'
];

/**
 * Cルートのコードテンプレート
 * 各コードクオリティをインターバル配列で定義
 * 実音は transpose() で都度生成する
 */
export const CHORD_TEMPLATES: Record<ChordQuality, string[]> = {
  // 単音
  'note':   ['1P'],  // 単音（ルート音のみ）
  
  // トライアド
  'maj':    ['1P', '3M', '5P'],
  'min':    ['1P', '3m', '5P'],
  'aug':    ['1P', '3M', '5A'],
  'dim':    ['1P', '3m', '5d'],
  
  // セブンス
  '7':      ['1P', '3M', '5P', '7m'],  // ドミナント7th
  'maj7':   ['1P', '3M', '5P', '7M'],
  'm7':     ['1P', '3m', '5P', '7m'],
  'mM7':    ['1P', '3m', '5P', '7M'],
  'dim7':   ['1P', '3m', '5d', '6M'],  // bb7 = 6M
  'aug7':   ['1P', '3M', '5A', '7m'],
  'm7b5':   ['1P', '3m', '5d', '7m'],  // ハーフディミニッシュ
  
  // シックスス
  '6':      ['1P', '3M', '5P', '6M'],
  'm6':     ['1P', '3m', '5P', '6M'],
  
  // ナインス
  '9':      ['1P', '3M', '5P', '7m', '9M'],
  'm9':     ['1P', '3m', '5P', '7m', '9M'],
  'maj9':   ['1P', '3M', '5P', '7M', '9M'],
  
  // エレブンス・サーティーンス
  '11':     ['1P', '3M', '5P', '7m', '9M', '11P'],
  'm11':    ['1P', '3m', '5P', '7m', '9M', '11P'],
  '13':     ['1P', '3M', '5P', '7m', '9M', '11P', '13M'],
  'm13':    ['1P', '3m', '5P', '7m', '9M', '11P', '13M'],
  
  // サスペンド・アド
  'sus2':   ['1P', '2M', '5P'],
  'sus4':   ['1P', '4P', '5P'],
  '7sus4':  ['1P', '4P', '5P', '7m'],
  'add9':   ['1P', '3M', '5P', '9M'],
  'madd9':  ['1P', '3m', '5P', '9M']
};

/**
 * コード表記のエイリアス（よく使われる別名）
 */
export const CHORD_ALIASES: Record<string, ChordQuality> = {
  '': 'maj',
  'M': 'maj',
  'm': 'min',
  'M7': 'maj7',
  'Δ7': 'maj7',
  'maj7': 'maj7',
  '-7': 'm7',
  'min7': 'm7',
  'ø': 'm7b5',
  'ø7': 'm7b5',
  'o': 'dim',
  'o7': 'dim7',
  '+': 'aug',
  '+7': 'aug7'
};

/**
 * ファンタジーモード用コードマッピング
 * 既存のコードIDとの互換性を保つ
 */
export const FANTASY_CHORD_MAP: Record<string, { root: string; quality: ChordQuality }> = {
  // メジャートライアド
  'C': { root: 'C', quality: 'maj' },
  'F': { root: 'F', quality: 'maj' },
  'G': { root: 'G', quality: 'maj' },
  
  // マイナートライアド
  'Am': { root: 'A', quality: 'min' },
  'Dm': { root: 'D', quality: 'min' },
  'Em': { root: 'E', quality: 'min' },
  
  // ドミナント7th
  'G7': { root: 'G', quality: '7' },
  'C7': { root: 'C', quality: '7' },
  'F7': { root: 'F', quality: '7' },
  'B7': { root: 'B', quality: '7' },
  'E7': { root: 'E', quality: '7' },
  'A7': { root: 'A', quality: '7' },
  'D7': { root: 'D', quality: '7' },
  
  // マイナー7th
  'Am7': { root: 'A', quality: 'm7' },
  'Dm7': { root: 'D', quality: 'm7' },
  'Em7': { root: 'E', quality: 'm7' },
  
  // メジャー7th
  'CM7': { root: 'C', quality: 'maj7' },
  'FM7': { root: 'F', quality: 'maj7' },
  'GM7': { root: 'G', quality: 'maj7' },
  
  // テンション系
  'C6': { root: 'C', quality: '6' },
  'Cm6': { root: 'C', quality: 'm6' },
  'C9': { root: 'C', quality: '9' },
  'Cm9': { root: 'C', quality: 'm9' },
  'C11': { root: 'C', quality: '11' },
  'C13': { root: 'C', quality: '13' }
};

/**
 * カタカナ音名から英語音名へのマッピング
 * 単音（type: note）入力時にカタカナドレミ表記をサポート
 */
export const SOLFEGE_TO_NOTE_MAP: Record<string, string> = {
  // 基本音名（白鍵）
  'ド': 'C',
  'レ': 'D',
  'ミ': 'E',
  'ファ': 'F',
  'ソ': 'G',
  'ラ': 'A',
  'シ': 'B',
  
  // シャープ系（♯記号）
  'ド♯': 'C#',
  'レ♯': 'D#',
  'ファ♯': 'F#',
  'ソ♯': 'G#',
  'ラ♯': 'A#',
  
  // シャープ系（#記号 - ASCII入力対応）
  'ド#': 'C#',
  'レ#': 'D#',
  'ファ#': 'F#',
  'ソ#': 'G#',
  'ラ#': 'A#',
  
  // フラット系（♭記号）
  'レ♭': 'Db',
  'ミ♭': 'Eb',
  'ソ♭': 'Gb',
  'ラ♭': 'Ab',
  'シ♭': 'Bb',
  
  // フラット系（b記号 - ASCII入力対応）
  'レb': 'Db',
  'ミb': 'Eb',
  'ソb': 'Gb',
  'ラb': 'Ab',
  'シb': 'Bb',
};

/**
 * 単音用のルート音リスト（英語表記）
 * 16種類の基本的な単音
 */
export const SINGLE_NOTE_ROOTS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'Bb', 'B'
] as const;

/**
 * 単音用のルート音リスト（カタカナ表記）
 * 16種類の基本的な単音（ドレミ表記）
 */
export const SINGLE_NOTE_ROOTS_SOLFEGE = [
  'ド', 'ド♯', 'レ♭', 'レ', 'レ♯', 'ミ♭', 'ミ', 'ファ',
  'ファ♯', 'ソ♭', 'ソ', 'ソ♯', 'ラ♭', 'ラ', 'シ♭', 'シ'
] as const;

/**
 * カタカナ音名を英語音名に変換
 * @param solfegeName カタカナ音名（例: 'ド', 'レ♯', 'ミ♭'）
 * @returns 英語音名（例: 'C', 'D#', 'Eb'）または元の値（変換不可の場合）
 */
export function solfegeToNoteName(solfegeName: string): string {
  return SOLFEGE_TO_NOTE_MAP[solfegeName] || solfegeName;
}

/**
 * 音名がカタカナ表記かどうかを判定
 * @param noteName 音名
 * @returns カタカナ表記の場合true
 */
export function isSolfegeName(noteName: string): boolean {
  return noteName in SOLFEGE_TO_NOTE_MAP;
}