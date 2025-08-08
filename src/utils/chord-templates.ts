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
  
  // シックス
  '6':      ['1P', '3M', '5P', '6M'],
  'm6':     ['1P', '3m', '5P', '6M'],
  
  // ナインス
  '9':      ['1P', '3M', '5P', '7m', '9M'],
  'm9':     ['1P', '3m', '5P', '7m', '9M'],
  'maj9':   ['1P', '3M', '5P', '7M', '9M'],
  
  // イレブンス
  '11':     ['1P', '3M', '5P', '7m', '9M', '11P'],
  'm11':    ['1P', '3m', '5P', '7m', '9M', '11P'],
  
  // サーティーンス
  '13':     ['1P', '3M', '5P', '7m', '9M', '11P', '13M'],
  'm13':    ['1P', '3m', '5P', '7m', '9M', '11P', '13M'],
  
  // サスペンド
  'sus2':   ['1P', '2M', '5P'],
  'sus4':   ['1P', '4P', '5P'],
  '7sus4':  ['1P', '4P', '5P', '7m'],
  
  // アドナインス
  'add9':   ['1P', '3M', '5P', '9M'],
  'madd9':  ['1P', '3m', '5P', '9M']
};

// 転回形のテンプレートを追加
export const CHORD_INVERSIONS: Record<string, string[]> = {
  // メジャートライアドの転回形
  'maj(A)':  ['3M', '5P', '8P'],      // 第1転回形（Aフォーム）
  'maj(B)':  ['5P', '8P', '10M'],     // 第2転回形（Bフォーム）
  
  // マイナートライアドの転回形
  'min(A)':  ['3m', '5P', '8P'],      // 第1転回形
  'min(B)':  ['5P', '8P', '10m'],     // 第2転回形
  
  // セブンスコードの転回形
  '7(A)':    ['3M', '5P', '7m', '8P'],     // 第1転回形
  '7(B)':    ['5P', '7m', '8P', '10M'],    // 第2転回形
  '7(C)':    ['7m', '8P', '10M', '12P'],   // 第3転回形
  
  'maj7(A)': ['3M', '5P', '7M', '8P'],     // 第1転回形
  'maj7(B)': ['5P', '7M', '8P', '10M'],    // 第2転回形
  'maj7(C)': ['7M', '8P', '10M', '12P'],   // 第3転回形
  
  'm7(A)':   ['3m', '5P', '7m', '8P'],     // 第1転回形
  'm7(B)':   ['5P', '7m', '8P', '10m'],    // 第2転回形
  'm7(C)':   ['7m', '8P', '10m', '12P']    // 第3転回形
};

// ChordQualityタイプを拡張して転回形も含める
export type ChordQualityWithInversion = ChordQuality | keyof typeof CHORD_INVERSIONS;

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

// 転回形対応のFANTASY_CHORD_MAPを追加
export const FANTASY_CHORD_MAP_WITH_INVERSIONS: Record<string, { root: string; quality: ChordQualityWithInversion }> = {
  // 既存のコードをすべて含む
  ...Object.entries(FANTASY_CHORD_MAP).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value
  }), {}),
  
  // メジャートライアドの転回形
  'C(A)': { root: 'C', quality: 'maj(A)' },
  'C(B)': { root: 'C', quality: 'maj(B)' },
  'F(A)': { root: 'F', quality: 'maj(A)' },
  'F(B)': { root: 'F', quality: 'maj(B)' },
  'G(A)': { root: 'G', quality: 'maj(A)' },
  'G(B)': { root: 'G', quality: 'maj(B)' },
  
  // マイナートライアドの転回形
  'Am(A)': { root: 'A', quality: 'min(A)' },
  'Am(B)': { root: 'A', quality: 'min(B)' },
  'Dm(A)': { root: 'D', quality: 'min(A)' },
  'Dm(B)': { root: 'D', quality: 'min(B)' },
  'Em(A)': { root: 'E', quality: 'min(A)' },
  'Em(B)': { root: 'E', quality: 'min(B)' },
  
  // ドミナント7thの転回形
  'G7(A)': { root: 'G', quality: '7(A)' },
  'G7(B)': { root: 'G', quality: '7(B)' },
  'G7(C)': { root: 'G', quality: '7(C)' },
  'C7(A)': { root: 'C', quality: '7(A)' },
  'C7(B)': { root: 'C', quality: '7(B)' },
  'C7(C)': { root: 'C', quality: '7(C)' },
  
  // メジャー7thの転回形
  'CM7(A)': { root: 'C', quality: 'maj7(A)' },
  'CM7(B)': { root: 'C', quality: 'maj7(B)' },
  'CM7(C)': { root: 'C', quality: 'maj7(C)' },
  'FM7(A)': { root: 'F', quality: 'maj7(A)' },
  'FM7(B)': { root: 'F', quality: 'maj7(B)' },
  'FM7(C)': { root: 'F', quality: 'maj7(C)' }
};