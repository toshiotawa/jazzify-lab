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
 * コードテンプレート
 * 各コードIDに対してquality（種類）とintervals（インターバル配列）を定義
 * 実音は buildChordNotes() で動的に生成される
 */
export const CHORD_TEMPLATES = {
  // メジャートライアド
  'C': { quality: 'maj' as ChordQuality, intervals: ['1P', '3M', '5P'] },
  'F': { quality: 'maj' as ChordQuality, intervals: ['1P', '3M', '5P'] },
  'G': { quality: 'maj' as ChordQuality, intervals: ['1P', '3M', '5P'] },
  
  // マイナートライアド
  'Am': { quality: 'min' as ChordQuality, intervals: ['1P', '3m', '5P'] },
  'Dm': { quality: 'min' as ChordQuality, intervals: ['1P', '3m', '5P'] },
  'Em': { quality: 'min' as ChordQuality, intervals: ['1P', '3m', '5P'] },
  
  // ドミナント7th
  'G7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'C7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'F7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'B7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'E7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'A7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  'D7': { quality: '7' as ChordQuality, intervals: ['1P', '3M', '5P', '7m'] },
  
  // マイナー7th
  'Am7': { quality: 'm7' as ChordQuality, intervals: ['1P', '3m', '5P', '7m'] },
  'Dm7': { quality: 'm7' as ChordQuality, intervals: ['1P', '3m', '5P', '7m'] },
  'Em7': { quality: 'm7' as ChordQuality, intervals: ['1P', '3m', '5P', '7m'] },
  
  // メジャー7th - 正しいインターバル（7M = 長7度）を使用
  'CM7': { quality: 'maj7' as ChordQuality, intervals: ['1P', '3M', '5P', '7M'] },
  'FM7': { quality: 'maj7' as ChordQuality, intervals: ['1P', '3M', '5P', '7M'] },
  'GM7': { quality: 'maj7' as ChordQuality, intervals: ['1P', '3M', '5P', '7M'] },
  
  // テンション系
  'C6': { quality: '6' as ChordQuality, intervals: ['1P', '3M', '5P', '6M'] },
  'Cm6': { quality: 'm6' as ChordQuality, intervals: ['1P', '3m', '5P', '6M'] },
  'C9': { quality: '9' as ChordQuality, intervals: ['1P', '3M', '5P', '7m', '9M'] },
  'Cm9': { quality: 'm9' as ChordQuality, intervals: ['1P', '3m', '5P', '7m', '9M'] },
  'C11': { quality: '11' as ChordQuality, intervals: ['1P', '3M', '5P', '7m', '9M', '11P'] },
  'C13': { quality: '13' as ChordQuality, intervals: ['1P', '3M', '5P', '7m', '9M', '11P', '13M'] }
} as const;

export type ChordId = keyof typeof CHORD_TEMPLATES;

/**
 * クオリティごとのインターバル定義（汎用的な音楽理論用）
 * 既存のコードと互換性を保つために残す
 */
export const CHORD_INTERVALS: Record<ChordQuality, string[]> = {
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