/**
 * コードテンプレートシステム
 * 音楽理論的に正しい移調のためのインターバルベースのコード定義
 */

export type ChordQuality = 
  | 'maj' | 'min' | 'aug' | 'dim'
  | '7' | 'maj7' | 'm7' | 'mM7' | 'dim7' | 'aug7' | 'm7b5'
  | '6' | 'm6' | '9' | 'm9' | 'maj9' | '11' | 'm11' | '13' | 'm13'
  | 'sus2' | 'sus4' | '7sus4' | 'add9' | 'madd9';

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
  'Db': { root: 'Db', quality: 'maj' },
  'D': { root: 'D', quality: 'maj' },
  'Eb': { root: 'Eb', quality: 'maj' },
  'E': { root: 'E', quality: 'maj' },
  'F': { root: 'F', quality: 'maj' },
  'F#': { root: 'F#', quality: 'maj' },
  'Gb': { root: 'Gb', quality: 'maj' },
  'G': { root: 'G', quality: 'maj' },
  'Ab': { root: 'Ab', quality: 'maj' },
  'A': { root: 'A', quality: 'maj' },
  'Bb': { root: 'Bb', quality: 'maj' },
  'B': { root: 'B', quality: 'maj' },
  
  // マイナートライアド
  'Cm': { root: 'C', quality: 'min' },
  'C#m': { root: 'C#', quality: 'min' },
  'Dm': { root: 'D', quality: 'min' },
  'D#m': { root: 'D#', quality: 'min' },
  'Ebm': { root: 'Eb', quality: 'min' },
  'Em': { root: 'E', quality: 'min' },
  'Fm': { root: 'F', quality: 'min' },
  'F#m': { root: 'F#', quality: 'min' },
  'Gm': { root: 'G', quality: 'min' },
  'G#m': { root: 'G#', quality: 'min' },
  'Am': { root: 'A', quality: 'min' },
  'Bbm': { root: 'Bb', quality: 'min' },
  'Bm': { root: 'B', quality: 'min' },
  
  // ドミナント7th
  'C7': { root: 'C', quality: '7' },
  'C#7': { root: 'C#', quality: '7' },
  'Db7': { root: 'Db', quality: '7' },
  'D7': { root: 'D', quality: '7' },
  'D#7': { root: 'D#', quality: '7' },
  'Eb7': { root: 'Eb', quality: '7' },
  'E7': { root: 'E', quality: '7' },
  'F7': { root: 'F', quality: '7' },
  'F#7': { root: 'F#', quality: '7' },
  'Gb7': { root: 'Gb', quality: '7' },
  'G7': { root: 'G', quality: '7' },
  'G#7': { root: 'G#', quality: '7' },
  'Ab7': { root: 'Ab', quality: '7' },
  'A7': { root: 'A', quality: '7' },
  'A#7': { root: 'A#', quality: '7' },
  'Bb7': { root: 'Bb', quality: '7' },
  'B7': { root: 'B', quality: '7' },
  
  // マイナー7th
  'Cm7': { root: 'C', quality: 'm7' },
  'C#m7': { root: 'C#', quality: 'm7' },
  'Dm7': { root: 'D', quality: 'm7' },
  'D#m7': { root: 'D#', quality: 'm7' },
  'Em7': { root: 'E', quality: 'm7' },
  'Fm7': { root: 'F', quality: 'm7' },
  'F#m7': { root: 'F#', quality: 'm7' },
  'Gm7': { root: 'G', quality: 'm7' },
  'G#m7': { root: 'G#', quality: 'm7' },
  'Am7': { root: 'A', quality: 'm7' },
  'Bbm7': { root: 'Bb', quality: 'm7' },
  'Bm7': { root: 'B', quality: 'm7' },
  
  // メジャー7th
  'CM7': { root: 'C', quality: 'maj7' },
  'DbM7': { root: 'Db', quality: 'maj7' },
  'DM7': { root: 'D', quality: 'maj7' },
  'EbM7': { root: 'Eb', quality: 'maj7' },
  'EM7': { root: 'E', quality: 'maj7' },
  'FM7': { root: 'F', quality: 'maj7' },
  'F#M7': { root: 'F#', quality: 'maj7' },
  'GbM7': { root: 'Gb', quality: 'maj7' },
  'GM7': { root: 'G', quality: 'maj7' },
  'AbM7': { root: 'Ab', quality: 'maj7' },
  'AM7': { root: 'A', quality: 'maj7' },
  'BbM7': { root: 'Bb', quality: 'maj7' },
  'BM7': { root: 'B', quality: 'maj7' },
  
  // テンション系
  'C6': { root: 'C', quality: '6' },
  'Cm6': { root: 'C', quality: 'm6' },
  'C9': { root: 'C', quality: '9' },
  'Cm9': { root: 'C', quality: 'm9' },
  'C11': { root: 'C', quality: '11' },
  'C13': { root: 'C', quality: '13' }
};